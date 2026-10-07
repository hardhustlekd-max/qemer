import {
  Fixture,
  EngineSettings,
  ProviderStatus,
  AccumulatorSlip,
  HistoricalMatch,
  MarketOption,
  TrendingTipsData,
} from '../core/types.js';
import { PoissonEngine } from '../core/poisson.js';
import { AccumulatorGenerator, AccaGenerationParams } from '../core/accumulator.js';
import { FootballDataCSVParser } from '../core/csvParser.js';
import { getRelativeDateStr } from '../core/seedData.js';
import { LiveScore } from '../providers/types.js';
import { fetchRealLiveScores } from './realLiveScoresService.js';
import { fetchRealUpcomingFixtures } from './realUpcomingFixturesService.js';
import { getInitialHistoricalMatches, getInitialUpcomingFixtures } from '../core/initialDbDataset.js';

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

let localHistoricalMatches: HistoricalMatch[] = getInitialHistoricalMatches();
let localUpcomingFixtures: Fixture[] = getInitialUpcomingFixtures();

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
  public static async getFixtures(
    league = 'ALL',
    dateFilter?: string,
    customStartDate?: string,
    customEndDate?: string
  ): Promise<Fixture[]> {
    const params = new URLSearchParams();
    if (league !== 'ALL') params.set('league', league);
    if (dateFilter && dateFilter !== 'ALL') params.set('dateFilter', dateFilter);
    if (customStartDate) params.set('startDate', customStartDate);
    if (customEndDate) params.set('endDate', customEndDate);

    const query = params.toString();
    const url = query ? `/api/fixtures?${query}` : '/api/fixtures';
    const serverData = await this.safeJsonFetch(url);

    if (serverData && serverData.success && Array.isArray(serverData.fixtures) && serverData.fixtures.length > 0) {
      return serverData.fixtures;
    }

    if (localUpcomingFixtures.length === 0) {
      localUpcomingFixtures = await fetchRealUpcomingFixtures();
    }

    // Client-side fallback calculation with pure Poisson mathematical engine
    return this.calculateLocalFixtures(league, dateFilter, customStartDate, customEndDate);
  }

  /**
   * Pure Client-Side Poisson calculation over local fixtures
   */
  public static calculateLocalFixtures(
    leagueFilter = 'ALL',
    dateFilter = 'ALL',
    customStartDate?: string,
    customEndDate?: string
  ): Fixture[] {
    const todayStr = getRelativeDateStr(0);
    const tomorrowStr = getRelativeDateStr(1);
    const next3DaysStr = getRelativeDateStr(2);
    const thisWeekStr = getRelativeDateStr(6);

    let fixturesToProcess = localUpcomingFixtures
      .filter((f) => f.matchDate >= todayStr)
      .map((f) => ({ ...f }));

    if (leagueFilter && leagueFilter !== 'ALL') {
      fixturesToProcess = fixturesToProcess.filter(
        (f) => f.league.toUpperCase() === leagueFilter.toUpperCase()
      );
    }

    if (dateFilter === 'TODAY') {
      fixturesToProcess = fixturesToProcess.filter((f) => f.matchDate === todayStr);
    } else if (dateFilter === 'TOMORROW') {
      fixturesToProcess = fixturesToProcess.filter((f) => f.matchDate === tomorrowStr);
    } else if (dateFilter === 'NEXT_3_DAYS') {
      fixturesToProcess = fixturesToProcess.filter((f) => f.matchDate >= todayStr && f.matchDate <= next3DaysStr);
    } else if (dateFilter === 'THIS_WEEK') {
      fixturesToProcess = fixturesToProcess.filter((f) => f.matchDate >= todayStr && f.matchDate <= thisWeekStr);
    } else if (dateFilter === 'CUSTOM') {
      if (customStartDate) fixturesToProcess = fixturesToProcess.filter((f) => f.matchDate >= customStartDate);
      if (customEndDate) fixturesToProcess = fixturesToProcess.filter((f) => f.matchDate <= customEndDate);
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
    if (serverData && serverData.success && Array.isArray(serverData.scores) && serverData.scores.length > 0) {
      return serverData.scores;
    }

    const realScores = await fetchRealLiveScores();
    if (realScores && realScores.length > 0) {
      return realScores;
    }

    return [];
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

    if (customCsv && customCsv.trim().length > 0) {
      const parsed = FootballDataCSVParser.parseCSV(customCsv);
      localHistoricalMatches = [...localHistoricalMatches, ...parsed];

      const stats = await this.getStats();
      return {
        success: true,
        message: `Parsed & ingested ${parsed.length} historical matches into local Poisson engine!`,
        stats,
      };
    }

    const stats = await this.getStats();
    return {
      success: true,
      message: `Database state updated.`,
      stats,
    };
  }

  /**
   * Fetches trending football tips & headlines grounded by Google Search
   */
  public static async getTrendingTips(): Promise<TrendingTipsData | null> {
    const serverData = await this.safeJsonFetch('/api/tips');
    if (serverData && serverData.success && serverData.data) {
      return serverData.data;
    }
    return null;
  }

  /**
   * Forces refresh of trending football tips & headlines with Google Search
   */
  public static async refreshTrendingTips(): Promise<TrendingTipsData | null> {
    const serverData = await this.safeJsonFetch('/api/tips/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (serverData && serverData.success && serverData.data) {
      return serverData.data;
    }
    return null;
  }
}
