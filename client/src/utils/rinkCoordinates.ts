// NHL rink dimensions and coordinate transformations
// Standard NHL rink: 200ft x 85ft
// NHL API coordinates: x: -100 to 100, y: -42.5 to 42.5

export const RINK = {
  // Real dimensions (feet)
  WIDTH: 200,
  HEIGHT: 85,

  // SVG dimensions (pixels)
  SVG_WIDTH: 800,
  SVG_HEIGHT: 340,

  // Center ice
  CENTER_X: 100,
  CENTER_Y: 42.5,

  // Goal lines from center
  GOAL_LINE: 89,

  // Blue lines from center
  BLUE_LINE: 25,

  // Face-off circles
  FACE_OFF_RADIUS: 15,

  // Goal crease
  CREASE_RADIUS: 6,

  // Corner radius
  CORNER_RADIUS: 28
};

// Convert NHL API coordinates to SVG coordinates
export function nhlToSvg(x: number, y: number): { x: number; y: number } {
  // NHL API: x ranges from -100 to 100, y ranges from -42.5 to 42.5
  // SVG: x ranges from 0 to SVG_WIDTH, y ranges from 0 to SVG_HEIGHT

  const svgX = ((x + 100) / 200) * RINK.SVG_WIDTH;
  const svgY = ((y + 42.5) / 85) * RINK.SVG_HEIGHT;

  return { x: svgX, y: svgY };
}

// Normalize shots to attacking zone (right side)
export function normalizeToAttackingZone(
  x: number,
  y: number,
): { x: number; y: number } {
  // If shot is in defensive zone (x < 0), flip it to offensive zone
  // This puts all shots on the same side for visualization

  if (x < 0) {
    return { x: -x, y: -y };
  }
  return { x, y };
}

// Get shot color based on result
export function getShotColor(type: string): string {
  switch (type) {
    case 'goal':
      return 'var(--color-chart-goal)'; // Green
    case 'shot-on-goal':
      return 'var(--color-chart-shot)'; // Blue
    case 'missed-shot':
      return 'var(--color-chart-miss)'; // Gray
    case 'blocked-shot':
      return 'var(--color-chart-block)'; // Purple
    default:
      return 'var(--color-chart-miss)';
  }
}

// Get shot radius based on type (goals are bigger)
export function getShotRadius(type: string): number {
  return type === 'goal' ? 8 : 5;
}

// SVG path for half rink (offensive zone view)
export function getHalfRinkPath(): string {
  const w = RINK.SVG_WIDTH / 2;
  const h = RINK.SVG_HEIGHT;
  const cr = (RINK.CORNER_RADIUS / RINK.WIDTH) * RINK.SVG_WIDTH;

  return `
    M 0,${cr}
    L 0,${h - cr}
    Q 0,${h} ${cr},${h}
    L ${w},${h}
    L ${w},0
    L ${cr},0
    Q 0,0 0,${cr}
  `;
}

// Get goal crease path
export function getGoalCreasePath(centerX: number, centerY: number): string {
  const radius = (RINK.CREASE_RADIUS / RINK.WIDTH) * RINK.SVG_WIDTH;
  return `
    M ${centerX - radius},${centerY}
    A ${radius},${radius} 0 0,1 ${centerX + radius},${centerY}
  `;
}

// Calculate time in seconds from period time string (MM:SS)
export function timeToSeconds(time: string, period: number): number {
  const [minutes, seconds] = time.split(':').map(Number);
  const periodSeconds = (period - 1) * 20 * 60;
  return periodSeconds + minutes * 60 + seconds;
}

// Format seconds back to MM:SS
export function secondsToTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
