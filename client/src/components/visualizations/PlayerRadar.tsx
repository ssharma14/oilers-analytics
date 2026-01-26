import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type TooltipItem
} from 'chart.js';
import type { PlayerComparisonData } from '../../types/hockey';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface PlayerRadarProps {
  player1: PlayerComparisonData;
  player2: PlayerComparisonData;
  title?: string;
}

// Normalize values to 0-100 scale for radar chart
function normalizeValue(value: number, max: number): number {
  return Math.min((value / max) * 100, 100);
}

export function PlayerRadar({
  player1,
  player2,
  title = 'Player Comparison'
}: PlayerRadarProps) {
  // Define max values for normalization (based on elite player stats)
  const maxValues = {
    goals: 60,
    assists: 80,
    points: 130,
    shots: 350,
    plusMinus: 50,
    toi: 25 // minutes
  };

  const labels = ['Goals', 'Assists', 'Points', 'Shots', '+/-', 'TOI'];

  const normalizePlayer = (player: PlayerComparisonData) => [
    normalizeValue(player.goals, maxValues.goals),
    normalizeValue(player.assists, maxValues.assists),
    normalizeValue(player.points, maxValues.points),
    normalizeValue(player.shots, maxValues.shots),
    normalizeValue(Math.abs(player.plusMinus) + 25, maxValues.plusMinus), // Shift +/- to positive
    normalizeValue(player.toi, maxValues.toi),
  ];

  const data = {
    labels,
    datasets: [
      {
        label: player1.name,
        data: normalizePlayer(player1),
        backgroundColor: 'rgba(255, 76, 0, 0.3)',
        borderColor: '#FF4C00',
        borderWidth: 2,
        pointBackgroundColor: '#FF4C00',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#FF4C00',
      },
      {
        label: player2.name,
        data: normalizePlayer(player2),
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3b82f6',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9ca3af',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: '#FF4C00',
        borderWidth: 1,
        titleColor: '#FF4C00',
        bodyColor: '#fff',
        padding: 12,
        callbacks: {
          label: (context: TooltipItem<'radar'>) => {
            const player = context.datasetIndex === 0 ? player1 : player2;
            const statIndex = context.dataIndex;
            const stats = [
              player.goals,
              player.assists,
              player.points,
              player.shots,
              player.plusMinus,
              player.toi.toFixed(1) + ' min'
            ];
            return `${context.dataset.label}: ${stats[statIndex]}`;
          },
        },
      },
    },
    scales: {
      r: {
        angleLines: { color: '#252542' },
        grid: { color: '#252542' },
        pointLabels: {
          color: '#9ca3af',
          font: { size: 11 },
        },
        ticks: {
          display: false,
          stepSize: 25,
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-4 text-oilers-orange">{title}</h3>
      <div className="h-72">
        <Radar data={data} options={options} />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <PlayerStatsList player={player1} color="#FF4C00" />
        <PlayerStatsList player={player2} color="#3b82f6" />
      </div>
    </div>
  );
}

function PlayerStatsList({ player, color }: { player: PlayerComparisonData; color: string }) {
  return (
    <div className="text-center">
      <div className="font-semibold mb-2" style={{ color }}>{player.name}</div>
      <div className="text-gray-400 text-xs space-y-1">
        <div>{player.goals}G - {player.assists}A - {player.points}P</div>
        <div>{player.shots} shots | {player.plusMinus > 0 ? '+' : ''}{player.plusMinus}</div>
      </div>
    </div>
  );
}

export default PlayerRadar;
