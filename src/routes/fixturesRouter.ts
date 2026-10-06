import { Router } from 'express';
import { db } from '../core/db.js';
import { providerManager } from '../providers/providerManager.js';
import { PoissonEngine } from '../core/poisson.js';
import { EngineSettings, Fixture } from '../core/types.js';
import { getRelativeDateStr } from '../core/seedData.js';

export const fixturesRouter = Router();

fixturesRouter.get('/', async (req, res) => {
  try {
    const leagueFilter = req.query.league as string | undefined;
    const dateFilter = req.query.dateFilter as string | undefined;
    const dateParam = req.query.date as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

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

    const todayStr = getRelativeDateStr(0);
    const tomorrowStr = getRelativeDateStr(1);
    const next3DaysStr = getRelativeDateStr(2);
    const thisWeekStr = getRelativeDateStr(6);

    // Filter out past fixtures
    fixtures = fixtures.filter((f) => f.matchDate >= todayStr);

    if (leagueFilter && leagueFilter !== 'ALL') {
      fixtures = fixtures.filter((f) => f.league.toUpperCase() === leagueFilter.toUpperCase());
    }

    // Apply date filtering if requested
    if (dateParam) {
      fixtures = fixtures.filter((f) => f.matchDate === dateParam);
    } else if (dateFilter === 'TODAY') {
      fixtures = fixtures.filter((f) => f.matchDate === todayStr);
    } else if (dateFilter === 'TOMORROW') {
      fixtures = fixtures.filter((f) => f.matchDate === tomorrowStr);
    } else if (dateFilter === 'NEXT_3_DAYS') {
      fixtures = fixtures.filter((f) => f.matchDate >= todayStr && f.matchDate <= next3DaysStr);
    } else if (dateFilter === 'THIS_WEEK') {
      fixtures = fixtures.filter((f) => f.matchDate >= todayStr && f.matchDate <= thisWeekStr);
    } else if (dateFilter === 'CUSTOM') {
      if (startDate) fixtures = fixtures.filter((f) => f.matchDate >= startDate);
      if (endDate) fixtures = fixtures.filter((f) => f.matchDate <= endDate);
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
