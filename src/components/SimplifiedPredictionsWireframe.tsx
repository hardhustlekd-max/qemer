import React, { useState, useMemo, useEffect } from 'react';
import { Fixture, MarketOption } from '../core/types.js';
import { getLeaguePriority } from '../core/leaguePriority.js';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BarChart2,
} from 'lucide-react';

interface SimplifiedPredictionsWireframeProps {
  fixtures: Fixture[];
  onSelectDetail: (fixture: Fixture) => void;
  marketFilter?: 'BEST_VALUE' | 'OVER_UNDER' | '1X2' | 'BTTS';
}

function getTipLabel(fixture: Fixture): string {
  const p = fixture.prediction;
  if (!p) return '1X2';
  if (p.homeWinProb >= p.awayWinProb && p.homeWinProb >= p.drawProb) return '1';
  if (p.awayWinProb >= p.homeWinProb && p.awayWinProb >= p.drawProb) return '2';
  return 'X';
}

export const SimplifiedPredictionsWireframe: React.FC<SimplifiedPredictionsWireframeProps> = ({
  fixtures,
  onSelectDetail,
  marketFilter = 'BEST_VALUE',
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  useEffect(() => {
    setCurrentPage(1);
  }, [fixtures.length, marketFilter]);

  const uniqueFixtures = useMemo(() => {
    const seen = new Set<string>();
    const list = fixtures.filter((f) => {
      if (!f.id || seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });

    return list.slice().sort((a, b) => {
      const pa = getLeaguePriority(a.league, a.leagueName, a.stage);
      const pb = getLeaguePriority(b.league, b.leagueName, b.stage);
      if (pa !== pb) return pa - pb;
      if (a.matchDate !== b.matchDate) return a.matchDate.localeCompare(b.matchDate);
      return (a.kickOffTime || '').localeCompare(b.kickOffTime || '');
    });
  }, [fixtures]);

  const totalPages = Math.max(1, Math.ceil(uniqueFixtures.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedFixtures = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return uniqueFixtures.slice(startIndex, startIndex + pageSize);
  }, [uniqueFixtures, safeCurrentPage, pageSize]);

  const startItemIndex = uniqueFixtures.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItemIndex = Math.min(safeCurrentPage * pageSize, uniqueFixtures.length);

  // Group paginated fixtures by league & subdivision/stage
  const groupedByLeague = useMemo(() => {
    interface LeagueGroup {
      leagueName: string;
      subDivision?: string;
      headerKey: string;
      fixtures: Fixture[];
    }

    const groupMap = new Map<string, LeagueGroup>();

    for (const f of paginatedFixtures) {
      const baseLeague = f.leagueName || 'Premier League';
      // If fixture has a distinct subdivision or tournament stage, categorize separately
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

    return groups;
  }, [paginatedFixtures]);

  return (
    <div className="w-full max-w-full bg-white dark:bg-[#0B0F17] rounded-3xl shadow-xs overflow-hidden text-slate-900 dark:text-slate-100 font-sans transition-all space-y-3 p-2 sm:p-3">
      {groupedByLeague.length === 0 ? (
        <div className="p-8 text-center text-slate-500">No matches found.</div>
      ) : (
        groupedByLeague.map((group) => (
          <div key={group.headerKey} className="rounded-2xl overflow-hidden shadow-xs bg-slate-50 dark:bg-slate-900/60">
            {/* Unified App-Matching League & Subdivision Header */}
            <div className="bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 flex items-center justify-between font-bold text-xs border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 truncate text-slate-900 dark:text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate tracking-tight font-extrabold">
                  {group.subDivision || group.leagueName}
                </span>
              </div>
              <div className="flex items-center gap-3 sm:gap-5 font-mono text-[11px] tracking-wider text-slate-500 dark:text-slate-400 pr-2">
                <span>TIP</span>
                <span>1</span>
                <span>X</span>
                <span>2</span>
              </div>
            </div>

            {/* League Matches Table Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40 bg-white dark:bg-[#0B0F17]">
              {group.fixtures.map((fixture) => {
                const tipLabel = getTipLabel(fixture);
                const kickOff = fixture.kickOffTime || '19:00';

                const homeProb = fixture.prediction?.homeWinProb !== undefined
                  ? Math.round(fixture.prediction.homeWinProb * 100)
                  : 45;

                const drawProb = fixture.prediction?.drawProb !== undefined
                  ? Math.round(fixture.prediction.drawProb * 100)
                  : 28;

                const awayProb = fixture.prediction?.awayWinProb !== undefined
                  ? Math.round(fixture.prediction.awayWinProb * 100)
                  : 27;

                return (
                  <div
                    key={fixture.id}
                    onClick={() => onSelectDetail(fixture)}
                    className="grid grid-cols-12 items-center px-3 sm:px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-all cursor-pointer gap-2"
                  >
                    {/* Time, Date & Score */}
                    <div className="col-span-2 flex flex-col justify-center font-mono text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-bold">{kickOff}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{fixture.matchDate}</span>
                      {fixture.score && fixture.score.home !== undefined && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          {fixture.score.home}:{fixture.score.away}
                        </span>
                      )}
                    </div>

                    {/* Stacked Teams */}
                    <div className="col-span-5 flex flex-col justify-center min-w-0 overflow-hidden">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {fixture.homeTeam}
                      </div>
                      <div className="font-medium text-xs text-slate-600 dark:text-slate-300 truncate">
                        {fixture.awayTeam}
                      </div>
                    </div>

                    {/* TIP Column */}
                    <div className="col-span-2 flex items-center justify-center font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-2xs">
                        {tipLabel}
                      </span>
                    </div>

                    {/* 1, X, 2 Percentage Probability Boxes & Chart Icon */}
                    <div className="col-span-3 flex items-center justify-end gap-1 font-mono text-xs font-bold">
                      {/* Home 1 */}
                      <span className={`w-7 h-6 sm:w-8 sm:h-7 flex items-center justify-center rounded-lg text-[11px] shadow-2xs ${
                        homeProb >= 50 ? 'bg-emerald-600 text-white' : homeProb >= 35 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {homeProb}
                      </span>
                      {/* Draw X */}
                      <span className={`w-7 h-6 sm:w-8 sm:h-7 flex items-center justify-center rounded-lg text-[11px] shadow-2xs ${
                        drawProb >= 35 ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {drawProb}
                      </span>
                      {/* Away 2 */}
                      <span className={`w-7 h-6 sm:w-8 sm:h-7 flex items-center justify-center rounded-lg text-[11px] shadow-2xs ${
                        awayProb >= 50 ? 'bg-emerald-600 text-white' : awayProb >= 35 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {awayProb}
                      </span>
                      <BarChart2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-1 shrink-0 hidden sm:block" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Table Pagination Bar */}
      {fixtures.length > 0 && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 text-xs rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-xs whitespace-nowrap">
              Showing <span className="font-bold text-slate-900 dark:text-white">{startItemIndex}–{endItemIndex}</span> of <span className="font-bold text-slate-900 dark:text-white">{fixtures.length}</span> matches
            </span>

            <div className="relative inline-flex items-center">
              <select
                id="table-page-size-dropdown"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-950 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer pr-7 focus:outline-none shadow-xs"
              >
                <option value={5} className="bg-white dark:bg-slate-900">5 per page</option>
                <option value={10} className="bg-white dark:bg-slate-900">10 per page</option>
                <option value={20} className="bg-white dark:bg-slate-900">20 per page</option>
                <option value={50} className="bg-white dark:bg-slate-900">50 per page</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold cursor-pointer shadow-xs"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 5) return true;
                  if (p === 1 || p === totalPages) return true;
                  return Math.abs(p - safeCurrentPage) <= 1;
                })
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  typeof item === 'string' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold text-xs select-none">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${item}`}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`min-w-7 h-7 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        item === safeCurrentPage
                          ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
            </div>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold cursor-pointer shadow-xs"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
