import { Router } from 'express';
import { providerManager } from '../providers/providerManager.js';
import { db } from '../core/db.js';
import { EngineSettings } from '../core/types.js';
import { flashscoreScraperService } from '../services/flashscoreScraperService.js';
import { PredictionPipelineService } from '../services/predictionPipelineService.js';

export const providersRouter = Router();

providersRouter.get('/', (req, res) => {
  try {
    const list = providerManager.getAllProvidersStatus();
    const activeProvider = providerManager.getActiveProvider();

    res.json({
      success: true,
      activeProviderId: activeProvider.id,
      providers: list,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to list providers' });
  }
});

providersRouter.post('/switch', async (req, res) => {
  try {
    const { providerId } = req.body;
    if (!providerId) {
      return res.status(400).json({ success: false, error: 'providerId is required' });
    }

    const switched = providerManager.setActiveProvider(providerId as EngineSettings['activeProvider']);
    if (!switched) {
      return res.status(400).json({ success: false, error: 'Invalid provider ID' });
    }

    const activeProvider = providerManager.getActiveProvider();
    // Optional sync
    const syncRes = await activeProvider.syncHistoricalData();

    res.json({
      success: true,
      activeProvider: activeProvider.name,
      message: `Active provider hot-swapped to ${activeProvider.name}`,
      syncDetails: syncRes,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to switch provider' });
  }
});

providersRouter.get('/live-scores', async (req, res) => {
  try {
    const activeProvider = providerManager.getActiveProvider();
    const scores = await activeProvider.getLiveScores();
    res.json({
      success: true,
      provider: activeProvider.name,
      scores,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to get live scores' });
  }
});

// Flashscore Scraper specific endpoints
providersRouter.get('/flashscore/scrape', async (req, res) => {
  try {
    const date = req.query.date as string | undefined;
    const fixtures = await flashscoreScraperService.getUpcomingFixtures(date);
    res.json({
      success: true,
      count: fixtures.length,
      fixtures,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to scrape Flashscore' });
  }
});

providersRouter.post('/flashscore/sync', async (req, res) => {
  try {
    const syncRes = await flashscoreScraperService.syncHistoricalData(7);
    const upcoming = await flashscoreScraperService.getUpcomingFixtures();
    const predRes = await PredictionPipelineService.predictAndStoreUpcomingFixtures(upcoming);

    res.json({
      success: true,
      message: `Predictions updated in database (${predRes.count} fixtures)`,
      matchesCount: syncRes.matchesCount,
      upcomingCount: upcoming.length,
      predictionsCount: predRes.count,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to sync Flashscore data' });
  }
});

providersRouter.get('/flashscore/matches', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const matches = db.getFlashscoreScrapedMatches(limit);
    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to retrieve Flashscore matches' });
  }
});

providersRouter.get('/flashscore/export', (req, res) => {
  try {
    const format = (req.query.format as 'json' | 'json-array' | 'csv') || 'json';
    const matches = db.getFlashscoreScrapedMatches(500);
    const exported = flashscoreScraperService.exportData(matches, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="flashscore_scraped.csv"');
      return res.send(exported);
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(exported);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to export Flashscore data' });
  }
});
