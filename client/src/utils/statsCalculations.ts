import type { Shot, CorsiFlowPoint } from '../types/hockey';

/**
 * Hockey Analytics Calculations
 *
 * Corsi: All shot attempts (shots on goal + missed shots + blocked shots)
 * Fenwick: Unblocked shot attempts (shots on goal + missed shots)
 * PDO: Shooting percentage + Save percentage (luck indicator, regresses to 100)
 * xG: Expected Goals - probability a shot becomes a goal based on location/type
 */

// Corsi types for calculation
type CorsiEventType = 'shot-on-goal' | 'missed-shot' | 'blocked-shot' | 'goal';
const CORSI_EVENTS: CorsiEventType[] = ['shot-on-goal', 'missed-shot', 'blocked-shot', 'goal'];

// Fenwick excludes blocked shots
type FenwickEventType = 'shot-on-goal' | 'missed-shot' | 'goal';
const FENWICK_EVENTS: FenwickEventType[] = ['shot-on-goal', 'missed-shot', 'goal'];

/**
 * Calculate Corsi For (CF) - all shot attempts by a team
 */
export function calculateCorsiFor(shots: Shot[]): number {
  return shots.filter(shot => CORSI_EVENTS.includes(shot.type as CorsiEventType)).length;
}

/**
 * Calculate Corsi Percentage
 * CF% = CF / (CF + CA) * 100
 */
export function calculateCorsiPercent(corsiFor: number, corsiAgainst: number): number {
  const total = corsiFor + corsiAgainst;
  if (total === 0) return 50;
  return (corsiFor / total) * 100;
}

/**
 * Calculate Fenwick For (FF) - unblocked shot attempts
 */
export function calculateFenwickFor(shots: Shot[]): number {
  return shots.filter(shot => FENWICK_EVENTS.includes(shot.type as FenwickEventType)).length;
}

/**
 * Calculate Fenwick Percentage
 * FF% = FF / (FF + FA) * 100
 */
export function calculateFenwickPercent(fenwickFor: number, fenwickAgainst: number): number {
  const total = fenwickFor + fenwickAgainst;
  if (total === 0) return 50;
  return (fenwickFor / total) * 100;
}

/**
 * Calculate PDO (luck indicator)
 * PDO = Shooting% + Save%
 * Average is 100 (or 1.000 in decimal)
 */
export function calculatePDO(
  goalsFor: number,
  shotsFor: number,
  goalsAgainst: number,
  shotsAgainst: number
): number {
  const shootingPct = shotsFor > 0 ? (goalsFor / shotsFor) * 100 : 0;
  const savePct = shotsAgainst > 0 ? ((shotsAgainst - goalsAgainst) / shotsAgainst) * 100 : 100;
  return shootingPct + savePct;
}

/**
 * Calculate Goals For Percentage
 * GF% = GF / (GF + GA) * 100
 */
export function calculateGoalsForPercent(goalsFor: number, goalsAgainst: number): number {
  const total = goalsFor + goalsAgainst;
  if (total === 0) return 50;
  return (goalsFor / total) * 100;
}

/**
 * Simple xG estimation based on shot distance and angle
 * This is a simplified model - real xG uses ML with many more features
 */
export function estimateXG(x: number, y: number, shotType?: string): number {
  // Distance from center of goal (at x=89, y=0 in NHL coordinates)
  const goalX = 89;
  const goalY = 0;

  const distance = Math.sqrt(Math.pow(Math.abs(x) - goalX, 2) + Math.pow(y - goalY, 2));
  const angle = Math.abs(Math.atan2(y, goalX - Math.abs(x))) * (180 / Math.PI);

  // Base xG decreases with distance
  let xG = Math.max(0, 0.4 - distance * 0.008);

  // Angle adjustment (shots from center are better)
  xG *= 1 - (angle / 90) * 0.5;

  // Shot type adjustments
  if (shotType) {
    const typeMultipliers: Record<string, number> = {
      'slap': 0.9,
      'snap': 1.1,
      'wrist': 1.0,
      'backhand': 0.8,
      'tip-in': 1.3,
      'deflected': 1.2,
      'wrap-around': 0.6
    };
    xG *= typeMultipliers[shotType.toLowerCase()] || 1.0;
  }

  return Math.min(Math.max(xG, 0.01), 0.95);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return value.toFixed(decimals) + '%';
}

/**
 * Format stat value with appropriate precision
 */
export function formatStat(value: number, type: 'percent' | 'decimal' | 'integer'): string {
  switch (type) {
    case 'percent':
      return formatPercent(value);
    case 'decimal':
      return value.toFixed(2);
    case 'integer':
      return Math.round(value).toString();
    default:
      return value.toString();
  }
}

/**
 * Generate Corsi flow data for visualization
 */
export function generateCorsiFlow(
  homeShots: Shot[],
  awayShots: Shot[]
): CorsiFlowPoint[] {
  // Combine and sort all shots by time
  const allShots = [
    ...homeShots.map(s => ({ ...s, team: 'home' as const })),
    ...awayShots.map(s => ({ ...s, team: 'away' as const }))
  ].sort((a, b) => {
    if (a.period !== b.period) return a.period - b.period;
    return a.time.localeCompare(b.time);
  });

  let homeCorsi = 0;
  let awayCorsi = 0;

  return allShots
    .filter(shot => CORSI_EVENTS.includes(shot.type as CorsiEventType))
    .map(shot => {
      if (shot.team === 'home') {
        homeCorsi++;
      } else {
        awayCorsi++;
      }

      return {
        period: shot.period,
        time: shot.time,
        timeRemaining: shot.time, // Would need to calculate
        type: shot.type,
        homeCorsi,
        awayCorsi,
        differential: homeCorsi - awayCorsi
      };
    });
}

/**
 * Calculate rolling average for trend lines
 */
export function rollingAverage(data: number[], window: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    result.push(avg);
  }

  return result;
}
