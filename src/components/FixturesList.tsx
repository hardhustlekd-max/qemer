import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Shield, Flame, Filter, Layers } from 'lucide-react';
import { Fixture, AccaLeg, MarketOption } from '../core/types.js';
import { FixtureCard } from './FixtureCard.js';

interface FixturesListProps {
  fixtures: Fixture[];
  isLoading: boolean;
  onSelectDetail: (fixture: Fixture) => void;
  onAddLegToSlip: (leg: AccaLeg) => void;
  isLegInSlip: (fixtureId: string, marketKey: MarketOption['key']) => boolean;
  selectedLeague: string;
  onSelectLeague: (league: string) => void;
}

export const FixturesList: React.FC<FixturesListProps> = ({
  fixtures,
  isLoading,
  onSelectDetail,
  onAddLegToSlip,
  isLegInSlip,
  selectedLeague,
  onSelectLeague,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'POSITIVE_EV' | 'BANKER' | 'HIGH_XG'>('ALL');

  const leagueTabs = [
    { code: 'ALL', name: 'All Leagues' },
    { code: 'E0', name: 'Premier League' },
    { code: 'SP1', name: 'La Liga' },
    { code: 'D1', name: 'Bundesliga' },
    { code: 'I1', name: 'Serie A' },
  ];

  const filteredFixtures = useMemo(() => {
    return fixtures.filter((f) => {
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
  }, [fixtures, selectedLeague, searchQuery, filterType]);

  const totalEVCount = fixtures.filter((f) => f.markets?.some((m) => m.isPositiveEV)).length;
  const totalBankerCount = fixtures.filter((f) => f.markets?.some((m) => m.isBanker)).length;

  return (
    <div className="space-y-4">
      {/* League Filter Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-2 rounded-2xl">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {leagueTabs.map((tab) => (
            <button
              key={tab.code}
              id={`league-tab-${tab.code.toLowerCase()}`}
              onClick={() => onSelectLeague(tab.code)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedLeague === tab.code
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Filter Chips (+EV, Banker, High xG) */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1 rounded-lg border font-medium transition-all ${
            filterType === 'ALL'
              ? 'bg-slate-800 border-slate-700 text-white'
              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Matches ({fixtures.length})
        </button>

        <button
          onClick={() => setFilterType('POSITIVE_EV')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-medium transition-all ${
            filterType === 'POSITIVE_EV'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
              : 'bg-slate-950/50 border-slate-800 text-emerald-400 hover:border-emerald-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>+EV Value Picks</span>
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-900/60 text-[10px] font-mono font-bold">
            {totalEVCount}
          </span>
        </button>

        <button
          onClick={() => setFilterType('BANKER')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-medium transition-all ${
            filterType === 'BANKER'
              ? 'bg-violet-950 border-violet-500 text-violet-300'
              : 'bg-slate-950/50 border-slate-800 text-violet-400 hover:border-violet-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Safe Bankers (&gt;70%)</span>
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-violet-900/60 text-[10px] font-mono font-bold">
            {totalBankerCount}
          </span>
        </button>

        <button
          onClick={() => setFilterType('HIGH_XG')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-medium transition-all ${
            filterType === 'HIGH_XG'
              ? 'bg-amber-950 border-amber-500 text-amber-300'
              : 'bg-slate-950/50 border-slate-800 text-amber-400 hover:border-amber-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>High Expected Goals (&gt;2.8 xG)</span>
        </button>
      </div>

      {/* Fixtures Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 h-44 animate-pulse"
            />
          ))}
        </div>
      ) : filteredFixtures.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-300 font-medium">No fixtures found matching current filter</p>
          <p className="text-xs text-slate-500 mt-1">Try selecting &quot;All Leagues&quot; or clearing your search term</p>
        </div>
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
