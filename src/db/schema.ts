/**
 * Database Schema Definition for SQLite / SQL Database
 * Keeps application data models and relational structures in system alignment
 */

export interface HistoricalMatchSchema {
  id: string; // Primary Key
  div: string; // League code e.g. E0, SP1, D1, I1
  season: string; // e.g. '2024/2025'
  match_date: string; // YYYY-MM-DD
  home_team: string;
  away_team: string;
  fthg: number; // Full-time home goals
  ftag: number; // Full-time away goals
  ftr: 'H' | 'D' | 'A'; // Full-time result
  hthg?: number | null; // Half-time home goals
  htag?: number | null; // Half-time away goals
  htr?: 'H' | 'D' | 'A' | null; // Half-time result
  hs?: number | null; // Home shots
  as_shots?: number | null; // Away shots
  hst?: number | null; // Home shots on target
  ast?: number | null; // Away shots on target
  b365_h?: number | null; // Bet365 Home Win odds
  b365_d?: number | null; // Bet365 Draw odds
  b365_a?: number | null; // Bet365 Away Win odds
  b365_over25?: number | null; // Bet365 Over 2.5 goals odds
  b365_under25?: number | null; // Bet365 Under 2.5 goals odds
  rest_days_home: number; // Rest days before match (default 7)
  rest_days_away: number; // Rest days before match (default 7)
}

export interface UpcomingFixtureSchema {
  id: string; // Primary Key
  provider_id: string; // Active provider e.g. 'FOOTBALL_DATA_CO_UK'
  league: string; // Division code
  league_name: string; // League label
  match_date: string; // YYYY-MM-DD
  kick_off_time: string; // HH:MM
  home_team: string;
  away_team: string;
  b365_h: number;
  b365_d: number;
  b365_a: number;
  b365_over25?: number | null;
  b365_under25?: number | null;
  b365_btts_yes?: number | null;
  b365_btts_no?: number | null;
  home_win_prob?: number | null; // Calculated Poisson home win probability (0-1)
  draw_prob?: number | null; // Calculated Poisson draw probability (0-1)
  away_win_prob?: number | null; // Calculated Poisson away win probability (0-1)
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
}

export interface AppSettingsSchema {
  key: string; // Primary Key e.g. 'engine_settings'
  value: string; // JSON string of EngineSettings
}

export type QuickSlipStrategy = 'TODAY_SLIP' | 'SAFE_PICKS' | 'TOP_VALUE' | 'CUSTOM_SLIP';
export type DateFilterScope = 'TODAY' | 'TOMORROW' | 'NEXT_3_DAYS' | 'THIS_WEEK' | 'ALL' | 'CUSTOM';
export type MarketChoiceFilter = 'BEST_VALUE' | 'OVER_UNDER' | '1X2' | 'BTTS';
export type PrebuiltCategory = 'BANKER' | 'VALUE_HUNTER' | 'HIGH_GOALS' | 'MEGA_COMBO';

export interface PrebuiltAccumulatorSchema {
  id: string;
  category: PrebuiltCategory;
  name: string;
  combined_odds: number;
  combined_prob: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  legs_json: string;
  summary_text: string;
  created_at: string;
}

export interface TablePaginationSchema {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SimplifiedTableLayoutSchema {
  time_col_width: string;
  match_col_width: string;
  prediction_col_width: string;
  odds_col_width: string;
  is_simplified: boolean;
}

export interface AppThemeConfigSchema {
  theme: 'light' | 'dark';
  style_mode: 'borderless_shadow';
  updated_at: string;
}

export interface ServerlessDeploymentConfigSchema {
  api_prefix: string;
  is_serverless: boolean;
  db_storage_mode: 'file' | 'in_memory' | 'temp_volume';
  auto_seed_on_boot: boolean;
  historical_records_count: number;
  upcoming_fixtures_count: number;
  updated_at: string;
}

export interface LiveScoresCacheSchema {
  fixture_id: string; // Primary Key
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  minute: number;
  status: string; // 'FIRST_HALF' | 'HALF_TIME' | 'SECOND_HALF' | 'EXTRA_TIME' | 'FINISHED'
  events_json?: string | null;
  updated_at: string; // ISO timestamp
}

export interface FootballTipsCacheSchema {
  id: string; // Primary Key e.g. 'latest_tips'
  tips_json: string;
  headline_summary: string;
  raw_markdown: string;
  sources_json: string;
  updated_at: string; // ISO timestamp
}

export const DDL_STATEMENTS = {
  createHistoricalMatches: `
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
  `,
  createUpcomingFixtures: `
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
  `,
  createAppSettings: `
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `,
  createLiveScoresCache: `
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
  `,
  createFootballTipsCache: `
    CREATE TABLE IF NOT EXISTS football_tips_cache (
      id TEXT PRIMARY KEY,
      tips_json TEXT NOT NULL,
      headline_summary TEXT NOT NULL,
      raw_markdown TEXT NOT NULL,
      sources_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
};
