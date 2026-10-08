import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { LiveScoresTicker } from './components/LiveScoresTicker.js';
import { MainTabBar } from './components/MainTabBar.js';
import { FixturesList } from './components/FixturesList.js';
import { PrebuiltAccumulators } from './components/PrebuiltAccumulators.js';
import { TipsSection } from './components/TipsSection.js';
import { MatchDetailModal } from './components/MatchDetailModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import {
  Fixture,
  EngineSettings,
  ProviderStatus,
  TrendingTipsData,
} from './core/types.js';
import { LiveScore } from './providers/types.js';
import { EngineService } from './services/engineService.js';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });
  const [activeTab, setActiveTab] = useState<'FIXTURES' | 'ACCAS' | 'TIPS'>('FIXTURES');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState<boolean>(true);
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'TOMORROW' | 'NEXT_3_DAYS' | 'THIS_WEEK' | 'ALL' | 'CUSTOM'>('ALL');
  const [marketChoiceFilter, setMarketChoiceFilter] = useState<'BEST_VALUE' | 'OVER_UNDER' | '1X2' | 'BTTS'>('BEST_VALUE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'WIREFRAME' | 'CARDS'>('WIREFRAME');
  const [isLeagueModalOpen, setIsLeagueModalOpen] = useState<boolean>(false);

  // Grounded Trending Tips state
  const [tipsData, setTipsData] = useState<TrendingTipsData | null>(null);
  const [isLoadingTips, setIsLoadingTips] = useState<boolean>(false);
  const [isRefreshingTips, setIsRefreshingTips] = useState<boolean>(false);

  const [settings, setSettings] = useState<EngineSettings | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [stats, setStats] = useState<{ totalMatches: number; totalTeams: number; leagues: any[] }>({
    totalMatches: 0,
    totalTeams: 0,
    leagues: [],
  });
  const [liveScores, setLiveScores] = useState<LiveScore[]>([]);

  // Modals
  const [selectedDetailFixture, setSelectedDetailFixture] = useState<Fixture | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // initialize theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Fetch initial fixtures and settings
  const fetchFixtures = useCallback(async () => {
    try {
      setIsLoadingFixtures(true);
      const data = await EngineService.getFixtures('ALL');
      setFixtures(data);
    } catch (e) {
      console.error('Failed to fetch fixtures:', e);
    } finally {
      setIsLoadingFixtures(false);
    }
  }, []);

  const fetchTips = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshingTips(true);
        const data = await EngineService.refreshTrendingTips();
        if (data) {
          setTipsData(data);
          showNotification('Updated latest Google Search grounded football trends!');
        }
      } else {
        setIsLoadingTips(true);
        const data = await EngineService.getTrendingTips();
        if (data) {
          setTipsData(data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch tips:', e);
    } finally {
      setIsLoadingTips(false);
      setIsRefreshingTips(false);
    }
  }, []);

  const fetchSettingsAndProviders = useCallback(async () => {
    try {
      const [sData, pData, statsData] = await Promise.all([
        EngineService.getSettings(),
        EngineService.getProviders(),
        EngineService.getStats(),
      ]);

      setSettings(sData);
      setProviders(pData);
      setStats(statsData);
    } catch (e) {
      console.error('Failed to fetch settings/providers/stats:', e);
    }
  }, []);

  const fetchLiveScores = useCallback(async () => {
    try {
      const scores = await EngineService.getLiveScores();
      setLiveScores(scores);
    } catch (e) {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    fetchSettingsAndProviders();
    fetchFixtures('ALL');
    fetchTips(false);
    fetchLiveScores();

    const interval = setInterval(fetchLiveScores, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectLeague = (league: string) => {
    setSelectedLeague(league);
  };

  const handleProviderChange = async (providerId: EngineSettings['activeProvider']) => {
    try {
      await EngineService.switchProvider(providerId);
      setSettings((prev) => (prev ? { ...prev, activeProvider: providerId } : null));
      showNotification(`Hot-swapped provider to ${providerId}`);
      fetchFixtures();
    } catch (e) {
      console.error('Failed to switch provider:', e);
    }
  };

  const handleSaveSettings = async (newSettings: Partial<EngineSettings>) => {
    try {
      const updated = await EngineService.updateSettings(newSettings);
      setSettings(updated);
      fetchFixtures();
      fetchSettingsAndProviders();
      showNotification('Poisson parameters updated!');
    } catch (e) {
      console.error('Failed to update settings:', e);
    }
  };

  const handleReSeedDatabase = async (customCsv?: string, reset = false) => {
    try {
      setIsSeeding(true);
      const res = await EngineService.seedDatabase(customCsv, reset);
      if (res.success) {
        setStats(res.stats);
        fetchFixtures();
        showNotification(res.message);
      }
    } catch (e) {
      console.error('Failed to seed database:', e);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070A0F] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 dark:bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-emerald-400 dark:text-white shrink-0" />
          <span className="truncate max-w-[260px]">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <Header
        settings={settings}
        providers={providers}
        stats={stats}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSeedModal={() => setIsSettingsOpen(true)}
        onSelectAccaCategory={() => setActiveTab('ACCAS')}
        onProviderChange={handleProviderChange}
        isSyncing={isLoadingFixtures}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Live In-Play Scores Ticker */}
      <LiveScoresTicker liveScores={liveScores} />

      {/* Main Tab Bar Placed Under Live Matches Bar */}
      <MainTabBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectedLeague={selectedLeague}
        onSelectLeague={setSelectedLeague}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        marketChoiceFilter={marketChoiceFilter}
        setMarketChoiceFilter={setMarketChoiceFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        setIsLeagueModalOpen={setIsLeagueModalOpen}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-2 sm:px-4 py-2.5 space-y-2.5">
        {activeTab === 'FIXTURES' && (
          <FixturesList
            fixtures={fixtures}
            isLoading={isLoadingFixtures}
            onSelectDetail={(f) => setSelectedDetailFixture(f)}
            selectedLeague={selectedLeague}
            onSelectLeague={setSelectedLeague}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            marketChoiceFilter={marketChoiceFilter}
            setMarketChoiceFilter={setMarketChoiceFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isLeagueModalOpen={isLeagueModalOpen}
            setIsLeagueModalOpen={setIsLeagueModalOpen}
          />
        )}

        {activeTab === 'ACCAS' && (
          <PrebuiltAccumulators
            fixtures={fixtures}
            settings={settings}
            onSelectDetail={(f) => setSelectedDetailFixture(f)}
          />
        )}

        {activeTab === 'TIPS' && (
          <TipsSection
            tipsData={tipsData}
            isLoading={isLoadingTips}
            isRefreshing={isRefreshingTips}
            onRefresh={() => fetchTips(true)}
          />
        )}
      </main>

      {/* Match Detail Modal (Poisson Heatmap & Radar) */}
      <MatchDetailModal
        fixture={selectedDetailFixture}
        onClose={() => setSelectedDetailFixture(null)}
      />

      {/* Settings & Ingestion Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        providers={providers}
        onSaveSettings={handleSaveSettings}
        onReSeedDatabase={handleReSeedDatabase}
        isSeeding={isSeeding}
        theme={theme}
        onToggleTheme={toggleTheme}
        onProviderChange={handleProviderChange}
      />
    </div>
  );
}

