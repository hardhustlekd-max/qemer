import React, { useState } from 'react';
import { Filter, ChevronDown, Search } from 'lucide-react';
import { GLOBAL_LEAGUES_DATASET } from '../core/globalLeaguesDataset.js';

interface MainTabBarProps {
  activeTab: 'FIXTURES' | 'ACCAS';
  onSelectTab: (tab: 'FIXTURES' | 'ACCAS') => void;
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
  setIsLeagueModalOpen: (b: boolean) => void;
}

export const MainTabBar: React.FC<MainTabBarProps> = ({
  activeTab,
  onSelectTab,
  selectedLeague,
  onSelectLeague,
  dateFilter,
  setDateFilter,
  marketChoiceFilter,
  setMarketChoiceFilter,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  setIsLeagueModalOpen,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const dateOptions = [
    { key: 'ALL', label: 'All Leagues & Dates' },
    { key: 'THIS_WEEK', label: 'This Week' },
    { key: 'TODAY', label: "Today's Matches" },
    { key: 'TOMORROW', label: 'Tomorrow' },
    { key: 'NEXT_3_DAYS', label: 'Next 3 Days' },
  ];

  const marketOptions = [
    { key: 'BEST_VALUE', label: 'Best Value' },
    { key: 'OVER_UNDER', label: 'Over Under' },
    { key: '1X2', label: '1X2 Match Winner' },
    { key: 'BTTS', label: 'Both Teams to Score' },
  ];

  const leagueOptions = [
    { code: 'ALL', name: 'All Leagues Worldwide' },
    ...GLOBAL_LEAGUES_DATASET.map((l) => ({ code: l.code, name: `${l.name} (${l.country || 'Global'})` })),
  ];

  return (
    <div className="bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-xs transition-colors relative z-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3">
        {/* Left tabs: Predictions, Accumulator */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl shadow-xs shrink-0 overflow-x-auto no-scrollbar">
          <button
            id="tab-fixtures-btn"
            type="button"
            onClick={() => onSelectTab('FIXTURES')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'FIXTURES'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Predictions
          </button>

          <button
            id="tab-accas-btn"
            type="button"
            onClick={() => onSelectTab('ACCAS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ACCAS'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Accumulator
          </button>
        </div>

        {/* Right side: Filter Button with Hover/Click Popover */}
        {activeTab === 'FIXTURES' && (
          <div 
            className="relative shrink-0"
            onMouseEnter={() => setIsFilterOpen(true)}
            onMouseLeave={() => setIsFilterOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            >
              <Filter className="w-3.5 h-3.5 text-emerald-500" />
              <span>Filters</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Whole Complete Filter Section Hovering Above Every Component */}
            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#0B0F17] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[9999] p-4 space-y-3 font-sans">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Match Filters</span>
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                {/* Standalone League Dropdown Filter filling horizontal space */}
                <div className="w-full relative min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                      League Filter
                    </label>
                    <button
                      type="button"
                      onClick={() => { setIsLeagueModalOpen(true); setIsFilterOpen(false); }}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Browse All Leagues...
                    </button>
                  </div>
                  <select
                    value={selectedLeague}
                    onChange={(e) => onSelectLeague(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none shadow-xs cursor-pointer"
                  >
                    {leagueOptions.map((opt, idx) => (
                      <option key={`${opt.code}-${idx}`} value={opt.code} className="bg-white dark:bg-slate-900">
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grid for Date Range and Market */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Date Range Filter */}
                  <div className="relative min-w-0">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Date Range
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none shadow-xs cursor-pointer"
                    >
                      {dateOptions.map((opt) => (
                        <option key={opt.key} value={opt.key} className="bg-white dark:bg-slate-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Market Focus Dropdown */}
                  {viewMode === 'WIREFRAME' && (
                    <div className="relative min-w-0">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Market
                      </label>
                      <select
                        value={marketChoiceFilter}
                        onChange={(e) => setMarketChoiceFilter(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-950 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none shadow-xs cursor-pointer"
                      >
                        {marketOptions.map((opt) => (
                          <option key={opt.key} value={opt.key} className="bg-white dark:bg-slate-900">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Search */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Team</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Find team..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none shadow-xs font-medium"
                    />
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">View Mode</span>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setViewMode('WIREFRAME')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'WIREFRAME'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Table
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('CARDS')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'CARDS'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Cards
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
