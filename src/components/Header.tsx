import React from 'react';
import { Shield, Sparkles, Database, Settings, RefreshCw, Cpu, Activity } from 'lucide-react';
import { EngineSettings, ProviderStatus } from '../core/types.js';

interface HeaderProps {
  settings: EngineSettings | null;
  providers: ProviderStatus[];
  stats: { totalMatches: number; totalTeams: number; leagues: any[] };
  onOpenSettings: () => void;
  onOpenSeedModal: () => void;
  onQuickGenerate: (strategy: 'BANKER' | 'VALUE_HUNTER') => void;
  onProviderChange: (providerId: EngineSettings['activeProvider']) => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  providers,
  stats,
  onOpenSettings,
  onOpenSeedModal,
  onQuickGenerate,
  onProviderChange,
  isSyncing,
}) => {
  const activeProvider = providers.find((p) => p.id === settings?.activeProvider) || providers[0];

  return (
    <header className="sticky top-0 z-30 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg ring-1 ring-white/20">
            ⚽
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                BETPOISSON <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">ENGINE v2.4</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SQLite Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Statistical Football Prediction &amp; Expected Value (+EV) Accumulator Generator
            </p>
          </div>
        </div>

        {/* Quick Strategy Actions & Provider Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Banker & Value Hunter Buttons */}
          <div className="hidden md:flex items-center bg-slate-900/90 rounded-lg p-1 border border-slate-800">
            <button
              id="quick-banker-btn"
              onClick={() => onQuickGenerate('BANKER')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-200 hover:text-white hover:bg-emerald-600/20 hover:border-emerald-500/30 transition-all border border-transparent"
              title="Generate high probability Banker Accumulator"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Safe Banker</span>
            </button>
            <button
              id="quick-valhunter-btn"
              onClick={() => onQuickGenerate('VALUE_HUNTER')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-200 hover:text-white hover:bg-amber-600/20 hover:border-amber-500/30 transition-all border border-transparent"
              title="Generate positive Expected Value (+EV) Accumulator"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>+EV Hunter</span>
            </button>
          </div>

          {/* Hot Swappable Provider Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <select
              id="provider-selector-dropdown"
              value={settings?.activeProvider || 'FOOTBALL_DATA_CO_UK'}
              onChange={(e) => onProviderChange(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.name} ({p.latencyMs}ms)
                </option>
              ))}
            </select>
          </div>

          {/* Database Seed & Stats Pill */}
          <button
            id="open-seed-modal-btn"
            onClick={onOpenSeedModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
            title="Ingest / Parse Football-Data.co.uk CSV"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline font-mono">{stats.totalMatches}</span>
            <span className="text-slate-400">Matches</span>
          </button>

          {/* Settings Trigger */}
          <button
            id="open-settings-modal-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Engine Settings & Model Parameters"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
