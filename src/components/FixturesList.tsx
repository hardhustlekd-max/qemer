import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Calendar, Sparkles, LayoutList, LayoutGrid } from 'lucide-react';
import { Fixture } from '../core/types.js';
import { getRelativeDateStr } from '../core/seedData.js';
import { FixtureCard } from './FixtureCard.js';
import { SimplifiedPredictionsWireframe } from './SimplifiedPredictionsWireframe.js';

interface FixturesListProps {
  fixtures: Fixture[];
  isLoading: boolean;
  onSelectDetail: (fixture: Fixture) => void;
  selectedLeague: string;
  onSelectLeague: (league: string) => void;
  onViewPrebuiltAccas?: () => void;
}

export const FixturesList: React.FC<FixturesListProps> = ({
  fixtures,
  isLoading,
  onSelectDetail,
  selectedLeague,
  onSelectLeague,
  onViewPrebuiltAccas,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'TOMORROW' | 'NEXT_3_DAYS' | 'THIS_WEEK' | 'ALL' | 'CUSTOM'>('TODAY');
  const [customStartDate, setCustomStartDate] = useState(getRelativeDateStr(0));
  const [customEndDate, setCustomEndDate] = useState(getRelativeDateStr(3));
  const [filterType, setFilterType] = useState<'ALL' | 'POSITIVE_EV' | 'BANKER' | 'HIGH_XG'>('ALL');
  const [viewMode, setViewMode] = useState<'WIREFRAME' | 'CARDS'>('WIREFRAME');
  const [marketChoiceFilter, setMarketChoiceFilter] = useState<'BEST_VALUE' | 'OVER_UNDER' | '1X2' | 'BTTS'>('BEST_VALUE');

  const dateOptions = [
    { key: 'TODAY' as const, label: "Today's Picks" },
    { key: 'TOMORROW' as const, label: 'Tomorrow' },
    { key: 'NEXT_3_DAYS' as const, label: 'Next 3 Days' },
    { key: 'THIS_WEEK' as const, label: 'This Week' },
    { key: 'ALL' as const, label: 'All Dates' },
    { key: 'CUSTOM' as const, label: 'Custom Range...' },
  ];

  const leagueOptions = [
    { code: 'ALL', name: 'All Leagues Worldwide' },
    { code: 'E0', name: 'Premier League' },
    { code: 'SP1', name: 'La Liga' },
    { code: 'D1', name: 'Bundesliga' },
    { code: 'I1', name: 'Serie A' },
    { code: 'F1', name: 'Ligue 1' },
    { code: 'UCL', name: 'UEFA Champions League' },
    { code: 'UEL', name: 'UEFA Europa League' },
    { code: 'N1', name: 'Eredivisie' },
    { code: 'P1', name: 'Primeira Liga' },
    { code: 'BRA', name: 'Brasileirão' },
    { code: 'MLS', name: 'MLS (USA)' },
    { code: 'SPL', name: 'Saudi Pro League' },
    { code: 'JPL', name: 'J1 League' },
  ];

  const filterOptions = [
    { key: 'ALL' as const, label: 'All Matches' },
    { key: 'POSITIVE_EV' as const, label: 'Best Value' },
    { key: 'BANKER' as const, label: 'Safe Picks' },
    { key: 'HIGH_XG' as const, label: 'High Goals' },
  ];

  const marketOptions = [
    { key: 'BEST_VALUE' as const, label: 'Top Picks' },
    { key: 'OVER_UNDER' as const, label: 'Over Under' },
    { key: '1X2' as const, label: '1X2 Match Winner' },
    { key: 'BTTS' as const, label: 'Both Teams to Score' },
  ];

  const filteredFixtures = useMemo(() => {
    const todayStr = getRelativeDateStr(0);
    const tomorrowStr = getRelativeDateStr(1);
    const next3DaysStr = getRelativeDateStr(2);
    const thisWeekStr = getRelativeDateStr(6);

    const matches = fixtures.filter((f) => {
      // Date filtering - defaulted to TODAY
      if (dateFilter === 'TODAY') {
        if (f.matchDate !== todayStr) return false;
      } else if (dateFilter === 'TOMORROW') {
        if (f.matchDate !== tomorrowStr) return false;
      } else if (dateFilter === 'NEXT_3_DAYS') {
        if (f.matchDate < todayStr || f.matchDate > next3DaysStr) return false;
      } else if (dateFilter === 'THIS_WEEK') {
        if (f.matchDate < todayStr || f.matchDate > thisWeekStr) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate && f.matchDate < customStartDate) return false;
        if (customEndDate && f.matchDate > customEndDate) return false;
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

      // Feature Filter
      if (filterType === 'POSITIVE_EV') {
        const hasEV = f.markets?.some((m) => m.isPositiveEV);
        if (!hasEV) return false;
      } else if (filterType === 'BANKER') {
        const hasBanker = f.markets?.some((m) => m.isBanker) ||
          (f.prediction && Math.max(f.prediction.homeWinProb, f.prediction.awayWinProb) >= 0.45);
        if (!hasBanker) return false;
      } else if (filterType === 'HIGH_XG') {
        if (f.prediction && f.prediction.homeXG + f.prediction.awayXG < 2.5) {
          return false;
        }
      }

      return true;
    });

    // If TODAY was selected but 0 matches matched exact date string due to UTC offset, show available active matches
    let finalFixtures = matches;
    if (finalFixtures.length === 0 && dateFilter === 'TODAY' && fixtures.length > 0) {
      const earliestDate = fixtures.map((f) => f.matchDate).sort()[0];
      if (earliestDate) {
        finalFixtures = fixtures.filter((f) => f.matchDate === earliestDate);
      }
    }

    // Sort by highest probability / value by default so top picks are always prioritized
    return finalFixtures.slice().sort((a, b) => {
      const probA = Math.max(a.prediction?.homeWinProb || 0, a.prediction?.awayWinProb || 0);
      const probB = Math.max(b.prediction?.homeWinProb || 0, b.prediction?.awayWinProb || 0);
      return probB - probA;
    });
  }, [fixtures, dateFilter, customStartDate, customEndDate, selectedLeague, searchQuery, filterType]);

  return (
    <div className="space-y-3 font-sans">
      {/* Merged Mobile-Friendly Toolbar with Date Range, League, Filter & Search */}
      <div className="bg-white dark:bg-[#0B0F17] p-3.5 rounded-3xl shadow-sm space-y-2">
        {/* Controls Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-center">
          {/* Date Range & Prebuilt Acca Button */}
          <div className="col-span-2 lg:col-span-4 relative min-w-0">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 truncate flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-500" />
                <span>Date Range</span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {/* Date Filter Dropdown */}
              <div className="relative min-w-0">
                <select
                  id="date-filter-dropdown"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full bg-slate-100/90 dark:bg-slate-900/90 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer pr-7 focus:outline-none truncate shadow-xs"
                >
                  {dateOptions.map((opt) => (
                    <option key={opt.key} value={opt.key} className="bg-white dark:bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
              </div>

              {/* View Prebuilt Accas Shortcut Button */}
              {onViewPrebuiltAccas && (
                <button
                  type="button"
                  onClick={onViewPrebuiltAccas}
                  className="w-full bg-emerald-50/90 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1 transition-all cursor-pointer truncate shadow-xs hover:shadow-sm"
                  title="View AI Prebuilt Accumulators"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">Prebuilt Accas</span>
                </button>
              )}
            </div>
          </div>

          {/* League Dropdown Filter */}
          <div className="col-span-1 lg:col-span-2 relative min-w-0">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 truncate">
              League
            </label>
            <div className="relative">
              <select
                id="league-filter-dropdown"
                value={selectedLeague}
                onChange={(e) => onSelectLeague(e.target.value)}
                className="w-full bg-slate-100/90 dark:bg-slate-900/90 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer pr-7 focus:outline-none truncate shadow-xs"
              >
                {leagueOptions.map((opt) => (
                  <option key={opt.code} value={opt.code} className="bg-white dark:bg-slate-900">
                    {opt.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* Picks Strategy Filter Dropdown */}
          <div className="col-span-1 lg:col-span-2 relative min-w-0">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 truncate">
              Filter Picks
            </label>
            <div className="relative">
              <select
                id="picks-filter-dropdown"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full bg-slate-100/90 dark:bg-slate-900/90 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer pr-7 focus:outline-none truncate shadow-xs"
              >
                {filterOptions.map((opt) => (
                  <option key={opt.key} value={opt.key} className="bg-white dark:bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* Market Focus Dropdown */}
          {viewMode === 'WIREFRAME' && (
            <div className="col-span-1 lg:col-span-2 relative min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 truncate">
                Market
              </label>
              <div className="relative">
                <select
                  id="market-column-dropdown"
                  value={marketChoiceFilter}
                  onChange={(e) => setMarketChoiceFilter(e.target.value as any)}
                  className="w-full bg-slate-100/90 dark:bg-slate-900/90 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer pr-7 focus:outline-none truncate shadow-xs"
                >
                  {marketOptions.map((opt) => (
                    <option key={opt.key} value={opt.key} className="bg-white dark:bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
              </div>
            </div>
          )}

          {/* Search & View Toggle Column */}
          <div className={`${viewMode === 'WIREFRAME' ? 'col-span-2 sm:col-span-2 lg:col-span-2' : 'col-span-2 sm:col-span-2 lg:col-span-4'} flex flex-col justify-end min-w-0`}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 truncate">
              Search
            </label>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Find team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100/90 dark:bg-slate-900/90 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none min-w-0 truncate font-medium shadow-xs"
                />
              </div>

              {/* View Switcher Button */}
              <div className="flex items-center bg-slate-100/90 dark:bg-slate-900/90 rounded-xl p-0.5 shrink-0 shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewMode('WIREFRAME')}
                  className={`p-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'WIREFRAME'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title="Table Prediction View"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('CARDS')}
                  className={`p-1 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'CARDS'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Date Range Sub-Bar */}
        {dateFilter === 'CUSTOM' && (
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-100 dark:bg-slate-900 rounded-lg px-2 py-1 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none shadow-xs"
            />
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-100 dark:bg-slate-900 rounded-lg px-2 py-1 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none shadow-xs"
            />
          </div>
        )}
      </div>

      {/* Fixtures Display (Wireframe or Cards) */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#0B0F17] rounded-3xl p-10 text-center shadow-sm space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Computing Poisson Match Predictions...</p>
        </div>
      ) : filteredFixtures.length === 0 ? (
        <div className="bg-white dark:bg-[#0B0F17] rounded-3xl p-8 text-center shadow-sm space-y-2">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No fixtures found matching your criteria.
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try choosing &quot;All Dates&quot; or resetting your search filters.
          </p>
          {dateFilter !== 'ALL' && (
            <button
              onClick={() => setDateFilter('ALL')}
              className="mt-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              Show All Available Dates ({fixtures.length} matches)
            </button>
          )}
        </div>
      ) : viewMode === 'WIREFRAME' ? (
        <SimplifiedPredictionsWireframe
          fixtures={filteredFixtures}
          onSelectDetail={onSelectDetail}
          marketFilter={marketChoiceFilter}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredFixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              onSelectDetail={onSelectDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
};
