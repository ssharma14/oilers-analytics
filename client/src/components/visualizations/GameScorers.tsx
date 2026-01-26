import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import type { GameScorer } from '../../hooks/useNHLData';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface GameScorersProps {
  scorers: GameScorer[];
  title?: string;
}

export function GameScorers({ scorers, title = 'Game Goal Scorers' }: GameScorersProps) {
  // Show message if no scorers
  if (scorers.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="text-lg font-semibold mb-4 text-oilers-orange">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Select a game to see goal scorers
        </div>
      </div>
    );
  }

  const data = {
    labels: scorers.map(s => s.name.split(' ').pop()), // Last name only
    datasets: [
      {
        label: 'Goals',
        data: scorers.map(s => s.goals),
        backgroundColor: '#FF4C00',
        borderColor: '#FF4C00',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const, // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: '#FF4C00',
        borderWidth: 1,
        titleColor: '#FF4C00',
        bodyColor: '#fff',
        padding: 12,
        callbacks: {
          title: (context: any) => {
            const idx = context[0].dataIndex;
            return scorers[idx].name;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#252542' },
        ticks: {
          color: '#9ca3af',
          stepSize: 1,
        },
        beginAtZero: true,
      },
      y: {
        grid: { display: false },
        ticks: { color: '#9ca3af' },
      },
    },
  };

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-4 text-oilers-orange">{title}</h3>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Goal scorers in the selected game
      </p>
    </div>
  );
}

export default GameScorers;
