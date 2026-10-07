import { Fixture, LeagueCode } from '../core/types.js';
import { db } from '../core/db.js';

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  season?: { year: number; type: number };
  competitions?: Array<{
    id: string;
    date: string;
    attendance?: number;
    competitors?: Array<{
      id: string;
      homeAway: 'home' | 'away';
      winner?: boolean;
      team: {
        id: string;
        name: string;
        displayName: string;
        shortDisplayName: string;
        abbreviation: string;
        logo?: string;
      };
      score?: string;
    }>;
    odds?: Array<{
      provider?: { name: string };
      details?: string;
      overUnder?: number;
      homeWinPercentage?: number;
      drawPercentage?: number;
      awayWinPercentage?: number;
      moneyline?: {
        home?: { decimal?: number };
        draw?: { decimal?: number };
        away?: { decimal?: number };
      };
    }>;
    status?: {
      type?: {
        state?: string;
        description?: string;
      };
    };
  }>;
  league?: {
    slug?: string;
    name?: string;
    abbreviation?: string;
  };
}

const LEAGUE_MAPPINGS: Record<string, { code: LeagueCode; name: string }> = {
  'eng.1': { code: 'E0', name: 'Premier League' },
  'esp.1': { code: 'SP1', name: 'La Liga' },
  'ger.1': { code: 'D1', name: 'Bundesliga' },
  'ita.1': { code: 'I1', name: 'Serie A' },
  'fra.1': { code: 'F1', name: 'Ligue 1' },
  'uefa.champions': { code: 'UCL', name: 'Champions League' },
};

let lastFetchTime = 0;
const CACHE_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Dynamically fetches live upcoming real fixtures from public soccer data feeds with database persistence
 */
export async function fetchRealUpcomingFixtures(): Promise<Fixture[]> {
  const now = Date.now();
  const existing = db.getUpcomingFixtures();

  // If we already have fresh fixtures in SQLite database within cache window, return from DB
  if (existing.length >= 3 && now - lastFetchTime < CACHE_WINDOW_MS) {
    return existing;
  }

  const leaguesToFetch = ['eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1', 'uefa.champions'];
  const fetchedFixtures: Fixture[] = [];
  const seenFixtureIds = new Set<string>();

  try {
    const fetchPromises = leaguesToFetch.map(async (leagueKey) => {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueKey}/scoreboard`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      try {
        const res = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; RealSoccerEngine/1.0)',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) return [];

        const data = await res.json();
        const events: ESPNEvent[] = Array.isArray(data?.events) ? data.events : [];
        const leagueFixtures: Fixture[] = [];

        for (const event of events) {
          if (!event.id) continue;

          const comp = event.competitions?.[0];
          if (!comp) continue;

          const homeComp = comp.competitors?.find((c) => c.homeAway === 'home');
          const awayComp = comp.competitors?.find((c) => c.homeAway === 'away');

          const homeTeam =
            homeComp?.team?.displayName || homeComp?.team?.name || 'Home Team';
          const awayTeam =
            awayComp?.team?.displayName || awayComp?.team?.name || 'Away Team';

          if (!homeTeam || !awayTeam || homeTeam === awayTeam) continue;

          const eventDateStr = comp.date || event.date || new Date().toISOString();
          const eventDate = new Date(eventDateStr);
          const matchDate = eventDate.toISOString().split('T')[0];
          const kickOffTime = eventDate.toTimeString().slice(0, 5) || '19:00';

          const rawOdds = comp.odds?.[0];
          let homeOdds = rawOdds?.moneyline?.home?.decimal || 2.10;
          let drawOdds = rawOdds?.moneyline?.draw?.decimal || 3.40;
          let awayOdds = rawOdds?.moneyline?.away?.decimal || 3.50;

          if (rawOdds?.homeWinPercentage && !rawOdds?.moneyline?.home?.decimal) {
            const hProb = Math.max(0.05, Math.min(0.90, rawOdds.homeWinPercentage / 100));
            const dProb = Math.max(0.05, Math.min(0.90, (rawOdds.drawPercentage || 25) / 100));
            const aProb = Math.max(0.05, Math.min(0.90, (rawOdds.awayWinPercentage || 25) / 100));
            homeOdds = Number((1 / hProb).toFixed(2));
            drawOdds = Number((1 / dProb).toFixed(2));
            awayOdds = Number((1 / aProb).toFixed(2));
          }

          const leagueInfo = LEAGUE_MAPPINGS[leagueKey] || {
            code: 'E0',
            name: event.league?.name || 'Top Flight Soccer',
          };

          const state = comp.status?.type?.state?.toUpperCase();
          const status: Fixture['status'] =
            state === 'IN' ? 'LIVE' : state === 'POST' ? 'FINISHED' : 'SCHEDULED';

          leagueFixtures.push({
            id: `real_${event.id}`,
            providerId: 'REAL_LIVE_FEED',
            league: leagueInfo.code,
            leagueName: leagueInfo.name,
            matchDate,
            kickOffTime,
            homeTeam,
            awayTeam,
            homeBadge: homeComp?.team?.logo,
            awayBadge: awayComp?.team?.logo,
            status,
            odds: {
              homeWin: homeOdds,
              draw: drawOdds,
              awayWin: awayOdds,
              over25: 1.85,
              under25: 1.95,
              bttsYes: 1.75,
              bttsNo: 2.05,
            },
          });
        }
        return leagueFixtures;
      } catch {
        clearTimeout(timeout);
        return [];
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        for (const f of result.value) {
          if (!seenFixtureIds.has(f.id)) {
            seenFixtureIds.add(f.id);
            fetchedFixtures.push(f);
          }
        }
      }
    }
  } catch (err) {
    console.error('Real-time fixtures live fetch error:', err);
  }

  if (fetchedFixtures.length > 0) {
    db.insertUpcomingFixtures(fetchedFixtures);
    lastFetchTime = now;
    return fetchedFixtures;
  }

  return db.getUpcomingFixtures();
}
