import React, { useState } from 'react';
import { X, TrendingUp, BarChart2, Zap, History, Trophy, Calendar, Users, Award, Shield } from 'lucide-react';
import { Fixture } from '../core/types.js';
import { PoissonMatrixView } from './PoissonMatrixView.js';
import { PoissonEngine } from '../core/poisson.js';

interface MatchDetailModalProps {
  fixture: Fixture | null;
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  fixture,
  onClose,
}) => {
  const [activeMeasurementTab, setActiveMeasurementTab] = useState<
    'H2H' | 'STANDING' | 'THIS_YEAR' | 'LAST_YEAR' | 'ELO'
  >('H2H');

  if (!fixture || !fixture.prediction) return null;

  const pred = fixture.prediction;
  const homeStats = fixture.homeStats;
  const awayStats = fixture.awayStats;

  // Retrieve computed measurements or derive fallback
  const measurements = pred.measurements || {
    h2h: PoissonEngine.computeHeadToHead(fixture.homeTeam, fixture.awayTeam, []),
    leagueStanding: PoissonEngine.computeLeagueStanding(fixture.homeTeam, fixture.awayTeam, []),
    thisYearPerformance: {
      home: PoissonEngine.computeSeasonPerformance(fixture.homeTeam, []),
      away: PoissonEngine.computeSeasonPerformance(fixture.awayTeam, []),
    },
    lastYearPerformance: {
      home: PoissonEngine.computeLastYearPerformance(fixture.homeTeam, []),
      away: PoissonEngine.computeLastYearPerformance(fixture.awayTeam, []),
    },
    eloRating: {
      home: PoissonEngine.computeEloRating(fixture.homeTeam, []),
      away: PoissonEngine.computeEloRating(fixture.awayTeam, []),
    },
    combinedWeights: {
      h2hWeight: 0.20,
      standingWeight: 0.20,
      thisYearWeight: 0.25,
      lastYearWeight: 0.15,
      eloRatingWeight: 0.20,
    },
  };

  const { h2h, leagueStanding, thisYearPerformance, lastYearPerformance, eloRating } = measurements;

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

          {/* Prediction Engine Measurements Section */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Prediction Engine Measurements</span>
              </h4>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Integrated Multi-Factor Model
              </span>
            </div>

            {/* Measurement Sub-Tabs */}
            <div className="flex items-center bg-white dark:bg-slate-950 p-1 rounded-xl shadow-xs overflow-x-auto no-scrollbar gap-1">
              <button
                type="button"
                onClick={() => setActiveMeasurementTab('H2H')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeMeasurementTab === 'H2H'
                    ? 'bg-slate-100 dark:bg-emerald-600 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3 h-3 text-emerald-500" />
                <span>H2H</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMeasurementTab('STANDING')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeMeasurementTab === 'STANDING'
                    ? 'bg-slate-100 dark:bg-emerald-600 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Trophy className="w-3 h-3 text-amber-500" />
                <span>Standing</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMeasurementTab('THIS_YEAR')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeMeasurementTab === 'THIS_YEAR'
                    ? 'bg-slate-100 dark:bg-emerald-600 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3 h-3 text-cyan-500" />
                <span>This Year</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMeasurementTab('LAST_YEAR')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeMeasurementTab === 'LAST_YEAR'
                    ? 'bg-slate-100 dark:bg-emerald-600 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Award className="w-3 h-3 text-violet-500" />
                <span>Last Year</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMeasurementTab('ELO')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeMeasurementTab === 'ELO'
                    ? 'bg-slate-100 dark:bg-emerald-600 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3 h-3 text-rose-500" />
                <span>Elo Rating</span>
              </button>
            </div>

            {/* Active Measurement Content */}
            <div className="bg-white dark:bg-slate-950 p-3 sm:p-4 rounded-xl shadow-xs text-xs space-y-2.5">
              {/* 1. Head to Head Tab */}
              {activeMeasurementTab === 'H2H' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Head to Head Record ({h2h.matchesCount} meetings)
                    </span>
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      Home Mult: x{h2h.h2hMultiplierHome} | Away Mult: x{h2h.h2hMultiplierAway}
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
              )}

              {/* 2. League Standing Tab */}
              {activeMeasurementTab === 'STANDING' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      League Table Standing
                    </span>
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      Advantage Factor: x{leagueStanding.standingAdvantageFactor}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{fixture.homeTeam}</div>
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-slate-500">Table Position:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{leagueStanding.homeRank} of {leagueStanding.totalTeams}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-slate-500">Points:</span>
                        <span className="font-bold">{leagueStanding.homePoints} pts</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-slate-500">Goal Difference:</span>
                        <span className="font-bold">{leagueStanding.homeGoalDiff > 0 ? `+${leagueStanding.homeGoalDiff}` : leagueStanding.homeGoalDiff}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{fixture.awayTeam}</div>
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-slate-500">Table Position:</span>
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">{leagueStanding.awayRank} of {leagueStanding.totalTeams}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-slate-500">Points:</span>
                        <span className="font-bold">{leagueStanding.awayPoints} pts</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-slate-500">Goal Difference:</span>
                        <span className="font-bold">{leagueStanding.awayGoalDiff > 0 ? `+${leagueStanding.awayGoalDiff}` : leagueStanding.awayGoalDiff}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Performance of This Year Tab */}
              {activeMeasurementTab === 'THIS_YEAR' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Current Year Performance
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Season 2024–2026 Record
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-1 font-mono text-[11px]">
                      <div className="font-bold text-slate-900 dark:text-white truncate font-sans text-xs">{fixture.homeTeam}</div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Win Rate:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{Math.round(thisYearPerformance.home.winRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Points Per Game:</span>
                        <span className="font-bold">{thisYearPerformance.home.pointsPerGame}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Goals Scored:</span>
                        <span className="font-bold">{thisYearPerformance.home.goalsPerGame} per game</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Clean Sheet Rate:</span>
                        <span className="font-bold">{Math.round(thisYearPerformance.home.cleanSheetRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Performance Score:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">x{thisYearPerformance.home.performanceScore}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-1 font-mono text-[11px]">
                      <div className="font-bold text-slate-900 dark:text-white truncate font-sans text-xs">{fixture.awayTeam}</div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Win Rate:</span>
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">{Math.round(thisYearPerformance.away.winRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Points Per Game:</span>
                        <span className="font-bold">{thisYearPerformance.away.pointsPerGame}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Goals Scored:</span>
                        <span className="font-bold">{thisYearPerformance.away.goalsPerGame} per game</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Clean Sheet Rate:</span>
                        <span className="font-bold">{Math.round(thisYearPerformance.away.cleanSheetRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Performance Score:</span>
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">x{thisYearPerformance.away.performanceScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Performance of Last Year Tab */}
              {activeMeasurementTab === 'LAST_YEAR' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Last Year Baseline &amp; Progression
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Historical Continuity Factor
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-1 font-mono text-[11px]">
                      <div className="font-bold text-slate-900 dark:text-white truncate font-sans text-xs">{fixture.homeTeam}</div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Last Year Rank:</span>
                        <span className="font-bold">{lastYearPerformance.home.lastYearRank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Last Year Win Rate:</span>
                        <span className="font-bold">{Math.round(lastYearPerformance.home.lastYearWinRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">YoY Progression:</span>
                        <span className={`font-bold ${lastYearPerformance.home.yearOverYearProgression >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                          {lastYearPerformance.home.yearOverYearProgression >= 0 ? '+' : ''}{(lastYearPerformance.home.yearOverYearProgression * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Baseline Multiplier:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">x{lastYearPerformance.home.historicalBaselineFactor}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-1 font-mono text-[11px]">
                      <div className="font-bold text-slate-900 dark:text-white truncate font-sans text-xs">{fixture.awayTeam}</div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Last Year Rank:</span>
                        <span className="font-bold">{lastYearPerformance.away.lastYearRank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Last Year Win Rate:</span>
                        <span className="font-bold">{Math.round(lastYearPerformance.away.lastYearWinRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">YoY Progression:</span>
                        <span className={`font-bold ${lastYearPerformance.away.yearOverYearProgression >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                          {lastYearPerformance.away.yearOverYearProgression >= 0 ? '+' : ''}{(lastYearPerformance.away.yearOverYearProgression * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500">Baseline Multiplier:</span>
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">x{lastYearPerformance.away.historicalBaselineFactor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Elo Rating Tab */}
              {activeMeasurementTab === 'ELO' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Elo Rating Analysis
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-1 font-mono text-[11px]">
                      <div className="font-bold text-slate-900 dark:text-white truncate font-sans text-xs">{fixture.homeTeam}</div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rating:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{measurements.eloRating.home.rating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Volatility:</span>
                        <span className="font-bold">{measurements.eloRating.home.volatility}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-1 font-mono text-[11px]">
                      <div className="font-bold text-slate-900 dark:text-white truncate font-sans text-xs">{fixture.awayTeam}</div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rating:</span>
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">{measurements.eloRating.away.rating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Volatility:</span>
                        <span className="font-bold">{measurements.eloRating.away.volatility}</span>
                      </div>
                    </div>
                  </div>
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

          {/* Match Dynamic Statistics from Scraper if present */}
          {fixture.statistics && fixture.statistics.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 shadow-xs space-y-2">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                Match Statistics
              </h4>
              <div className="space-y-1.5 text-xs font-mono">
                {fixture.statistics.map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950/60 shadow-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 w-16 text-left">{stat.homeValue}</span>
                    <span className="text-slate-600 dark:text-slate-300 font-sans text-center flex-1">{stat.category}</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 w-16 text-right">{stat.awayValue}</span>
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
