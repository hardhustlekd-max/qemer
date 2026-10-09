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
  LeagueStandingMeasurement,
  SeasonPerformanceMeasurement,
  LastYearPerformanceMeasurement,
  EloRatingMeasurement,
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
   * Head-to-Head (H2H) Measurement
   */
  public static computeHeadToHead(
    homeTeam: string,
    awayTeam: string,
    allMatches: HistoricalMatch[]
  ): HeadToHeadMeasurement {
    const h2hMatches = allMatches.filter(
      (m) =>
        (m.homeTeam.toLowerCase() === homeTeam.toLowerCase() && m.awayTeam.toLowerCase() === awayTeam.toLowerCase()) ||
        (m.homeTeam.toLowerCase() === awayTeam.toLowerCase() && m.awayTeam.toLowerCase() === homeTeam.toLowerCase())
    );

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

      let winner: 'HOME' | 'AWAY' | 'DRAW' = 'DRAW';
      if (hGoals > aGoals) {
        homeWins++;
        winner = 'HOME';
      } else if (aGoals > hGoals) {
        awayWins++;
        winner = 'AWAY';
      } else {
        draws++;
      }

      if (recentH2H.length < 5) {
        recentH2H.push({
          date: m.matchDate,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          score: `${m.fthg}-${m.ftag}`,
          winner: m.fthg > m.ftag ? 'HOME' : m.ftag > m.fthg ? 'AWAY' : 'DRAW',
        });
      }
    }

    const matchesCount = h2hMatches.length;
    const homeGoalsAvg = matchesCount > 0 ? Number((homeGoalsTotal / matchesCount).toFixed(2)) : 1.5;
    const awayGoalsAvg = matchesCount > 0 ? Number((awayGoalsTotal / matchesCount).toFixed(2)) : 1.2;

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
   * League Standing Measurement
   */
  public static computeLeagueStanding(
    homeTeam: string,
    awayTeam: string,
    leagueMatches: HistoricalMatch[]
  ): LeagueStandingMeasurement {
    const tableMap = new Map<string, { points: number; goalDiff: number; played: number }>();

    for (const m of leagueMatches) {
      const ht = m.homeTeam;
      const at = m.awayTeam;
      if (!tableMap.has(ht)) tableMap.set(ht, { points: 0, goalDiff: 0, played: 0 });
      if (!tableMap.has(at)) tableMap.set(at, { points: 0, goalDiff: 0, played: 0 });

      const hRec = tableMap.get(ht)!;
      const aRec = tableMap.get(at)!;

      hRec.played++;
      aRec.played++;
      hRec.goalDiff += m.fthg - m.ftag;
      aRec.goalDiff += m.ftag - m.fthg;

      if (m.ftr === 'H') {
        hRec.points += 3;
      } else if (m.ftr === 'A') {
        aRec.points += 3;
      } else {
        hRec.points += 1;
        aRec.points += 1;
      }
    }

    const sortedTable = Array.from(tableMap.entries()).sort(
      (a, b) => b[1].points - a[1].points || b[1].goalDiff - a[1].goalDiff
    );

    const totalTeams = Math.max(10, sortedTable.length);
    let homeRank = sortedTable.findIndex((entry) => entry[0].toLowerCase() === homeTeam.toLowerCase()) + 1;
    let awayRank = sortedTable.findIndex((entry) => entry[0].toLowerCase() === awayTeam.toLowerCase()) + 1;

    if (homeRank <= 0) homeRank = Math.min(6, Math.floor(totalTeams / 2));
    if (awayRank <= 0) awayRank = Math.min(10, Math.floor(totalTeams / 2) + 2);

    const homeStats = tableMap.get(homeTeam) || {
      points: Math.max(12, Math.round(totalTeams * 2.2 - homeRank * 2)),
      goalDiff: 8 - homeRank,
    };
    const awayStats = tableMap.get(awayTeam) || {
      points: Math.max(10, Math.round(totalTeams * 2.2 - awayRank * 2)),
      goalDiff: 8 - awayRank,
    };

    const rankDiff = awayRank - homeRank;
    const standingAdvantageFactor = Number(
      Math.max(0.85, Math.min(1.18, 1.0 + (rankDiff / totalTeams) * 0.16)).toFixed(3)
    );

    return {
      homeRank,
      awayRank,
      totalTeams,
      homePoints: homeStats.points,
      awayPoints: awayStats.points,
      homeGoalDiff: homeStats.goalDiff,
      awayGoalDiff: awayStats.goalDiff,
      standingAdvantageFactor,
    };
  }

  /**
   * Performance of this year (Current Season Performance)
   */
  public static computeSeasonPerformance(
    teamName: string,
    allMatches: HistoricalMatch[]
  ): SeasonPerformanceMeasurement {
    const teamMatches = allMatches
      .filter(
        (m) =>
          m.homeTeam.toLowerCase() === teamName.toLowerCase() ||
          m.awayTeam.toLowerCase() === teamName.toLowerCase()
      )
      .slice(0, 18);

    const matchesPlayed = Math.max(1, teamMatches.length);
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsScored = 0;
    let goalsConceded = 0;
    let cleanSheets = 0;

    for (const m of teamMatches) {
      const isHome = m.homeTeam.toLowerCase() === teamName.toLowerCase();
      const gf = isHome ? m.fthg : m.ftag;
      const ga = isHome ? m.ftag : m.fthg;
      goalsScored += gf;
      goalsConceded += ga;
      if (ga === 0) cleanSheets++;

      if (gf > ga) wins++;
      else if (ga > gf) losses++;
      else draws++;
    }

    const winRate = Number((wins / matchesPlayed).toFixed(3));
    const drawRate = Number((draws / matchesPlayed).toFixed(3));
    const lossRate = Number((losses / matchesPlayed).toFixed(3));
    const pointsPerGame = Number(((wins * 3 + draws) / matchesPlayed).toFixed(2));
    const goalsPerGame = Number((goalsScored / matchesPlayed).toFixed(2));
    const concededPerGame = Number((goalsConceded / matchesPlayed).toFixed(2));
    const cleanSheetRate = Number((cleanSheets / matchesPlayed).toFixed(2));

    const performanceScore = Number(
      Math.max(0.85, Math.min(1.18, 0.88 + (pointsPerGame / 3.0) * 0.26)).toFixed(3)
    );

    return {
      matchesPlayed,
      winRate,
      drawRate,
      lossRate,
      pointsPerGame,
      goalsPerGame,
      concededPerGame,
      cleanSheetRate,
      performanceScore,
    };
  }

  /**
   * Performance of last year (Previous Season Performance)
   */
  public static computeLastYearPerformance(
    teamName: string,
    allMatches: HistoricalMatch[]
  ): LastYearPerformanceMeasurement {
    const priorMatches = allMatches
      .filter(
        (m) =>
          m.homeTeam.toLowerCase() === teamName.toLowerCase() ||
          m.awayTeam.toLowerCase() === teamName.toLowerCase()
      )
      .slice(10, 30);

    const count = Math.max(1, priorMatches.length);
    let wins = 0;
    let goals = 0;

    for (const m of priorMatches) {
      const isHome = m.homeTeam.toLowerCase() === teamName.toLowerCase();
      const gf = isHome ? m.fthg : m.ftag;
      const ga = isHome ? m.ftag : m.fthg;
      goals += gf;
      if (gf > ga) wins++;
    }

    const lastYearWinRate = Number((wins / count).toFixed(3));
    const lastYearGoalsPerGame = Number((goals / count).toFixed(2));
    const lastYearRank = Math.max(1, Math.min(20, Math.round(18 - lastYearWinRate * 16)));
    const lastYearPoints = Math.round(wins * 2.8 + count * 0.7);

    const teamRecentMatches = allMatches
      .filter(
        (m) =>
          m.homeTeam.toLowerCase() === teamName.toLowerCase() ||
          m.awayTeam.toLowerCase() === teamName.toLowerCase()
      )
      .slice(0, 10);
    const recentWins = teamRecentMatches.filter((m) => {
      const isHome = m.homeTeam.toLowerCase() === teamName.toLowerCase();
      return isHome ? m.fthg > m.ftag : m.ftag > m.fthg;
    }).length;
    const currentWinRate = teamRecentMatches.length > 0 ? recentWins / teamRecentMatches.length : lastYearWinRate;

    const yearOverYearProgression = Number((currentWinRate - lastYearWinRate).toFixed(3));
    const historicalBaselineFactor = Number(
      Math.max(0.90, Math.min(1.15, 0.94 + lastYearWinRate * 0.18 + yearOverYearProgression * 0.08)).toFixed(3)
    );

    return {
      lastYearRank,
      lastYearPoints,
      lastYearWinRate,
      lastYearGoalsPerGame,
      yearOverYearProgression,
      historicalBaselineFactor,
    };
  }

  /**
   * Elo Rating Measurement
   */
  public static computeEloRating(
    teamName: string,
    allMatches: HistoricalMatch[]
  ): EloRatingMeasurement {
    const teamMatches = allMatches.filter(
      (m) =>
        m.homeTeam.toLowerCase() === teamName.toLowerCase() ||
        m.awayTeam.toLowerCase() === teamName.toLowerCase()
    );

    let rating = 1500;
    const K = 20;

    for (const m of teamMatches) {
      const isHome = m.homeTeam.toLowerCase() === teamName.toLowerCase();
      const opponentName = isHome ? m.awayTeam : m.homeTeam;
      const result = isHome ? m.ftr : (m.ftr === 'H' ? 'A' : m.ftr === 'A' ? 'H' : 'D');
      
      const score = result === 'H' ? 1 : result === 'D' ? 0.5 : 0;
      const expected = 0.5; // Simplified expectation

      rating += K * (score - expected);
    }

    return {
      rating: Math.round(rating),
      lastUpdated: new Date().toISOString().split('T')[0],
      volatility: 10,
      recentChange: 0,
    };
  }

  /**
   * Generates a complete Poisson match probability prediction & expected goals
   * integrating all engine measurements: H2H, League Standing, This Year, Last Year, Lineup & Elo Rating
   */
  public static predictMatch(
    homeTeam: string,
    awayTeam: string,
    leagueHistoricalMatches: HistoricalMatch[],
    settings: EngineSettings
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

    // 1. Head-to-Head (H2H) Measurement
    const h2h = this.computeHeadToHead(homeTeam, awayTeam, leagueHistoricalMatches);

    // 2. League Standing Measurement
    const leagueStanding = this.computeLeagueStanding(homeTeam, awayTeam, leagueHistoricalMatches);

    // 3. Performance of this year (Current Season Performance)
    const thisYearHome = this.computeSeasonPerformance(homeTeam, leagueHistoricalMatches);
    const thisYearAway = this.computeSeasonPerformance(awayTeam, leagueHistoricalMatches);

    // 4. Performance of last year (Previous Season Performance)
    const lastYearHome = this.computeLastYearPerformance(homeTeam, leagueHistoricalMatches);
    const lastYearAway = this.computeLastYearPerformance(awayTeam, leagueHistoricalMatches);

    // 5. Elo Rating Measurement
    const eloHome = this.computeEloRating(homeTeam, leagueHistoricalMatches);
    const eloAway = this.computeEloRating(awayTeam, leagueHistoricalMatches);

    const measurements: PredictionEngineMeasurements = {
      h2h,
      leagueStanding,
      thisYearPerformance: { home: thisYearHome, away: thisYearAway },
      lastYearPerformance: { home: lastYearHome, away: lastYearAway },
      eloRating: { home: eloHome, away: eloAway },
      combinedWeights: {
        h2hWeight: 0.20,
        standingWeight: 0.20,
        thisYearWeight: 0.25,
        lastYearWeight: 0.15,
        eloRatingWeight: 0.20,
      },
    };

    // Calculate integrated factors for Expected Goals (xG)
    const standingFactorHome = leagueStanding.standingAdvantageFactor;
    const standingFactorAway = Number((2.0 - standingFactorHome).toFixed(3));
    const eloFactorHome = Number(Math.max(0.9, Math.min(1.1, 1 + (eloHome.rating - eloAway.rating) / 2000)).toFixed(3));
    const eloFactorAway = Number(Math.max(0.9, Math.min(1.1, 1 - (eloHome.rating - eloAway.rating) / 2000)).toFixed(3));

    // Expected Goals λ incorporating available measurements
    let homeXG =
      homeStats.homeAttack *
      awayStats.awayDefense *
      leagueHomeAvg *
      homeStats.formScore *
      (settings.homeAdvantageFactor || 1.12) *
      h2h.h2hMultiplierHome *
      standingFactorHome *
      thisYearHome.performanceScore *
      lastYearHome.historicalBaselineFactor *
      eloFactorHome;

    let awayXG =
      awayStats.awayAttack *
      homeStats.homeDefense *
      leagueAwayAvg *
      awayStats.formScore *
      h2h.h2hMultiplierAway *
      standingFactorAway *
      thisYearAway.performanceScore *
      lastYearAway.historicalBaselineFactor *
      eloFactorAway;

    // Bounds check to avoid unrealistic extremes
    homeXG = Math.max(0.25, Math.min(4.5, homeXG));
    awayXG = Math.max(0.25, Math.min(4.5, awayXG));

    // Calculate score probability matrix (up to 5 goals each)
    const MAX_GOALS = 5;
    const matrix: number[][] = [];
    let homeWinProb = 0;
    let drawProb = 0;
    let awayWinProb = 0;
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

        if (h > a) homeWinProb += pScore;
        else if (h === a) drawProb += pScore;
        else awayWinProb += pScore;

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

    // Normalize probabilities so sum of 1X2 = 1.0
    const total1X2 = homeWinProb + drawProb + awayWinProb;
    if (total1X2 > 0) {
      homeWinProb = homeWinProb / total1X2;
      drawProb = drawProb / total1X2;
      awayWinProb = awayWinProb / total1X2;
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
      homeFormMultiplier: homeStats.formScore,
      awayFormMultiplier: awayStats.formScore,
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
