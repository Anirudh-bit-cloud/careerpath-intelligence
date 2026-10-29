import React from 'react';
import {
  Sliders,
  ShieldCheck,
  Scale,
  Brain,
  Lock,
  Eye,
  CheckCircle2,
  Palette,
  Check,
  Sparkles
} from 'lucide-react';
import { useTheme, THEMES, ThemeKey } from '../context/ThemeContext';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

export const SettingsView: React.FC = () => {
  const { theme, setTheme, allThemes } = useTheme();

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="border-b border-cp-border pb-5">
        <div className="text-xs uppercase font-bold tracking-wider text-cp-accent mb-1 flex items-center gap-1.5">
          <Sliders className="w-4 h-4" />
          <span>System Appearance & Algorithmic Governance</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-cp-text-primary">
          Themes, Methodology & Algorithmic Ethics
        </h1>
        <p className="text-xs text-cp-text-muted mt-1 max-w-3xl leading-relaxed">
          Select your preferred workspace theme appearance, review mathematical formula derivations,
          and inspect algorithmic safeguards guaranteeing fair, explainable talent insights.
        </p>
      </div>

      {/* ── THEME CUSTOMIZER SECTION ── */}
      <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-6 shadow-xs space-y-4">
        <ThemeSwitcher inline={true} />
      </div>

      {/* ── ETHICS PILLARS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-cp-accent/15 text-cp-accent flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-cp-text-primary">1. Exclusion of Protected Attributes</h2>
          <p className="text-xs text-cp-text-secondary leading-relaxed">
            All career progression indices, clustering features, and retention scores strictly exclude demographic attributes (Age, Gender, Marital Status, Race). Scoring relies solely on objective operational milestones: time in role, promotion intervals, and training participation.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-cp-text-primary">2. Decision Support, Not Automation</h2>
          <p className="text-xs text-cp-text-secondary leading-relaxed">
            CareerPath Intelligence never executes automated employment decisions (promotions, compensation changes, or separations). The platform serves solely as an exploratory diagnostic aid for human HR Business Partners and Talent Committees.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-cp-text-primary">3. Anonymization by Default</h2>
          <p className="text-xs text-cp-text-secondary leading-relaxed">
            Individual employee profiles are keyed by anonymized tokens (e.g. <code>PANW-1042</code>) rather than personally identifiable employee names, mitigating unconscious bias during organizational talent calibrations.
          </p>
        </div>
      </div>

      {/* ── MATHEMATICAL SPECIFICATIONS CARD ── */}
      <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-cp-text-primary">
          Core Mathematical Models & Formula Specifications
        </h2>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-cp-bg-elevated border border-cp-border">
            <div className="font-bold text-cp-text-primary text-xs">A. Promotion Gap Ratio (PGR)</div>
            <div className="font-mono text-cp-accent text-[11px] bg-cp-bg-surface p-2 rounded-lg border border-cp-border mt-1 inline-block">
              PGR = YearsSinceLastPromotion / max(YearsAtCompany, 1.0)
            </div>
            <p className="text-cp-text-secondary mt-2 text-[11px]">
              Bounds: [0.0, 1.0]. Represents the percentage of an employee's enterprise tenure spent without experiencing vertical advancement. Zero tenure cases are assigned 0.0 to prevent division by zero.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-cp-bg-elevated border border-cp-border">
            <div className="font-bold text-cp-text-primary text-xs">B. Retention Opportunity Index</div>
            <div className="font-mono text-cp-accent text-[11px] bg-cp-bg-surface p-2 rounded-lg border border-cp-border mt-1 inline-block">
              Index = [ 0.45 × (0.6 × PGR + 0.4 × RSI) + 0.35 × Engagement + 0.20 × (1.0 - Training/6) ] × 100
            </div>
            <p className="text-cp-text-secondary mt-2 text-[11px]">
              Weights: Stagnation Severity (45%), Current Engagement & Satisfaction (35%), Capability Training Deficit (20%). Identifies individuals who are not yet actively disengaged but who face structural career stagnation. <em>Prioritizes proactive career development; not an attrition probability or financial ROI.</em>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-cp-bg-elevated border border-cp-border">
            <div className="font-bold text-cp-text-primary text-xs">C. Unsupervised Trajectory Partitioning</div>
            <p className="text-cp-text-secondary mt-1 text-[11px]">
              Primary partitioning utilizes K-Means (K=5) initialized via k-means++ over 20 iterations. Validation is conducted with Gaussian Mixture Models (probabilistic soft assignment), Agglomerative Hierarchical Clustering (Ward's minimum variance criterion), and Isolation Forest anomaly detection.
            </p>
          </div>
        </div>
      </div>

      {/* ── DISCLOSURE AND INTEGRITY REQUIREMENTS ── */}
      <div className="p-5 rounded-xl bg-cp-bg-elevated text-cp-text-secondary text-xs space-y-2 border border-cp-border">
        <div className="font-bold text-cp-text-primary text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cp-accent" />
          <span>Academic Prototype & Illustrative Enterprise Attribution</span>
        </div>
        <p className="leading-relaxed">
          Palo Alto Networks is the illustrative organizational context for this independent academic prototype developed as part of the Unified Mentor data science internship. This project is not officially developed, sponsored, endorsed, or used in production by Palo Alto Networks. All analytical demonstrations utilize public synthetic benchmark distributions.
        </p>
      </div>
    </div>
  );
};
