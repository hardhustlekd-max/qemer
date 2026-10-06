import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { LiveScoresTicker } from './components/LiveScoresTicker.js';
import { FixturesList } from './components/FixturesList.js';
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
} from './core/types.js';
import { LiveScore } from './providers/types.js';
import { AccaGenerationParams } from './core/accumulator.js';
import { EngineService } from './services/engineService.js';
import { TrendingUp, Sparkles, Shield, Target, Sliders, Dices } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState<boolean>(true);
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');

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
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSeedModal={() => setIsSettingsOpen(true)}
        onQuickGenerate={handleQuickGenerate}
        onProviderChange={handleProviderChange}
        isSyncing={isLoadingFixtures}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Live In-Play Scores Ticker */}
      <LiveScoresTicker
        liveScores={liveScores}
        providerName={providers.find((p) => p.id === settings?.activeProvider)?.name || 'Provider'}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-5 space-y-5">
        {/* Top Wireframe Quick Generation Action Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                handleGenerateAcca({
                  strategy: 'VALUE_HUNTER',
                  legCount: 10,
                  minProbability: 0.50,
                  stake: 10,
                });
              }}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            >
              <span>🔥</span>
              <span>Today's Slip</span>
            </button>

            <button
              onClick={() => handleQuickGenerate('BANKER')}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Safe Picks</span>
            </button>

            <button
              onClick={() => handleQuickGenerate('VALUE_HUNTER')}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Top Value</span>
            </button>
          </div>

          <button
            onClick={() => setShowAccaBuilder(!showAccaBuilder)}
            className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            <span>{showAccaBuilder ? 'Hide Custom' : 'Custom Slip'}</span>
          </button>
        </div>

        {/* Collapsible Acca Configurator Panel */}
        {showAccaBuilder && (
          <div className="animate-in fade-in slide-in-from-top-3">
            <AccaConfigurator
              onGenerate={handleGenerateAcca}
              isGenerating={isGeneratingAcca}
            />
          </div>
        )}

        {/* Central Wireframe View Matching Attachment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className={`${activeSlip && activeSlip.legs.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
            <FixturesList
              fixtures={fixtures}
              isLoading={isLoadingFixtures}
              onSelectDetail={(f) => setSelectedDetailFixture(f)}
              onAddLegToSlip={handleAddLegToSlip}
              isLegInSlip={isLegInSlip}
              selectedLeague={selectedLeague}
              onSelectLeague={handleSelectLeague}
            />
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
      />
    </div>
  );
}

