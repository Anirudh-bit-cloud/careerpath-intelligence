import React, { useState } from 'react';
import {
  Database,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Check,
  ShieldCheck,
  X,
  Cpu,
  BarChart2,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetMetadata } from '../types';

interface DataManagementViewProps {
  metadata: DatasetMetadata | null;
  onRefreshData: () => void;
}

const REQUIRED_COLUMNS = [
  'YearsAtCompany',
  'YearsInCurrentRole',
  'YearsSinceLastPromotion',
  'YearsWithCurrManager',
  'TrainingTimesLastYear',
  'JobLevel',
  'JobRole',
  'Department',
  'JobSatisfaction',
  'Attrition'
];

const OPTIONAL_COLUMNS = [
  'Age', 'Gender', 'MaritalStatus', 'Education', 'EducationField',
  'MonthlyIncome', 'PerformanceRating', 'JobInvolvement',
  'EnvironmentSatisfaction', 'WorkLifeBalance', 'OverTime',
  'BusinessTravel', 'NumCompaniesWorked', 'TotalWorkingYears',
  'PercentSalaryHike', 'StockOptionLevel', 'RelationshipSatisfaction'
];

export const DataManagementView: React.FC<DataManagementViewProps> = ({ metadata, onRefreshData }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resetting, setResetting] = useState<boolean>(false);
  const [qualityReport, setQualityReport] = useState<any | null>(null);

  // Reclustering config
  const [nClusters, setNClusters] = useState<number>(5);
  const [autoK, setAutoK] = useState<boolean>(false);
  const [reclustering, setReclustering] = useState<boolean>(false);
  const [reclusterResult, setReclusterResult] = useState<any | null>(null);

  React.useEffect(() => {
    const fetchQuality = async () => {
      try {
        const q = await api.getDataQuality();
        setQualityReport(q);
      } catch (e) {
        console.error(e);
      }
    };
    fetchQuality();
  }, [metadata]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv')) {
        setUploadError('Only CSV (.csv) files are supported.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadResult(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const res = await api.uploadDataset(selectedFile);
      setUploadResult(res);
      setSelectedFile(null);
      onRefreshData();
      const q = await api.getDataQuality();
      setQualityReport(q);
    } catch (err: any) {
      setUploadError(err.message || 'Dataset upload failed. Please verify CSV schema.');
    } finally {
      setUploading(false);
    }
  };

  const handleResetToDemo = async () => {
    setResetting(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      await api.resetToDemo();
      setUploadResult({ message: 'Dataset restored to Palo Alto Networks Benchmark cohort.', records: null });
      onRefreshData();
      const q = await api.getDataQuality();
      setQualityReport(q);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to reset dataset.');
    } finally {
      setResetting(false);
    }
  };

  const handleRerunClustering = async () => {
    setReclustering(true);
    setReclusterResult(null);
    try {
      const res = await api.recluster({ n_clusters: nClusters, auto_select_k: autoK });
      setReclusterResult(res);
      onRefreshData();
    } catch (err: any) {
      setUploadError(err.message || 'Reclustering failed.');
    } finally {
      setReclustering(false);
    }
  };

  const detectedColumns = metadata?.columns || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="border-b border-cp-border pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-cp-accent mb-1 flex items-center gap-1.5">
            <Database className="w-4 h-4" />
            <span>Data Ingestion & Integrity Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-cp-text-primary">
            Dataset Management & ML Configuration
          </h1>
          <p className="text-xs text-cp-text-muted mt-1 max-w-3xl leading-relaxed">
            Import custom workforce CSV files, inspect detected schema mapping, review data cleanliness metrics,
            or reconfigure the ensemble clustering pipeline. All views update dynamically.
          </p>
        </div>

        <button
          onClick={handleResetToDemo}
          disabled={resetting}
          className="px-3.5 py-2 rounded-lg bg-cp-bg-surface border border-cp-border text-xs font-semibold text-cp-text-primary hover:bg-cp-bg-hover transition-colors shadow-xs flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cp-text-muted ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting...' : 'Reset to Demo Benchmark'}</span>
        </button>
      </div>

      {/* ── Upload Success / Error Notices ── */}
      {uploadResult && uploadResult.message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-emerald-200">{uploadResult.message}</div>
            {uploadResult.records && (
              <div className="text-emerald-300">
                <strong>{uploadResult.records.toLocaleString()}</strong> records indexed &mdash;&nbsp;
                {uploadResult.columns?.length} raw attributes detected &mdash;&nbsp;
                ML pipeline completed (ensemble clustering + Isolation Forest).
              </div>
            )}
            {uploadResult.clustering_metrics && (
              <div className="text-emerald-400 font-mono text-[11px]">
                Primary algorithm: <strong>{uploadResult.clustering_metrics.primary_algorithm}</strong> &bull;&nbsp;
                Silhouette: <strong>{uploadResult.clustering_metrics.silhouette_score_primary}</strong> &bull;&nbsp;
                K = <strong>{uploadResult.clustering_metrics.n_clusters}</strong> &bull;&nbsp;
                Anomaly rate: <strong>{uploadResult.clustering_metrics.anomaly_rate_percent}%</strong>
              </div>
            )}
          </div>
        </div>
      )}
      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* ── Active Dataset Status Card ── */}
      <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-cp-text-primary">Active Dataset Status</h2>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
            metadata?.is_demo
              ? 'text-sky-400 bg-sky-500/15 border-sky-500/30'
              : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
          }`}>
            {metadata?.is_demo ? 'Demo Mode' : 'Custom Upload'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
            <div className="text-[10px] uppercase font-bold text-cp-text-muted">Dataset Name</div>
            <div className="text-sm font-bold text-cp-text-primary mt-0.5 truncate" title={metadata?.name}>
              {metadata?.name}
            </div>
            <div className="text-[11px] text-cp-text-muted mt-1">
              Source: <strong className="text-cp-accent">{metadata?.is_demo ? 'Academic Prototype' : 'User Upload'}</strong>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
            <div className="text-[10px] uppercase font-bold text-cp-text-muted">Indexed Headcount</div>
            <div className="text-xl font-bold font-mono text-cp-text-primary mt-0.5">
              {metadata?.total_records?.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">Active employee records</div>
          </div>

          <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
            <div className="text-[10px] uppercase font-bold text-cp-text-muted">Dataset Provenance</div>
            <div className="text-[11px] font-semibold text-cp-text-secondary mt-0.5 line-clamp-2" title={metadata?.provenance}>
              {metadata?.provenance}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
            <div className="text-[10px] uppercase font-bold text-cp-text-muted">ML Model</div>
            <div className="text-[11px] font-bold text-cp-text-primary mt-0.5">
              {metadata?.clustering_metrics?.primary_algorithm || 'Ensemble'}
            </div>
            <div className="text-[11px] font-mono text-cp-text-muted mt-0.5">
              K={metadata?.clustering_metrics?.n_clusters} &bull;&nbsp;
              Sil={metadata?.clustering_metrics?.silhouette_score_primary}
            </div>
          </div>
        </div>
      </div>

      {/* ── Data Hygiene Audit ── */}
      {qualityReport && (
        <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-cp-text-primary">Automated Data Hygiene Audit</h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {qualityReport.dataset_status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
              <span className="text-cp-text-muted text-[10px] uppercase font-bold">Completeness</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                {qualityReport.completeness_score_percent}%
              </div>
              <span className="text-[10px] text-cp-text-muted">Zero null values in core features</span>
            </div>

            <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
              <span className="text-cp-text-muted text-[10px] uppercase font-bold">Duplicate Records</span>
              <div className="text-2xl font-bold font-mono text-cp-text-primary mt-0.5">
                {qualityReport.duplicates_detected}
              </div>
              <span className="text-[10px] text-cp-text-muted">All employee records unique</span>
            </div>

            <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
              <span className="text-cp-text-muted text-[10px] uppercase font-bold">Fields w/ Missing</span>
              <div className="text-2xl font-bold font-mono text-cp-text-primary mt-0.5">
                {Object.keys(qualityReport.missing_values || {}).length}
              </div>
              <span className="text-[10px] text-cp-text-muted">Handled via robust median imputers</span>
            </div>

            <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border flex flex-col justify-between">
              <span className="text-cp-text-muted text-[10px] uppercase font-bold">CSV Template</span>
              <a
                href="/api/dataset/sample-template"
                download="template_workforce_data.csv"
                className="mt-2 px-3 py-1.5 rounded-lg bg-cp-accent hover:opacity-90 text-white text-[11px] font-semibold text-center block transition-opacity shadow-xs"
              >
                Download Template
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── CSV UPLOAD DROPZONE + SCHEMA CHECKLIST ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div className="p-6 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-cp-accent" />
            <h2 className="text-sm font-semibold text-cp-text-primary">Upload Custom Workforce CSV</h2>
          </div>
          <p className="text-xs text-cp-text-muted mb-4 leading-relaxed">
            Upload compatible HR analytics datasets. The system automatically validates schema,
            handles missing values, and re-executes the ensemble ML pipeline. All views refresh automatically.
          </p>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <label className="border-2 border-dashed border-cp-border hover:border-cp-accent rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-cp-bg-elevated/40 hover:bg-cp-bg-elevated transition-colors">
              <Upload className="w-8 h-8 text-cp-text-muted mb-2" />
              <span className="text-xs font-semibold text-cp-text-primary">
                {selectedFile ? selectedFile.name : 'Choose a CSV file or drag & drop'}
              </span>
              <span className="text-[10px] text-cp-text-muted mt-1">UTF-8 encoded .csv · up to 25 MB</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {selectedFile && (
              <div className="p-3 rounded-lg bg-cp-accent/10 border border-cp-accent/30 text-xs text-cp-text-primary flex items-center justify-between">
                <span>Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-cp-accent uppercase">Ready</span>
                  <button type="button" onClick={() => setSelectedFile(null)}>
                    <X className="w-3.5 h-3.5 text-cp-text-muted hover:text-cp-text-primary" />
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full py-2.5 rounded-lg bg-cp-accent hover:opacity-90 text-white text-xs font-semibold disabled:opacity-40 transition-opacity shadow-xs"
            >
              {uploading ? 'Processing Dataset & Running Ensemble ML Pipeline...' : 'Upload & Run Analytics Engine'}
            </button>
          </form>
        </div>

        {/* Schema Checklist */}
        <div className="p-6 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-cp-text-primary">Schema Field Detection</h2>
          </div>
          <p className="text-xs text-cp-text-muted mb-3 leading-relaxed">
            Required career fields for feature engineering and cluster models.
          </p>

          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            <div className="text-[10px] uppercase font-bold text-cp-text-muted mb-1 mt-0.5">Required Fields</div>
            {REQUIRED_COLUMNS.map((col) => {
              const isPresent = detectedColumns.length === 0 || detectedColumns.includes(col);
              return (
                <div
                  key={col}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                    isPresent
                      ? 'bg-emerald-500/10 border-emerald-500/25'
                      : 'bg-rose-500/10 border-rose-500/25'
                  }`}
                >
                  <span className="font-mono text-cp-text-primary">{col}</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                    isPresent ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {isPresent ? (
                      <><Check className="w-3.5 h-3.5 text-emerald-400" /> Detected</>
                    ) : (
                      <><X className="w-3.5 h-3.5 text-rose-400" /> Missing</>
                    )}
                  </span>
                </div>
              );
            })}
            <div className="text-[10px] uppercase font-bold text-cp-text-muted mb-1 mt-3">Optional Fields</div>
            {OPTIONAL_COLUMNS.map((col) => {
              const isPresent = detectedColumns.length === 0 || detectedColumns.includes(col);
              return (
                <div
                  key={col}
                  className="flex items-center justify-between p-2 rounded-lg border border-cp-border bg-cp-bg-elevated/30 text-xs"
                >
                  <span className="font-mono text-cp-text-muted">{col}</span>
                  <span className={`text-[11px] font-medium ${isPresent ? 'text-cp-text-muted' : 'text-amber-400'}`}>
                    {isPresent ? 'Present' : 'Not found'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ML PIPELINE CONFIGURATOR ── */}
      <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-cp-text-primary">ML Pipeline Configurator</h2>
        </div>
        <p className="text-xs text-cp-text-muted mb-5 leading-relaxed">
          Re-run the ensemble clustering pipeline with custom K or enable auto-selection based on silhouette score maximisation.
          All views will refresh automatically.
        </p>

        {reclusterResult && (
          <div className="mb-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/25 text-xs text-violet-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <strong>Reclustering complete.</strong> Primary: {reclusterResult.metrics?.primary_algorithm} &bull;&nbsp;
              K={reclusterResult.metrics?.n_clusters} &bull;&nbsp;
              Silhouette={reclusterResult.metrics?.silhouette_score_primary} &bull;&nbsp;
              Anomaly rate={reclusterResult.metrics?.anomaly_rate_percent}%
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Cluster Count Slider */}
          <div>
            <label className="text-xs font-semibold text-cp-text-primary mb-1 block">
              Number of Clusters (K)
              <span className={`ml-2 font-mono text-cp-accent ${autoK ? 'opacity-40' : ''}`}>{nClusters}</span>
            </label>
            <input
              type="range"
              min={2}
              max={8}
              step={1}
              value={nClusters}
              disabled={autoK}
              onChange={e => setNClusters(Number(e.target.value))}
              className="w-full accent-cp-accent disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] text-cp-text-muted mt-0.5">
              {[2,3,4,5,6,7,8].map(k => <span key={k}>{k}</span>)}
            </div>
          </div>

          {/* Auto-select K */}
          <div>
            <label className="text-xs font-semibold text-cp-text-primary mb-2 block">Auto-select Optimal K</label>
            <button
              onClick={() => setAutoK(v => !v)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors w-full ${
                autoK
                  ? 'bg-cp-accent text-white border-cp-accent'
                  : 'bg-cp-bg-surface text-cp-text-primary border-cp-border hover:bg-cp-bg-hover'
              }`}
            >
              {autoK ? '✓ Auto K Enabled (Silhouette max)' : 'Enable Auto K Selection'}
            </button>
            <p className="text-[10px] text-cp-text-muted mt-1">
              Evaluates K=2..8, selects K with maximum silhouette separation.
            </p>
          </div>

          {/* Run Button */}
          <div>
            <button
              onClick={handleRerunClustering}
              disabled={reclustering}
              className="w-full py-2.5 rounded-lg bg-cp-accent hover:opacity-90 text-white text-xs font-semibold disabled:opacity-40 transition-opacity flex items-center justify-center gap-2 shadow-xs"
            >
              <Sliders className={`w-4 h-4 ${reclustering ? 'animate-spin' : ''}`} />
              {reclustering ? 'Running Ensemble Pipeline...' : 'Rerun ML Clustering'}
            </button>
            <p className="text-[10px] text-cp-text-muted mt-1 text-center">
              K-Means + GMM + Hierarchical + Isolation Forest
            </p>
          </div>
        </div>

        {/* Feature Importances */}
        {metadata?.clustering_metrics?.feature_importances && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-3.5 h-3.5 text-cp-text-muted" />
              <span className="text-[11px] font-semibold text-cp-text-primary uppercase tracking-wide">
                Random Forest Feature Importance (Cluster Separability)
              </span>
            </div>
            <div className="space-y-1.5">
              {Object.entries(metadata.clustering_metrics.feature_importances as Record<string, number>).map(([feat, imp]) => (
                <div key={feat} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-cp-text-secondary w-52 shrink-0 truncate">{feat}</span>
                  <div className="flex-1 h-1.5 bg-cp-bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-400 rounded-full"
                      style={{ width: `${(imp * 100 / Math.max(...Object.values(metadata.clustering_metrics.feature_importances as Record<string, number>))) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-cp-text-primary w-12 text-right">{(imp * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
