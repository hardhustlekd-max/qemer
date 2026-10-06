import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { LiveScoresTicker } from './components/LiveScoresTicker.js';
import { FixturesList } from './components/FixturesList.js';
import { TipsSection } from './components/TipsSection.js';
import { AccaConfigurator } from './components/AccaConfigurator.js';
import { TicketSlip } from './components/TicketSlip.js';
import { MatchDetailModal } from './components/MatchDetailModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import {
  Fixture,
  AccumulatorSlip,
  AccaLeg,
  EngineSettings,
  ProviderStatus,
  MarketOption,
  TrendingTipsData,
} from './core/types.js';
import { LiveScore } from './providers/types.js';
import { AccaGenerationParams } from './core/accumulator.js';
import { EngineService } from './services/engineService.js';
import { TrendingUp, Sparkles, Shield, Target, Sliders, Dices } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'FIXTURES' | 'TIPS'>('FIXTURES');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState<boolean>(true);
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');

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

  // Accumulator Ticket Slip state
  const [activeSlip, setActiveSlip] = useState<AccumulatorSlip | null>(null);
  const [isGeneratingAcca, setIsGeneratingAcca] = useState<boolean>(false);
  const [showAccaBuilder, setShowAccaBuilder] = useState<boolean>(false);

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
  const fetchFixtures = useCallback(async (league = selectedLeague) => {
    try {
      setIsLoadingFixtures(true);
      const data = await EngineService.getFixtures(league);
      setFixtures(data);
    } catch (e) {
      console.error('Failed to fetch fixtures:', e);
    } finally {
      setIsLoadingFixtures(false);
    }
  }, [selectedLeague]);

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
    fetchFixtures(league);
  };

  // Generate Accumulator via API / EngineService
  const handleGenerateAcca = async (params: AccaGenerationParams) => {
    try {
      setIsGeneratingAcca(true);
      const slip = await EngineService.generateAccumulator(params);
      if (slip) {
        setActiveSlip(slip);
        showNotification(`Generated ${slip.name} with ${slip.legs.length} legs!`);
      }
    } catch (e) {
      console.error('Failed to generate accumulator:', e);
    } finally {
      setIsGeneratingAcca(false);
    }
  };

  const handleQuickGenerate = (strategy: 'BANKER' | 'VALUE_HUNTER') => {
    handleGenerateAcca({
      strategy,
      legCount: strategy === 'BANKER' ? 3 : 4,
      minProbability: strategy === 'BANKER' ? 0.72 : 0.55,
      stake: 10,
      dateFilter: 'TODAY',
    });
  };

  // Manual Add / Remove Leg to/from Ticket Slip
  const handleAddLegToSlip = (leg: AccaLeg) => {
    if (!activeSlip) {
      const newSlip: AccumulatorSlip = {
        id: `slip_${Date.now()}`,
        name: '🎯 Custom Slip Builder',
        strategy: 'CUSTOM',
        legs: [leg],
        combinedOdds: Number(leg.odds.toFixed(2)),
        combinedProb: Number(leg.probability.toFixed(4)),
        overallEV: Number((leg.probability * leg.odds - 1).toFixed(3)),
        suggestedStake: 10,
        stake: 10,
        potentialPayout: Number((10 * leg.odds).toFixed(2)),
        potentialProfit: Number((10 * leg.odds - 10).toFixed(2)),
        riskRating: 'LOW',
        createdAt: new Date().toISOString(),
        summaryText: `Match: ${leg.homeTeam} vs ${leg.awayTeam} | Pick: ${leg.selection} @ ${leg.odds}`,
      };
      setActiveSlip(newSlip);
      showNotification(`Added ${leg.selection} to slip`);
      return;
    }

    const existingIndex = activeSlip.legs.findIndex((l) => l.fixtureId === leg.fixtureId);
    let updatedLegs: AccaLeg[];

    if (existingIndex >= 0) {
      updatedLegs = [...activeSlip.legs];
      updatedLegs[existingIndex] = leg;
    } else {
      updatedLegs = [...activeSlip.legs, leg];
    }

    let totalOdds = 1.0;
    let totalProb = 1.0;
    for (const l of updatedLegs) {
      totalOdds *= l.odds;
      totalProb *= l.probability;
    }
    totalOdds = Number(totalOdds.toFixed(2));
    totalProb = Number(totalProb.toFixed(4));
    const overallEV = Number((totalProb * totalOdds - 1.0).toFixed(3));
    const payout = Number((activeSlip.stake * totalOdds).toFixed(2));

    setActiveSlip({
      ...activeSlip,
      legs: updatedLegs,
      combinedOdds: totalOdds,
      combinedProb: totalProb,
      overallEV,
      potentialPayout: payout,
      potentialProfit: Number((payout - activeSlip.stake).toFixed(2)),
    });

    showNotification(`Added ${leg.selection} to slip`);
  };

  const handleRemoveLeg = (fixtureId: string, marketKey: string) => {
    if (!activeSlip) return;
    const remaining = activeSlip.legs.filter(
      (l) => !(l.fixtureId === fixtureId && l.marketKey === marketKey)
    );

    if (remaining.length === 0) {
      setActiveSlip(null);
      return;
    }

    let totalOdds = 1.0;
    let totalProb = 1.0;
    for (const l of remaining) {
      totalOdds *= l.odds;
      totalProb *= l.probability;
    }
    totalOdds = Number(totalOdds.toFixed(2));
    totalProb = Number(totalProb.toFixed(4));
    const overallEV = Number((totalProb * totalOdds - 1.0).toFixed(3));
    const payout = Number((activeSlip.stake * totalOdds).toFixed(2));

    setActiveSlip({
      ...activeSlip,
      legs: remaining,
      combinedOdds: totalOdds,
      combinedProb: totalProb,
      overallEV,
      potentialPayout: payout,
      potentialProfit: Number((payout - activeSlip.stake).toFixed(2)),
    });
  };

  const handleClearSlip = () => {
    setActiveSlip(null);
  };

  const handleUpdateStake = (stake: number) => {
    if (!activeSlip) return;
    const payout = Number((stake * activeSlip.combinedOdds).toFixed(2));
    setActiveSlip({
      ...activeSlip,
      stake,
      potentialPayout: payout,
      potentialProfit: Number((payout - stake).toFixed(2)),
    });
  };

  const isLegInSlip = (fixtureId: string, marketKey: MarketOption['key']) => {
    if (!activeSlip) return false;
    return activeSlip.legs.some((l) => l.fixtureId === fixtureId && l.marketKey === marketKey);
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
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSeedModal={() => setIsSettingsOpen(true)}
        onQuickGenerate={handleQuickGenerate}
        onProviderChange={handleProviderChange}
        isSyncing={isLoadingFixtures}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Live In-Play Scores Ticker */}
      <LiveScoresTicker liveScores={liveScores} />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-5 space-y-5">
        {/* Collapsible Acca Configurator Panel */}
        {activeTab === 'FIXTURES' && showAccaBuilder && (
          <div className="animate-in fade-in slide-in-from-top-3">
            <AccaConfigurator
              onGenerate={handleGenerateAcca}
              isGenerating={isGeneratingAcca}
            />
          </div>
        )}

        {/* Central Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className={`${activeSlip && activeSlip.legs.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
            {activeTab === 'FIXTURES' ? (
              <FixturesList
                fixtures={fixtures}
                isLoading={isLoadingFixtures}
                onSelectDetail={(f) => setSelectedDetailFixture(f)}
                onAddLegToSlip={handleAddLegToSlip}
                isLegInSlip={isLegInSlip}
                selectedLeague={selectedLeague}
                onSelectLeague={handleSelectLeague}
                onGenerateAcca={handleGenerateAcca}
                onQuickGenerate={handleQuickGenerate}
                onToggleCustomSlip={() => setShowAccaBuilder(!showAccaBuilder)}
                isCustomSlipOpen={showAccaBuilder}
              />
            ) : (
              <TipsSection
                tipsData={tipsData}
                isLoading={isLoadingTips}
                isRefreshing={isRefreshingTips}
                onRefresh={() => fetchTips(true)}
                onAddLegToSlip={handleAddLegToSlip}
              />
            )}
          </div>

          {/* Side Ticket Slip if active */}
          {activeSlip && activeSlip.legs.length > 0 && (
            <div className="lg:col-span-4 sticky top-20 space-y-4 animate-in fade-in slide-in-from-right-2">
              <TicketSlip
                slip={activeSlip}
                onRemoveLeg={handleRemoveLeg}
                onClearSlip={handleClearSlip}
                onUpdateStake={handleUpdateStake}
              />
            </div>
          )}
        </div>
      </main>

      {/* Match Detail Modal (Poisson Heatmap & Radar) */}
      <MatchDetailModal
        fixture={selectedDetailFixture}
        onClose={() => setSelectedDetailFixture(null)}
        onAddLegToSlip={handleAddLegToSlip}
        isLegInSlip={isLegInSlip}
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

