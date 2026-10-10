import {
  HistoricalMatch,
  PoissonPrediction,
  CorrectScoreProb,
  TeamStatsSummary,
  TeamFormMatch,
  BookmakerOdds,
  MarketOption,
  EngineSettings,
  HeadToHeadMeasurement,
  HeadToHeadMatchRecord,
  PredictionEngineMeasurements,
} from './types.js';

export class PoissonEngine {
  /**
   * Factorial calculation with memoization
   */
  private static factorialCache: number[] = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880];
  private static factorial(n: number): number {
    if (n < 0) return 1;
    if (this.factorialCache[n] !== undefined) return this.factorialCache[n];
    let res = this.factorialCache[this.factorialCache.length - 1];
    for (let i = this.factorialCache.length; i <= n; i++) {
      res *= i;
      this.factorialCache[i] = res;
    }
    return res;
  }

  /**
   * Poisson Probability Mass Function: P(k; λ) = (λ^k * e^-λ) / k!
   */
  public static poissonProb(k: number, lambda: number): number {
    if (lambda <= 0) return k === 0 ? 1 : 0;
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k);
  }

  /**
   * Computes team attack and defense strengths, recent form score, and match history
   */
  public static computeTeamStats(
    teamName: string,
    allMatches: HistoricalMatch[],
    windowLimit = 15,
    formDecayRate = 0.85
  ): TeamStatsSummary {
    const teamMatches = allMatches.filter(
      (m) => m.homeTeam.toLowerCase() === teamName.toLowerCase() || m.awayTeam.toLowerCase() === teamName.toLowerCase()
    );

    const recentMatches = teamMatches.slice(0, windowLimit);

    let homeMatchesCount = 0;
    let awayMatchesCount = 0;
    let homeGoalsScored = 0;
    let homeGoalsConceded = 0;
    let awayGoalsScored = 0;
    let awayGoalsConceded = 0;

    const formList: ('W' | 'D' | 'L')[] = [];
    const formattedRecent: TeamFormMatch[] = [];

    for (const m of recentMatches) {
      const isHome = m.homeTeam.toLowerCase() === teamName.toLowerCase();
      const gf = isHome ? m.fthg : m.ftag;
      const ga = isHome ? m.ftag : m.fthg;

      let res: 'W' | 'D' | 'L' = 'D';
      if (gf > ga) res = 'W';
      else if (ga > gf) res = 'L';

      formList.push(res);
      formattedRecent.push({
        date: m.matchDate,
        opponent: isHome ? m.awayTeam : m.homeTeam,
        isHome,
        goalsFor: gf,
        goalsAgainst: ga,
        result: res,
      });

      if (isHome) {
        homeMatchesCount++;
        homeGoalsScored += gf;
        homeGoalsConceded += ga;
      } else {
        awayMatchesCount++;
        awayGoalsScored += gf;
        awayGoalsConceded += ga;
      }
    }

    // Benchmark League averages
    let leagueHomeAvg = 1.52;
    let leagueAwayAvg = 1.22;

    if (allMatches.length > 0) {
      const totalHG = allMatches.reduce((acc, m) => acc + m.fthg, 0);
      const totalAG = allMatches.reduce((acc, m) => acc + m.ftag, 0);
      leagueHomeAvg = totalHG / allMatches.length || 1.52;
      leagueAwayAvg = totalAG / allMatches.length || 1.22;
    }

    // Attack & Defense relative to league averages
    const homeAttack = homeMatchesCount > 0 ? (homeGoalsScored / homeMatchesCount) / leagueHomeAvg : 1.05;
    const homeDefense = homeMatchesCount > 0 ? (homeGoalsConceded / homeMatchesCount) / leagueAwayAvg : 0.95;
    const awayAttack = awayMatchesCount > 0 ? (awayGoalsScored / awayMatchesCount) / leagueAwayAvg : 0.95;
    const awayDefense = awayMatchesCount > 0 ? (awayGoalsConceded / awayMatchesCount) / leagueHomeAvg : 1.05;

    // Calculate weighted form factor for last 5 matches
    const last5 = formList.slice(0, 5);
    let weightedFormPoints = 0;
    let totalWeight = 0;

    for (let i = 0; i < last5.length; i++) {
      const weight = Math.pow(formDecayRate, i);
      const points = last5[i] === 'W' ? 3 : last5[i] === 'D' ? 1 : 0;
      weightedFormPoints += points * weight;
      totalWeight += 3 * weight;
    }

    const formRatio = totalWeight > 0 ? weightedFormPoints / totalWeight : 0.5;
    // Map form score to multiplier between 0.88 and 1.15
    const formScore = Number((0.88 + formRatio * 0.27).toFixed(3));

    const totalGoalsScored = homeGoalsScored + awayGoalsScored;
    const totalGoalsConceded = homeGoalsConceded + awayGoalsConceded;
    const matchesPlayed = recentMatches.length || 1;

    return {
      teamName,
      homeAttack: Number(Math.max(0.4, Math.min(2.5, homeAttack)).toFixed(3)),
      homeDefense: Number(Math.max(0.4, Math.min(2.5, homeDefense)).toFixed(3)),
      awayAttack: Number(Math.max(0.4, Math.min(2.5, awayAttack)).toFixed(3)),
      awayDefense: Number(Math.max(0.4, Math.min(2.5, awayDefense)).toFixed(3)),
      recentForm: formList.slice(0, 5),
      formScore,
      matchesPlayed,
      goalsScored: totalGoalsScored,
      goalsConceded: totalGoalsConceded,
      avgGoalsScored: Number((totalGoalsScored / matchesPlayed).toFixed(2)),
      avgGoalsConceded: Number((totalGoalsConceded / matchesPlayed).toFixed(2)),
      recentMatches: formattedRecent,
    };
  }

  /**
   * H2H Model: Analyzes head-to-head history for the previous 2 match years (730 days)
   */
  public static computeHeadToHead(
    homeTeam: string,
    awayTeam: string,
    allMatches: HistoricalMatch[]
  ): HeadToHeadMeasurement {
    const twoYearsAgoTime = Date.now() - (730 * 24 * 60 * 60 * 1000);

    const h2hMatches = allMatches.filter((m) => {
      const isTeamMatch =
        (m.homeTeam.toLowerCase() === homeTeam.toLowerCase() && m.awayTeam.toLowerCase() === awayTeam.toLowerCase()) ||
        (m.homeTeam.toLowerCase() === awayTeam.toLowerCase() && m.awayTeam.toLowerCase() === homeTeam.toLowerCase());
      if (!isTeamMatch) return false;
      if (!m.matchDate) return true;
      const mTime = new Date(m.matchDate).getTime();
      return isNaN(mTime) || mTime >= twoYearsAgoTime;
    });

    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;
    let homeGoalsTotal = 0;
    let awayGoalsTotal = 0;
    const recentH2H: HeadToHeadMatchRecord[] = [];

    for (const m of h2hMatches) {
      const isHomeTeamDirect = m.homeTeam.toLowerCase() === homeTeam.toLowerCase();
      const hGoals = isHomeTeamDirect ? m.fthg : m.ftag;
      const aGoals = isHomeTeamDirect ? m.ftag : m.fthg;
      homeGoalsTotal += hGoals;
      awayGoalsTotal += aGoals;

      if (hGoals > aGoals) homeWins++;
      else if (aGoals > hGoals) awayWins++;
      else draws++;

      if (recentH2H.length < 5) {
        recentH2H.push({
          date: m.matchDate,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          score: `${m.fthg}-${m.ftag}`,
          winner: m.fthg > m.ftag ? 'HOME' : m.ftag > m.fthg ? 'AWAY' : 'DRAW',
          competition: m.div,
        });
      }
    }

    const matchesCount = h2hMatches.length;
    const homeGoalsAvg = matchesCount > 0 ? Number((homeGoalsTotal / matchesCount).toFixed(2)) : 0;
    const awayGoalsAvg = matchesCount > 0 ? Number((awayGoalsTotal / matchesCount).toFixed(2)) : 0;

    let h2hMultiplierHome = 1.0;
    let h2hMultiplierAway = 1.0;

    if (matchesCount > 0) {
      const netWinDiff = homeWins - awayWins;
      const netGoalDiff = homeGoalsTotal - awayGoalsTotal;
      const swing = netWinDiff * 0.03 + (netGoalDiff / matchesCount) * 0.02;
      h2hMultiplierHome = Number(Math.max(0.90, Math.min(1.15, 1.0 + swing)).toFixed(3));
      h2hMultiplierAway = Number(Math.max(0.90, Math.min(1.15, 1.0 - swing)).toFixed(3));
    }

    return {
      matchesCount,
      homeWins,
      draws,
      awayWins,
      homeGoalsAvg,
      awayGoalsAvg,
      h2hMultiplierHome,
      h2hMultiplierAway,
      recentH2H,
    };
  }

  /**
   * Team Form Model: Analyzes recent form, goal difference, momentum over recent matches
   */
  public static computeTeamFormModel(
    homeTeam: string,
    awayTeam: string,
    allMatches: HistoricalMatch[]
  ): { homeWinProb: number; drawProb: number; awayWinProb: number; homeFormScore: number; awayFormScore: number } {
    const homeTeamMatches = allMatches.filter(
      (m) => m.homeTeam.toLowerCase() === homeTeam.toLowerCase() || m.awayTeam.toLowerCase() === homeTeam.toLowerCase()
    ).slice(0, 10);

    const awayTeamMatches = allMatches.filter(
      (m) => m.homeTeam.toLowerCase() === awayTeam.toLowerCase() || m.awayTeam.toLowerCase() === awayTeam.toLowerCase()
    ).slice(0, 10);

    let homeFormPoints = 0;
    let homeGoalDiff = 0;
    for (const m of homeTeamMatches) {
      const isHome = m.homeTeam.toLowerCase() === homeTeam.toLowerCase();
      const gf = isHome ? m.fthg : m.ftag;
      const ga = isHome ? m.ftag : m.fthg;
      homeGoalDiff += (gf - ga);
      if (gf > ga) homeFormPoints += 3;
      else if (gf === ga) homeFormPoints += 1;
    }

    let awayFormPoints = 0;
    let awayGoalDiff = 0;
    for (const m of awayTeamMatches) {
      const isHome = m.homeTeam.toLowerCase() === awayTeam.toLowerCase();
      const gf = isHome ? m.fthg : m.ftag;
      const ga = isHome ? m.ftag : m.fthg;
      awayGoalDiff += (gf - ga);
      if (gf > ga) awayFormPoints += 3;
      else if (gf === ga) awayFormPoints += 1;
    }

    const homeMaxPts = Math.max(1, homeTeamMatches.length * 3);
    const awayMaxPts = Math.max(1, awayTeamMatches.length * 3);
    const homeFormRatio = homeFormPoints / homeMaxPts;
    const awayFormRatio = awayFormPoints / awayMaxPts;

    const formDiff = (homeFormRatio - awayFormRatio) + (homeGoalDiff - awayGoalDiff) * 0.04;
    let formHomeWinProb = 0.38 + formDiff * 0.4;
    let formAwayWinProb = 0.38 - formDiff * 0.4;
    let formDrawProb = 0.24;

    formHomeWinProb = Math.max(0.1, Math.min(0.75, formHomeWinProb));
    formAwayWinProb = Math.max(0.1, Math.min(0.75, formAwayWinProb));
    formDrawProb = Math.max(0.15, Math.min(0.4, formDrawProb));

    const total = formHomeWinProb + formDrawProb + formAwayWinProb;
    return {
      homeWinProb: formHomeWinProb / total,
      drawProb: formDrawProb / total,
      awayWinProb: formAwayWinProb / total,
      homeFormScore: Number((0.9 + homeFormRatio * 0.3).toFixed(2)),
      awayFormScore: Number((0.9 + awayFormRatio * 0.3).toFixed(2)),
    };
  }

  /**
   * Generates a complete match probability prediction combining Poisson Model, H2H Model (previous 2 years), and Team Form Model
   */
  public static predictMatch(
    homeTeam: string,
    awayTeam: string,
    leagueHistoricalMatches: HistoricalMatch[],
    settings: EngineSettings,
    realScrapedH2H?: HeadToHeadMeasurement | null
  ): { prediction: PoissonPrediction; homeStats: TeamStatsSummary; awayStats: TeamStatsSummary } {
    const homeStats = this.computeTeamStats(
      homeTeam,
      leagueHistoricalMatches,
      settings.rollingMatchWindow,
      settings.formDecayRate
    );
    const awayStats = this.computeTeamStats(
      awayTeam,
      leagueHistoricalMatches,
      settings.rollingMatchWindow,
      settings.formDecayRate
    );

    // League average goals
    let leagueHomeAvg = 1.50;
    let leagueAwayAvg = 1.20;

    if (leagueHistoricalMatches.length > 0) {
      const totH = leagueHistoricalMatches.reduce((acc, m) => acc + m.fthg, 0);
      const totA = leagueHistoricalMatches.reduce((acc, m) => acc + m.ftag, 0);
      leagueHomeAvg = totH / leagueHistoricalMatches.length;
      leagueAwayAvg = totA / leagueHistoricalMatches.length;
    }

    // Use direct scraped H2H if provided, or compute strictly from H2H model (previous 2 match years)
    const h2h = (realScrapedH2H && realScrapedH2H.matchesCount > 0)
      ? realScrapedH2H
      : this.computeHeadToHead(homeTeam, awayTeam, leagueHistoricalMatches);

    const measurements: PredictionEngineMeasurements = {
      h2h,
    };

    // Expected Goals λ incorporating available measurements from scraped match records
    let homeXG =
      homeStats.homeAttack *
      awayStats.awayDefense *
      leagueHomeAvg *
      homeStats.formScore *
      (settings.homeAdvantageFactor || 1.03) *
      h2h.h2hMultiplierHome;

    let awayXG =
      awayStats.awayAttack *
      homeStats.homeDefense *
      leagueAwayAvg *
      awayStats.formScore *
      h2h.h2hMultiplierAway;

    // Bounds check to avoid unrealistic extremes
    homeXG = Math.max(0.25, Math.min(4.5, homeXG));
    awayXG = Math.max(0.25, Math.min(4.5, awayXG));

    // Calculate score probability matrix (up to 5 goals each)
    const MAX_GOALS = 5;
    const matrix: number[][] = [];
    let poissonHomeWin = 0;
    let poissonDraw = 0;
    let poissonAwayWin = 0;
    let over15Prob = 0;
    let over25Prob = 0;
    let over35Prob = 0;
    let bttsProb = 0;

    const scoresList: CorrectScoreProb[] = [];

    for (let h = 0; h <= MAX_GOALS; h++) {
      matrix[h] = [];
      const pH = this.poissonProb(h, homeXG);
      for (let a = 0; a <= MAX_GOALS; a++) {
        const pA = this.poissonProb(a, awayXG);
        const pScore = pH * pA;
        matrix[h][a] = Number(pScore.toFixed(4));

        scoresList.push({
          homeGoals: h,
          awayGoals: a,
          score: `${h}-${a}`,
          probability: Number(pScore.toFixed(4)),
        });

        if (h > a) poissonHomeWin += pScore;
        else if (h === a) poissonDraw += pScore;
        else poissonAwayWin += pScore;

        const totalGoals = h + a;
        if (totalGoals > 1.5) over15Prob += pScore;
        if (totalGoals > 2.5) over25Prob += pScore;
        if (totalGoals > 3.5) over35Prob += pScore;
        if (h > 0 && a > 0) bttsProb += pScore;
      }
    }

    // Sort top correct scores
    scoresList.sort((a, b) => b.probability - a.probability);
    const topCorrectScores = scoresList.slice(0, 5);

    // Normalize Poisson 1X2 probabilities
    const totalPoisson = poissonHomeWin + poissonDraw + poissonAwayWin;
    if (totalPoisson > 0) {
      poissonHomeWin /= totalPoisson;
      poissonDraw /= totalPoisson;
      poissonAwayWin /= totalPoisson;
    }

    // H2H Model probabilities (previous 2 match years)
    let h2hHomeWin = 0.37;
    let h2hDraw = 0.28;
    let h2hAwayWin = 0.35;
    if (h2h.matchesCount > 0) {
      h2hHomeWin = (h2h.homeWins + 0.5 * h2h.draws) / h2h.matchesCount;
      h2hAwayWin = (h2h.awayWins + 0.5 * h2h.draws) / h2h.matchesCount;
      h2hDraw = Math.max(0.20, 1.0 - h2hHomeWin - h2hAwayWin);
      const totH2H = h2hHomeWin + h2hDraw + h2hAwayWin;
      h2hHomeWin /= totH2H;
      h2hDraw /= totH2H;
      h2hAwayWin /= totH2H;
    }

    // Team Form Model probabilities
    const formModel = this.computeTeamFormModel(homeTeam, awayTeam, leagueHistoricalMatches);

    // Final Combined Result: Ensemble weighting (25% Poisson Model + 50% Team Form Model + 25% H2H Model for previous 2 match years)
    let homeWinProb = (0.25 * poissonHomeWin) + (0.50 * formModel.homeWinProb) + (0.25 * h2hHomeWin);
    let drawProb = (0.25 * poissonDraw) + (0.50 * formModel.drawProb) + (0.25 * h2hDraw);
    let awayWinProb = (0.25 * poissonAwayWin) + (0.50 * formModel.awayWinProb) + (0.25 * h2hAwayWin);

    const totalCombined = homeWinProb + drawProb + awayWinProb;
    if (totalCombined > 0) {
      homeWinProb = homeWinProb / totalCombined;
      drawProb = drawProb / totalCombined;
      awayWinProb = awayWinProb / totalCombined;
    }

    const prediction: PoissonPrediction = {
      homeXG: Number(homeXG.toFixed(2)),
      awayXG: Number(awayXG.toFixed(2)),
      homeWinProb: Number(homeWinProb.toFixed(3)),
      drawProb: Number(drawProb.toFixed(3)),
      awayWinProb: Number(awayWinProb.toFixed(3)),
      over15Prob: Number(over15Prob.toFixed(3)),
      over25Prob: Number(over25Prob.toFixed(3)),
      over35Prob: Number(over35Prob.toFixed(3)),
      bttsProb: Number(bttsProb.toFixed(3)),
      topCorrectScores,
      homeAttackStrength: homeStats.homeAttack,
      homeDefenseStrength: homeStats.homeDefense,
      awayAttackStrength: awayStats.awayAttack,
      awayDefenseStrength: awayStats.awayDefense,
      homeFormMultiplier: formModel.homeFormScore,
      awayFormMultiplier: formModel.awayFormScore,
      probabilityMatrix: matrix,
      measurements,
    };

    return { prediction, homeStats, awayStats };
  }

  /**
   * Generates market options with expected value (+EV) and Banker indicators
   */
  public static calculateMarkets(
    prediction: PoissonPrediction,
    odds: BookmakerOdds,
    settings: EngineSettings,
    homeTeam: string,
    awayTeam: string
  ): { markets: MarketOption[]; bestValueMarket?: MarketOption } {
    const markets: MarketOption[] = [];

    // Helper to add market
    const addMarket = (
      key: MarketOption['key'],
      name: string,
      odd: number | undefined,
      prob: number
    ) => {
      if (!odd || odd <= 1.0) return;
      const impliedProb = 1 / odd;
      const expectedValue = Number((prob * odd - 1.0).toFixed(3));
      const isPositiveEV = (prob * odd) >= settings.minEVThreshold;
      const isBanker = prob >= settings.safeWinThreshold;

      markets.push({
        key,
        name,
        odds: odd,
        probability: prob,
        impliedProb: Number(impliedProb.toFixed(3)),
        expectedValue,
        isPositiveEV,
        isBanker,
      });
    };

    addMarket('HOME_WIN', `${homeTeam} to Win`, odds.homeWin, prediction.homeWinProb);
    addMarket('DRAW', 'Draw', odds.draw, prediction.drawProb);
    addMarket('AWAY_WIN', `${awayTeam} to Win`, odds.awayWin, prediction.awayWinProb);
    addMarket('OVER_25', 'Over 2.5 Goals', odds.over25 || 1.85, prediction.over25Prob);
    addMarket('UNDER_25', 'Under 2.5 Goals', odds.under25 || 1.95, 1 - prediction.over25Prob);
    addMarket('BTTS_YES', 'Both Teams to Score (Yes)', odds.bttsYes || 1.80, prediction.bttsProb);
    addMarket('BTTS_NO', 'Both Teams to Score (No)', odds.bttsNo || 2.00, 1 - prediction.bttsProb);

    // Double Chance calculations
    const dc1XProb = prediction.homeWinProb + prediction.drawProb;
    const dc1XOdds = Number((1 / (1 / odds.homeWin + 1 / odds.draw)).toFixed(2));
    if (dc1XOdds > 1.05) {
      addMarket('DOUBLE_CHANCE_1X', `${homeTeam} or Draw (1X)`, dc1XOdds, dc1XProb);
    }

    const dcX2Prob = prediction.awayWinProb + prediction.drawProb;
    const dcX2Odds = Number((1 / (1 / odds.awayWin + 1 / odds.draw)).toFixed(2));
    if (dcX2Odds > 1.05) {
      addMarket('DOUBLE_CHANCE_X2', `Draw or ${awayTeam} (X2)`, dcX2Odds, dcX2Prob);
    }

    // Find the highest EV market
    const sortedByEV = [...markets].sort((a, b) => b.expectedValue - a.expectedValue);
    const bestValueMarket = sortedByEV.length > 0 ? sortedByEV[0] : undefined;

    return { markets, bestValueMarket };
  }
}
