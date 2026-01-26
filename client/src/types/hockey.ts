// Player types
export interface Player {
  id: number;
  firstName: { default: string };
  lastName: { default: string };
  positionCode: string;
  sweaterNumber: number;
  headshot: string;
}

export interface PlayerStats {
  playerId: number;
  firstName: { default: string };
  lastName: { default: string };
  position: string;
  teamAbbrev: string;
  headshot: string;
  featuredStats?: {
    regularSeason?: {
      subSeason?: SeasonStats;
      career?: SeasonStats;
    };
  };
}

export interface SeasonStats {
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  pim: number;
  gameWinningGoals: number;
  otGoals: number;
  shots: number;
  shootingPctg: number;
  powerPlayGoals: number;
  powerPlayPoints: number;
  shorthandedGoals: number;
  shorthandedPoints: number;
  avgToi?: string;
}

// Game types
export interface Game {
  id: number;
  gameDate: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  gameState: string;
  periodDescriptor?: {
    number: number;
    periodType: string;
  };
}

export interface TeamInfo {
  id: number;
  abbrev: string;
  placeName: { default: string };
  score?: number;
  logo?: string;
}

// Shot types
export interface Shot {
  eventId: number;
  period: number;
  time: string;
  type: 'shot-on-goal' | 'missed-shot' | 'blocked-shot' | 'goal';
  x: number;
  y: number;
  shooterId?: number;
  shooterName?: string;
  shotType?: string;
  xG?: number;
}

// Corsi/Stats types
export interface CorsiData {
  homeCorsi: number;
  awayCorsi: number;
  corsiFor: number;
  corsiAgainst: number;
  corsiPercent: number;
  flow: CorsiFlowPoint[];
}

export interface CorsiFlowPoint {
  period: number;
  time: string;
  timeRemaining: string;
  type: string;
  homeCorsi: number;
  awayCorsi: number;
  differential: number;
}

// xG types
export interface XGLeader {
  name: string;
  goals: number;
  xG: number;
  difference: number;
}

// Team stats
export interface TeamStats {
  teamName: { default: string };
  teamAbbrev: { default: string };
  gamesPlayed: number;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  pointPctg: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifferential: number;
  regulationWins: number;
  regulationPlusOtWins: number;
}

// Player comparison radar
export interface PlayerComparisonData {
  name: string;
  goals: number;
  assists: number;
  points: number;
  shots: number;
  plusMinus: number;
  toi: number;
}
