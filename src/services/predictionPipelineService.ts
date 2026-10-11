import { db } from '../core/db.js';
import { predictionsDb } from '../core/predictionsDb.js';
import { PoissonEngine } from '../core/poisson.js';
import { EngineSettings, Fixture } from '../core/types.js';
import { isMatchStarted } from '../core/accumulator.js';

export class PredictionPipelineService {
  /**
   * Runs the Poisson Prediction Engine for a set of upcoming fixtures
   * and stores the resulting predictions in the separate predictions database (predictions.sqlite)
   */
  public static async predictAndStoreUpcomingFixtures(
    upcomingFixtures: Fixture[]
  ): Promise<{ count: number; fixtures: Fixture[] }> {
    const settings: EngineSettings = db.getSettings() || {
      activeProvider: 'FLASHSCORE',
      rollingMatchWindow: 15,
      minEVThreshold: 1.10,
      safeWinThreshold: 0.72,
      homeAdvantageFactor: 1.12,
      formDecayRate: 0.85,
      autoSyncDaily: true,
    };

    // Deduplicate fixtures and filter out past/started fixtures
    const seenIds = new Set<string>();
    const validFixtures = upcomingFixtures.filter((f) => {
      if (!f.id || seenIds.has(f.id) || isMatchStarted(f)) return false;
      seenIds.add(f.id);
      return true;
    });

    // Gather all historical matches & scraped matches for real team form
    const rawHist = db.getAllHistoricalMatches(1500);
    const scrapedMatches = db.getFlashscoreScrapedMatches(500);
    const scrapedAsHistorical: any[] = scrapedMatches
      .filter((sm) => sm.result?.home !== undefined && sm.result?.away !== undefined)
      .map((sm) => ({
        div: sm.leagueName || sm.stage || 'FLASHSCORE',
        matchDate: sm.date ? sm.date.slice(0, 10) : '2024-01-01',
        homeTeam: sm.home.name,
        awayTeam: sm.away.name,
        fthg: parseInt(sm.result!.home!, 10) || 0,
        ftag: parseInt(sm.result!.away!, 10) || 0,
        ftr: (parseInt(sm.result!.home!, 10) || 0) > (parseInt(sm.result!.away!, 10) || 0)
          ? 'H'
          : (parseInt(sm.result!.home!, 10) || 0) < (parseInt(sm.result!.away!, 10) || 0)
          ? 'A'
          : 'D',
      }));
    const allMatches = [...rawHist, ...scrapedAsHistorical];

    const scrapedMap = new Map<string, any>();
    for (const sm of scrapedMatches) {
      if (sm.matchId) {
        scrapedMap.set(sm.matchId, sm);
        scrapedMap.set(`fs_${sm.matchId}`, sm);
      }
      if (sm.home?.name && sm.away?.name) {
        scrapedMap.set(`${sm.home.name.toLowerCase()}__${sm.away.name.toLowerCase()}`, sm);
      }
    }

    const cachedH2HMap = db.getAllPredictionMeasurements();

    // Process every fixture through the Poisson prediction engine
    const enrichedFixtures: Fixture[] = validFixtures.map((f) => {
      const leagueMatches = allMatches.filter((m) => m.div.toUpperCase() === f.league.toUpperCase());
      const historicalContext = leagueMatches.length >= 10 ? leagueMatches : allMatches;

      const cleanId = (f.id || '').replace(/^fs_/, '');
      const cachedH2H =
        cachedH2HMap.get(cleanId) ||
        cachedH2HMap.get(f.id) ||
        (f.prediction?.measurements?.h2h && f.prediction.measurements.h2h.matchesCount > 0
          ? f.prediction.measurements.h2h
          : null);

      const { prediction, homeStats, awayStats } = PoissonEngine.predictMatch(
        f.homeTeam,
        f.awayTeam,
        historicalContext,
        settings,
        cachedH2H,
        allMatches
      );

      const { markets, bestValueMarket } = PoissonEngine.calculateMarkets(
        prediction,
        f.odds,
        settings,
        f.homeTeam,
        f.awayTeam
      );

      const sm =
        scrapedMap.get(f.id) ||
        scrapedMap.get(f.id.replace('fs_', '')) ||
        scrapedMap.get(`${f.homeTeam.toLowerCase()}__${f.awayTeam.toLowerCase()}`);

      const stage = sm?.stage || f.stage;
      const homeBadge = sm?.home?.image || f.homeBadge;
      const awayBadge = sm?.away?.image || f.awayBadge;
      const information = sm?.information && sm.information.length > 0 ? sm.information : f.information;
      const statistics = sm?.statistics && sm.statistics.length > 0 ? sm.statistics : f.statistics;
      const resultDetails = sm?.result
        ? {
            regulationTime: sm.result.regulationTime,
            penalties: sm.result.penalties,
          }
        : f.resultDetails;

      return {
        ...f,
        stage,
        homeBadge,
        awayBadge,
        information,
        statistics,
        resultDetails,
        prediction,
        markets,
        bestValueMarket,
        homeStats,
        awayStats,
        measurements: prediction.measurements,
      };
    });

    // Store in the separate predictions database
    await predictionsDb.init();
    predictionsDb.savePredictions(enrichedFixtures);

    return {
      count: enrichedFixtures.length,
      fixtures: enrichedFixtures,
    };
  }
}
