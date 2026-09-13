import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/core/db.js';
import { FootballDataCSVParser } from './src/core/csvParser.js';
import { PREMIER_LEAGUE_HISTORICAL_CSV, INITIAL_UPCOMING_FIXTURES } from './src/core/seedData.js';
import { fixturesRouter } from './src/routes/fixturesRouter.js';
import { accumulatorRouter } from './src/routes/accumulatorRouter.js';
import { settingsRouter } from './src/routes/settingsRouter.js';
import { providersRouter } from './src/routes/providersRouter.js';
import { statsRouter } from './src/routes/statsRouter.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize SQLite database and check seed
  await db.init();
  const summary = db.getStatsSummary();
  if (summary.totalMatches === 0) {
    console.log('Seeding initial Football-Data.co.uk dataset into SQLite database...');
    const parsed = FootballDataCSVParser.parseCSV(PREMIER_LEAGUE_HISTORICAL_CSV);
    db.insertHistoricalMatches(parsed);
    db.insertUpcomingFixtures(INITIAL_UPCOMING_FIXTURES);
    console.log(`Initial seed complete: ${parsed.length} matches inserted.`);
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      engine: 'Poisson Football Prediction & Accumulator Engine',
      timestamp: new Date().toISOString(),
      database: 'SQLite (sql.js WASM)',
    });
  });

  // Mount API routers
  app.use('/api/fixtures', fixturesRouter);
  app.use('/api/accumulator', accumulatorRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/providers', providersRouter);
  app.use('/api/stats', statsRouter);

  // Vite integration: development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚽ Football Prediction Engine server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
