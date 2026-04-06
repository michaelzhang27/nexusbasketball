// ─────────────────────────────────────────────────────────────────────────────
// Nexus Analytics — Fit Score Computation
//
// Formula: linear combination of per-40 stats with position-interpolated coefficients.
//
// Each EvaluationModel stores two coefficient sets:
//   Guard = position 1 (PG endpoint)
//   Big   = position 5 (C endpoint)
//
// For positions 2–4 (SG, SF, PF) coefficients are linearly interpolated.
//
// Penalty stats (fga, fta, turnovers, fouls) are stored as positive importance
// weights in the model and negated here at computation time.
//
// Raw scores are min-max normalized across the full player pool → 0–100.
// "100" means best fit for the active model among all loaded players.
// ─────────────────────────────────────────────────────────────────────────────
import type { Player, EvaluationModel, ModelCoefficients, Position } from '@/types'

// ── Position → interpolation factor ──────────────────────────────────────────
const POSITION_T: Record<Position, number> = {
  PG: 0,    // position 1 — pure Guard endpoint
  SG: 0.25, // position 2
  SF: 0.5,  // position 3 — midpoint
  PF: 0.75, // position 4
  C:  1,    // position 5 — pure Big endpoint
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Interpolate Guard/Big coefficients for any of the 5 positions. */
function getCoeffsForPosition(model: EvaluationModel, position: Position): ModelCoefficients {
  const t = POSITION_T[position] ?? 0.5
  const g = model.coefficients.Guard
  const b = model.coefficients.Big
  return {
    points:    lerp(g.points,    b.points,    t),
    fga:       lerp(g.fga,       b.fga,       t),
    fta:       lerp(g.fta,       b.fta,       t),
    fg3m:      lerp(g.fg3m,      b.fg3m,      t),
    assists:   lerp(g.assists,   b.assists,   t),
    turnovers: lerp(g.turnovers, b.turnovers, t),
    oreb:      lerp(g.oreb,      b.oreb,      t),
    dreb:      lerp(g.dreb,      b.dreb,      t),
    steals:    lerp(g.steals,    b.steals,    t),
    blocks:    lerp(g.blocks,    b.blocks,    t),
    fouls:     lerp(g.fouls,     b.fouls,     t),
  }
}

/** Convert a per-game stat to per-40 minutes. Returns 0 if mpg is 0. */
function per40(statPerGame: number, mpg: number): number {
  if (mpg <= 0) return 0
  return (statPerGame / mpg) * 40
}

/** Raw (un-normalized) fit score for one player given their position's coefficients. */
function computeRawScore(player: Player, coeffs: ModelCoefficients): number {
  const mpg = player.minutesPerGame

  // Per-40 inputs
  const p40points = per40(player.ppg,         mpg)
  const p40fga    = per40(player.fgaPerGame   ?? 0, mpg)
  const p40fta    = per40(player.ftaPerGame   ?? 0, mpg)
  const p40fg3m   = per40(player.fg3mPerGame  ?? 0, mpg)
  const p40ast    = per40(player.apg,               mpg)
  const p40tov    = per40(player.topg,              mpg)
  const p40oreb   = per40(player.orebPerGame  ?? 0, mpg)
  const p40dreb   = per40(player.drebPerGame  ?? 0, mpg)
  const p40stl    = per40(player.spg,               mpg)
  const p40blk    = per40(player.bpg,               mpg)
  const p40fouls  = per40(player.foulsPerGame ?? 0, mpg)

  // Apply formula — penalty stats are negated
  return (
    coeffs.points    *  p40points +
    coeffs.fga       * -p40fga    +
    coeffs.fta       * -p40fta    +
    coeffs.fg3m      *  p40fg3m   +
    coeffs.assists   *  p40ast    +
    coeffs.turnovers * -p40tov    +
    coeffs.oreb      *  p40oreb   +
    coeffs.dreb      *  p40dreb   +
    coeffs.steals    *  p40stl    +
    coeffs.blocks    *  p40blk    +
    coeffs.fouls     * -p40fouls
  )
}

const SCORE_MIN = 40
const SCORE_MAX = 99

/**
 * Compute fit scores for all players, normalized to 40–99 within the pool.
 * The worst player receives 40, the best receives 99, all others scale linearly.
 * Returns a map of playerId → score (integer 40–99).
 */
export function computeAllFitScores(
  players: Player[],
  model: EvaluationModel,
): Record<string, number> {
  if (players.length === 0) return {}

  // 1. Raw scores
  const rawScores: { id: string; raw: number }[] = players.map(p => ({
    id:  p.id,
    raw: computeRawScore(p, getCoeffsForPosition(model, p.position)),
  }))

  // 2. Min-max normalize → 40–99
  const raws = rawScores.map(r => r.raw)
  const min  = Math.min(...raws)
  const max  = Math.max(...raws)
  const range = max - min

  const result: Record<string, number> = {}
  for (const { id, raw } of rawScores) {
    const t = range === 0 ? 0.5 : (raw - min) / range
    result[id] = Math.round(SCORE_MIN + t * (SCORE_MAX - SCORE_MIN))
  }
  return result
}

/**
 * Get the tier label for a fit score.
 */
export function getFitScoreTier(score: number): 'Tier 1' | 'Tier 2' | 'Tier 3' {
  if (score >= 80) return 'Tier 1'
  if (score >= 63) return 'Tier 2'
  return 'Tier 3'
}
