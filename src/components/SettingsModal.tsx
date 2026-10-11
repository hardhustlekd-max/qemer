import React, { useState } from 'react';
import { X, Settings, Database, Cpu, Check, FileText, Sun, Moon, RefreshCw } from 'lucide-react';
import { EngineSettings, ProviderStatus } from '../core/types.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EngineSettings | null;
  providers: ProviderStatus[];
  onSaveSettings: (newSettings: Partial<EngineSettings>) => void;
  onReSeedDatabase: (customCsv?: string, reset?: boolean) => void;
  isSeeding: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onProviderChange?: (providerId: EngineSettings['activeProvider']) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  providers,
  onSaveSettings,
  onReSeedDatabase,
  isSeeding,
  theme,
  onToggleTheme,
  onProviderChange,
}) => {
  if (!isOpen || !settings) return null;

  const [activeProvider, setActiveProvider] = useState<EngineSettings['activeProvider']>(
    settings.activeProvider
  );
  const [rollingWindow, setRollingWindow] = useState<number>(settings.rollingMatchWindow);
  const [minEV, setMinEV] = useState<number>(settings.minEVThreshold);
  const [safeWin, setSafeWin] = useState<number>(settings.safeWinThreshold);
  const [homeAdv, setHomeAdv] = useState<number>(settings.homeAdvantageFactor);
  const [formDecay, setFormDecay] = useState<number>(settings.formDecayRate);

  const [activeTab, setActiveTab] = useState<'ENGINE' | 'PROVIDERS' | 'DATABASE'>('ENGINE');
  const [customCsvText, setCustomCsvText] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleProviderSelect = (providerId: EngineSettings['activeProvider']) => {
    setActiveProvider(providerId);
    if (onProviderChange) {
      onProviderChange(providerId);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      activeProvider,
      rollingMatchWindow: rollingWindow,
      minEVThreshold: minEV,
      safeWinThreshold: safeWin,
      homeAdvantageFactor: homeAdv,
      formDecayRate: formDecay,
    });
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-slate-900/10 dark:shadow-black/60 font-sans">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md px-5 sm:px-6 py-4 flex items-center justify-between z-10 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Settings &amp; Preferences</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure theme, active data provider, and engine parameters</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Preferences Bar: Theme Switcher & Provider Selector */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Theme Switcher */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400 text-xs">Appearance:</span>
            <div className="inline-flex items-center bg-slate-200/80 dark:bg-slate-950 p-1 rounded-xl shadow-inner">
              <button
                type="button"
                onClick={() => {
                  if (theme !== 'light') onToggleTheme();
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (theme !== 'dark') onToggleTheme();
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Provider Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400 text-xs">Provider:</span>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 rounded-xl px-2.5 py-1.5 shadow-xs">
              <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                id="modal-provider-selector-dropdown"
                value={activeProvider}
                onChange={(e) => handleProviderSelect(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-1"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 text-xs">
          <button
            onClick={() => setActiveTab('ENGINE')}
            className={`pb-2.5 font-bold px-2.5 transition-all cursor-pointer ${
              activeTab === 'ENGINE'
                ? 'text-emerald-600 dark:text-emerald-400 shadow-b'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Poisson Parameters
          </button>
          <button
            onClick={() => setActiveTab('PROVIDERS')}
            className={`pb-2.5 font-bold px-2.5 transition-all cursor-pointer ${
              activeTab === 'PROVIDERS'
                ? 'text-cyan-600 dark:text-cyan-400 shadow-b'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Data Providers
          </button>
          <button
            onClick={() => setActiveTab('DATABASE')}
            className={`pb-2.5 font-bold px-2.5 transition-all cursor-pointer ${
              activeTab === 'DATABASE'
                ? 'text-indigo-600 dark:text-indigo-400 shadow-b'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            SQLite &amp; CSV Ingestion
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {activeTab === 'ENGINE' && (
            <div className="space-y-3.5">
              {/* Rolling Match Window */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span>Rolling Match Window for Team Form:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-slate-950 px-2.5 py-0.5 rounded-lg shadow-xs">
                    {rollingWindow} Matches
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={rollingWindow}
                  onChange={(e) => setRollingWindow(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Adjust whether team attack and defense metrics are calculated on the last 10, 15, or 20 matches.
                </p>
              </div>

              {/* Minimum EV Threshold */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span>Positive Expected Value (+EV) Threshold:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold bg-white dark:bg-slate-950 px-2.5 py-0.5 rounded-lg shadow-xs">
                    {minEV.toFixed(2)}x ({(minEV * 100 - 100).toFixed(0)}% Edge)
                  </span>
                </div>
                <input
                  type="range"
                  min={1.02}
                  max={1.25}
                  step={0.01}
                  value={minEV}
                  onChange={(e) => setMinEV(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Matches where model probability multiplied by decimal odds exceeds this threshold are marked as value selections.
                </p>
              </div>

              {/* Home Advantage & Form Decay Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Home Advantage Factor:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{homeAdv.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={1.00}
                    max={1.30}
                    step={0.02}
                    value={homeAdv}
                    onChange={(e) => setHomeAdv(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Form Decay Factor:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formDecay.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.70}
                    max={0.95}
                    step={0.05}
                    value={formDecay}
                    onChange={(e) => setFormDecay(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'PROVIDERS' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                Select your active football data provider. The engine immediately switches its API fetcher strategy.
              </p>
              {providers.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleProviderSelect(p.id as any)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all shadow-xs ${
                    activeProvider === p.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {p.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{p.latencyMs}ms</span>
                      {activeProvider === p.id && (
                        <span className="p-1 rounded-full bg-emerald-500 text-white">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.features.map((f, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg shadow-2xs"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'DATABASE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Re-Seed from Football-Data CSV</h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Parses official historical match results, goals, half-time data, and closing Bet365 odds directly into the SQLite database.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => onReSeedDatabase(undefined, false)}
                    disabled={isSeeding}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isSeeding ? <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 shrink-0" />}
                    <span>Ingest Standard Season CSVs</span>
                  </button>

                  <button
                    onClick={() => onReSeedDatabase(undefined, true)}
                    disabled={isSeeding}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-800 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <span>Clear &amp; Fresh Re-Seed</span>
                  </button>
                </div>
              </div>

              {/* Custom CSV Raw Ingestion Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-500" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Custom CSV Ingestion</h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Paste structured CSV content to ingest directly:
                </p>
                <textarea
                  value={customCsvText}
                  onChange={(e) => setCustomCsvText(e.target.value)}
                  placeholder="Div,Date,HomeTeam,AwayTeam,FTHG,FTAG,FTR,HS,AS,HST,AST,B365H,B365D,B365A..."
                  rows={4}
                  className="w-full bg-white dark:bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none shadow-xs"
                />
                <button
                  onClick={() => {
                    if (customCsvText.trim().length > 0) {
                      onReSeedDatabase(customCsvText, false);
                      setCustomCsvText('');
                    }
                  }}
                  disabled={isSeeding || !customCsvText.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  Parse &amp; Ingest Custom CSV
                </button>
              </div>
            </div>
          )}

          {/* Footer Save Actions */}
          <div className="flex items-center justify-between pt-3">
            {showSavedToast ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Settings updated successfully!
              </span>
            ) : (
              <span className="text-xs text-slate-400">Changes apply immediately to probability pipeline</span>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
