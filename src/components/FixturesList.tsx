import React, { useMemo, useState, useEffect } from 'react';
import { Fixture } from '../core/types.js';
import { LiveScore } from '../providers/types.js';
import { getRelativeDateStr } from '../core/seedData.js';
import { FixtureCard } from './FixtureCard.js';
import { SimplifiedPredictionsWireframe } from './SimplifiedPredictionsWireframe.js';
import { LeagueSelectorModal } from './LeagueSelectorModal.js';
import { EngineService } from '../services/engineService.js';
import { getLeaguePriority } from '../core/leaguePriority.js';

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
  sortBy?: 'DEFAULT' | 'PROB_DESC' | 'PROB_ASC' | 'HOME_DESC' | 'DRAW_DESC' | 'AWAY_DESC';
  onSelectSortBy?: (s: 'DEFAULT' | 'PROB_DESC' | 'PROB_ASC' | 'HOME_DESC' | 'DRAW_DESC' | 'AWAY_DESC') => void;
}

function getTipProb(fixture: Fixture): number {
  const p = fixture.prediction;
  if (!p) return 45;
  const h = p.homeWinProb ?? 0;
  const d = p.drawProb ?? 0;
  const a = p.awayWinProb ?? 0;
  return Math.round(Math.max(h, d, a) * 100);
}

function getHomeProb(fixture: Fixture): number {
  return fixture.prediction?.homeWinProb !== undefined
    ? Math.round(fixture.prediction.homeWinProb * 100)
    : 45;
}

function getDrawProb(fixture: Fixture): number {
  return fixture.prediction?.drawProb !== undefined
    ? Math.round(fixture.prediction.drawProb * 100)
    : 28;
}

function getAwayProb(fixture: Fixture): number {
  return fixture.prediction?.awayWinProb !== undefined
    ? Math.round(fixture.prediction.awayWinProb * 100)
    : 27;
}

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
  sortBy = 'DEFAULT',
  onSelectSortBy,
}) => {
  const [activeScope, setActiveScope] = useState<'UPCOMING' | 'LIVE' | 'HISTORY'>('UPCOMING');
  const [historyFixtures, setHistoryFixtures] = useState<Fixture[]>([]);
  const [livePredictionsFixtures, setLivePredictionsFixtures] = useState<Fixture[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);

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

  // Load predictions for live games directly from predictions db
  useEffect(() => {
    let isCancelled = false;
    async function fetchLivePredictions() {
      try {
        setIsLoadingLive(true);
        const data = await EngineService.getLivePredictions(selectedLeague, 100);
        if (!isCancelled && data && data.length > 0) {
          setLivePredictionsFixtures(data);
        }
      } catch (err) {
        console.error('Failed to load live predictions from db:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingLive(false);
        }
      }
    }

    if (activeScope === 'LIVE') {
      fetchLivePredictions();
    }

    return () => {
      isCancelled = true;
    };
  }, [activeScope, selectedLeague, liveScores]);

  // Load history predictions from predictions db when history tab is active or selected league changes
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
        console.error('Failed to load history predictions from db:', err);
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

    return matches.slice().sort((a, b) => {
      const priorityA = getLeaguePriority(a.league, a.leagueName, a.stage);
      const priorityB = getLeaguePriority(b.league, b.leagueName, b.stage);
      if (priorityA !== priorityB) return priorityA - priorityB;
      if (a.matchDate !== b.matchDate) return a.matchDate.localeCompare(b.matchDate);
      return (a.kickOffTime || '').localeCompare(b.kickOffTime || '');
    });
  }, [fixtures, uniqueFixtures, dateFilter, selectedLeague, searchQuery, baseToday]);

  const liveFixtures: Fixture[] = useMemo(() => {
    // 1. Predictions loaded directly from separate predictions db
    const fromPredictionsDb = livePredictionsFixtures || [];

    // 2. Fixtures present in upcoming that are marked LIVE
    const liveFromFixtures = uniqueFixtures.filter((f) => f.status === 'LIVE');

    // 3. Fixtures derived from active live scores
    const liveFromScores: Fixture[] = (liveScores || []).map((s) => {
      const matchInPredictionsDb = fromPredictionsDb.find(
        (f) => f.id === s.fixtureId || f.id === `fs_${s.fixtureId}` || f.id.replace('fs_', '') === s.fixtureId
      );
      if (matchInPredictionsDb) {
        return {
          ...matchInPredictionsDb,
          minute: s.minute,
          score: { home: s.homeScore, away: s.awayScore },
          kickOffTime: s.status === 'FINISHED' ? 'FT' : `${s.minute}'`,
        };
      }

      const matchInUpcoming = uniqueFixtures.find(
        (f) => f.id === s.fixtureId || f.id === `fs_${s.fixtureId}` || f.id.replace('fs_', '') === s.fixtureId
      );
      if (matchInUpcoming) {
        return {
          ...matchInUpcoming,
          status: 'LIVE' as const,
          minute: s.minute,
          score: { home: s.homeScore, away: s.awayScore },
          kickOffTime: s.status === 'FINISHED' ? 'FT' : `${s.minute}'`,
        };
      }
      return {
        id: s.fixtureId,
        providerId: 'FLASHSCORE',
        league: 'ALL',
        leagueName: 'Live In-Play',
        matchDate: baseToday,
        kickOffTime: s.status === 'FINISHED' ? 'FT' : `${s.minute}'`,
        homeTeam: s.homeTeam,
        awayTeam: s.awayTeam,
        status: 'LIVE' as const,
        minute: s.minute,
        score: { home: s.homeScore, away: s.awayScore },
      };
    });

    const seen = new Set<string>();
    const combined: Fixture[] = [];
    // Prioritize fromPredictionsDb, then liveFromScores, then liveFromFixtures
    for (const f of [...fromPredictionsDb, ...liveFromScores, ...liveFromFixtures]) {
      if (!seen.has(f.id)) {
        seen.add(f.id);
        combined.push(f);
      }
    }

    combined.sort((a, b) => {
      const priorityA = getLeaguePriority(a.league, a.leagueName, a.stage);
      const priorityB = getLeaguePriority(b.league, b.leagueName, b.stage);
      if (priorityA !== priorityB) return priorityA - priorityB;
      return (a.kickOffTime || '').localeCompare(b.kickOffTime || '');
    });

    return combined;
  }, [livePredictionsFixtures, uniqueFixtures, liveScores, baseToday]);

  const displayedFixtures = useMemo(() => {
    const applySort = (list: Fixture[]) => {
      if (!sortBy || sortBy === 'DEFAULT') return list;
      return list.slice().sort((a, b) => {
        if (sortBy === 'PROB_DESC') return getTipProb(b) - getTipProb(a);
        if (sortBy === 'PROB_ASC') return getTipProb(a) - getTipProb(b);
        if (sortBy === 'HOME_DESC') return getHomeProb(b) - getHomeProb(a);
        if (sortBy === 'DRAW_DESC') return getDrawProb(b) - getDrawProb(a);
        if (sortBy === 'AWAY_DESC') return getAwayProb(b) - getAwayProb(a);
        return 0;
      });
    };

    if (activeScope === 'LIVE') {
      const filtered = liveFixtures.filter((f) => {
        if (selectedLeague !== 'ALL') {
          const lq = selectedLeague.toUpperCase();
          const matchLeague =
            (f.league && f.league.toUpperCase() === lq) ||
            (f.leagueName && f.leagueName.toUpperCase() === lq);
          if (!matchLeague) return false;
        }
        if (searchQuery.trim().length > 0) {
          const query = searchQuery.toLowerCase();
          const matchName = `${f.homeTeam} ${f.awayTeam} ${f.leagueName}`.toLowerCase();
          if (!matchName.includes(query)) return false;
        }
        return true;
      });
      return applySort(filtered);
    }

    if (activeScope === 'HISTORY') {
      const filtered = historyFixtures
        .filter((f) => {
          if (selectedLeague !== 'ALL') {
            const lq = selectedLeague.toUpperCase();
            const matchLeague =
              (f.league && f.league.toUpperCase() === lq) ||
              (f.leagueName && f.leagueName.toUpperCase() === lq);
            if (!matchLeague) return false;
          }
          if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase();
            const matchName = `${f.homeTeam} ${f.awayTeam} ${f.leagueName}`.toLowerCase();
            if (!matchName.includes(query)) return false;
          }
          return true;
        })
        .sort((a, b) => {
          const priorityA = getLeaguePriority(a.league, a.leagueName, a.stage);
          const priorityB = getLeaguePriority(b.league, b.leagueName, b.stage);
          if (priorityA !== priorityB) return priorityA - priorityB;
          return b.matchDate.localeCompare(a.matchDate);
        });
      return applySort(filtered);
    }

    return applySort(filteredUpcomingFixtures);
  }, [activeScope, filteredUpcomingFixtures, liveFixtures, historyFixtures, selectedLeague, searchQuery, sortBy]);

  return (
    <div className="space-y-2.5 font-sans flex-1 flex flex-col">
      {/* Scope Sub-Tabs: Upcoming, Live, History placed above match list */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl shadow-xs shrink-0 overflow-x-auto no-scrollbar flex-nowrap">
          <button
            id="subtab-upcoming-btn"
            type="button"
            onClick={() => setActiveScope('UPCOMING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeScope === 'LIVE'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">Live</span>
          </button>

          <button
            id="subtab-history-btn"
            type="button"
            onClick={() => setActiveScope('HISTORY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
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
        <div className="bg-white dark:bg-[#0B0F17] rounded-2xl sm:rounded-3xl p-8 sm:p-12 flex-1 min-h-[360px] flex flex-col items-center justify-center text-center shadow-xs space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            {activeScope === 'HISTORY' ? 'Loading Historical Match Results...' : 'Computing Poisson Match Predictions...'}
          </p>
        </div>
      ) : displayedFixtures.length === 0 ? (
        <div className="bg-white dark:bg-[#0B0F17] rounded-2xl sm:rounded-3xl p-8 flex-1 min-h-[360px] flex flex-col items-center justify-center text-center shadow-sm space-y-2">
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
          sortBy={sortBy}
          onSelectSortBy={onSelectSortBy}
        />
      ) : (
        <div className="space-y-4">
          {(() => {
            interface LeagueGroup {
              leagueName: string;
              subDivision?: string;
              headerKey: string;
              fixtures: Fixture[];
            }
            const groupMap = new Map<string, LeagueGroup>();
            for (const f of displayedFixtures) {
              const baseLeague = f.leagueName || 'Premier League';
              const subDivision = f.stage && f.stage.trim() !== '' && f.stage.trim().toLowerCase() !== baseLeague.trim().toLowerCase()
                ? f.stage.trim()
                : undefined;
              const headerKey = subDivision ? `${baseLeague} • ${subDivision}` : baseLeague;
              if (!groupMap.has(headerKey)) {
                groupMap.set(headerKey, {
                  leagueName: baseLeague,
                  subDivision,
                  headerKey,
                  fixtures: [],
                });
              }
              groupMap.get(headerKey)!.fixtures.push(f);
            }

            const groups = Array.from(groupMap.values());
            groups.sort((ga, gb) => {
              const pa = getLeaguePriority(ga.fixtures[0]?.league, ga.fixtures[0]?.leagueName, ga.fixtures[0]?.stage);
              const pb = getLeaguePriority(gb.fixtures[0]?.league, gb.fixtures[0]?.leagueName, gb.fixtures[0]?.stage);
              if (pa !== pb) return pa - pb;
              return ga.headerKey.localeCompare(gb.headerKey);
            });

            return groups.map((group) => (
              <div key={group.headerKey} className="space-y-2.5">
                <div className="flex items-center gap-2 px-1 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs font-extrabold tracking-tight text-slate-900 dark:text-white truncate whitespace-nowrap">
                    {group.subDivision || group.leagueName}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {group.fixtures.map((fixture) => (
                    <FixtureCard
                      key={fixture.id}
                      fixture={fixture}
                      onSelectDetail={onSelectDetail}
                    />
                  ))}
                </div>
              </div>
            ));
          })()}
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
