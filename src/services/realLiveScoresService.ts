import { LiveScore } from '../providers/types.js';

let cachedScores: LiveScore[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds cache

/**
 * Fetches real-time live soccer scores from the ESPN public soccer scoreboard feed.
 */
export async function fetchRealLiveScores(): Promise<LiveScore[]> {
  const now = Date.now();
  if (cachedScores.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedScores;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; SoccerEngine/1.0)',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`ESPN API returned ${res.status}`);
    }

    const data = await res.json();
    const allEvents: any[] = Array.isArray(data?.events) ? data.events : [];

    // Prioritize in-progress matches
    const inProgressEvents = allEvents.filter((e) => e.status?.type?.state === 'in');
    const targetEvents = inProgressEvents.length > 0
      ? inProgressEvents
      : allEvents.filter((e) => e.status?.type?.state === 'post' || e.status?.type?.state === 'in');

    if (targetEvents.length > 0) {
      const parsedScores: LiveScore[] = targetEvents.slice(0, 15).map((e) => {
        const comp = e.competitions?.[0];
        const homeComp = comp?.competitors?.find((c: any) => c.homeAway === 'home');
        const awayComp = comp?.competitors?.find((c: any) => c.homeAway === 'away');

        const rawClock = e.status?.displayClock || '';
        const numericMinute = parseInt(rawClock.replace(/[^0-9]/g, ''), 10);
        const clock = !isNaN(numericMinute)
          ? numericMinute
          : e.status?.period === 2
          ? 65
          : 30;

        const stateDesc = (e.status?.type?.description || '').toLowerCase();
        let status: LiveScore['status'] = 'FIRST_HALF';
        if (stateDesc.includes('full time') || stateDesc.includes('final') || e.status?.type?.state === 'post') {
          status = 'FINISHED';
        } else if (stateDesc.includes('half time') || stateDesc.includes('halftime')) {
          status = 'HALF_TIME';
        } else if (stateDesc.includes('second') || e.status?.period === 2) {
          status = 'SECOND_HALF';
        } else if (stateDesc.includes('extra')) {
          status = 'EXTRA_TIME';
        }

        const events: LiveScore['events'] = [];
        if (Array.isArray(comp?.details)) {
          comp.details.slice(-3).forEach((d: any) => {
            const min = parseInt((d.clock?.displayValue || '').replace(/[^0-9]/g, ''), 10) || clock;
            const text = (d.type?.text || '').toLowerCase();
            const type = text.includes('goal') ? 'GOAL' : text.includes('card') ? 'CARD' : 'VAR';
            const player = d.athletesInvolved?.[0]?.displayName || d.athlete?.displayName;
            if (player) {
              events.push({
                minute: min,
                type,
                team: d.team?.displayName || '',
                player,
              });
            }
          });
        }

        const homeName =
          homeComp?.team?.shortDisplayName ||
          homeComp?.team?.displayName ||
          homeComp?.team?.name ||
          'Home';
        const awayName =
          awayComp?.team?.shortDisplayName ||
          awayComp?.team?.displayName ||
          awayComp?.team?.name ||
          'Away';

        return {
          fixtureId: `espn_${e.id || Math.random().toString(36).substring(7)}`,
          homeTeam: homeName,
          awayTeam: awayName,
          homeScore: parseInt(homeComp?.score || '0', 10) || 0,
          awayScore: parseInt(awayComp?.score || '0', 10) || 0,
          minute: clock,
          status,
          events: events.length > 0 ? events : undefined,
        };
      });

      if (parsedScores.length > 0) {
        cachedScores = parsedScores;
        lastFetchTime = now;
        return parsedScores;
      }
    }
  } catch (err) {
    // If network fails and cache is available, return cache
    if (cachedScores.length > 0) {
      return cachedScores;
    }
  }

  return cachedScores;
}
