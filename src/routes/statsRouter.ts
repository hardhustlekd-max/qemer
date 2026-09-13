import { Router } from 'express';
import { db } from '../core/db.js';
import { FootballDataCSVParser } from '../core/csvParser.js';
import { PREMIER_LEAGUE_HISTORICAL_CSV, INITIAL_UPCOMING_FIXTURES } from '../core/seedData.js';

export const statsRouter = Router();

statsRouter.get('/', (req, res) => {
  try {
    const stats = db.getStatsSummary();
    res.json({
      success: true,
      stats,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to get stats' });
  }
});

statsRouter.post('/seed', (req, res) => {
  try {
    const { customCsv, defaultSeason, reset } = req.body;

    if (reset) {
      db.clearHistoricalData();
    }

    const csvToParse = customCsv && customCsv.trim().length > 0 ? customCsv : PREMIER_LEAGUE_HISTORICAL_CSV;
    const parsedMatches = FootballDataCSVParser.parseCSV(csvToParse, defaultSeason || '2024/2025');
    const inserted = db.insertHistoricalMatches(parsedMatches);

    // Refresh upcoming fixtures
    db.insertUpcomingFixtures(INITIAL_UPCOMING_FIXTURES);

    const stats = db.getStatsSummary();

    res.json({
      success: true,
      message: `Database successfully seeded with ${inserted} matches from structured Football-Data dataset.`,
      stats,
    });
  } catch (err: any) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to seed database' });
  }
});

statsRouter.post('/clear', (req, res) => {
  try {
    db.clearHistoricalData();
    res.json({
      success: true,
      message: 'Historical matches table cleared.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to clear database' });
  }
});
