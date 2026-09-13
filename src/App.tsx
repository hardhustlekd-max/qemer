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
import { Shield, Sparkles, TrendingUp, Cpu, Database, RefreshCw, BarChart } from 'lucide-react';

export default function App() {
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

  // Modals
  const [selectedDetailFixture, setSelectedDetailFixture] = useState<Fixture | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch initial fixtures and settings
  const fetchFixtures = useCallback(async (league = selectedLeague) => {
    try {
      setIsLoadingFixtures(true);
      const url = league !== 'ALL' ? `/api/fixtures?league=${league}` : '/api/fixtures';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setFixtures(data.fixtures);
      }
    } catch (e) {
      console.error('Failed to fetch fixtures:', e);
    } finally {
      setIsLoadingFixtures(false);
    }
  }, [selectedLeague]);

  const fetchSettingsAndProviders = useCallback(async () => {
    try {
      const [sRes, pRes, statsRes] = await Promise.all([
        fetch('/api/settings').then((r) => r.json()),
        fetch('/api/providers').then((r) => r.json()),
        fetch('/api/stats').then((r) => r.json()),
      ]);

      if (sRes.success) setSettings(sRes.settings);
      if (pRes.success) setProviders(pRes.providers);
      if (statsRes.success) setStats(statsRes.stats);
    } catch (e) {
      console.error('Failed to fetch settings/providers/stats:', e);
    }
  }, []);

  const fetchLiveScores = useCallback(async () => {
    try {
      const res = await fetch('/api/providers/live-scores');
      const data = await res.json();
      if (data.success) {
        setLiveScores(data.scores || []);
      }
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

  // Generate Accumulator via API
  const handleGenerateAcca = async (params: AccaGenerationParams) => {
    try {
      setIsGeneratingAcca(true);
      const res = await fetch('/api/accumulator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success && data.slip) {
        setActiveSlip(data.slip);
        showNotification(`Generated ${data.slip.name} with ${data.slip.legs.length} legs!`);
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
      // Initialize new slip
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

    // Check if fixture already in slip
    const existingIndex = activeSlip.legs.findIndex((l) => l.fixtureId === leg.fixtureId);
    let updatedLegs: AccaLeg[];

    if (existingIndex >= 0) {
      // Replace existing leg from same fixture
      updatedLegs = [...activeSlip.legs];
      updatedLegs[existingIndex] = leg;
    } else {
      updatedLegs = [...activeSlip.legs, leg];
    }

    // Recalculate combined stats
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

  // Provider Hot Swapping
  const handleProviderChange = async (providerId: EngineSettings['activeProvider']) => {
    try {
      const res = await fetch('/api/providers/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) => (prev ? { ...prev, activeProvider: providerId } : null));
        showNotification(`Hot-swapped to ${data.activeProvider}`);
        fetchFixtures();
      }
    } catch (e) {
      console.error('Failed to switch provider:', e);
    }
  };

  // Save Settings
  const handleSaveSettings = async (newSettings: Partial<EngineSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        fetchFixtures();
        fetchSettingsAndProviders();
      }
    } catch (e) {
      console.error('Failed to update settings:', e);
    }
  };

  // Re-Seed Database
  const handleReSeedDatabase = async (customCsv?: string, reset = false) => {
    try {
      setIsSeeding(true);
      const res = await fetch('/api/stats/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customCsv, reset }),
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        fetchFixtures();
        showNotification(data.message);
      }
    } catch (e) {
      console.error('Failed to seed database:', e);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xl shadow-black/50 border border-emerald-400 flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <span>✨</span>
          <span>{notification.message}</span>
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
      />

      {/* Live In-Play Scores Ticker */}
      <LiveScoresTicker
        liveScores={liveScores}
        providerName={providers.find((p) => p.id === settings?.activeProvider)?.name || 'Provider'}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {/* Top Summary Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Poisson Distribution Mathematical AI Model
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-800/40">
                  Rolling Window: {settings?.rollingMatchWindow || 15} Matches
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Evaluating attack/defense ratings, expected goals ($xG$), and +EV closing value edges against bookmakers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-center">
              <div className="text-slate-400 text-[10px]">Indexed Matches</div>
              <div className="text-white font-bold text-sm">{stats.totalMatches}</div>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center">
              <div className="text-slate-400 text-[10px]">Active Leagues</div>
              <div className="text-emerald-400 font-bold text-sm">{stats.leagues.length || 4}</div>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center">
              <div className="text-slate-400 text-[10px]">EV Threshold</div>
              <div className="text-amber-400 font-bold text-sm">+{((settings?.minEVThreshold || 1.10) * 100 - 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Center Column: Fixtures List & Predictions (7 or 8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-4">
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

          {/* Right Column: Acca Configurator & Ticket Slip (4 cols on desktop) */}
          <div className="lg:col-span-4 space-y-5 sticky top-20">
            {/* Acca Configurator Widget */}
            <AccaConfigurator
              onGenerate={handleGenerateAcca}
              isGenerating={isGeneratingAcca}
            />

            {/* Ticket Slip Display */}
            <TicketSlip
              slip={activeSlip}
              onRemoveLeg={handleRemoveLeg}
              onClearSlip={handleClearSlip}
              onUpdateStake={handleUpdateStake}
            />
          </div>
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
