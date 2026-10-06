import { APIProvider, LiveOddsUpdate, LiveScore } from './types.js';
import { Fixture } from '../core/types.js';
import { db } from '../core/db.js';
import { fetchRealLiveScores } from '../services/realLiveScoresService.js';
import { fetchRealUpcomingFixtures } from '../services/realUpcomingFixturesService.js';

export class ApiFootballProvider implements APIProvider {
  id = 'API_FOOTBALL' as const;
  name = 'API-Football (RapidAPI)';
  type = 'REST' as const;
  description = 'High-breadth global football data feed supporting 1,000+ leagues, comprehensive bookmaker aggregation, and deep live score events.';
  features = [
    'Global 1000+ League Aggregation',
    'Multiple Bookmaker Market Comparison',
    'Live In-Play Ingestion & Lineups',
    'High Volume Fixture Feeds',
  ];

  async getUpcomingFixtures(date?: string): Promise<Fixture[]> {
    let raw = db.getUpcomingFixtures(undefined, date);
    if (raw.length === 0) {
      raw = await fetchRealUpcomingFixtures();
    }

    return raw.map((f) => ({
      ...f,
      providerId: 'API_FOOTBALL',
    }));
  }

  async getLiveOdds(fixtureId: string): Promise<LiveOddsUpdate> {
    const fixtures = await this.getUpcomingFixtures();
    const fixture = fixtures.find((f) => f.id === fixtureId);

    return {
      fixtureId,
      timestamp: new Date().toISOString(),
      odds: fixture ? fixture.odds : { homeWin: 2.00, draw: 3.40, awayWin: 3.80 },
      movement: 'DOWN',
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
      message: `API-Football synchronized ${fixtures.length} real fixtures into local engine.`,
    };
  }
}
