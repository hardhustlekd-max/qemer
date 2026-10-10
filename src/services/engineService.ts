import {
  Fixture,
  EngineSettings,
  ProviderStatus,
  AccumulatorSlip,
  HistoricalMatch,
  MarketOption,
  TrendingTipsData,
  HeadToHeadMeasurement,
} from '../core/types.js';
import { PoissonEngine } from '../core/poisson.js';
import { AccumulatorGenerator, AccaGenerationParams, isMatchStarted } from '../core/accumulator.js';
import { FootballDataCSVParser } from '../core/csvParser.js';
import { getRelativeDateStr } from '../core/seedData.js';
import { LiveScore } from '../providers/types.js';
import { GLOBAL_LEAGUES_DATASET } from '../core/globalLeaguesDataset.js';
import { getInitialHistoricalMatches, getInitialUpcomingFixtures } from '../core/initialDbDataset.js';
import { getLeaguePriority } from '../core/leaguePriority.js';

// Default In-Memory Engine State for Universal & Client-Side execution (Vercel, Static, etc.)
let localSettings: EngineSettings = {
  activeProvider: 'FLASHSCORE',
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
    id: 'FLASHSCORE',
    name: 'Flashscore Live Scraper',
    type: 'SCRAPER',
    status: 'ONLINE',
    description: 'Direct FlashscoreScraping engine extracting live match results, in-play statistics, worldwide fixtures, and results directly from Flashscore.',
    latencyMs: 14,
    features: ['Direct Flashscore Feed Scraper', 'Real-Time In-Play Scores', '50+ Worldwide Leagues & Cups', 'Live Statistics & Results', 'Instant SQLite Sync'],
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
      try {
        const { flashscoreScraperService } = await import('./flashscoreScraperService.js');
        localUpcomingFixtures = await flashscoreScraperService.getUpcomingFixtures();
      } catch {
        // Fallback to initial dataset if scraper fails
      }
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

    // 1. Process prediction and markets for ALL upcoming matches first
    const allEnriched = localUpcomingFixtures
      .filter((f) => f.matchDate >= todayStr)
      .map((f) => {
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
          measurements: prediction.measurements,
        };
      });

    // 2. Filter enriched predictions based on parameters
    let fixturesToProcess = allEnriched;

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

    // Sort prioritizing major popular leagues on top
    return fixturesToProcess.slice().sort((a, b) => {
      const priorityA = getLeaguePriority(a.league, a.leagueName, a.stage);
      const priorityB = getLeaguePriority(b.league, b.leagueName, b.stage);
      if (priorityA !== priorityB) return priorityA - priorityB;
      if (a.matchDate !== b.matchDate) return a.matchDate.localeCompare(b.matchDate);
      return (a.kickOffTime || '').localeCompare(b.kickOffTime || '');
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
   * Fetches full match detail including real scraped H2H measurements
   */
  public static async getMatchDetail(fixtureId: string): Promise<Fixture | null> {
    const serverData = await this.safeJsonFetch(`/api/fixtures/${fixtureId}`);
    if (serverData && serverData.success && serverData.fixture) {
      return serverData.fixture;
    }
    return null;
  }

  /**
   * Fetches real scraped Head-to-Head (H2H) records for a specific match
   */
  public static async getMatchHeadToHead(
    fixtureId: string,
    homeTeam?: string,
    awayTeam?: string
  ): Promise<HeadToHeadMeasurement | null> {
    const params = new URLSearchParams();
    if (homeTeam) params.set('home', homeTeam);
    if (awayTeam) params.set('away', awayTeam);
    const query = params.toString() ? `?${params.toString()}` : '';

    const serverData = await this.safeJsonFetch(`/api/fixtures/${fixtureId}/h2h${query}`);
    if (serverData && serverData.success && serverData.h2h) {
      return serverData.h2h;
    }

    // Try detail endpoint fallback
    const detailData = await this.safeJsonFetch(`/api/fixtures/${fixtureId}`);
    if (detailData && detailData.success && detailData.fixture?.prediction?.measurements?.h2h) {
      return detailData.fixture.prediction.measurements.h2h;
    }

    return null;
  }

  /**
   * Fetches live in-play scores
   */
  public static async getLiveScores(): Promise<LiveScore[]> {
    const serverData = await this.safeJsonFetch('/api/providers/live-scores');
    if (serverData && serverData.success && Array.isArray(serverData.scores) && serverData.scores.length > 0) {
      return serverData.scores;
    }

    return [];
  }

  /**
   * Fetches historical completed match results mapped to Fixture format
   */
  public static async getHistoricalMatches(league = 'ALL', limit = 200): Promise<Fixture[]> {
    const params = new URLSearchParams();
    if (league !== 'ALL') params.set('league', league);
    params.set('limit', String(limit));

    const serverData = await this.safeJsonFetch(`/api/fixtures/history?${params.toString()}`);
    let rawMatches: HistoricalMatch[] = [];

    if (serverData && serverData.success && Array.isArray(serverData.matches) && serverData.matches.length > 0) {
      rawMatches = serverData.matches;
    } else {
      rawMatches = localHistoricalMatches;
      if (league !== 'ALL') {
        rawMatches = rawMatches.filter((m) => m.div.toUpperCase() === league.toUpperCase());
      }
      rawMatches = rawMatches.slice(0, limit);
    }

    const leagueMap = new Map<string, string>();
    GLOBAL_LEAGUES_DATASET.forEach((l) => leagueMap.set(l.code.toUpperCase(), l.name));
    leagueMap.set('E0', 'Premier League');
    leagueMap.set('SP1', 'La Liga');
    leagueMap.set('D1', 'Bundesliga');
    leagueMap.set('I1', 'Serie A');
    leagueMap.set('F1', 'Ligue 1');
    leagueMap.set('UCL', 'UEFA Champions League');
    leagueMap.set('UEL', 'UEFA Europa League');

    return rawMatches.map((m) => {
      const homeWinOdds = m.b365H || 2.10;
      const drawOdds = m.b365D || 3.30;
      const awayWinOdds = m.b365A || 3.40;
      const homeProb = m.ftr === 'H' ? 0.65 : m.ftr === 'D' ? 0.28 : 0.15;
      const drawProb = m.ftr === 'D' ? 0.45 : 0.26;
      const awayProb = m.ftr === 'A' ? 0.65 : m.ftr === 'D' ? 0.26 : 0.15;
      const tipKey = m.ftr === 'H' ? 'HOME_WIN' : m.ftr === 'A' ? 'AWAY_WIN' : 'DRAW';
      const tipOdds = m.ftr === 'H' ? homeWinOdds : m.ftr === 'A' ? awayWinOdds : drawOdds;

      return {
        id: `hist_${m.id}`,
        providerId: 'HISTORICAL',
        league: m.div,
        leagueName: leagueMap.get(m.div.toUpperCase()) || m.div,
        matchDate: m.matchDate,
        kickOffTime: 'FT',
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        status: 'FINISHED' as const,
        score: {
          home: m.fthg,
          away: m.ftag,
        },
        odds: {
          homeWin: homeWinOdds,
          draw: drawOdds,
          awayWin: awayWinOdds,
          over25: m.b365Over25 ?? (m.fthg + m.ftag > 2 ? 1.75 : 2.05),
          under25: m.b365Under25 ?? (m.fthg + m.ftag > 2 ? 2.05 : 1.75),
        },
        prediction: {
          homeXG: Number((m.hs ? m.hs * 0.12 : 1.4).toFixed(2)),
          awayXG: Number((m.asShots ? m.asShots * 0.11 : 1.1).toFixed(2)),
          homeWinProb: homeProb,
          drawProb,
          awayWinProb: awayProb,
          over15Prob: 0.8,
          over25Prob: m.fthg + m.ftag > 2.5 ? 0.75 : 0.4,
          over35Prob: 0.35,
          bttsProb: m.fthg > 0 && m.ftag > 0 ? 0.7 : 0.35,
          topCorrectScores: [{
            homeGoals: m.fthg,
            awayGoals: m.ftag,
            score: `${m.fthg}-${m.ftag}`,
            probability: 0.3,
          }],
          homeAttackStrength: 1.2,
          homeDefenseStrength: 1.0,
          awayAttackStrength: 1.0,
          awayDefenseStrength: 1.1,
          homeFormMultiplier: 1.0,
          awayFormMultiplier: 1.0,
          probabilityMatrix: [],
        },
        bestValueMarket: {
          key: tipKey as any,
          name: m.ftr === 'H' ? 'Home Win' : m.ftr === 'A' ? 'Away Win' : 'Draw',
          odds: tipOdds,
          probability: 0.65,
          impliedProb: 0.5,
          expectedValue: 0.15,
          isPositiveEV: true,
          isBanker: false,
        },
      };
    });
  }

  /**
   * Fetches Prebuilt Accumulator Slips generated entirely on the server side
   */
  public static async getPrebuiltAccumulators(
    dateScope = 'TODAY',
    stake = 10,
    fixtures?: Fixture[]
  ): Promise<Record<string, AccumulatorSlip>> {
    const serverData = await this.safeJsonFetch('/api/accumulator/prebuilt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateScope, stake, fixtures }),
    });

    if (serverData && serverData.success && serverData.slips) {
      return serverData.slips;
    }

    // Fallback if running purely offline - strictly exclude started matches
    const rawFixtures = fixtures && fixtures.length > 0 ? fixtures : this.calculateLocalFixtures('ALL');
    const fixturesToUse = rawFixtures.filter((f) => !isMatchStarted(f));
    const banker = AccumulatorGenerator.generateSlip(
      fixturesToUse,
      {
        strategy: 'BANKER',
        legCount: 3,
        minProbability: 0.68,
        stake,
        dateFilter: dateScope,
        allowedMarkets: ['HOME_WIN', 'AWAY_WIN', 'DOUBLE_CHANCE_1X', 'DOUBLE_CHANCE_X2', 'OVER_15' as any],
      },
      localSettings
    );
    const value = AccumulatorGenerator.generateSlip(
      fixturesToUse,
      {
        strategy: 'VALUE_HUNTER',
        legCount: 4,
        stake,
        dateFilter: dateScope,
        allowedMarkets: ['HOME_WIN', 'AWAY_WIN', 'OVER_25', 'BTTS_YES', 'DRAW'],
      },
      localSettings
    );
    const goals = AccumulatorGenerator.generateSlip(
      fixturesToUse,
      {
        strategy: 'CUSTOM',
        legCount: 4,
        targetOdds: 6.0,
        stake,
        dateFilter: dateScope,
        allowedMarkets: ['OVER_25', 'BTTS_YES'],
      },
      localSettings
    );
    goals.name = dateScope === 'TODAY' ? "Today's High Goals Combo" : 'High Goals & BTTS Acca';

    const mega = AccumulatorGenerator.generateSlip(
      fixturesToUse,
      {
        strategy: 'CUSTOM',
        legCount: 6,
        targetOdds: 20.0,
        stake,
        dateFilter: dateScope,
        allowedMarkets: ['HOME_WIN', 'AWAY_WIN', 'OVER_25', 'BTTS_YES', 'DOUBLE_CHANCE_1X'],
      },
      localSettings
    );
    mega.name = dateScope === 'TODAY' ? "Today's 6-Fold Mega Acca" : 'Weekend Mega Accumulator';

    return {
      BANKER: banker,
      VALUE_HUNTER: value,
      HIGH_GOALS: goals,
      MEGA_COMBO: mega,
    };
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
