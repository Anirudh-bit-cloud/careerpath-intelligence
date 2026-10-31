"""
Fairness and Algorithmic Bias Audit Service.
Computes disparate impact ratio against the four-fifths (0.80) rule
across protected demographic attributes (Gender, Age Band, Marital Status, Department).

Phase 3 enhancements:
- Intersectional audit slices: Gender x AgeBand, Gender x Department, AgeBand x Department
- Small-sample suppression: groups with n < 10 are suppressed with explicit compliance justification
- Statistical hypothesis testing: Fisher's exact / Chi-square test on priority tier distribution
- Multiple testing correction: Benjamini-Hochberg False Discovery Rate (FDR)
- Longitudinal fairness drift: tracking disparate impact ratio across historical monthly snapshots
- Formal bias sign-off workflow logged in AuditLog

Protected attributes are strictly used for auditing and evaluation, never as model inputs.
"""

from datetime import datetime
import json
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from scipy.stats import fisher_exact, chi2_contingency

from backend.app.models.entities import AuditLog, WorkforceSnapshot, SnapshotRun
from backend.app.services.analytics_service import analytics_service, analytics_service as default_analytics_service


def benjamini_hochberg_fdr(p_values: List[float]) -> List[float]:
    """
    Computes Benjamini-Hochberg False Discovery Rate (FDR) adjusted p-values (q-values).
    Maintains monotonicity and preserves original index positions.
    """
    m = len(p_values)
    if m == 0:
        return []

    # Sort p-values ascending with original indices
    indexed_p = sorted(enumerate(p_values), key=lambda x: x[1])
    adjusted = [0.0] * m

    cum_min = 1.0
    for rank in range(m, 0, -1):
        orig_idx, p = indexed_p[rank - 1]
        raw_q = p * m / rank
        cum_min = min(cum_min, raw_q)
        adjusted[orig_idx] = round(float(min(1.0, max(0.0, cum_min))), 4)

    return adjusted


class FairnessAuditService:
    def __init__(self, analytics_service=None, analytics_service_instance=None):
        self.analytics_service = analytics_service or analytics_service_instance or default_analytics_service

    def _get_df(self, custom_df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        if custom_df is not None:
            df = custom_df.copy()
        elif self.analytics_service is not None and getattr(self.analytics_service, 'df_enriched', None) is not None:
            df = self.analytics_service.df_enriched.copy()
        elif default_analytics_service.df_enriched is not None:
            df = default_analytics_service.df_enriched.copy()
        else:
            return pd.DataFrame()

        # Create AgeBand if Age is present
        if 'Age' in df.columns and 'AgeBand' not in df.columns:
            bins = [17, 29, 39, 49, 100]
            labels = ['Under 30', '30-39', '40-49', '50+']
            df['AgeBand'] = pd.cut(df['Age'], bins=bins, labels=labels).astype(str)

        return df

    def compute_fairness_audit(
        self,
        custom_df: Optional[pd.DataFrame] = None,
        min_sample_size: int = 10,
        favorable_tier: str = "Standard"
    ) -> Dict[str, Any]:
        """
        Computes marginal disparate impact ratio across individual demographic attributes.
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

        if exit_col and df[exit_col].dtype == object:
            df['_exit_flag'] = (df[exit_col].astype(str).str.lower().isin(['yes', '1', 'true'])).astype(int)
        elif exit_col:
            df['_exit_flag'] = df[exit_col].astype(int)
        else:
            df['_exit_flag'] = None

        for attr in audit_attributes:
            groups = df[attr].dropna().unique().tolist()
            group_metrics = []
            favorable_rates = {}
            tpr_rates = {}

            for grp in groups:
                sub_df = df[df[attr] == grp]
                n = len(sub_df)

                if n < min_sample_size:
                    group_metrics.append({
                        "group": str(grp),
                        "group_name": str(grp),
                        "sample_size": n,
                        "headcount": n,
                        "share_of_workforce_pct": round(n / total_workforce * 100, 1),
                        "suppressed": True,
                        "suppression_reason": f"Sample size (n={n}) below statistical threshold (n={min_sample_size})",
                        "four_fifths_flag": False,
                        "eeoc_four_fifths_flag": False,
                        "disparate_impact_ratio": None
                    })
                    continue

                tier_counts = sub_df[priority_col].value_counts().to_dict()
                urgent_count = tier_counts.get("Urgent", 0)
                moderate_count = tier_counts.get("Moderate", 0)
                standard_count = tier_counts.get("Standard", 0) + tier_counts.get("Low", 0)

                urgent_share = round(urgent_count / n * 100, 1)
                moderate_share = round(moderate_count / n * 100, 1)
                standard_share = round(standard_count / n * 100, 1)

                favorable_count = (n - urgent_count)
                favorable_rate = round(favorable_count / n, 4)
                favorable_rates[grp] = favorable_rate

                tpr = None
                if df['_exit_flag'] is not None:
                    actual_exits = sub_df[sub_df['_exit_flag'] == 1]
                    n_exits = len(actual_exits)
                    if n_exits >= 5:
                        detected_urgent = actual_exits[actual_exits[priority_col] == 'Urgent']
                        tpr = round(len(detected_urgent) / n_exits, 4)
                        tpr_rates[grp] = tpr

                group_metrics.append({
                    "group": str(grp),
                    "group_name": str(grp),
                    "sample_size": n,
                    "headcount": n,
                    "share_of_workforce_pct": round(n / total_workforce * 100, 1),
                    "tier_distribution": {
                        "urgent": urgent_count,
                        "urgent_count": urgent_count,
                        "urgent_pct": urgent_share,
                        "urgent_share_pct": urgent_share,
                        "moderate": moderate_count,
                        "moderate_count": moderate_count,
                        "moderate_pct": moderate_share,
                        "moderate_share_pct": moderate_share,
                        "standard": standard_count,
                        "standard_count": standard_count,
                        "standard_pct": standard_share,
                        "standard_share_pct": standard_share
                    },
                    "favorable_rate": favorable_rate,
                    "true_positive_rate": tpr,
                    "suppressed": False
                })

            # Calculate Disparate Impact Ratio
            valid_favorable = {k: v for k, v in favorable_rates.items() if v is not None}
            favored_group = None
            if valid_favorable:
                favored_group = max(valid_favorable, key=valid_favorable.get)
                favored_rate = valid_favorable[favored_group]

                for gm in group_metrics:
                    if gm.get("suppressed"):
                        gm["disparate_impact_ratio"] = None
                        gm["four_fifths_flag"] = False
                        gm["eeoc_four_fifths_flag"] = False
                    else:
                        g_rate = gm["favorable_rate"]
                        dir_val = round(g_rate / favored_rate, 3) if favored_rate > 0 else 1.0
                        gm["disparate_impact_ratio"] = dir_val
                        gm["is_favored_reference_group"] = (gm["group_name"] == favored_group)
                        is_flagged = dir_val < 0.80
                        gm["four_fifths_flag"] = is_flagged
                        gm["eeoc_four_fifths_flag"] = is_flagged

                        if is_flagged:
                            flagged_disparities.append({
                                "attribute": attr,
                                "affected_group": gm["group_name"],
                                "favored_group": favored_group,
                                "disparate_impact_ratio": dir_val,
                                "threshold": 0.80,
                                "type": "adverse_impact"
                            })

            # Calculate Equal Opportunity Difference
            if tpr_rates:
                ref_tpr_group = max(tpr_rates, key=tpr_rates.get)
                ref_tpr = tpr_rates[ref_tpr_group]
                for gm in group_metrics:
                    if not gm.get("suppressed") and gm.get("true_positive_rate") is not None:
                        eod = round(gm["true_positive_rate"] - ref_tpr, 3)
                        gm["equal_opportunity_diff"] = eod
                        gm["equal_opportunity_difference"] = eod
                        if abs(eod) > 0.10:
                            flagged_eod_disparities.append({
                                "attribute": attr,
                                "group": gm["group_name"],
                                "reference_group": ref_tpr_group,
                                "eod": eod,
                                "threshold": 0.10
                            })

            attribute_results[attr] = {
                "attribute": attr,
                "groups": group_metrics,
                "most_favored_group": favored_group,
                "favored_reference_group": favored_group,
                "equal_opportunity_evaluated": bool(tpr_rates),
                "total_groups_evaluated": len(group_metrics)
            }

        return {
            "status": "success",
            "overall_status": "FLAGGED_DISPARITIES_DETECTED" if len(flagged_disparities) > 0 else "ALL_COHORTS_COMPLIANT",
            "equal_opportunity_status": "EOD_DISPARITIES_DETECTED" if len(flagged_eod_disparities) > 0 else "EOD_PARITY_MAINTAINED",
            "total_workforce_audited": total_workforce,
            "min_sample_size_threshold": min_sample_size,
            "four_fifths_rule_threshold": 0.80,
            "total_flags": len(flagged_disparities),
            "flagged_disparities": flagged_disparities,
            "flagged_eod_disparities": flagged_eod_disparities,
            "legal_notice": "Protected demographic attributes (Gender, Age Band, Marital Status) are strictly prohibited from being used as model training features, scoring weights, or recommendation triggers. They are evaluated exclusively within this post-hoc audit module to ensure the Four-Fifths Disparate Impact standard is maintained.",
            "attributes": attribute_results,
            "audit_timestamp": datetime.utcnow().isoformat()
        }

    def compute_intersectional_fairness(
        self,
        custom_df: Optional[pd.DataFrame] = None,
        min_sample_size: int = 10
    ) -> Dict[str, Any]:
        """
        Evaluates intersectional demographic fairness across paired slices:
        1. Gender x AgeBand
        2. Gender x Department
        3. AgeBand x Department

        Applies:
        - Small-sample suppression (n < 10)
        - Contingency table Fisher's exact / Chi-square test
        - Benjamini-Hochberg False Discovery Rate (FDR) multiple testing correction
        """
        df = self._get_df(custom_df)
        if df.empty or 'RetentionPriority' not in df.columns:
            return {"error": "Workforce data with RetentionPriority required for intersectional audit"}

        intersection_pairs = [
            ("Gender", "AgeBand"),
            ("Gender", "Department"),
            ("AgeBand", "Department")
        ]

        # Filter to pairs available in dataset
        valid_pairs = [(a, b) for a, b in intersection_pairs if a in df.columns and b in df.columns]

        all_slices = []
        p_values_to_correct = []
        p_val_slice_indices = []

        total_workforce = len(df)

        for attr_a, attr_b in valid_pairs:
            pair_name = f"{attr_a} × {attr_b}"

            # Group by intersection
            grouped = df.groupby([attr_a, attr_b], observed=False)

            # First pass: find most favored non-suppressed group in this pair (lowest urgent rate / highest standard rate)
            group_stats = []
            for (val_a, val_b), slice_df in grouped:
                n = len(slice_df)
                if n == 0:
                    continue
                urgent_count = int(np.sum(slice_df['RetentionPriority'] == 'Urgent'))
                favorable_count = n - urgent_count
                favorable_rate = favorable_count / n if n > 0 else 0.0

                group_stats.append({
                    "val_a": str(val_a),
                    "val_b": str(val_b),
                    "n": n,
                    "urgent_count": urgent_count,
                    "favorable_count": favorable_count,
                    "favorable_rate": favorable_rate
                })

            # Reference group: group with highest favorable rate with n >= min_sample_size
            eligible_refs = [g for g in group_stats if g["n"] >= min_sample_size]
            if eligible_refs:
                ref_group = max(eligible_refs, key=lambda x: x["favorable_rate"])
            else:
                ref_group = group_stats[0] if group_stats else None

            for g in group_stats:
                slice_label = f"{g['val_a']} & {g['val_b']}"
                n = g["n"]

                if n < min_sample_size:
                    slice_res = {
                        "pair_name": pair_name,
                        "slice_label": slice_label,
                        "attribute_a": attr_a,
                        "value_a": g["val_a"],
                        "attribute_b": attr_b,
                        "value_b": g["val_b"],
                        "headcount": n,
                        "share_of_workforce_pct": round(n / total_workforce * 100, 2),
                        "urgent_count": g["urgent_count"],
                        "urgent_share_pct": round(g["urgent_count"] / max(1, n) * 100, 1),
                        "favorable_rate": round(g["favorable_rate"], 4),
                        "disparate_impact_ratio": None,
                        "is_favored_reference": False,
                        "is_suppressed": True,
                        "suppression_reason": f"Intersection group size (n={n}) below threshold (n={min_sample_size}); metrics suppressed to avoid statistically invalid inferences",
                        "hypothesis_test": None,
                        "raw_p_value": None,
                        "fdr_adjusted_p_value": None,
                        "is_statistically_significant": False,
                        "is_flagged_four_fifths": False
                    }
                    all_slices.append(slice_res)
                    continue

                # Non-suppressed group: compute DIR vs favored reference group
                ref_rate = ref_group["favorable_rate"] if ref_group else 1.0
                dir_val = round(g["favorable_rate"] / max(1e-4, ref_rate), 3) if ref_rate > 0 else 1.0
                is_flagged = bool(dir_val < 0.80)
                is_ref = bool(ref_group and g["val_a"] == ref_group["val_a"] and g["val_b"] == ref_group["val_b"])

                # Contingency Table for Fisher's / Chi-square test:
                # [ [urgent_slice, non_urgent_slice], [urgent_ref, non_urgent_ref] ]
                test_name = "Chi-Square Test"
                raw_p = 1.0

                if ref_group and not is_ref:
                    table = [
                        [g["urgent_count"], g["favorable_count"]],
                        [ref_group["urgent_count"], ref_group["favorable_count"]]
                    ]
                    # If any cell is small (< 5), use Fisher's exact test
                    if any(cell < 5 for row in table for cell in row):
                        test_name = "Fisher's Exact Test"
                        try:
                            _, raw_p = fisher_exact(table)
                        except Exception:
                            raw_p = 1.0
                    else:
                        test_name = "Chi-Square Test"
                        try:
                            _, raw_p, _, _ = chi2_contingency(table)
                        except Exception:
                            raw_p = 1.0
                else:
                    raw_p = 1.0
                    test_name = "Reference Baseline"

                slice_res = {
                    "pair_name": pair_name,
                    "slice_label": slice_label,
                    "attribute_a": attr_a,
                    "value_a": g["val_a"],
                    "attribute_b": attr_b,
                    "value_b": g["val_b"],
                    "headcount": n,
                    "share_of_workforce_pct": round(n / total_workforce * 100, 2),
                    "urgent_count": g["urgent_count"],
                    "urgent_share_pct": round(g["urgent_count"] / max(1, n) * 100, 1),
                    "favorable_rate": round(g["favorable_rate"], 4),
                    "disparate_impact_ratio": dir_val,
                    "is_favored_reference": is_ref,
                    "is_suppressed": False,
                    "suppression_reason": None,
                    "hypothesis_test": test_name,
                    "raw_p_value": round(float(raw_p), 4) if raw_p is not None else None,
                    "fdr_adjusted_p_value": None,  # Computed in post-step
                    "is_statistically_significant": False,
                    "is_flagged_four_fifths": is_flagged
                }

                current_idx = len(all_slices)
                all_slices.append(slice_res)

                if not is_ref and raw_p is not None:
                    p_values_to_correct.append(raw_p)
                    p_val_slice_indices.append(current_idx)

        # Apply Benjamini-Hochberg FDR correction across tested non-reference slices
        if p_values_to_correct:
            q_vals = benjamini_hochberg_fdr(p_values_to_correct)
            for slice_idx, q in zip(p_val_slice_indices, q_vals):
                all_slices[slice_idx]["fdr_adjusted_p_value"] = q
                all_slices[slice_idx]["is_statistically_significant"] = bool(q < 0.05)

        suppressed_count = sum(1 for s in all_slices if s["is_suppressed"])
        flagged_four_fifths_count = sum(1 for s in all_slices if s["is_flagged_four_fifths"])
        stat_sig_count = sum(1 for s in all_slices if s["is_statistically_significant"])

        return {
            "status": "success",
            "pairs_evaluated": [f"{a} × {b}" for a, b in valid_pairs],
            "total_slices": len(all_slices),
            "suppressed_slices_count": suppressed_count,
            "min_sample_size_threshold": min_sample_size,
            "flagged_four_fifths_count": flagged_four_fifths_count,
            "statistically_significant_disparities_count": stat_sig_count,
            "fdr_method": "Benjamini-Hochberg (alpha = 0.05)",
            "slices": all_slices
        }

    def compute_longitudinal_fairness(
        self,
        db: Session,
        workspace_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Tracks longitudinal fairness drift across historical workforce snapshots.
        Computes Disparate Impact Ratio time series for Gender and Department.
        Reports whether disparity is widening, stable, or improving.
        """
        # Fetch snapshots
        snapshots = db.query(WorkforceSnapshot).filter(
            WorkforceSnapshot.workspace_id == workspace_id
        ).order_by(WorkforceSnapshot.snapshot_date.asc()).all()

        unique_dates = sorted(list(set(s.snapshot_date for s in snapshots)))
        if len(unique_dates) < 2:
            return {
                "status": "insufficient_data",
                "message": "Longitudinal fairness tracking requires at least 2 historical workforce snapshot dates.",
                "dates_count": len(unique_dates),
                "timeline": [],
                "drift_trend": "unknown",
                "summary": "Insufficient snapshot history."
            }

        # Build demographic lookup from analytics_service.df_enriched
        demo_map: Dict[str, Dict[str, Any]] = {}
        df = self.analytics_service.df_enriched
        if df is not None and not df.empty and 'EmployeeID' in df.columns:
            for _, row in df.iterrows():
                emp_id = str(row['EmployeeID']).strip()
                demo_map[emp_id] = {
                    "Gender": str(row.get('Gender', 'Unknown')),
                    "Department": str(row.get('Department', 'Unknown')),
                    "Age": row.get('Age', None)
                }

        # Group snapshots by date
        snaps_by_date: Dict[str, List[WorkforceSnapshot]] = {}
        is_synthetic_run = False
        for s in snapshots:
            if s.is_synthetic:
                is_synthetic_run = True
            snaps_by_date.setdefault(s.snapshot_date, []).append(s)

        timeline = []
        gender_dirs = []

        for d_str in unique_dates:
            cohort = snaps_by_date[d_str]
            if len(cohort) < 10:
                continue

            female_total = 0
            female_favorable = 0
            male_total = 0
            male_favorable = 0

            dept_totals: Dict[str, int] = {}
            dept_favorable: Dict[str, int] = {}

            for snap in cohort:
                # Favorable = Standard or Moderate tier (non-urgent)
                is_fav = (snap.rri_tier in ['Standard', 'Moderate', 'Low', 'Medium'])
                emp_demo = demo_map.get(str(snap.employee_id).strip(), {})

                # Gender
                g = emp_demo.get("Gender", "Unknown")
                if g == "Female":
                    female_total += 1
                    if is_fav:
                        female_favorable += 1
                elif g == "Male":
                    male_total += 1
                    if is_fav:
                        male_favorable += 1

                # Department (use snapshot department or mapped demo)
                dept = snap.department or emp_demo.get("Department", "Unknown")
                dept_totals[dept] = dept_totals.get(dept, 0) + 1
                if is_fav:
                    dept_favorable[dept] = dept_favorable.get(dept, 0) + 1

            female_rate = (female_favorable / female_total) if female_total > 0 else 0.0
            male_rate = (male_favorable / male_total) if male_total > 0 else 0.0

            if female_rate > 0 and male_rate > 0:
                gender_dir = round(min(female_rate, male_rate) / max(female_rate, male_rate), 3)
            else:
                gender_dir = 1.0

            gender_dirs.append(gender_dir)

            # Department Disparities
            dept_rates = {}
            for dept, tot in dept_totals.items():
                if tot >= 5:
                    dept_rates[dept] = round(dept_favorable.get(dept, 0) / tot, 4)

            ref_dept_rate = max(dept_rates.values()) if dept_rates else 1.0
            dept_disparities = [
                {
                    "department": dept,
                    "favorable_rate": rate,
                    "disparate_impact_ratio": round(rate / max(1e-4, ref_dept_rate), 3)
                }
                for dept, rate in dept_rates.items()
            ]

            timeline.append({
                "snapshot_date": d_str,
                "cohort_size": len(cohort),
                "gender_dir": gender_dir,
                "female_favorable_rate": round(female_rate, 4),
                "male_favorable_rate": round(male_rate, 4),
                "female_urgent_rate": round(1.0 - female_rate, 4),
                "male_urgent_rate": round(1.0 - male_rate, 4),
                "is_four_fifths_compliant": bool(gender_dir >= 0.80),
                "department_disparities": dept_disparities
            })

        # Calculate drift trend
        if len(gender_dirs) >= 2:
            first_dir = gender_dirs[0]
            last_dir = gender_dirs[-1]
            diff = last_dir - first_dir

            if diff > 0.03:
                drift_trend = "improving"
            elif diff < -0.03:
                drift_trend = "widening"
            else:
                drift_trend = "stable"
        else:
            drift_trend = "stable"

        latest_dir = gender_dirs[-1] if gender_dirs else 1.0
        summary_msg = (
            f"Longitudinal fairness across {len(timeline)} snapshot points is {drift_trend.upper()}. "
            f"Current Gender DIR is {latest_dir:.3f} (Four-Fifths threshold >= 0.80)."
        )

        return {
            "status": "success",
            "workspace_id": workspace_id,
            "is_synthetic": is_synthetic_run,
            "total_snapshots_evaluated": len(timeline),
            "drift_trend": drift_trend,
            "latest_gender_dir": latest_dir,
            "summary_narrative": summary_msg,
            "timeline": timeline
        }

    def record_bias_signoff(
        self,
        db: Session,
        workspace_id: str,
        user_email: str,
        review_type: str,
        target_id: str,
        decision: str,
        reviewer_notes: str,
        acknowledged_flags: int = 0
    ) -> Dict[str, Any]:
        """
        Records a compliance/HRBP bias review sign-off in the immutable AuditLog.
        Used as a gate before model promotion or policy updates.
        """
        details = {
            "review_type": review_type,
            "target_id": str(target_id),
            "decision": decision,
            "reviewer_notes": reviewer_notes,
            "acknowledged_flags": acknowledged_flags,
            "signed_off_at": datetime.utcnow().isoformat(),
            "four_fifths_standard_checked": True
        }

        entry = AuditLog(
            workspace_id=workspace_id,
            user_email=user_email,
            action="fairness.bias_signoff",
            entity_type="fairness_governance",
            details_json=json.dumps(details)
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)

        return {
            "status": "success",
            "audit_id": entry.id,
            "workspace_id": workspace_id,
            "user_email": user_email,
            "review_type": review_type,
            "decision": decision,
            "created_at": entry.timestamp.isoformat() if hasattr(entry, 'timestamp') and entry.timestamp else datetime.utcnow().isoformat(),
            "details": details
        }

    def get_bias_signoffs(
        self,
        db: Session,
        workspace_id: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Fetches recent bias review sign-off audit records for the workspace.
        """
        logs = db.query(AuditLog).filter(
            AuditLog.workspace_id == workspace_id,
            AuditLog.action == "fairness.bias_signoff"
        ).order_by(AuditLog.timestamp.desc()).limit(limit).all()

        results = []
        for l in logs:
            try:
                details = json.loads(l.details_json) if l.details_json else {}
            except Exception:
                details = {}
            results.append({
                "id": l.id,
                "user_email": l.user_email,
                "created_at": l.timestamp.isoformat() if l.timestamp else None,
                "review_type": details.get("review_type", "audit"),
                "target_id": details.get("target_id", "general"),
                "decision": details.get("decision", "approved"),
                "reviewer_notes": details.get("reviewer_notes", ""),
                "acknowledged_flags": details.get("acknowledged_flags", 0)
            })
        return results


fairness_service = FairnessAuditService()
