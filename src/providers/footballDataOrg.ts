import { APIProvider, LiveOddsUpdate, LiveScore } from './types.js';
import { Fixture } from '../core/types.js';
import { db } from '../core/db.js';
import { fetchRealLiveScores } from '../services/realLiveScoresService.js';
import { fetchRealUpcomingFixtures } from '../services/realUpcomingFixturesService.js';

export class FootballDataOrgProvider implements APIProvider {
  id = 'FOOTBALL_DATA_ORG' as const;
  name = 'Football-Data.org API';
  type = 'REST' as const;
  description = 'RESTful Tier 1 European football API provider with structured matchday schedules and official team standings.';
  features = [
    'Official League Schedules & Matchdays',
    'Standard RESTful API Endpoints',
    'Tier 1 Competitions (PL, BL, SA, PD, CL)',
    'Automated Kick-off Time Synchronization',
  ];

  async getUpcomingFixtures(date?: string): Promise<Fixture[]> {
    let raw = db.getUpcomingFixtures(undefined, date);
    if (raw.length === 0) {
      raw = await fetchRealUpcomingFixtures();
    }

    return raw.map((f) => ({
      ...f,
      providerId: 'FOOTBALL_DATA_ORG',
      status: 'TIMED',
    }));
  }

  async getLiveOdds(fixtureId: string): Promise<LiveOddsUpdate> {
    const fixtures = await this.getUpcomingFixtures();
    const fixture = fixtures.find((f) => f.id === fixtureId);

    return {
      fixtureId,
      timestamp: new Date().toISOString(),
      odds: fixture ? fixture.odds : { homeWin: 1.90, draw: 3.50, awayWin: 4.00 },
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
      message: `Football-Data.org API refreshed ${fixtures.length} live season fixtures.`,
    };
  }
}
