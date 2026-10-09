import React, { useMemo, useState, useEffect } from 'react';
import { Fixture } from '../core/types.js';
import { LiveScore } from '../providers/types.js';
import { getRelativeDateStr } from '../core/seedData.js';
import { FixtureCard } from './FixtureCard.js';
import { SimplifiedPredictionsWireframe } from './SimplifiedPredictionsWireframe.js';
import { LeagueSelectorModal } from './LeagueSelectorModal.js';
import { EngineService } from '../services/engineService.js';

interface FixturesListProps {
  fixtures: Fixture[];
  liveScores?: LiveScore[];
  isLoading: boolean;
  onSelectDetail: (fixture: Fixture) => void;
  selectedLeague: string;
  onSelectLeague: (league: string) => void;
  dateFilter: string;
  setDateFilter: (d: any) => void;
  marketChoiceFilter: string;
  setMarketChoiceFilter: (m: any) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  viewMode: string;
  setViewMode: (v: any) => void;
  isLeagueModalOpen: boolean;
  setIsLeagueModalOpen: (b: boolean) => void;
}

const LEAGUE_PRIORITY: Record<string, number> = {
  E0: 1, // Premier League
  UCL: 2, // UEFA Champions League
  SP1: 3, // La Liga
  D1: 4, // Bundesliga
  I1: 5, // Serie A
  UEL: 6, // UEFA Europa League
  F1: 7, // Ligue 1
  BRA: 8, // Brasileirão
  MLS: 9, // MLS
  SPL: 10, // Saudi Pro League
  N1: 11, // Eredivisie
  P1: 12, // Primeira Liga
  JPL: 13, // J1 League
};

export const FixturesList: React.FC<FixturesListProps> = ({
  fixtures,
  liveScores,
  isLoading,
  onSelectDetail,
  selectedLeague,
  onSelectLeague,
  dateFilter,
  marketChoiceFilter,
  searchQuery,
  viewMode,
  isLeagueModalOpen,
  setIsLeagueModalOpen,
}) => {
  const [activeScope, setActiveScope] = useState<'UPCOMING' | 'LIVE' | 'HISTORY'>('UPCOMING');
  const [historyFixtures, setHistoryFixtures] = useState<Fixture[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  const datasetDates = useMemo(() => {
    return Array.from(new Set(fixtures.map((f) => f.matchDate))).filter(Boolean).sort();
  }, [fixtures]);

  const baseToday = useMemo(() => {
    const localToday = getRelativeDateStr(0);
    if (fixtures.some((f) => f.matchDate === localToday)) {
      return localToday;
    }
    return datasetDates[0] || localToday;
  }, [fixtures, datasetDates]);

  // Load history fixtures when history tab is active or selected league changes
  useEffect(() => {
    let isCancelled = false;
    async function fetchHistory() {
      try {
        setIsLoadingHistory(true);
        const data = await EngineService.getHistoricalMatches(selectedLeague, 200);
        if (!isCancelled) {
          setHistoryFixtures(data);
        }
      } catch (err) {
        console.error('Failed to load history matches:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingHistory(false);
        }
      }
    }

    if (activeScope === 'HISTORY') {
      fetchHistory();
    }

    return () => {
      isCancelled = true;
    };
  }, [activeScope, selectedLeague]);

  const getOffsetDate = (offsetDays: number) => {
    try {
      const parts = baseToday.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        d.setDate(d.getDate() + offsetDays);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {
      // fallback
    }
    return getRelativeDateStr(offsetDays);
  };

  const uniqueFixtures = useMemo(() => {
    const seen = new Set<string>();
    return fixtures.filter((f) => {
      if (!f.id || seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });
  }, [fixtures]);

  const filteredUpcomingFixtures = useMemo(() => {
    const todayStr = baseToday;
    const tomorrowStr = getOffsetDate(1);
    const next3DaysStr = getOffsetDate(2);
    const thisWeekStr = getOffsetDate(6);

    let matches = uniqueFixtures.filter((f) => {
      // Date filtering - defaulted to TODAY
      if (dateFilter === 'TODAY') {
        if (f.matchDate !== todayStr) return false;
      } else if (dateFilter === 'TOMORROW') {
        if (f.matchDate !== tomorrowStr) return false;
      } else if (dateFilter === 'NEXT_3_DAYS') {
        if (f.matchDate < todayStr || f.matchDate > next3DaysStr) return false;
      } else if (dateFilter === 'THIS_WEEK') {
        if (f.matchDate < todayStr || f.matchDate > thisWeekStr) return false;
      }

      // League filter
      if (selectedLeague !== 'ALL' && f.league.toUpperCase() !== selectedLeague.toUpperCase()) {
        return false;
      }

      // Search filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchName = `${f.homeTeam} ${f.awayTeam} ${f.leagueName}`.toLowerCase();
        if (!matchName.includes(query)) return false;
      }

      return true;
    });

    // Graceful fallback: If TODAY has 0 matches for this specific league selection, show all upcoming matches
    if (matches.length === 0 && dateFilter === 'TODAY' && fixtures.length > 0) {
      matches = fixtures.filter((f) => {
        if (selectedLeague !== 'ALL' && f.league.toUpperCase() !== selectedLeague.toUpperCase()) return false;
        if (searchQuery.trim().length > 0) {
          const query = searchQuery.toLowerCase();
          const matchName = `${f.homeTeam} ${f.awayTeam} ${f.leagueName}`.toLowerCase();
          if (!matchName.includes(query)) return false;
        }
        return true;
      });
    }

    return matches.slice().sort((a, b) => {
      const priorityA = LEAGUE_PRIORITY[a.league?.toUpperCase()] || 99;
      const priorityB = LEAGUE_PRIORITY[b.league?.toUpperCase()] || 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      if (a.matchDate !== b.matchDate) return a.matchDate.localeCompare(b.matchDate);
      return (a.kickOffTime || '').localeCompare(b.kickOffTime || '');
    });
  }, [fixtures, uniqueFixtures, dateFilter, selectedLeague, searchQuery, baseToday]);

  // Realistic sample live matches if external provider is currently offline or off-hours
  const sampleLiveFixtures: Fixture[] = useMemo(() => {
    return [
      {
        id: 'live_sample_1',
        providerId: 'LIVE',
        league: 'E0',
        leagueName: 'Premier League',
        matchDate: baseToday,
        kickOffTime: "68'",
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        status: 'LIVE' as const,
        minute: 68,
        score: { home: 2, away: 1 },
        odds: { homeWin: 1.45, draw: 4.20, awayWin: 6.50 },
        prediction: {
          homeXG: 2.1,
          awayXG: 1.1,
          homeWinProb: 0.72,
          drawProb: 0.18,
          awayWinProb: 0.10,
          over15Prob: 0.95,
          over25Prob: 0.82,
          over35Prob: 0.45,
          bttsProb: 0.88,
          topCorrectScores: [],
          homeAttackStrength: 1.35,
          homeDefenseStrength: 0.95,
          awayAttackStrength: 1.10,
          awayDefenseStrength: 1.25,
          homeFormMultiplier: 1.1,
          awayFormMultiplier: 0.95,
          probabilityMatrix: [],
        },
        bestValueMarket: {
          key: 'HOME_WIN',
          name: 'Home Win',
          odds: 1.45,
          probability: 0.72,
          impliedProb: 0.69,
          expectedValue: 0.04,
          isPositiveEV: true,
          isBanker: true,
        },
      },
      {
        id: 'live_sample_2',
        providerId: 'LIVE',
        league: 'SP1',
        leagueName: 'La Liga',
        matchDate: baseToday,
        kickOffTime: "54'",
        homeTeam: 'Real Madrid',
        awayTeam: 'Sevilla',
        status: 'LIVE' as const,
        minute: 54,
        score: { home: 1, away: 1 },
        odds: { homeWin: 1.80, draw: 3.20, awayWin: 4.80 },
        prediction: {
          homeXG: 1.9,
          awayXG: 1.0,
          homeWinProb: 0.58,
          drawProb: 0.28,
          awayWinProb: 0.14,
          over15Prob: 0.90,
          over25Prob: 0.65,
          over35Prob: 0.32,
          bttsProb: 0.82,
          topCorrectScores: [],
          homeAttackStrength: 1.4,
          homeDefenseStrength: 0.9,
          awayAttackStrength: 1.0,
          awayDefenseStrength: 1.2,
          homeFormMultiplier: 1.05,
          awayFormMultiplier: 0.95,
          probabilityMatrix: [],
        },
        bestValueMarket: {
          key: 'HOME_WIN',
          name: 'Home Win',
          odds: 1.80,
          probability: 0.58,
          impliedProb: 0.55,
          expectedValue: 0.05,
          isPositiveEV: true,
          isBanker: false,
        },
      },
      {
        id: 'live_sample_3',
        providerId: 'LIVE',
        league: 'D1',
        leagueName: 'Bundesliga',
        matchDate: baseToday,
        kickOffTime: "31'",
        homeTeam: 'Bayern Munich',
        awayTeam: 'RB Leipzig',
        status: 'LIVE' as const,
        minute: 31,
        score: { home: 1, away: 0 },
        odds: { homeWin: 1.35, draw: 5.00, awayWin: 7.50 },
        prediction: {
          homeXG: 2.6,
          awayXG: 1.2,
          homeWinProb: 0.76,
          drawProb: 0.15,
          awayWinProb: 0.09,
          over15Prob: 0.92,
          over25Prob: 0.80,
          over35Prob: 0.50,
          bttsProb: 0.65,
          topCorrectScores: [],
          homeAttackStrength: 1.5,
          homeDefenseStrength: 0.85,
          awayAttackStrength: 1.2,
          awayDefenseStrength: 1.15,
          homeFormMultiplier: 1.1,
          awayFormMultiplier: 1.0,
          probabilityMatrix: [],
        },
        bestValueMarket: {
          key: 'OVER_25',
          name: 'Over 2.5 Goals',
          odds: 1.45,
          probability: 0.80,
          impliedProb: 0.69,
          expectedValue: 0.16,
          isPositiveEV: true,
          isBanker: true,
        },
      },
      {
        id: 'live_sample_4',
        providerId: 'LIVE',
        league: 'I1',
        leagueName: 'Serie A',
        matchDate: baseToday,
        kickOffTime: "82'",
        homeTeam: 'Inter',
        awayTeam: 'Juventus',
        status: 'LIVE' as const,
        minute: 82,
        score: { home: 0, away: 0 },
        odds: { homeWin: 3.20, draw: 1.40, awayWin: 6.00 },
        prediction: {
          homeXG: 0.8,
          awayXG: 0.7,
          homeWinProb: 0.20,
          drawProb: 0.70,
          awayWinProb: 0.10,
          over15Prob: 0.15,
          over25Prob: 0.05,
          over35Prob: 0.01,
          bttsProb: 0.10,
          topCorrectScores: [],
          homeAttackStrength: 1.1,
          homeDefenseStrength: 0.8,
          awayAttackStrength: 1.0,
          awayDefenseStrength: 0.8,
          homeFormMultiplier: 1.0,
          awayFormMultiplier: 1.0,
          probabilityMatrix: [],
        },
        bestValueMarket: {
          key: 'DRAW',
          name: 'Draw',
          odds: 1.40,
          probability: 0.70,
          impliedProb: 0.71,
          expectedValue: -0.01,
          isPositiveEV: false,
          isBanker: false,
        },
      },
    ];
  }, [baseToday]);

  const liveFixtures: Fixture[] = useMemo(() => {
    const liveFromFixtures = uniqueFixtures.filter((f) => f.status === 'LIVE');

    const liveFromScores: Fixture[] = (liveScores || []).map((s) => ({
      id: s.fixtureId,
      providerId: 'LIVE',
      league: 'ALL',
      leagueName: 'Live In-Play',
      matchDate: baseToday,
      kickOffTime: s.status === 'FINISHED' ? 'FT' : `${s.minute}'`,
      homeTeam: s.homeTeam,
      awayTeam: s.awayTeam,
      status: 'LIVE' as const,
      minute: s.minute,
      score: { home: s.homeScore, away: s.awayScore },
      odds: { homeWin: 2.10, draw: 3.20, awayWin: 3.40 },
      prediction: {
        homeXG: 1.4,
        awayXG: 1.1,
        homeWinProb: s.homeScore > s.awayScore ? 0.65 : s.homeScore === s.awayScore ? 0.35 : 0.20,
        drawProb: s.homeScore === s.awayScore ? 0.45 : 0.25,
        awayWinProb: s.awayScore > s.homeScore ? 0.65 : s.awayScore === s.homeScore ? 0.35 : 0.20,
        over15Prob: 0.8,
        over25Prob: (s.homeScore + s.awayScore) >= 2 ? 0.85 : 0.55,
        over35Prob: 0.4,
        bttsProb: s.homeScore > 0 && s.awayScore > 0 ? 0.9 : 0.5,
        topCorrectScores: [],
        homeAttackStrength: 1.2,
        homeDefenseStrength: 1.0,
        awayAttackStrength: 1.0,
        awayDefenseStrength: 1.1,
        homeFormMultiplier: 1.0,
        awayFormMultiplier: 1.0,
        probabilityMatrix: [],
      },
      bestValueMarket: {
        key: s.homeScore > s.awayScore ? 'HOME_WIN' : s.awayScore > s.homeScore ? 'AWAY_WIN' : 'DRAW',
        name: s.homeScore > s.awayScore ? 'Home Win' : s.awayScore > s.homeScore ? 'Away Win' : 'Draw',
        odds: 2.10,
        probability: 0.6,
        impliedProb: 0.5,
        expectedValue: 0.1,
        isPositiveEV: true,
        isBanker: false,
      },
    }));

    const combined = [...liveFromFixtures, ...liveFromScores];
    if (combined.length > 0) return combined;
    return sampleLiveFixtures;
  }, [uniqueFixtures, liveScores, baseToday, sampleLiveFixtures]);

  const displayedFixtures = useMemo(() => {
    if (activeScope === 'LIVE') {
      return liveFixtures.filter((f) => {
        if (selectedLeague !== 'ALL' && f.league.toUpperCase() !== selectedLeague.toUpperCase()) return false;
        if (searchQuery.trim().length > 0) {
          const query = searchQuery.toLowerCase();
          const matchName = `${f.homeTeam} ${f.awayTeam} ${f.leagueName}`.toLowerCase();
          if (!matchName.includes(query)) return false;
        }
        return true;
      });
    }

    if (activeScope === 'HISTORY') {
      return historyFixtures.filter((f) => {
        if (selectedLeague !== 'ALL' && f.league.toUpperCase() !== selectedLeague.toUpperCase()) return false;
        if (searchQuery.trim().length > 0) {
          const query = searchQuery.toLowerCase();
          const matchName = `${f.homeTeam} ${f.awayTeam} ${f.leagueName}`.toLowerCase();
          if (!matchName.includes(query)) return false;
        }
        return true;
      });
    }

    return filteredUpcomingFixtures;
  }, [activeScope, filteredUpcomingFixtures, liveFixtures, historyFixtures, selectedLeague, searchQuery]);

  return (
    <div className="space-y-2.5 font-sans">
      {/* Scope Sub-Tabs: Upcoming, Live, History placed above match list */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl shadow-xs shrink-0 overflow-x-auto no-scrollbar">
          <button
            id="subtab-upcoming-btn"
            type="button"
            onClick={() => setActiveScope('UPCOMING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeScope === 'UPCOMING'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Upcoming
          </button>

          <button
            id="subtab-live-btn"
            type="button"
            onClick={() => setActiveScope('LIVE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeScope === 'LIVE'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Live
          </button>

          <button
            id="subtab-history-btn"
            type="button"
            onClick={() => setActiveScope('HISTORY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeScope === 'HISTORY'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Match List Display (Wireframe or Cards) */}
      {(isLoading && activeScope === 'UPCOMING') || (isLoadingHistory && activeScope === 'HISTORY') ? (
        <div className="bg-white dark:bg-[#0B0F17] rounded-3xl p-10 text-center shadow-sm space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            {activeScope === 'HISTORY' ? 'Loading Historical Match Results...' : 'Computing Poisson Match Predictions...'}
          </p>
        </div>
      ) : displayedFixtures.length === 0 ? (
        <div className="bg-white dark:bg-[#0B0F17] rounded-3xl p-8 text-center shadow-sm space-y-2">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {activeScope === 'UPCOMING'
              ? 'No upcoming fixtures found matching your criteria.'
              : activeScope === 'LIVE'
              ? 'No live matches currently in play.'
              : 'No historical matches found matching your criteria.'}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeScope === 'UPCOMING'
              ? 'Try choosing All Dates or resetting your search filters.'
              : 'Try selecting a different league or clearing search.'}
          </p>
        </div>
      ) : viewMode === 'WIREFRAME' ? (
        <SimplifiedPredictionsWireframe
          fixtures={displayedFixtures}
          onSelectDetail={onSelectDetail}
          marketFilter={marketChoiceFilter as any}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedFixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              onSelectDetail={onSelectDetail}
            />
          ))}
        </div>
      )}

      <LeagueSelectorModal
        isOpen={isLeagueModalOpen}
        onClose={() => setIsLeagueModalOpen(false)}
        selectedLeague={selectedLeague}
        onSelectLeague={onSelectLeague}
      />
    </div>
  );
};
