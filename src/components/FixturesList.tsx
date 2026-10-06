import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Layers, LayoutList, LayoutGrid, Calendar } from 'lucide-react';
import { Fixture, AccaLeg, MarketOption } from '../core/types.js';
import { getRelativeDateStr } from '../core/seedData.js';
import { FixtureCard } from './FixtureCard.js';
import { SimplifiedPredictionsWireframe } from './SimplifiedPredictionsWireframe.js';

interface FixturesListProps {
  fixtures: Fixture[];
  isLoading: boolean;
  onSelectDetail: (fixture: Fixture) => void;
  onAddLegToSlip: (leg: AccaLeg) => void;
  isLegInSlip: (fixtureId: string, marketKey: MarketOption['key']) => boolean;
  selectedLeague: string;
  onSelectLeague: (league: string) => void;
  onGenerateAcca?: (params: any) => void;
  onQuickGenerate?: (strategy: 'BANKER' | 'VALUE_HUNTER', dateFilter?: string) => void;
  onToggleCustomSlip?: () => void;
  isCustomSlipOpen?: boolean;
}

export const FixturesList: React.FC<FixturesListProps> = ({
  fixtures,
  isLoading,
  onSelectDetail,
  onAddLegToSlip,
  isLegInSlip,
  selectedLeague,
  onSelectLeague,
  onGenerateAcca,
  onQuickGenerate,
  onToggleCustomSlip,
  isCustomSlipOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'TOMORROW' | 'NEXT_3_DAYS' | 'THIS_WEEK' | 'ALL' | 'CUSTOM'>('TODAY');
  const [customStartDate, setCustomStartDate] = useState(getRelativeDateStr(0));
  const [customEndDate, setCustomEndDate] = useState(getRelativeDateStr(3));
  const [filterType, setFilterType] = useState<'ALL' | 'POSITIVE_EV' | 'BANKER' | 'HIGH_XG'>('ALL');
  const [viewMode, setViewMode] = useState<'WIREFRAME' | 'CARDS'>('WIREFRAME');
  const [marketChoiceFilter, setMarketChoiceFilter] = useState<'BEST_VALUE' | 'OVER_UNDER' | '1X2' | 'BTTS'>('BEST_VALUE');

  const handleQuickSlipSelect = (value: string) => {
    if (!value) return;
    if (value === 'TODAY_SLIP') {
      onGenerateAcca?.({
        strategy: 'VALUE_HUNTER',
        legCount: 10,
        minProbability: 0.50,
        stake: 10,
        dateFilter: 'TODAY',
      });
    } else if (value === 'SAFE_PICKS') {
      onQuickGenerate?.('BANKER', dateFilter);
    } else if (value === 'TOP_VALUE') {
      onQuickGenerate?.('VALUE_HUNTER', dateFilter);
    } else if (value === 'CUSTOM_SLIP') {
      onToggleCustomSlip?.();
    }
  };

  const dateOptions = [
    { key: 'TODAY' as const, label: "Today's Picks" },
    { key: 'TOMORROW' as const, label: 'Tomorrow' },
    { key: 'NEXT_3_DAYS' as const, label: 'Next 3 Days' },
    { key: 'THIS_WEEK' as const, label: 'This Week' },
    { key: 'ALL' as const, label: 'All Dates' },
    { key: 'CUSTOM' as const, label: 'Custom Range...' },
  ];

  const leagueOptions = [
    { code: 'ALL', name: 'All Leagues' },
    { code: 'E0', name: 'Premier League' },
    { code: 'SP1', name: 'La Liga' },
    { code: 'D1', name: 'Bundesliga' },
    { code: 'I1', name: 'Serie A' },
  ];

  const filterOptions = [
    { key: 'ALL' as const, label: 'All Matches' },
    { key: 'POSITIVE_EV' as const, label: 'Best Value' },
    { key: 'BANKER' as const, label: 'Safe Picks' },
    { key: 'HIGH_XG' as const, label: 'High Goals' },
  ];

  const marketOptions = [
    { key: 'BEST_VALUE' as const, label: 'Top Picks' },
    { key: 'OVER_UNDER' as const, label: 'Over/Under' },
    { key: '1X2' as const, label: '1X2 Match Winner' },
    { key: 'BTTS' as const, label: 'Both Teams to Score' },
  ];

  const filteredFixtures = useMemo(() => {
    const todayStr = getRelativeDateStr(0);
    const tomorrowStr = getRelativeDateStr(1);
    const next3DaysStr = getRelativeDateStr(2);
    const thisWeekStr = getRelativeDateStr(6);

    return fixtures.filter((f) => {
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
        const hasBanker = f.markets?.some((m) => m.isBanker);
        if (!hasBanker) return false;
      } else if (filterType === 'HIGH_XG') {
        if (f.prediction && f.prediction.homeXG + f.prediction.awayXG < 2.8) {
          return false;
        }
      }

      return true;
    });
  }, [fixtures, dateFilter, customStartDate, customEndDate, selectedLeague, searchQuery, filterType]);

  return (
    <div className="space-y-3 font-sans">
      {/* Merged Mobile-Friendly Toolbar with Date Range, League, Filter & Search */}
      <div className="bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-xs space-y-2">
        {/* Controls Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-center">
          {/* Date Range & Quick Slips Section (Defaulted to Today) */}
          <div className="col-span-2 lg:col-span-4 relative min-w-0">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 truncate flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-500" />
                <span>Date Range &amp; Slips</span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {/* Date Filter Dropdown */}
              <div className="relative min-w-0">
                <select
                  id="date-filter-dropdown"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer pr-7 focus:outline-none truncate"
                >
                  {dateOptions.map((opt) => (
                    <option key={opt.key} value={opt.key} className="bg-white dark:bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
              </div>

              {/* Quick Slip Dropdown (Today's Slip, Safe Picks, Top Value) */}
              <div className="relative min-w-0">
                <select
                  id="quick-slips-dropdown"
                  defaultValue=""
                  onChange={(e) => {
                    handleQuickSlipSelect(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl px-2.5 py-1.5 text-xs font-bold text-red-700 dark:text-red-400 appearance-none cursor-pointer pr-7 focus:outline-none truncate"
                >
                  <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-500">
                    ⚡ Quick Slip...
                  </option>
                  <option value="TODAY_SLIP" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    🔥 Today&apos;s Slip
                  </option>
                  <option value="SAFE_PICKS" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    🛡️ Safe Picks
                  </option>
                  <option value="TOP_VALUE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    ✨ Top Value
                  </option>
                  <option value="CUSTOM_SLIP" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    🎯 {isCustomSlipOpen ? 'Hide Custom Slip' : 'Custom Slip Builder'}
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-red-500 dark:text-red-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
              </div>
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
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer pr-7 focus:outline-none truncate"
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
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer pr-7 focus:outline-none truncate"
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

          {/* Market Choice Dropdown */}
          {viewMode === 'WIREFRAME' && (
            <div className="col-span-1 lg:col-span-2 relative min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 truncate">
                Choices Column
              </label>
              <div className="relative">
                <select
                  id="market-column-dropdown"
                  value={marketChoiceFilter}
                  onChange={(e) => setMarketChoiceFilter(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer pr-7 focus:outline-none truncate"
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
              Search &amp; View
            </label>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Find team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none min-w-0 truncate font-medium"
                />
              </div>

              {/* View Switcher Button */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('WIREFRAME')}
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    viewMode === 'WIREFRAME'
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Simplified Table View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('CARDS')}
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    viewMode === 'CARDS'
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Seamless Merged Custom Date Range Inputs (Only shown when Custom is selected) */}
        {dateFilter === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-500">Custom Range:</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[10px]">From</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[10px]">To</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Fixtures View */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-800 rounded-2xl p-8 space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
          <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full" />
          <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full" />
        </div>
      ) : filteredFixtures.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-800 rounded-2xl">
          <Layers className="w-7 h-7 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">No matches found for selected date &amp; filters</p>
          <p className="text-xs text-slate-500 mt-1">
            Try switching Date Range to &quot;Next 3 Days&quot; or &quot;All Dates&quot;
          </p>
        </div>
      ) : viewMode === 'WIREFRAME' ? (
        <SimplifiedPredictionsWireframe
          fixtures={filteredFixtures}
          onSelectDetail={onSelectDetail}
          onAddLegToSlip={onAddLegToSlip}
          isLegInSlip={isLegInSlip}
          marketFilter={marketChoiceFilter}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              onSelectDetail={onSelectDetail}
              onAddLegToSlip={onAddLegToSlip}
              isLegInSlip={isLegInSlip}
            />
          ))}
        </div>
      )}
    </div>
  );
};

