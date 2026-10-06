import React, { useState } from 'react';
import { Shield, Sparkles, Sliders, Dices, ArrowRight, Zap, Target } from 'lucide-react';
import { AccaGenerationParams } from '../core/accumulator.js';
import { MarketOption } from '../core/types.js';

interface AccaConfiguratorProps {
  onGenerate: (params: AccaGenerationParams) => void;
  isGenerating: boolean;
}

export const AccaConfigurator: React.FC<AccaConfiguratorProps> = ({ onGenerate, isGenerating }) => {
  const [strategy, setStrategy] = useState<'BANKER' | 'VALUE_HUNTER' | 'CUSTOM'>('BANKER');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'TOMORROW' | 'NEXT_3_DAYS' | 'THIS_WEEK' | 'ALL'>('TODAY');
  const [legCount, setLegCount] = useState<number>(4);
  const [targetOdds, setTargetOdds] = useState<number>(8.0);
  const [minProbability, setMinProbability] = useState<number>(0.65);
  const [stake, setStake] = useState<number>(10);
  const [selectedMarkets, setSelectedMarkets] = useState<MarketOption['key'][]>([
    'HOME_WIN',
    'AWAY_WIN',
    'OVER_25',
    'BTTS_YES',
    'DOUBLE_CHANCE_1X',
  ]);

  const handleToggleMarket = (key: MarketOption['key']) => {
    if (selectedMarkets.includes(key)) {
      if (selectedMarkets.length > 1) {
        setSelectedMarkets(selectedMarkets.filter((m) => m !== key));
      }
    } else {
      setSelectedMarkets([...selectedMarkets, key]);
    }
  };

  const handleTriggerGenerate = () => {
    onGenerate({
      strategy,
      legCount,
      targetOdds,
      minProbability,
      stake,
      allowedMarkets: selectedMarkets,
      dateFilter,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 space-y-5 shadow-lg shadow-black/30">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">Acca Generator Widget</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Poisson Optimizer</span>
      </div>

      {/* Preset Strategy Tabs */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
        <button
          id="strategy-tab-banker"
          onClick={() => {
            setStrategy('BANKER');
            setMinProbability(0.72);
            setLegCount(3);
          }}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
            strategy === 'BANKER'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 mb-1 text-emerald-300" />
          <span>The Banker</span>
          <span className="text-[9px] opacity-80 font-normal">Safe &gt;72%</span>
        </button>

        <button
          id="strategy-tab-value-hunter"
          onClick={() => {
            setStrategy('VALUE_HUNTER');
            setLegCount(4);
          }}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
            strategy === 'VALUE_HUNTER'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-1 text-amber-300" />
          <span>Value Hunter</span>
          <span className="text-[9px] opacity-80 font-normal">&gt;1.10x EV</span>
        </button>

        <button
          id="strategy-tab-custom"
          onClick={() => setStrategy('CUSTOM')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
            strategy === 'CUSTOM'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Target className="w-4 h-4 mb-1 text-indigo-300" />
          <span>Custom Slip</span>
          <span className="text-[9px] opacity-80 font-normal">Target Odds</span>
        </button>
      </div>

      {/* Fixture Date Scope Selector - Defaults to Today */}
      <div className="space-y-1.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Match Date Scope:</span>
          <span className="text-[11px] text-emerald-400 font-bold font-mono">
            {dateFilter === 'TODAY' ? "Today's Picks" : dateFilter === 'TOMORROW' ? 'Tomorrow' : dateFilter === 'NEXT_3_DAYS' ? 'Next 3 Days' : dateFilter === 'THIS_WEEK' ? 'This Week' : 'All Dates'}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1 pt-1">
          {[
            { key: 'TODAY' as const, label: 'Today' },
            { key: 'TOMORROW' as const, label: 'Tomorrow' },
            { key: 'NEXT_3_DAYS' as const, label: '3 Days' },
            { key: 'THIS_WEEK' as const, label: 'Week' },
            { key: 'ALL' as const, label: 'All' },
          ].map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDateFilter(d.key)}
              className={`py-1 px-1 rounded-lg text-[11px] font-bold border text-center transition-all cursor-pointer ${
                dateFilter === d.key
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Controls based on Strategy */}
      <div className="space-y-4 text-xs">
        {/* Leg Count Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span>Slip Legs Count:</span>
            <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-xs">
              {legCount}-Fold
            </span>
          </div>
          <input
            id="leg-count-slider"
            type="range"
            min={2}
            max={7}
            step={1}
            value={legCount}
            onChange={(e) => setLegCount(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>2 legs (Double)</span>
            <span>4 legs</span>
            <span>7 legs</span>
          </div>
        </div>

        {/* Target Total Odds (Active for Custom or visual benchmark) */}
        {strategy === 'CUSTOM' && (
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span>Target Multiplied Odds:</span>
              <span className="font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                ~{targetOdds.toFixed(1)}x
              </span>
            </div>
            <input
              id="target-odds-slider"
              type="range"
              min={2.5}
              max={30.0}
              step={0.5}
              value={targetOdds}
              onChange={(e) => setTargetOdds(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>2.5x (Modest)</span>
              <span>10.0x</span>
              <span>30.0x (Longshot)</span>
            </div>
          </div>
        )}

        {/* Min Probability Threshold */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span>Min AI Probability per Leg:</span>
            <span className="font-mono font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded text-xs">
              {(minProbability * 100).toFixed(0)}%
            </span>
          </div>
          <input
            id="min-probability-slider"
            type="range"
            min={0.45}
            max={0.85}
            step={0.05}
            value={minProbability}
            onChange={(e) => setMinProbability(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Stake Input Box */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <span className="text-slate-300 font-medium">Simulation Stake:</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-bold">£</span>
            <input
              id="stake-input-box"
              type="number"
              min={1}
              max={1000}
              value={stake}
              onChange={(e) => setStake(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-right text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Allowed Markets Selector */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Allowed Betting Markets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'HOME_WIN' as const, label: 'Home 1' },
              { key: 'AWAY_WIN' as const, label: 'Away 2' },
              { key: 'OVER_25' as const, label: 'Over 2.5' },
              { key: 'BTTS_YES' as const, label: 'BTTS Yes' },
              { key: 'DOUBLE_CHANCE_1X' as const, label: '1X Chance' },
            ].map((m) => {
              const active = selectedMarkets.includes(m.key);
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => handleToggleMarket(m.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    active
                      ? 'bg-slate-800 text-white border border-slate-600 font-semibold'
                      : 'bg-slate-950/60 text-slate-500 border border-slate-800/80 hover:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Generate Accumulator Action Button */}
      <button
        id="generate-accumulator-btn"
        onClick={handleTriggerGenerate}
        disabled={isGenerating}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer disabled:opacity-50"
      >
        {isGenerating ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Dices className="w-4 h-4" />
            <span>Generate Accumulator</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
};
