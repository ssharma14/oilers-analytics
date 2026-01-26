import type { Player } from '../../types/hockey';

interface PlayerSelectorProps {
  players: Player[];
  selectedPlayerId: number | null;
  onSelect: (playerId: number) => void;
  label?: string;
  loading?: boolean;
}

export function PlayerSelector({
  players,
  selectedPlayerId,
  onSelect,
  label = 'Select Player',
  loading
}: PlayerSelectorProps) {
  if (loading) {
    return (
      <div className="animate-pulse bg-surface-light rounded-lg h-10 w-48"></div>
    );
  }

  // Group players by position
  const forwards = players.filter(p => ['C', 'L', 'R'].includes(p.positionCode));
  const defensemen = players.filter(p => p.positionCode === 'D');
  const goalies = players.filter(p => p.positionCode === 'G');

  return (
    <div className="relative">
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <select
        value={selectedPlayerId || ''}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="bg-surface border border-surface-light rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-oilers-orange transition-colors min-w-[180px]"
      >
        <option value="">Choose...</option>

        {forwards.length > 0 && (
          <optgroup label="Forwards">
            {forwards.map((player) => (
              <option key={player.id} value={player.id}>
                #{player.sweaterNumber} {player.firstName.default} {player.lastName.default}
              </option>
            ))}
          </optgroup>
        )}

        {defensemen.length > 0 && (
          <optgroup label="Defense">
            {defensemen.map((player) => (
              <option key={player.id} value={player.id}>
                #{player.sweaterNumber} {player.firstName.default} {player.lastName.default}
              </option>
            ))}
          </optgroup>
        )}

        {goalies.length > 0 && (
          <optgroup label="Goalies">
            {goalies.map((player) => (
              <option key={player.id} value={player.id}>
                #{player.sweaterNumber} {player.firstName.default} {player.lastName.default}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}

export default PlayerSelector;
