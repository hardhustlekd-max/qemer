import { Router } from 'express';
import { db } from '../core/db.js';
import { providerManager } from '../providers/providerManager.js';
import { PoissonEngine } from '../core/poisson.js';
import { EngineSettings, Fixture } from '../core/types.js';

export const fixturesRouter = Router();

fixturesRouter.get('/', async (req, res) => {
  try {
    const leagueFilter = req.query.league as string | undefined;
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

    // Fetch fixtures from active provider
    let fixtures = await provider.getUpcomingFixtures();

    if (leagueFilter && leagueFilter !== 'ALL') {
      fixtures = fixtures.filter((f) => f.league.toUpperCase() === leagueFilter.toUpperCase());
    }

    // Retrieve all historical matches once for optimal performance
    const allMatches = db.getAllHistoricalMatches(1500);

    // Process every fixture through the Poisson engine
    const enrichedFixtures: Fixture[] = fixtures.map((f) => {
      // Filter league-specific historical data
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

    res.json({
      success: true,
      provider: provider.name,
      count: enrichedFixtures.length,
      fixtures: enrichedFixtures,
    });
  } catch (err: any) {
    console.error('Error fetching fixtures:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch fixtures' });
  }
});

fixturesRouter.get('/:id', async (req, res) => {
  try {
    const fixtureId = req.params.id;
    const provider = providerManager.getActiveProvider();
    const fixtures = await provider.getUpcomingFixtures();
    const f = fixtures.find((item) => item.id === fixtureId);

    if (!f) {
      return res.status(404).json({ success: false, error: 'Fixture not found' });
    }

    const settings: EngineSettings = db.getSettings() || {
      activeProvider: 'FOOTBALL_DATA_CO_UK',
      rollingMatchWindow: 15,
      minEVThreshold: 1.10,
      safeWinThreshold: 0.72,
      homeAdvantageFactor: 1.12,
      formDecayRate: 0.85,
      autoSyncDaily: true,
    };

    const allMatches = db.getAllHistoricalMatches(1500);
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

    // Also get direct head-to-head matches
    const h2hMatches = allMatches.filter(
      (m) =>
        (m.homeTeam.toLowerCase() === f.homeTeam.toLowerCase() && m.awayTeam.toLowerCase() === f.awayTeam.toLowerCase()) ||
        (m.homeTeam.toLowerCase() === f.awayTeam.toLowerCase() && m.awayTeam.toLowerCase() === f.homeTeam.toLowerCase())
    );

    res.json({
      success: true,
      fixture: {
        ...f,
        prediction,
        markets,
        bestValueMarket,
        homeStats,
        awayStats,
        h2hMatches,
      },
    });
  } catch (err: any) {
    console.error('Error fetching fixture detail:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch fixture detail' });
  }
});
