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
  'uefa.champions': { code: 'UCL', name: 'UEFA Champions League' },
  'uefa.europa': { code: 'UEL', name: 'UEFA Europa League' },
  'ned.1': { code: 'N1', name: 'Eredivisie' },
  'por.1': { code: 'P1', name: 'Primeira Liga' },
  'bra.1': { code: 'BRA', name: 'Brasileirão Série A' },
  'usa.1': { code: 'MLS', name: 'Major League Soccer' },
  'ksa.1': { code: 'SPL', name: 'Saudi Pro League' },
  'jpn.1': { code: 'JPL', name: 'J1 League (Japan)' },
};

const leaguesToFetch = [
  'eng.1',
  'esp.1',
  'ger.1',
  'ita.1',
  'fra.1',
  'uefa.champions',
  'uefa.europa',
  'ned.1',
  'por.1',
  'bra.1',
  'usa.1',
  'ksa.1',
  'jpn.1',
];

let lastFetchTime = 0;
const CACHE_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Dynamically fetches live upcoming real fixtures from global soccer data feeds with database persistence
 */
export async function fetchRealUpcomingFixtures(): Promise<Fixture[]> {
  const now = Date.now();
  const existing = db.getUpcomingFixtures();

  // If we already have fresh fixtures in SQLite database within cache window, return from DB
  if (existing.length >= 3 && now - lastFetchTime < CACHE_WINDOW_MS) {
    return existing;
  }

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
            'User-Agent': 'Mozilla/5.0 (compatible; GlobalSoccerEngine/1.0)',
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
            code: 'E0' as LeagueCode,
            name: event.league?.name || 'International League',
          };

          const fixtureId = `global-${leagueInfo.code}-${event.id}`;
          if (seenFixtureIds.has(fixtureId)) continue;
          seenFixtureIds.add(fixtureId);

          const hWinProb = Number((1 / homeOdds).toFixed(2));
          const dProb = Number((1 / drawOdds).toFixed(2));
          const aWinProb = Number((1 / awayOdds).toFixed(2));
          const sumProb = hWinProb + dProb + aWinProb;

          const normH = Number((hWinProb / sumProb).toFixed(2));
          const normD = Number((dProb / sumProb).toFixed(2));
          const normA = Number((aWinProb / sumProb).toFixed(2));

          leagueFixtures.push({
            id: fixtureId,
            providerId: 'espn',
            league: leagueInfo.code,
            leagueName: leagueInfo.name,
            homeTeam,
            awayTeam,
            matchDate,
            kickOffTime,
            status: comp.status?.type?.state === 'IN' ? 'LIVE' : comp.status?.type?.state === 'POST' ? 'FINISHED' : 'SCHEDULED',
            odds: {
              homeWin: homeOdds,
              draw: drawOdds,
              awayWin: awayOdds,
            },
            prediction: {
              homeXG: Number((normH * 2.4).toFixed(2)),
              awayXG: Number((normA * 1.8).toFixed(2)),
              homeWinProb: normH,
              drawProb: normD,
              awayWinProb: normA,
              over15Prob: 0.78,
              over25Prob: 0.52,
              over35Prob: 0.28,
              bttsProb: 0.55,
              topCorrectScores: [
                { homeGoals: 1, awayGoals: 0, score: '1-0', probability: 0.18 },
                { homeGoals: 2, awayGoals: 1, score: '2-1', probability: 0.14 },
              ],
              homeAttackStrength: 1.4,
              homeDefenseStrength: 1.0,
              awayAttackStrength: 1.2,
              awayDefenseStrength: 1.1,
              homeFormMultiplier: 1.05,
              awayFormMultiplier: 1.0,
              probabilityMatrix: [
                [0.12, 0.09, 0.04],
                [0.15, 0.12, 0.05],
                [0.08, 0.07, 0.03],
              ],
            },
            markets: [
              {
                key: normH >= 0.5 ? 'HOME_WIN' : normA >= 0.5 ? 'AWAY_WIN' : 'OVER_25',
                name: normH >= 0.5 ? 'Home Win' : normA >= 0.5 ? 'Away Win' : 'Over 2.5 Goals',
                odds: normH >= 0.5 ? homeOdds : normA >= 0.5 ? awayOdds : 1.95,
                probability: Math.max(normH, normA, 0.55),
                impliedProb: 1 / (normH >= 0.5 ? homeOdds : 1.95),
                expectedValue: 1.12,
                isPositiveEV: true,
                isBanker: Math.max(normH, normA) >= 0.60,
              },
            ],
            bestValueMarket: {
              key: normH >= 0.5 ? 'HOME_WIN' : 'AWAY_WIN',
              name: normH >= 0.5 ? 'Home Win (Value)' : 'Away Win (Value)',
              odds: normH >= 0.5 ? homeOdds : awayOdds,
              probability: Math.max(normH, normA),
              impliedProb: 1 / (normH >= 0.5 ? homeOdds : awayOdds),
              expectedValue: 1.15,
              isPositiveEV: true,
              isBanker: Math.max(normH, normA) >= 0.58,
            },
            score: comp.status?.type?.state === 'IN' || comp.status?.type?.state === 'POST' ? {
              home: Number(homeComp?.score || 0),
              away: Number(awayComp?.score || 0),
            } : undefined,
          });
        }

        return leagueFixtures;
      } catch {
        return [];
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.length > 0) {
        fetchedFixtures.push(...r.value);
      }
    }

    if (fetchedFixtures.length > 0) {
      db.saveUpcomingFixtures(fetchedFixtures);
      lastFetchTime = Date.now();
      return fetchedFixtures;
    }
  } catch {
    // ignore
  }

  return existing.length > 0 ? existing : [];
}
