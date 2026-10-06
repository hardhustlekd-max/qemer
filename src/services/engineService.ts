import {
  Fixture,
  EngineSettings,
  ProviderStatus,
  AccumulatorSlip,
  HistoricalMatch,
  MarketOption,
} from '../core/types.js';
import { PoissonEngine } from '../core/poisson.js';
import { AccumulatorGenerator, AccaGenerationParams } from '../core/accumulator.js';
import { FootballDataCSVParser } from '../core/csvParser.js';
import { PREMIER_LEAGUE_HISTORICAL_CSV, INITIAL_UPCOMING_FIXTURES } from '../core/seedData.js';
import { LiveScore } from '../providers/types.js';

// Default In-Memory Engine State for Universal & Client-Side execution (Vercel, Static, etc.)
let localSettings: EngineSettings = {
  activeProvider: 'FOOTBALL_DATA_CO_UK',
  rollingMatchWindow: 15,
  minEVThreshold: 1.10,
  safeWinThreshold: 0.72,
  homeAdvantageFactor: 1.12,
  formDecayRate: 0.85,
  autoSyncDaily: true,
};

let localHistoricalMatches: HistoricalMatch[] = FootballDataCSVParser.parseCSV(PREMIER_LEAGUE_HISTORICAL_CSV);
let localUpcomingFixtures: Fixture[] = [...INITIAL_UPCOMING_FIXTURES];

const PROVIDER_METADATA: ProviderStatus[] = [
  {
    id: 'FOOTBALL_DATA_CO_UK',
    name: 'Football-Data.co.uk',
    type: 'CSV',
    status: 'ONLINE',
    description: 'Direct structured historical CSV parser (E0.csv, SP1.csv, D1.csv, I1.csv) with closing Bet365/Pinnacle market odds.',
    latencyMs: 4,
    features: ['Historical CSV Ingestion', 'Half-Time Goals', 'Closing Bet365 Odds', 'Multi-League Support'],
  },
  {
    id: 'BIG_BALLS_DATA',
    name: 'Big Balls Data Feed',
    type: 'REST',
    status: 'ONLINE',
    description: 'Specialized deep-football statistics provider with momentum weighting and live line updates.',
    latencyMs: 18,
    features: ['Momentum Weighting', 'Rest-Day Adjustments', 'Real-Time Line Movements'],
  },
  {
    id: 'FOOTBALL_DATA_ORG',
    name: 'Football-Data.org API',
    type: 'REST',
    status: 'ONLINE',
    description: 'Standard RESTful matchday fixture schedules with structured team formations and squad availability.',
    latencyMs: 42,
    features: ['Fixture Schedules', 'Team Formations', 'Standings Correlation'],
  },
  {
    id: 'API_FOOTBALL',
    name: 'API-Football (RapidAPI)',
    type: 'REST',
    status: 'ONLINE',
    description: 'High-frequency live football odds provider with in-play statistics and minute-by-minute updates.',
    latencyMs: 55,
    features: ['Live In-Play Odds', 'Minute Events', '25+ Bookmakers'],
  },
];

export class EngineService {
  /**
   * Helper to check if a backend response is valid JSON
   */
  private static async safeJsonFetch(url: string, options?: RequestInit): Promise<any> {
    try {
      const res = await fetch(url, options);
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetches fixtures - queries /api/fixtures, and transparently falls back to in-memory Poisson calculations if deployed statically (e.g. Vercel)
   */
  public static async getFixtures(league = 'ALL'): Promise<Fixture[]> {
    const url = league !== 'ALL' ? `/api/fixtures?league=${encodeURIComponent(league)}` : '/api/fixtures';
    const serverData = await this.safeJsonFetch(url);

    if (serverData && serverData.success && Array.isArray(serverData.fixtures) && serverData.fixtures.length > 0) {
      return serverData.fixtures;
    }

    // Client-side fallback calculation with pure Poisson mathematical engine
    return this.calculateLocalFixtures(league);
  }

  /**
   * Pure Client-Side Poisson calculation over local fixtures
   */
  public static calculateLocalFixtures(leagueFilter = 'ALL'): Fixture[] {
    let fixturesToProcess = [...localUpcomingFixtures];

    if (leagueFilter && leagueFilter !== 'ALL') {
      fixturesToProcess = fixturesToProcess.filter(
        (f) => f.league.toUpperCase() === leagueFilter.toUpperCase()
      );
    }

    return fixturesToProcess.map((f) => {
      // Find league matches
      const leagueMatches = localHistoricalMatches.filter(
        (m) => m.div.toUpperCase() === f.league.toUpperCase()
      );
      const historicalContext = leagueMatches.length >= 10 ? leagueMatches : localHistoricalMatches;

      const { prediction, homeStats, awayStats } = PoissonEngine.predictMatch(
        f.homeTeam,
        f.awayTeam,
        historicalContext,
        localSettings
      );

      const { markets, bestValueMarket } = PoissonEngine.calculateMarkets(
        prediction,
        f.odds,
        localSettings,
        f.homeTeam,
        f.awayTeam
      );

      return {
        ...f,
        prediction,
        markets,
        bestValueMarket,
        homeStats,
        awayStats,
      };
    });
  }

  /**
   * Fetches engine settings
   */
  public static async getSettings(): Promise<EngineSettings> {
    const serverData = await this.safeJsonFetch('/api/settings');
    if (serverData && serverData.success && serverData.settings) {
      localSettings = serverData.settings;
      return serverData.settings;
    }
    return localSettings;
  }

  /**
   * Updates engine settings
   */
  public static async updateSettings(newSettings: Partial<EngineSettings>): Promise<EngineSettings> {
    const serverData = await this.safeJsonFetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });

    if (serverData && serverData.success && serverData.settings) {
      localSettings = serverData.settings;
      return serverData.settings;
    }

    localSettings = { ...localSettings, ...newSettings };
    return localSettings;
  }

  /**
   * Fetches provider status
   */
  public static async getProviders(): Promise<ProviderStatus[]> {
    const serverData = await this.safeJsonFetch('/api/providers');
    if (serverData && serverData.success && Array.isArray(serverData.providers)) {
      return serverData.providers;
    }

    return PROVIDER_METADATA;
  }

  /**
   * Hot-swaps active provider
   */
  public static async switchProvider(providerId: EngineSettings['activeProvider']): Promise<boolean> {
    const serverData = await this.safeJsonFetch('/api/providers/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId }),
    });

    if (serverData && serverData.success) {
      localSettings.activeProvider = providerId;
      return true;
    }

    localSettings.activeProvider = providerId;
    return true;
  }

  /**
   * Fetches database and league statistics
   */
  public static async getStats(): Promise<{ totalMatches: number; totalTeams: number; leagues: any[] }> {
    const serverData = await this.safeJsonFetch('/api/stats');
    if (serverData && serverData.success && serverData.stats) {
      return serverData.stats;
    }

    // Client-side stats calculation
    const uniqueTeams = new Set<string>();
    const leagueMap = new Map<string, number>();

    for (const m of localHistoricalMatches) {
      uniqueTeams.add(m.homeTeam);
      uniqueTeams.add(m.awayTeam);
      leagueMap.set(m.div, (leagueMap.get(m.div) || 0) + 1);
    }

    const leagues = Array.from(leagueMap.entries()).map(([div, count]) => ({
      div,
      count,
    }));

    return {
      totalMatches: localHistoricalMatches.length,
      totalTeams: uniqueTeams.size,
      leagues,
    };
  }

  /**
   * Fetches live in-play scores
   */
  public static async getLiveScores(): Promise<LiveScore[]> {
    const serverData = await this.safeJsonFetch('/api/providers/live-scores');
    if (serverData && serverData.success && Array.isArray(serverData.scores)) {
      return serverData.scores;
    }

    return [
      {
        fixtureId: 'e0_brighton_nottingham_today',
        homeTeam: 'Brighton',
        awayTeam: "Nott'm Forest",
        homeScore: 1,
        awayScore: 0,
        minute: 34,
        status: 'FIRST_HALF',
        events: [{ minute: 18, type: 'GOAL', team: 'HOME', player: 'Welbeck' }],
      },
      {
        fixtureId: 'sp1_valencia_girona_today',
        homeTeam: 'Valencia',
        awayTeam: 'Girona',
        homeScore: 2,
        awayScore: 1,
        minute: 67,
        status: 'SECOND_HALF',
        events: [
          { minute: 23, type: 'GOAL', team: 'HOME', player: 'Hugo Duro' },
          { minute: 49, type: 'GOAL', team: 'AWAY', player: 'Dovbyk' },
          { minute: 61, type: 'GOAL', team: 'HOME', player: 'Javi Guerra' },
        ],
      },
      {
        fixtureId: 'd1_stuttgart_dortmund_today',
        homeTeam: 'VfB Stuttgart',
        awayTeam: 'Borussia Dortmund',
        homeScore: 0,
        awayScore: 0,
        minute: 12,
        status: 'FIRST_HALF',
        events: [],
      },
    ];
  }

  /**
   * Generates Accumulator Slip
   */
  public static async generateAccumulator(params: AccaGenerationParams): Promise<AccumulatorSlip> {
    const serverData = await this.safeJsonFetch('/api/accumulator/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (serverData && serverData.success && serverData.slip) {
      return serverData.slip;
    }

    // Client-side accumulator generation
    const calculatedFixtures = this.calculateLocalFixtures('ALL');
    return AccumulatorGenerator.generateSlip(calculatedFixtures, params, localSettings);
  }

  /**
   * Seeds historical CSV dataset (or custom CSV)
   */
  public static async seedDatabase(
    customCsv?: string,
    reset = false
  ): Promise<{ success: boolean; message: string; stats: any }> {
    const serverData = await this.safeJsonFetch('/api/stats/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customCsv, reset }),
    });

    if (serverData && serverData.success) {
      return serverData;
    }

    if (reset) {
      localHistoricalMatches = [];
    }

    const csvToParse = customCsv && customCsv.trim().length > 0 ? customCsv : PREMIER_LEAGUE_HISTORICAL_CSV;
    const parsed = FootballDataCSVParser.parseCSV(csvToParse);
    localHistoricalMatches = [...localHistoricalMatches, ...parsed];

    const stats = await this.getStats();
    return {
      success: true,
      message: `Parsed & ingested ${parsed.length} historical matches into local Poisson engine!`,
      stats,
    };
  }
}
