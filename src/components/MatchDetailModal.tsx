import React, { useState, useMemo } from 'react';
import { X, TrendingUp, BarChart2, Zap, History, Activity } from 'lucide-react';
import { Fixture } from '../core/types.js';
import { PoissonMatrixView } from './PoissonMatrixView.js';
import { PoissonEngine } from '../core/poisson.js';
import { parseDynamicStatistics, StatCategoryGroup } from '../core/statisticsParser.js';

interface MatchDetailModalProps {
  fixture: Fixture | null;
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  fixture,
  onClose,
}) => {
  if (!fixture || !fixture.prediction) return null;
  return <MatchDetailModalContent fixture={fixture} onClose={onClose} />;
};

const MatchDetailModalContent: React.FC<{ fixture: Fixture; onClose: () => void }> = ({
  fixture,
  onClose,
}) => {
  const [statFilterGroup, setStatFilterGroup] = useState<StatCategoryGroup>('ALL');

  const pred = fixture.prediction!;
  const homeStats = fixture.homeStats;
  const awayStats = fixture.awayStats;

  // Retrieve computed measurements or derive fallback from scraped match records
  const measurements = pred.measurements || {
    h2h: PoissonEngine.computeHeadToHead(fixture.homeTeam, fixture.awayTeam, []),
  };

  const { h2h } = measurements;

  // Dynamically parse real statistics from Flashscore scraper
  const rawStatistics = useMemo(() => {
    return fixture.statistics || [];
  }, [fixture.statistics]);

  const parsedStatsSummary = useMemo(() => {
    return parseDynamicStatistics(rawStatistics);
  }, [rawStatistics]);

  const filteredStatItems = useMemo(() => {
    if (statFilterGroup === 'ALL') return parsedStatsSummary.items;
    return parsedStatsSummary.items.filter((item) => item.group === statFilterGroup);
  }, [parsedStatsSummary, statFilterGroup]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-slate-900/10 dark:shadow-black/60 font-sans">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between z-10 shadow-xs">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {fixture.leagueName} ({fixture.league})
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                Kick-off: {fixture.matchDate} @ {fixture.kickOffTime}
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1 truncate">
              {fixture.homeTeam} <span className="text-slate-400 dark:text-slate-500 font-normal">vs</span> {fixture.awayTeam}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* 1X2 Probabilities */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center justify-between">
                <span>1X2 Win Probabilities</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between font-mono mt-2">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[70px]">{fixture.homeTeam.slice(0, 3).toUpperCase()}</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">{(pred.homeWinProb * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">DRAW</div>
                  <div className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400">{(pred.drawProb * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[70px]">{fixture.awayTeam.slice(0, 3).toUpperCase()}</div>
                  <div className="text-sm sm:text-base font-bold text-cyan-600 dark:text-cyan-400">{(pred.awayWinProb * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Expected Goals λ */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center justify-between">
                <span>Expected Goals (xG)</span>
                <BarChart2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex items-center justify-around font-mono mt-2">
                <div className="text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Home: </span>
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{pred.homeXG}</span>
                </div>
                <div className="text-slate-400 dark:text-slate-600 font-bold">:</div>
                <div className="text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Away: </span>
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{pred.awayXG}</span>
                </div>
              </div>
            </div>

            {/* Total Goals & BTTS */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center justify-between">
                <span>Goal Line &amp; BTTS</span>
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="flex items-center justify-between font-mono text-xs mt-2">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Over 2.5: </span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">{(pred.over25Prob * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">BTTS: </span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">{(pred.bttsProb * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Head to Head Record from Scraped Matches */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-emerald-500" />
                <span>Head to Head Record</span>
              </h4>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {h2h.matchesCount} Previous Encounters
              </span>
            </div>

            <div className="bg-white dark:bg-slate-950 p-3 sm:p-4 rounded-xl shadow-xs text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Direct H2H Match History
                </span>
                <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Home: x{h2h.h2hMultiplierHome} • Away: x{h2h.h2hMultiplierAway}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono py-1">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 shadow-xs">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{fixture.homeTeam} Wins</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{h2h.homeWins}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 shadow-xs">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Draws</div>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400">{h2h.draws}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 shadow-xs">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{fixture.awayTeam} Wins</div>
                  <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{h2h.awayWins}</div>
                </div>
              </div>

              {h2h.recentH2H.length > 0 && (
                <div className="pt-1 space-y-1">
                  <div className="text-[10px] text-slate-400 font-medium">Recent Encounters:</div>
                  {h2h.recentH2H.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] font-mono text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400">{r.date}</span>
                      <span className="font-semibold">{r.homeTeam} vs {r.awayTeam}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{r.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Match Information from Scraper if present */}
          {(fixture.stage || (fixture.information && fixture.information.length > 0) || fixture.resultDetails) && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 shadow-xs space-y-2">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                Match Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                {fixture.stage && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-950/60 shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Stage</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">{fixture.stage}</span>
                  </div>
                )}
                {fixture.resultDetails?.regulationTime && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-950/60 shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Regulation</span>
                    <span className="font-bold text-slate-900 dark:text-white">{fixture.resultDetails.regulationTime}</span>
                  </div>
                )}
                {fixture.resultDetails?.penalties && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-950/60 shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Penalties</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{fixture.resultDetails.penalties}</span>
                  </div>
                )}
                {fixture.information?.map((info, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-white dark:bg-slate-950/60 shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{info.category}</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">{info.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Match Dynamic Statistics Parsed from Scraper */}
          {parsedStatsSummary.items.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-500" />
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Match Statistics
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Dynamic Parser ({parsedStatsSummary.items.length})
                </span>
              </div>

              {/* High-level possession comparison bar if possession is parsed */}
              {parsedStatsSummary.possession && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/60 shadow-xs space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {parsedStatsSummary.possession.home}%
                    </span>
                    <span className="font-sans text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Ball Possession
                    </span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">
                      {parsedStatsSummary.possession.away}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full flex overflow-hidden">
                    <div
                      style={{ width: `${parsedStatsSummary.possession.home}%` }}
                      className="bg-emerald-500 transition-all duration-300"
                    />
                    <div
                      style={{ width: `${parsedStatsSummary.possession.away}%` }}
                      className="bg-cyan-500 transition-all duration-300"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Group Filter Tabs */}
              {parsedStatsSummary.availableGroups.length > 1 && (
                <div className="flex items-center bg-white dark:bg-slate-950 p-1 rounded-xl shadow-xs overflow-x-auto no-scrollbar gap-1">
                  {parsedStatsSummary.availableGroups.map((g) => (
                    <button
                      key={g.group}
                      type="button"
                      onClick={() => setStatFilterGroup(g.group)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                        statFilterGroup === g.group
                          ? 'bg-slate-100 dark:bg-emerald-600 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{g.label}</span>
                      <span className="text-[10px] opacity-75 font-mono">({g.count})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Parsed Metric Items */}
              <div className="space-y-2">
                {filteredStatItems.map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-950/60 shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span
                        className={`font-bold w-16 text-left ${
                          stat.leader === 'HOME'
                            ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {stat.home.raw}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-sans font-semibold text-center flex-1 truncate px-2">
                        {stat.category}
                      </span>
                      <span
                        className={`font-bold w-16 text-right ${
                          stat.leader === 'AWAY'
                            ? 'text-cyan-600 dark:text-cyan-400 font-extrabold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {stat.away.raw}
                      </span>
                    </div>

                    {/* Comparative Visual Share Bar */}
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full flex overflow-hidden">
                      <div
                        style={{ width: `${stat.homeSharePercent}%` }}
                        className={`transition-all duration-300 ${
                          stat.isInverseMetric
                            ? 'bg-rose-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <div
                        style={{ width: `${stat.awaySharePercent}%` }}
                        className={`transition-all duration-300 ${
                          stat.isInverseMetric
                            ? 'bg-amber-500'
                            : 'bg-cyan-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Poisson 5x5 Heatmap Matrix */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 shadow-xs">
            <PoissonMatrixView
              prediction={pred}
              homeTeam={fixture.homeTeam}
              awayTeam={fixture.awayTeam}
            />
          </div>

          {/* Predicted Outcome Probabilities */}
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              Predicted Outcome Probabilities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              <div className="p-2.5 sm:p-3 rounded-2xl flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shadow-xs">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">{fixture.homeTeam} Win</span>
                <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl shadow-xs">
                  {(pred.homeWinProb * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shadow-xs">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Draw</span>
                <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl shadow-xs">
                  {(pred.drawProb * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shadow-xs">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">{fixture.awayTeam} Win</span>
                <span className="font-mono font-bold text-xs text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl shadow-xs">
                  {(pred.awayWinProb * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shadow-xs">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Over 2.5 Goals</span>
                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl shadow-xs">
                  {(pred.over25Prob * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shadow-xs">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Both Teams to Score (BTTS)</span>
                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl shadow-xs">
                  {(pred.bttsProb * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shadow-xs">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Over 1.5 Goals</span>
                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl shadow-xs">
                  {(pred.over15Prob * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Team Attack & Defense Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Home Team Stats */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">{fixture.homeTeam} (Home)</h4>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">Form Mult: x{pred.homeFormMultiplier}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/60 shadow-xs">
                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">Attack Strength</div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">{pred.homeAttackStrength}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/60 shadow-xs">
                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">Defense Strength</div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">{pred.homeDefenseStrength}</div>
                </div>
              </div>
              {homeStats && homeStats.recentMatches && (
                <div className="pt-1">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Recent Matches:</div>
                  <div className="space-y-1">
                    {homeStats.recentMatches.slice(0, 3).map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300">
                        <span className="truncate pr-1">vs {m.opponent}</span>
                        <span className={`font-mono font-bold px-1.5 py-0.2 rounded-md text-[10px] shrink-0 shadow-2xs ${
                          m.result === 'W' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400' :
                          m.result === 'D' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400' :
                          'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400'
                        }`}>
                          {m.result} ({m.goalsFor}-{m.goalsAgainst})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Away Team Stats */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">{fixture.awayTeam} (Away)</h4>
                <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">Form Mult: x{pred.awayFormMultiplier}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/60 shadow-xs">
                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">Attack Strength</div>
                  <div className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400">{pred.awayAttackStrength}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/60 shadow-xs">
                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">Defense Strength</div>
                  <div className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400">{pred.awayDefenseStrength}</div>
                </div>
              </div>
              {awayStats && awayStats.recentMatches && (
                <div className="pt-1">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Recent Matches:</div>
                  <div className="space-y-1">
                    {awayStats.recentMatches.slice(0, 3).map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300">
                        <span className="truncate pr-1">vs {m.opponent}</span>
                        <span className={`font-mono font-bold px-1.5 py-0.2 rounded-md text-[10px] shrink-0 shadow-2xs ${
                          m.result === 'W' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400' :
                          m.result === 'D' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400' :
                          'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400'
                        }`}>
                          {m.result} ({m.goalsFor}-{m.goalsAgainst})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
