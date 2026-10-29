import React, { useState } from 'react';
import {
  Palette,
  Layers,
  Type,
  Square,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
  Send,
  Download,
  Search,
  Plus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TOKENS } from '../tokens';
import {
  Button,
  IconButton,
  Input,
  Select,
  Checkbox,
  Switch,
  Tabs,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  MetricCard,
  DataTable,
  Drawer,
  Modal,
  Tooltip,
  PageHeader,
  FilterBar,
  EmptyState,
  ErrorState,
  Skeleton
} from '../components/ui';

export const DesignSystemView: React.FC = () => {
  const { theme, setTheme, density, setDensity, config, accent, setAccent } = useTheme();
  const [activeTab, setActiveTab] = useState<'tokens' | 'primitives' | 'accessibility'>('tokens');

  // Interactive primitive demos state
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoDrawerOpen, setDemoDrawerOpen] = useState(false);
  const [demoInputVal, setDemoInputVal] = useState('Senior Security Architect');
  const [demoSelectVal, setDemoSelectVal] = useState('engineering');
  const [demoCheckbox, setDemoCheckbox] = useState(true);
  const [demoSwitch, setDemoSwitch] = useState(false);
  const [demoSubTab, setDemoSubTab] = useState('overview');

  const demoTableData = [
    { id: 'PANW-1042', role: 'Security Architect', level: 'L5', tenure: 4.8, status: 'Urgent', rri: 84.2 },
    { id: 'PANW-1089', role: 'Research Scientist', level: 'L4', tenure: 3.2, status: 'Moderate', rri: 62.5 },
    { id: 'PANW-1120', role: 'Engineering Manager', level: 'L6', tenure: 6.1, status: 'Standard', rri: 31.0 },
    { id: 'PANW-1154', role: 'Cloud Consultant', level: 'L3', tenure: 2.4, status: 'Moderate', rri: 58.7 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        category="Living Design System"
        title="Enterprise Design Tokens & Shared Component Primitives"
        description="Single source of truth for color scales, typographic hierarchy, elevation, and consolidated WCAG 2.2 AA accessible component primitives."
        breadcrumbs={[
          { label: 'Administration' },
          { label: 'Design System & Living Spec' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'tokens' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('tokens')}
            >
              Tokens & Colors
            </Button>
            <Button
              variant={activeTab === 'primitives' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('primitives')}
            >
              Component Primitives
            </Button>
            <Button
              variant={activeTab === 'accessibility' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('accessibility')}
            >
              Accessibility & Standards
            </Button>
          </div>
        }
      />

      {/* ── TAB 1: DESIGN TOKENS ── */}
      {activeTab === 'tokens' && (
        <div className="space-y-6">
          {/* Themes Summary */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Three Consolidated Enterprise Themes</CardTitle>
                <CardDescription>
                  Restrained, accessible color palettes designed specifically for people analytics and compliance reviews.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(TOKENS.themes).map((t) => (
                  <div
                    key={t.key}
                    onClick={() => setTheme(t.key as any)}
                    className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
                      theme === t.key
                        ? 'border-cp-accent bg-cp-bg-elevated shadow-xs ring-1 ring-cp-accent'
                        : 'border-cp-border bg-cp-bg-surface hover:bg-cp-bg-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-cp-text-primary">{t.name}</span>
                      {theme === t.key && <Badge variant="accent" size="xs">Active</Badge>}
                    </div>
                    <p className="text-[11px] text-cp-text-muted leading-relaxed mb-3">
                      {t.description}
                    </p>
                    <div className="flex items-center gap-1.5 pt-2 border-t border-cp-border/50">
                      <div className="w-4 h-4 rounded border border-cp-border" style={{ backgroundColor: t.colors.bgApp }} title="Background" />
                      <div className="w-4 h-4 rounded border border-cp-border" style={{ backgroundColor: t.colors.bgSurface }} title="Surface" />
                      <div className="w-4 h-4 rounded border border-cp-border" style={{ backgroundColor: t.colors.bgElevated }} title="Elevated" />
                      <div className="w-4 h-4 rounded border border-cp-border" style={{ backgroundColor: t.colors.border }} title="Border" />
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: t.colors.textPrimary }} title="Text Primary" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Accent Color Palette */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>5 Muted Accessible Accents</CardTitle>
                <CardDescription>
                  Carefully calibrated tones meeting WCAG contrast thresholds against both light and dark backgrounds.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {Object.entries(TOKENS.accents).map(([key, acc]) => (
                  <div
                    key={key}
                    onClick={() => setAccent(key as any)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      accent === key
                        ? 'border-cp-accent bg-cp-bg-elevated ring-1 ring-cp-accent'
                        : 'border-cp-border bg-cp-bg-surface hover:bg-cp-bg-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: acc.light }} />
                      {accent === key && <Check className="w-3 h-3 text-cp-accent" />}
                    </div>
                    <div className="text-xs font-semibold text-cp-text-primary">{acc.name}</div>
                    <div className="text-[10px] font-mono text-cp-text-muted mt-1">{acc.light}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Spacing & Typography Scale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Typography Scale & Tabular Numerals</CardTitle>
                  <CardDescription>Consistent hierarchy with tabular numerals on all metrics and tables.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div className="flex items-baseline justify-between py-1 border-b border-cp-border/50">
                    <span className="text-2xl font-bold font-mono">32,450.00</span>
                    <span className="font-mono text-cp-text-muted">Display KPI (24px tabular)</span>
                  </div>
                  <div className="flex items-baseline justify-between py-1 border-b border-cp-border/50">
                    <span className="text-lg font-bold text-cp-text-primary">Executive Section Title</span>
                    <span className="font-mono text-cp-text-muted">Heading (18px)</span>
                  </div>
                  <div className="flex items-baseline justify-between py-1 border-b border-cp-border/50">
                    <span className="text-sm font-semibold text-cp-text-primary">Card Subtitle / Control</span>
                    <span className="font-mono text-cp-text-muted">Subheading (14px)</span>
                  </div>
                  <div className="flex items-baseline justify-between py-1 border-b border-cp-border/50">
                    <span className="text-xs text-cp-text-secondary">Standard body prose and descriptions</span>
                    <span className="font-mono text-cp-text-muted">Body (12px)</span>
                  </div>
                  <div className="flex items-baseline justify-between py-1">
                    <span className="text-[11px] font-mono text-cp-text-muted">Micro metadata and disclosures</span>
                    <span className="font-mono text-cp-text-muted">Caption (11px)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Elevation & Corner Radii</CardTitle>
                  <CardDescription>Predictable, consistent geometry across cards, inputs, and modals.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-sm border border-cp-border bg-cp-bg-surface text-center">
                    <span className="font-mono text-cp-text-muted">radius.sm (4px)</span>
                    <p className="text-[10px] text-cp-text-secondary mt-1">Badges, checkmarks</p>
                  </div>
                  <div className="p-3 rounded-md border border-cp-border bg-cp-bg-surface text-center">
                    <span className="font-mono text-cp-text-muted">radius.md (6px)</span>
                    <p className="text-[10px] text-cp-text-secondary mt-1">Buttons, inputs, selects</p>
                  </div>
                  <div className="p-3 rounded-lg border border-cp-border bg-cp-bg-surface text-center">
                    <span className="font-mono text-cp-text-muted">radius.lg (8px)</span>
                    <p className="text-[10px] text-cp-text-secondary mt-1">Standard cards, modals</p>
                  </div>
                  <div className="p-3 rounded-full border border-cp-border bg-cp-bg-surface text-center">
                    <span className="font-mono text-cp-text-muted">radius.full</span>
                    <p className="text-[10px] text-cp-text-secondary mt-1">Switches, pills, avatars</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: COMPONENT PRIMITIVES ── */}
      {activeTab === 'primitives' && (
        <div className="space-y-6">
          {/* Buttons & Icons */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Buttons & Icon Buttons</CardTitle>
                <CardDescription>Primary, secondary, outline, ghost, and danger variants with accessible focus rings.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Primary Button
                </Button>
                <Button variant="secondary" size="sm">
                  Secondary Button
                </Button>
                <Button variant="outline" size="sm">
                  Outline Button
                </Button>
                <Button variant="ghost" size="sm">
                  Ghost Button
                </Button>
                <Button variant="danger" size="sm">
                  Danger Button
                </Button>
                <Button variant="primary" size="sm" isLoading>
                  Loading
                </Button>
                <IconButton aria-label="Search" size="sm" variant="outline">
                  <Search className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton aria-label="Export" size="sm" variant="secondary">
                  <Download className="w-3.5 h-3.5" />
                </IconButton>
              </div>
            </CardContent>
          </Card>

          {/* Form Controls */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Form Controls: Input, Select, Checkbox, Switch</CardTitle>
                <CardDescription>Labeled, accessible inputs with helper text and validation states.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Role Title"
                  value={demoInputVal}
                  onChange={(e) => setDemoInputVal(e.target.value)}
                  helperText="Primary job title in HRIS"
                />

                <Select
                  label="Department"
                  value={demoSelectVal}
                  onChange={(e) => setDemoSelectVal(e.target.value)}
                  options={[
                    { value: 'engineering', label: 'Engineering & R&D' },
                    { value: 'sales', label: 'Global Sales' },
                    { value: 'product', label: 'Product & Design' },
                  ]}
                />

                <div className="space-y-2 pt-2">
                  <Checkbox
                    label="Anonymize identifiers"
                    description="Mitigate unconscious bias"
                    checked={demoCheckbox}
                    onChange={(e) => setDemoCheckbox(e.target.checked)}
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Switch
                    label="Automated digests"
                    description="Weekly Slack alert"
                    checked={demoSwitch}
                    onChange={setDemoSwitch}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Badges & Metric Cards */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Status Badges & Metric Cards with Synthetic Disclosures</CardTitle>
                <CardDescription>Visible status pills and metric displays with mandatory honesty disclosures.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="urgent" dot>Urgent Review (RRI &ge; 70)</Badge>
                <Badge variant="warning" dot>Moderate Stagnation</Badge>
                <Badge variant="success" dot>Retained at 90 Days</Badge>
                <Badge variant="info">Four-Fifths Compliant</Badge>
                <Badge variant="neutral">Bench: 1-2 Years</Badge>
                <Badge variant="accent">9-Box Key Talent</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <MetricCard
                  label="Workforce Active Index"
                  value="1,470"
                  subtext="Synchronized from HRIS roster"
                  disclosure={{ type: 'synthetic', tooltip: 'Benchmark dataset' }}
                />
                <MetricCard
                  label="Urgent Flight Risk"
                  value="213"
                  trend={{ value: '+14% vs benchmark', isPositive: false }}
                  subtext="Stagnation gap exceeding dwell"
                  disclosure={{ type: 'proxy', tooltip: 'Derived from tenure dwell & training engagement' }}
                />
                <MetricCard
                  label="Disparate Impact Ratio"
                  value="0.88x"
                  trend={{ value: 'Above 80% threshold', isPositive: true }}
                  subtext="Gender cohort parity verified"
                  disclosure={{ type: 'benchmark', tooltip: 'EEOC Four-Fifths compliance' }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Table Primitive */}
          <Card padding="none">
            <div className="p-4 border-b border-cp-border">
              <CardTitle>Standard DataTable Primitive</CardTitle>
              <CardDescription>Sticky header, column sorting, column visibility toggle, and CSV export.</CardDescription>
            </div>
            <DataTable
              data={demoTableData}
              keyExtractor={(r) => r.id}
              columns={[
                { key: 'id', header: 'Token ID', sortable: true },
                { key: 'role', header: 'Role Title', sortable: true },
                { key: 'level', header: 'Level', sortable: true },
                { key: 'tenure', header: 'Tenure (Yrs)', sortable: true, align: 'right', render: (r) => `${r.tenure} yrs` },
                {
                  key: 'status',
                  header: 'Priority',
                  render: (r) => (
                    <Badge variant={r.status === 'Urgent' ? 'urgent' : r.status === 'Moderate' ? 'warning' : 'neutral'} size="xs" dot>
                      {r.status}
                    </Badge>
                  )
                },
                { key: 'rri', header: 'Retention Risk Index', sortable: true, align: 'right', render: (r) => `${r.rri}` },
              ]}
              pageSize={5}
            />
          </Card>

          {/* Overlays: Modal & Drawer Triggers */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Overlays: Accessible Modals & Slide-Out Drawers</CardTitle>
                <CardDescription>Keyboard navigable (ESC to close), focus trapped, backdrop blurred dialogs.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => setDemoModalOpen(true)}>
                  Open Demo Modal
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setDemoDrawerOpen(true)}>
                  Open Demo Drawer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 3: ACCESSIBILITY & STANDARDS ── */}
      {activeTab === 'accessibility' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>WCAG 2.2 AA Conformance Checklist</CardTitle>
                <CardDescription>
                  Rigorous accessibility standards implemented throughout all views and primitives.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-3.5 rounded-lg border border-cp-border bg-cp-bg-surface flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-cp-text-primary block">1. Color Contrast & High Contrast Mode:</strong>
                    <span className="text-cp-text-secondary">
                      All body text and data cells achieve at least 4.5:1 contrast against surface backgrounds. The dedicated High Contrast theme achieves &ge; 7:1 (WCAG AAA) with solid 1px visual borders.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-cp-border bg-cp-bg-surface flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-cp-text-primary block">2. Keyboard Operability & Focus Rings:</strong>
                    <span className="text-cp-text-secondary">
                      Every interactive control (buttons, tab triggers, modal dismissals, drawer close actions) provides an unmistakable 2px focus ring (`focus-visible:ring-cp-accent`) and responds to Enter, Space, and Escape keys.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-cp-border bg-cp-bg-surface flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-cp-text-primary block">3. Screen Reader Semantics & ARIA Landmarks:</strong>
                    <span className="text-cp-text-secondary">
                      Modals and Drawers use `role="dialog"` with `aria-modal="true"`. Tables declare proper `thead`, `tbody`, `th[scope="col"]`. Tab bars use `role="tablist"` with `role="tab"` and `aria-selected`.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-cp-border bg-cp-bg-surface flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-cp-text-primary block">4. Reduced Motion Support:</strong>
                    <span className="text-cp-text-secondary">
                      The CSS system honors `@media (prefers-reduced-motion: reduce)` by clamping transition and animation durations to 0.01ms.
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Demo Modal Instance ── */}
      <Modal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="Demonstration Accessible Modal"
        description="Focused on ethical talent calibrations with keyboard accessibility."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDemoModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setDemoModalOpen(false)}>
              Confirm Action
            </Button>
          </>
        }
      >
        <p>
          This modal traps focus, closes when pressing the <code>Escape</code> key or clicking outside, and implements standard WAI-ARIA dialog attributes.
        </p>
      </Modal>

      {/* ── Demo Drawer Instance ── */}
      <Drawer
        isOpen={demoDrawerOpen}
        onClose={() => setDemoDrawerOpen(false)}
        title="Candidate Profile Diagnostic Drawer"
        subtitle="Detailed tenure, benchmark dwell, and waterfall score breakdown"
        footer={
          <Button variant="outline" size="sm" onClick={() => setDemoDrawerOpen(false)}>
            Close Drawer
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-md bg-cp-bg-elevated border border-cp-border">
            <span className="text-[10px] uppercase font-bold text-cp-text-muted">Anonymized Token</span>
            <div className="text-sm font-bold font-mono text-cp-text-primary">PANW-1042</div>
          </div>
          <p className="leading-relaxed">
            Standard drawer slide-over with clean typography and responsive layout.
          </p>
        </div>
      </Drawer>
    </div>
  );
};
