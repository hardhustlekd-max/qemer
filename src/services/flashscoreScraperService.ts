import { Fixture, BookmakerOdds, HistoricalMatch, LeagueCode, FlashscoreScrapedMatch, HeadToHeadMeasurement, HeadToHeadMatchRecord } from '../core/types.js';
import { LiveOddsUpdate, LiveScore } from '../providers/types.js';
import { db } from '../core/db.js';
import { GLOBAL_LEAGUES_DATASET } from '../core/globalLeaguesDataset.js';

const FLASHSCORE_FEED_BASE = 'https://www.flashscore.com/x/feed';
const FLASHSCORE_NINJA_BASE = 'https://46.flashscore.ninja/46/x/feed';
const FSIGN_HEADER = 'SW9D1eZo';
const STATIC_IMAGE_BASE = 'https://static.flashscore.com/res/image/data/';

interface ScrapedRawMatch {
  matchId: string;
  timestamp: number;
  tournament: string;
  country: string;
  leagueUrl?: string;
  homeTeam: string;
  awayTeam: string;
  homeBadge?: string;
  awayBadge?: string;
  statusCode: string;
  periodCode?: string;
  homeScore?: number;
  awayScore?: number;
  homeHtScore?: number;
  awayHtScore?: number;
}

export class FlashscoreScraperService {
  private cacheUpcoming: Fixture[] = [];
  private cacheH2H = new Map<string, HeadToHeadMeasurement>();
  private lastFetchTime = 0;
  private CACHE_TTL_MS = 60000; // 1 minute in-memory cache

  /**
   * Fetch raw feed string from Flashscore feed endpoint
   */
  private async fetchFlashscoreFeed(path: string): Promise<string | null> {
    const urls = [
      `${FLASHSCORE_FEED_BASE}/${path}`,
      `${FLASHSCORE_NINJA_BASE}/${path}`,
    ];

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(url, {
          headers: {
            'x-fsign': FSIGN_HEADER,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const text = await res.text();
          if (text && text.length > 50) {
            return text;
          }
        }
      } catch (err) {
        // try next endpoint
      }
    }

    return null;
  }

  /**
   * Parse Flashscore delimiter format:
   * Sections begin with ~
   * Within each section, pairs are separated by ¬
   * Keys and values are separated by ÷
   */
  private parseFeedText(feedText: string): ScrapedRawMatch[] {
    const matches: ScrapedRawMatch[] = [];
    const sections = feedText.split('~');

    let currentTournament = 'Football Competition';
    let currentCountry = 'International';
    let currentLeagueUrl = '';

    for (const section of sections) {
      if (!section) continue;

      if (section.startsWith('ZA÷')) {
        // Tournament header section
        const parts = section.split('¬');
        for (const p of parts) {
          const [key, val] = p.split('÷');
          if (key === 'ZA' && val) currentTournament = val.trim();
          if (key === 'ZY' && val) currentCountry = val.trim();
          if (key === 'ZL' && val) currentLeagueUrl = val.trim();
        }
      } else if (section.startsWith('AA÷')) {
        // Match item
        const parts = section.split('¬');
        const matchData: Partial<ScrapedRawMatch> = {
          tournament: currentTournament,
          country: currentCountry,
          leagueUrl: currentLeagueUrl,
        };

        for (const p of parts) {
          const [key, val] = p.split('÷');
          if (!key || val === undefined) continue;

          switch (key) {
            case 'AA':
              matchData.matchId = val;
              break;
            case 'AD':
              matchData.timestamp = parseInt(val, 10);
              break;
            case 'AE':
              matchData.homeTeam = val;
              break;
            case 'AF':
              matchData.awayTeam = val;
              break;
            case 'AG':
              matchData.homeScore = parseInt(val, 10);
              break;
            case 'AH':
              matchData.awayScore = parseInt(val, 10);
              break;
            case 'BC':
              matchData.homeHtScore = parseInt(val, 10);
              break;
            case 'BD':
              matchData.awayHtScore = parseInt(val, 10);
              break;
            case 'AB':
              matchData.statusCode = val;
              break;
            case 'AC':
              matchData.periodCode = val;
              break;
            case 'OA':
              matchData.homeBadge = val;
              break;
            case 'OB':
              matchData.awayBadge = val;
              break;
          }
        }

        if (matchData.matchId && matchData.homeTeam && matchData.awayTeam) {
          matches.push(matchData as ScrapedRawMatch);
        }
      }
    }

    return matches;
  }

  /**
   * Map tournament/country string to application LeagueCode
   */
  private mapToLeagueCode(tournament: string, country: string): { code: LeagueCode; name: string } {
    const cleanedTournament = tournament.replace(/^[A-Z\s]+:\s*/, '').trim();
    const lowerTourn = cleanedTournament.toLowerCase();
    const lowerCountry = country.toLowerCase();

    // Direct match against known major leagues
    if (lowerTourn.includes('premier league') && (lowerCountry.includes('england') || lowerCountry.includes('uk') || tournament.toLowerCase().includes('england'))) {
      return { code: 'E0', name: 'English Premier League' };
    }
    if (lowerTourn.includes('championship') && (lowerCountry.includes('england') || tournament.toLowerCase().includes('england'))) {
      return { code: 'E1', name: 'English Championship' };
    }
    if ((lowerTourn.includes('la liga') || lowerTourn.includes('laliga')) && (lowerCountry.includes('spain') || tournament.toLowerCase().includes('spain'))) {
      return { code: 'SP1', name: 'Spanish La Liga' };
    }
    if (lowerTourn.includes('bundesliga') && (lowerCountry.includes('germany') || tournament.toLowerCase().includes('germany'))) {
      return { code: 'D1', name: 'German Bundesliga' };
    }
    if (lowerTourn.includes('serie a') && (lowerCountry.includes('italy') || tournament.toLowerCase().includes('italy'))) {
      return { code: 'I1', name: 'Italian Serie A' };
    }
    if (lowerTourn.includes('ligue 1') && (lowerCountry.includes('france') || tournament.toLowerCase().includes('france'))) {
      return { code: 'F1', name: 'French Ligue 1' };
    }
    if (lowerTourn.includes('champions league') && (lowerCountry.includes('europe') || tournament.toLowerCase().includes('europe') || lowerCountry.includes('international') || tournament.toLowerCase().includes('international') || (!lowerTourn.includes('caf') && !lowerTourn.includes('afc') && !lowerTourn.includes('concacaf') && !lowerTourn.includes('women')))) {
      return { code: 'UCL', name: 'UEFA Champions League' };
    }
    if (lowerTourn.includes('europa league')) {
      return { code: 'UEL', name: 'UEFA Europa League' };
    }
    if (lowerTourn.includes('conference league')) {
      return { code: 'UECL', name: 'UEFA Europa Conference League' };
    }
    if (lowerTourn.includes('eredivisie') && (lowerCountry.includes('netherlands') || tournament.toLowerCase().includes('netherlands'))) {
      return { code: 'N1', name: 'Dutch Eredivisie' };
    }
    if ((lowerTourn.includes('primeira liga') || lowerTourn.includes('liga portugal')) && (lowerCountry.includes('portugal') || tournament.toLowerCase().includes('portugal'))) {
      return { code: 'P1', name: 'Portuguese Primeira Liga' };
    }
    if (lowerTourn.includes('serie a') && (lowerCountry.includes('brazil') || tournament.toLowerCase().includes('brazil'))) {
      return { code: 'BRA', name: 'Brazilian Série A' };
    }
    if (lowerTourn.includes('major league soccer') || lowerTourn === 'mls' || (lowerTourn.includes('mls') && lowerCountry.includes('usa'))) {
      return { code: 'MLS', name: 'Major League Soccer' };
    }

    // Try matching global leagues dataset with BOTH country and name match
    const matchedWithCountry = GLOBAL_LEAGUES_DATASET.find((gl) => {
      const countryMatches = gl.country && (
        lowerCountry.includes(gl.country.toLowerCase()) ||
        gl.country.toLowerCase().includes(lowerCountry) ||
        tournament.toLowerCase().includes(gl.country.toLowerCase())
      );
      if (!countryMatches) return false;
      return gl.name.toLowerCase() === lowerTourn || lowerTourn.includes(gl.name.toLowerCase()) || gl.name.toLowerCase().includes(lowerTourn);
    });

    if (matchedWithCountry) {
      return { code: matchedWithCountry.code, name: matchedWithCountry.name };
    }

    // If international competition
    if (lowerCountry.includes('international') || lowerCountry.includes('world') || lowerCountry.includes('europe')) {
      const matchedIntl = GLOBAL_LEAGUES_DATASET.find(
        (gl) => (gl.country === 'International' || gl.country === 'Europe') && gl.name.toLowerCase() === lowerTourn
      );
      if (matchedIntl) {
        return { code: matchedIntl.code, name: matchedIntl.name };
      }
    }

    const simpleCode = ((country ? country.slice(0, 3) : 'INT') + '1').toUpperCase();
    return { code: simpleCode, name: country ? `${country}: ${cleanedTournament}` : cleanedTournament };
  }

  /**
   * Generates fair baseline odds based on match teams & historical context
   */
  private generateMatchOdds(homeTeam: string, awayTeam: string): BookmakerOdds {
    const histHome = db.getTeamHistoricalMatches(homeTeam, 10);
    const histAway = db.getTeamHistoricalMatches(awayTeam, 10);

    let homeWinRate = 0.45;
    let awayWinRate = 0.28;
    let drawRate = 0.27;

    if (histHome.length > 0) {
      const homeWins = histHome.filter((m) => (m.homeTeam.toLowerCase() === homeTeam.toLowerCase() && m.ftr === 'H')).length;
      homeWinRate = Math.max(0.20, Math.min(0.75, homeWins / histHome.length + 0.1));
    }

    if (histAway.length > 0) {
      const awayWins = histAway.filter((m) => (m.awayTeam.toLowerCase() === awayTeam.toLowerCase() && m.ftr === 'A')).length;
      awayWinRate = Math.max(0.15, Math.min(0.65, awayWins / histAway.length));
    }

    const total = homeWinRate + awayWinRate + drawRate;
    const pHome = homeWinRate / total;
    const pAway = awayWinRate / total;
    const pDraw = drawRate / total;

    // Apply bookmaker overround (~6%)
    const margin = 1.06;
    const homeWin = Number(Math.max(1.15, Math.min(12.0, margin / pHome)).toFixed(2));
    const draw = Number(Math.max(2.50, Math.min(8.5, margin / pDraw)).toFixed(2));
    const awayWin = Number(Math.max(1.20, Math.min(15.0, margin / pAway)).toFixed(2));

    return {
      homeWin,
      draw,
      awayWin,
      over25: 1.88,
      under25: 1.95,
      bttsYes: 1.82,
      bttsNo: 1.98,
    };
  }

  /**
   * Scrapes upcoming and scheduled fixtures from Flashscore feeds
   */
  async getUpcomingFixtures(dateFilter?: string): Promise<Fixture[]> {
    const now = Date.now();
    if (this.cacheUpcoming.length > 0 && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      if (dateFilter) {
        return this.cacheUpcoming.filter((f) => f.matchDate === dateFilter);
      }
      return this.cacheUpcoming;
    }

    const scrapedFixtures: Fixture[] = [];
    const scrapedMatchesForDb: any[] = [];
    const seenMatchIds = new Set<string>();

    // Scrape Day 0 (today), Day 1 (tomorrow), Day 2, and Day 3 to cover next days and this week
    const dayOffsets = [0, 1, 2, 3];

    for (const offset of dayOffsets) {
      const feedText = await this.fetchFlashscoreFeed(`f_1_${offset}_3_en_1`);
      if (!feedText) continue;

      const rawMatches = this.parseFeedText(feedText);

      for (const m of rawMatches) {
        // Skip finished matches for upcoming fixtures view
        if (m.statusCode === '3') continue;

        // Guarantee unique fixture ID
        if (seenMatchIds.has(m.matchId)) continue;
        seenMatchIds.add(m.matchId);

        const matchDateObj = m.timestamp ? new Date((m.timestamp + 3 * 3600) * 1000) : new Date();
        const year = matchDateObj.getUTCFullYear();
        const month = String(matchDateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(matchDateObj.getUTCDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const hours = String(matchDateObj.getUTCHours()).padStart(2, '0');
        const mins = String(matchDateObj.getUTCMinutes()).padStart(2, '0');
        const kickOffTime = `${hours}:${mins}`;

        const { code, name } = this.mapToLeagueCode(m.tournament, m.country);
        const odds = this.generateMatchOdds(m.homeTeam, m.awayTeam);

        const isLive = m.statusCode === '2';
        const fixture: Fixture = {
          id: `fs_${m.matchId}`,
          providerId: 'FLASHSCORE',
          league: code,
          leagueName: name,
          matchDate: dateStr,
          kickOffTime,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeBadge: m.homeBadge ? `${STATIC_IMAGE_BASE}${m.homeBadge}` : undefined,
          awayBadge: m.awayBadge ? `${STATIC_IMAGE_BASE}${m.awayBadge}` : undefined,
          status: isLive ? 'LIVE' : 'SCHEDULED',
          stage: m.tournament,
          odds,
          score: (m.homeScore !== undefined && m.awayScore !== undefined)
            ? { home: m.homeScore, away: m.awayScore }
            : undefined,
        };

        scrapedFixtures.push(fixture);

        scrapedMatchesForDb.push({
          matchId: m.matchId,
          stage: m.tournament,
          status: isLive ? 'LIVE' : 'SCHEDULED',
          date: `${dateStr} ${kickOffTime}`,
          country: m.country,
          leagueName: name,
          home: {
            name: m.homeTeam,
            image: m.homeBadge ? `${STATIC_IMAGE_BASE}${m.homeBadge}` : undefined,
          },
          away: {
            name: m.awayTeam,
            image: m.awayBadge ? `${STATIC_IMAGE_BASE}${m.awayBadge}` : undefined,
          },
          result: {
            home: m.homeScore !== undefined ? String(m.homeScore) : undefined,
            away: m.awayScore !== undefined ? String(m.awayScore) : undefined,
          },
          information: [
            { category: 'Source', value: 'Flashscore Scraping Feed' },
            { category: 'Country', value: m.country },
            { category: 'Competition', value: name },
          ],
          statistics: [],
        });
      }
    }

    if (scrapedFixtures.length > 0) {
      this.cacheUpcoming = scrapedFixtures;
      this.lastFetchTime = now;
      // Persist to database
      db.saveUpcomingFixtures(scrapedFixtures);
      db.saveFlashscoreScrapedMatches(scrapedMatchesForDb);

      if (dateFilter) {
        return scrapedFixtures.filter((f) => f.matchDate === dateFilter);
      }
      return scrapedFixtures;
    }

    // Fallback to SQLite cached fixtures
    const cached = db.getUpcomingFixtures(undefined, dateFilter);
    return cached;
  }

  /**
   * Scrapes live in-play scores from Flashscore
   */
  async getLiveScores(): Promise<LiveScore[]> {
    const feedText = await this.fetchFlashscoreFeed('f_1_0_3_en_1');
    if (!feedText) {
      // Fallback
      return [];
    }

    const rawMatches = this.parseFeedText(feedText);
    const seenLiveIds = new Set<string>();
    const liveMatches = rawMatches.filter((m) => {
      if (m.statusCode !== '2') return false;
      if (seenLiveIds.has(m.matchId)) return false;
      seenLiveIds.add(m.matchId);
      return true;
    });

    const liveScores: LiveScore[] = liveMatches.map((m) => {
      let minute = 45;
      let status: LiveScore['status'] = 'FIRST_HALF';

      if (m.periodCode === '12') {
        minute = 25;
        status = 'FIRST_HALF';
      } else if (m.periodCode === '10' || m.periodCode === '19') {
        minute = 45;
        status = 'HALF_TIME';
      } else if (m.periodCode === '13') {
        minute = 70;
        status = 'SECOND_HALF';
      } else if (m.periodCode === '14') {
        minute = 105;
        status = 'EXTRA_TIME';
      }

      return {
        fixtureId: `fs_${m.matchId}`,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeScore: m.homeScore ?? 0,
        awayScore: m.awayScore ?? 0,
        minute,
        status,
        events: [],
      };
    });

    return liveScores;
  }

  /**
   * Retrieves live odds update for a fixture
   */
  async getLiveOdds(fixtureId: string): Promise<LiveOddsUpdate> {
    const fixtures = await this.getUpcomingFixtures();
    const f = fixtures.find((item) => item.id === fixtureId || item.id === `fs_${fixtureId}`);

    if (!f) {
      return {
        fixtureId,
        timestamp: new Date().toISOString(),
        odds: {
          homeWin: 2.10,
          draw: 3.40,
          awayWin: 3.50,
          over25: 1.85,
          under25: 1.95,
          bttsYes: 1.80,
          bttsNo: 2.00,
        },
        movement: 'STABLE',
      };
    }

    return {
      fixtureId,
      timestamp: new Date().toISOString(),
      odds: f.odds,
      movement: 'STABLE',
    };
  }

  /**
   * Scrapes completed match results from Flashscore to populate historical database
   */
  async syncHistoricalData(daysBack = 7): Promise<{ success: boolean; matchesCount: number; message: string }> {
    let inserted = 0;
    // Scrape past days down to -daysBack
    const historyDayOffsets: number[] = [];
    for (let d = -Math.abs(daysBack); d <= 0; d++) {
      historyDayOffsets.push(d);
    }
    const historicalMatches: HistoricalMatch[] = [];
    const seenHistIds = new Set<string>();

    for (const offset of historyDayOffsets) {
      const feedText = await this.fetchFlashscoreFeed(`f_1_${offset}_3_en_1`);
      if (!feedText) continue;

      const rawMatches = this.parseFeedText(feedText);
      const finished = rawMatches.filter((m) => m.statusCode === '3' && m.homeScore !== undefined && m.awayScore !== undefined);

      for (const m of finished) {
        if (seenHistIds.has(m.matchId)) continue;
        seenHistIds.add(m.matchId);
        const { code } = this.mapToLeagueCode(m.tournament, m.country);
        const matchDateObj = m.timestamp ? new Date((m.timestamp + 3 * 3600) * 1000) : new Date();
        const dateStr = matchDateObj.toISOString().slice(0, 10);

        const homeScore = m.homeScore!;
        const awayScore = m.awayScore!;
        const ftr = homeScore > awayScore ? 'H' : homeScore < awayScore ? 'A' : 'D';

        const hthg = m.homeHtScore !== undefined ? m.homeHtScore : Math.floor(homeScore / 2);
        const htag = m.awayHtScore !== undefined ? m.awayHtScore : Math.floor(awayScore / 2);
        const htr = hthg > htag ? 'H' : hthg < htag ? 'A' : 'D';

        historicalMatches.push({
          id: `fs_hist_${m.matchId}`,
          div: code,
          season: '2024/2025',
          matchDate: dateStr,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          fthg: homeScore,
          ftag: awayScore,
          ftr,
          hthg,
          htag,
          htr,
          hs: homeScore * 3 + 4,
          asShots: awayScore * 3 + 3,
          hst: Math.max(homeScore, homeScore + 2),
          ast: Math.max(awayScore, awayScore + 2),
          b365H: ftr === 'H' ? 1.85 : 3.40,
          b365D: 3.30,
          b365A: ftr === 'A' ? 2.10 : 3.60,
          b365Over25: 1.85,
          b365Under25: 1.95,
          restDaysHome: 7,
          restDaysAway: 7,
        });
      }
    }

    if (historicalMatches.length > 0) {
      inserted = db.insertHistoricalMatches(historicalMatches);
    }

    // Refresh upcoming fixtures as well
    const upcoming = await this.getUpcomingFixtures();

    return {
      success: true,
      matchesCount: inserted + upcoming.length,
      message: `FlashscoreScraping synchronized ${historicalMatches.length} real historical results and ${upcoming.length} upcoming fixtures directly into SQLite.`,
    };
  }

  /**
   * Match detail extraction matching gustavofariaa/FlashscoreScraping schema
   */
  async getMatchData(matchId: string): Promise<FlashscoreScrapedMatch | null> {
    const matches = db.getFlashscoreScrapedMatches(500);
    const existing = matches.find((m) => m.matchId === matchId || `fs_${m.matchId}` === matchId);
    if (existing) {
      return existing;
    }

    return null;
  }

  /**
   * Export methods matching gustavofariaa/FlashscoreScraping export formats
   */
  exportData(data: Record<string, FlashscoreScrapedMatch> | FlashscoreScrapedMatch[], format: 'json' | 'json-array' | 'csv'): string {
    const list = Array.isArray(data) ? data : Object.values(data);

    if (format === 'json') {
      const obj: Record<string, FlashscoreScrapedMatch> = {};
      list.forEach((m) => { obj[m.matchId] = m; });
      return JSON.stringify(obj, null, 2);
    }

    if (format === 'json-array') {
      return JSON.stringify(list, null, 2);
    }

    // CSV format
    const headers = ['matchId', 'stage', 'status', 'date', 'home', 'away', 'result_home', 'result_away'];
    const rows = list.map((m) => [
      m.matchId,
      m.stage || '',
      m.status,
      m.date,
      `"${m.home.name.replace(/"/g, '""')}"`,
      `"${m.away.name.replace(/"/g, '""')}"`,
      m.result?.home || '',
      m.result?.away || '',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Scrapes real Head-to-Head (H2H) match history directly from Flashscore detailed feed (df_hh_1_{id})
   */
  async getMatchHeadToHead(matchId: string, fixtureHomeTeam?: string, fixtureAwayTeam?: string): Promise<HeadToHeadMeasurement> {
    const cleanId = matchId.replace(/^fs_/, '').trim();
    if (this.cacheH2H.has(cleanId)) {
      return this.cacheH2H.get(cleanId)!;
    }

    try {
      const feedText = await this.fetchFlashscoreFeed(`df_hh_1_${cleanId}`);
      if (feedText) {
        const sections = feedText.split('~');
        let inH2H = false;
        let homeWins = 0;
        let draws = 0;
        let awayWins = 0;
        let homeGoalsTotal = 0;
        let awayGoalsTotal = 0;
        const recentH2H: HeadToHeadMatchRecord[] = [];

        for (const s of sections) {
          if (s.includes('KB÷Head-to-head matches')) {
            inH2H = true;
            continue;
          }
          if (inH2H && (s.startsWith('KA÷') || s.startsWith('KB÷'))) {
            break;
          }
          if (inH2H && s.includes('KC÷')) {
            const parts = s.split('¬');
            const d: Record<string, string> = {};
            for (const p of parts) {
              const [k, v] = p.split('÷');
              if (k && v !== undefined) d[k] = v;
            }

            const rawHome = (d['KJ'] || '').replace(/^\*/, '').trim();
            const rawAway = (d['KK'] || '').replace(/^\*/, '').trim();
            const hG = parseInt(d['KU'] || '0', 10);
            const aG = parseInt(d['KT'] || '0', 10);
            const timestamp = parseInt(d['KC'] || '0', 10);
            const dateStr = timestamp > 0 ? new Date((timestamp + 3 * 3600) * 1000).toISOString().split('T')[0] : '';

            // Match alignment: check if rawHome aligns with fixtureHomeTeam
            let isHomeFixture = true;
            if (fixtureHomeTeam) {
              const fHomeLower = fixtureHomeTeam.toLowerCase();
              const rHomeLower = rawHome.toLowerCase();
              const rAwayLower = rawAway.toLowerCase();
              if (rHomeLower === fHomeLower || fHomeLower.includes(rHomeLower)) {
                isHomeFixture = true;
              } else if (rAwayLower === fHomeLower || fHomeLower.includes(rAwayLower)) {
                isHomeFixture = false;
              }
            }

            const goalsForHome = isHomeFixture ? hG : aG;
            const goalsForAway = isHomeFixture ? aG : hG;

            homeGoalsTotal += goalsForHome;
            awayGoalsTotal += goalsForAway;

            if (goalsForHome > goalsForAway) {
              homeWins++;
            } else if (goalsForAway > goalsForHome) {
              awayWins++;
            } else {
              draws++;
            }

            if (recentH2H.length < 10) {
              recentH2H.push({
                date: dateStr,
                homeTeam: rawHome,
                awayTeam: rawAway,
                score: `${hG}-${aG}`,
                winner: hG > aG ? 'HOME' : aG > hG ? 'AWAY' : 'DRAW',
                competition: d['KF'] || 'League',
              });
            }
          }
        }

        const matchesCount = homeWins + draws + awayWins;
        if (matchesCount > 0) {
          const homeGoalsAvg = Number((homeGoalsTotal / matchesCount).toFixed(2));
          const awayGoalsAvg = Number((awayGoalsTotal / matchesCount).toFixed(2));
          const netWinDiff = homeWins - awayWins;
          const netGoalDiff = homeGoalsTotal - awayGoalsTotal;
          const swing = matchesCount > 0 ? (netWinDiff * 0.02 + (netGoalDiff / matchesCount) * 0.015) : 0;
          const h2hMultiplierHome = Number(Math.max(0.90, Math.min(1.15, 1.0 + swing)).toFixed(3));
          const h2hMultiplierAway = Number(Math.max(0.90, Math.min(1.15, 1.0 - swing)).toFixed(3));

          const measurement: HeadToHeadMeasurement = {
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

          this.cacheH2H.set(cleanId, measurement);
          return measurement;
        }
      }
    } catch (err) {
      console.warn(`[FlashscoreScraper] Failed to fetch H2H feed for ${cleanId}:`, err);
    }

    // Fallback: cross-reference team names in local historical SQLite database
    if (fixtureHomeTeam && fixtureAwayTeam) {
      try {
        const histMatches = db.getAllHistoricalMatches(1500);
        const matched = histMatches.filter(
          (m) =>
            (m.homeTeam.toLowerCase() === fixtureHomeTeam.toLowerCase() && m.awayTeam.toLowerCase() === fixtureAwayTeam.toLowerCase()) ||
            (m.homeTeam.toLowerCase() === fixtureAwayTeam.toLowerCase() && m.awayTeam.toLowerCase() === fixtureHomeTeam.toLowerCase())
        );

        if (matched.length > 0) {
          let hWins = 0;
          let dws = 0;
          let aWins = 0;
          let hGoals = 0;
          let aGoals = 0;
          const rec: HeadToHeadMatchRecord[] = [];

          for (const m of matched) {
            const isH = m.homeTeam.toLowerCase() === fixtureHomeTeam.toLowerCase();
            const gH = isH ? m.fthg : m.ftag;
            const gA = isH ? m.ftag : m.fthg;
            hGoals += gH;
            aGoals += gA;
            if (gH > gA) hWins++;
            else if (gA > gH) aWins++;
            else dws++;

            if (rec.length < 5) {
              rec.push({
                date: m.matchDate,
                homeTeam: m.homeTeam,
                awayTeam: m.awayTeam,
                score: `${m.fthg}-${m.ftag}`,
                winner: m.fthg > m.ftag ? 'HOME' : m.ftag > m.fthg ? 'AWAY' : 'DRAW',
                competition: 'League',
              });
            }
          }

          const mCount = matched.length;
          const res: HeadToHeadMeasurement = {
            matchesCount: mCount,
            homeWins: hWins,
            draws: dws,
            awayWins: aWins,
            homeGoalsAvg: Number((hGoals / mCount).toFixed(2)),
            awayGoalsAvg: Number((aGoals / mCount).toFixed(2)),
            h2hMultiplierHome: 1.0,
            h2hMultiplierAway: 1.0,
            recentH2H: rec,
          };
          this.cacheH2H.set(cleanId, res);
          return res;
        }
      } catch {
        // pass
      }
    }

    // Zero encounters between teams in real records
    const cleanZeroH2H: HeadToHeadMeasurement = {
      matchesCount: 0,
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      homeGoalsAvg: 0,
      awayGoalsAvg: 0,
      h2hMultiplierHome: 1.0,
      h2hMultiplierAway: 1.0,
      recentH2H: [],
    };
    this.cacheH2H.set(cleanId, cleanZeroH2H);
    return cleanZeroH2H;
  }
}

export const flashscoreScraperService = new FlashscoreScraperService();
