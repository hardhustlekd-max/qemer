import { APIProvider, LiveOddsUpdate, LiveScore } from './types.js';
import { Fixture } from '../core/types.js';
import { db } from '../core/db.js';
import { fetchRealLiveScores } from '../services/realLiveScoresService.js';
import { fetchRealUpcomingFixtures } from '../services/realUpcomingFixturesService.js';

export class EspnProvider implements APIProvider {
  id = 'ESPN' as const;
  name = 'ESPN Global Sports Feed';
  type = 'REST' as const;
  description = 'Direct real-time global soccer scoreboard, schedule & in-play events feed with live match minutes and moneyline odds.';
  features = [
    'Real-Time Live Scoreboard',
    'Official Match Schedules',
    'Worldwide League Coverage (50+ Leagues)',
    'Live In-Play Match Events',
  ];

  async getUpcomingFixtures(date?: string): Promise<Fixture[]> {
    const existing = db.getUpcomingFixtures(undefined, date);
    const hasEspnFixtures = existing.some((f) => f.providerId === 'espn');
    if (hasEspnFixtures && existing.length >= 2) {
      return existing;
    }

    try {
      const live = await fetchRealUpcomingFixtures(date);
      if (live.length > 0) {
        return date ? live.filter((f) => f.matchDate === date) : live;
      }
    } catch {
      // Fallback to database
    }

    return existing;
  }

  async getLiveOdds(fixtureId: string): Promise<LiveOddsUpdate> {
    const fixtures = await this.getUpcomingFixtures();
    const fixture = fixtures.find((f) => f.id === fixtureId);

    if (!fixture) {
      return {
        fixtureId,
        timestamp: new Date().toISOString(),
        odds: { homeWin: 2.10, draw: 3.40, awayWin: 3.50, over25: 1.80, under25: 2.00, bttsYes: 1.75, bttsNo: 2.05 },
        movement: 'STABLE',
      };
    }

    return {
      fixtureId,
      timestamp: new Date().toISOString(),
      odds: fixture.odds,
      movement: 'STABLE',
    };
  }

  async getLiveScores(): Promise<LiveScore[]> {
    return fetchRealLiveScores();
  }

  async syncHistoricalData(): Promise<{ success: boolean; matchesCount: number; message: string }> {
    const fixtures = await fetchRealUpcomingFixtures();
    return {
      success: true,
      matchesCount: fixtures.length,
      message: `Synchronized ${fixtures.length} live upcoming fixtures from ESPN Global Sports Feed.`,
    };
  }
}
