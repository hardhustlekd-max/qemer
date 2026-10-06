import React from 'react';
import { Shield, Sparkles, Database, Settings, RefreshCw, Cpu, Activity, Sun, Moon } from 'lucide-react';
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
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-3 transition-colors shadow-xs">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
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

        {/* Action Controls & Provider Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Banker & Value Hunter */}
          <button
            id="quick-banker-btn"
            onClick={() => onQuickGenerate('BANKER')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
            title="Generate Safe Accumulator"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Safe Picks</span>
          </button>

          <button
            id="quick-valhunter-btn"
            onClick={() => onQuickGenerate('VALUE_HUNTER')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
            title="Generate Value Accumulator"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Top Value</span>
          </button>

          {/* Provider Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              id="provider-selector-dropdown"
              value={settings?.activeProvider || 'FOOTBALL_DATA_CO_UK'}
              onChange={(e) => onProviderChange(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Wireframe Theme' : 'Switch to Dark Obsidian Theme'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Settings Trigger */}
          <button
            id="open-settings-modal-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Engine Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

