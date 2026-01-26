import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem
} from 'chart.js';
import type { XGLeader } from '../../types/hockey';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface XGChartProps {
  leaders: XGLeader[];
  title?: string;
}

export function XGChart({ leaders, title = 'Goals vs Expected Goals (xG)' }: XGChartProps) {
  const data = {
    labels: leaders.map(l => l.name.split(' ').pop()), // Last name only
    datasets: [
      {
        label: 'Actual Goals',
        data: leaders.map(l => l.goals),
        backgroundColor: '#FF4C00',
        borderColor: '#FF4C00',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Expected Goals (xG)',
        data: leaders.map(l => l.xG),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 4,
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
          afterBody: (context: TooltipItem<'bar'>[]) => {
            const idx = context[0].dataIndex;
            const leader = leaders[idx];
            const diff = leader.difference;
            return `Difference: ${diff > 0 ? '+' : ''}${diff.toFixed(1)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#252542' },
        ticks: { color: '#9ca3af' },
      },
      y: {
        grid: { color: '#252542' },
        ticks: { color: '#9ca3af' },
        beginAtZero: true,
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
        Players scoring above xG are "finishing" well. Below xG may regress or be unlucky.
      </p>
    </div>
  );
}

export default XGChart;
