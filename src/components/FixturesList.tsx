import React, { useMemo } from 'react';
import { Fixture } from '../core/types.js';
import { getRelativeDateStr } from '../core/seedData.js';
import { FixtureCard } from './FixtureCard.js';
import { SimplifiedPredictionsWireframe } from './SimplifiedPredictionsWireframe.js';
import { LeagueSelectorModal } from './LeagueSelectorModal.js';

interface FixturesListProps {
  fixtures: Fixture[];
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

  const filteredFixtures = useMemo(() => {
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
  }, [fixtures, dateFilter, selectedLeague, searchQuery, baseToday]);

  return (
    <div className="space-y-2.5 font-sans">
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
        </div>
      ) : viewMode === 'WIREFRAME' ? (
        <SimplifiedPredictionsWireframe
          fixtures={filteredFixtures}
          onSelectDetail={onSelectDetail}
          marketFilter={marketChoiceFilter as any}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredFixtures.map((fixture) => (
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
