import React from 'react';
import { Shield, Sparkles, Menu } from 'lucide-react';
import { EngineSettings, ProviderStatus } from '../core/types.js';

interface HeaderProps {
  settings: EngineSettings | null;
  providers: ProviderStatus[];
  stats: { totalMatches: number; totalTeams: number; leagues: any[] };
  activeTab: 'FIXTURES' | 'TIPS';
  onSelectTab: (tab: 'FIXTURES' | 'TIPS') => void;
  onOpenSettings: () => void;
  onOpenSeedModal: () => void;
  onQuickGenerate: (strategy: 'BANKER' | 'VALUE_HUNTER') => void;
  onProviderChange: (providerId: EngineSettings['activeProvider']) => void;
  isSyncing: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onQuickGenerate,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-2.5 transition-colors shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-md shrink-0 border border-slate-700">
            <span className="font-mono text-emerald-400 font-extrabold">Q</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                QEMER PREDICTIONS
              </h1>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              Match Predictions &amp; Accumulator Slip
            </p>
          </div>
        </div>

        {/* Center Tab Navigation (Matches / Tips) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 shadow-inner">
          <button
            id="tab-fixtures-btn"
            onClick={() => onSelectTab('FIXTURES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'FIXTURES'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ⚽ Matches
          </button>
          <button
            id="tab-tips-btn"
            onClick={() => onSelectTab('TIPS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'TIPS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🔥 Tips</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </button>
        </div>

        {/* Action Controls & 3-line Menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Banker & Value Hunter */}
          <button
            id="quick-banker-btn"
            onClick={() => {
              onSelectTab('FIXTURES');
              onQuickGenerate('BANKER');
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
            title="Generate Safe Accumulator"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Safe Picks</span>
          </button>

          <button
            id="quick-valhunter-btn"
            onClick={() => {
              onSelectTab('FIXTURES');
              onQuickGenerate('VALUE_HUNTER');
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
            title="Generate Value Accumulator"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Top Value</span>
          </button>

          {/* 3-line Menu Icon to open Settings & Preferences */}
          <button
            id="open-settings-modal-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Menu & Settings"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

