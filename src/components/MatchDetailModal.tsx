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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-emerald-950/40">
        {/* Header */}
        <div className="sticky top-0 bg-[#0F172A]/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {fixture.leagueName} ({fixture.league})
              </span>
              <span className="text-xs text-slate-400">
                Kick-off: {fixture.matchDate} @ {fixture.kickOffTime}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {fixture.homeTeam} <span className="text-slate-500 font-normal">vs</span> {fixture.awayTeam}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1X2 Probabilities */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium mb-1 flex items-center justify-between">
                <span>1X2 Win Probabilities</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between font-mono mt-2">
                <div className="text-center">
                  <div className="text-[10px] text-slate-400">{fixture.homeTeam.slice(0, 3).toUpperCase()}</div>
                  <div className="text-base font-bold text-emerald-400">{(pred.homeWinProb * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400">DRAW</div>
                  <div className="text-base font-bold text-amber-400">{(pred.drawProb * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400">{fixture.awayTeam.slice(0, 3).toUpperCase()}</div>
                  <div className="text-base font-bold text-cyan-400">{(pred.awayWinProb * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Expected Goals λ */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium mb-1 flex items-center justify-between">
                <span>Expected Goals (xG)</span>
                <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="flex items-center justify-around font-mono mt-2">
                <div className="text-center">
                  <span className="text-xs text-slate-400">Home λ: </span>
                  <span className="text-base font-bold text-white">{pred.homeXG}</span>
                </div>
                <div className="text-slate-600 font-bold">:</div>
                <div className="text-center">
                  <span className="text-xs text-slate-400">Away λ: </span>
                  <span className="text-base font-bold text-white">{pred.awayXG}</span>
                </div>
              </div>
            </div>

            {/* Total Goals & BTTS */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium mb-1 flex items-center justify-between">
                <span>Goal Line &amp; BTTS</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-center justify-between font-mono text-xs mt-2">
                <div>
                  <span className="text-slate-400">Over 2.5: </span>
                  <span className="font-bold text-slate-200">{(pred.over25Prob * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-400">BTTS: </span>
                  <span className="font-bold text-slate-200">{(pred.bttsProb * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Attack & Defense Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Home Team Stats */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-white">{fixture.homeTeam} (Home)</h4>
                <span className="text-xs font-mono text-emerald-400">Form Mult: x{pred.homeFormMultiplier}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Attack Strength</div>
                  <div className="text-sm font-bold text-emerald-400">{pred.homeAttackStrength}</div>
                </div>
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Defense Strength</div>
                  <div className="text-sm font-bold text-emerald-400">{pred.homeDefenseStrength}</div>
                </div>
              </div>
              {homeStats && homeStats.recentMatches && (
                <div className="pt-1">
                  <div className="text-[10px] text-slate-400 mb-1">Recent Matches:</div>
                  <div className="space-y-1">
                    {homeStats.recentMatches.slice(0, 3).map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>vs {m.opponent}</span>
                        <span className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                          m.result === 'W' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          m.result === 'D' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-rose-950 text-rose-400 border border-rose-800'
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
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-white">{fixture.awayTeam} (Away)</h4>
                <span className="text-xs font-mono text-cyan-400">Form Mult: x{pred.awayFormMultiplier}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Attack Strength</div>
                  <div className="text-sm font-bold text-cyan-400">{pred.awayAttackStrength}</div>
                </div>
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Defense Strength</div>
                  <div className="text-sm font-bold text-cyan-400">{pred.awayDefenseStrength}</div>
                </div>
              </div>
              {awayStats && awayStats.recentMatches && (
                <div className="pt-1">
                  <div className="text-[10px] text-slate-400 mb-1">Recent Matches:</div>
                  <div className="space-y-1">
                    {awayStats.recentMatches.slice(0, 3).map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>vs {m.opponent}</span>
                        <span className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                          m.result === 'W' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          m.result === 'D' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-rose-950 text-rose-400 border border-rose-800'
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

          {/* Poisson 5x5 Heatmap Matrix */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <PoissonMatrixView
              prediction={pred}
              homeTeam={fixture.homeTeam}
              awayTeam={fixture.awayTeam}
            />
          </div>

          {/* All Available Betting Markets with +EV calculation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Available Betting Markets &amp; Expected Value (+EV)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(fixture.markets || []).map((m) => (
                <div
                  key={m.key}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    m.isPositiveEV
                      ? 'bg-emerald-950/20 border-emerald-800/60'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white">{m.name}</span>
                      {m.isPositiveEV && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/60 px-1.5 py-0.2 rounded border border-emerald-700/50">
                          +{(m.expectedValue * 100).toFixed(1)}% EV
                        </span>
                      )}
                      {m.isBanker && (
                        <span className="text-[10px] font-bold text-violet-400 bg-violet-900/60 px-1.5 py-0.2 rounded border border-violet-700/50">
                          Banker
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Odds: <span className="text-white font-mono font-bold">{m.odds.toFixed(2)}</span> | AI Prob:{' '}
                      <span className="text-slate-300 font-mono">{(m.probability * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-xs text-emerald-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                    @{m.odds.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
