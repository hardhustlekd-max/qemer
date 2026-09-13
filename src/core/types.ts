export type LeagueCode = 'E0' | 'SP1' | 'D1' | 'I1' | 'F1' | 'UCL';

export interface HistoricalMatch {
  id: string;
  div: LeagueCode | string;
  season: string;
  matchDate: string;
  homeTeam: string;
  awayTeam: string;
  fthg: number; // Full Time Home Goals
  ftag: number; // Full Time Away Goals
  ftr: 'H' | 'D' | 'A'; // Full Time Result
  hthg?: number; // Half Time Home Goals
  htag?: number; // Half Time Away Goals
  htr?: 'H' | 'D' | 'A';
  hs?: number; // Home Shots
  asShots?: number; // Away Shots
  hst?: number; // Home Shots on Target
  ast?: number; // Away Shots on Target
  b365H?: number; // Bet365 Home Odds
  b365D?: number; // Bet365 Draw Odds
  b365A?: number; // Bet365 Away Odds
  b365Over25?: number;
  b365Under25?: number;
  restDaysHome?: number;
  restDaysAway?: number;
}

export interface BookmakerOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
  over25?: number;
  under25?: number;
  bttsYes?: number;
  bttsNo?: number;
}

export interface MarketOption {
  key: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN' | 'OVER_25' | 'UNDER_25' | 'BTTS_YES' | 'BTTS_NO' | 'DOUBLE_CHANCE_1X' | 'DOUBLE_CHANCE_X2';
  name: string;
  odds: number;
  probability: number;
  impliedProb: number;
  expectedValue: number; // (prob * odds) - 1
  isPositiveEV: boolean;
  isBanker: boolean;
}

export interface CorrectScoreProb {
  homeGoals: number;
  awayGoals: number;
  score: string;
  probability: number;
}

export interface TeamFormMatch {
  date: string;
  opponent: string;
  isHome: boolean;
  goalsFor: number;
  goalsAgainst: number;
  result: 'W' | 'D' | 'L';
}

export interface TeamStatsSummary {
  teamName: string;
  homeAttack: number;
  homeDefense: number;
  awayAttack: number;
  awayDefense: number;
  recentForm: ('W' | 'D' | 'L')[];
  formScore: number; // 0.8 to 1.2 multiplier
  matchesPlayed: number;
  goalsScored: number;
  goalsConceded: number;
  avgGoalsScored: number;
  avgGoalsConceded: number;
  recentMatches: TeamFormMatch[];
}

export interface PoissonPrediction {
  homeXG: number;
  awayXG: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  over15Prob: number;
  over25Prob: number;
  over35Prob: number;
  bttsProb: number;
  topCorrectScores: CorrectScoreProb[];
  homeAttackStrength: number;
  homeDefenseStrength: number;
  awayAttackStrength: number;
  awayDefenseStrength: number;
  homeFormMultiplier: number;
  awayFormMultiplier: number;
  probabilityMatrix: number[][]; // 5x5 score matrix
}

export interface Fixture {
  id: string;
  providerId: string;
  league: LeagueCode | string;
  leagueName: string;
  matchDate: string;
  kickOffTime: string;
  homeTeam: string;
  awayTeam: string;
  homeBadge?: string;
  awayBadge?: string;
  status: 'SCHEDULED' | 'TIMED' | 'LIVE' | 'FINISHED';
  odds: BookmakerOdds;
  prediction?: PoissonPrediction;
  markets?: MarketOption[];
  bestValueMarket?: MarketOption;
  homeStats?: TeamStatsSummary;
  awayStats?: TeamStatsSummary;
}

export interface AccaLeg {
  fixtureId: string;
  fixtureDate: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  marketKey: MarketOption['key'];
  marketName: string;
  selection: string;
  odds: number;
  probability: number;
  expectedValue: number;
  reasoning: string;
  isBanker: boolean;
  isPositiveEV: boolean;
}

export interface AccumulatorSlip {
  id: string;
  name: string;
  strategy: 'BANKER' | 'VALUE_HUNTER' | 'CUSTOM';
  legs: AccaLeg[];
  combinedOdds: number;
  combinedProb: number;
  overallEV: number;
  suggestedStake: number;
  stake: number;
  potentialPayout: number;
  potentialProfit: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  createdAt: string;
  summaryText: string;
}

export interface EngineSettings {
  activeProvider: 'FOOTBALL_DATA_CO_UK' | 'BIG_BALLS_DATA' | 'FOOTBALL_DATA_ORG' | 'API_FOOTBALL';
  rollingMatchWindow: number; // e.g. 10, 15, 20
  minEVThreshold: number; // e.g. 1.10 (10% EV)
  safeWinThreshold: number; // e.g. 0.70 (70%)
  homeAdvantageFactor: number; // default 1.15
  formDecayRate: number; // 0.85
  autoSyncDaily: boolean;
}

export interface ProviderStatus {
  id: string;
  name: string;
  type: 'CSV' | 'REST' | 'HYBRID';
  status: 'ONLINE' | 'STANDBY' | 'DEGRADED';
  latencyMs: number;
  description: string;
  features: string[];
}
