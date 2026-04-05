// ─────────────────────────────────────────────────────────────────────────────
// Nexus Analytics — Conference Record Predictor
// Monte Carlo simulation, 1000 trials per game.
// Pure functions — no React, no side effects.
// ─────────────────────────────────────────────────────────────────────────────
import type { Player, RosterScenario, ConferenceGame, ConferencePrediction, GamePrediction } from '@/types'
import { projectTeamStats } from '@/lib/projections'
import { sigmoid } from '@/lib/utils'
import { formatRecord } from '@/lib/utils'

// ── Normal distribution random number (Box-Muller transform) ──────────────────
function randomNormal(mean: number, stddev: number): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return mean + stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

/**
 * Predict conference record using Monte Carlo simulation.
 * @param simCount Number of simulations per game (default 1000)
 */
export function predictConferenceRecord(
  scenario: RosterScenario,
  players: Player[],
  schedule: ConferenceGame[],
  simCount: number = 1000
): ConferencePrediction {
  const teamStats = projectTeamStats(scenario, players)

  // Team net rating from projections
  const teamNetRating = teamStats.netRating

  // Win distribution: index = number of wins (0–18)
  const winsDistribution = new Array<number>(schedule.length + 1).fill(0)

  // Per-game predictions
  const gamePredictions: GamePrediction[] = []

  for (const game of schedule) {
    // Convert opponentStrength (0–1) to an opponent net rating
    // opponentStrength=0.5 → netRating=0, strength=1.0 → netRating=+12, strength=0 → netRating=-12
    const opponentNetRating = (game.opponentStrength - 0.5) * 24

    // Location adjustment
    const homeAdv = game.location === 'home' ? 3.5 : game.location === 'away' ? -3.5 : 0

    const adjustedDiff = teamNetRating - opponentNetRating + homeAdv

    // Point estimate win probability
    const winProbability = sigmoid(adjustedDiff / 10)

    // Monte Carlo for confidence interval
    let winCount = 0
    const trialWinPcts: boolean[] = []

    for (let i = 0; i < simCount; i++) {
      const noisyNetRating = randomNormal(teamNetRating, 5)
      const noisyDiff = noisyNetRating - opponentNetRating + homeAdv
      const trialWinProb = sigmoid(noisyDiff / 10)
      const win = Math.random() < trialWinProb
      trialWinPcts.push(win)
      if (win) winCount++
    }

    // P25–P75 confidence interval from trial win outcomes
    // We run 1000 season simulations using per-game win/loss
    const winPct = winCount / simCount
    const stdErr = Math.sqrt((winPct * (1 - winPct)) / simCount)
    const ci: [number, number] = [
      Math.max(0, winProbability - 1.5 * stdErr * 10),
      Math.min(1, winProbability + 1.5 * stdErr * 10),
    ]

    gamePredictions.push({ game, winProbability, confidenceInterval: ci })
  }

  // Season-level Monte Carlo: 1000 full-season simulations
  const seasonWinCounts: number[] = []
  for (let sim = 0; sim < simCount; sim++) {
    let seasonWins = 0
    const noisyTeamRating = randomNormal(teamNetRating, 5)

    for (const game of schedule) {
      const opponentNetRating = (game.opponentStrength - 0.5) * 24
      const homeAdv = game.location === 'home' ? 3.5 : game.location === 'away' ? -3.5 : 0
      const diff = noisyTeamRating - opponentNetRating + homeAdv
      const wp = sigmoid(diff / 10)
      if (Math.random() < wp) seasonWins++
    }
    seasonWinCounts.push(seasonWins)
    winsDistribution[seasonWins]++
  }

  const expectedWins = seasonWinCounts.reduce((a, b) => a + b, 0) / simCount
  const projectedWins = Math.round(expectedWins)
  const projectedLosses = schedule.length - projectedWins

  // Swing games: 3 closest to 50%
  const swingGames = [...gamePredictions]
    .sort((a, b) => Math.abs(a.winProbability - 0.5) - Math.abs(b.winProbability - 0.5))
    .slice(0, 3)

  return {
    games: gamePredictions,
    projectedWins,
    projectedRecord: formatRecord(projectedWins, projectedLosses),
    winsDistribution,
    swingGames,
  }
}
