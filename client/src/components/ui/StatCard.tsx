interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

export function StatCard({ label, value, subValue, trend, description }: StatCardProps) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-400'
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→'
  };

  return (
    <div className="stat-card rounded-xl p-4 hover:cursor-default">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-oilers-white">{value}</span>
        {subValue && (
          <span className={`text-sm ${trend ? trendColors[trend] : 'text-gray-400'}`}>
            {trend && trendIcons[trend]} {subValue}
          </span>
        )}
      </div>
      {description && (
        <div className="text-xs text-gray-500 mt-2">{description}</div>
      )}
    </div>
  );
}

export default StatCard;
