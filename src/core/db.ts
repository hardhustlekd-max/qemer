import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlValue } from 'sql.js';
import { HistoricalMatch, Fixture, EngineSettings } from './types.js';
import { getRelativeDateStr } from './seedData.js';

function getDbPaths() {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
  const dir = isServerless ? path.resolve('/tmp', 'data') : path.resolve(process.cwd(), 'data');
  const file = path.join(dir, 'football.sqlite');
  return { dir, file };
}

export class FootballDB {
  private db: Database | null = null;
  private SQL: any = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    const { dir: dbDir, file: dbFile } = getDbPaths();
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    } catch {
      // Running in-memory if directory creation restricted
    }

    this.SQL = await initSqlJs();

    let loadedFromDisk = false;
    try {
      if (fs.existsSync(dbFile)) {
        const fileBuffer = fs.readFileSync(dbFile);
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
    // Clear any stale upcoming fixtures to force fresh live fetch
    this.db.run(`DELETE FROM upcoming_fixtures WHERE id LIKE 'wireframe_%' OR id LIKE 'e0_%' OR id LIKE 'sp1_%' OR id LIKE 'd1_%' OR id LIKE 'i1_%'`);
    this.saveToDisk();
    this.isInitialized = true;
  }

  private saveToDisk(): void {
    if (!this.db) return;
    try {
      const { dir: dbDir, file: dbFile } = getDbPaths();
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbFile, buffer);
    } catch (err) {
      // In serverless / read-only environment, keep running in-memory gracefully
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

      -- Purge any legacy mock fixtures from SQLite
      DELETE FROM upcoming_fixtures WHERE id LIKE 'wireframe_%' OR id LIKE 'e0_%' OR id LIKE 'sp1_%' OR id LIKE 'd1_%' OR id LIKE 'i1_%';
    `);

    // Insert default settings if not exists
    const settings = this.getSettings();
    if (!settings) {
      const defaultSettings: EngineSettings = {
        activeProvider: 'FOOTBALL_DATA_CO_UK',
        rollingMatchWindow: 15,
        minEVThreshold: 1.10,
        safeWinThreshold: 0.72,
        homeAdvantageFactor: 1.12,
        formDecayRate: 0.85,
        autoSyncDaily: true,
      };
      this.saveSettings(defaultSettings);
    }

    this.saveToDisk();
  }

  insertHistoricalMatches(matches: HistoricalMatch[]): number {
    if (!this.db || matches.length === 0) return 0;

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
      throw err;
    }

    return inserted;
  }

  insertUpcomingFixtures(fixtures: Fixture[]): number {
    if (!this.db || fixtures.length === 0) return 0;

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
      throw err;
    }

    return fixtures.length;
  }

  getUpcomingFixtures(leagueFilter?: string, dateFilter?: string): Fixture[] {
    if (!this.db) return [];

    const todayStr = getRelativeDateStr(0);

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
    return fixtures;
  }

  getTeamHistoricalMatches(teamName: string, limit = 20): HistoricalMatch[] {
    if (!this.db) return [];

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
  }

  getLeagueHistoricalMatches(leagueCode: string, limit = 400): HistoricalMatch[] {
    if (!this.db) return [];

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
  }

  getAllHistoricalMatches(limit = 1000): HistoricalMatch[] {
    if (!this.db) return [];

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
    return matches;
  }

  getStatsSummary() {
    if (!this.db) return { totalMatches: 0, totalTeams: 0, leagues: [] };

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
    } catch (e) {
      return { totalMatches: 0, totalTeams: 0, leagues: [] };
    }
  }

  getSettings(): EngineSettings | null {
    if (!this.db) return null;
    try {
      const res = this.db.exec(`SELECT value FROM app_settings WHERE key = 'engine_settings'`);
      if (res.length > 0 && res[0].values.length > 0) {
        return JSON.parse(String(res[0].values[0][0]));
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  saveSettings(settings: EngineSettings): void {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO app_settings (key, value)
      VALUES ('engine_settings', ?)
    `);
    stmt.run([JSON.stringify(settings)]);
    stmt.free();
    this.saveToDisk();
  }

  clearHistoricalData(): void {
    if (!this.db) return;
    this.db.run(`DELETE FROM historical_matches`);
    this.saveToDisk();
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
      const stmt = this.db.prepare(`
        SELECT tips_json, headline_summary, raw_markdown, sources_json, updated_at
        FROM football_tips_cache
        WHERE id = 'latest_tips'
      `);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        const result = {
          tipsJson: String(row.tips_json),
          headlineSummary: String(row.headline_summary),
          rawMarkdown: String(row.raw_markdown),
          sourcesJson: String(row.sources_json),
          updatedAt: String(row.updated_at),
        };
        stmt.free();
        return result;
      }
      stmt.free();
    } catch (e) {
      console.error('Error fetching tips cache from DB:', e);
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
      stmt.run([
        tipsJson,
        headlineSummary,
        rawMarkdown,
        sourcesJson,
        new Date().toISOString(),
      ]);
      stmt.free();
      this.saveToDisk();
    } catch (e) {
      console.error('Error saving tips cache to DB:', e);
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
      ftr: String(row.ftr) as 'H' | 'D' | 'A',
      hthg: row.hthg !== null ? Number(row.hthg) : undefined,
      htag: row.htag !== null ? Number(row.htag) : undefined,
      htr: row.htr ? (String(row.htr) as 'H' | 'D' | 'A') : undefined,
      hs: row.hs !== null ? Number(row.hs) : undefined,
      asShots: row.as_shots !== null ? Number(row.as_shots) : undefined,
      hst: row.hst !== null ? Number(row.hst) : undefined,
      ast: row.ast !== null ? Number(row.ast) : undefined,
      b365H: row.b365_h !== null ? Number(row.b365_h) : undefined,
      b365D: row.b365_d !== null ? Number(row.b365_d) : undefined,
      b365A: row.b365_a !== null ? Number(row.b365_a) : undefined,
      b365Over25: row.b365_over25 !== null ? Number(row.b365_over25) : undefined,
      b365Under25: row.b365_under25 !== null ? Number(row.b365_under25) : undefined,
      restDaysHome: Number(row.rest_days_home || 7),
      restDaysAway: Number(row.rest_days_away || 7),
    };
  }
}

export const db = new FootballDB();
