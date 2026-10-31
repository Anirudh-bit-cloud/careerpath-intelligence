import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  TrendingUp,
  Users2,
  Database,
  CheckCircle2,
  Clock,
  Briefcase,
  Terminal,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { BrandLogo } from '../components/brand/BrandLogo';

interface LandingViewProps {
  onEnterApp: () => void;
  onLaunchTour: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onEnterApp, onLaunchTour }) => {
  const { toast } = useToast();
  const addToast = (msg: string, type: 'success' | 'error' = 'success') =>
    type === 'error' ? toast.error(msg) : toast.success(msg);
  const [pilotModalOpen, setPilotModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pilotSubmitted, setPilotSubmitted] = useState(false);

  // Pilot Lead Form State
  const [formData, setFormData] = useState({
    full_name: '',
    work_email: '',
    company_name: '',
    company_size: '500 - 2,500',
    primary_interest: 'Mitigate quiet quitting & promotion stagnation',
    notes: ''
  });

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.work_email || !formData.company_name) {
      addToast('Please fill in your name, work email, and company name.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitPilotLead(formData);
      addToast('Pilot request received! Our enterprise team will follow up within 24 hours.', 'success');
      setPilotSubmitted(true);
    } catch (err: any) {
      addToast(err.message || 'Submission failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-cp-bg-app text-cp-text-primary overflow-y-auto">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-cp-border bg-cp-bg-surface/85 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <BrandLogo size={32} badgeText="ENTERPRISE SAAS" />
        <div className="flex items-center gap-3">
          <button
            onClick={onLaunchTour}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-cp-border text-cp-text-secondary hover:text-cp-text-primary hover:bg-cp-bg-hover transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cp-accent" />
            <span>Product Walkthrough</span>
          </button>
          <button
            onClick={() => setPilotModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-cp-accent/30 text-cp-accent bg-cp-accent/10 hover:bg-cp-accent/20 transition-colors"
          >
            Request Pilot
          </button>
          <button
            onClick={onEnterApp}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover shadow-xs transition-colors"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cp-accent/10 border border-cp-accent/25 text-cp-accent text-xs font-semibold tracking-wide">
          <Activity className="w-3.5 h-3.5" />
          <span>PROACTIVE TALENT RETENTION INTELLIGENCE</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-cp-text-primary max-w-4xl mx-auto leading-tight">
          Career progression analytics for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cp-accent to-indigo-400">
            proactive talent review.
          </span>
        </h1>

        <p className="text-base md:text-lg text-cp-text-secondary max-w-2xl mx-auto leading-relaxed">
          Eliminate promotion bottlenecks, surface quiet stagnation before high-performers resign,
          and conduct bias-resistant talent committees with explainable machine learning.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={onEnterApp}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-cp-accent text-white hover:bg-cp-accent-hover shadow-md transition-all transform hover:-translate-y-0.5"
          >
            <span>Open Interactive App</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPilotModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-cp-border bg-cp-bg-surface hover:bg-cp-bg-hover text-cp-text-primary transition-all"
          >
            <span>Request 30-Day Pilot</span>
          </button>
        </div>

        {/* Live Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border">
            <div className="text-2xl font-black text-cp-accent font-mono">100%</div>
            <div className="text-xs font-bold text-cp-text-primary mt-1">Explainable ML</div>
            <div className="text-[11px] text-cp-text-muted mt-0.5">Auditable scoring formulas with zero black-box weights</div>
          </div>
          <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border">
            <div className="text-2xl font-black text-emerald-400 font-mono">3 Presets</div>
            <div className="text-xs font-bold text-cp-text-primary mt-1">Industry Benchmarks</div>
            <div className="text-[11px] text-cp-text-muted mt-0.5">Cybersecurity, Healthcare & Financial Services cohorts</div>
          </div>
          <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border">
            <div className="text-2xl font-black text-cp-accent font-mono">k=4</div>
            <div className="text-xs font-bold text-cp-text-primary mt-1">Validated Clusters</div>
            <div className="text-[11px] text-cp-text-muted mt-0.5">Mathematically verified via Silhouette & Elbow Curve</div>
          </div>
          <div className="p-4 rounded-xl bg-cp-bg-surface border border-cp-border">
            <div className="text-2xl font-black text-indigo-400 font-mono">GDPR Art. 15</div>
            <div className="text-xs font-bold text-cp-text-primary mt-1">Data Rights Ready</div>
            <div className="text-[11px] text-cp-text-muted mt-0.5">Automated machine-readable subject access exports</div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="px-6 py-16 border-t border-cp-border bg-cp-bg-surface/50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <div className="text-xs uppercase font-bold tracking-wider text-cp-accent">Engineering Architecture</div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-cp-text-primary">
              Built for Enterprise Security and HR Decision Integrity
            </h2>
            <p className="text-xs md:text-sm text-cp-text-secondary max-w-xl mx-auto">
              No fabricated projections. Every metric is computed dynamically from active workforce records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-cp-bg-surface border border-cp-border space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-cp-text-primary">Multi-Dimensional Clustering</h3>
              <p className="text-xs text-cp-text-secondary leading-relaxed">
                Applies K-Means clustering and PCA dimensionality reduction over employee tenure, promotion gaps, and performance history to isolate flight-risk archetypes.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-cp-bg-surface border border-cp-border space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Users2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-cp-text-primary">Talent Committee Mode</h3>
              <p className="text-xs text-cp-text-secondary leading-relaxed">
                Features Presentation Mode with instant pseudonymization (<code className="text-cp-accent">CANDIDATE-9A4B</code>) to strip demographic and identifying cues during promotion calibration.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-cp-bg-surface border border-cp-border space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-cp-text-primary">Enterprise Security & Governance</h3>
              <p className="text-xs text-cp-text-secondary leading-relaxed">
                PBKDF2-HMAC-SHA256 password hashing, signed session tokens, HMAC-SHA256 webhooks, and append-only audit logging for every analytical query.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot Lead Modal */}
      {pilotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-cp-bg-surface border border-cp-border rounded-xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-cp-border">
              <div>
                <h3 className="text-base font-bold text-cp-text-primary">Request an Enterprise Pilot</h3>
                <p className="text-xs text-cp-text-muted mt-0.5">30-day proof-of-concept on your organizational dataset</p>
              </div>
              <button
                onClick={() => setPilotModalOpen(false)}
                className="text-cp-text-muted hover:text-cp-text-primary p-1"
              >
                ✕
              </button>
            </div>

            {pilotSubmitted ? (
              <div className="py-6 text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-cp-text-primary">Enterprise Pilot Request Confirmed</h3>
                  <p className="text-xs text-cp-text-secondary max-w-sm mx-auto leading-relaxed">
                    Thank you, <strong>{formData.full_name}</strong>. Our enterprise engineering team will provision an isolated sandbox workspace for <strong>{formData.company_name}</strong> within 24 hours.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-cp-bg-app border border-cp-border text-[11px] text-cp-text-muted font-mono">
                  {formData.work_email} · {formData.company_size}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPilotModalOpen(false);
                    setPilotSubmitted(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-cp-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Close & Continue Demo
                </button>
              </div>
            ) : (
            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cp-text-secondary">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-cp-text-secondary">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@enterprise.com"
                    value={formData.work_email}
                    onChange={(e) => setFormData({ ...formData, work_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-cp-text-secondary">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Acme Corp"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-cp-text-secondary">Workforce Headcount</label>
                  <select
                    value={formData.company_size}
                    onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
                  >
                    <option value="100 - 500">100 - 500 employees</option>
                    <option value="500 - 2,500">500 - 2,500 employees</option>
                    <option value="2,500 - 10,000">2,500 - 10,000 employees</option>
                    <option value="10,000+">10,000+ enterprise</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-cp-text-secondary">Primary Challenge</label>
                  <select
                    value={formData.primary_interest}
                    onChange={(e) => setFormData({ ...formData, primary_interest: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent"
                  >
                    <option value="Promotion Stagnation">Promotion Stagnation</option>
                    <option value="High-Performer Turnover">High-Performer Turnover</option>
                    <option value="Talent Review Bias">Talent Review Calibration</option>
                    <option value="L&D Program Alignment">L&D Alignment</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cp-text-secondary">Additional Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your HRIS ecosystem (Workday, SuccessFactors, etc.)..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-cp-bg-app border border-cp-border text-xs text-cp-text-primary focus:outline-none focus:border-cp-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cp-border">
                <button
                  type="button"
                  onClick={() => setPilotModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-cp-text-muted hover:text-cp-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-cp-accent text-white hover:bg-cp-accent-hover disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submitting ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
