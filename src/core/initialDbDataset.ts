import { HistoricalMatch, Fixture } from './types.js';
import { getRelativeDateStr } from './seedData.js';

/**
 * Historical baseline league match dataset for Poisson mathematical modeling
 * Used exclusively for team attack/defense ratings and goal distribution modeling
 */
export function getInitialHistoricalMatches(): HistoricalMatch[] {
  const matches: HistoricalMatch[] = [];

  // Premier League (E0) Historical Match Results
  const e0Teams = [
    { name: 'Arsenal', att: 2.2, def: 0.8 },
    { name: 'Man City', att: 2.5, def: 0.9 },
    { name: 'Liverpool', att: 2.3, def: 0.9 },
    { name: 'Aston Villa', att: 1.8, def: 1.3 },
    { name: 'Tottenham', att: 1.9, def: 1.5 },
    { name: 'Chelsea', att: 1.8, def: 1.4 },
    { name: 'Newcastle', att: 1.7, def: 1.3 },
    { name: 'Man United', att: 1.5, def: 1.4 },
    { name: 'Brighton', att: 1.6, def: 1.5 },
    { name: 'West Ham', att: 1.4, def: 1.6 },
    { name: 'Fulham', att: 1.3, def: 1.4 },
    { name: 'Bournemouth', att: 1.4, def: 1.6 },
    { name: 'Crystal Palace', att: 1.2, def: 1.3 },
    { name: 'Brentford', att: 1.5, def: 1.6 },
    { name: 'Everton', att: 1.1, def: 1.4 },
    { name: 'Nottingham Forest', att: 1.2, def: 1.3 },
    { name: 'Wolves', att: 1.2, def: 1.8 },
    { name: 'Leicester', att: 1.1, def: 1.9 },
    { name: 'Ipswich', att: 1.0, def: 2.0 },
    { name: 'Southampton', att: 0.9, def: 2.1 },
    { name: 'Leeds United', att: 1.4, def: 1.5 },
    { name: 'Sunderland', att: 1.2, def: 1.4 },
  ];

  // La Liga (SP1)
  const sp1Teams = [
    { name: 'Real Madrid', att: 2.3, def: 0.8 },
    { name: 'Barcelona', att: 2.6, def: 0.9 },
    { name: 'Atletico Madrid', att: 1.8, def: 0.7 },
    { name: 'Athletic Bilbao', att: 1.6, def: 1.0 },
    { name: 'Villarreal', att: 1.8, def: 1.5 },
    { name: 'Real Sociedad', att: 1.2, def: 1.0 },
    { name: 'Real Betis', att: 1.3, def: 1.2 },
    { name: 'Osasuna', att: 1.3, def: 1.4 },
    { name: 'Mallorca', att: 1.0, def: 1.1 },
    { name: 'Girona', att: 1.4, def: 1.5 },
    { name: 'Celta Vigo', att: 1.5, def: 1.6 },
    { name: 'Sevilla', att: 1.2, def: 1.4 },
    { name: 'Rayo Vallecano', att: 1.1, def: 1.2 },
    { name: 'Alaves', att: 1.1, def: 1.5 },
    { name: 'Getafe', att: 0.8, def: 1.0 },
    { name: 'Las Palmas', att: 1.1, def: 1.6 },
    { name: 'Leganes', att: 0.9, def: 1.3 },
    { name: 'Espanyol', att: 1.0, def: 1.7 },
    { name: 'Valencia', att: 0.9, def: 1.5 },
    { name: 'Valladolid', att: 0.8, def: 2.0 },
    { name: 'Málaga', att: 1.1, def: 1.4 },
  ];

  // Bundesliga (D1)
  const d1Teams = [
    { name: 'Bayern Munich', att: 2.8, def: 0.9 },
    { name: 'Bayer Leverkusen', att: 2.4, def: 1.2 },
    { name: 'Eintracht Frankfurt', att: 2.2, def: 1.5 },
    { name: 'RB Leipzig', att: 1.8, def: 1.0 },
    { name: 'Borussia Dortmund', att: 2.1, def: 1.6 },
    { name: 'Freiburg', att: 1.5, def: 1.4 },
    { name: 'VfB Stuttgart', att: 2.0, def: 1.6 },
    { name: 'Union Berlin', att: 1.1, def: 1.2 },
    { name: 'Wolfsburg', att: 1.6, def: 1.6 },
    { name: 'Borussia Mgladbach', att: 1.4, def: 1.5 },
    { name: 'Werder Bremen', att: 1.5, def: 1.7 },
    { name: 'Mainz', att: 1.4, def: 1.4 },
    { name: 'Augsburg', att: 1.3, def: 1.9 },
    { name: 'Heidenheim', att: 1.2, def: 1.7 },
    { name: 'St Pauli', att: 0.9, def: 1.3 },
    { name: 'Hoffenheim', att: 1.4, def: 1.9 },
    { name: 'Bochum', att: 1.0, def: 2.3 },
    { name: 'Holstein Kiel', att: 1.1, def: 2.4 },
  ];

  // Serie A (I1)
  const i1Teams = [
    { name: 'Inter', att: 2.3, def: 0.9 },
    { name: 'Internazionale', att: 2.3, def: 0.9 },
    { name: 'Napoli', att: 1.8, def: 0.7 },
    { name: 'Atalanta', att: 2.5, def: 1.2 },
    { name: 'Lazio', att: 2.0, def: 1.3 },
    { name: 'Fiorentina', att: 1.9, def: 1.1 },
    { name: 'Juventus', att: 1.6, def: 0.6 },
    { name: 'AC Milan', att: 1.9, def: 1.4 },
    { name: 'Bologna', att: 1.5, def: 1.2 },
    { name: 'Roma', att: 1.4, def: 1.4 },
    { name: 'Torino', att: 1.2, def: 1.5 },
    { name: 'Udinese', att: 1.3, def: 1.5 },
    { name: 'Empoli', att: 0.9, def: 1.1 },
    { name: 'Parma', att: 1.4, def: 1.7 },
    { name: 'Verona', att: 1.3, def: 2.1 },
    { name: 'Como', att: 1.2, def: 1.7 },
    { name: 'Cagliari', att: 1.1, def: 1.7 },
    { name: 'Genoa', att: 1.0, def: 1.6 },
    { name: 'Lecce', att: 0.8, def: 1.7 },
    { name: 'Monza', att: 0.9, def: 1.4 },
    { name: 'Venezia', att: 1.0, def: 1.8 },
    { name: 'Frosinone', att: 1.0, def: 1.8 },
  ];

  // Ligue 1 & UCL European Contenders (F1, UCL)
  const uclTeams = [
    { name: 'Real Madrid', att: 2.3, def: 0.8 },
    { name: 'Manchester City', att: 2.5, def: 0.9 },
    { name: 'Bayern Munich', att: 2.8, def: 0.9 },
    { name: 'Paris Saint-Germain', att: 2.4, def: 1.0 },
    { name: 'PSG', att: 2.4, def: 1.0 },
    { name: 'Arsenal', att: 2.2, def: 0.8 },
    { name: 'Barcelona', att: 2.6, def: 0.9 },
    { name: 'Internazionale', att: 2.3, def: 0.9 },
    { name: 'Liverpool', att: 2.3, def: 0.9 },
    { name: 'Bayer Leverkusen', att: 2.4, def: 1.2 },
    { name: 'Atlético Madrid', att: 1.8, def: 0.7 },
    { name: 'Borussia Dortmund', att: 2.1, def: 1.6 },
    { name: 'Sporting CP', att: 2.0, def: 1.1 },
    { name: 'Lens', att: 1.5, def: 1.2 },
    { name: 'Lyon', att: 1.7, def: 1.4 },
    { name: 'Lille', att: 1.6, def: 1.2 },
    { name: 'Galatasaray', att: 1.7, def: 1.4 },
    { name: 'PSV Eindhoven', att: 2.2, def: 1.3 },
    { name: 'Club Brugge', att: 1.4, def: 1.4 },
    { name: 'Slavia Prague', att: 1.5, def: 1.2 },
    { name: 'Viking FK', att: 1.2, def: 1.8 },
  ];

  const leagueConfigs: Array<{ div: string; teams: Array<{ name: string; att: number; def: number }> }> = [
    { div: 'E0', teams: e0Teams },
    { div: 'SP1', teams: sp1Teams },
    { div: 'D1', teams: d1Teams },
    { div: 'I1', teams: i1Teams },
    { div: 'UCL', teams: uclTeams },
    { div: 'F1', teams: uclTeams },
  ];

  let matchCounter = 1;

  for (const { div, teams } of leagueConfigs) {
    for (let round = 1; round <= 8; round++) {
      for (let i = 0; i < teams.length - 1; i += 2) {
        const home = teams[i];
        const away = teams[i + 1];
        if (!home || !away) continue;

        const offset = -1 * (round * 4 + (i % 3));
        const matchDate = getRelativeDateStr(offset);

        const homeExpected = (home.att * 1.15) / away.def;
        const awayExpected = (away.att * 0.85) / home.def;

        const fthg = Math.min(6, Math.max(0, Math.round(homeExpected + (Math.sin(round + i) * 0.8))));
        const ftag = Math.min(5, Math.max(0, Math.round(awayExpected + (Math.cos(round + i) * 0.7))));

        const ftr = fthg > ftag ? 'H' : fthg === ftag ? 'D' : 'A';
        const hthg = Math.floor(fthg / 2);
        const htag = Math.floor(ftag / 2);
        const htr = hthg > htag ? 'H' : hthg === htag ? 'D' : 'A';

        const hs = Math.round(fthg * 3 + 6 + Math.abs(Math.sin(i) * 4));
        const asShots = Math.round(ftag * 3 + 4 + Math.abs(Math.cos(i) * 4));
        const hst = Math.max(fthg, Math.round(hs * 0.4));
        const ast = Math.max(ftag, Math.round(asShots * 0.4));

        matches.push({
          id: `hist_${div.toLowerCase()}_${matchCounter++}`,
          div,
          season: '2024/2025',
          matchDate,
          homeTeam: home.name,
          awayTeam: away.name,
          fthg,
          ftag,
          ftr,
          hthg,
          htag,
          htr,
          hs,
          asShots,
          hst,
          ast,
          b365H: Number((1.3 + Math.abs(Math.cos(i + round) * 1.5)).toFixed(2)),
          b365D: Number((3.2 + Math.abs(Math.sin(i + round) * 0.8)).toFixed(2)),
          b365A: Number((2.2 + Math.abs(Math.sin(i * 2 + round) * 2.5)).toFixed(2)),
          b365Over25: 1.85,
          b365Under25: 1.95,
          restDaysHome: 7,
          restDaysAway: 7,
        });
      }
    }
  }

  return matches;
}

export function getInitialUpcomingFixtures(): Fixture[] {
  const todayStr = getRelativeDateStr(0);
  const tomorrowStr = getRelativeDateStr(1);
  const day2Str = getRelativeDateStr(2);
  const day3Str = getRelativeDateStr(3);

  return [
    // Brasileirão Série A (BRA) - Scheduled for Today
    {
      id: 'fix_bra_1',
      providerId: 'football_db',
      league: 'BRA',
      leagueName: 'Brasileirão Série A',
      matchDate: todayStr,
      kickOffTime: '19:00',
      homeTeam: 'Internacional',
      awayTeam: 'Corinthians',
      status: 'SCHEDULED',
      odds: { homeWin: 2.10, draw: 3.40, awayWin: 3.50, over25: 2.05, under25: 1.75, bttsYes: 1.85, bttsNo: 1.95 },
    },
    {
      id: 'fix_bra_2',
      providerId: 'football_db',
      league: 'BRA',
      leagueName: 'Brasileirão Série A',
      matchDate: todayStr,
      kickOffTime: '19:30',
      homeTeam: 'Red Bull Bragantino',
      awayTeam: 'Mirassol',
      status: 'SCHEDULED',
      odds: { homeWin: 1.85, draw: 3.50, awayWin: 4.20, over25: 1.90, under25: 1.90, bttsYes: 1.80, bttsNo: 2.00 },
    },
    {
      id: 'fix_bra_3',
      providerId: 'football_db',
      league: 'BRA',
      leagueName: 'Brasileirão Série A',
      matchDate: todayStr,
      kickOffTime: '20:00',
      homeTeam: 'Botafogo',
      awayTeam: 'Vasco da Gama',
      status: 'SCHEDULED',
      odds: { homeWin: 1.70, draw: 3.60, awayWin: 5.00, over25: 1.95, under25: 1.85, bttsYes: 1.90, bttsNo: 1.90 },
    },
    {
      id: 'fix_bra_4',
      providerId: 'football_db',
      league: 'BRA',
      leagueName: 'Brasileirão Série A',
      matchDate: todayStr,
      kickOffTime: '21:00',
      homeTeam: 'Vitória',
      awayTeam: 'Chapecoense',
      status: 'SCHEDULED',
      odds: { homeWin: 2.00, draw: 3.30, awayWin: 3.80, over25: 2.10, under25: 1.70, bttsYes: 1.95, bttsNo: 1.85 },
    },
    {
      id: 'fix_bra_5',
      providerId: 'football_db',
      league: 'BRA',
      leagueName: 'Brasileirão Série A',
      matchDate: todayStr,
      kickOffTime: '21:30',
      homeTeam: 'Remo',
      awayTeam: 'Grêmio',
      status: 'SCHEDULED',
      odds: { homeWin: 3.20, draw: 3.25, awayWin: 2.25, over25: 2.00, under25: 1.80, bttsYes: 1.85, bttsNo: 1.95 },
    },

    // Premier League (E0)
    {
      id: 'fix_e0_1',
      providerId: 'football_db',
      league: 'E0',
      leagueName: 'Premier League',
      matchDate: todayStr,
      kickOffTime: '15:00',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      status: 'SCHEDULED',
      odds: { homeWin: 1.75, draw: 3.80, awayWin: 4.50, over25: 1.85, under25: 1.95, bttsYes: 1.75, bttsNo: 2.05 },
    },
    {
      id: 'fix_e0_2',
      providerId: 'football_db',
      league: 'E0',
      leagueName: 'Premier League',
      matchDate: todayStr,
      kickOffTime: '17:30',
      homeTeam: 'Liverpool',
      awayTeam: 'Man City',
      status: 'SCHEDULED',
      odds: { homeWin: 2.30, draw: 3.50, awayWin: 2.90, over25: 1.65, under25: 2.20, bttsYes: 1.55, bttsNo: 2.35 },
    },
    {
      id: 'fix_e0_3',
      providerId: 'football_db',
      league: 'E0',
      leagueName: 'Premier League',
      matchDate: tomorrowStr,
      kickOffTime: '14:00',
      homeTeam: 'Aston Villa',
      awayTeam: 'Tottenham',
      status: 'SCHEDULED',
      odds: { homeWin: 2.10, draw: 3.60, awayWin: 3.20, over25: 1.70, under25: 2.10, bttsYes: 1.60, bttsNo: 2.25 },
    },
    {
      id: 'fix_e0_4',
      providerId: 'football_db',
      league: 'E0',
      leagueName: 'Premier League',
      matchDate: day2Str,
      kickOffTime: '20:00',
      homeTeam: 'Newcastle',
      awayTeam: 'Man United',
      status: 'SCHEDULED',
      odds: { homeWin: 2.05, draw: 3.50, awayWin: 3.40, over25: 1.75, under25: 2.05, bttsYes: 1.65, bttsNo: 2.20 },
    },

    // La Liga (SP1)
    {
      id: 'fix_sp1_1',
      providerId: 'football_db',
      league: 'SP1',
      leagueName: 'La Liga',
      matchDate: todayStr,
      kickOffTime: '16:15',
      homeTeam: 'Real Madrid',
      awayTeam: 'Villarreal',
      status: 'SCHEDULED',
      odds: { homeWin: 1.45, draw: 4.75, awayWin: 6.50, over25: 1.60, under25: 2.30, bttsYes: 1.70, bttsNo: 2.10 },
    },
    {
      id: 'fix_sp1_2',
      providerId: 'football_db',
      league: 'SP1',
      leagueName: 'La Liga',
      matchDate: todayStr,
      kickOffTime: '21:00',
      homeTeam: 'Barcelona',
      awayTeam: 'Athletic Bilbao',
      status: 'SCHEDULED',
      odds: { homeWin: 1.55, draw: 4.20, awayWin: 5.50, over25: 1.65, under25: 2.20, bttsYes: 1.75, bttsNo: 2.05 },
    },
    {
      id: 'fix_sp1_3',
      providerId: 'football_db',
      league: 'SP1',
      leagueName: 'La Liga',
      matchDate: tomorrowStr,
      kickOffTime: '18:30',
      homeTeam: 'Atletico Madrid',
      awayTeam: 'Real Sociedad',
      status: 'SCHEDULED',
      odds: { homeWin: 1.80, draw: 3.40, awayWin: 4.80, over25: 2.10, under25: 1.70, bttsYes: 1.95, bttsNo: 1.80 },
    },

    // Bundesliga (D1)
    {
      id: 'fix_d1_1',
      providerId: 'football_db',
      league: 'D1',
      leagueName: 'Bundesliga',
      matchDate: todayStr,
      kickOffTime: '15:30',
      homeTeam: 'Bayern Munich',
      awayTeam: 'Borussia Dortmund',
      status: 'SCHEDULED',
      odds: { homeWin: 1.60, draw: 4.50, awayWin: 4.80, over25: 1.45, under25: 2.70, bttsYes: 1.45, bttsNo: 2.65 },
    },
    {
      id: 'fix_d1_2',
      providerId: 'football_db',
      league: 'D1',
      leagueName: 'Bundesliga',
      matchDate: tomorrowStr,
      kickOffTime: '17:30',
      homeTeam: 'Bayer Leverkusen',
      awayTeam: 'RB Leipzig',
      status: 'SCHEDULED',
      odds: { homeWin: 1.90, draw: 3.80, awayWin: 3.70, over25: 1.55, under25: 2.40, bttsYes: 1.50, bttsNo: 2.50 },
    },

    // Serie A (I1)
    {
      id: 'fix_i1_1',
      providerId: 'football_db',
      league: 'I1',
      leagueName: 'Serie A',
      matchDate: todayStr,
      kickOffTime: '18:00',
      homeTeam: 'Juventus',
      awayTeam: 'Napoli',
      status: 'SCHEDULED',
      odds: { homeWin: 2.20, draw: 3.20, awayWin: 3.40, over25: 2.15, under25: 1.65, bttsYes: 1.90, bttsNo: 1.90 },
    },
    {
      id: 'fix_i1_2',
      providerId: 'football_db',
      league: 'I1',
      leagueName: 'Serie A',
      matchDate: todayStr,
      kickOffTime: '20:45',
      homeTeam: 'Inter',
      awayTeam: 'AC Milan',
      status: 'SCHEDULED',
      odds: { homeWin: 1.95, draw: 3.50, awayWin: 3.80, over25: 1.80, under25: 2.00, bttsYes: 1.70, bttsNo: 2.10 },
    },
    {
      id: 'fix_i1_3',
      providerId: 'football_db',
      league: 'I1',
      leagueName: 'Serie A',
      matchDate: tomorrowStr,
      kickOffTime: '15:00',
      homeTeam: 'Atalanta',
      awayTeam: 'Roma',
      status: 'SCHEDULED',
      odds: { homeWin: 2.00, draw: 3.50, awayWin: 3.60, over25: 1.75, under25: 2.05, bttsYes: 1.65, bttsNo: 2.20 },
    },

    // UEFA Champions League (UCL)
    {
      id: 'fix_ucl_1',
      providerId: 'football_db',
      league: 'UCL',
      leagueName: 'UEFA Champions League',
      matchDate: day2Str,
      kickOffTime: '21:00',
      homeTeam: 'Real Madrid',
      awayTeam: 'Bayern Munich',
      status: 'SCHEDULED',
      odds: { homeWin: 2.15, draw: 3.60, awayWin: 3.10, over25: 1.60, under25: 2.30, bttsYes: 1.50, bttsNo: 2.50 },
    },
    {
      id: 'fix_ucl_2',
      providerId: 'football_db',
      league: 'UCL',
      leagueName: 'UEFA Champions League',
      matchDate: day3Str,
      kickOffTime: '21:00',
      homeTeam: 'Man City',
      awayTeam: 'Paris Saint-Germain',
      status: 'SCHEDULED',
      odds: { homeWin: 1.70, draw: 4.00, awayWin: 4.50, over25: 1.55, under25: 2.40, bttsYes: 1.55, bttsNo: 2.35 },
    },
  ];
}
