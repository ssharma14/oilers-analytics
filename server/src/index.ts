import express from 'express';
import cors from 'cors';
import playersRouter from './routes/players';
import gamesRouter from './routes/games';
import statsRouter from './routes/stats';

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
