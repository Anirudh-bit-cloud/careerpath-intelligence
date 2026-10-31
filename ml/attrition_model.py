"""
Supervised Attrition Machine Learning Model with SHAP and Probability Calibration.
Trained on historical exit labels using only objective non-protected job/tenure features.
Excludes all protected demographic attributes (strictly validated).
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold, StratifiedShuffleSplit
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss
import shap

# Protected demographic attributes that MUST NEVER enter the feature matrix
PROTECTED_ATTRIBUTES_CANONICAL = {
    'gender', 'sex', 'age', 'ageband', 'age_band', 'agegroup', 'age_group',
    'maritalstatus', 'marital_status', 'race', 'ethnicity', 'religion',
    'disability', 'sexual_orientation'
}


def validate_features_no_protected(columns: List[str]) -> None:
    """Raises ValueError if any protected attribute is passed as a model feature."""
    for col in columns:
        norm = col.lower().replace(" ", "").replace("_", "")
        if norm in PROTECTED_ATTRIBUTES_CANONICAL:
            raise ValueError(f"CRITICAL VIOLATION: Protected demographic attribute '{col}' is prohibited from model features.")
        for p in ['gender', 'marital', 'ethnicity', 'race', 'religion']:
            if p in norm:
                raise ValueError(f"CRITICAL VIOLATION: Protected attribute keyword '{p}' detected in feature '{col}'.")


class AttritionModelService:
    def __init__(self, analytics_service=None, random_state: int = 42):
        self.analytics_service = analytics_service
        self.random_state = random_state
        self.feature_columns: List[str] = [
            'YearsAtCompany',
            'YearsInCurrentRole',
            'YearsSinceLastPromotion',
            'YearsWithCurrManager',
            'TrainingTimesLastYear',
            'JobLevel',
            'JobSatisfaction',
            'PerformanceRating'
        ]
        validate_features_no_protected(self.feature_columns)
        self.base_model: Optional[HistGradientBoostingClassifier] = None
        self.calibrated_model: Optional[CalibratedClassifierCV] = None
        self.explainer: Optional[shap.TreeExplainer] = None
        self.train_metrics: Dict[str, Any] = {}
        self.is_trained: bool = False
        self.has_exit_labels: bool = False
        self.cached_shap_values: Optional[np.ndarray] = None
        self.cached_X: Optional[pd.DataFrame] = None
        self.cached_emp_ids: Optional[List[str]] = None

    @property
    def is_fitted(self) -> bool:
        return self.is_trained

    @property
    def features(self) -> List[str]:
        return self.feature_columns

    @property
    def cv_metrics(self) -> Dict[str, Any]:
        return self.train_metrics

    @property
    def model(self):
        return self.calibrated_model or self.base_model

    def train(self, df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        return self.train_or_update(force=True, df=df)

    def _get_df(self) -> pd.DataFrame:
        if self.analytics_service is not None and self.analytics_service.df_enriched is not None:
            return self.analytics_service.df_enriched.copy()
        return pd.DataFrame()

    def train_or_update(self, force: bool = False, df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """
        Trains or updates the supervised model on current dataset.
        Handles class imbalance, applies probability calibration, computes SHAP explainer,
        and evaluates ROC-AUC, PR-AUC, Brier score on held-out split.
        """
        if df is None:
            df = self._get_df()
        if df.empty:
            self.is_trained = False
            self.has_exit_labels = False
            return {"error": "No workforce data available for training", "is_trained": False}

        # Check for attrition/exit labels
        exit_col = None
        for cand in ['Attrition', 'exited', 'Exited', 'attrition', 'IsTerminated', 'Terminated']:
            if cand in df.columns:
                exit_col = cand
                break

        if not exit_col:
            self.is_trained = False
            self.has_exit_labels = False
            return {
                "is_trained": False,
                "has_exit_labels": False,
                "message": "Dataset contains no historical exit labels ('Attrition'). Supervised attrition ML model is disabled."
            }

        # Validate features strictly before any model execution
        valid_features = [c for c in self.feature_columns if c in df.columns]
        validate_features_no_protected(valid_features)

        X = df[valid_features].copy()
        # Fill missing values with median
        for c in valid_features:
            X[c] = pd.to_numeric(X[c], errors='coerce').fillna(X[c].median() if len(X[c].dropna()) > 0 else 0)

        # Binary event indicator: 1 = Attrition, 0 = Retained
        if df[exit_col].dtype == object or isinstance(df[exit_col].iloc[0], str):
            y = df[exit_col].astype(str).str.strip().str.lower().isin(['yes', '1', 'true', 'attrited', 'terminated']).astype(int).values
        else:
            y = (df[exit_col] == 1).astype(int).values

        if np.sum(y) < 5 or np.sum(y == 0) < 5:
            self.is_trained = False
            self.has_exit_labels = False
            return {
                "is_trained": False,
                "has_exit_labels": False,
                "message": f"Insufficient attrition variation (found {np.sum(y)} departures). At least 5 required."
            }

        self.has_exit_labels = True
        n = len(X)

        # Held-out stratified split (75% train / 25% test)
        sss = StratifiedShuffleSplit(n_splits=1, test_size=0.25, random_state=self.random_state)
        train_idx, test_idx = next(sss.split(X, y))
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y[train_idx], y[test_idx]

        # 1. Base Gradient Boosting Classifier with class imbalance handling
        base_clf = HistGradientBoostingClassifier(
            max_iter=120,
            learning_rate=0.08,
            max_depth=5,
            class_weight='balanced',
            random_state=self.random_state
        )
        base_clf.fit(X_train, y_train)

        # 2. Probability Calibration (isotonic when n >= 1000, else sigmoid/Platt)
        calib_method = 'isotonic' if len(X_train) >= 1000 else 'sigmoid'
        calibrated_clf = CalibratedClassifierCV(
            estimator=base_clf,
            method=calib_method,
            cv=3
        )
        calibrated_clf.fit(X_train, y_train)

        # Evaluate on held-out test split
        y_pred_proba = calibrated_clf.predict_proba(X_test)[:, 1]

        roc_auc = round(float(roc_auc_score(y_test, y_pred_proba)), 4)
        pr_auc = round(float(average_precision_score(y_test, y_pred_proba)), 4)
        brier = round(float(brier_score_loss(y_test, y_pred_proba)), 4)

        # 5-fold cross-validation on full dataset for stable generalization estimate
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_roc_scores = []
        cv_pr_scores = []

        for cv_tr_idx, cv_val_idx in skf.split(X, y):
            fold_base = HistGradientBoostingClassifier(
                max_iter=120, learning_rate=0.08, max_depth=5, class_weight='balanced', random_state=42
            )
            fold_base.fit(X.iloc[cv_tr_idx], y[cv_tr_idx])
            fold_calib = CalibratedClassifierCV(estimator=fold_base, method=calib_method, cv=3)
            fold_calib.fit(X.iloc[cv_tr_idx], y[cv_tr_idx])
            fold_preds = fold_calib.predict_proba(X.iloc[cv_val_idx])[:, 1]
            cv_roc_scores.append(roc_auc_score(y[cv_val_idx], fold_preds))
            cv_pr_scores.append(average_precision_score(y[cv_val_idx], fold_preds))

        # 3. SHAP TreeExplainer
        explainer = shap.TreeExplainer(base_clf)
        shap_values = explainer.shap_values(X)
        if isinstance(shap_values, list):
            # For binary classification some versions return list of arrays
            shap_matrix = shap_values[1] if len(shap_values) > 1 else shap_values[0]
        else:
            shap_matrix = shap_values

        self.base_model = base_clf
        self.calibrated_model = calibrated_clf
        self.explainer = explainer
        self.cached_shap_values = shap_matrix
        self.cached_X = X
        id_col = 'EmployeeID' if 'EmployeeID' in df.columns else 'employee_id'
        self.cached_emp_ids = df[id_col].astype(str).tolist() if id_col in df.columns else [str(i) for i in range(len(df))]
        self.is_trained = True

        # Global feature importance: mean absolute SHAP value
        mean_abs_shap = np.mean(np.abs(shap_matrix), axis=0)
        global_importance = []
        for feat, imp in zip(valid_features, mean_abs_shap):
            global_importance.append({
                "feature": feat,
                "importance": round(float(imp), 4)
            })
        global_importance.sort(key=lambda x: x["importance"], reverse=True)
        for rank, item in enumerate(global_importance, 1):
            item["rank"] = rank

        self.train_metrics = {
            "model_type": "HistGradientBoostingClassifier + CalibratedClassifierCV",
            "calibration_method": calib_method,
            "feature_count": len(valid_features),
            "features": valid_features,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "total_samples": n,
            "total_departures": int(np.sum(y)),
            "departure_rate": round(float(np.mean(y)), 4),
            "roc_auc": roc_auc,
            "pr_auc": pr_auc,
            "brier_score": brier,
            "cv_mean": round(float(np.mean(cv_roc_scores)), 4),
            "cv_std": round(float(np.std(cv_roc_scores)), 4),
            "test_metrics": {
                "roc_auc": roc_auc,
                "pr_auc": pr_auc,
                "brier_score": brier
            },
            "cross_validation_5fold": {
                "mean_roc_auc": round(float(np.mean(cv_roc_scores)), 4),
                "std_roc_auc": round(float(np.std(cv_roc_scores)), 4),
                "mean_pr_auc": round(float(np.mean(cv_pr_scores)), 4),
                "std_pr_auc": round(float(np.std(cv_pr_scores)), 4)
            },
            "global_feature_importance": global_importance
        }

        return self.train_metrics

    def get_employee_ml_explanation(self, employee_id: str) -> Dict[str, Any]:
        """
        Returns employee-specific calibrated ML probability, risk tier, agreement with RRI tier,
        top positive drivers (increasing departure risk), and top protective drivers.
        """
        if not self.is_trained or self.cached_X is None:
            self.train_or_update()

        if not self.is_trained or self.cached_X is None:
            return {
                "enabled": False,
                "message": "Supervised ML model is not available for this dataset."
            }

        # Locate employee
        emp_str = str(employee_id).strip()
        matched_idx = None
        for idx, eid in enumerate(self.cached_emp_ids or []):
            if eid == emp_str or eid.endswith(f"-{emp_str}") or eid.replace("PANW-", "") == emp_str.replace("PANW-", ""):
                matched_idx = idx
                break

        if matched_idx is None:
            return {"error": f"Employee {employee_id} not found in model cohort."}

        row_X = self.cached_X.iloc[[matched_idx]]
        prob = float(self.calibrated_model.predict_proba(row_X)[0, 1])
        prob_pct = round(prob * 100, 1)

        # ML Tier
        if prob >= 0.70:
            ml_tier = "Urgent"
        elif prob >= 0.45:
            ml_tier = "Moderate"
        else:
            ml_tier = "Standard"

        # Lookup RRI tier for agreement check
        df = self._get_df()
        rri_tier = "Standard"
        rri_score = 50.0
        if not df.empty and matched_idx < len(df):
            rri_tier = df.iloc[matched_idx].get("RetentionPriority", "Standard")
            rri_col = 'RetentionRiskIndex' if 'RetentionRiskIndex' in df.columns else 'RetentionOpportunityIndex'
            rri_score = float(df.iloc[matched_idx].get(rri_col, 50.0))

        agreement = (ml_tier == rri_tier)
        disagreement_flag = not agreement

        # SHAP breakdown for this employee
        shap_row = self.cached_shap_values[matched_idx]
        feature_drivers = []
        for feat, val, s_val in zip(self.cached_X.columns, row_X.iloc[0].values, shap_row):
            direction = "increases_risk" if s_val > 0 else "decreases_risk"
            feature_drivers.append({
                "feature": feat,
                "feature_value": float(val),
                "shap_impact": round(float(s_val), 4),
                "direction": direction
            })

        # Top positive drivers (increase risk)
        positive_drivers = sorted([f for f in feature_drivers if f["shap_impact"] > 0], key=lambda x: x["shap_impact"], reverse=True)[:3]
        # Top negative drivers (protective factors)
        negative_drivers = sorted([f for f in feature_drivers if f["shap_impact"] < 0], key=lambda x: x["shap_impact"])[:3]

        return {
            "employee_id": employee_id,
            "ml_probability": round(prob, 4),
            "ml_probability_percent": prob_pct,
            "ml_risk_tier": ml_tier,
            "rri_score": round(rri_score, 1),
            "rri_tier": rri_tier,
            "agreement": agreement,
            "disagreement_flag": disagreement_flag,
            "disagreement_note": (
                "RRI (rule-weighted dwell formula) and Supervised ML model assign differing risk tiers. Review counterfactual drivers for human adjudication."
                if disagreement_flag else "Both scoring methodologies concur on candidate priority tier."
            ),
            "top_positive_drivers": positive_drivers,
            "top_negative_drivers": negative_drivers,
            "all_feature_drivers": sorted(feature_drivers, key=lambda x: abs(x["shap_impact"]), reverse=True),
            "governance_disclosure": "ML Attrition Probability is decision support only. Never automates compensation, discipline, or termination decisions."
        }

    def get_global_importance(self) -> Dict[str, Any]:
        """Returns global feature importance, model validation metrics, and training status."""
        if not self.is_trained:
            self.train_or_update()

        if not self.is_trained:
            return {
                "enabled": False,
                "has_exit_labels": self.has_exit_labels,
                "message": "Supervised attrition model is not trained on the current dataset."
            }

        return {
            "enabled": True,
            "has_exit_labels": True,
            "metrics": self.train_metrics,
            "governance_note": "Evaluated with probability calibration and 5-fold cross-validation. Protected demographic attributes are strictly excluded."
        }


# Singleton service instance
attrition_model_service = AttritionModelService()
