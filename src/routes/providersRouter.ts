import { Router } from 'express';
import { providerManager } from '../providers/providerManager.js';
import { db } from '../core/db.js';
import { EngineSettings } from '../core/types.js';

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
