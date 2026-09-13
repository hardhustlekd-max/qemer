import React, { useState } from 'react';
import { X, Settings, Database, Sliders, RefreshCw, Cpu, Check, AlertCircle, FileText } from 'lucide-react';
import { EngineSettings, ProviderStatus } from '../core/types.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EngineSettings | null;
  providers: ProviderStatus[];
  onSaveSettings: (newSettings: Partial<EngineSettings>) => void;
  onReSeedDatabase: (customCsv?: string, reset?: boolean) => void;
  isSeeding: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  providers,
  onSaveSettings,
  onReSeedDatabase,
  isSeeding,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#0F172A]/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Engine Configuration &amp; Providers</h2>
              <p className="text-xs text-slate-400">Manage statistical weights, providers, and SQLite storage</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/80 text-xs">
          <button
            onClick={() => setActiveTab('ENGINE')}
            className={`pb-2.5 font-semibold px-2 border-b-2 transition-all ${
              activeTab === 'ENGINE'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Poisson Parameters
          </button>
          <button
            onClick={() => setActiveTab('PROVIDERS')}
            className={`pb-2.5 font-semibold px-2 border-b-2 transition-all ${
              activeTab === 'PROVIDERS'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Hot-Swappable Providers
          </button>
          <button
            onClick={() => setActiveTab('DATABASE')}
            className={`pb-2.5 font-semibold px-2 border-b-2 transition-all ${
              activeTab === 'DATABASE'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            SQLite &amp; CSV Ingestion
          </button>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === 'ENGINE' && (
            <div className="space-y-4">
              {/* Rolling Match Window */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span>Rolling Match Window for Team Form:</span>
                  <span className="font-mono text-emerald-400 font-bold bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
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
                  className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Adjust whether team attack and defense metrics are calculated on the last 10, 15, or 20 matches.
                </p>
              </div>

              {/* Minimum EV Threshold */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span>Positive Expected Value (+EV) Threshold:</span>
                  <span className="font-mono text-amber-400 font-bold bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
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
                  className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Matches where (AI Probability * Decimal Odds) exceeds this multiplier are highlighted as value selections.
                </p>
              </div>

              {/* Home Advantage & Form Decay Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                    <span>Home Advantage Factor:</span>
                    <span className="font-mono font-bold text-slate-200">{homeAdv.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={1.00}
                    max={1.30}
                    step={0.02}
                    value={homeAdv}
                    onChange={(e) => setHomeAdv(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                    <span>Form Decay Factor:</span>
                    <span className="font-mono font-bold text-slate-200">{formDecay.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.70}
                    max={0.95}
                    step={0.05}
                    value={formDecay}
                    onChange={(e) => setFormDecay(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'PROVIDERS' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 mb-2">
                Select your active football data provider. The engine immediately switches its API fetcher strategy.
              </p>
              {providers.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setActiveProvider(p.id as any)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    activeProvider === p.id
                      ? 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{p.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                        {p.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-emerald-400 font-semibold">{p.latencyMs}ms</span>
                      {activeProvider === p.id && (
                        <span className="p-1 rounded-full bg-emerald-500 text-white">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.features.map((f, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800"
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
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">Re-Seed from Football-Data.co.uk CSV</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Parses official historical match results, goals, half-time data, and closing Bet365 odds directly into the SQLite database.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => onReSeedDatabase(undefined, false)}
                    disabled={isSeeding}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSeeding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Ingest Standard Season CSVs</span>
                  </button>

                  <button
                    onClick={() => onReSeedDatabase(undefined, true)}
                    disabled={isSeeding}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 text-xs font-semibold border border-slate-700 hover:border-rose-700 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <span>Clear &amp; Fresh Re-Seed</span>
                  </button>
                </div>
              </div>

              {/* Custom CSV Raw Ingestion Box */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">Custom CSV Ingestion</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Paste structured CSV content (e.g. from E0.csv, SP1.csv, D1.csv, I1.csv) to ingest directly:
                </p>
                <textarea
                  value={customCsvText}
                  onChange={(e) => setCustomCsvText(e.target.value)}
                  placeholder="Div,Date,HomeTeam,AwayTeam,FTHG,FTAG,FTR,HS,AS,HST,AST,B365H,B365D,B365A..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => {
                    if (customCsvText.trim().length > 0) {
                      onReSeedDatabase(customCsvText, false);
                      setCustomCsvText('');
                    }
                  }}
                  disabled={isSeeding || !customCsvText.trim()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-40"
                >
                  Parse &amp; Ingest Custom CSV
                </button>
              </div>
            </div>
          )}

          {/* Footer Save Actions */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            {showSavedToast ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Settings updated successfully!
              </span>
            ) : (
              <span className="text-xs text-slate-500">Changes apply immediately to probability pipeline</span>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-all"
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
