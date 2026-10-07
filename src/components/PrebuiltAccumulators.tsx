import React, { useState, useMemo } from 'react';
import {
  Shield,
  Sparkles,
  Zap,
  Flame,
  Copy,
  Check,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import { Fixture, AccumulatorSlip, EngineSettings } from '../core/types.js';
import { AccumulatorGenerator } from '../core/accumulator.js';
import { getRelativeDateStr } from '../core/seedData.js';

interface PrebuiltAccumulatorsProps {
  fixtures: Fixture[];
  settings: EngineSettings | null;
  onSelectDetail?: (fixture: Fixture) => void;
}

type PrebuiltCategory = 'BANKER' | 'VALUE_HUNTER' | 'HIGH_GOALS' | 'MEGA_COMBO';

interface RiskProfile {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  label: string;
  badgeBg: string;
  textColor: string;
  meterPercentage: number;
  description: string;
}

function calculateRiskProfile(slip: AccumulatorSlip): RiskProfile {
  const prob = slip.combinedProb;
  const odds = slip.combinedOdds;

  if (prob >= 0.60 || odds <= 2.5) {
    return {
      level: 'LOW',
      label: 'Low Risk',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      meterPercentage: 20,
      description: 'High Poisson win probability across safe selections.',
    };
  }

  if (prob >= 0.35 || odds <= 5.5) {
    return {
      level: 'MEDIUM',
      label: 'Moderate Risk',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
      textColor: 'text-amber-700 dark:text-amber-300',
      meterPercentage: 50,
      description: 'Balanced risk-to-reward ratio with solid market value.',
    };
  }

  if (prob >= 0.15 || odds <= 15.0) {
    return {
      level: 'HIGH',
      label: 'High Risk',
      badgeBg: 'bg-orange-100 dark:bg-orange-950/60',
      textColor: 'text-orange-700 dark:text-orange-300',
      meterPercentage: 80,
      description: 'High multiplier with increased variance.',
    };
  }

  return {
    level: 'EXTREME',
    label: 'Longshot Risk',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
    textColor: 'text-rose-700 dark:text-rose-300',
    meterPercentage: 95,
    description: 'High potential return speculative accumulator.',
  };
}

export const PrebuiltAccumulators: React.FC<PrebuiltAccumulatorsProps> = ({
  fixtures,
  settings,
  onSelectDetail,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PrebuiltCategory>('BANKER');
  const [dateScope, setDateScope] = useState<'TODAY' | 'TOMORROW' | 'NEXT_3_DAYS' | 'ALL'>('TODAY');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stakeBenchmark] = useState<number>(10);

  const fallbackSettings: EngineSettings = settings || {
    activeProvider: 'FOOTBALL_DATA_CO_UK',
    rollingMatchWindow: 15,
    minEVThreshold: 1.10,
    safeWinThreshold: 0.70,
    homeAdvantageFactor: 1.12,
    formDecayRate: 0.85,
    autoSyncDaily: true,
  };

  // Generate Prebuilt Slips for all preset archetypes
  const prebuiltSlips = useMemo(() => {
    if (!fixtures || fixtures.length === 0) return {};

    // 1. Banker Acca
    const bankerSlip = AccumulatorGenerator.generateSlip(
      fixtures,
      {
        strategy: 'BANKER',
        legCount: 3,
        minProbability: 0.68,
        stake: stakeBenchmark,
        dateFilter: dateScope,
        allowedMarkets: ['HOME_WIN', 'AWAY_WIN', 'DOUBLE_CHANCE_1X', 'DOUBLE_CHANCE_X2', 'OVER_15' as any],
      },
      fallbackSettings
    );

    // 2. Value Hunter Acca
    const valueSlip = AccumulatorGenerator.generateSlip(
      fixtures,
      {
        strategy: 'VALUE_HUNTER',
        legCount: 4,
        stake: stakeBenchmark,
        dateFilter: dateScope,
        allowedMarkets: ['HOME_WIN', 'AWAY_WIN', 'OVER_25', 'BTTS_YES', 'DRAW'],
      },
      fallbackSettings
    );

    // 3. High Goals Acca
    const goalsSlip = AccumulatorGenerator.generateSlip(
      fixtures,
      {
        strategy: 'CUSTOM',
        legCount: 4,
        targetOdds: 6.0,
        stake: stakeBenchmark,
        dateFilter: dateScope,
        allowedMarkets: ['OVER_25', 'BTTS_YES'],
      },
      fallbackSettings
    );
    goalsSlip.name = dateScope === 'TODAY' ? "Today's High Goals Combo" : 'High Goals & BTTS Acca';

    // 4. Mega Combo Acca
    const megaSlip = AccumulatorGenerator.generateSlip(
      fixtures,
      {
        strategy: 'CUSTOM',
        legCount: 6,
        targetOdds: 20.0,
        stake: stakeBenchmark,
        dateFilter: dateScope,
        allowedMarkets: ['HOME_WIN', 'AWAY_WIN', 'OVER_25', 'BTTS_YES', 'DOUBLE_CHANCE_1X'],
      },
      fallbackSettings
    );
    megaSlip.name = dateScope === 'TODAY' ? "Today's 6-Fold Mega Acca" : 'Weekend Mega Accumulator';

    return {
      BANKER: bankerSlip,
      VALUE_HUNTER: valueSlip,
      HIGH_GOALS: goalsSlip,
      MEGA_COMBO: megaSlip,
    };
  }, [fixtures, dateScope, stakeBenchmark, fallbackSettings]);

  const activeSlip = prebuiltSlips[selectedCategory] || prebuiltSlips['BANKER'];

  const handleCopySlip = (slip: AccumulatorSlip, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(slip.summaryText);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const categories = [
    {
      id: 'BANKER' as const,
      title: 'The Banker',
      subtitle: 'Safe Picks >68% Win Prob',
      icon: Shield,
      color: 'emerald',
      activeClass: 'bg-emerald-600 text-white shadow-md',
    },
    {
      id: 'VALUE_HUNTER' as const,
      title: 'Value Hunter',
      subtitle: '+EV Market Edge Picks',
      icon: Sparkles,
      color: 'amber',
      activeClass: 'bg-amber-600 text-white shadow-md',
    },
    {
      id: 'HIGH_GOALS' as const,
      title: 'High Goals',
      subtitle: 'Over 2.5 & BTTS Combos',
      icon: Zap,
      color: 'indigo',
      activeClass: 'bg-indigo-600 text-white shadow-md',
    },
    {
      id: 'MEGA_COMBO' as const,
      title: 'Mega Acca',
      subtitle: '6-Fold High Multiplier',
      icon: Flame,
      color: 'rose',
      activeClass: 'bg-rose-600 text-white shadow-md',
    },
  ];

  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#0B0F17] rounded-3xl shadow-sm space-y-3">
        <Layers className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Generating Prebuilt Accumulators...
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please wait while the Poisson engine synthesizes candidates from current match fixtures.
        </p>
      </div>
    );
  }

  const risk = activeSlip ? calculateRiskProfile(activeSlip) : null;
  const potentialPayout = activeSlip ? (stakeBenchmark * activeSlip.combinedOdds).toFixed(2) : '0.00';

  return (
    <div className="space-y-4 font-sans animate-in fade-in duration-150">
      {/* Top Banner: Prebuilt Provider Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider shadow-xs">
                Automated Mathematical Provider
              </span>
              <span className="text-xs font-mono text-slate-400">
                Poisson Engine v2.4
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Prebuilt Bet Accumulators
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Ready-made multi-leg accumulator slips calculated with distinct mathematical profiles. Copy directly into your sportsbook.
            </p>
          </div>

          {/* Date Scope Filter */}
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="relative">
              <select
                id="prebuilt-date-scope-dropdown"
                value={dateScope}
                onChange={(e) => setDateScope(e.target.value as any)}
                className="bg-slate-800/90 text-white rounded-xl px-2.5 py-1.5 text-xs font-bold appearance-none cursor-pointer pr-7 focus:outline-none shadow-xs"
              >
                <option value="TODAY">Today&apos;s Accas</option>
                <option value="TOMORROW">Tomorrow</option>
                <option value="NEXT_3_DAYS">Next 3 Days</option>
                <option value="ALL">All Available Dates</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Category Switcher Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const slip = prebuiltSlips[cat.id];

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? cat.activeClass
                  : 'bg-white dark:bg-[#0B0F17] hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-900 dark:text-white shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span className="font-bold text-xs sm:text-sm tracking-tight">{cat.title}</span>
                </div>
                {slip && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {slip.combinedOdds.toFixed(2)}x
                  </span>
                )}
              </div>
              <p className={`text-[11px] truncate ${isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                {cat.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Prebuilt Accumulator Details Card */}
      {activeSlip && (
        <div className="bg-white dark:bg-[#0B0F17] rounded-3xl overflow-hidden shadow-sm space-y-0">
          {/* Slip Header & Metas */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {activeSlip.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold shadow-2xs">
                  {activeSlip.legs.length} Selections
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calculated Poisson accumulator with verified odds from official closing feeds.
              </p>
            </div>

            {/* Copy Accumulator Slip Button */}
            <button
              type="button"
              onClick={() => handleCopySlip(activeSlip, activeSlip.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-sm shrink-0 ${
                copiedId === activeSlip.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white'
              }`}
            >
              {copiedId === activeSlip.id ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Acca Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Prebuilt Acca</span>
                </>
              )}
            </button>
          </div>

          {/* Key Metrics Dashboard Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-4 bg-slate-100/60 dark:bg-slate-900/40 text-xs">
            {/* Total Multiplied Odds */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-950/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Total Multiplied Odds
              </span>
              <span className="text-lg sm:text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                {activeSlip.combinedOdds.toFixed(2)}x
              </span>
            </div>

            {/* Model Win Probability */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-950/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Poisson Probability
              </span>
              <span className="text-lg sm:text-xl font-mono font-black text-slate-900 dark:text-white">
                {(activeSlip.combinedProb * 100).toFixed(1)}%
              </span>
            </div>

            {/* Dynamic Risk Meter */}
            {risk && (
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-950/80 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center justify-between">
                  <span>Risk Profile</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${risk.badgeBg} ${risk.textColor}`}>
                    {risk.label}
                  </span>
                </span>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    style={{ width: `${risk.meterPercentage}%` }}
                    className={`h-full ${
                      risk.level === 'LOW'
                        ? 'bg-emerald-500'
                        : risk.level === 'MEDIUM'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Benchmark Payout */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-950/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                £{stakeBenchmark} Stake Payout
              </span>
              <span className="text-lg sm:text-xl font-mono font-black text-cyan-600 dark:text-cyan-400">
                £{potentialPayout}
              </span>
            </div>
          </div>

          {/* Matches & Legs Breakdown List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {activeSlip.legs.map((leg, index) => {
              const matchedFixture = fixtures.find((f) => f.id === leg.fixtureId);

              return (
                <div
                  key={`${leg.fixtureId}-${leg.marketKey}`}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  {/* Leg Index & Teams */}
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {index + 1}
                    </span>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 shadow-2xs">
                          {leg.league}
                        </span>
                        {leg.fixtureDate && (
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            {leg.fixtureDate === getRelativeDateStr(0) ? "Today" : leg.fixtureDate === getRelativeDateStr(1) ? "Tomorrow" : leg.fixtureDate}
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 flex-wrap">
                        <span>{leg.homeTeam}</span>
                        <span className="text-slate-400 font-normal">vs</span>
                        <span>{leg.awayTeam}</span>
                      </div>

                      {matchedFixture && (
                        <button
                          type="button"
                          onClick={() => onSelectDetail && onSelectDetail(matchedFixture)}
                          className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                        >
                          <Info className="w-3 h-3" />
                          <span>View Poisson Probability Grid</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Prebuilt Market Selection & Odds */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 font-bold text-xs sm:text-sm text-slate-900 dark:text-white px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-900 shadow-2xs">
                        <span>{leg.selection}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Poisson Prob: {(leg.probability * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="font-mono font-black text-sm sm:text-base text-slate-900 dark:text-emerald-400 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 shadow-xs">
                      @{leg.odds.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card Footer: Summary Action */}
          <div className="p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              💡 {activeSlip.legs.length} legs selected by the Poisson mathematical model. Odds subject to bookmaker line adjustments.
            </span>

            <button
              type="button"
              onClick={() => handleCopySlip(activeSlip, activeSlip.id)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-sm shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Accumulator Summary</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
