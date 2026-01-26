import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TeamTrendsProps {
  data: {
    labels: string[];
    goalsFor: number[];
    goalsAgainst: number[];
    corsiPercent?: number[];
  };
  title?: string;
}

export function TeamTrends({ data, title = 'Team Performance Trends' }: TeamTrendsProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Goals For',
        data: data.goalsFor,
        borderColor: '#FF4C00',
        backgroundColor: 'rgba(255, 76, 0, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#FF4C00',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Goals Against',
        data: data.goalsAgainst,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  // Add Corsi% if available (on secondary Y axis)
  if (data.corsiPercent) {
    chartData.datasets.push({
      label: 'Corsi%',
      data: data.corsiPercent,
      borderColor: '#22c55e',
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#22c55e',
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      // @ts-expect-error - yAxisID for secondary axis
      yAxisID: 'y1',
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9ca3af',
          font: { size: 12 },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: '#FF4C00',
        borderWidth: 1,
        titleColor: '#FF4C00',
        bodyColor: '#fff',
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { color: '#252542' },
        ticks: {
          color: '#9ca3af',
          maxRotation: 45,
          font: { size: 10 },
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: { color: '#252542' },
        ticks: { color: '#9ca3af' },
        title: {
          display: true,
          text: 'Goals',
          color: '#9ca3af',
        },
      },
      ...(data.corsiPercent && {
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          grid: { drawOnChartArea: false },
          ticks: {
            color: '#22c55e',
            callback: (value: string | number) => `${value}%`,
          },
          title: {
            display: true,
            text: 'Corsi%',
            color: '#22c55e',
          },
          min: 40,
          max: 60,
        },
      }),
    },
  };

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold mb-4 text-oilers-orange">{title}</h3>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Rolling 5-game averages for goals and shot attempt differential (Corsi%).
      </p>
    </div>
  );
}

export default TeamTrends;
