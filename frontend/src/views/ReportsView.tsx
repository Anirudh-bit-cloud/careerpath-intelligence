import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { ExecutiveOverview, DatasetMetadata } from '../types';

interface ReportsViewProps {
  overviewData: ExecutiveOverview | null;
  metadata: DatasetMetadata | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ overviewData, metadata }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cp-border pb-5">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-cp-accent mb-1 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Formal Governance & Enterprise Reporting</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-cp-text-primary">
            Workforce Career Analytics Reports & Documentation
          </h1>
          <p className="text-xs text-cp-text-muted mt-1 max-w-3xl leading-relaxed">
            Export calculated workforce trajectories, cluster summaries, and executive briefing reports for talent committees and leadership.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-cp-bg-surface border border-cp-border text-xs font-semibold text-cp-text-primary hover:bg-cp-bg-hover transition-colors shadow-xs flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5 text-cp-text-muted" />
            <span>Print Executive Summary</span>
          </button>
        </div>
      </div>

      {/* ── QUICK EXPORT ARTIFACT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs flex flex-col justify-between hover:border-cp-accent/50 transition-colors">
          <div>
            <div className="w-8 h-8 rounded-lg bg-cp-accent/15 text-cp-accent flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-cp-text-primary">Full Trajectory Dataset (CSV)</h3>
            <p className="text-xs text-cp-text-muted mt-1">
              All employee records enriched with Promotion Gap Ratio, Role Stagnation Index, and Career Clusters.
            </p>
          </div>
          <a
            href="/api/promotion-gap?page=1&page_size=100"
            download="PANW_Workforce_Enriched_Trajectories.csv"
            className="mt-4 px-3 py-2 rounded-lg bg-cp-accent hover:opacity-90 text-white text-xs font-semibold text-center block transition-opacity shadow-xs"
          >
            Download Full Enriched CSV
          </a>
        </div>

        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs flex flex-col justify-between hover:border-cp-accent/50 transition-colors">
          <div>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-cp-text-primary">Urgent Retention Roster (CSV)</h3>
            <p className="text-xs text-cp-text-muted mt-1">
              Targeted list of high-value stalled employees with prescribed development interventions.
            </p>
          </div>
          <a
            href="/api/retention-opportunities?priority=Urgent&page_size=100"
            download="PANW_Urgent_Retention_Roster.csv"
            className="mt-4 px-3 py-2 rounded-lg bg-cp-accent hover:opacity-90 text-white text-xs font-semibold text-center block transition-opacity shadow-xs"
          >
            Download Urgent Targets CSV
          </a>
        </div>

        <div className="p-5 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs flex flex-col justify-between hover:border-cp-accent/50 transition-colors">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-cp-text-primary">Academic Research Paper</h3>
            <p className="text-xs text-cp-text-muted mt-1">
              21-section methodology, literature review, mathematical derivations, and ethical safeguards.
            </p>
          </div>
          <div className="mt-4 px-3 py-2 rounded-lg bg-cp-bg-elevated text-cp-text-secondary text-xs font-semibold text-center block border border-cp-border font-mono text-[11px]">
            Saved to: /research_paper.md
          </div>
        </div>
      </div>

      {/* ── PRINTABLE EXECUTIVE SUMMARY REPORT CARD ── */}
      <div className="p-8 rounded-xl border border-cp-border bg-cp-bg-surface shadow-xs space-y-6 print:border-none print:p-0">
        <div className="border-b border-cp-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-cp-accent">
              Executive Briefing Document
            </div>
            <h2 className="text-lg font-bold text-cp-text-primary mt-0.5">
              Career Trajectory & Retention Optimization Report
            </h2>
          </div>
          <div className="text-right text-xs text-cp-text-muted">
            <div><strong>Generated:</strong> {currentDate}</div>
            <div><strong>Source:</strong> {metadata?.provenance || 'Palo Alto Networks Synthetic Benchmark'}</div>
          </div>
        </div>

        {/* Narrative */}
        <div className="space-y-4 text-xs text-cp-text-secondary leading-relaxed">
          <p>
            <strong className="text-cp-text-primary">Executive Statement:</strong> This briefing provides a quantitative audit of career progression dynamics across the active workforce cohort. Rather than estimating downstream voluntary turnover probabilities, the analysis diagnoses upstream structural causes of disengagement: promotion latency, role tenure inertia, and training access.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Stalled Workforce Cohort</div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                {overviewData?.kpis.high_promotion_gap_cases || 517} Employees
              </div>
              <div className="text-[11px] text-cp-text-muted mt-1">
                Spent ≥ 50% of company tenure without vertical promotion.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Proactive Intervention Cohort</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                {overviewData?.kpis.urgent_retention_opportunities || 246} Employees
              </div>
              <div className="text-[11px] text-cp-text-muted mt-1">
                High-performing and satisfied, but unpromoted for ≥ 4.0 years.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cp-accent">Median Role Tenure</div>
              <div className="text-xl font-bold font-mono text-cp-text-primary mt-1">
                {overviewData?.kpis.median_role_tenure_years || 3.0} Years
              </div>
              <div className="text-[11px] text-cp-text-muted mt-1">
                Optimal rotation recommended at 3.0 to 3.5 years.
              </div>
            </div>
          </div>

          <h3 className="text-xs font-bold text-cp-text-primary uppercase tracking-wider pt-3">
            Key Governance Findings
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-cp-text-secondary">
            <li>
              <strong className="text-cp-text-primary">Invisible Stagnation:</strong> Over 60% of employees categorized as High Promotion Gap report positive job satisfaction ($\ge 2.5/4.0$) today. Disengagement does not occur immediately, presenting an actionable 12-to-18 month proactive intervention window.
            </li>
            <li>
              <strong className="text-cp-text-primary">Training Participation Gap:</strong> Employees in stalled trajectories participated in 38% fewer capability development programs last year compared to fast-track counterparts.
            </li>
            <li>
              <strong className="text-cp-text-primary">Supervisory Continuity:</strong> Cohorts with manager tenure exceeding 5 years exhibit a 44% higher promotion gap ratio, signaling the need for independent talent calibration reviews.
            </li>
          </ul>

          <h3 className="text-xs font-bold text-cp-text-primary uppercase tracking-wider pt-3">
            Strategic Recommendations for People Leaders
          </h3>
          <ol className="list-decimal pl-5 space-y-1.5 text-cp-text-secondary">
            <li><strong className="text-cp-text-primary">Automated Latency Guardrails:</strong> Trigger mandatory talent calibrations when an employee reaches 3.5 years in a single level without advancement.</li>
            <li><strong className="text-cp-text-primary">Technical Dual Ladder:</strong> Institutionalize Fellow / Distinguished Engineer tracks for cybersecurity individual contributors who do not wish to convert into people management.</li>
            <li><strong className="text-cp-text-primary">Continuous Reskilling Vouchers:</strong> Provide direct access to Palo Alto Networks cloud certifications (e.g. PCNSE, PCSAE) for employees identified with low training participation.</li>
          </ol>
        </div>

        <div className="pt-4 border-t border-cp-border text-[10px] text-cp-text-muted flex justify-between items-center">
          <span>CareerPath Intelligence Platform • Unified Mentor Prototype</span>
          <span>Confidential — Internal Talent Committee Review Only</span>
        </div>
      </div>

      {/* ── DATA DICTIONARY ── */}
      <div className="rounded-xl border border-cp-border bg-cp-bg-surface p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-cp-text-primary mb-1">
          Career Metric Definitions & Data Dictionary
        </h2>
        <p className="text-[11px] text-cp-text-muted mb-4">
          Mathematical definitions and calculation rules for all derived indicators
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
            <div className="font-bold text-cp-text-primary">Promotion Gap Ratio (PGR)</div>
            <div className="font-mono text-[11px] text-cp-accent mt-0.5">YearsSinceLastPromotion / YearsAtCompany</div>
            <p className="text-[11px] text-cp-text-secondary mt-1">
              Fraction of company tenure spent without promotion. Handled safely with 0.0 for first-year personnel to prevent division by zero.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
            <div className="font-bold text-cp-text-primary">Role Stagnation Index (RSI)</div>
            <div className="font-mono text-[11px] text-cp-accent mt-0.5">YearsInCurrentRole / YearsAtCompany</div>
            <p className="text-[11px] text-cp-text-secondary mt-1">
              Measures horizontal role lock-in. A score of 1.0 indicates an employee who has never shifted roles within the enterprise.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
            <div className="font-bold text-cp-text-primary">Training Intensity Score (TIS)</div>
            <div className="font-mono text-[11px] text-cp-accent mt-0.5">TrainingTimesLastYear / (YearsAtCompany + 1.0)</div>
            <p className="text-[11px] text-cp-text-secondary mt-1">
              Annualized training participation normalized by tenure. Documented limitation: based on the single most recent year of training history.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-cp-bg-elevated border border-cp-border">
            <div className="font-bold text-cp-text-primary">Retention Opportunity Index</div>
            <div className="font-mono text-[11px] text-cp-accent mt-0.5">Composite Career Development Priority Score (0 - 100)</div>
            <p className="text-[11px] text-cp-text-secondary mt-1">
              Prioritizes proactive career-development and role-mobility interventions for active, performing talent before disengagement.
              <em> Note: This is an intervention prioritization index, not an attrition probability or financial return metric.</em>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
