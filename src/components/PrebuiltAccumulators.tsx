import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Layers,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Fixture, AccumulatorSlip, EngineSettings } from '../core/types.js';
import { EngineService } from '../services/engineService.js';
import { getRelativeDateStr } from '../core/seedData.js';
import { isMatchStarted } from '../core/accumulator.js';

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
    };
  }

  if (prob >= 0.35 || odds <= 5.5) {
    return {
      level: 'MEDIUM',
      label: 'Moderate',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
      textColor: 'text-amber-700 dark:text-amber-300',
    };
  }

  if (prob >= 0.15 || odds <= 15.0) {
    return {
      level: 'HIGH',
      label: 'High Risk',
      badgeBg: 'bg-orange-100 dark:bg-orange-950/60',
      textColor: 'text-orange-700 dark:text-orange-300',
    };
  }

  return {
    level: 'EXTREME',
    label: 'Longshot',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
    textColor: 'text-rose-700 dark:text-rose-300',
  };
}

export const PrebuiltAccumulators: React.FC<PrebuiltAccumulatorsProps> = ({
  fixtures,
  onSelectDetail,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PrebuiltCategory>('BANKER');
  const [dateScope, setDateScope] = useState<'TODAY' | 'TOMORROW' | 'NEXT_3_DAYS' | 'ALL'>('TODAY');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stakeBenchmark] = useState<number>(10);
  const [prebuiltSlips, setPrebuiltSlips] = useState<Record<string, AccumulatorSlip>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const unstartedFixtures = (fixtures || []).filter((f) => !isMatchStarted(f));

    EngineService.getPrebuiltAccumulators(dateScope, stakeBenchmark, unstartedFixtures)
      .then((slips) => {
        if (isMounted) {
          setPrebuiltSlips(slips);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load prebuilt accumulators:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fixtures, dateScope, stakeBenchmark]);

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
      title: 'Banker',
    },
    {
      id: 'VALUE_HUNTER' as const,
      title: 'Value',
    },
    {
      id: 'HIGH_GOALS' as const,
      title: 'Goals',
    },
    {
      id: 'MEGA_COMBO' as const,
      title: 'Mega Acca',
    },
  ];

  if (isLoading && (!activeSlip || Object.keys(prebuiltSlips).length === 0)) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#0B0F17] rounded-3xl shadow-xs space-y-3 font-sans">
        <Loader2 className="w-7 h-7 text-emerald-500 animate-spin mx-auto" />
        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
          Loading Accumulators...
        </h3>
      </div>
    );
  }

  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#0B0F17] rounded-3xl shadow-xs space-y-2 font-sans">
        <Layers className="w-7 h-7 text-slate-400 mx-auto" />
        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
          No Fixtures Available
        </h3>
      </div>
    );
  }

  const risk = activeSlip ? calculateRiskProfile(activeSlip) : null;
  const potentialPayout = activeSlip ? (stakeBenchmark * activeSlip.combinedOdds).toFixed(2) : '0.00';

  return (
    <div className="bg-white dark:bg-[#0B0F17] rounded-3xl p-3.5 sm:p-5 shadow-xs space-y-3.5 font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Accumulator
          </h2>
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative">
          <select
            id="prebuilt-date-scope-dropdown"
            value={dateScope}
            onChange={(e) => setDateScope(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white rounded-xl px-2.5 py-1.5 text-xs font-bold appearance-none cursor-pointer pr-7 focus:outline-none shadow-xs"
          >
            <option value="TODAY">Today</option>
            <option value="TOMORROW">Tomorrow</option>
            <option value="NEXT_3_DAYS">Next 3 Days</option>
            <option value="ALL">All Dates</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
        </div>
      </div>

      {/* Category Pills Switcher */}
      <div className="bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar shadow-xs">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const slip = prebuiltSlips[cat.id];

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-1 min-w-[80px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{cat.title}</span>
              {slip && (
                <span className={`text-[10px] font-mono px-1 py-0.5 rounded-md ${
                  isSelected ? 'bg-slate-100 dark:bg-black/20 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {slip.combinedOdds.toFixed(1)}x
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Slip Details & Stats Bar */}
      {activeSlip && (
        <div className="space-y-3">
          {/* Key Metrics Chips */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl shadow-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {activeSlip.combinedOdds.toFixed(2)}x
              </span>
              <span className="bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl shadow-xs font-mono font-bold text-slate-900 dark:text-white">
                {(activeSlip.combinedProb * 100).toFixed(0)}% Win
              </span>
              {risk && (
                <span className={`px-2.5 py-1 rounded-xl shadow-xs font-bold text-xs ${risk.badgeBg} ${risk.textColor}`}>
                  {risk.label}
                </span>
              )}
              <span className="bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl shadow-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                Payout £{potentialPayout}
              </span>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={() => handleCopySlip(activeSlip, activeSlip.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {copiedId === activeSlip.id ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Slip</span>
                </>
              )}
            </button>
          </div>

          {/* Legs List */}
          <div className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/60 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/40">
            {activeSlip.legs.map((leg, index) => {
              const matchedFixture = fixtures.find((f) => f.id === leg.fixtureId);

              return (
                <div
                  key={`${leg.fixtureId}-${leg.marketKey}`}
                  className="px-3.5 py-2.5 hover:bg-slate-100/60 dark:hover:bg-slate-900 transition-colors flex items-center justify-between gap-2.5 text-xs"
                >
                  {/* Leg Index & Teams */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-lg bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {leg.league}
                        </span>
                        {leg.fixtureDate && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {leg.fixtureDate === getRelativeDateStr(0) ? 'Today' : leg.fixtureDate === getRelativeDateStr(1) ? 'Tomorrow' : leg.fixtureDate}
                          </span>
                        )}
                      </div>
                      <div
                        onClick={() => matchedFixture && onSelectDetail && onSelectDetail(matchedFixture)}
                        className={`font-bold text-xs text-slate-900 dark:text-white truncate ${matchedFixture ? 'cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400' : ''}`}
                      >
                        {leg.homeTeam} vs {leg.awayTeam}
                      </div>
                    </div>
                  </div>

                  {/* Selection & Odds */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-white dark:bg-slate-950 shadow-xs">
                      {leg.selection}
                    </span>
                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-950 shadow-xs">
                      @{leg.odds.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
