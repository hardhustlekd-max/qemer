import React from 'react';
import { X, TrendingUp, BarChart2, Zap } from 'lucide-react';
import { Fixture } from '../core/types.js';
import { PoissonMatrixView } from './PoissonMatrixView.js';

interface MatchDetailModalProps {
  fixture: Fixture | null;
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  fixture,
  onClose,
}) => {
  if (!fixture || !fixture.prediction) return null;

  const pred = fixture.prediction;
  const homeStats = fixture.homeStats;
  const awayStats = fixture.awayStats;

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
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Home λ: </span>
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{pred.homeXG}</span>
                </div>
                <div className="text-slate-400 dark:text-slate-600 font-bold">:</div>
                <div className="text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Away λ: </span>
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

          {/* Poisson 5x5 Heatmap Matrix */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 shadow-xs">
            <PoissonMatrixView
              prediction={pred}
              homeTeam={fixture.homeTeam}
              awayTeam={fixture.awayTeam}
            />
          </div>

          {/* All Available Betting Markets */}
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              Available Betting Markets
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {(fixture.markets || []).map((m) => (
                <div
                  key={m.key}
                  className={`p-2.5 sm:p-3 rounded-2xl flex items-center justify-between transition-all shadow-xs ${
                    m.isPositiveEV
                      ? 'bg-emerald-50 dark:bg-emerald-950/30'
                      : 'bg-slate-50 dark:bg-slate-900/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">{m.name}</span>
                      {m.isPositiveEV && (
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded-md shadow-2xs">
                          +{(m.expectedValue * 100).toFixed(1)}% EV
                        </span>
                      )}
                      {m.isBanker && (
                        <span className="text-[9px] sm:text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/60 px-1.5 py-0.2 rounded-md shadow-2xs">
                          Banker
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Odds: <span className="text-slate-900 dark:text-white font-mono font-bold">{m.odds.toFixed(2)}</span> | AI Prob:{' '}
                      <span className="text-slate-700 dark:text-slate-300 font-mono">{(m.probability * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-emerald-400 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl shadow-xs shrink-0">
                    @{m.odds.toFixed(2)}
                  </span>
                </div>
              ))}
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
