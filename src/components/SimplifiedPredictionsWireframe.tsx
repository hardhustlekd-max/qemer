import React, { useState, useMemo, useEffect } from 'react';
import { Fixture, AccaLeg, MarketOption } from '../core/types.js';
import {
  Check,
  Plus,
  Sparkles,
  Shield,
  Info,
  Copy,
  Share2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface SimplifiedPredictionsWireframeProps {
  fixtures: Fixture[];
  onSelectDetail: (fixture: Fixture) => void;
  onAddLegToSlip: (leg: AccaLeg) => void;
  isLegInSlip: (fixtureId: string, marketKey: MarketOption['key']) => boolean;
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
  if (key === 'DOUBLE_CHANCE_1X') return '1X (Home/X)';
  if (key === 'DOUBLE_CHANCE_X2') return 'X2 (X/Away)';

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
  onAddLegToSlip,
  isLegInSlip,
  marketFilter = 'BEST_VALUE',
}) => {
  const [selectedMarketOverrides, setSelectedMarketOverrides] = useState<Record<string, MarketOption['key']>>({});
  const [activeDropdownFixtureId, setActiveDropdownFixtureId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [simulatedStake, setSimulatedStake] = useState<number>(10);
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

    // User manual row override
    if (selectedMarketOverrides[fixture.id]) {
      const overrideKey = selectedMarketOverrides[fixture.id];
      const match = markets.find((m) => m.key === overrideKey);
      if (match) return match;
    }

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

  const totalMultipliedOdds = paginatedFixtures.reduce((acc, f) => {
    const m = getSelectedMarket(f);
    return acc * (m.odds || 1.0);
  }, 1.0);

  const handleCopySummary = () => {
    const lines = paginatedFixtures.map((f, i) => {
      const m = getSelectedMarket(f);
      return `${startItemIndex + i}. ${f.homeTeam} vs ${f.awayTeam} | ${formatWireframeChoice(m)} @ ${m.odds.toFixed(2)}`;
    });
    const text = `🔥 FOOTBALL ACCUMULATOR SLIP (Page ${safeCurrentPage} of ${totalPages})\n${lines.join('\n')}\n\n🏆 Total Multiplied Odds: ${totalMultipliedOdds.toFixed(2)}\n💰 Stake: £${simulatedStake} ➔ Potential Payout: £${(simulatedStake * totalMultipliedOdds).toFixed(2)}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-full bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden text-slate-900 dark:text-slate-100 font-sans transition-all">
      {/* Wireframe Table Header - Decreased column spacing */}
      <div className="grid grid-cols-12 items-center px-1.5 sm:px-3 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white select-none gap-0.5 sm:gap-1">
        <div className="col-span-3 sm:col-span-2 text-left font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-0.5">
          Time
        </div>
        <div className="col-span-4 sm:col-span-5 text-center font-extrabold text-xs sm:text-sm tracking-tight">
          Matches
        </div>
        <div className="col-span-3 sm:col-span-3 text-center font-extrabold text-xs sm:text-sm tracking-tight">
          Choices
        </div>
        <div className="col-span-2 sm:col-span-2 text-right font-extrabold text-xs sm:text-sm tracking-tight pr-0.5">
          Values
        </div>
      </div>

      {/* Fixtures List Rows - Decreased space between columns */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800/80 bg-white dark:bg-[#0B0F17]">
        {paginatedFixtures.map((fixture) => {
          const market = getSelectedMarket(fixture);
          const choiceText = formatWireframeChoice(market);
          const inSlip = isLegInSlip(fixture.id, market.key);
          const dateText = formatWireframeDate(fixture.matchDate);
          const kickOff = fixture.kickOffTime || '21:00';
          const isDropdownOpen = activeDropdownFixtureId === fixture.id;

          return (
            <div
              key={fixture.id}
              className="grid grid-cols-12 items-center px-1.5 sm:px-3 py-1.5 sm:py-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors group relative gap-0.5 sm:gap-1 min-w-0"
            >
              {/* Column 1: Time badge & Date */}
              <div
                onClick={() => onSelectDetail(fixture)}
                className="col-span-3 sm:col-span-2 flex flex-col items-start cursor-pointer select-none min-w-0 pl-0.5"
              >
                <div className="px-1.5 py-0.5 rounded bg-slate-900 dark:bg-slate-800 text-white font-mono font-bold text-[11px] sm:text-xs tracking-tight shadow-xs whitespace-nowrap">
                  {kickOff}
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-tight font-medium mt-0.5 truncate max-w-full">
                  {dateText}
                </span>
              </div>

              {/* Column 2: Matches (Home top, Away bottom) */}
              <div
                onClick={() => onSelectDetail(fixture)}
                className="col-span-4 sm:col-span-5 flex flex-col items-center justify-center text-center px-0.5 cursor-pointer min-w-0 overflow-hidden"
              >
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate w-full" title={fixture.homeTeam}>
                  {fixture.homeTeam}
                </div>
                <div className="font-semibold text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 tracking-tight leading-tight mt-0.5 truncate w-full" title={fixture.awayTeam}>
                  {fixture.awayTeam}
                </div>
              </div>

              {/* Column 3: Choices */}
              <div className="col-span-3 sm:col-span-3 flex items-center justify-center relative min-w-0 px-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdownFixtureId(isDropdownOpen ? null : fixture.id);
                  }}
                  className="w-full max-w-full inline-flex items-center justify-center gap-1 font-bold text-xs text-slate-900 dark:text-white px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer shadow-xs min-w-0 overflow-hidden"
                >
                  <span className="truncate">{choiceText}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </button>

                {/* Market Picker Popover Dropdown */}
                {isDropdownOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-10 z-50 w-44 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 space-y-1 text-xs animate-in fade-in zoom-in-95 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0"
                  >
                    <div className="text-[10px] font-bold text-slate-400 px-2 py-0.5 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      Select Market
                    </div>
                    {(fixture.markets || []).map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          setSelectedMarketOverrides((prev) => ({ ...prev, [fixture.id]: m.key }));
                          setActiveDropdownFixtureId(null);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl font-semibold flex items-center justify-between text-xs transition-colors ${
                          market.key === m.key
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{formatWireframeChoice(m)}</span>
                        <span className="font-mono font-bold ml-1">{m.odds.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 4: Values & Quick Add button */}
              <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-1 min-w-0 pr-0.5">
                <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white whitespace-nowrap">
                  {market.odds.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddLegToSlip({
                      fixtureId: fixture.id,
                      fixtureDate: fixture.matchDate,
                      league: fixture.leagueName,
                      homeTeam: fixture.homeTeam,
                      awayTeam: fixture.awayTeam,
                      marketKey: market.key,
                      marketName: market.name,
                      selection: choiceText,
                      odds: market.odds,
                      probability: market.probability,
                      expectedValue: market.expectedValue,
                      reasoning: `Poisson Model: ${(market.probability * 100).toFixed(1)}% prob @ ${market.odds.toFixed(2)}`,
                      isBanker: market.isBanker,
                      isPositiveEV: market.isPositiveEV,
                    });
                  }}
                  className={`p-1 sm:p-1.5 rounded transition-all cursor-pointer shrink-0 ${
                    inSlip
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500 hover:text-white'
                  }`}
                  title={inSlip ? 'In Slip' : 'Add to Slip'}
                >
                  {inSlip ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Pagination Bar */}
      {fixtures.length > 0 && (
        <div className="px-2 sm:px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Left: Summary Counter & Page Size Selector */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-slate-600 dark:text-slate-400 font-semibold text-xs whitespace-nowrap">
              Showing <span className="font-bold text-slate-900 dark:text-white">{startItemIndex}–{endItemIndex}</span> of <span className="font-bold text-slate-900 dark:text-white">{fixtures.length}</span> matches
            </span>

            {/* Page Size Dropdown Selector with matching rounded-xl px-2.5 py-1.5 */}
            <div className="relative inline-flex items-center">
              <select
                id="table-page-size-dropdown"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer pr-7 focus:outline-none"
              >
                <option value={5} className="bg-white dark:bg-slate-900">5 / page</option>
                <option value={10} className="bg-white dark:bg-slate-900">10 / page</option>
                <option value={20} className="bg-white dark:bg-slate-900">20 / page</option>
                <option value={50} className="bg-white dark:bg-slate-900">50 / page</option>
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
              className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            {/* Prev Page */}
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold cursor-pointer"
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
                      className={`min-w-7 h-7 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        item === safeCurrentPage
                          ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700'
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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold cursor-pointer"
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
              className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Wireframe Bottom Footer */}
      <div className="grid grid-cols-12 items-center px-1.5 sm:px-3 py-2 bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-800 font-bold select-none text-xs sm:text-base gap-0.5 sm:gap-1">
        <div className="col-span-3 sm:col-span-2 text-left">
          <span className="text-red-600 dark:text-red-500 font-black text-sm sm:text-xl tracking-tight uppercase">
            Win
          </span>
        </div>
        <div className="col-span-5 sm:col-span-5 text-center font-extrabold text-xs sm:text-lg text-slate-900 dark:text-white tracking-tight truncate">
          Total Odds
        </div>
        <div className="col-span-4 sm:col-span-5 text-right">
          <span className="font-mono font-black text-sm sm:text-2xl text-slate-900 dark:text-emerald-400 tracking-tight whitespace-nowrap">
            {totalMultipliedOdds > 9999 ? '9999.00+' : totalMultipliedOdds.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Interactive Quick Bar: Stake Simulation & One-Click Copy */}
      <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 flex-wrap min-w-0">
          <span className="font-semibold text-slate-600 dark:text-slate-400 text-xs">Stake:</span>
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-500 text-xs">£</span>
            <input
              type="number"
              min={1}
              value={simulatedStake}
              onChange={(e) => setSimulatedStake(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-14 sm:w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 font-mono font-bold text-slate-900 dark:text-white text-xs text-right"
            />
          </div>
          <span className="text-slate-400">➔</span>
          <span className="font-bold text-slate-700 dark:text-slate-300 text-xs truncate">
            Win: <strong className="font-mono text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">£{(simulatedStake * totalMultipliedOdds).toFixed(2)}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopySummary}
          className={`w-full sm:w-auto px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Slip Copied!' : 'Copy Wireframe Slip'}</span>
        </button>
      </div>
    </div>
  );
};

