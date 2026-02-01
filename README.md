# Edmonton Oilers Analytics Dashboard

A real-time hockey analytics dashboard for the Edmonton Oilers, featuring shot maps, player comparisons, game flow visualizations, and team statistics.

**Live Demo:** [sshrishti.com/oilers-analytic](https://sshrishti.com/oilers-analytic/)

![Dashboard Preview](https://img.shields.io/badge/NHL-Oilers-FF4C00?style=for-the-badge&logo=nhl&logoColor=white)

## Features

- **Shot Map** - Interactive visualization of all shots during a game with coordinates on an NHL rink
- **Game Flow** - Corsi differential chart showing momentum throughout the game
- **Player Comparison** - Radar chart comparing two players' stats (goals, assists, points, shots, +/-, TOI)
- **Team Stats** - Current standings, goals for/against, and win-loss record
- **Game Scorers** - Goal scorers breakdown for each game
- **Game Selector** - Browse and analyze recent Oilers games

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- D3.js (shot map visualization)
- Chart.js (charts and graphs)
- Tailwind CSS

### Backend
- Node.js + Express 5
- TypeScript
- node-cache (API response caching)

### Data Source
- [NHL API](https://api-web.nhle.com) - Official NHL statistics and play-by-play data

## Project Structure

```
oilers-analytic/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/     # Dashboard, Header
│   │   │   ├── ui/         # StatCard, Selectors
│   │   │   └── visualizations/  # ShotMap, GameFlow, PlayerRadar
│   │   ├── hooks/          # API data fetching hooks
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Helper functions
│   └── vite.config.ts
│
└── server/                 # Express backend
    ├── src/
    │   ├── routes/         # API endpoints
    │   └── services/       # NHL API wrapper with caching
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository
```bash
git clone https://github.com/ssharma14/oilers-analytics.git
cd oilers-analytics
```

2. Install dependencies
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

3. Start the development servers

```bash
# Terminal 1 - Start backend (runs on port 3001)
cd server && npm run dev

# Terminal 2 - Start frontend (runs on port 5173)
cd client && npm run dev
```

4. Open [http://localhost:5173/oilers-analytic/](http://localhost:5173/oilers-analytic/) in your browser

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/initial` | Combined initial data (roster, games, team stats, player stats) |
| `GET /api/players` | Oilers roster |
| `GET /api/players/:id` | Individual player stats |
| `GET /api/games` | Recent completed games |
| `GET /api/games/:id/shots` | Shot map data for a game |
| `GET /api/games/:id/scorers` | Goal scorers for a game |
| `GET /api/stats/team` | Team standings and stats |
| `GET /api/stats/corsi/:gameId` | Corsi flow data for a game |
| `GET /api/health` | Health check |

## Deployment

### Backend (Render)
The server is deployed on [Render](https://render.com). Push to `main` triggers auto-deploy.

### Frontend
Build the client for production:
```bash
cd client && npm run build
```
The built files will be in `client/dist/`.

## License

MIT

## Author

**Shrishti Sharma** - [sshrishti.com](https://sshrishti.com)
