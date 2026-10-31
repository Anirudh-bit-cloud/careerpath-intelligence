"""
Workforce Historical Snapshots and Longitudinal Trends Service.
Provides multi-tenant time-series tracking of RRI, tier migration matrices,
department trajectories, and single-employee progression histories.
"""

from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc

from backend.app.models.entities import WorkforceSnapshot, SnapshotRun
from backend.app.services.analytics_service import analytics_service
from backend.app.services.attrition_service import attrition_model_service


class SnapshotService:
    def __init__(self, analytics_service_instance=None):
        self.analytics_service = analytics_service_instance or analytics_service

    def create_snapshot(
        self,
        db: Session,
        workspace_id: str = "default",
        snapshot_date: Optional[str] = None,
        created_by: str = "system",
        trigger_type: str = "manual",
        is_synthetic: bool = False,
        custom_df: Optional[pd.DataFrame] = None
    ) -> Dict[str, Any]:
        """
        Captures the complete workforce state as a point-in-time snapshot.
        Enforces idempotency for (workspace_id, snapshot_date).
        """
        target_date = snapshot_date or datetime.utcnow().strftime("%Y-%m-%d")

        # Pull dataset
        if custom_df is not None:
            df = custom_df.copy()
        elif self.analytics_service.df_enriched is not None:
            df = self.analytics_service.df_enriched.copy()
        else:
            return {"error": "No workforce data available to snapshot"}

        # 1. Idempotency: Purge existing snapshot records for this workspace & date
        db.query(WorkforceSnapshot).filter(
            WorkforceSnapshot.workspace_id == workspace_id,
            WorkforceSnapshot.snapshot_date == target_date
        ).delete()

        db.query(SnapshotRun).filter(
            SnapshotRun.workspace_id == workspace_id,
            SnapshotRun.snapshot_date == target_date
        ).delete()

        # 2. Extract column mappings
        id_col = 'EmployeeID' if 'EmployeeID' in df.columns else 'employee_id'
        rri_col = 'RetentionRiskIndex' if 'RetentionRiskIndex' in df.columns else (
            'RetentionOpportunityIndex' if 'RetentionOpportunityIndex' in df.columns else None
        )
        tier_col = 'RetentionPriority' if 'RetentionPriority' in df.columns else None
        cluster_col = 'Cluster' if 'Cluster' in df.columns else None
        level_col = 'JobLevel' if 'JobLevel' in df.columns else None
        dept_col = 'Department' if 'Department' in df.columns else None
        gap_col = 'YearsSinceLastPromotion' if 'YearsSinceLastPromotion' in df.columns else None
        sat_col = 'JobSatisfaction' if 'JobSatisfaction' in df.columns else None

        # Pre-compute ML probabilities in one vectorized pass if model is trained
        ml_probs_map = {}
        if getattr(attrition_model_service, 'is_trained', False) and getattr(attrition_model_service, 'calibrated_model', None) is not None:
            try:
                feats = [c for c in attrition_model_service.feature_columns if c in df.columns]
                if len(feats) == len(attrition_model_service.feature_columns):
                    X_mat = df[feats].fillna(0)
                    batch_probs = attrition_model_service.calibrated_model.predict_proba(X_mat)[:, 1]
                    for eid_val, p_val in zip(df[id_col].astype(str), batch_probs):
                        ml_probs_map[eid_val] = round(float(p_val), 4)
            except Exception:
                ml_probs_map = {}

        records_to_insert = []
        for _, row in df.iterrows():
            emp_id = str(row.get(id_col, f"EMP-{_}"))
            rri_val = float(row.get(rri_col, 50.0)) if rri_col else 50.0
            rri_tier = str(row.get(tier_col, "Standard")) if tier_col else "Standard"

            ml_prob = ml_probs_map.get(emp_id)

            cluster_id = int(row.get(cluster_col, 0)) if cluster_col and pd.notna(row.get(cluster_col)) else None
            job_level = int(row.get(level_col, 1)) if level_col and pd.notna(row.get(level_col)) else None
            department = str(row.get(dept_col, "General")) if dept_col and pd.notna(row.get(dept_col)) else "General"
            gap_years = float(row.get(gap_col, 0.0)) if gap_col and pd.notna(row.get(gap_col)) else 0.0
            satisfaction = float(row.get(sat_col, 3.0)) if sat_col and pd.notna(row.get(sat_col)) else 3.0

            records_to_insert.append(WorkforceSnapshot(
                workspace_id=workspace_id,
                snapshot_date=target_date,
                employee_id=emp_id,
                rri=round(rri_val, 1),
                rri_tier=rri_tier,
                ml_probability=round(ml_prob, 4) if ml_prob is not None else None,
                cluster_id=cluster_id,
                job_level=job_level,
                department=department,
                promotion_gap_years=round(gap_years, 1),
                satisfaction=round(satisfaction, 1),
                is_synthetic=is_synthetic,
                created_at=datetime.utcnow()
            ))

        db.bulk_save_objects(records_to_insert)

        run_record = SnapshotRun(
            workspace_id=workspace_id,
            snapshot_date=target_date,
            created_at=datetime.utcnow(),
            created_by=created_by,
            trigger_type=trigger_type,
            row_count=len(records_to_insert),
            model_version="v3.1.0",
            policy_version=1,
            is_synthetic=is_synthetic
        )
        db.add(run_record)
        db.commit()

        return {
            "status": "success",
            "workspace_id": workspace_id,
            "snapshot_date": target_date,
            "row_count": len(records_to_insert),
            "trigger_type": trigger_type,
            "is_synthetic": is_synthetic,
            "message": f"Successfully captured {len(records_to_insert)} employee records for snapshot {target_date}."
        }

    def list_snapshot_dates(self, db: Session, workspace_id: str = "default") -> List[Dict[str, Any]]:
        """Returns sorted list of available snapshot dates and run metadata."""
        runs = db.query(SnapshotRun).filter(
            SnapshotRun.workspace_id == workspace_id
        ).order_by(asc(SnapshotRun.snapshot_date)).all()

        return [
            {
                "snapshot_date": r.snapshot_date,
                "row_count": r.row_count,
                "trigger_type": r.trigger_type,
                "created_by": r.created_by,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "is_synthetic": r.is_synthetic
            }
            for r in runs
        ]

    def get_trends_overview(
        self,
        db: Session,
        workspace_id: str = "default",
        range_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Returns longitudinal workforce trend points:
        - Date
        - Total Headcount
        - Mean RRI
        - Urgent, Moderate, Standard counts & percentages
        - Data Provenance per point
        """
        # Determine available dates
        query = db.query(WorkforceSnapshot.snapshot_date).filter(
            WorkforceSnapshot.workspace_id == workspace_id
        ).distinct().order_by(asc(WorkforceSnapshot.snapshot_date))

        distinct_dates = [r[0] for r in query.all()]
        if not distinct_dates:
            return {"dates": [], "points": [], "message": "No snapshot history recorded."}

        # Filter by range if specified
        if range_filter == "3m" and len(distinct_dates) > 3:
            filtered_dates = distinct_dates[-3:]
        elif range_filter == "6m" and len(distinct_dates) > 6:
            filtered_dates = distinct_dates[-6:]
        elif range_filter == "12m" and len(distinct_dates) > 12:
            filtered_dates = distinct_dates[-12:]
        else:
            filtered_dates = distinct_dates

        points = []
        for dt in filtered_dates:
            snaps = db.query(WorkforceSnapshot).filter(
                WorkforceSnapshot.workspace_id == workspace_id,
                WorkforceSnapshot.snapshot_date == dt
            ).all()

            n = len(snaps)
            if n == 0:
                continue

            rri_vals = [s.rri for s in snaps]
            mean_rri = round(float(np.mean(rri_vals)), 1)
            urgent = sum(1 for s in snaps if s.rri_tier == 'Urgent')
            moderate = sum(1 for s in snaps if s.rri_tier == 'Moderate')
            standard = sum(1 for s in snaps if s.rri_tier == 'Standard')
            is_synth = any(s.is_synthetic for s in snaps)

            points.append({
                "date": dt,
                "headcount": n,
                "mean_rri": mean_rri,
                "urgent_count": urgent,
                "urgent_pct": round(urgent / n * 100, 1),
                "moderate_count": moderate,
                "moderate_pct": round(moderate / n * 100, 1),
                "standard_count": standard,
                "standard_pct": round(standard / n * 100, 1),
                "is_synthetic": is_synth
            })

        # Summary telemetry
        initial_rri = points[0]["mean_rri"] if points else 0.0
        latest_rri = points[-1]["mean_rri"] if points else 0.0
        delta_rri = round(latest_rri - initial_rri, 1)

        has_synthetic = any(p["is_synthetic"] for p in points)

        return {
            "workspace_id": workspace_id,
            "range_filter": range_filter or "all",
            "snapshot_count": len(points),
            "date_range": {
                "first_date": points[0]["date"] if points else None,
                "latest_date": points[-1]["date"] if points else None,
            },
            "summary": {
                "initial_mean_rri": initial_rri,
                "latest_mean_rri": latest_rri,
                "net_rri_change": delta_rri,
                "trajectory": "improving" if delta_rri < 0 else ("deteriorating" if delta_rri > 0 else "neutral")
            },
            "has_synthetic_history": has_synthetic,
            "points": points
        }

    def get_trends_departments(self, db: Session, workspace_id: str = "default") -> Dict[str, Any]:
        """
        Returns longitudinal department trajectory matrix:
        Department vs Date heatmap with mean RRI, promotion gap, and urgent headcount.
        """
        snapshots = db.query(WorkforceSnapshot).filter(
            WorkforceSnapshot.workspace_id == workspace_id
        ).order_by(asc(WorkforceSnapshot.snapshot_date)).all()

        if not snapshots:
            return {"departments": [], "dates": [], "matrix": []}

        df = pd.DataFrame([
            {
                "date": s.snapshot_date,
                "dept": s.department or "General",
                "rri": s.rri,
                "gap": s.promotion_gap_years or 0.0,
                "is_urgent": 1 if s.rri_tier == 'Urgent' else 0
            }
            for s in snapshots
        ])

        dates = sorted(df["date"].unique().tolist())
        depts = sorted(df["dept"].unique().tolist())

        matrix = []
        for d in depts:
            dept_df = df[df["dept"] == d]
            date_entries = []
            for dt in dates:
                sub = dept_df[dept_df["date"] == dt]
                if not sub.empty:
                    date_entries.append({
                        "date": dt,
                        "mean_rri": round(float(sub["rri"].mean()), 1),
                        "mean_gap_years": round(float(sub["gap"].mean()), 1),
                        "headcount": len(sub),
                        "urgent_count": int(sub["is_urgent"].sum())
                    })
                else:
                    date_entries.append({
                        "date": dt,
                        "mean_rri": None,
                        "mean_gap_years": None,
                        "headcount": 0,
                        "urgent_count": 0
                    })
            matrix.append({
                "department": d,
                "trajectory": date_entries
            })

        return {
            "workspace_id": workspace_id,
            "dates": dates,
            "departments": depts,
            "matrix": matrix
        }

    def get_trends_employee(self, db: Session, employee_id: str, workspace_id: str = "default") -> Dict[str, Any]:
        """Returns single employee's longitudinal trajectory across all snapshots."""
        emp_str = str(employee_id).strip()
        snaps = db.query(WorkforceSnapshot).filter(
            WorkforceSnapshot.workspace_id == workspace_id,
            WorkforceSnapshot.employee_id == emp_str
        ).order_by(asc(WorkforceSnapshot.snapshot_date)).all()

        if not snaps:
            # Fallback check for PANW- prefix
            prefix = f"PANW-{emp_str}" if not emp_str.startswith("PANW-") else emp_str.replace("PANW-", "")
            snaps = db.query(WorkforceSnapshot).filter(
                WorkforceSnapshot.workspace_id == workspace_id,
                WorkforceSnapshot.employee_id == prefix
            ).order_by(asc(WorkforceSnapshot.snapshot_date)).all()

        if not snaps:
            return {"employee_id": employee_id, "found": False, "trajectory": []}

        trajectory = [
            {
                "snapshot_date": s.snapshot_date,
                "rri": s.rri,
                "rri_tier": s.rri_tier,
                "ml_probability": s.ml_probability,
                "job_level": s.job_level,
                "department": s.department,
                "promotion_gap_years": s.promotion_gap_years,
                "satisfaction": s.satisfaction,
                "is_synthetic": s.is_synthetic
            }
            for s in snaps
        ]

        return {
            "employee_id": snaps[0].employee_id,
            "found": True,
            "total_snapshots": len(trajectory),
            "department": snaps[-1].department,
            "current_rri": snaps[-1].rri,
            "current_tier": snaps[-1].rri_tier,
            "trajectory": trajectory
        }

    def get_tier_movement_matrix(
        self,
        db: Session,
        from_date: str,
        to_date: str,
        workspace_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Computes the tier migration transition matrix between any two snapshots.
        Tracks how employees shifted between Standard, Moderate, and Urgent tiers.
        """
        snaps_from = {
            s.employee_id: s for s in db.query(WorkforceSnapshot).filter(
                WorkforceSnapshot.workspace_id == workspace_id,
                WorkforceSnapshot.snapshot_date == from_date
            ).all()
        }

        snaps_to = {
            s.employee_id: s for s in db.query(WorkforceSnapshot).filter(
                WorkforceSnapshot.workspace_id == workspace_id,
                WorkforceSnapshot.snapshot_date == to_date
            ).all()
        }

        if not snaps_from or not snaps_to:
            return {
                "error": f"One or both snapshot dates not found: {from_date} (found: {len(snaps_from)}), {to_date} (found: {len(snaps_to)})"
            }

        tiers = ["Standard", "Moderate", "Urgent"]
        matrix = {t_from: {t_to: 0 for t_to in tiers} for t_from in tiers}

        common_ids = set(snaps_from.keys()) & set(snaps_to.keys())
        new_entrants = list(set(snaps_to.keys()) - set(snaps_from.keys()))
        departures = list(set(snaps_from.keys()) - set(snaps_to.keys()))

        escalated_to_urgent = []
        deescalated_from_urgent = []

        for eid in common_ids:
            t1 = snaps_from[eid].rri_tier
            t2 = snaps_to[eid].rri_tier
            if t1 in matrix and t2 in matrix[t1]:
                matrix[t1][t2] += 1

            if t1 != "Urgent" and t2 == "Urgent":
                escalated_to_urgent.append({
                    "employee_id": eid,
                    "previous_tier": t1,
                    "previous_rri": snaps_from[eid].rri,
                    "new_rri": snaps_to[eid].rri
                })
            elif t1 == "Urgent" and t2 != "Urgent":
                deescalated_from_urgent.append({
                    "employee_id": eid,
                    "resolved_tier": t2,
                    "previous_rri": snaps_from[eid].rri,
                    "new_rri": snaps_to[eid].rri
                })

        urgent_t1 = sum(1 for s in snaps_from.values() if s.rri_tier == "Urgent")
        urgent_t2 = sum(1 for s in snaps_to.values() if s.rri_tier == "Urgent")

        return {
            "workspace_id": workspace_id,
            "from_date": from_date,
            "to_date": to_date,
            "cohort_size": len(common_ids),
            "new_entrants_count": len(new_entrants),
            "departures_count": len(departures),
            "transition_matrix": matrix,
            "escalated_to_urgent_count": len(escalated_to_urgent),
            "deescalated_from_urgent_count": len(deescalated_from_urgent),
            "net_urgent_change": urgent_t2 - urgent_t1,
            "sample_escalated": escalated_to_urgent[:5],
            "sample_resolved": deescalated_from_urgent[:5],
            "is_synthetic": any(s.is_synthetic for s in snaps_from.values()) or any(s.is_synthetic for s in snaps_to.values())
        }

    def get_as_of_retention_opportunities(
        self,
        db: Session,
        as_of_date: str,
        workspace_id: str = "default",
        priority: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Returns workforce snapshot records as of a historical date."""
        query = db.query(WorkforceSnapshot).filter(
            WorkforceSnapshot.workspace_id == workspace_id,
            WorkforceSnapshot.snapshot_date == as_of_date
        )

        if priority and priority != "All":
            query = query.filter(WorkforceSnapshot.rri_tier == priority)

        records = query.order_by(desc(WorkforceSnapshot.rri)).all()
        return [
            {
                "EmployeeID": r.employee_id,
                "RetentionRiskIndex": r.rri,
                "RetentionPriority": r.rri_tier,
                "MLProbability": r.ml_probability,
                "JobLevel": r.job_level,
                "Department": r.department,
                "YearsSinceLastPromotion": r.promotion_gap_years,
                "JobSatisfaction": r.satisfaction,
                "SnapshotDate": r.snapshot_date,
                "IsSynthetic": r.is_synthetic
            }
            for r in records
        ]

    def seed_12_month_history(self, db: Session, workspace_id: str = "default") -> Dict[str, Any]:
        """
        Seeds 12 monthly historical snapshots (12 months ago up to current month).
        Clearly flags all generated points as is_synthetic=True.
        """
        df = self.analytics_service.df_enriched
        if df is None or df.empty:
            return {"error": "No baseline workforce data available to generate synthetic history"}

        today = datetime.utcnow()
        created_runs = []

        # Generate 12 historical monthly dates
        for m in range(12, 0, -1):
            snap_dt = (today - timedelta(days=m * 30)).strftime("%Y-%m-%d")

            # Simulate natural tenure back-propagation:
            # Months in the past had lower tenure and slightly varied satisfaction
            sim_df = df.copy()
            tenure_adj_years = round((m * 30) / 365.25, 2)

            if 'YearsSinceLastPromotion' in sim_df.columns:
                sim_df['YearsSinceLastPromotion'] = (sim_df['YearsSinceLastPromotion'] - tenure_adj_years).clip(lower=0.0)
            if 'YearsAtCompany' in sim_df.columns:
                sim_df['YearsAtCompany'] = (sim_df['YearsAtCompany'] - tenure_adj_years).clip(lower=0.1)

            # Recompute simulated RRI for past point
            rri_col = 'RetentionRiskIndex' if 'RetentionRiskIndex' in sim_df.columns else 'RetentionOpportunityIndex'
            if rri_col in sim_df.columns:
                # Add gentle noise (-5 to +5) to model past dynamic fluctuations
                np.random.seed(42 + m)
                noise = np.random.normal(0, 3.0, len(sim_df))
                sim_df[rri_col] = (sim_df[rri_col] + noise).clip(10.0, 95.0).round(1)

                # Re-assign priority tiers
                tiers = []
                for score in sim_df[rri_col]:
                    if score >= 65.0:
                        tiers.append("Urgent")
                    elif score >= 45.0:
                        tiers.append("Moderate")
                    else:
                        tiers.append("Standard")
                sim_df['RetentionPriority'] = tiers

            res = self.create_snapshot(
                db=db,
                workspace_id=workspace_id,
                snapshot_date=snap_dt,
                created_by="system_seeder",
                trigger_type="synthetic_seed",
                is_synthetic=True,
                custom_df=sim_df
            )
            created_runs.append(res)

        # Also capture current today snapshot as non-synthetic
        now_dt = today.strftime("%Y-%m-%d")
        today_res = self.create_snapshot(
            db=db,
            workspace_id=workspace_id,
            snapshot_date=now_dt,
            created_by="system_seeder",
            trigger_type="baseline",
            is_synthetic=False,
            custom_df=df
        )
        created_runs.append(today_res)

        return {
            "status": "success",
            "workspace_id": workspace_id,
            "snapshots_seeded": len(created_runs),
            "date_range": f"{created_runs[0]['snapshot_date']} to {created_runs[-1]['snapshot_date']}",
            "is_synthetic": True,
            "governance_disclosure": "Historical snapshot data prior to current deployment was synthetically simulated for demonstration of longitudinal analytics."
        }


snapshot_service = SnapshotService()
