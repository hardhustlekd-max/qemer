import { Router } from 'express';
import { db } from '../core/db.js';
import { providerManager } from '../providers/providerManager.js';
import { PoissonEngine } from '../core/poisson.js';
import { EngineSettings, Fixture } from '../core/types.js';
import { getRelativeDateStr } from '../core/seedData.js';
import { isMatchStarted } from '../core/accumulator.js';
import { getLeaguePriority } from '../core/leaguePriority.js';

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
      activeProvider: 'FLASHSCORE',
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

    // Deduplicate fixtures by ID and filter out past/started fixtures
    const seenIds = new Set<string>();
    fixtures = fixtures.filter((f) => {
      if (!f.id || seenIds.has(f.id) || isMatchStarted(f)) return false;
      seenIds.add(f.id);
      return true;
    });

    // Retrieve all historical matches once for optimal performance
    const allMatches = db.getAllHistoricalMatches(1500);

    // Look up scraped matches from SQLite cache
    const scrapedMatches = db.getFlashscoreScrapedMatches(500);
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

    // Process EVERY fixture through the Poisson engine first
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

      const sm = scrapedMap.get(f.id) ||
        scrapedMap.get(f.id.replace('fs_', '')) ||
        scrapedMap.get(`${f.homeTeam.toLowerCase()}__${f.awayTeam.toLowerCase()}`);

      const stage = sm?.stage || f.stage;
      const homeBadge = sm?.home?.image || f.homeBadge;
      const awayBadge = sm?.away?.image || f.awayBadge;
      const information = (sm?.information && sm.information.length > 0) ? sm.information : f.information;
      const statistics = (sm?.statistics && sm.statistics.length > 0) ? sm.statistics : f.statistics;
      const resultDetails = sm?.result ? {
        regulationTime: sm.result.regulationTime,
        penalties: sm.result.penalties,
      } : f.resultDetails;

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

    // Apply filters if specifically requested via query params
    let resultFixtures = enrichedFixtures;

    if (leagueFilter && leagueFilter !== 'ALL') {
      resultFixtures = resultFixtures.filter((f) => f.league.toUpperCase() === leagueFilter.toUpperCase());
    }

    if (dateParam) {
      resultFixtures = resultFixtures.filter((f) => f.matchDate === dateParam);
    } else if (dateFilter === 'TODAY') {
      resultFixtures = resultFixtures.filter((f) => f.matchDate === todayStr);
    } else if (dateFilter === 'TOMORROW') {
      resultFixtures = resultFixtures.filter((f) => f.matchDate === tomorrowStr);
    } else if (dateFilter === 'NEXT_3_DAYS') {
      resultFixtures = resultFixtures.filter((f) => f.matchDate >= todayStr && f.matchDate <= next3DaysStr);
    } else if (dateFilter === 'THIS_WEEK') {
      resultFixtures = resultFixtures.filter((f) => f.matchDate >= todayStr && f.matchDate <= thisWeekStr);
    } else if (dateFilter === 'CUSTOM') {
      if (startDate) resultFixtures = resultFixtures.filter((f) => f.matchDate >= startDate);
      if (endDate) resultFixtures = resultFixtures.filter((f) => f.matchDate <= endDate);
    }

    // Sort prioritizing major popular leagues on top of the list
    resultFixtures.sort((a, b) => {
      const priorityA = getLeaguePriority(a.league, a.leagueName, a.stage);
      const priorityB = getLeaguePriority(b.league, b.leagueName, b.stage);
      if (priorityA !== priorityB) return priorityA - priorityB;
      if (a.matchDate !== b.matchDate) return a.matchDate.localeCompare(b.matchDate);
      return (a.kickOffTime || '').localeCompare(b.kickOffTime || '');
    });

    res.json({
      success: true,
      provider: provider.name,
      count: resultFixtures.length,
      totalProcessed: enrichedFixtures.length,
      fixtures: resultFixtures,
    });
  } catch (err: any) {
    console.error('Error fetching fixtures:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch fixtures' });
  }
});

fixturesRouter.get('/history', async (req, res) => {
  try {
    const league = req.query.league as string | undefined;
    const limit = parseInt((req.query.limit as string) || '300', 10);
    const matches = league && league !== 'ALL'
      ? db.getLeagueHistoricalMatches(league, limit)
      : db.getAllHistoricalMatches(limit);

    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (err: any) {
    console.error('Error fetching historical matches:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch history' });
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
      activeProvider: 'FLASHSCORE',
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

    // Look up scraped matches from SQLite cache
    const scrapedMatches = db.getFlashscoreScrapedMatches(500);
    const sm = scrapedMatches.find(
      (item) =>
        item.matchId === f.id ||
        `fs_${item.matchId}` === f.id ||
        (item.home?.name?.toLowerCase() === f.homeTeam.toLowerCase() &&
          item.away?.name?.toLowerCase() === f.awayTeam.toLowerCase())
    );

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

    res.json({
      success: true,
      fixture: {
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
        h2hMatches,
        measurements: prediction.measurements,
      },
    });
  } catch (err: any) {
    console.error('Error fetching fixture detail:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch fixture detail' });
  }
});
