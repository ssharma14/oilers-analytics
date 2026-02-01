import axios from 'axios';
import NodeCache from 'node-cache';

// Different cache TTLs for different data types
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute default
const CACHE_TTL = {
  roster: 3600,      // 1 hour - roster rarely changes
  teamStats: 900,    // 15 minutes
  schedule: 600,     // 10 minutes
  player: 600,       // 10 minutes
  game: 300,         // 5 minutes - game data more dynamic
};
const NHL_API_BASE = 'https://api-web.nhle.com';
const OILERS_ABBREV = 'EDM';

export interface Player {
  id: number;
  firstName: { default: string };
  lastName: { default: string };
  positionCode: string;
  sweaterNumber: number;
  headshot: string;
}

export interface GameInfo {
  id: number;
  gameDate: string;
  homeTeam: { abbrev: string; score?: number };
  awayTeam: { abbrev: string; score?: number };
  gameState: string;
}

export interface PlayByPlay {
  id: number;
  plays: Play[];
  rosterSpots: RosterSpot[];
}

export interface Play {
  eventId: number;
  periodDescriptor: { number: number; periodType: string };
  timeInPeriod: string;
  timeRemaining: string;
  situationCode: string;
  typeDescKey: string;
  typeCode: number;
  details?: {
    xCoord?: number;
    yCoord?: number;
    shootingPlayerId?: number;
    goalieInNetId?: number;
    shotType?: string;
    scoringPlayerId?: number;
    assist1PlayerId?: number;
    assist2PlayerId?: number;
  };
}

export interface RosterSpot {
  teamId: number;
  playerId: number;
  firstName: { default: string };
  lastName: { default: string };
  sweaterNumber: number;
  positionCode: string;
  headshot: string;
}

// Get cached data or fetch fresh
async function getCachedOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached) return cached;

  const data = await fetchFn();
  if (ttl) {
    cache.set(key, data, ttl);
  } else {
    cache.set(key, data);
  }
  return data;
}

// Get Edmonton Oilers roster
export async function getOilersRoster(): Promise<Player[]> {
  return getCachedOrFetch('oilers-roster', async () => {
    const response = await axios.get(`${NHL_API_BASE}/v1/roster/${OILERS_ABBREV}/current`);
    const roster = [
      ...response.data.forwards,
      ...response.data.defensemen,
      ...response.data.goalies
    ];
    return roster;
  }, CACHE_TTL.roster);
}

// Get player details
export async function getPlayerStats(playerId: number) {
  return getCachedOrFetch(`player-${playerId}`, async () => {
    const response = await axios.get(`${NHL_API_BASE}/v1/player/${playerId}/landing`);
    return response.data;
  });
}

// Get recent Oilers games
export async function getOilersSchedule(season: string = '20252026'): Promise<GameInfo[]> {
  return getCachedOrFetch(`oilers-schedule-${season}`, async () => {
    const response = await axios.get(
      `${NHL_API_BASE}/v1/club-schedule-season/${OILERS_ABBREV}/${season}`
    );
    return response.data.games;
  });
}

// Get play-by-play data for a game
export async function getGamePlayByPlay(gameId: number): Promise<PlayByPlay> {
  return getCachedOrFetch(`game-pbp-${gameId}`, async () => {
    const response = await axios.get(`${NHL_API_BASE}/v1/gamecenter/${gameId}/play-by-play`);
    return response.data;
  });
}

// Get game landing (box score, summary)
export async function getGameLanding(gameId: number) {
  return getCachedOrFetch(`game-landing-${gameId}`, async () => {
    const response = await axios.get(`${NHL_API_BASE}/v1/gamecenter/${gameId}/landing`);
    return response.data;
  });
}

// Get team stats
export async function getTeamStats() {
  return getCachedOrFetch('team-stats', async () => {
    const response = await axios.get(`${NHL_API_BASE}/v1/standings/now`);
    const oilersStats = response.data.standings.find(
      (team: any) => team.teamAbbrev.default === OILERS_ABBREV
    );

    // Map NHL API field names to frontend expected names
    return {
      ...oilersStats,
      goalsFor: oilersStats.goalFor,       // API uses singular
      goalsAgainst: oilersStats.goalAgainst // API uses singular
    };
  }, CACHE_TTL.teamStats);
}

// Extract shots from play-by-play
export function extractShots(pbp: PlayByPlay, teamAbbrev?: string) {
  const shotTypes = ['shot-on-goal', 'missed-shot', 'blocked-shot', 'goal'];

  return pbp.plays
    .filter(play => shotTypes.includes(play.typeDescKey))
    .filter(play => play.details?.xCoord !== undefined && play.details?.yCoord !== undefined)
    .map(play => ({
      eventId: play.eventId,
      period: play.periodDescriptor.number,
      time: play.timeInPeriod,
      type: play.typeDescKey,
      x: play.details!.xCoord!,
      y: play.details!.yCoord!,
      shooterId: play.details?.shootingPlayerId || play.details?.scoringPlayerId,
      shotType: play.details?.shotType
    }));
}
