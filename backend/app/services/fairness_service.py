"""
Fairness and Algorithmic Bias Audit Service.
Computes disparate impact ratio against the four-fifths (0.80) rule
across protected demographic attributes (Gender, Age Band, Marital Status, Department).
Protected attributes are strictly used for auditing and evaluation, never as model inputs.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional


class FairnessAuditService:
    def __init__(self, analytics_service=None):
        self.analytics_service = analytics_service

    def _get_df(self, custom_df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        if custom_df is not None:
            df = custom_df.copy()
        elif self.analytics_service is not None and self.analytics_service.df_enriched is not None:
            df = self.analytics_service.df_enriched.copy()
        else:
            return pd.DataFrame()

        # Create AgeBand if Age is present
        if 'Age' in df.columns and 'AgeBand' not in df.columns:
            bins = [17, 29, 39, 49, 100]
            labels = ['Under 30', '30-39', '40-49', '50+']
            df['AgeBand'] = pd.cut(df['Age'], bins=bins, labels=labels)

        return df

    def compute_fairness_audit(
        self,
        custom_df: Optional[pd.DataFrame] = None,
        min_sample_size: int = 10,
        favorable_tier: str = "Standard"  # Lower risk is favorable for employees
    ) -> Dict[str, Any]:
        """
        Computes disparate impact ratio across available demographic attributes.
        Four-Fifths Rule (EEOC): Disparate impact is flagged when selection rate
        of a group is < 80% (0.80) of the most favored group's selection rate.
        Suppresses groups with n < min_sample_size.
        """
        df = self._get_df(custom_df)
        if df.empty:
            return {"error": "No workforce data available for audit"}

        potential_attributes = ['Gender', 'AgeBand', 'MaritalStatus', 'Department']
        audit_attributes = [col for col in potential_attributes if col in df.columns]

        total_workforce = len(df)
        attribute_results = {}
        flagged_disparities = []
        flagged_eod_disparities = []

        priority_col = 'RetentionPriority'
        if priority_col not in df.columns:
            return {"error": "RetentionPriority column not present in dataset"}

        # Check for attrition/exit labels for Equal Opportunity Difference
        exit_col = None
        for cand in ['Attrition', 'exited', 'Exited', 'attrition', 'IsTerminated', 'Terminated']:
            if cand in df.columns:
                exit_col = cand
                break

        if exit_col:
            if df[exit_col].dtype == object or isinstance(df[exit_col].iloc[0], str):
                df['_is_exit'] = df[exit_col].astype(str).str.strip().str.lower().isin(['yes', '1', 'true', 'attrited', 'terminated'])
            else:
                df['_is_exit'] = (df[exit_col] == 1)
        else:
            df['_is_exit'] = False

        for attr in audit_attributes:
            groups_data = []
            grouped = df.groupby(attr, observed=False)

            favorable_rates = {}
            tpr_rates = {}

            # Pass 1: compute rates for groups meeting sample size threshold
            for group_name, group_df in grouped:
                n = len(group_df)
                if n < min_sample_size:
                    # Suppress small groups
                    groups_data.append({
                        "group": str(group_name),
                        "sample_size": n,
                        "suppressed": True,
                        "reason": f"Sample size n={n} < {min_sample_size} threshold",
                        "disparate_impact_ratio": None,
                        "four_fifths_flag": False,
                        "true_positive_rate": None,
                        "equal_opportunity_diff": None,
                        "eod_flag": False
                    })
                    continue

                urgent_count = int((group_df[priority_col] == 'Urgent').sum())
                moderate_count = int((group_df[priority_col] == 'Moderate').sum())
                standard_count = int((group_df[priority_col] == 'Standard').sum())

                # Favorable rate: proportion of group in Standard (safe) tier vs Urgent/Moderate
                favorable_count = standard_count
                favorable_rate = favorable_count / n
                favorable_rates[str(group_name)] = favorable_rate

                # Equal Opportunity TPR calculation (True Positive Rate on historical departures)
                group_exits = int(group_df['_is_exit'].sum()) if exit_col else 0
                tp_count = int(((group_df['_is_exit']) & (group_df[priority_col] == 'Urgent')).sum()) if exit_col else 0
                tpr = round(tp_count / group_exits, 4) if (exit_col and group_exits >= 3) else None
                if tpr is not None:
                    tpr_rates[str(group_name)] = tpr

                groups_data.append({
                    "group": str(group_name),
                    "sample_size": n,
                    "suppressed": False,
                    "tier_distribution": {
                        "urgent": urgent_count,
                        "urgent_pct": round(urgent_count / n * 100, 1),
                        "moderate": moderate_count,
                        "moderate_pct": round(moderate_count / n * 100, 1),
                        "standard": standard_count,
                        "standard_pct": round(standard_count / n * 100, 1),
                    },
                    "favorable_rate": round(favorable_rate, 4),
                    "exits_count": group_exits if exit_col else None,
                    "true_positives": tp_count if exit_col else None,
                    "true_positive_rate": tpr
                })

            # Pass 2: calculate disparate impact ratio vs most favored group
            if favorable_rates:
                max_rate = max(favorable_rates.values())
                most_favored_group = [g for g, r in favorable_rates.items() if r == max_rate][0]

                # Equal opportunity benchmark: group with highest TPR
                benchmark_tpr = max(tpr_rates.values()) if tpr_rates else None
                benchmark_tpr_group = [g for g, r in tpr_rates.items() if r == benchmark_tpr][0] if tpr_rates else None

                for item in groups_data:
                    if item.get("suppressed"):
                        continue

                    g_rate = item["favorable_rate"]
                    ratio = round(g_rate / max_rate, 3) if max_rate > 0 else 1.0
                    item["disparate_impact_ratio"] = ratio
                    item["benchmark_group"] = most_favored_group
                    is_flagged = ratio < 0.80
                    item["four_fifths_flag"] = is_flagged
                    if is_flagged:
                        flagged_disparities.append({
                            "attribute": attr,
                            "affected_group": item["group"],
                            "benchmark_group": most_favored_group,
                            "ratio": ratio,
                            "favorable_rate": round(g_rate * 100, 1),
                            "benchmark_rate": round(max_rate * 100, 1),
                            "sample_size": item["sample_size"]
                        })

                    # Equal Opportunity Difference vs benchmark
                    g_tpr = item.get("true_positive_rate")
                    if g_tpr is not None and benchmark_tpr is not None:
                        eod = round(g_tpr - benchmark_tpr, 4)
                        item["equal_opportunity_diff"] = eod
                        item["eod_benchmark_group"] = benchmark_tpr_group
                        is_eod_flag = abs(eod) > 0.15
                        item["eod_flag"] = is_eod_flag
                        if is_eod_flag:
                            flagged_eod_disparities.append({
                                "attribute": attr,
                                "affected_group": item["group"],
                                "benchmark_group": benchmark_tpr_group,
                                "eod": eod,
                                "tpr": round(g_tpr * 100, 1),
                                "benchmark_tpr": round(benchmark_tpr * 100, 1),
                                "sample_size": item["sample_size"]
                            })
                    else:
                        item["equal_opportunity_diff"] = None
                        item["eod_flag"] = False

            attribute_results[attr] = {
                "attribute": attr,
                "groups": groups_data,
                "most_favored_group": most_favored_group if favorable_rates else None,
                "has_violations": any(g.get("four_fifths_flag", False) for g in groups_data if not g.get("suppressed")),
                "has_eod_violations": any(g.get("eod_flag", False) for g in groups_data if not g.get("suppressed")),
                "equal_opportunity_evaluated": exit_col is not None
            }

        return {
            "total_records_audited": total_workforce,
            "min_sample_size_threshold": min_sample_size,
            "overall_status": "FLAGGED_DISPARITIES_DETECTED" if flagged_disparities else "COMPLIANT_FOUR_FIFTHS",
            "total_flags": len(flagged_disparities),
            "flagged_disparities": flagged_disparities,
            "equal_opportunity_status": "FLAGGED_EOD_DISPARITY" if flagged_eod_disparities else "EQUAL_OPPORTUNITY_MET",
            "total_eod_flags": len(flagged_eod_disparities),
            "flagged_eod_disparities": flagged_eod_disparities,
            "attributes": attribute_results,
            "legal_notice": (
                "DISCLAIMER: Protected demographic attributes (Gender, Age, Marital Status) are strictly prohibited "
                "from being used as model training features, scoring weights, or recommendation triggers. They are "
                "evaluated exclusively within this post-hoc audit module to ensure the Four-Fifths Disparate Impact "
                "standard (EEOC Uniform Guidelines on Employee Selection Procedures) and Equal Opportunity Difference "
                "standards are rigorously maintained."
            )
        }
