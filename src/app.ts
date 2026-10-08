import express, { Express } from 'express';
import { db } from './core/db.js';
import { fixturesRouter } from './routes/fixturesRouter.js';
import { accumulatorRouter } from './routes/accumulatorRouter.js';
import { settingsRouter } from './routes/settingsRouter.js';
import { providersRouter } from './routes/providersRouter.js';
import { statsRouter } from './routes/statsRouter.js';
import { tipsRouter } from './routes/tipsRouter.js';

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Middleware to ensure DB is initialized on incoming requests
  app.use(async (_req, _res, next) => {
    try {
      await db.init();
      next();
    } catch (err) {
      next(err);
    }
  });

  // Health check endpoint
  const healthHandler = (_req: express.Request, res: express.Response) => {
    res.json({
      status: 'ok',
      engine: 'Poisson Football Prediction & Accumulator Engine',
      timestamp: new Date().toISOString(),
      database: 'SQLite (sql.js WASM)',
    });
  };

  app.get('/api/health', healthHandler);
  app.get('/health', healthHandler);

  // Mount API routers under /api/...
  app.use('/api/fixtures', fixturesRouter);
  app.use('/api/accumulator', accumulatorRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/providers', providersRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/tips', tipsRouter);

  // Also mount without /api prefix in case serverless gateway strips /api
  app.use('/fixtures', fixturesRouter);
  app.use('/accumulator', accumulatorRouter);
  app.use('/settings', settingsRouter);
  app.use('/providers', providersRouter);
  app.use('/stats', statsRouter);
  app.use('/tips', tipsRouter);

  return app;
}

export const app = createApp();
