import type { Game } from "../../types/hockey";

interface GameSelectorProps {
  games: Game[],
  selectedGameId: number | null;
  onSelect: (gameId: number) => void;
  loading?: boolean;
}

function formatGameLabel(game: Game): string {
  const date = new Date(game.gameDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const isHome = game.homeTeam.abbrev === 'EDM';
  const opponent = isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev;
  const location = isHome ? 'vs' : '@';

  const score = game.homeTeam.score !== undefined
    ? `${game.homeTeam.score}-${game.awayTeam.score}`
    : '';

  return `${date} ${location} ${opponent} ${score}`.trim();
}

export function GameSelector ({ games, selectedGameId, onSelect, loading }: GameSelectorProps) {
  if (loading) {
    return (
      <div className="animate-pulse bg-surface-light rounded-lg h-10 w-64"></div>
    );
  }

  return (
    <select
      value={selectedGameId || ''}
      onChange={(e) => onSelect(Number(e.target.value))}
      className="bg-surface border border-surface-light rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-oilers-orange transition-colors"
    >
      <option value="">Select a game...</option>
      {games.map((game) => (
        <option key={game.id} value={game.id}>
          {formatGameLabel(game)}
        </option>
      ))}
    </select>
  );
}