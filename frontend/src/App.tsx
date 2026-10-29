import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { OverviewView } from './views/OverviewView';
import { ClustersView } from './views/ClustersView';
import { PromotionGapView } from './views/PromotionGapView';
import { RetentionOpportunitiesView } from './views/RetentionOpportunitiesView';
import { ManagerInsightsView } from './views/ManagerInsightsView';
import { EmployeeExplorerView } from './views/EmployeeExplorerView';
import { ReportsView } from './views/ReportsView';
import { DataManagementView } from './views/DataManagementView';
import { SettingsView } from './views/SettingsView';
import { LandingView } from './views/LandingView';
import { CommitteeView } from './views/CommitteeView';
import { ImpactEstimatorView } from './views/ImpactEstimatorView';
import { ConnectorsView } from './views/ConnectorsView';
import { TrustCenterView } from './views/TrustCenterView';
import { DesignSystemView } from './views/DesignSystemView';
import { FairnessAuditView } from './views/FairnessAuditView';
import { SuccessionView } from './views/SuccessionView';
import { GuidedTourModal } from './components/GuidedTourModal';

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

        {/* Dynamic Workspace Container */}
        <main className="flex-1 overflow-y-auto bg-cp-bg-app p-0 transition-colors">
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
