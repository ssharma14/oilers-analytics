import express from 'express';
import cors from 'cors';
import playersRouter from './routes/players';
import gamesRouter from './routes/games';
import statsRouter from './routes/stats';
import { getOilersRoster, getTeamStats, getOilersSchedule, getPlayerStats } from './services/nhlApi';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - restrict to allowed origins in production
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3001', 'https://sshrishti.com', 'https://www.sshrishti.com'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/players', playersRouter);
app.use('/api/games', gamesRouter);
app.use('/api/stats', statsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Combined initial data endpoint - fetches all data needed on page load in one request
// This significantly reduces cold-start impact by batching all initial API calls
app.get('/api/initial', async (req, res) => {
  try {
    const season = (req.query.season as string) || '20252026';
    const player1Id = parseInt(req.query.player1 as string) || 8478402; // McDavid
    const player2Id = parseInt(req.query.player2 as string) || 8477934; // Draisaitl

    // Fetch all initial data in parallel
    const [roster, teamStats, scheduleData, player1Stats, player2Stats] = await Promise.all([
      getOilersRoster(),
      getTeamStats(),
      getOilersSchedule(season),
      getPlayerStats(player1Id),
      getPlayerStats(player2Id),
    ]);

    // Filter to completed games only
    const completedGames = scheduleData
      .filter((game: any) => game.gameState === 'OFF' || game.gameState === 'FINAL')
      .slice(-20)
      .reverse();

    res.json({
      roster,
      teamStats,
      games: completedGames,
      player1Stats,
      player2Stats,
    });
  } catch (error) {
    console.error('Error fetching initial data:', error);
    res.status(500).json({ error: 'Failed to fetch initial data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
