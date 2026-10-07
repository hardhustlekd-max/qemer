import React, { useState, useMemo, useEffect } from 'react';
import { Fixture, MarketOption } from '../core/types.js';
import {
  Sparkles,
  Shield,
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

function formatWireframeChoice(market: MarketOption): string {
  const key = market.key;
  if (key === 'OVER_25') return '2.5 Over';
  if (key === 'UNDER_25') return '2.5 Under';
  if (key === 'HOME_WIN') return 'Home Win';
  if (key === 'AWAY_WIN') return 'Away Win';
  if (key === 'DRAW') return 'Draw';
  if (key === 'BTTS_YES') return 'BTTS Yes';
  if (key === 'BTTS_NO') return 'BTTS No';
  if (key === 'DOUBLE_CHANCE_1X') return '1X Double Chance';
  if (key === 'DOUBLE_CHANCE_X2') return 'X2 Double Chance';

  // Fallback
  if (market.name.toLowerCase().includes('over 2.5')) return '2.5 Over';
  if (market.name.toLowerCase().includes('under 2.5')) return '2.5 Under';
  if (market.name.toLowerCase().includes('over 1.5')) return '1.5 Over';
  if (market.name.toLowerCase().includes('over 3.5')) return '3.5 Over';
  return market.name;
}

function formatWireframeDate(dateStr: string): string {
  if (!dateStr) return '06-10-26';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0].slice(-2);
    const month = parts[1];
    const day = parts[2];
    return `${day}-${month}-${year}`;
  }
  return dateStr;
}

export const SimplifiedPredictionsWireframe: React.FC<SimplifiedPredictionsWireframeProps> = ({
  fixtures,
  onSelectDetail,
  marketFilter = 'BEST_VALUE',
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset to page 1 whenever fixtures count or market filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [fixtures.length, marketFilter]);

  const totalPages = Math.max(1, Math.ceil(fixtures.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedFixtures = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return fixtures.slice(startIndex, startIndex + pageSize);
  }, [fixtures, safeCurrentPage, pageSize]);

  const startItemIndex = fixtures.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItemIndex = Math.min(safeCurrentPage * pageSize, fixtures.length);

  const getSelectedMarket = (fixture: Fixture): MarketOption => {
    const markets = fixture.markets || [];

    if (marketFilter === 'OVER_UNDER') {
      const overMarket = markets.find((m) => m.key === 'OVER_25') || markets.find((m) => m.key === 'UNDER_25');
      if (overMarket) return overMarket;
    } else if (marketFilter === '1X2') {
      const home = markets.find((m) => m.key === 'HOME_WIN');
      const away = markets.find((m) => m.key === 'AWAY_WIN');
      if (home && away) {
        return home.probability >= away.probability ? home : away;
      }
    } else if (marketFilter === 'BTTS') {
      const btts = markets.find((m) => m.key === 'BTTS_YES');
      if (btts) return btts;
    }

    if (fixture.bestValueMarket) return fixture.bestValueMarket;
    return (
      markets[0] || {
        key: 'OVER_25',
        name: 'Over 2.5 Goals',
        odds: fixture.odds.over25 || 1.85,
        probability: 0.58,
        impliedProb: 0.54,
        expectedValue: 0.08,
        isPositiveEV: true,
        isBanker: false,
      }
    );
  };

  return (
    <div className="w-full max-w-full bg-white dark:bg-[#0B0F17] rounded-3xl shadow-sm overflow-hidden text-slate-900 dark:text-slate-100 font-sans transition-all">
      {/* Prediction Table Header */}
      <div className="grid grid-cols-12 items-center px-2.5 sm:px-4 py-3 bg-slate-50/90 dark:bg-slate-900/80 text-slate-900 dark:text-white select-none gap-0.5 sm:gap-1">
        <div className="col-span-2 sm:col-span-2 text-left font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-0.5">
          Time
        </div>
        <div className="col-span-5 sm:col-span-5 text-center font-extrabold text-xs sm:text-sm tracking-tight">
          Match
        </div>
        <div className="col-span-3 sm:col-span-3 text-center font-extrabold text-xs sm:text-sm tracking-tight">
          Prediction
        </div>
        <div className="col-span-2 sm:col-span-2 text-right font-extrabold text-xs sm:text-sm tracking-tight pr-0.5">
          Odds
        </div>
      </div>

      {/* Match Predictions Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/40 bg-white dark:bg-[#0B0F17]">
        {paginatedFixtures.map((fixture) => {
          const market = getSelectedMarket(fixture);
          const choiceText = formatWireframeChoice(market);
          const dateText = formatWireframeDate(fixture.matchDate);
          const kickOff = fixture.kickOffTime || '21:00';

          const homeWinPct = fixture.prediction?.homeWinProb !== undefined
            ? Math.round(fixture.prediction.homeWinProb * 100)
            : fixture.odds?.homeWin
            ? Math.round((1 / fixture.odds.homeWin) * 100)
            : undefined;

          const awayWinPct = fixture.prediction?.awayWinProb !== undefined
            ? Math.round(fixture.prediction.awayWinProb * 100)
            : fixture.odds?.awayWin
            ? Math.round((1 / fixture.odds.awayWin) * 100)
            : undefined;

          return (
            <div
              key={fixture.id}
              onClick={() => onSelectDetail(fixture)}
              className="grid grid-cols-12 items-center px-2.5 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-all group relative gap-0.5 sm:gap-1 min-w-0 cursor-pointer"
            >
              {/* Column 1: Time badge & Date */}
              <div className="col-span-2 sm:col-span-2 flex flex-col items-start select-none min-w-0 pl-0.5">
                <div className="px-2 py-0.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white font-mono font-bold text-[11px] sm:text-xs tracking-tight shadow-xs whitespace-nowrap">
                  {kickOff}
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-tight font-medium mt-0.5 truncate max-w-full">
                  {dateText}
                </span>
              </div>

              {/* Column 2: Match (Home & Away with Win Probabilities) */}
              <div className="col-span-5 sm:col-span-5 flex flex-col items-center justify-center text-center px-0.5 min-w-0 overflow-hidden">
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate w-full flex items-center justify-center gap-1.5" title={`${fixture.homeTeam}${homeWinPct !== undefined ? ` (${homeWinPct}% win prob)` : ''}`}>
                  <span className="truncate">{fixture.homeTeam}</span>
                  {homeWinPct !== undefined && (
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 shadow-2xs shrink-0" title={`${fixture.homeTeam} Win Probability: ${homeWinPct}%`}>
                      {homeWinPct}%
                    </span>
                  )}
                </div>
                <div className="font-semibold text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 tracking-tight leading-tight mt-0.5 truncate w-full flex items-center justify-center gap-1.5" title={`${fixture.awayTeam}${awayWinPct !== undefined ? ` (${awayWinPct}% win prob)` : ''}`}>
                  <span className="truncate">{fixture.awayTeam}</span>
                  {awayWinPct !== undefined && (
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold px-1.5 py-0.2 rounded-md bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 shadow-2xs shrink-0" title={`${fixture.awayTeam} Win Probability: ${awayWinPct}%`}>
                      {awayWinPct}%
                    </span>
                  )}
                </div>
              </div>

              {/* Column 3: Model Prediction & Confidence */}
              <div className="col-span-3 sm:col-span-3 flex flex-col items-center justify-center min-w-0 px-0.5 text-center">
                <div className="inline-flex items-center gap-1 font-bold text-xs text-slate-900 dark:text-white px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-900 shadow-2xs max-w-full truncate">
                  <span className="truncate">{choiceText}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 font-mono">
                  <span>{(market.probability * 100).toFixed(0)}% Prob</span>
                  {market.isBanker && (
                    <Shield className="w-3 h-3 text-emerald-500 shrink-0" title="Safe Banker" />
                  )}
                </div>
              </div>

              {/* Column 4: Odds & Value */}
              <div className="col-span-2 sm:col-span-2 flex flex-col items-end justify-center min-w-0 pr-0.5 text-right">
                <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-emerald-400 whitespace-nowrap">
                  @{market.odds.toFixed(2)}
                </span>
                {market.isPositiveEV && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    <Sparkles className="w-2.5 h-2.5" />
                    +{(market.expectedValue * 100).toFixed(0)}% EV
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Pagination Bar */}
      {fixtures.length > 0 && (
        <div className="px-3 sm:px-4 py-3 bg-slate-50/80 dark:bg-slate-900/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Left: Summary Counter & Page Size Selector */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-slate-600 dark:text-slate-400 font-semibold text-xs whitespace-nowrap">
              Showing <span className="font-bold text-slate-900 dark:text-white">{startItemIndex}–{endItemIndex}</span> of <span className="font-bold text-slate-900 dark:text-white">{fixtures.length}</span> matches
            </span>

            {/* Page Size Dropdown Selector */}
            <div className="relative inline-flex items-center">
              <select
                id="table-page-size-dropdown"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer pr-7 focus:outline-none shadow-xs"
              >
                <option value={5} className="bg-white dark:bg-slate-900">5 per page</option>
                <option value={10} className="bg-white dark:bg-slate-900">10 per page</option>
                <option value={20} className="bg-white dark:bg-slate-900">20 per page</option>
                <option value={50} className="bg-white dark:bg-slate-900">50 per page</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* Right: Pagination Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
            {/* First Page */}
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            {/* Prev Page */}
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold cursor-pointer shadow-xs"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Numeric Page Buttons */}
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
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
            </div>

            {/* Next Page */}
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold cursor-pointer shadow-xs"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page */}
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
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
