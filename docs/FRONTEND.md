# CareerPath Intelligence — Frontend Architecture & Design System

## Executive Summary
This document specifies the enterprise frontend architecture of **CareerPath Intelligence**, an analytics platform designed for HR leaders, People Analytics teams, and talent review committees. The platform has been refined into a calm, trustworthy, and accessible application prioritizing clarity, honest data presentation, and strict human-in-the-loop governance.

---

## 1. Design Principles & Aesthetic Philosophy
1. **Calm, Restrained, and Legible Over Flashy**: Data and actionable insights come first; decoration never competes with talent decisions. Novelty themes (dot-matrix grid, neon accents) have been eliminated.
2. **Honesty in the UI**: Every metric derived from synthetic benchmark data, every proxy measure (such as the "Potential" proxy on the 9-box grid), and every suppressed cohort ($n < 10$) carries an explicit, visible disclosure.
3. **Sensitive-Data Awareness**: People data requires role-appropriate visibility. The platform enforces Role-Based Access Control (RBAC) across Enterprise Admin, HR Business Partner, People Analytics Analyst, and Talent Committee perspectives.
4. **Tabular Figures & Layout Stability**: All metrics, financial estimates, and table numbers enforce monospace tabular figures (`font-mono tabular-nums`) to prevent layout jitter during live updates.

---

## 2. Design System Tokens & Theming (`tokens.ts`)
All visual styling is governed by a single source of truth in `frontend/src/tokens.ts` and CSS custom variables (`--cp-*`):

### The 3 Core Themes:
- **Light (Default)**: Architectural clean white/slate paper clarity (`#F8FAFC` base, `#FFFFFF` surface, `#2563EB` navy accent, dark slate legible text).
- **Dark**: Refined charcoal slate (`#090D16` base, `#141B2B` surface, `#4F75FF` electric navy accent).
- **High Contrast**: WCAG AAA monochrome (`#000000` base, `#000000` surface, `#FFFFFF` text, `#38BDF8` sky focus/accent, solid 2px borders).

### The 5 Muted Accessible Accents:
1. `slate-navy` (`#2563EB`) — Primary enterprise focus
2. `forest-sage` (`#059669`) — Restrained growth & continuity
3. `warm-amber` (`#D97706`) — Proactive caution & advisory
4. `deep-indigo` (`#4F46E5`) — Deep talent calibration
5. `rosewood` (`#E11D48`) — High-urgency intervention priority

---

## 3. Information Architecture & Navigation
The sidebar is structured into 6 clear enterprise workspaces, filtered dynamically based on the signed-in role permissions:

```
├── Overview
│   ├── Workforce Overview (overview)
│   └── Reports & Briefings (reports)
├── Workforce Analytics
│   ├── Career Clusters & ML Archetypes (clusters)
│   ├── Promotion Gap Monitor (promotion-gap)
│   └── Manager Insights & Continuity (manager-insights)
├── Decisions
│   ├── Retention Opportunities (retention-opportunities) [Functional Urgent Badge]
│   ├── Succession Planning & Bench (succession)
│   ├── Talent Review Committee (committee)
│   ├── Impact & ROI Estimator (impact-estimator)
│   └── Employee Explorer (employees)
├── Governance & Trust
│   ├── Fairness & Bias Audit (fairness-audit)
│   └── Trust Center & Governance (trust-center)
├── Integrations
│   └── Connectors & Public API (connectors)
└── Administration
    ├── Data Management (data-management)
    ├── Living Design System Spec (design-system)
    └── Themes & Settings (settings)
```

### URL State Synchronization (`useUrlRoute.ts`):
- Navigation synchronizes bidirectionally with `window.location.hash` (`#/retention-opportunities`, `#/employees?id=PANW-1042`).
- Deep links and search parameters are fully shareable and reload-safe.
- Browser forward/back navigation (`popstate` / `hashchange`) is natively supported.

---

## 4. Shared UI Primitive Library (`components/ui/`)
- `Button` & `IconButton`: Accessible interactive triggers with loading states, variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), and WCAG focus rings.
- `Card`, `CardHeader`, `CardTitle`, `MetricCard`: Restrained metric presentations with trend badges and tabular numbers.
- `DataTable`: Accessible tabular container supporting sticky headers, column sorting, column visibility toggles, client/server pagination, row density adjustment, and CSV export.
- `ChartWrapper`: Shared chart container featuring title, plain-language executive takeaway line, units pill, sample size ($n$), and an accessible "View as Table" toggle.
- `FilterBar`: Accessible filter toolbar with debounced search, active filter count, and single-click reset.
- `Drawer` & `Modal`: Focus-trapped accessible dialogs with backdrop blur and escape key dismissal.
- `ErrorBoundary`: Route-level and global error catcher displaying a calm fallback screen with retry and navigation recovery.
- `ReauthModal`: In-place re-authentication modal that intercepts HTTP 401 (expired session) and 423 (account lockout) without resetting uncommitted work.

---

## 5. Sensitive Workflows Polish
1. **Talent Committee Presentation Mode**:
   - One-click Candidate Masking masks raw employee IDs, names, and protected markers.
   - Prominent "Pseudonymization Active" banner.
   - Confirmation modal required before logging Approve, Defer, or Reject decisions.
   - Required justification input with 15-character minimum counter.
2. **Fairness Audit Module**:
   - Plain-language executive summary of findings.
   - Collapsible panel explaining the EEOC Four-Fifths regulatory rule (29 C.F.R. § 1607.4).
   - Suppressed cohorts ($n < 10$) distinctly highlighted for privacy and statistical significance.
   - Explicit declaration that protected attributes are used solely for post-hoc auditing.
3. **Employee Explorer**:
   - Prominent "Human-in-the-Loop Decision Support Notice".
   - Plain-language score explanation waterfall with counterfactual transition path.
4. **Impact & ROI Estimator**:
   - Prominent "Illustrative — Based on User Inputs" badge.
   - Direct mathematical calculations based solely on user-entered assumptions.
   - Print executive briefing button (`window.print()`).
5. **Security & MFA Settings**:
   - TOTP Authenticator enrollment workflow (`/api/auth/mfa/setup`, `/api/auth/mfa/verify-enrollment`).
   - Single-use backup recovery codes display with Copy All and Download (.txt) buttons.
   - Active workstation inspection and remote session revocation.

---

## 6. Accessibility & WCAG 2.2 AA Compliance
- **Focus Rings**: Standardized visible 2px outline offsets on all interactive controls (`focus-visible:ring-2`).
- **Keyboard Navigation**:
  - `Ctrl + K` / `⌘ + K`: Global Command Palette
  - `?`: Keyboard Shortcuts Guide modal
  - `Alt + 1` to `Alt + 9`: Direct workspace navigation
  - `Esc`: Close open drawers, modals, and palettes
- **Reduced Motion**: System-level reduced motion support (`prefers-reduced-motion: reduce`) in `index.css`.
- **Automated Verification**: Playwright test suite (`e2e/test_critical_flows.spec.ts`) includes landmark validation and keyboard shortcut verification.

---

## 7. Performance & Bundle Metrics
- **Dynamic Route-Level Code Splitting**: Heavy views (`ClustersView`, `SuccessionView`, `RetentionOpportunitiesView`, `SettingsView`, etc.) are lazy-loaded via `React.lazy` and `Suspense`.
- **Bundle Breakdown**:
  - Initial JS (index + vendor): **107.95 kB gzipped** (well below the 250 kB budget).
  - Average route chunk: **3 to 10 kB gzipped**.
  - Production build time: **~420ms**.
