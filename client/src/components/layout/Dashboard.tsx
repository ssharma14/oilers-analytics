import { useState, useEffect } from 'react';
import { Header } from './Header';
import { ShotMap } from '../visualizations/ShotMap';
import { GameFlow } from '../visualizations/GameFlow';
import { GameScorers } from '../visualizations/GameScorers';
import { PlayerRadar } from '../visualizations/PlayerRadar';
import { TeamTrends } from '../visualizations/TeamTrends';
import { StatCard } from '../ui/StatCard';
import { GameSelector } from '../ui/GameSelector';
import { PlayerSelector } from '../ui/PlayerSelector';
import {
  useInitialData,
  useGameShots,
  useCorsiData,
  useGameScorers,
  usePlayerStats
} from '../../hooks/useNHLData';
import { formatPercent } from '../../utils/statsCalculations';

// Default player IDs (McDavid and Draisaitl)
const MCDAVID_ID = 8478402;
const DRAISAITL_ID = 8477934;

// Loading screen component
function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="text-center">
        {/* Oilers logo placeholder / spinner */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-oilers-orange animate-pulse flex items-center justify-center">
          <svg className="w-12 h-12 text-oilers-navy animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Edmonton Oilers Analytics</h2>
        <p className="text-gray-400 mb-4">{message}</p>
        <div className="flex justify-center gap-1">
          <div className="w-2 h-2 bg-oilers-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-oilers-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-oilers-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-gray-500 text-sm mt-6">
          First load may take up to 60 seconds while the server wakes up
        </p>
      </div>
    </div>
  );
}

// Type for NHL API player landing response
interface NHLPlayerResponse {
  firstName: { default: string };
  lastName: { default: string };
  featuredStats?: {
    regularSeason?: {
      subSeason?: {
        goals?: number;
        assists?: number;
        points?: number;
        shots?: number;
        plusMinus?: number;
      };
    };
  };
  careerTotals?: {
    regularSeason?: {
      avgToi?: string;
    };
  };
}

// Helper to transform NHL API player data to PlayerComparisonData format
function transformPlayerData(playerData: NHLPlayerResponse | null): { name: string; goals: number; assists: number; points: number; shots: number; plusMinus: number; toi: number } | null {
  if (!playerData?.featuredStats?.regularSeason?.subSeason) return null;

  const stats = playerData.featuredStats.regularSeason.subSeason;
  const avgToi = playerData.careerTotals?.regularSeason?.avgToi || '20:00';

  // Parse TOI string (e.g., "21:49") to decimal minutes
  const [minutes, seconds] = avgToi.split(':').map(Number);
  const toiDecimal = minutes + (seconds / 60);

  return {
    name: `${playerData.firstName.default} ${playerData.lastName.default}`,
    goals: stats.goals || 0,
    assists: stats.assists || 0,
    points: stats.points || 0,
    shots: stats.shots || 0,
    plusMinus: stats.plusMinus || 0,
    toi: toiDecimal
  };
}

export function Dashboard() {
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [selectedPlayer1, setSelectedPlayer1] = useState<number | null>(MCDAVID_ID);
  const [selectedPlayer2, setSelectedPlayer2] = useState<number | null>(DRAISAITL_ID);

  // Fetch all initial data in one request (roster, games, teamStats, default player stats)
  const { data: initialData, loading: initialLoading, error: initialError } = useInitialData(MCDAVID_ID, DRAISAITL_ID);

  // Extract data from combined response
  const roster = initialData?.roster || null;
  const games = initialData?.games || null;
  const teamStats = initialData?.teamStats || null;

  // Fetch game-specific data (only after a game is selected)
  const { data: shots } = useGameShots(selectedGameId);
  const { data: corsiData } = useCorsiData(selectedGameId);
  const { data: gameScorers } = useGameScorers(selectedGameId);

  // Fetch player stats - use initial data for default players, fetch fresh for changed selections
  const { data: player1Raw } = usePlayerStats(
    selectedPlayer1 !== MCDAVID_ID ? selectedPlayer1 : null
  );
  const { data: player2Raw } = usePlayerStats(
    selectedPlayer2 !== DRAISAITL_ID ? selectedPlayer2 : null
  );

  // Use initial data for default players, or fetched data for changed selections
  const player1StatsRaw = selectedPlayer1 === MCDAVID_ID ? initialData?.player1Stats : player1Raw;
  const player2StatsRaw = selectedPlayer2 === DRAISAITL_ID ? initialData?.player2Stats : player2Raw;

  // Transform player data
  const player1Data = transformPlayerData(player1StatsRaw);
  const player2Data = transformPlayerData(player2StatsRaw);

  // Auto-select first game if none selected
  useEffect(() => {
    if (!selectedGameId && games && games.length > 0) {
      setSelectedGameId(games[0].id);
    }
  }, [games, selectedGameId]);

  // Show loading screen while initial data loads
  if (initialLoading) {
    return <LoadingScreen message="Connecting to server and loading data..." />;
  }

  // Show error screen
  if (initialError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-4">{initialError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-oilers-orange text-white rounded hover:bg-orange-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Fallback data while loading
  const defaultPlayer1 = { name: 'Loading...', goals: 0, assists: 0, points: 0, shots: 0, plusMinus: 0, toi: 0 };
  const defaultPlayer2 = { name: 'Loading...', goals: 0, assists: 0, points: 0, shots: 0, plusMinus: 0, toi: 0 };

  // Sample trend data
  const trendData = {
    labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5', 'Game 6', 'Game 7', 'Game 8', 'Game 9', 'Game 10'],
    goalsFor: [4, 3, 5, 2, 4, 6, 3, 4, 5, 3],
    goalsAgainst: [2, 4, 3, 1, 3, 2, 4, 3, 2, 4],
    corsiPercent: [52, 48, 55, 51, 49, 54, 50, 53, 51, 52]
  };

  return (
    <div className="min-h-screen bg-background">
      <Header>
        <GameSelector
          games={games || []}
          selectedGameId={selectedGameId}
          onSelect={setSelectedGameId}
          loading={false}
        />
      </Header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Record"
            value={teamStats ? `${teamStats.wins}-${teamStats.losses}-${teamStats.otLosses}` : '--'}
            subValue={teamStats ? `${teamStats.points} pts` : ''}
            description="Wins-Losses-OTL"
          />
          <StatCard
            label="Goals For"
            value={teamStats?.goalsFor || '--'}
            subValue={teamStats ? `${(teamStats.goalsFor / teamStats.gamesPlayed).toFixed(2)} GPG` : ''}
            trend="up"
            description="Total / Per Game"
          />
          <StatCard
            label="Goals Against"
            value={teamStats?.goalsAgainst || '--'}
            subValue={teamStats ? `${(teamStats.goalsAgainst / teamStats.gamesPlayed).toFixed(2)} GPG` : ''}
            trend="down"
            description="Total / Per Game"
          />
          <StatCard
            label="Corsi%"
            value={corsiData ? formatPercent(corsiData.corsiPercent, 1) : '--'}
            subValue={corsiData && corsiData.corsiPercent > 50 ? 'Above avg' : 'Below avg'}
            trend={corsiData && corsiData.corsiPercent > 50 ? 'up' : 'down'}
            description="Shot attempt share (50% is average)"
          />
        </section>

        {/* Main Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Shot Map */}
          <ShotMap
            shots={shots || []}
            title={selectedGameId ? 'Shot Map' : 'Select a game to view shots'}
          />

          {/* Game Scorers */}
          <div className="space-y-6">
            <GameScorers
              scorers={gameScorers || []}
              title="Game Goal Scorers"
            />
          </div>
        </div>

        {/* Game Flow - Full Width */}
        <section className="mb-6">
          <GameFlow
            data={corsiData?.flow || []}
            homeTeam="EDM"
            awayTeam="OPP"
            title="Game Flow (Corsi Differential)"
          />
        </section>

        {/* Bottom Row - Player Comparison & Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Player Comparison */}
          <div>
            <div className="flex gap-4 mb-4">
              <PlayerSelector
                players={roster || []}
                selectedPlayerId={selectedPlayer1}
                onSelect={setSelectedPlayer1}
                label="Player 1"
                loading={false}
              />
              <PlayerSelector
                players={roster || []}
                selectedPlayerId={selectedPlayer2}
                onSelect={setSelectedPlayer2}
                label="Player 2"
                loading={false}
              />
            </div>
            <PlayerRadar
              player1={player1Data || defaultPlayer1}
              player2={player2Data || defaultPlayer2}
              title="Player Comparison"
            />
          </div>

          {/* Team Trends */}
          <TeamTrends
            data={trendData}
            title="Recent Performance (Last 10 Games)"
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-surface-light text-center text-gray-500 text-sm">
          <p>
            Data sourced from NHL API | Built with React, D3.js, Chart.js
          </p>
          <p className="mt-1">
            Created by{' '}
            <a
              href="https://sshrishti.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-oilers-orange hover:underline"
            >
              Shrishti
            </a>
            {' '}| Hockey Analytics Portfolio Project
          </p>
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
