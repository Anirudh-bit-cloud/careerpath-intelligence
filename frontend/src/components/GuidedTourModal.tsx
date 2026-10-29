import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Shield,
  Layers,
  Database,
  Users2,
  Briefcase
} from 'lucide-react';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

interface TourStep {
  title: string;
  category: string;
  targetTab: string;
  icon: any;
  summary: string;
  bulletPoints: string[];
  keyMetric: string;
  metricLabel: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Executive Telemetry & Baseline Metrics',
    category: 'Workforce Health',
    targetTab: 'overview',
    icon: TrendingUp,
    summary:
      'Aggregated executive dashboard showing overall workforce stagnation index, active retention alerts, and average dwell-years before promotion across departments.',
    bulletPoints: [
      'Zero hardcoded metrics — all KPIs dynamically computed from the active workforce dataset.',
      'Instant breakdown across R&D, Sales, and Support departments.',
      'Deterministic promotion gap threshold flags based on organizational grade bands.'
    ],
    keyMetric: '1,470',
    metricLabel: 'Active Profiles Analyzed'
  },
  {
    title: 'K-Means Career Archetypes & Elbow Evaluation',
    category: 'Unsupervised Machine Learning',
    targetTab: 'clusters',
    icon: Layers,
    summary:
      'Multi-dimensional clustering grouping employees into career archetypes based on tenure, promotion history, performance, and cross-functional mobility.',
    bulletPoints: [
      'Interactive PCA 2D projection with real centroid distance calculations.',
      'Elbow Curve & Silhouette analysis confirming mathematical cluster validity (k=4).',
      'One-click reclustering simulator with customizable parameters.'
    ],
    keyMetric: 'k=4',
    metricLabel: 'Optimal Cluster Silhouette'
  },
  {
    title: 'Promotion Gap & Benchmark Dwell Times',
    category: 'Progression Calibration',
    targetTab: 'promotion-gap',
    icon: Users2,
    summary:
      'Identifies high-performing employees who have exceeded the median benchmark dwell time for their level without promotion, preventing quiet quitting.',
    bulletPoints: [
      'Role-adjusted benchmark curves comparing individual tenure to peers.',
      'Urgency classification based on performance delta and stagnation months.',
      'Departmental filtering with inline drill-down into career trajectory histories.'
    ],
    keyMetric: '3.2 yrs',
    metricLabel: 'Median Benchmark Dwell'
  },
  {
    title: 'Explainable Retention Opportunity Index (ROI)',
    category: 'Predictive Intervention',
    targetTab: 'retention-opportunities',
    icon: Sparkles,
    summary:
      'Transparent, multi-factor scoring model that highlights intervention opportunities before turnover occurs, complete with targeted, rule-based recommendations.',
    bulletPoints: [
      '100% explainable formula: Promotion Gap + Cluster Risk + Satisfaction Inversion + Tenure Weight.',
      'Deterministic recommendation engine mapping signals to structured action plans.',
      'Full intervention lifecycle management: Proposed, Active, In-Review, Completed.'
    ],
    keyMetric: '0.0 - 1.0',
    metricLabel: 'Normalized Risk Score'
  },
  {
    title: 'Talent Review Committee & Presentation Mode',
    category: 'Executive Decision Governance',
    targetTab: 'committee',
    icon: Briefcase,
    summary:
      'Collaborative workspace for talent calibration reviews. Features a Presentation Mode that pseudonymizes employee identifiers to eliminate unconscious bias.',
    bulletPoints: [
      'Presentation Mode masks employee names and IDs (e.g. CANDIDATE-9A4B) for objective reviews.',
      'Formal decision recording (Approved, Deferred, Rejected) tied to auditable sessions.',
      'Collaborative notes, plan comments, and automated meeting minutes export.'
    ],
    keyMetric: 'Bias-Resistant',
    metricLabel: 'Pseudonymized Evaluation'
  },
  {
    title: 'Enterprise HRIS Connectors & Public API',
    category: 'System Interoperability',
    targetTab: 'connectors',
    icon: Database,
    summary:
      'Connects with Workday, BambooHR, and SAP SuccessFactors. Exposes signed API key access and HMAC-verified webhooks for downstream HCM workflow automation.',
    bulletPoints: [
      'Standardized HRIS Reference Adapter with live sync simulation.',
      'Role-scoped Public REST API with instant token revocation.',
      'Outgoing webhook engine dispatching event payloads with HMAC-SHA256 signatures.'
    ],
    keyMetric: 'REST + Webhooks',
    metricLabel: 'API Integration Layer'
  },
  {
    title: 'Security Posture, Audit Trail & GDPR Compliance',
    category: 'Enterprise Trust & Governance',
    targetTab: 'trust-center',
    icon: Shield,
    summary:
      'Comprehensive security governance dashboard showing RBAC permissions, append-only SQLite audit logs, automated retention previews, and GDPR data subject exports.',
    bulletPoints: [
      'Immutable audit logging capturing every policy change, export, and review decision.',
      'Article 15 GDPR machine-readable data subject export with complete profile history.',
      'Transparent security controls: PBKDF2 password hashing and signed session tokens.'
    ],
    keyMetric: '100% Audited',
    metricLabel: 'Immutable Action Logs'
  }
];

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      onNavigateTab(TOUR_STEPS[nextIdx].targetTab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      onNavigateTab(TOUR_STEPS[prevIdx].targetTab);
    }
  };

  const handleJump = (idx: number) => {
    setCurrentStep(idx);
    onNavigateTab(TOUR_STEPS[idx].targetTab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-cp-bg-surface border border-cp-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cp-border bg-cp-bg-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cp-accent/15 border border-cp-accent/30 text-cp-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-cp-accent">
                Platform Spotlight Tour • Step {currentStep + 1} of {TOUR_STEPS.length}
              </div>
              <h3 className="text-sm font-bold text-cp-text-primary">
                {step.category}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-cp-text-muted hover:text-cp-text-primary hover:bg-cp-bg-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tour Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cp-accent/10 border border-cp-accent/25 flex items-center justify-center text-cp-accent shrink-0">
              <StepIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-cp-text-primary leading-snug">
                {step.title}
              </h4>
              <p className="text-xs text-cp-text-secondary mt-1.5 leading-relaxed">
                {step.summary}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-cp-bg-elevated border border-cp-border shrink-0 text-center min-w-[110px]">
              <div className="text-base font-bold text-cp-accent font-mono">
                {step.keyMetric}
              </div>
              <div className="text-[10px] text-cp-text-muted uppercase tracking-wider mt-0.5">
                {step.metricLabel}
              </div>
            </div>
          </div>

          {/* Key Capabilities */}
          <div className="p-4 rounded-lg bg-cp-bg-app border border-cp-border/70 space-y-2">
            <div className="text-[11px] font-bold text-cp-text-primary uppercase tracking-wider">
              Core Capabilities in this Workspace
            </div>
            <ul className="space-y-1.5">
              {step.bulletPoints.map((bp, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-cp-text-secondary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{bp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Step Progress Pills */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleJump(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep
                      ? 'w-7 bg-cp-accent'
                      : idx < currentStep
                      ? 'w-3 bg-emerald-500/60 hover:bg-emerald-400'
                      : 'w-2 bg-cp-border hover:bg-cp-text-muted'
                  }`}
                  title={`${idx + 1}. ${s.title}`}
                />
              ))}
            </div>
            <span className="text-[11px] text-cp-text-muted font-mono">
              Workspace: <code className="text-cp-accent">/{step.targetTab}</code>
            </span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-cp-border bg-cp-bg-elevated/20">
          <button
            onClick={onClose}
            className="text-xs text-cp-text-muted hover:text-cp-text-primary px-2 py-1 rounded transition-colors"
          >
            Exit Tour
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-cp-border text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-hover disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover shadow-xs transition-colors"
            >
              <span>{currentStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
