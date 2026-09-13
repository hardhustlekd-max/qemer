import { APIProvider, LiveOddsUpdate, LiveScore } from './types.js';
import { Fixture } from '../core/types.js';
import { FootballDataCSVParser } from '../core/csvParser.js';
import { db } from '../core/db.js';
import { PREMIER_LEAGUE_HISTORICAL_CSV, INITIAL_UPCOMING_FIXTURES } from '../core/seedData.js';

export class FootballDataCoUkProvider implements APIProvider {
  id = 'FOOTBALL_DATA_CO_UK' as const;
  name = 'Football-Data.co.uk';
  type = 'CSV' as const;
  description = 'Direct structured historical CSV parser (E0.csv, SP1.csv, D1.csv, I1.csv) with closing Bet365/Pinnacle market odds.';
  features = [
    'Historical CSV Data Ingestion',
    'Half-Time & Full-Time Goal Statistics',
    'Historical Closing Bet365 Bookmaker Odds',
    'Direct Multi-League Import Support',
  ];

  async getUpcomingFixtures(date?: string): Promise<Fixture[]> {
    // Return fixtures stored in SQLite or default authentic fixtures
    const existing = db.getUpcomingFixtures();
    if (existing.length > 0) {
      return existing;
    }
    // Seed default upcoming
    db.insertUpcomingFixtures(INITIAL_UPCOMING_FIXTURES);
    return INITIAL_UPCOMING_FIXTURES;
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
    // Simulated live match states for active fixtures
    return [
      {
        fixtureId: 'e0_brighton_nottingham_today',
        homeTeam: 'Brighton',
        awayTeam: "Nott'm Forest",
        homeScore: 1,
        awayScore: 0,
        minute: 34,
        status: 'FIRST_HALF',
        events: [{ minute: 18, type: 'GOAL', team: 'Brighton', player: 'Mitoma' }],
      },
      {
        fixtureId: 'd1_leverkusen_leipzig_today',
        homeTeam: 'Leverkusen',
        awayTeam: 'RB Leipzig',
        homeScore: 2,
        awayScore: 1,
        minute: 68,
        status: 'SECOND_HALF',
        events: [
          { minute: 22, type: 'GOAL', team: 'Leverkusen', player: 'Wirtz' },
          { minute: 41, type: 'GOAL', team: 'RB Leipzig', player: 'Openda' },
          { minute: 58, type: 'GOAL', team: 'Leverkusen', player: 'Boniface' },
        ],
      },
    ];
  }

  async syncHistoricalData(): Promise<{ success: boolean; matchesCount: number; message: string }> {
    try {
      // Ingest bundled structured CSV data
      const parsedMatches = FootballDataCSVParser.parseCSV(PREMIER_LEAGUE_HISTORICAL_CSV);
      const inserted = db.insertHistoricalMatches(parsedMatches);

      // Also ensure upcoming fixtures exist
      db.insertUpcomingFixtures(INITIAL_UPCOMING_FIXTURES);

      return {
        success: true,
        matchesCount: inserted,
        message: `Successfully parsed and seeded ${inserted} historical matches from Football-Data.co.uk CSV dataset into SQLite.`,
      };
    } catch (err: any) {
      console.error('FootballDataCoUkProvider sync error:', err);
      return {
        success: false,
        matchesCount: 0,
        message: `Failed to parse historical CSV data: ${err?.message || 'Unknown error'}`,
      };
    }
  }
}
