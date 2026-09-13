import { Router } from 'express';
import { db } from '../core/db.js';
import { providerManager } from '../providers/providerManager.js';
import { PoissonEngine } from '../core/poisson.js';
import { AccumulatorGenerator, AccaGenerationParams } from '../core/accumulator.js';
import { EngineSettings, Fixture } from '../core/types.js';

export const accumulatorRouter = Router();

accumulatorRouter.post('/generate', async (req, res) => {
  try {
    const params: AccaGenerationParams = req.body || {};
    const provider = providerManager.getActiveProvider();
    const settings: EngineSettings = db.getSettings() || {
      activeProvider: 'FOOTBALL_DATA_CO_UK',
      rollingMatchWindow: 15,
      minEVThreshold: 1.10,
      safeWinThreshold: 0.72,
      homeAdvantageFactor: 1.12,
      formDecayRate: 0.85,
      autoSyncDaily: true,
    };

    const rawFixtures = await provider.getUpcomingFixtures();
    const allMatches = db.getAllHistoricalMatches(1500);

    // Enrich all fixtures with Poisson predictions & markets
    const enrichedFixtures: Fixture[] = rawFixtures.map((f) => {
      const leagueMatches = allMatches.filter((m) => m.div.toUpperCase() === f.league.toUpperCase());
      const historicalContext = leagueMatches.length >= 10 ? leagueMatches : allMatches;

      const { prediction, homeStats, awayStats } = PoissonEngine.predictMatch(
        f.homeTeam,
        f.awayTeam,
        historicalContext,
        settings
      );

      const { markets, bestValueMarket } = PoissonEngine.calculateMarkets(
        prediction,
        f.odds,
        settings,
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

    const slip = AccumulatorGenerator.generateSlip(enrichedFixtures, params, settings);

    res.json({
      success: true,
      slip,
    });
  } catch (err: any) {
    console.error('Error generating accumulator slip:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to generate accumulator' });
  }
});
