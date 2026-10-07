import React from 'react';
import { Shield, Sparkles, Menu, Zap } from 'lucide-react';
import { EngineSettings, ProviderStatus } from '../core/types.js';

interface HeaderProps {
  settings: EngineSettings | null;
  providers: ProviderStatus[];
  stats: { totalMatches: number; totalTeams: number; leagues: any[] };
  activeTab: 'FIXTURES' | 'ACCAS' | 'TIPS';
  onSelectTab: (tab: 'FIXTURES' | 'ACCAS' | 'TIPS') => void;
  onOpenSettings: () => void;
  onOpenSeedModal: () => void;
  onSelectAccaCategory?: (cat: 'BANKER' | 'VALUE_HUNTER') => void;
  onProviderChange: (providerId: EngineSettings['activeProvider']) => void;
  isSyncing: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onSelectAccaCategory,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md px-4 lg:px-8 py-2.5 transition-colors shadow-sm shadow-slate-900/5 dark:shadow-black/40">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-md shadow-slate-900/10 shrink-0">
            <span className="font-mono text-emerald-400 font-extrabold">Q</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                QEMER PREDICTIONS
              </h1>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              Pure Match Predictions &amp; Prebuilt Accumulator Provider
            </p>
          </div>
        </div>

        {/* Center Tab Navigation (Matches / Prebuilt Accas / Trends & Tips) */}
        <div className="flex items-center bg-slate-100/90 dark:bg-slate-900/90 rounded-2xl p-1 shadow-inner">
          <button
            id="tab-fixtures-btn"
            onClick={() => onSelectTab('FIXTURES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'FIXTURES'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ⚽ Predictions
          </button>
          <button
            id="tab-accas-btn"
            onClick={() => onSelectTab('ACCAS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'ACCAS'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Prebuilt Accas</span>
          </button>
          <button
            id="tab-tips-btn"
            onClick={() => onSelectTab('TIPS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'TIPS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🔥 Trends</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </button>
        </div>

        {/* Action Controls & 3-line Menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Banker & Value Hunter */}
          <button
            id="quick-banker-btn"
            onClick={() => {
              onSelectTab('ACCAS');
              if (onSelectAccaCategory) onSelectAccaCategory('BANKER');
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-sm hover:shadow-md"
            title="View Safe Banker Prebuilt Accumulator"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Safe Acca</span>
          </button>

          <button
            id="quick-valhunter-btn"
            onClick={() => {
              onSelectTab('ACCAS');
              if (onSelectAccaCategory) onSelectAccaCategory('VALUE_HUNTER');
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-sm hover:shadow-md"
            title="View Value Hunter Prebuilt Accumulator"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Top Value Acca</span>
          </button>

          {/* 3-line Menu Icon to open Settings & Preferences */}
          <button
            id="open-settings-modal-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm hover:shadow-md"
            title="Menu & Settings"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

