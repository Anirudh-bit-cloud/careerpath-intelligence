"""
CareerPath Intelligence - Advanced Unsupervised Career Path Clustering
Ensemble approach: K-Means + GMM + Agglomerative Hierarchical.
Automated optimal-K selection, Isolation Forest anomaly detection,
PCA 2D visualization, and empirical cluster labeling.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List, Optional
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans, AgglomerativeClustering
from sklearn.mixture import GaussianMixture
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import silhouette_score, davies_bouldin_score
from sklearn.decomposition import PCA

CLUSTERING_FEATURES_DEFAULT = [
    'YearsAtCompany',
    'YearsInCurrentRole',
    'YearsSinceLastPromotion',
    'YearsWithCurrManager',
    'TrainingTimesLastYear',
    'PromotionGapRatio',
    'RoleStagnationIndex',
    'JobLevel'
]


def compute_elbow_curve(
    X_scaled: np.ndarray,
    k_range: range = range(2, 9),
    random_state: int = 42
) -> List[Dict[str, Any]]:
    """
    Computes K-Means inertia and silhouette scores for a range of K values.
    Used by the frontend to render the elbow / silhouette curve.
    """
    results = []
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=random_state, n_init=15)
        labels = km.fit_predict(X_scaled)
        sil = float(silhouette_score(X_scaled, labels)) if k >= 2 else 0.0
        results.append({
            "k": int(k),
            "inertia": round(float(km.inertia_), 1),
            "silhouette_score": round(sil, 4)
        })
    return results


def select_optimal_k(
    X_scaled: np.ndarray,
    k_range: range = range(2, 9),
    random_state: int = 42
) -> int:
    """
    Auto-selects the optimal number of clusters using the silhouette score.
    Returns the K with the highest silhouette score in the given range.
    """
    best_k = k_range.start
    best_sil = -1.0
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=random_state, n_init=10)
        labels = km.fit_predict(X_scaled)
        sil = float(silhouette_score(X_scaled, labels))
        if sil > best_sil:
            best_sil = sil
            best_k = k
    return best_k


def perform_career_clustering(
    df_features: pd.DataFrame,
    features: List[str] = None,
    n_clusters: int = 5,
    random_state: int = 42,
    auto_select_k: bool = False,
    algorithm: str = "ensemble"
) -> Tuple[pd.DataFrame, Dict[str, Any], pd.DataFrame]:
    """
    Executes an ensemble Career Clustering pipeline:
      1. K-Means (primary model)
      2. Gaussian Mixture Model (probabilistic soft assignment)
      3. Agglomerative Hierarchical Clustering (structural validation)
      4. Isolation Forest (anomaly / extreme stagnation detection)
      5. PCA 2D projection for scatter visualization
      6. Random Forest feature importance (explains cluster separability)

    Returns:
      - enriched DataFrame with ClusterID, CareerCluster, PCA1, PCA2, anomaly flags
      - evaluation metrics dict
      - cluster summary profile DataFrame
    """
    df = df_features.copy()
    if features is None:
        features = [f for f in CLUSTERING_FEATURES_DEFAULT if f in df.columns]

    X = df[features].copy()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # ── Step 1: Elbow curve data (always computed, for frontend chart) ────────
    elbow_data = compute_elbow_curve(X_scaled, k_range=range(2, 9), random_state=random_state)

    # ── Step 1b: Auto-select K if requested ──────────────────────────────────
    if auto_select_k:
        n_clusters = select_optimal_k(X_scaled, k_range=range(2, 9), random_state=random_state)

    # ── Step 2a: K-Means (Primary) ───────────────────────────────────────────
    kmeans = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=20, max_iter=500)
    kmeans_labels = kmeans.fit_predict(X_scaled)

    # ── Step 2b: GMM (Probabilistic Ensemble Member) ─────────────────────────
    gmm = GaussianMixture(
        n_components=n_clusters, random_state=random_state, n_init=5,
        covariance_type='full', max_iter=200
    )
    gmm.fit(X_scaled)
    gmm_labels = gmm.predict(X_scaled)
    gmm_proba = gmm.predict_proba(X_scaled)
    # GMM confidence = max probability across components (0-1)
    gmm_confidence = gmm_proba.max(axis=1)

    # ── Step 2c: Agglomerative Hierarchical (Structural Validation) ───────────
    hierarchical = AgglomerativeClustering(n_clusters=n_clusters, linkage='ward')
    hier_labels = hierarchical.fit_predict(X_scaled)

    # ── Step 3: Evaluation Metrics ───────────────────────────────────────────
    sil_km   = float(silhouette_score(X_scaled, kmeans_labels))
    sil_gmm  = float(silhouette_score(X_scaled, gmm_labels))
    sil_hier = float(silhouette_score(X_scaled, hier_labels))
    db_km    = float(davies_bouldin_score(X_scaled, kmeans_labels))
    db_gmm   = float(davies_bouldin_score(X_scaled, gmm_labels))
    inertia  = float(kmeans.inertia_)

    # Primary label set: pick best model by silhouette
    sil_scores = {'K-Means': sil_km, 'Gaussian Mixture': sil_gmm, 'Agglomerative Hierarchical': sil_hier}
    label_sets  = {'K-Means': kmeans_labels, 'Gaussian Mixture': gmm_labels, 'Agglomerative Hierarchical': hier_labels}
    best_model_name = max(sil_scores, key=sil_scores.get)
    best_labels = label_sets[best_model_name]

    # ── Step 4: Isolation Forest — Extreme Stagnation Anomaly Detection ──────
    iso_forest = IsolationForest(contamination=0.08, random_state=random_state, n_estimators=200)
    iso_predictions = iso_forest.fit_predict(X_scaled)
    iso_scores = iso_forest.score_samples(X_scaled)

    # -1 = anomaly (extreme stagnation profile), +1 = normal
    df['IsAnomalousStagnation'] = (iso_predictions == -1)
    df['AnomalyScore'] = np.round(-iso_scores, 4)  # higher = more anomalous

    # ── Step 5: PCA 2D Projection ─────────────────────────────────────────────
    pca = PCA(n_components=2, random_state=random_state)
    pca_coords = pca.fit_transform(X_scaled)
    var_ratio = [float(v) for v in pca.explained_variance_ratio_]

    df['Cluster_ID']           = best_labels
    df['KMeans_Cluster_ID']    = kmeans_labels
    df['GMM_Cluster_ID']       = gmm_labels
    df['Hierarchical_Cluster_ID'] = hier_labels
    df['GMM_Confidence']       = np.round(gmm_confidence, 3)
    df['PCA1']                 = np.round(pca_coords[:, 0], 3)
    df['PCA2']                 = np.round(pca_coords[:, 1], 3)

    # ── Step 6: Data-Derived Cluster Labeling ────────────────────────────────
    cluster_means = df.groupby('Cluster_ID')[features].mean()
    label_map = _assign_cluster_labels(cluster_means, n_clusters)
    df['CareerCluster'] = df['Cluster_ID'].map(label_map)

    # ── Step 7: Feature Importance via Random Forest ─────────────────────────
    rf = RandomForestClassifier(n_estimators=100, random_state=random_state, n_jobs=-1)
    rf.fit(X_scaled, best_labels)
    feature_importances = {
        features[i]: round(float(rf.feature_importances_[i]), 4)
        for i in range(len(features))
    }
    feature_importances = dict(sorted(feature_importances.items(), key=lambda x: -x[1]))

    # ── Step 8: Cluster Profile Summary ──────────────────────────────────────
    summary_list = []
    for cid in sorted(df['Cluster_ID'].unique()):
        c_sub = df[df['Cluster_ID'] == cid]
        name = label_map.get(int(cid), f'Archetype {cid + 1}')
        anomaly_count = int(c_sub['IsAnomalousStagnation'].sum())
        profile = {
            'Cluster_ID': int(cid),
            'Name': name,
            'Count': int(len(c_sub)),
            'Percentage': round((len(c_sub) / len(df)) * 100, 1),
            'MedianYearsAtCompany': round(float(c_sub['YearsAtCompany'].median()), 1),
            'MedianYearsInCurrentRole': round(float(c_sub['YearsInCurrentRole'].median()), 1),
            'MedianYearsSinceLastPromotion': round(float(c_sub['YearsSinceLastPromotion'].median()), 1),
            'MeanPromotionGapRatio': round(float(c_sub['PromotionGapRatio'].mean()), 3),
            'MedianTrainingLastYear': round(float(c_sub['TrainingTimesLastYear'].median()), 1),
            'MedianJobLevel': int(round(float(c_sub['JobLevel'].median()))),
            'AvgRetentionOpportunityIndex': round(float(c_sub['RetentionOpportunityIndex'].mean()), 1),
            'HighPromotionGapCount': int(c_sub['PromotionGapCategory'].isin(['Urgent', 'High']).sum()),
            'AnomalousStagnationCount': anomaly_count,
            'AvgGMMConfidence': round(float(c_sub['GMM_Confidence'].mean()), 3),
            'PrimaryCharacteristics': get_cluster_narrative(name, c_sub)
        }
        summary_list.append(profile)

    cluster_profiles_df = pd.DataFrame(summary_list)

    # ── Step 9: Assemble Metrics ──────────────────────────────────────────────
    metrics = {
        'n_clusters': n_clusters,
        'primary_algorithm': best_model_name,
        'silhouette_score_kmeans': round(sil_km, 4),
        'silhouette_score_gmm': round(sil_gmm, 4),
        'silhouette_score_hierarchical': round(sil_hier, 4),
        'silhouette_score_primary': round(max(sil_km, sil_gmm, sil_hier), 4),
        'davies_bouldin_kmeans': round(db_km, 4),
        'davies_bouldin_gmm': round(db_gmm, 4),
        'inertia': round(inertia, 1),
        'pca_variance_explained': [round(v * 100, 1) for v in var_ratio],
        'pca_total_variance_explained': round(sum(var_ratio) * 100, 1),
        'features_used': features,
        'feature_importances': feature_importances,
        'anomaly_count': int((iso_predictions == -1).sum()),
        'anomaly_rate_percent': round(float((iso_predictions == -1).mean()) * 100, 1),
        'elbow_curve': elbow_data,
        'auto_k_selected': auto_select_k,
    }

    return df, metrics, cluster_profiles_df


def _assign_cluster_labels(cluster_means: pd.DataFrame, n_clusters: int) -> Dict[int, str]:
    """
    Assigns interpretable career archetype names to clusters based on their
    mean feature values. Uses an ordered-priority rule set to avoid duplicates.
    """
    label_map: Dict[int, str] = {}
    assigned_names: set = set()

    archetype_priority = [
        'Early-Career Explorers',
        'Promotion-Stalled Talent',
        'High-Risk Stagnation Profiles',
        'Stable Long-Term Contributors',
        'Progressing Career Builders',
    ]

    def score_archetype(row: pd.Series) -> str:
        tenure = row.get('YearsAtCompany', 0)
        p_gap  = row.get('PromotionGapRatio', 0)
        p_lat  = row.get('YearsSinceLastPromotion', 0)
        r_stag = row.get('RoleStagnationIndex', 0)
        lvl    = row.get('JobLevel', 1)

        if tenure <= 2.8:
            return 'Early-Career Explorers'
        if p_gap >= 0.52 and p_lat >= 3.5:
            return 'Promotion-Stalled Talent'
        if p_gap >= 0.42 and r_stag >= 0.58:
            return 'High-Risk Stagnation Profiles'
        if lvl >= 3.5 or tenure >= 8.0:
            return 'Stable Long-Term Contributors'
        return 'Progressing Career Builders'

    # Sort by tenure ascending so 'Early-Career Explorers' binds to shortest-tenure cluster first
    sorted_cids = sorted(
        cluster_means.index.tolist(),
        key=lambda c: cluster_means.loc[c].get('YearsAtCompany', 0)
    )

    for cid in sorted_cids:
        row = cluster_means.loc[cid]
        preferred = score_archetype(row)
        if preferred not in assigned_names:
            label_map[int(cid)] = preferred
            assigned_names.add(preferred)
        else:
            # Fall back to next available archetype
            fallback = next(
                (a for a in archetype_priority if a not in assigned_names),
                f'Career Archetype {int(cid) + 1}'
            )
            label_map[int(cid)] = fallback
            assigned_names.add(fallback)

    return label_map


def get_cluster_narrative(cluster_name: str, sub_df: pd.DataFrame) -> str:
    """Generates an explainable narrative for the observed cluster."""
    if 'Early-Career' in cluster_name:
        return (
            "Early tenure (0-2.5 yrs). Prime period for onboarding, foundational capability "
            "building, and early career pathing discussions."
        )
    elif 'Stalled' in cluster_name:
        return (
            "Mid-to-senior tenure with extended promotion dry spells (>4 yrs). "
            "High retention intervention priority to prevent latent disengagement."
        )
    elif 'High-Risk' in cluster_name:
        return (
            "Prolonged role tenure combined with high promotion latency and training deficits. "
            "Highest anomalous stagnation density — greatest voluntary departure vulnerability."
        )
    elif 'Stable' in cluster_name:
        return (
            "Experienced contributors and senior personnel with steady advancement velocity "
            "and leadership continuity. Monitor for role ceiling effects."
        )
    else:
        return (
            "Healthy career momentum with periodic promotions and active participation "
            "in development programs. Key internal mobility pipeline cohort."
        )
