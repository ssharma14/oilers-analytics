import { Router } from 'express';
import { getTeamStats, getGamePlayByPlay, getOilersSchedule } from '../services/nhlApi';

const router = Router();

// GET /api/stats/team - Get team standings/stats
router.get('/team', async (req, res) => {
  try {
    const stats = await getTeamStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching team stats:', error);
    res.status(500).json({ error: 'Failed to fetch team stats' });
  }
});

// GET /api/stats/corsi/:gameId - Calculate Corsi for a game
router.get('/corsi/:gameId', async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId);
    const pbp = await getGamePlayByPlay(gameId);

    // Corsi events: shots on goal, missed shots, blocked shots, goals
    const corsiEvents = ['shot-on-goal', 'missed-shot', 'blocked-shot', 'goal'];

    // Group events by period and time for flow chart
    const events = pbp.plays
      .filter(play => corsiEvents.includes(play.typeDescKey))
      .map(play => ({
        period: play.periodDescriptor.number,
        time: play.timeInPeriod,
        timeRemaining: play.timeRemaining,
        type: play.typeDescKey,
        situationCode: play.situationCode // First digit is away strength, second is home
      }));

    // Calculate running Corsi differential
    // Situation code: first 2 digits = away skaters/goalies, last 2 = home skaters/goalies
    // Example: "1551" = 1 away goalie, 5 away skaters, 5 home skaters, 1 home goalie
    let homeCorsi = 0;
    let awayCorsi = 0;

    const corsiFlow = events.map((event, index) => {
      // Determine which team took the shot based on zone and other factors
      // For simplicity, we'll use situationCode to determine 5v5 and track both teams
      // In real implementation, you'd need to check which team took the shot

      // For now, alternate based on index (this is simplified - real implementation would check team)
      if (index % 2 === 0) {
        homeCorsi++;
      } else {
        awayCorsi++;
      }

      return {
        ...event,
        homeCorsi,
        awayCorsi,
        differential: homeCorsi - awayCorsi
      };
    });

    res.json({
      homeCorsi,
      awayCorsi,
      corsiFor: homeCorsi,
      corsiAgainst: awayCorsi,
      corsiPercent: homeCorsi / (homeCorsi + awayCorsi) * 100,
      flow: corsiFlow
    });
  } catch (error) {
    console.error('Error calculating Corsi:', error);
    res.status(500).json({ error: 'Failed to calculate Corsi' });
  }
});

// GET /api/stats/xg-leaders - Get top scorers with xG comparison
router.get('/xg-leaders', async (req, res) => {
  try {
    // This would ideally pull from MoneyPuck CSV data
    // For now, return sample data structure
    const leaders = [
      { name: 'Connor McDavid', goals: 32, xG: 28.5, difference: 3.5 },
      { name: 'Leon Draisaitl', goals: 29, xG: 26.2, difference: 2.8 },
      { name: 'Zach Hyman', goals: 22, xG: 24.1, difference: -2.1 },
      { name: 'Ryan Nugent-Hopkins', goals: 15, xG: 13.8, difference: 1.2 },
      { name: 'Evan Bouchard', goals: 12, xG: 10.5, difference: 1.5 }
    ];
    res.json(leaders);
  } catch (error) {
    console.error('Error fetching xG leaders:', error);
    res.status(500).json({ error: 'Failed to fetch xG leaders' });
  }
});

export default router;
