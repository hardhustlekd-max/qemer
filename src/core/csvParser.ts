import { parse } from 'csv-parse/sync';
import { HistoricalMatch, LeagueCode } from './types.js';

export class FootballDataCSVParser {
  /**
   * Parses raw CSV string from football-data.co.uk into structured HistoricalMatch array
   */
  static parseCSV(csvContent: string, defaultSeason = '2024/2025'): HistoricalMatch[] {
    if (!csvContent || csvContent.trim().length === 0) return [];

    let records: Record<string, string>[];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (e) {
      console.error('CSV parse error:', e);
      return [];
    }

    const matches: HistoricalMatch[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const homeTeam = row['HomeTeam'] || row['Home'] || row['HT'];
      const awayTeam = row['AwayTeam'] || row['Away'] || row['AT'];

      if (!homeTeam || !awayTeam) continue;

      const fthg = parseInt(row['FTHG'] || row['HG'] || '0', 10);
      const ftag = parseInt(row['FTAG'] || row['AG'] || '0', 10);
      let ftr = (row['FTR'] || row['Res'] || '').toUpperCase();

      if (ftr !== 'H' && ftr !== 'D' && ftr !== 'A') {
        if (fthg > ftag) ftr = 'H';
        else if (ftag > fthg) ftr = 'A';
        else ftr = 'D';
      }

      const rawDate = row['Date'] || '';
      const formattedDate = this.normalizeDate(rawDate);
      const div: LeagueCode | string = row['Div'] || 'E0';
      const season = row['Season'] || defaultSeason;

      const id = `${div}_${season.replace('/', '-')}_${homeTeam.replace(/\s+/g, '')}_${awayTeam.replace(/\s+/g, '')}_${formattedDate}`.toLowerCase();

      // Half time stats
      const hthg = row['HTHG'] !== undefined ? parseInt(row['HTHG'], 10) : undefined;
      const htag = row['HTAG'] !== undefined ? parseInt(row['HTAG'], 10) : undefined;
      const htr = (row['HTR'] || '').toUpperCase() as 'H' | 'D' | 'A' | undefined;

      // Shots
      const hs = row['HS'] ? parseInt(row['HS'], 10) : undefined;
      const asShots = row['AS'] ? parseInt(row['AS'], 10) : undefined;
      const hst = row['HST'] ? parseInt(row['HST'], 10) : undefined;
      const ast = row['AST'] ? parseInt(row['AST'], 10) : undefined;

      // Odds (Bet365 or Pinnacle or Average)
      const b365H = this.parseOdd(row['B365H'] || row['PSH'] || row['AvgH'] || row['BWH']);
      const b365D = this.parseOdd(row['B365D'] || row['PSD'] || row['AvgD'] || row['BWD']);
      const b365A = this.parseOdd(row['B365A'] || row['PSA'] || row['AvgA'] || row['BWA']);

      const b365Over25 = this.parseOdd(row['B365>2.5'] || row['P>2.5'] || row['Avg>2.5'] || row['BbAv>2.5']);
      const b365Under25 = this.parseOdd(row['B365<2.5'] || row['P<2.5'] || row['Avg<2.5'] || row['BbAv<2.5']);

      matches.push({
        id,
        div,
        season,
        matchDate: formattedDate,
        homeTeam,
        awayTeam,
        fthg: isNaN(fthg) ? 0 : fthg,
        ftag: isNaN(ftag) ? 0 : ftag,
        ftr: ftr as 'H' | 'D' | 'A',
        hthg: isNaN(hthg as number) ? undefined : hthg,
        htag: isNaN(htag as number) ? undefined : htag,
        htr: (htr === 'H' || htr === 'D' || htr === 'A') ? htr : undefined,
        hs: isNaN(hs as number) ? undefined : hs,
        asShots: isNaN(asShots as number) ? undefined : asShots,
        hst: isNaN(hst as number) ? undefined : hst,
        ast: isNaN(ast as number) ? undefined : ast,
        b365H,
        b365D,
        b365A,
        b365Over25,
        b365Under25,
        restDaysHome: 7,
        restDaysAway: 7,
      });
    }

    return matches;
  }

  private static parseOdd(val?: string): number | undefined {
    if (!val) return undefined;
    const parsed = parseFloat(val);
    return isNaN(parsed) || parsed <= 1.0 ? undefined : Number(parsed.toFixed(2));
  }

  private static normalizeDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Handles DD/MM/YYYY or DD/MM/YY
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      let day = parts[0].padStart(2, '0');
      let month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) {
        year = parseInt(year, 10) > 50 ? `19${year}` : `20${year}`;
      }
      return `${year}-${month}-${day}`;
    }

    return dateStr;
  }
}
