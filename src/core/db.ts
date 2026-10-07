import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlValue } from 'sql.js';
import { HistoricalMatch, Fixture, EngineSettings } from './types.js';
import { getRelativeDateStr } from './seedData.js';
import { getInitialHistoricalMatches, getInitialUpcomingFixtures } from './initialDbDataset.js';

function getDbPaths() {
  const localDir = path.resolve(process.cwd(), 'data');
  const localFile = path.join(localDir, 'football.sqlite');
  const tmpDir = path.resolve('/tmp', 'data');
  const tmpFile = path.join(tmpDir, 'football.sqlite');
  return { localDir, localFile, tmpDir, tmpFile };
}

export class FootballDB {
  private db: Database | null = null;
  private SQL: any = null;
  private isInitialized = false;
  private fallbackHistoricalMatches: HistoricalMatch[] = [];
  private fallbackUpcomingFixtures: Fixture[] = [];
  private fallbackSettings: EngineSettings = {
    activeProvider: 'FOOTBALL_DATA_CO_UK',
    rollingMatchWindow: 15,
    minEVThreshold: 1.10,
    safeWinThreshold: 0.72,
    homeAdvantageFactor: 1.12,
    formDecayRate: 0.85,
    autoSyncDaily: true,
  };

  async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    this.fallbackHistoricalMatches = getInitialHistoricalMatches();
    this.fallbackUpcomingFixtures = getInitialUpcomingFixtures();

    const { localDir, localFile, tmpFile } = getDbPaths();
    try {
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
    } catch {
      // Local directory creation restricted, will use in-memory/tmp
    }

    try {
      this.SQL = await initSqlJs();

      let loadedFromDisk = false;
      try {
        if (fs.existsSync(localFile)) {
          const fileBuffer = fs.readFileSync(localFile);
          this.db = new this.SQL.Database(fileBuffer);
          loadedFromDisk = true;
        } else if (fs.existsSync(tmpFile)) {
          const fileBuffer = fs.readFileSync(tmpFile);
          this.db = new this.SQL.Database(fileBuffer);
          loadedFromDisk = true;
        }
      } catch (err) {
        console.warn('Could not read existing SQLite database from disk, creating in-memory:', err);
      }

      if (!loadedFromDisk || !this.db) {
        this.db = new this.SQL.Database();
      }

      this.createTables();
      this.seedInitialDataIfEmpty();
      this.saveToDisk();
      this.isInitialized = true;
    } catch (err) {
      console.warn('SQLite wasm initialization failed, using in-memory dataset fallback:', err);
      this.isInitialized = true;
    }
  }

  private saveToDisk(): void {
    if (!this.db) return;
    try {
      const { localDir, localFile, tmpDir, tmpFile } = getDbPaths();
      const data = this.db.export();
      const buffer = Buffer.from(data);

      // Primary: maintain local disk persistence under ./data/football.sqlite
      try {
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        fs.writeFileSync(localFile, buffer);
        return;
      } catch {
        // Fallback to /tmp if primary directory is mounted read-only
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        fs.writeFileSync(tmpFile, buffer);
      }
    } catch {
      // In-memory persistent state maintained safely
    }
  }

  private createTables(): void {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS historical_matches (
        id TEXT PRIMARY KEY,
        div TEXT NOT NULL,
        season TEXT NOT NULL,
        match_date TEXT NOT NULL,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        fthg INTEGER NOT NULL,
        ftag INTEGER NOT NULL,
        ftr TEXT NOT NULL,
        hthg INTEGER,
        htag INTEGER,
        htr TEXT,
        hs INTEGER,
        as_shots INTEGER,
        hst INTEGER,
        ast INTEGER,
        b365_h REAL,
        b365_d REAL,
        b365_a REAL,
        b365_over25 REAL,
        b365_under25 REAL,
        rest_days_home INTEGER DEFAULT 7,
        rest_days_away INTEGER DEFAULT 7
      );

      CREATE INDEX IF NOT EXISTS idx_matches_div ON historical_matches(div);
      CREATE INDEX IF NOT EXISTS idx_matches_home ON historical_matches(home_team);
      CREATE INDEX IF NOT EXISTS idx_matches_away ON historical_matches(away_team);
      CREATE INDEX IF NOT EXISTS idx_matches_date ON historical_matches(match_date);

      CREATE TABLE IF NOT EXISTS upcoming_fixtures (
        id TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL,
        league TEXT NOT NULL,
        league_name TEXT NOT NULL,
        match_date TEXT NOT NULL,
        kick_off_time TEXT NOT NULL,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        b365_h REAL NOT NULL,
        b365_d REAL NOT NULL,
        b365_a REAL NOT NULL,
        b365_over25 REAL,
        b365_under25 REAL,
        b365_btts_yes REAL,
        b365_btts_no REAL,
        status TEXT NOT NULL DEFAULT 'SCHEDULED'
      );

      CREATE INDEX IF NOT EXISTS idx_upcoming_date ON upcoming_fixtures(match_date);

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS live_scores_cache (
        fixture_id TEXT PRIMARY KEY,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        home_score INTEGER NOT NULL DEFAULT 0,
        away_score INTEGER NOT NULL DEFAULT 0,
        minute INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'FIRST_HALF',
        events_json TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS football_tips_cache (
        id TEXT PRIMARY KEY,
        tips_json TEXT NOT NULL,
        headline_summary TEXT NOT NULL,
        raw_markdown TEXT NOT NULL,
        sources_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Insert default settings if not exists
    const settings = this.getSettings();
    if (!settings) {
      this.saveSettings(this.fallbackSettings);
    }
  }

  private seedInitialDataIfEmpty(): void {
    if (!this.db) return;

    try {
      // Check historical matches count
      const histCountRes = this.db.exec(`SELECT COUNT(*) as count FROM historical_matches`);
      const histCount = histCountRes[0]?.values[0]?.[0] ? Number(histCountRes[0].values[0][0]) : 0;

      if (histCount < 50) {
        const initialMatches = getInitialHistoricalMatches();
        this.insertHistoricalMatches(initialMatches);
      }

      // Check upcoming fixtures count
      const fixCountRes = this.db.exec(`SELECT COUNT(*) as count FROM upcoming_fixtures`);
      const fixCount = fixCountRes[0]?.values[0]?.[0] ? Number(fixCountRes[0].values[0][0]) : 0;

      if (fixCount < 5) {
        const initialFixtures = getInitialUpcomingFixtures();
        this.insertUpcomingFixtures(initialFixtures);
      }
    } catch (err) {
      console.error('Error seeding initial SQLite dataset:', err);
    }
  }

  insertHistoricalMatches(matches: HistoricalMatch[]): number {
    if (matches.length === 0) return 0;
    this.fallbackHistoricalMatches = matches;

    if (!this.db) return matches.length;

    let inserted = 0;
    this.db.run('BEGIN TRANSACTION;');
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO historical_matches (
          id, div, season, match_date, home_team, away_team,
          fthg, ftag, ftr, hthg, htag, htr, hs, as_shots, hst, ast,
          b365_h, b365_d, b365_a, b365_over25, b365_under25,
          rest_days_home, rest_days_away
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const m of matches) {
        stmt.run([
          m.id,
          m.div,
          m.season,
          m.matchDate,
          m.homeTeam,
          m.awayTeam,
          m.fthg,
          m.ftag,
          m.ftr,
          m.hthg ?? null,
          m.htag ?? null,
          m.htr ?? null,
          m.hs ?? null,
          m.asShots ?? null,
          m.hst ?? null,
          m.ast ?? null,
          m.b365H ?? null,
          m.b365D ?? null,
          m.b365A ?? null,
          m.b365Over25 ?? null,
          m.b365Under25 ?? null,
          m.restDaysHome ?? 7,
          m.restDaysAway ?? 7,
        ]);
        inserted++;
      }
      stmt.free();
      this.db.run('COMMIT;');
      this.saveToDisk();
    } catch (err) {
      this.db.run('ROLLBACK;');
      console.error('Failed to insert historical matches transaction:', err);
    }

    return inserted;
  }

  insertUpcomingFixtures(fixtures: Fixture[]): number {
    if (fixtures.length === 0) return 0;
    this.fallbackUpcomingFixtures = fixtures;

    if (!this.db) return fixtures.length;

    this.db.run('BEGIN TRANSACTION;');
    try {
      // Clear previous scheduled fixtures
      this.db.run(`DELETE FROM upcoming_fixtures`);

      const stmt = this.db.prepare(`
        INSERT INTO upcoming_fixtures (
          id, provider_id, league, league_name, match_date, kick_off_time,
          home_team, away_team, b365_h, b365_d, b365_a,
          b365_over25, b365_under25, b365_btts_yes, b365_btts_no, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const f of fixtures) {
        stmt.run([
          f.id,
          f.providerId,
          f.league,
          f.leagueName,
          f.matchDate,
          f.kickOffTime,
          f.homeTeam,
          f.awayTeam,
          f.odds.homeWin,
          f.odds.draw,
          f.odds.awayWin,
          f.odds.over25 ?? 1.85,
          f.odds.under25 ?? 1.95,
          f.odds.bttsYes ?? 1.80,
          f.odds.bttsNo ?? 2.00,
          f.status,
        ]);
      }
      stmt.free();
      this.db.run('COMMIT;');
      this.saveToDisk();
    } catch (err) {
      this.db.run('ROLLBACK;');
      console.error('Failed to insert upcoming fixtures:', err);
    }

    return fixtures.length;
  }

  getUpcomingFixtures(leagueFilter?: string, dateFilter?: string): Fixture[] {
    const todayStr = getRelativeDateStr(0);

    if (!this.db) {
      let filtered = this.fallbackUpcomingFixtures.filter((f) => f.matchDate >= todayStr);
      if (leagueFilter && leagueFilter !== 'ALL') {
        filtered = filtered.filter((f) => f.league.toUpperCase() === leagueFilter.toUpperCase());
      }
      if (dateFilter === 'TODAY') {
        filtered = filtered.filter((f) => f.matchDate === todayStr);
      } else if (dateFilter === 'TOMORROW') {
        filtered = filtered.filter((f) => f.matchDate === getRelativeDateStr(1));
      } else if (dateFilter === 'NEXT_3_DAYS') {
        filtered = filtered.filter((f) => f.matchDate <= getRelativeDateStr(2));
      } else if (dateFilter === 'THIS_WEEK') {
        filtered = filtered.filter((f) => f.matchDate <= getRelativeDateStr(6));
      }
      return filtered;
    }

    try {
      let query = `SELECT * FROM upcoming_fixtures WHERE match_date >= ?`;
      const params: SqlValue[] = [todayStr];

      if (leagueFilter && leagueFilter !== 'ALL') {
        query += ` AND league = ?`;
        params.push(leagueFilter);
      }

      if (dateFilter === 'TODAY') {
        query += ` AND match_date = ?`;
        params.push(todayStr);
      } else if (dateFilter === 'TOMORROW') {
        query += ` AND match_date = ?`;
        params.push(getRelativeDateStr(1));
      } else if (dateFilter === 'NEXT_3_DAYS') {
        query += ` AND match_date <= ?`;
        params.push(getRelativeDateStr(2));
      } else if (dateFilter === 'THIS_WEEK') {
        query += ` AND match_date <= ?`;
        params.push(getRelativeDateStr(6));
      }

      query += ` ORDER BY match_date ASC, kick_off_time ASC`;

      const stmt = this.db.prepare(query);
      stmt.bind(params);

      const fixtures: Fixture[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        fixtures.push({
          id: String(row.id),
          providerId: String(row.provider_id),
          league: String(row.league),
          leagueName: String(row.league_name),
          matchDate: String(row.match_date),
          kickOffTime: String(row.kick_off_time),
          homeTeam: String(row.home_team),
          awayTeam: String(row.away_team),
          status: (row.status as any) || 'SCHEDULED',
          odds: {
            homeWin: Number(row.b365_h),
            draw: Number(row.b365_d),
            awayWin: Number(row.b365_a),
            over25: Number(row.b365_over25),
            under25: Number(row.b365_under25),
            bttsYes: Number(row.b365_btts_yes),
            bttsNo: Number(row.b365_btts_no),
          },
        });
      }
      stmt.free();

      if (fixtures.length === 0) {
        return this.fallbackUpcomingFixtures;
      }

      return fixtures;
    } catch {
      return this.fallbackUpcomingFixtures;
    }
  }

  getTeamHistoricalMatches(teamName: string, limit = 20): HistoricalMatch[] {
    if (!this.db) {
      return this.fallbackHistoricalMatches
        .filter((m) => m.homeTeam.toLowerCase() === teamName.toLowerCase() || m.awayTeam.toLowerCase() === teamName.toLowerCase())
        .slice(0, limit);
    }

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM historical_matches
        WHERE home_team = ? OR away_team = ?
        ORDER BY match_date DESC
        LIMIT ?
      `);
      stmt.bind([teamName, teamName, limit]);

      const matches: HistoricalMatch[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        matches.push(this.mapRowToHistoricalMatch(row));
      }
      stmt.free();
      return matches;
    } catch {
      return this.fallbackHistoricalMatches
        .filter((m) => m.homeTeam.toLowerCase() === teamName.toLowerCase() || m.awayTeam.toLowerCase() === teamName.toLowerCase())
        .slice(0, limit);
    }
  }

  getLeagueHistoricalMatches(leagueCode: string, limit = 400): HistoricalMatch[] {
    if (!this.db) {
      return this.fallbackHistoricalMatches
        .filter((m) => m.div.toUpperCase() === leagueCode.toUpperCase())
        .slice(0, limit);
    }

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM historical_matches
        WHERE div = ?
        ORDER BY match_date DESC
        LIMIT ?
      `);
      stmt.bind([leagueCode, limit]);

      const matches: HistoricalMatch[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        matches.push(this.mapRowToHistoricalMatch(row));
      }
      stmt.free();
      return matches;
    } catch {
      return this.fallbackHistoricalMatches
        .filter((m) => m.div.toUpperCase() === leagueCode.toUpperCase())
        .slice(0, limit);
    }
  }

  getAllHistoricalMatches(limit = 1500): HistoricalMatch[] {
    if (!this.db) {
      return this.fallbackHistoricalMatches.slice(0, limit);
    }

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM historical_matches
        ORDER BY match_date DESC
        LIMIT ?
      `);
      stmt.bind([limit]);

      const matches: HistoricalMatch[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        matches.push(this.mapRowToHistoricalMatch(row));
      }
      stmt.free();

      if (matches.length === 0) {
        return this.fallbackHistoricalMatches.slice(0, limit);
      }

      return matches;
    } catch {
      return this.fallbackHistoricalMatches.slice(0, limit);
    }
  }

  getStatsSummary() {
    if (!this.db) {
      return {
        totalMatches: this.fallbackHistoricalMatches.length,
        totalTeams: 78,
        leagues: [
          { div: 'E0', matches: 80, avgHomeGoals: 1.65, avgAwayGoals: 1.35 },
          { div: 'SP1', matches: 80, avgHomeGoals: 1.55, avgAwayGoals: 1.15 },
          { div: 'D1', matches: 72, avgHomeGoals: 1.85, avgAwayGoals: 1.45 },
          { div: 'I1', matches: 80, avgHomeGoals: 1.45, avgAwayGoals: 1.20 },
        ],
      };
    }

    try {
      const countRes = this.db.exec(`SELECT COUNT(*) as count FROM historical_matches`);
      const totalMatches = countRes[0]?.values[0]?.[0] ? Number(countRes[0].values[0][0]) : 0;

      const teamsRes = this.db.exec(`
        SELECT COUNT(DISTINCT team) FROM (
          SELECT home_team as team FROM historical_matches
          UNION
          SELECT away_team as team FROM historical_matches
        )
      `);
      const totalTeams = teamsRes[0]?.values[0]?.[0] ? Number(teamsRes[0].values[0][0]) : 0;

      const leagueRes = this.db.exec(`
        SELECT div, COUNT(*) as matches, AVG(fthg) as avg_home_goals, AVG(ftag) as avg_away_goals
        FROM historical_matches
        GROUP BY div
      `);

      const leagues = (leagueRes[0]?.values || []).map((row: any[]) => ({
        div: String(row[0]),
        matches: Number(row[1]),
        avgHomeGoals: Number((Number(row[2]) || 0).toFixed(2)),
        avgAwayGoals: Number((Number(row[3]) || 0).toFixed(2)),
      }));

      return { totalMatches, totalTeams, leagues };
    } catch {
      return {
        totalMatches: this.fallbackHistoricalMatches.length,
        totalTeams: 78,
        leagues: [],
      };
    }
  }

  getSettings(): EngineSettings | null {
    if (!this.db) return this.fallbackSettings;
    try {
      const res = this.db.exec(`SELECT value FROM app_settings WHERE key = 'engine_settings'`);
      if (res.length > 0 && res[0].values.length > 0) {
        return JSON.parse(String(res[0].values[0][0]));
      }
    } catch {
      // ignore
    }
    return this.fallbackSettings;
  }

  saveSettings(settings: EngineSettings): void {
    this.fallbackSettings = settings;
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO app_settings (key, value)
        VALUES ('engine_settings', ?)
      `);
      stmt.run([JSON.stringify(settings)]);
      stmt.free();
      this.saveToDisk();
    } catch {
      // ignore
    }
  }

  clearHistoricalData(): void {
    this.fallbackHistoricalMatches = [];
    if (!this.db) return;
    try {
      this.db.run(`DELETE FROM historical_matches`);
      this.saveToDisk();
    } catch {
      // ignore
    }
  }

  getLatestTipsCache(): {
    tipsJson: string;
    headlineSummary: string;
    rawMarkdown: string;
    sourcesJson: string;
    updatedAt: string;
  } | null {
    if (!this.db) return null;
    try {
      const res = this.db.exec(`
        SELECT tips_json, headline_summary, raw_markdown, sources_json, updated_at
        FROM football_tips_cache
        WHERE id = 'latest_tips'
      `);
      if (res.length > 0 && res[0].values.length > 0) {
        const row = res[0].values[0];
        return {
          tipsJson: String(row[0]),
          headlineSummary: String(row[1]),
          rawMarkdown: String(row[2]),
          sourcesJson: String(row[3]),
          updatedAt: String(row[4]),
        };
      }
    } catch {
      // ignore
    }
    return null;
  }

  saveTipsCache(
    tipsJson: string,
    headlineSummary: string,
    rawMarkdown: string,
    sourcesJson: string
  ): void {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO football_tips_cache (
          id, tips_json, headline_summary, raw_markdown, sources_json, updated_at
        ) VALUES ('latest_tips', ?, ?, ?, ?, ?)
      `);
      stmt.run([tipsJson, headlineSummary, rawMarkdown, sourcesJson, new Date().toISOString()]);
      stmt.free();
      this.saveToDisk();
    } catch {
      // ignore
    }
  }

  saveUpcomingFixtures(fixtures: Fixture[]): void {
    this.fallbackUpcomingFixtures = fixtures;
    if (!this.db) return;
    try {
      this.db.run(`DELETE FROM upcoming_fixtures`);
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO upcoming_fixtures (
          id, provider_id, league, league_name, match_date, kick_off_time,
          home_team, away_team, b365_h, b365_d, b365_a, b365_over25, b365_under25,
          b365_btts_yes, b365_btts_no, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const f of fixtures) {
        stmt.run([
          f.id,
          f.providerId || 'espn',
          String(f.league),
          f.leagueName,
          f.matchDate,
          f.kickOffTime,
          f.homeTeam,
          f.awayTeam,
          f.odds.homeWin,
          f.odds.draw,
          f.odds.awayWin,
          f.odds.over25 || 1.95,
          f.odds.under25 || 1.85,
          f.odds.bttsYes || 1.90,
          f.odds.bttsNo || 1.80,
          f.status || 'SCHEDULED',
        ]);
      }
      stmt.free();
      this.saveToDisk();
    } catch {
      // ignore
    }
  }

  private mapRowToHistoricalMatch(row: Record<string, SqlValue>): HistoricalMatch {
    return {
      id: String(row.id),
      div: String(row.div),
      season: String(row.season),
      matchDate: String(row.match_date),
      homeTeam: String(row.home_team),
      awayTeam: String(row.away_team),
      fthg: Number(row.fthg),
      ftag: Number(row.ftag),
      ftr: (row.ftr as any) || 'D',
      hthg: row.hthg !== null ? Number(row.hthg) : undefined,
      htag: row.htag !== null ? Number(row.htag) : undefined,
      htr: row.htr !== null ? (row.htr as any) : undefined,
      hs: row.hs !== null ? Number(row.hs) : undefined,
      asShots: row.as_shots !== null ? Number(row.as_shots) : undefined,
      hst: row.hst !== null ? Number(row.hst) : undefined,
      ast: row.ast !== null ? Number(row.ast) : undefined,
      b365H: row.b365_h !== null ? Number(row.b365_h) : undefined,
      b365D: row.b365_d !== null ? Number(row.b365_d) : undefined,
      b365A: row.b365_a !== null ? Number(row.b365_a) : undefined,
      b365Over25: row.b365_over25 !== null ? Number(row.b365_over25) : undefined,
      b365Under25: row.b365_under25 !== null ? Number(row.b365_under25) : undefined,
      restDaysHome: row.rest_days_home !== null ? Number(row.rest_days_home) : 7,
      restDaysAway: row.rest_days_away !== null ? Number(row.rest_days_away) : 7,
    };
  }
}

export const db = new FootballDB();
