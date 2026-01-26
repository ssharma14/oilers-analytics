import { useState } from 'react';
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
  useOilersRoster,
  useOilersGames,
  useGameShots,
  useCorsiData,
  useGameScorers,
  useTeamStats,
  usePlayerStats
} from '../../hooks/useNHLData';
import { formatPercent } from '../../utils/statsCalculations';

// Default player IDs (McDavid and Draisaitl)
const MCDAVID_ID = 8478402;
const DRAISAITL_ID = 8477934;

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

  // Fetch data
  const { data: roster, loading: rosterLoading } = useOilersRoster();
  const { data: games, loading: gamesLoading } = useOilersGames();
  const { data: shots } = useGameShots(selectedGameId);
  const { data: corsiData } = useCorsiData(selectedGameId);
  const { data: gameScorers } = useGameScorers(selectedGameId);
  const { data: teamStats } = useTeamStats();

  // Fetch player stats for comparison
  const { data: player1Raw } = usePlayerStats(selectedPlayer1);
  const { data: player2Raw } = usePlayerStats(selectedPlayer2);

  // Transform player data
  const player1Data = transformPlayerData(player1Raw);
  const player2Data = transformPlayerData(player2Raw);

  // Auto-select first game if none selected
  if (!selectedGameId && games && games.length > 0) {
    setSelectedGameId(games[0].id);
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
          loading={gamesLoading}
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
                loading={rosterLoading}
              />
              <PlayerSelector
                players={roster || []}
                selectedPlayerId={selectedPlayer2}
                onSelect={setSelectedPlayer2}
                label="Player 2"
                loading={rosterLoading}
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
