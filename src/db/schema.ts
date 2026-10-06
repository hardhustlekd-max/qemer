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
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
}

export interface AppSettingsSchema {
  key: string; // Primary Key e.g. 'engine_settings'
  value: string; // JSON string of EngineSettings
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
  `,
  createAppSettings: `
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `,
};
