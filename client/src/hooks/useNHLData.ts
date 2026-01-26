import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import type { Player, Game, Shot, XGLeader, TeamStats, CorsiData } from '../types/hockey';

const API_BASE = 'https://oilers-analytics-api.onrender.com/api';

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
