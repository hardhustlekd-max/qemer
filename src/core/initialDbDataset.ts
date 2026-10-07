import { HistoricalMatch } from './types.js';
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
