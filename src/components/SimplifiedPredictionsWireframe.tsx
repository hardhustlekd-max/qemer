import React, { useState, useMemo, useEffect } from 'react';
import { Fixture, MarketOption } from '../core/types.js';
import { getLeaguePriority } from '../core/leaguePriority.js';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
    <div className="w-full max-w-full space-y-3 text-slate-900 dark:text-slate-100 font-sans">
      {groupedByLeague.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white dark:bg-[#0B0F17] rounded-xl border border-slate-200/80 dark:border-slate-800">No matches found.</div>
      ) : (
        groupedByLeague.map((group) => (
          <div key={group.headerKey} className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#0B0F17] shadow-xs">
            {/* Unified League Header with Pixel-Perfect Column Alignment */}
            <div className="bg-slate-50 dark:bg-slate-900/80 grid grid-cols-12 items-center px-3.5 sm:px-4 py-2 border-b border-slate-200/80 dark:border-slate-800 gap-2 font-bold text-xs select-none">
              {/* League & Subdivision Title (matches col-span-7) */}
              <div className="col-span-7 flex items-center min-w-0 pr-2">
                <span className="truncate whitespace-nowrap tracking-tight font-extrabold text-slate-900 dark:text-white">
                  {group.subDivision || group.leagueName}
                </span>
              </div>

              {/* TIP Column Header (matches col-span-2, perfectly centered) */}
              <div className="col-span-2 flex items-center justify-center font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 tracking-wider">
                <span>TIP</span>
              </div>

              {/* 1, X, 2 Column Headers (matches col-span-3 with identical item widths) */}
              <div className="col-span-3 flex items-center justify-end gap-1 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 tracking-wider">
                <span className="w-7 sm:w-8 text-center shrink-0">1</span>
                <span className="w-7 sm:w-8 text-center shrink-0">X</span>
                <span className="w-7 sm:w-8 text-center shrink-0">2</span>
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
                    className="grid grid-cols-12 items-center px-3.5 sm:px-4 py-2 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors cursor-pointer gap-2"
                  >
                    {/* Match Clubs & Schedule Metadata */}
                    <div className="col-span-7 flex flex-col justify-center min-w-0 pr-2">
                      {/* Home Team */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {fixture.homeBadge && (
                            <img
                              src={fixture.homeBadge}
                              alt=""
                              className="w-4 h-4 object-contain shrink-0 rounded-full"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          )}
                          <span
                            className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate whitespace-nowrap"
                            title={fixture.homeTeam}
                          >
                            {fixture.homeTeam}
                          </span>
                        </div>
                        {fixture.score && fixture.score.home !== undefined && (
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white shrink-0">
                            {fixture.score.home}
                          </span>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center justify-between gap-2 min-w-0 mt-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {fixture.awayBadge && (
                            <img
                              src={fixture.awayBadge}
                              alt=""
                              className="w-4 h-4 object-contain shrink-0 rounded-full"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          )}
                          <span
                            className="font-medium text-xs sm:text-sm text-slate-700 dark:text-slate-300 truncate whitespace-nowrap"
                            title={fixture.awayTeam}
                          >
                            {fixture.awayTeam}
                          </span>
                        </div>
                        {fixture.score && fixture.score.away !== undefined && (
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white shrink-0">
                            {fixture.score.away}
                          </span>
                        )}
                      </div>

                      {/* Date & Time Under Clubs */}
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">{kickOff}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span>{fixture.matchDate}</span>
                        {fixture.status === 'LIVE' && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-rose-500 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              {fixture.minute ? `${fixture.minute}'` : 'LIVE'}
                            </span>
                          </>
                        )}
                        {fixture.status === 'FINISHED' && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-slate-500 dark:text-slate-400 font-bold">FT</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* TIP Column */}
                    <div className="col-span-2 flex items-center justify-center font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                        {tipLabel}
                      </span>
                    </div>

                    {/* 1, X, 2 Percentage Probability Boxes */}
                    <div className="col-span-3 flex items-center justify-end gap-1 font-mono text-xs font-bold shrink-0 whitespace-nowrap">
                      {/* Home 1 */}
                      <span className={`w-7 h-6 sm:w-8 sm:h-7 flex items-center justify-center rounded-md text-[11px] whitespace-nowrap shrink-0 ${
                        homeProb >= 50 ? 'bg-emerald-600 text-white' : homeProb >= 35 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {homeProb}
                      </span>
                      {/* Draw X */}
                      <span className={`w-7 h-6 sm:w-8 sm:h-7 flex items-center justify-center rounded-md text-[11px] whitespace-nowrap shrink-0 ${
                        drawProb >= 35 ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {drawProb}
                      </span>
                      {/* Away 2 */}
                      <span className={`w-7 h-6 sm:w-8 sm:h-7 flex items-center justify-center rounded-md text-[11px] whitespace-nowrap shrink-0 ${
                        awayProb >= 50 ? 'bg-emerald-600 text-white' : awayProb >= 35 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {awayProb}
                      </span>
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
        <div className="px-4 py-2.5 bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs rounded-xl shadow-xs">
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
                className="bg-slate-50 dark:bg-slate-900 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer pr-7 focus:outline-none"
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
