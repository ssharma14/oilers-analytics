import { Router } from 'express';
import { getOilersRoster, getPlayerStats } from '../services/nhlApi';

const router = Router();

// GET /api/players - Get Oilers roster
router.get('/', async (req, res) => {
  try {
    const roster = await getOilersRoster();
    res.json(roster);
  } catch (error) {
    console.error('Error fetching roster:', error);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

// GET /api/players/:id - Get specific player stats
router.get('/:id', async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const player = await getPlayerStats(playerId);
    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

export default router;
