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

export type ActiveProviderType = 'FLASHSCORE' | 'ESPN' | 'FOOTBALL_DATA_CO_UK' | 'BIG_BALLS_DATA' | 'FOOTBALL_DATA_ORG' | 'API_FOOTBALL';

export interface DynamicStatisticItemSchema {
  category: string;
  homeValue?: string | number | null;
  awayValue?: string | number | null;
}

export interface ParsedStatisticItemSchema {
  category: string;
  group: 'ALL' | 'OVERVIEW' | 'ATTACKING' | 'PASSING' | 'DEFENDING';
  home_numeric: number;
  home_raw: string;
  away_numeric: number;
  away_raw: string;
  home_share_percent: number;
  away_share_percent: number;
  leader: 'HOME' | 'AWAY' | 'TIED';
}

export interface FlashscoreScrapedMatchSchema {
  match_id: string; // Primary Key e.g. 'dtULQoFG'
  stage?: string | null;
  status: string;
  match_date: string;
  country?: string | null;
  league_name?: string | null;
  home_name: string;
  home_image?: string | null;
  away_name: string;
  away_image?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  regulation_time?: string | null;
  penalties?: string | null;
  information_json?: string | null;
  statistics_json?: string | null;
  scraped_at: string;
}

export interface UpcomingFixtureSchema {
  id: string; // Primary Key
  provider_id: ActiveProviderType | string; // Active provider e.g. 'espn' | 'ESPN'
  league: string; // Division code
  league_name: string; // League label
  stage?: string | null; // Sub division or tournament stage
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
  date_source?: 'LIVE_FEED' | 'CACHED_DB' | 'INITIAL_FALLBACK';
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
  date_scope?: DateFilterScope | string;
  server_processed?: boolean;
  unstarted_only?: boolean;
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

export interface LeaguePriorityRankingSchema {
  tier_1_major_domestic: ('E0' | 'SP1' | 'D1' | 'I1' | 'F1')[]; // Premier League, La Liga, Bundesliga, Serie A, Ligue 1
  tier_2_uefa_tournaments: ('UCL' | 'UEL' | 'UECL')[]; // Champions League, Europa League, Conference League
  tier_3_secondary_and_cups: ('E1' | 'FAC' | 'CGB' | 'CDR' | 'DFB' | 'CIT' | 'CDF')[]; // Championship and major domestic cups
  tier_4_global_top_flights: ('N1' | 'P1' | 'BRA' | 'MLS' | 'SPL' | 'TUR1' | 'SC0' | 'BE1' | 'ARG1' | 'MEX1' | 'JPL')[]; // Eredivisie, Primeira Liga, Serie A Brazil, MLS, etc.
  prioritize_major_leagues_on_top: true;
  updated_at: string;
}

export interface FixtureDisplayScopeSchema {
  date_filter: DateFilterScope;
  filter_type: 'ALL' | 'POSITIVE_EV' | 'BANKER' | 'HIGH_XG';
  sort_order: 'LEAGUE_PRIORITY_AND_TIME' | 'CHRONOLOGICAL_TIME' | 'PROBABILITY_RANK';
  default_display: 'ALL_UPCOMING_FIXTURES';
  fallback_to_upcoming_when_empty: boolean;
  league_priority_sorting: boolean;
  major_popular_leagues_priority_top: boolean;
  prediction_pipeline: 'PREDICT_ALL_BEFORE_FILTERING';
  worldwide_leagues_coverage_count: number; // 50+ leagues, cups and international tournaments
}

export interface AppThemeConfigSchema {
  theme: 'light' | 'dark';
  style_mode: 'borderless_shadow';
  updated_at: string;
}

export type MatchListScopeType = 'UPCOMING' | 'LIVE' | 'HISTORY';

export interface MatchListScopeConfigSchema {
  active_scope: MatchListScopeType;
  available_scopes: MatchListScopeType[];
  inplay_bar_removed: boolean;
}

export interface NavigationBarLayoutSchema {
  tabs_placement: 'UNDER_LIVE_MATCHES_BAR';
  active_tabs: ('FIXTURES' | 'ACCAS' | 'TIPS')[];
  tab_labels: {
    FIXTURES: 'Predictions';
    ACCAS: 'Accumulator';
    TIPS: 'Trends';
  };
  tab_icons_enabled: false;
  prevent_mobile_wrap: true;
  prebuilt_accas_mode: 'STREAMLINED_DESIGN_SYSTEM';
  trends_insights_mode: 'STREAMLINED_DESIGN_SYSTEM';
  design_system_compliant: true;
  updated_at: string;
}

export interface DesignSystemComplianceSchema {
  palette: {
    surface_dark: '#0B0F17';
    surface_light: '#FFFFFF';
    background_dark: '#070A0F';
    background_light: '#F1F5F9';
    accent_emerald: 'emerald-600';
    border_dark: 'slate-800';
    border_light: 'slate-100';
    segmented_track_dark: 'slate-900/80';
    segmented_track_light: 'slate-100';
  };
  typography: {
    compact_headers: true;
    no_verbose_descriptions: true;
    no_slash_alternatives: true;
  };
  radii: {
    outer_card: 'rounded-3xl';
    inner_card: 'rounded-2xl';
    button_or_pill: 'rounded-xl';
    badge: 'rounded-lg';
  };
  updated_at: string;
}

export interface ServerlessDeploymentConfigSchema {
  api_prefix: string;
  is_serverless: boolean;
  process_type: 'persistent_node_process' | 'serverless';
  db_storage_mode: 'file' | 'in_memory' | 'temp_volume';
  db_file_path: './data/football.sqlite';
  auto_seed_on_boot: boolean;
  historical_records_count: number; // 3,600+ real Flashscore scraped matches
  upcoming_fixtures_count: number; // 3,500+ live Flashscore scraped fixtures
  data_provider: 'FLASHSCORE_SCRAPING';
  vercel_catchall_supported: boolean;
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

export interface PredictionMeasurementsSchema {
  fixture_id: string; // Primary Key
  h2h_json: string;
  calculated_at: string;
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
  createFlashscoreMatches: `
    CREATE TABLE IF NOT EXISTS flashscore_scraped_matches (
      match_id TEXT PRIMARY KEY,
      stage TEXT,
      status TEXT NOT NULL,
      match_date TEXT NOT NULL,
      country TEXT,
      league_name TEXT,
      home_name TEXT NOT NULL,
      home_image TEXT,
      away_name TEXT NOT NULL,
      away_image TEXT,
      home_score INTEGER,
      away_score INTEGER,
      regulation_time TEXT,
      penalties TEXT,
      information_json TEXT,
      statistics_json TEXT,
      scraped_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_flashscore_matches_date ON flashscore_scraped_matches(match_date);
    CREATE INDEX IF NOT EXISTS idx_flashscore_matches_home ON flashscore_scraped_matches(home_name);
    CREATE INDEX IF NOT EXISTS idx_flashscore_matches_away ON flashscore_scraped_matches(away_name);
  `,
  createPrebuiltAccumulatorsCache: `
    CREATE TABLE IF NOT EXISTS prebuilt_accumulators_cache (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      date_scope TEXT NOT NULL,
      combined_odds REAL NOT NULL,
      combined_prob REAL NOT NULL,
      risk_level TEXT NOT NULL,
      unstarted_only INTEGER DEFAULT 1,
      slip_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_prebuilt_cache_scope ON prebuilt_accumulators_cache(date_scope);
  `,
  createPredictionMeasurementsCache: `
    CREATE TABLE IF NOT EXISTS prediction_measurements_cache (
      fixture_id TEXT PRIMARY KEY,
      h2h_json TEXT NOT NULL,
      calculated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pred_measurements_fixture ON prediction_measurements_cache(fixture_id);
  `,
};
