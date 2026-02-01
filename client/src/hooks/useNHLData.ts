import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import type { Player, Game, Shot, XGLeader, TeamStats, CorsiData } from '../types/hockey';

// Use relative URL in development (proxied by Vite), absolute URL in production
const API_BASE = import.meta.env.DEV
  ? '/api'
  : 'https://oilers-analytics-api.onrender.com/api';

// Server connection status
export type ServerStatus = 'connecting' | 'connected' | 'error';

// Hook to wake up the server and track connection status
export function useServerWarmup() {
  const [status, setStatus] = useState<ServerStatus>('connecting');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const maxRetries = 3;

    const pingServer = async () => {
      try {
        await axios.get(`${API_BASE}/health`, { timeout: 60000 }); // 60s timeout for cold start
        if (!cancelled) setStatus('connected');
      } catch (error) {
        if (!cancelled) {
          if (retryCount < maxRetries) {
            setRetryCount(prev => prev + 1);
            // Retry after a short delay
            setTimeout(pingServer, 2000);
          } else {
            setStatus('error');
          }
        }
      }
    };

    pingServer();
    return () => { cancelled = true; };
  }, [retryCount]);

  return { status, retryCount };
}

// Interface for combined initial data response
interface InitialData {
  roster: Player[];
  games: Game[];
  teamStats: TeamStats;
  player1Stats: any;
  player2Stats: any;
}

// Hook to fetch all initial data in one request
export function useInitialData(player1Id: number, player2Id: number) {
  const [data, setData] = useState<InitialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/initial`, {
          params: { player1: player1Id, player2: player2Id },
          timeout: 90000, // 90s timeout for cold start + data fetch
        });
        if (!cancelled) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInitialData();
    return () => { cancelled = true; };
  }, [player1Id, player2Id]);

  return { data, loading, error };
}

// Generic hook for API calls with loading/error states
function useApiCall<T>(
  fetchFn: () => Promise<T>,
  deps: readonly unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// Hook for Oilers roster
export function useOilersRoster() {
  return useApiCall<Player[]>(
    async () => {
      const response = await axios.get(`${API_BASE}/players`);
      return response.data;
    },
    []
  );
}

// Hook for recent games
export function useOilersGames(season?: string) {
  return useApiCall<Game[]>(
    async () => {
      const params = season ? `?season=${season}` : '';
      const response = await axios.get(`${API_BASE}/games${params}`);
      return response.data;
    },
    [season]
  );
}

// Hook for game shots
export function useGameShots(gameId: number | null) {
  return useApiCall<Shot[]>(
    async () => {
      if (!gameId) return [];
      const response = await axios.get(`${API_BASE}/games/${gameId}/shots`);
      return response.data;
    },
    [gameId]
  );
}

// Hook for Corsi data
export function useCorsiData(gameId: number | null) {
  return useApiCall<CorsiData>(
    async () => {
      if (!gameId) return { homeCorsi: 0, awayCorsi: 0, corsiFor: 0, corsiAgainst: 0, corsiPercent: 50, flow: [] };
      const response = await axios.get(`${API_BASE}/stats/corsi/${gameId}`);
      return response.data;
    },
    [gameId]
  );
}

// Hook for xG leaders
export function useXGLeaders() {
  return useApiCall<XGLeader[]>(
    async () => {
      const response = await axios.get(`${API_BASE}/stats/xg-leaders`);
      return response.data;
    },
    []
  );
}

// Hook for team stats
export function useTeamStats() {
  return useApiCall<TeamStats>(
    async () => {
      const response = await axios.get(`${API_BASE}/stats/team`);
      return response.data;
    },
    []
  );
}

// Hook for player stats
export function usePlayerStats(playerId: number | null) {
  return useApiCall(
    async () => {
      if (!playerId) return null;
      const response = await axios.get(`${API_BASE}/players/${playerId}`);
      return response.data;
    },
    [playerId]
  );
}

// Hook for game scorers
export interface GameScorer {
  name: string;
  goals: number;
  teamId?: number;
}

export function useGameScorers(gameId: number | null) {
  return useApiCall<GameScorer[]>(
    async () => {
      if (!gameId) return [];
      const response = await axios.get(`${API_BASE}/games/${gameId}/scorers`);
      return response.data;
    },
    [gameId]
  );
}

export default {
  useOilersRoster,
  useOilersGames,
  useGameShots,
  useCorsiData,
  useXGLeaders,
  useTeamStats,
  usePlayerStats,
  useGameScorers
};
