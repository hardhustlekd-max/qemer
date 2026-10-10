import React, { useState, useMemo, useEffect } from 'react';
import { X, History, Calendar, Clock } from 'lucide-react';
import { Fixture, HeadToHeadMeasurement } from '../core/types.js';
import { PoissonMatrixView } from './PoissonMatrixView.js';
import { PoissonEngine } from '../core/poisson.js';
import { parseDynamicStatistics, StatCategoryGroup } from '../core/statisticsParser.js';
import { EngineService } from '../services/engineService.js';

interface MatchDetailModalProps {
  fixture: Fixture | null;
  onClose: () => void;
}

type ModalTab = 'OVERVIEW' | 'H2H' | 'STATS' | 'TEAMS';

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
  const [activeTab, setActiveTab] = useState<ModalTab>('OVERVIEW');
  const [statFilterGroup, setStatFilterGroup] = useState<StatCategoryGroup>('ALL');

  const pred = fixture.prediction!;
  const homeStats = fixture.homeStats;
  const awayStats = fixture.awayStats;

  // Real Scraped Head to Head synchronization
  const initialH2H = pred.measurements?.h2h && pred.measurements.h2h.matchesCount > 0
    ? pred.measurements.h2h
    : null;
  const [scrapedH2H, setScrapedH2H] = useState<HeadToHeadMeasurement | null>(initialH2H);
  const [isLoadingH2H, setIsLoadingH2H] = useState<boolean>(!initialH2H);

  useEffect(() => {
    let isCancelled = false;
    async function loadRealH2H() {
      if (initialH2H && initialH2H.matchesCount > 0) {
        setIsLoadingH2H(false);
        return;
      }

      try {
        setIsLoadingH2H(true);
        const data = await EngineService.getMatchHeadToHead(fixture.id, fixture.homeTeam, fixture.awayTeam);
        if (!isCancelled && data && data.matchesCount > 0) {
          setScrapedH2H(data);
        }
      } catch (err) {
        console.warn('Unable to load live H2H:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingH2H(false);
        }
      }
    }

    loadRealH2H();
    return () => {
      isCancelled = true;
    };
  }, [fixture.id, fixture.homeTeam, fixture.awayTeam]);

  const h2h: HeadToHeadMeasurement = scrapedH2H || pred.measurements?.h2h || {
    matchesCount: 0,
    homeWins: 0,
    draws: 0,
    awayWins: 0,
    homeGoalsAvg: 0,
    awayGoalsAvg: 0,
    h2hMultiplierHome: 1.0,
    h2hMultiplierAway: 1.0,
    recentH2H: [],
  };

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

  // Probabilities converted to percentages
  const homeWinPct = Math.round(pred.homeWinProb * 1000) / 10;
  const drawPct = Math.round(pred.drawProb * 1000) / 10;
  const awayWinPct = Math.round(pred.awayWinProb * 1000) / 10;

  const topScores = pred.topCorrectScores?.slice(0, 5) || [];

  // Best recommended prediction label
  const topPredictionLabel = pred.homeWinProb >= pred.awayWinProb && pred.homeWinProb >= pred.drawProb
    ? `${fixture.homeTeam} Win`
    : pred.awayWinProb >= pred.homeWinProb && pred.awayWinProb >= pred.drawProb
    ? `${fixture.awayTeam} Win`
    : 'Draw';

  const topPredictionProb = Math.max(pred.homeWinProb, pred.drawProb, pred.awayWinProb);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-sans">
      <div className="bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-slate-900/10 dark:shadow-black/70 border border-slate-100 dark:border-slate-800/80">
        
        {/* Modal Top Bar */}
        <div className="bg-white dark:bg-[#0B0F17] px-4 sm:px-6 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
          <div className="flex items-center justify-between gap-3 min-w-0">
            {/* Competition & Timing Metadata */}
            <div className="flex items-center gap-2 min-w-0 flex-nowrap overflow-x-auto no-scrollbar text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate whitespace-nowrap">
                {fixture.stage || fixture.leagueName}
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600 shrink-0">·</span>
              <span className="flex items-center gap-1 font-mono text-[11px] whitespace-nowrap shrink-0">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{fixture.matchDate}</span>
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600 shrink-0">·</span>
              <span className="flex items-center gap-1 font-mono text-[11px] whitespace-nowrap shrink-0">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{fixture.kickOffTime}</span>
              </span>
              {fixture.status === 'LIVE' && (
                <>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600 shrink-0">·</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 text-[11px] whitespace-nowrap shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Live In Play
                  </span>
                </>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0 shadow-2xs"
              aria-label="Close match details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hero Scoreboard Banner */}
          <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 min-w-0">
            <div className="grid grid-cols-12 items-center gap-2 sm:gap-4">
              
              {/* Home Team */}
              <div className="col-span-5 flex items-center gap-2.5 min-w-0 flex-nowrap">
                {fixture.homeBadge ? (
                  <img
                    src={fixture.homeBadge}
                    alt=""
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0 rounded-full"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-black text-sm flex items-center justify-center shrink-0">
                    {fixture.homeTeam.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate whitespace-nowrap block" title={fixture.homeTeam}>
                    {fixture.homeTeam}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-nowrap">
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold whitespace-nowrap shrink-0">
                      {homeWinPct}% Win
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline whitespace-nowrap shrink-0">
                      xG {pred.homeXG}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center Match Status or Score */}
              <div className="col-span-2 flex flex-col items-center justify-center text-center shrink-0">
                {fixture.score && fixture.score.home !== undefined ? (
                  <div>
                    <span className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                      {fixture.score.home} : {fixture.score.away}
                    </span>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-0.5 whitespace-nowrap">
                      {fixture.status === 'LIVE' ? (fixture.minute ? `${fixture.minute}'` : 'Live') : 'Full Time'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-white dark:bg-[#070A0F] text-slate-400 dark:text-slate-500 shadow-2xs whitespace-nowrap">
                      VS
                    </span>
                    <span className="block text-[10px] font-mono text-slate-400 mt-1 whitespace-nowrap">
                      {fixture.kickOffTime}
                    </span>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="col-span-5 flex items-center justify-end gap-2.5 min-w-0 text-right flex-nowrap">
                <div className="min-w-0 flex-1">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate whitespace-nowrap block" title={fixture.awayTeam}>
                    {fixture.awayTeam}
                  </span>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5 flex-nowrap">
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline whitespace-nowrap shrink-0">
                      xG {pred.awayXG}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 font-mono text-[10px] font-bold whitespace-nowrap shrink-0">
                      {awayWinPct}% Win
                    </span>
                  </div>
                </div>
                {fixture.awayBadge ? (
                  <img
                    src={fixture.awayBadge}
                    alt=""
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0 rounded-full"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 font-black text-sm flex items-center justify-center shrink-0">
                    {fixture.awayTeam.slice(0, 1)}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Segmented Sub-Navigation Bar */}
          <div className="mt-3 w-full flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-2xl overflow-x-auto no-scrollbar flex-nowrap shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('OVERVIEW')}
              className={`flex-1 min-w-[68px] sm:min-w-0 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 sm:shrink flex items-center justify-center ${
                activeTab === 'OVERVIEW'
                  ? 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('H2H')}
              className={`flex-1 min-w-[56px] sm:min-w-0 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 sm:shrink flex items-center justify-center gap-1.5 ${
                activeTab === 'H2H'
                  ? 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>H2H</span>
              {h2h.matchesCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                  {h2h.matchesCount}
                </span>
              )}
            </button>

            {parsedStatsSummary.items.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('STATS')}
                className={`flex-1 min-w-[76px] sm:min-w-0 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 sm:shrink flex items-center justify-center gap-1.5 ${
                  activeTab === 'STATS'
                    ? 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>Statistics</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 font-mono font-bold">
                  {parsedStatsSummary.items.length}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('TEAMS')}
              className={`flex-1 min-w-[76px] sm:min-w-0 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 sm:shrink flex items-center justify-center ${
                activeTab === 'TEAMS'
                  ? 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Team Form</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Win Probability Proportional Gauge & Cards */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Outcome Probabilities
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Poisson Model
                  </span>
                </div>

                {/* 3-Section Proportional Bar */}
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full flex overflow-hidden">
                  <div style={{ width: `${homeWinPct}%` }} className="bg-emerald-500 transition-all duration-300" />
                  <div style={{ width: `${drawPct}%` }} className="bg-amber-500 transition-all duration-300" />
                  <div style={{ width: `${awayWinPct}%` }} className="bg-cyan-500 transition-all duration-300" />
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                  <div className="p-3 rounded-xl bg-white dark:bg-[#070A0F] text-center shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-sans">
                      {fixture.homeTeam} Win
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {homeWinPct}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Odds {fixture.odds.homeWin.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#070A0F] text-center shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                      Draw
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400 block mt-0.5">
                      {drawPct}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Odds {fixture.odds.draw.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#070A0F] text-center shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-sans">
                      {fixture.awayTeam} Win
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-cyan-600 dark:text-cyan-400 block mt-0.5">
                      {awayWinPct}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Odds {fixture.odds.awayWin.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Projections List (Draw, Over under, BTTS, Top Pick) */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-xs font-mono">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Draw</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{drawPct}%</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Over 2.5 Goals</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{(pred.over25Prob * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">BTTS</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{(pred.bttsProb * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Top Pick</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                      {topPredictionLabel} ({Math.round(topPredictionProb * 100)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Market Projections List */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-sans">
                  Key Projections
                </span>
                <div className="space-y-1.5 font-mono">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-sans">Expected Goals</span>
                    <div className="font-bold text-slate-900 dark:text-white">
                      <span className="text-emerald-600 dark:text-emerald-400">{pred.homeXG}</span>
                      <span className="text-slate-400 px-1 font-normal">vs</span>
                      <span className="text-cyan-600 dark:text-cyan-400">{pred.awayXG}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-sans">Over 2.5 Goals</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {(pred.over25Prob * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-sans">Both Teams Score</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {(pred.bttsProb * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-sans">Over 1.5 Goals</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {(pred.over15Prob * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Most Probable Correct Scores */}
              {topScores.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Most Probable Scorelines
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Top Exact Scores
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 font-mono text-center">
                    {topScores.map((scoreItem, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs"
                      >
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                          {scoreItem.score}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          {(scoreItem.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Poisson Heatmap Matrix */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                <PoissonMatrixView
                  prediction={pred}
                  homeTeam={fixture.homeTeam}
                  awayTeam={fixture.awayTeam}
                  showTopScores={false}
                />
              </div>
            </div>
          )}

          {/* TAB 2: HEAD TO HEAD */}
          {activeTab === 'H2H' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Summary Metrics */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-3.5">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Head to Head Record
                  </span>
                </div>

                {/* 3 Outcome Summary Cards */}
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="p-3 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-sans">
                      {fixture.homeTeam} Wins
                    </span>
                    <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {h2h.homeWins}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                      Draws
                    </span>
                    <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 block mt-0.5">
                      {h2h.draws}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-sans">
                      {fixture.awayTeam} Wins
                    </span>
                    <span className="text-base sm:text-lg font-black text-cyan-600 dark:text-cyan-400 block mt-0.5">
                      {h2h.awayWins}
                    </span>
                  </div>
                </div>

                {/* Key Insights (Averages & Multipliers) */}
                <div className="space-y-1.5 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] font-sans">
                      Goals Per Match
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {h2h.homeGoalsAvg} vs {h2h.awayGoalsAvg}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] font-sans">
                      H2H Factor
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      x{h2h.h2hMultiplierHome} vs x{h2h.h2hMultiplierAway}
                    </span>
                  </div>
                </div>
              </div>

              {/* Historical Match Encounters List */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Past Encounters
                </span>

                {isLoadingH2H ? (
                  <div className="py-8 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Loading records...</span>
                  </div>
                ) : h2h.recentH2H && h2h.recentH2H.length > 0 ? (
                  <div className="space-y-1.5">
                    {h2h.recentH2H.map((enc, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="text-[10px] text-slate-400 shrink-0 font-sans">
                            {enc.date}
                          </span>
                          {enc.competition && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px] hidden sm:inline">
                              {enc.competition}
                            </span>
                          )}
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {enc.homeTeam} vs {enc.awayTeam}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                              enc.winner === 'HOME'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                : enc.winner === 'AWAY'
                                ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {enc.score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 font-mono">
                    No previous encounters recorded
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STATISTICS */}
          {activeTab === 'STATS' && parsedStatsSummary.items.length > 0 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Possession Comparative Gauge */}
              {parsedStatsSummary.possession && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {parsedStatsSummary.possession.home}%
                    </span>
                    <span className="font-sans text-xs font-bold text-slate-700 dark:text-slate-300">
                      Ball Possession
                    </span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                      {parsedStatsSummary.possession.away}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full flex overflow-hidden">
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

              {/* Dynamic Group Filter */}
              {parsedStatsSummary.availableGroups.length > 1 && (
                <div className="w-full flex items-center bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl overflow-x-auto no-scrollbar gap-1 flex-nowrap shrink-0">
                  {parsedStatsSummary.availableGroups.map((g) => (
                    <button
                      key={g.group}
                      type="button"
                      onClick={() => setStatFilterGroup(g.group)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                        statFilterGroup === g.group
                          ? 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>{g.label}</span>
                      <span className="text-[10px] opacity-75 font-mono">({g.count})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Parsed Metric Items */}
              <div className="space-y-1.5">
                {filteredStatItems.map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span
                        className={`font-bold w-14 text-left ${
                          stat.leader === 'HOME'
                            ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {stat.home.raw}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-sans font-semibold text-center flex-1 truncate px-2 text-xs">
                        {stat.category}
                      </span>
                      <span
                        className={`font-bold w-14 text-right ${
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
                          stat.isInverseMetric ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                      />
                      <div
                        style={{ width: `${stat.awaySharePercent}%` }}
                        className={`transition-all duration-300 ${
                          stat.isInverseMetric ? 'bg-amber-500' : 'bg-cyan-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Match Venue & Details if provided */}
              {(fixture.stage || (fixture.information && fixture.information.length > 0)) && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Venue Details
                  </span>
                  <div className="space-y-1.5 text-xs font-mono">
                    {fixture.information?.map((info, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between gap-3"
                      >
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">{info.category}</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate text-right">{info.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TEAMS & FORM */}
          {activeTab === 'TEAMS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
              
              {/* Home Team Analysis */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white block">
                      {fixture.homeTeam}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Home Form & Statistics
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                    x{pred.homeFormMultiplier} Form
                  </span>
                </div>

                {/* Recent Form Sequence Badges */}
                {homeStats?.recentForm && homeStats.recentForm.length > 0 && (
                  <div className="p-3 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">Form Guide</span>
                    <div className="flex items-center gap-1 font-mono">
                      {homeStats.recentForm.slice(0, 10).map((r, i) => (
                        <span
                          key={i}
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                            r === 'W'
                              ? 'bg-emerald-500 text-white'
                              : r === 'D'
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ratings & Averages */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Attack Rating</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {pred.homeAttackStrength}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Defense Rating</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {pred.homeDefenseStrength}
                    </span>
                  </div>
                </div>

                {homeStats && (
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">Goals Scored / Conceded</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {homeStats.goalsScored} / {homeStats.goalsConceded}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">Goals Averages</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {homeStats.avgGoalsScored} - {homeStats.avgGoalsConceded} per match
                      </span>
                    </div>
                  </div>
                )}

                {homeStats?.recentMatches && homeStats.recentMatches.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-sans">
                      Recent Matches
                    </span>
                    <div className="space-y-1.5 font-mono">
                      {homeStats.recentMatches.slice(0, 10).map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="text-[10px] text-slate-400 font-sans">{m.date}</span>
                            <span className="truncate text-slate-700 dark:text-slate-300">vs {m.opponent}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold shrink-0 ${
                              m.result === 'W'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                : m.result === 'D'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {m.result} {m.goalsFor}-{m.goalsAgainst}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Away Team Analysis */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white block">
                      {fixture.awayTeam}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Away Form & Statistics
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 font-mono font-bold">
                    x{pred.awayFormMultiplier} Form
                  </span>
                </div>

                {/* Recent Form Sequence Badges */}
                {awayStats?.recentForm && awayStats.recentForm.length > 0 && (
                  <div className="p-3 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">Form Guide</span>
                    <div className="flex items-center gap-1 font-mono">
                      {awayStats.recentForm.slice(0, 10).map((r, i) => (
                        <span
                          key={i}
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                            r === 'W'
                              ? 'bg-emerald-500 text-white'
                              : r === 'D'
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ratings & Averages */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Attack Rating</span>
                    <span className="text-base font-extrabold text-cyan-600 dark:text-cyan-400 block mt-0.5">
                      {pred.awayAttackStrength}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Defense Rating</span>
                    <span className="text-base font-extrabold text-cyan-600 dark:text-cyan-400 block mt-0.5">
                      {pred.awayDefenseStrength}
                    </span>
                  </div>
                </div>

                {awayStats && (
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">Goals Scored / Conceded</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {awayStats.goalsScored} / {awayStats.goalsConceded}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">Goals Averages</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {awayStats.avgGoalsScored} - {awayStats.avgGoalsConceded} per match
                      </span>
                    </div>
                  </div>
                )}

                {awayStats?.recentMatches && awayStats.recentMatches.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-sans">
                      Recent Matches
                    </span>
                    <div className="space-y-1.5 font-mono">
                      {awayStats.recentMatches.slice(0, 10).map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white dark:bg-[#070A0F] shadow-xs flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="text-[10px] text-slate-400 font-sans">{m.date}</span>
                            <span className="truncate text-slate-700 dark:text-slate-300">vs {m.opponent}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold shrink-0 ${
                              m.result === 'W'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                : m.result === 'D'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {m.result} {m.goalsFor}-{m.goalsAgainst}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
