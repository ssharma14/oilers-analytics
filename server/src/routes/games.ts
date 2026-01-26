import { Router } from 'express';
import { getOilersSchedule, getGamePlayByPlay, getGameLanding, extractShots } from '../services/nhlApi';

const router = Router();

// GET /api/games - Get Oilers schedule
router.get('/', async (req, res) => {
  try {
    const season = (req.query.season as string) || '20252026';
    const games = await getOilersSchedule(season);

    // Filter to only completed games and sort by date descending
    const completedGames = games
      .filter((game: any) => game.gameState === 'OFF' || game.gameState === 'FINAL')
      .sort((a: any, b: any) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime())
      .slice(0, 20); // Last 20 games

    res.json(completedGames);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// GET /api/games/:id - Get specific game details
router.get('/:id', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const landing = await getGameLanding(gameId);
    res.json(landing);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// GET /api/games/:id/shots - Get shots for a game
router.get('/:id/shots', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const pbp = await getGamePlayByPlay(gameId);
    const shots = extractShots(pbp);

    // Get roster info for player names
    const rosterMap = new Map(
      pbp.rosterSpots.map(player => [
        player.playerId,
        `${player.firstName.default} ${player.lastName.default}`
      ])
    );

    const shotsWithNames = shots.map(shot => ({
      ...shot,
      shooterName: rosterMap.get(shot.shooterId || 0) || 'Unknown'
    }));

    res.json(shotsWithNames);
  } catch (error) {
    console.error('Error fetching shots:', error);
    res.status(500).json({ error: 'Failed to fetch shots' });
  }
});

// GET /api/games/:id/play-by-play - Get full play-by-play
router.get('/:id/play-by-play', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const pbp = await getGamePlayByPlay(gameId);
    res.json(pbp);
  } catch (error) {
    console.error('Error fetching play-by-play:', error);
    res.status(500).json({ error: 'Failed to fetch play-by-play' });
  }
});

// GET /api/games/:id/scorers - Get goal scorers for a game
router.get('/:id/scorers', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const pbp = await getGamePlayByPlay(gameId);

    // Build roster map for player names
    const rosterMap = new Map(
      pbp.rosterSpots.map(player => [
        player.playerId,
        {
          name: `${player.firstName.default} ${player.lastName.default}`,
          teamId: player.teamId
        }
      ])
    );

    // Extract goals from play-by-play
    const goals = pbp.plays
      .filter(play => play.typeDescKey === 'goal')
      .map(play => {
        const scorerId = play.details?.scoringPlayerId;
        const playerInfo = rosterMap.get(scorerId || 0);
        return {
          scorerId,
          name: playerInfo?.name || 'Unknown',
          teamId: playerInfo?.teamId,
          period: play.periodDescriptor.number,
          time: play.timeInPeriod
        };
      });

    // Oilers team ID
    const OILERS_TEAM_ID = 22;

    // Filter to only Oilers goals
    const oilersGoals = goals.filter(goal => goal.teamId === OILERS_TEAM_ID);

    // Count goals per player
    const scorerCounts = oilersGoals.reduce((acc, goal) => {
      const key = goal.name;
      if (!acc[key]) {
        acc[key] = { name: goal.name, goals: 0, teamId: goal.teamId };
      }
      acc[key].goals++;
      return acc;
    }, {} as Record<string, { name: string; goals: number; teamId?: number }>);

    // Convert to array and sort by goals descending
    const scorers = Object.values(scorerCounts)
      .sort((a, b) => b.goals - a.goals);

    res.json(scorers);
  } catch (error) {
    console.error('Error fetching scorers:', error);
    res.status(500).json({ error: 'Failed to fetch scorers' });
  }
});

export default router;
