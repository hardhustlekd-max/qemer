import { HistoricalMatch, Fixture } from './types.js';

// Pre-built high quality historical dataset representing matches across Premier League, La Liga, Bundesliga, Serie A
export const PREMIER_LEAGUE_HISTORICAL_CSV = `Div,Date,HomeTeam,AwayTeam,FTHG,FTAG,FTR,HTHG,HTAG,HTR,HS,AS,HST,AST,B365H,B365D,B365A,B365>2.5,B365<2.5
E0,16/08/2024,Man United,Fulham,1,0,H,0,0,D,14,10,5,2,1.57,4.33,5.50,1.57,2.38
E0,17/08/2024,Ipswich,Liverpool,0,2,A,0,0,D,7,19,2,5,8.50,5.75,1.33,1.44,2.75
E0,17/08/2024,Arsenal,Wolves,2,0,H,1,0,H,18,9,6,3,1.20,7.00,13.00,1.53,2.50
E0,17/08/2024,Everton,Brighton,0,3,A,0,1,A,9,10,1,5,2.60,3.40,2.70,1.80,2.00
E0,17/08/2024,Newcastle,Southampton,1,0,H,1,0,H,3,19,1,4,1.33,5.75,8.50,1.40,2.90
E0,17/08/2024,Nott'm Forest,Bournemouth,1,1,D,1,0,H,14,12,3,4,2.45,3.40,2.90,1.90,1.90
E0,17/08/2024,West Ham,Aston Villa,1,2,A,1,1,D,14,15,3,3,2.50,3.60,2.65,1.62,2.30
E0,18/08/2024,Brentford,Crystal Palace,2,1,H,1,0,H,9,14,5,6,2.45,3.40,2.90,1.85,1.95
E0,18/08/2024,Chelsea,Man City,0,2,A,0,1,A,10,11,3,5,4.00,4.00,1.83,1.53,2.50
E0,19/08/2024,Leicester,Tottenham,1,1,D,0,1,A,7,15,3,7,5.50,4.33,1.60,1.57,2.38
E0,24/08/2024,Brighton,Man United,2,1,H,1,0,H,14,11,5,4,2.50,3.60,2.70,1.62,2.30
E0,24/08/2024,Crystal Palace,West Ham,0,2,A,0,0,D,14,18,2,3,2.10,3.50,3.50,1.80,2.00
E0,24/08/2024,Fulham,Leicester,2,1,H,1,1,D,18,10,6,4,1.80,3.80,4.33,1.73,2.10
E0,24/08/2024,Man City,Ipswich,4,1,H,3,1,H,14,1,5,1,1.08,12.00,26.00,1.25,4.00
E0,24/08/2024,Southampton,Nott'm Forest,0,1,A,0,0,D,5,23,1,8,2.50,3.40,2.80,1.95,1.85
E0,24/08/2024,Tottenham,Everton,4,0,H,2,0,H,13,10,7,1,1.44,4.75,7.00,1.44,2.75
E0,24/08/2024,Aston Villa,Arsenal,0,2,A,0,0,D,11,9,3,4,4.20,3.80,1.83,1.73,2.10
E0,25/08/2024,Bournemouth,Newcastle,1,1,D,1,0,H,16,14,4,5,3.00,3.75,2.25,1.57,2.38
E0,25/08/2024,Wolves,Chelsea,2,6,A,2,2,D,12,14,4,8,4.33,4.00,1.75,1.62,2.30
E0,25/08/2024,Liverpool,Brentford,2,0,H,1,0,H,19,8,8,2,1.22,7.00,11.00,1.36,3.10
E0,31/08/2024,Arsenal,Brighton,1,1,D,1,0,H,11,22,7,4,1.33,5.50,9.00,1.57,2.38
E0,31/08/2024,Brentford,Southampton,3,1,H,1,0,H,20,11,7,6,1.73,4.00,4.50,1.67,2.20
E0,31/08/2024,Everton,Bournemouth,2,3,A,0,0,D,18,17,8,7,2.80,3.40,2.50,1.80,2.00
E0,31/08/2024,Ipswich,Fulham,1,1,D,1,1,D,11,11,4,4,3.00,3.40,2.38,1.90,1.90
E0,31/08/2024,Leicester,Aston Villa,1,2,A,0,1,A,8,17,3,5,4.50,4.00,1.73,1.67,2.20
E0,31/08/2024,Nott'm Forest,Wolves,1,1,D,1,1,D,16,11,5,3,2.00,3.50,3.80,1.90,1.90
E0,31/08/2024,West Ham,Man City,1,3,A,1,2,A,10,23,2,8,7.50,5.50,1.36,1.44,2.75
E0,01/09/2024,Chelsea,Crystal Palace,1,1,D,1,0,H,17,9,7,3,1.62,4.33,5.00,1.53,2.50
E0,01/09/2024,Newcastle,Tottenham,2,1,H,1,0,H,9,20,6,6,2.50,3.80,2.60,1.40,2.90
E0,01/09/2024,Man United,Liverpool,0,3,A,0,2,A,8,12,3,3,3.75,4.00,1.85,1.44,2.75
E0,14/09/2024,Southampton,Man United,0,3,A,0,2,A,6,20,4,10,4.50,4.20,1.73,1.62,2.30
E0,14/09/2024,Brighton,Ipswich,0,0,D,0,0,D,21,6,6,1,1.36,5.25,8.00,1.53,2.50
E0,14/09/2024,Crystal Palace,Leicester,2,2,D,0,1,A,20,9,4,3,1.60,4.20,5.50,1.73,2.10
E0,14/09/2024,Fulham,West Ham,1,1,D,1,0,H,21,11,5,3,2.40,3.50,2.90,1.73,2.10
E0,14/09/2024,Liverpool,Nott'm Forest,0,1,A,0,0,D,14,5,5,3,1.22,6.50,12.00,1.44,2.75
E0,14/09/2024,Man City,Brentford,2,1,H,2,1,H,18,7,7,5,1.18,7.50,15.00,1.33,3.30
E0,14/09/2024,Aston Villa,Everton,3,2,H,1,2,A,17,13,7,3,1.50,4.50,6.00,1.67,2.20
E0,14/09/2024,Bournemouth,Chelsea,0,1,A,0,0,D,19,10,7,4,3.40,3.80,2.05,1.50,2.60
E0,15/09/2024,Tottenham,Arsenal,0,1,A,0,0,D,15,7,5,4,3.00,3.60,2.30,1.62,2.30
E0,15/09/2024,Wolves,Newcastle,1,2,A,1,0,H,12,14,5,6,3.40,3.60,2.10,1.67,2.20
E0,21/09/2024,West Ham,Chelsea,0,3,A,0,2,A,15,12,7,5,3.40,3.80,2.05,1.53,2.50
E0,21/09/2024,Aston Villa,Wolves,3,1,H,0,1,A,16,11,6,3,1.57,4.33,5.50,1.62,2.30
E0,21/09/2024,Fulham,Newcastle,3,1,H,2,0,H,22,15,10,4,2.80,3.50,2.45,1.73,2.10
E0,21/09/2024,Leicester,Everton,1,1,D,0,1,A,11,17,2,5,2.55,3.40,2.80,1.90,1.90
E0,21/09/2024,Liverpool,Bournemouth,3,0,H,3,0,H,19,19,7,6,1.30,6.00,9.00,1.36,3.10
E0,21/09/2024,Southampton,Ipswich,1,1,D,1,0,H,11,13,2,6,2.30,3.50,3.10,1.80,2.00
E0,21/09/2024,Tottenham,Brentford,3,1,H,2,1,H,23,6,10,4,1.53,4.75,5.50,1.40,2.90
E0,21/09/2024,Crystal Palace,Man United,0,0,D,0,0,D,9,15,4,6,2.88,3.60,2.40,1.62,2.30
E0,22/09/2024,Brighton,Nott'm Forest,2,2,D,2,1,H,13,8,4,3,1.75,3.80,4.60,1.80,2.00
E0,22/09/2024,Man City,Arsenal,2,2,D,1,2,A,33,5,11,2,1.75,3.60,5.00,1.95,1.85
E0,28/09/2024,Newcastle,Man City,1,1,D,0,1,A,11,16,4,6,5.25,4.33,1.60,1.53,2.50
E0,28/09/2024,Arsenal,Leicester,4,2,H,2,0,H,36,5,16,3,1.18,7.50,15.00,1.40,2.90
E0,28/09/2024,Brentford,West Ham,1,1,D,1,0,H,8,18,3,4,2.20,3.60,3.20,1.67,2.20
E0,28/09/2024,Chelsea,Brighton,4,2,H,4,2,H,15,15,7,5,1.75,4.20,4.20,1.50,2.60
E0,28/09/2024,Everton,Crystal Palace,2,1,H,0,1,A,8,17,3,5,2.75,3.30,2.62,1.95,1.85
E0,28/09/2024,Nott'm Forest,Fulham,0,1,A,0,0,D,9,14,1,4,2.40,3.30,3.10,2.00,1.80
E0,28/09/2024,Wolves,Liverpool,1,2,A,0,1,A,7,10,3,6,9.00,5.50,1.33,1.44,2.75
E0,29/09/2024,Ipswich,Aston Villa,2,2,D,1,2,A,15,11,4,5,4.33,3.80,1.80,1.73,2.10
E0,29/09/2024,Man United,Tottenham,0,3,A,0,1,A,11,24,2,9,2.30,3.80,2.88,1.44,2.75
E0,30/09/2024,Bournemouth,Southampton,3,1,H,3,0,H,15,14,6,3,1.75,4.00,4.33,1.62,2.30
E0,05/10/2024,Crystal Palace,Liverpool,0,1,A,0,1,A,9,16,3,4,6.00,4.50,1.53,1.62,2.30
E0,05/10/2024,Arsenal,Southampton,3,1,H,0,0,D,29,8,6,2,1.14,8.50,19.00,1.36,3.10
E0,05/10/2024,Brentford,Wolves,5,3,H,4,2,H,19,17,8,6,2.00,3.60,3.60,1.73,2.10
E0,05/10/2024,Man City,Fulham,3,2,H,1,1,D,20,10,7,4,1.25,6.50,11.00,1.36,3.10
E0,05/10/2024,West Ham,Ipswich,4,1,H,2,1,H,23,8,13,2,1.80,3.80,4.33,1.67,2.20
E0,05/10/2024,Leicester,Bournemouth,1,0,H,1,0,H,6,17,2,2,3.30,3.60,2.15,1.73,2.10
E0,05/10/2024,Everton,Newcastle,0,0,D,0,0,D,8,14,2,3,3.20,3.50,2.25,1.73,2.10
E0,06/10/2024,Aston Villa,Man United,0,0,D,0,0,D,11,10,1,4,2.25,3.60,3.10,1.67,2.20
E0,06/10/2024,Chelsea,Nott'm Forest,1,1,D,0,0,D,22,16,8,9,1.50,4.50,6.00,1.57,2.38
E0,06/10/2024,Brighton,Tottenham,3,2,H,0,2,A,11,13,4,7,2.90,3.80,2.25,1.44,2.75
SP1,15/08/2024,Athletic Club,Getafe,1,1,D,1,0,H,14,10,4,2,1.50,3.80,8.00,2.40,1.55
SP1,15/08/2024,Betis,Girona,1,1,D,1,0,H,19,13,6,4,2.40,3.40,3.00,1.90,1.90
SP1,16/08/2024,Celta,Alaves,2,1,H,0,1,A,14,9,5,2,2.00,3.30,4.00,2.15,1.68
SP1,16/08/2024,Las Palmas,Sevilla,2,2,D,1,1,D,10,12,3,4,3.10,3.20,2.40,2.10,1.73
SP1,17/08/2024,Osasuna,Leganes,1,1,D,0,1,A,15,4,4,1,1.85,3.30,4.75,2.40,1.55
SP1,17/08/2024,Valencia,Barcelona,1,2,A,1,1,D,5,18,2,6,4.75,4.00,1.70,1.75,2.05
SP1,18/08/2024,Sociedad,Vallecano,1,2,A,0,0,D,18,7,4,3,1.57,3.80,6.50,2.30,1.60
SP1,18/08/2024,Mallorca,Real Madrid,1,1,D,0,1,A,12,13,5,4,7.50,4.75,1.44,1.80,2.00
SP1,19/08/2024,Valladolid,Espanol,1,0,H,1,0,H,14,10,6,1,2.30,3.10,3.40,2.35,1.57
SP1,19/08/2024,Villarreal,Ath Madrid,2,2,D,2,2,D,11,10,4,4,3.30,3.50,2.15,1.85,1.95
SP1,24/08/2024,Barcelona,Athletic Club,2,1,H,1,1,D,19,10,7,2,1.60,4.20,5.25,1.65,2.20
SP1,25/08/2024,Real Madrid,Valladolid,3,0,H,0,0,D,17,8,9,0,1.14,8.50,17.00,1.40,2.90
SP1,25/08/2024,Ath Madrid,Girona,3,0,H,1,0,H,12,12,4,4,1.57,4.20,5.50,1.75,2.05
D1,23/08/2024,M'gladbach,Leverkusen,2,3,A,0,2,A,14,25,7,10,5.50,4.75,1.53,1.44,2.75
D1,24/08/2024,Augsburg,Bremen,2,2,D,2,1,H,11,11,3,3,2.30,3.60,3.00,1.62,2.30
D1,24/08/2024,Freiburg,Stuttgart,3,1,H,1,1,D,15,17,7,5,3.10,3.80,2.15,1.53,2.50
D1,24/08/2024,Hoffenheim,Holstein Kiel,3,2,H,2,0,H,18,16,6,5,1.62,4.50,4.75,1.40,2.90
D1,24/08/2024,Mainz,Union Berlin,1,1,D,0,0,D,13,11,4,2,2.10,3.30,3.60,2.05,1.75
D1,24/08/2024,RB Leipzig,Bochum,1,0,H,0,0,D,15,10,6,1,1.25,6.50,10.00,1.40,2.90
D1,24/08/2024,Dortmund,Ein Frankfurt,2,0,H,0,0,D,20,7,5,2,1.70,4.33,4.33,1.44,2.75
D1,25/08/2024,Wolfsburg,Bayern Munich,2,3,A,0,1,A,11,18,3,7,6.50,5.25,1.44,1.40,2.90
D1,25/08/2024,St Pauli,Heidenheim,0,2,A,0,0,D,12,8,2,4,2.30,3.30,3.20,2.00,1.80
I1,17/08/2024,Genoa,Inter,2,2,D,1,1,D,14,14,7,7,6.50,4.20,1.53,1.85,1.95
I1,17/08/2024,Parma,Fiorentina,1,1,D,1,0,H,14,15,4,6,3.40,3.40,2.15,1.90,1.90
I1,17/08/2024,Milan,Torino,2,2,D,0,1,A,14,12,6,5,1.70,3.80,5.00,1.90,1.90
I1,17/08/2024,Empoli,Monza,0,0,D,0,0,D,10,7,2,1,2.60,3.10,2.90,2.30,1.60
I1,18/08/2024,Bologna,Udinese,1,1,D,0,0,D,22,6,7,2,1.95,3.30,4.20,2.10,1.73
I1,18/08/2024,Verona,Napoli,3,0,H,0,0,D,8,12,4,4,4.50,3.60,1.80,1.95,1.85
I1,18/08/2024,Cagliari,Roma,0,0,D,0,0,D,14,15,3,3,3.75,3.50,2.00,1.90,1.90
I1,18/08/2024,Lazio,Venezia,3,1,H,2,1,H,12,6,6,2,1.50,4.33,6.50,1.80,2.00
I1,19/08/2024,Juventus,Como,3,0,H,2,0,H,13,3,3,0,1.33,5.25,9.50,1.80,2.00
I1,19/08/2024,Lecce,Atalanta,0,4,A,0,2,A,18,14,6,6,4.75,3.80,1.75,1.85,1.95
`;

export function getRelativeDateStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const INITIAL_UPCOMING_FIXTURES: Fixture[] = [
  {
    id: 'wireframe_peterborough_ipswich_u21',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'E0',
    leagueName: 'EFL Trophy / Cup',
    matchDate: getRelativeDateStr(0),
    kickOffTime: '21:00',
    homeTeam: 'Peterborough',
    awayTeam: 'Ipswich U21',
    status: 'SCHEDULED',
    odds: {
      homeWin: 1.45,
      draw: 4.80,
      awayWin: 5.80,
      over25: 1.62,
      under25: 2.30,
      bttsYes: 1.50,
      bttsNo: 2.50,
    },
  },
  {
    id: 'wireframe_tamworth_leeds_u21',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'E0',
    leagueName: 'National League Cup',
    matchDate: getRelativeDateStr(0),
    kickOffTime: '21:45',
    homeTeam: 'Tamworth',
    awayTeam: 'Leeds U21',
    status: 'SCHEDULED',
    odds: {
      homeWin: 1.55,
      draw: 4.40,
      awayWin: 5.00,
      over25: 1.36,
      under25: 3.10,
      bttsYes: 1.40,
      bttsNo: 2.80,
    },
  },
  {
    id: 'wireframe_cheshunt_aveley',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'E0',
    leagueName: 'Isthmian Premier',
    matchDate: getRelativeDateStr(0),
    kickOffTime: '21:45',
    homeTeam: 'Cheshunt',
    awayTeam: 'Aveley',
    status: 'SCHEDULED',
    odds: {
      homeWin: 2.20,
      draw: 3.50,
      awayWin: 2.80,
      over25: 1.56,
      under25: 2.40,
      bttsYes: 1.55,
      bttsNo: 2.35,
    },
  },
  {
    id: 'wireframe_wingate_bedford',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'E0',
    leagueName: 'Southern League',
    matchDate: getRelativeDateStr(0),
    kickOffTime: '21:45',
    homeTeam: 'Wingate & Finchley',
    awayTeam: 'Bedford Town',
    status: 'SCHEDULED',
    odds: {
      homeWin: 2.10,
      draw: 3.60,
      awayWin: 3.00,
      over25: 1.80,
      under25: 2.00,
      bttsYes: 1.60,
      bttsNo: 2.20,
    },
  },
  {
    id: 'wireframe_wimbledon_barnet',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'E0',
    leagueName: 'EFL Trophy',
    matchDate: getRelativeDateStr(0),
    kickOffTime: '21:00',
    homeTeam: 'AFC Wimbledon',
    awayTeam: 'Barnet',
    status: 'SCHEDULED',
    odds: {
      homeWin: 1.95,
      draw: 3.60,
      awayWin: 3.40,
      over25: 1.60,
      under25: 2.30,
      bttsYes: 1.58,
      bttsNo: 2.30,
    },
  },
  {
    id: 'wireframe_shrewsbury_stockport',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'E0',
    leagueName: 'League One',
    matchDate: getRelativeDateStr(0),
    kickOffTime: '21:00',
    homeTeam: 'Shrewsbury',
    awayTeam: 'Stockport County',
    status: 'SCHEDULED',
    odds: {
      homeWin: 3.10,
      draw: 3.40,
      awayWin: 2.25,
      over25: 1.62,
      under25: 2.25,
      bttsYes: 1.65,
      bttsNo: 2.15,
    },
  },
  {
    id: 'wireframe_exeter_oxford',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'E0',
    leagueName: 'League One / Cup',
    matchDate: getRelativeDateStr(0),
    kickOffTime: '21:00',
    homeTeam: 'Exeter',
    awayTeam: 'Oxford Utd',
    status: 'SCHEDULED',
    odds: {
      homeWin: 2.40,
      draw: 3.30,
      awayWin: 2.90,
      over25: 1.20,
      under25: 4.50,
      bttsYes: 1.50,
      bttsNo: 2.50,
    },
  },
  {
    id: 'wireframe_fleetwood_barnsley',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'E0',
    leagueName: 'EFL Trophy',
    matchDate: getRelativeDateStr(0),
    kickOffTime: '21:00',
    homeTeam: 'Fleetwood',
    awayTeam: 'Barnsley',
    status: 'SCHEDULED',
    odds: {
      homeWin: 2.80,
      draw: 3.50,
      awayWin: 2.35,
      over25: 1.53,
      under25: 2.45,
      bttsYes: 1.55,
      bttsNo: 2.35,
    },
  },
  {
    id: 'wireframe_stockton_bury',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'E0',
    leagueName: 'Northern Premier',
    matchDate: getRelativeDateStr(0),
    kickOffTime: '21:45',
    homeTeam: 'Stockton',
    awayTeam: 'Bury',
    status: 'SCHEDULED',
    odds: {
      homeWin: 2.05,
      draw: 3.60,
      awayWin: 3.10,
      over25: 1.57,
      under25: 2.35,
      bttsYes: 1.52,
      bttsNo: 2.45,
    },
  },
  {
    id: 'wireframe_farnham_truro',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'E0',
    leagueName: 'FA Trophy',
    matchDate: getRelativeDateStr(0),
    kickOffTime: '21:45',
    homeTeam: 'Farnham Town',
    awayTeam: 'Truro City',
    status: 'SCHEDULED',
    odds: {
      homeWin: 2.50,
      draw: 3.50,
      awayWin: 2.60,
      over25: 1.60,
      under25: 2.30,
      bttsYes: 1.55,
      bttsNo: 2.35,
    },
  },
  {
    id: 'e0_arsenal_chelsea_today',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'E0',
    leagueName: 'Premier League',
    matchDate: getRelativeDateStr(0),
    kickOffTime: '17:30',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    status: 'SCHEDULED',
    odds: {
      homeWin: 1.65,
      draw: 4.10,
      awayWin: 4.75,
      over25: 1.62,
      under25: 2.30,
      bttsYes: 1.68,
      bttsNo: 2.15,
    },
  },
  {
    id: 'e0_liverpool_manchestercity_today',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'E0',
    leagueName: 'Premier League',
    matchDate: getRelativeDateStr(0),
    kickOffTime: '20:00',
    homeTeam: 'Liverpool',
    awayTeam: 'Man City',
    status: 'SCHEDULED',
    odds: {
      homeWin: 2.10,
      draw: 3.75,
      awayWin: 3.30,
      over25: 1.55,
      under25: 2.45,
      bttsYes: 1.50,
      bttsNo: 2.50,
    },
  },
  {
    id: 'sp1_realmadrid_barcelona_today',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'SP1',
    leagueName: 'La Liga',
    matchDate: getRelativeDateStr(1),
    kickOffTime: '20:00',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    status: 'SCHEDULED',
    odds: {
      homeWin: 2.05,
      draw: 3.80,
      awayWin: 3.40,
      over25: 1.52,
      under25: 2.55,
      bttsYes: 1.48,
      bttsNo: 2.60,
    },
  },
  {
    id: 'd1_bayern_dortmund_today',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'D1',
    leagueName: 'Bundesliga',
    matchDate: getRelativeDateStr(1),
    kickOffTime: '17:30',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Dortmund',
    status: 'SCHEDULED',
    odds: {
      homeWin: 1.42,
      draw: 5.25,
      awayWin: 6.50,
      over25: 1.33,
      under25: 3.30,
      bttsYes: 1.45,
      bttsNo: 2.70,
    },
  },
  {
    id: 'i1_inter_milan_today',
    providerId: 'FOOTBALL_DATA_CO_UK',
    league: 'I1',
    leagueName: 'Serie A',
    matchDate: getRelativeDateStr(2),
    kickOffTime: '19:45',
    homeTeam: 'Inter',
    awayTeam: 'Milan',
    status: 'SCHEDULED',
    odds: {
      homeWin: 1.95,
      draw: 3.50,
      awayWin: 3.90,
      over25: 1.80,
      under25: 2.02,
      bttsYes: 1.70,
      bttsNo: 2.10,
    },
  },
];
