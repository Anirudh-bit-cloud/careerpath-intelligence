import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { OverviewView } from './views/OverviewView';
// Route-level code-splitting & lazy evaluation
const ClustersView = React.lazy(() => import('./views/ClustersView').then(m => ({ default: m.ClustersView })));
const PromotionGapView = React.lazy(() => import('./views/PromotionGapView').then(m => ({ default: m.PromotionGapView })));
const TrendsView = React.lazy(() => import('./views/TrendsView').then(m => ({ default: m.TrendsView })));
const RetentionOpportunitiesView = React.lazy(() => import('./views/RetentionOpportunitiesView').then(m => ({ default: m.RetentionOpportunitiesView })));
const ManagerInsightsView = React.lazy(() => import('./views/ManagerInsightsView').then(m => ({ default: m.ManagerInsightsView })));
const EmployeeExplorerView = React.lazy(() => import('./views/EmployeeExplorerView').then(m => ({ default: m.EmployeeExplorerView })));
const ReportsView = React.lazy(() => import('./views/ReportsView').then(m => ({ default: m.ReportsView })));
const DataManagementView = React.lazy(() => import('./views/DataManagementView').then(m => ({ default: m.DataManagementView })));
const SettingsView = React.lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));
const LandingView = React.lazy(() => import('./views/LandingView').then(m => ({ default: m.LandingView })));
const CommitteeView = React.lazy(() => import('./views/CommitteeView').then(m => ({ default: m.CommitteeView })));
const ImpactEstimatorView = React.lazy(() => import('./views/ImpactEstimatorView').then(m => ({ default: m.ImpactEstimatorView })));
const ConnectorsView = React.lazy(() => import('./views/ConnectorsView').then(m => ({ default: m.ConnectorsView })));
const TrustCenterView = React.lazy(() => import('./views/TrustCenterView').then(m => ({ default: m.TrustCenterView })));
const DesignSystemView = React.lazy(() => import('./views/DesignSystemView').then(m => ({ default: m.DesignSystemView })));
const FairnessAuditView = React.lazy(() => import('./views/FairnessAuditView').then(m => ({ default: m.FairnessAuditView })));
const SuccessionView = React.lazy(() => import('./views/SuccessionView').then(m => ({ default: m.SuccessionView })));
const MyTeamView = React.lazy(() => import('./views/MyTeamView').then(m => ({ default: m.MyTeamView })));

const ViewLoadingFallback = () => (
  <div className="p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
    <div className="h-8 bg-cp-bg-elevated rounded-lg w-1/4"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-cp-bg-elevated rounded-xl"></div>
      ))}
    </div>
    <div className="h-96 bg-cp-bg-elevated rounded-xl"></div>
  </div>
);
import { GuidedTourModal } from './components/GuidedTourModal';
import { FirstRunChecklist } from './components/FirstRunChecklist';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ReauthModal } from './components/ReauthModal';

import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CommandPalette } from './components/CommandPalette';
import { ShortcutsModal } from './components/ShortcutsModal';
import { useUrlRoute } from './utils/useUrlRoute';
import { api } from './services/api';
import { DatasetMetadata, ExecutiveOverview, CareerClustersData } from './types';
import { ShieldAlert } from 'lucide-react';
import { Button } from './components/ui';

function AppContent() {
  const { currentTab, params, navigate } = useUrlRoute('overview');
  const { role, canAccessTab } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<DatasetMetadata | null>(null);
  const [overviewData, setOverviewData] = useState<ExecutiveOverview | null>(null);
  const [clustersData, setClustersData] = useState<CareerClustersData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [loadingClusters, setLoadingClusters] = useState<boolean>(true);

  // Command Palette & Keyboard Shortcuts modals
  const [cmdOpen, setCmdOpen] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [tourOpen, setTourOpen] = useState<boolean>(false);

  // Re-authentication & Lockout Resilience
  const [reauthOpen, setReauthOpen] = useState<boolean>(false);
  const [lockoutMsg, setLockoutMsg] = useState<string | null>(null);

  // Global data-version counter
  const [dataVersion, setDataVersion] = useState<number>(0);

  const loadInitialData = useCallback(async () => {
    setLoadingOverview(true);
    setLoadingClusters(true);
    try {
      const [meta, overview, clusters] = await Promise.all([
        api.getMetadata(),
        api.getOverview(),
        api.getClusters()
      ]);
      setMetadata(meta);
      setOverviewData(overview);
      setClustersData(clusters);
    } catch (e) {
      console.error('Failed to load initial analytics:', e);
    } finally {
      setLoadingOverview(false);
      setLoadingClusters(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Auth resilience listeners for 401 (expired) and 423 (lockout)
  useEffect(() => {
    const handleAuthExpired = () => {
      setLockoutMsg(null);
      setReauthOpen(true);
    };

    const handleAuthLockout = (e: any) => {
      setLockoutMsg(e.detail?.detail || 'Account temporarily locked out due to multiple failed login attempts.');
      setReauthOpen(true);
    };

    window.addEventListener('cp:auth:expired', handleAuthExpired);
    window.addEventListener('cp:auth:lockout', handleAuthLockout);

    return () => {
      window.removeEventListener('cp:auth:expired', handleAuthExpired);
      window.removeEventListener('cp:auth:lockout', handleAuthLockout);
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K for command menu
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
        return;
      }

      // Check if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // ? for shortcuts help
      if (!isInput && e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      // Alt+Number navigation
      if (e.altKey && !isNaN(Number(e.key))) {
        const num = Number(e.key);
        const tabMap: Record<number, string> = {
          1: 'overview',
          2: 'clusters',
          3: 'promotion-gap',
          4: 'retention-opportunities',
          5: 'manager-insights',
          6: 'employees',
          7: 'reports',
          8: 'data-management',
          9: 'settings'
        };
        if (tabMap[num]) {
          e.preventDefault();
          navigate(tabMap[num]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Called after upload or reset
  const handleRefreshData = useCallback(async () => {
    await loadInitialData();
    setDataVersion((v) => v + 1);
  }, [loadInitialData]);

  const handleSwitchPreset = async (preset: 'cyber' | 'healthcare' | 'finance') => {
    try {
      await api.switchIndustryPreset(preset);
      await handleRefreshData();
    } catch (e) {
      console.error('Failed to switch preset:', e);
    }
  };

  const handleSelectEmployee = (empId: string) => {
    navigate('employees', { id: empId });
  };

  const hasAccess = canAccessTab(currentTab);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cp-bg-app text-cp-text-primary font-sans antialiased transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => navigate(tab)}
        metadata={metadata}
        urgentCount={overviewData?.kpis.urgent_retention_opportunities || 0}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <TopNav
          currentTab={currentTab}
          metadata={metadata}
          onSelectEmployee={handleSelectEmployee}
          urgentCount={overviewData?.kpis.urgent_retention_opportunities || 0}
          onNavigateTab={(tab) => navigate(tab)}
          onOpenCommandPalette={() => setCmdOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onSwitchPreset={handleSwitchPreset}
          onLaunchTour={() => setTourOpen(true)}
        />

        {/* Dynamic Workspace Container wrapped in resilient Error Boundary */}
        <main className="flex-1 overflow-y-auto bg-cp-bg-app p-0 transition-colors">
          <ErrorBoundary key={currentTab} fallbackTitle={`Unable to render ${currentTab} view`}>
            <React.Suspense fallback={<ViewLoadingFallback />}>
            {!hasAccess ? (
              <div className="p-12 max-w-xl mx-auto text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-cp-text-primary">Restricted by Role Permissions</h2>
                <p className="text-xs text-cp-text-muted leading-relaxed">
                  Your currently selected persona role (<span className="font-semibold text-cp-text-primary uppercase">{role}</span>) does not have authorization to view this workspace. Switch to Enterprise Admin or an authorized role via the profile menu.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <Button variant="primary" onClick={() => navigate('overview')}>
                    Return to Overview
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {currentTab === 'welcome' && (
                  <LandingView
                    onEnterApp={() => navigate('overview')}
                    onLaunchTour={() => setTourOpen(true)}
                  />
                )}

                {currentTab === 'overview' && (
                  <OverviewView
                    data={overviewData}
                    loading={loadingOverview}
                    onNavigateTab={(tab) => navigate(tab)}
                  />
                )}

                {currentTab === 'clusters' && (
                  <ClustersView
                    data={clustersData}
                    loading={loadingClusters}
                    onSelectEmployee={handleSelectEmployee}
                  />
                )}

                {currentTab === 'promotion-gap' && (
                  <PromotionGapView
                    onSelectEmployee={handleSelectEmployee}
                    dataVersion={dataVersion}
                  />
                )}

                {currentTab === 'trends' && (
                  <TrendsView dataVersion={dataVersion} />
                )}

                {currentTab === 'my-team' && (
                  <MyTeamView />
                )}

                {currentTab === 'retention-opportunities' && (
                  <RetentionOpportunitiesView
                    onSelectEmployee={handleSelectEmployee}
                    dataVersion={dataVersion}
                  />
                )}

                {currentTab === 'manager-insights' && (
                  <ManagerInsightsView dataVersion={dataVersion} />
                )}

                {currentTab === 'committee' && (
                  <CommitteeView onSelectEmployee={handleSelectEmployee} />
                )}

                {currentTab === 'fairness-audit' && (
                  <FairnessAuditView />
                )}

                {currentTab === 'succession' && (
                  <SuccessionView />
                )}

                {currentTab === 'impact-estimator' && (
                  <ImpactEstimatorView />
                )}

                {currentTab === 'employees' && (
                  <EmployeeExplorerView
                    initialEmployeeId={params.id || null}
                    onClearInitialEmployee={() => navigate('employees')}
                    dataVersion={dataVersion}
                  />
                )}

                {currentTab === 'reports' && (
                  <ReportsView
                    overviewData={overviewData}
                    metadata={metadata}
                  />
                )}

                {currentTab === 'connectors' && (
                  <ConnectorsView />
                )}

                {currentTab === 'trust-center' && (
                  <TrustCenterView />
                )}

                {currentTab === 'design-system' && (
                  <DesignSystemView />
                )}

                {currentTab === 'data-management' && (
                  <DataManagementView
                    metadata={metadata}
                    onRefreshData={handleRefreshData}
                  />
                )}

                {currentTab === 'settings' && (
                  <SettingsView />
                )}
              </>
            )}
                      </React.Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Spotlight Product Walkthrough Tour */}
      <GuidedTourModal
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        onNavigateTab={(tab) => navigate(tab)}
      />

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNavigate={(tab) => navigate(tab)}
        onSelectEmployee={handleSelectEmployee}
      />

      {/* Global Keyboard Shortcuts Modal (?) */}
      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

            {/* First-Run Onboarding Checklist Widget */}
      <FirstRunChecklist
        currentTab={currentTab}
        onNavigateTab={(tab) => navigate(tab)}
      />

      {/* In-Place Session Re-authentication Modal (401 & 423) */}
      <ReauthModal
        isOpen={reauthOpen}
        onClose={() => setReauthOpen(false)}
        lockoutMessage={lockoutMsg}
        onSuccess={() => {
          handleRefreshData();
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
