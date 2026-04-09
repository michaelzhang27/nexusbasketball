// ─────────────────────────────────────────────────────────────────────────────
// Nexus Analytics — Stat Projection Functions
// Pure functions — no React, no side effects.
// Post-beta seam: replace function bodies with calls to the Python ML service.
// ─────────────────────────────────────────────────────────────────────────────
import type { Player, PlayerStats, RosterScenario, ProjectedTeamStats, EvaluationModel } from '@/types'
import { computeAllFitScores } from '@/lib/fitScore'
import { PROGRAM_PACE } from '@/data/conference'

// Origin school pace by conference (possessions per game)
const CONFERENCE_PACE: Record<string, number> = {
  'Big 12':      72,
  'SEC':         68,
  'Big Ten':     66,
  'Big East':    71,
  'ACC':         70,
  'Mountain West': 73,
  'WCC':         74,
  'Atlantic 10': 70,
  'MCC':         70,
}

// Conference tier for strength adjustment
const POWER_CONFERENCES = new Set(['SEC', 'Big Ten', 'Big 12', 'ACC', 'Big East'])
const MID_MAJOR_CONFERENCES = new Set(['Mountain West', 'WCC', 'Atlantic 10', 'MCC'])

function getConferencePace(conference: string): number {
  return CONFERENCE_PACE[conference] ?? 70
}

function getConferenceAdjustment(fromConf: string, toConf: string): number {
  const fromPower = POWER_CONFERENCES.has(fromConf)
  const toPower = POWER_CONFERENCES.has(toConf)
  const fromMid = MID_MAJOR_CONFERENCES.has(fromConf)
  const toMid = MID_MAJOR_CONFERENCES.has(toConf)

  if (fromMid && toPower) return 0.95  // moving up: -5%
  if (fromPower && toMid) return 1.05  // moving down: +5%
  return 1.0
}

/**
 * Compute the available usage in a scenario (how much usage is taken by others).
 * Returns a multiplier for this player's counting stats.
 */
function computeUsageMultiplier(player: Player, scenario: RosterScenario, allPlayers: Player[]): number {
  // Count how many high-usage players (usage > 25%) are in the lineup
  const filledPlayerIds = scenario.slots
    .map(s => s.playerId)
    .filter((id): id is string => id !== null && id !== player.id)

  const playerMap = new Map(allPlayers.map(p => [p.id, p]))

  const primaryOptions = filledPlayerIds
    .map(id => playerMap.get(id))
    .filter((p): p is Player => p !== undefined)
    .filter(p => p.usagePct > 25).length

  // If 2+ primary options in lineup, scale down this player's usage contribution
  if (primaryOptions >= 2 && player.usagePct > 25) return 0.88
  if (primaryOptions >= 3 && player.usagePct > 20) return 0.82
  return 1.0
}

/**
 * Get all player IDs in a scenario's roster.
 * Uses rosterGroups if populated, falls back to slots.
 */
export function getRosterPlayerIds(scenario: RosterScenario): string[] {
  if (scenario.rosterGroups && scenario.rosterGroups.some(g => g.playerIds.length > 0)) {
    const all: string[] = []
    for (const g of scenario.rosterGroups) {
      for (const id of g.playerIds) {
        if (!all.includes(id)) all.push(id)
      }
    }
    return all
  }
  return scenario.slots.filter(s => s.playerId !== null).map(s => s.playerId!)
}

/**
 * Auto-distribute exactly 200 expected minutes across roster players,
 * ranked by fit score (best players get the most minutes).
 * Guarantees: sum of midpoints == 200, each player gets 5–40 min.
 */
export function autoAssignMinutes(
  playerIds: string[],
  allPlayers: Player[],
  model: import('@/types').EvaluationModel
): Record<string, import('@/types').MinuteRange> {
  if (playerIds.length === 0) return {}

  const TOTAL = 200
  const MIN_MPG = 5
  const MAX_MPG = 40

  const playerMap = new Map(allPlayers.map(p => [p.id, p]))
  const players = playerIds
    .map(id => playerMap.get(id))
    .filter((p): p is Player => p !== undefined)

  // Sort best → worst by fit score so minutes flow down the ranking
  const scoreMap = computeAllFitScores(players, model)
  const sorted = [...players].sort(
    (a, b) => (scoreMap[b.id] ?? 0) - (scoreMap[a.id] ?? 0)
  )

  const scores = sorted.map(p => Math.max(1, scoreMap[p.id] ?? 1))
  const totalScore = scores.reduce((s, x) => s + x, 0)

  // Proportional allocation, clamped per-player
  const assigned: number[] = scores.map(s =>
    Math.min(MAX_MPG, Math.max(MIN_MPG, Math.round((s / totalScore) * TOTAL)))
  )

  // ── Guarantee sum == TOTAL ────────────────────────────────────────────────
  // Pass 1: if over budget, shave from lowest-ranked (worst) players first
  let sum = assigned.reduce((a, b) => a + b, 0)
  for (let i = assigned.length - 1; i >= 0 && sum > TOTAL; i--) {
    const cut = Math.min(assigned[i] - MIN_MPG, sum - TOTAL)
    assigned[i] -= cut
    sum -= cut
  }

  // Pass 2: if under budget, add to highest-ranked (best) players first
  for (let i = 0; i < assigned.length && sum < TOTAL; i++) {
    const add = Math.min(MAX_MPG - assigned[i], TOTAL - sum)
    assigned[i] += add
    sum += add
  }

  // Build result — MinuteRange midpoint == assigned value, ±4 spread
  const result: Record<string, import('@/types').MinuteRange> = {}
  for (let i = 0; i < sorted.length; i++) {
    const exp = assigned[i]
    result[sorted[i].id] = {
      min: Math.max(0, exp - 4),
      max: Math.min(40, exp + 4),
    }
  }
  return result
}

/**
 * Project a player's stats at Lakewood University given the current scenario.
 * Minutes-adjusted: counting stats scale with projected MPG vs actual MPG.
 */
export function projectPlayerStats(
  player: Player,
  scenario: RosterScenario,
  allPlayers: Player[]
): PlayerStats {
  const originPace = getConferencePace(player.conference)
  const paceMultiplier = PROGRAM_PACE / originPace

  // Conference adjustment (Lakewood is MCC)
  const confMultiplier = getConferenceAdjustment(player.conference, 'MCC')

  // Usage multiplier only affects counting stats
  const usageMultiplier = computeUsageMultiplier(player, scenario, allPlayers)

  // Minutes adjustment: scale counting stats by projected/actual MPG
  const actualMPG = player.minutesPerGame > 0 ? player.minutesPerGame : 25
  const minuteEntry = scenario.playerMinutes[player.id]
  const projectedMPG = minuteEntry
    ? (minuteEntry.min + minuteEntry.max) / 2
    : actualMPG
  const minutesMultiplier = projectedMPG / actualMPG

  const countingMultiplier = paceMultiplier * confMultiplier * usageMultiplier * minutesMultiplier

  return {
    ppg:           parseFloat((player.ppg * countingMultiplier).toFixed(1)),
    rpg:           parseFloat((player.rpg * countingMultiplier).toFixed(1)),
    apg:           parseFloat((player.apg * countingMultiplier).toFixed(1)),
    spg:           parseFloat((player.spg * paceMultiplier * minutesMultiplier).toFixed(1)),
    bpg:           parseFloat((player.bpg * paceMultiplier * minutesMultiplier).toFixed(1)),
    topg:          parseFloat((player.topg * countingMultiplier).toFixed(1)),
    // Efficiency stats are NOT pace-adjusted (they're rates, not counts)
    fgPct:         player.fgPct,
    fg3Pct:        player.fg3Pct,
    ftPct:         player.ftPct,
    efgPct:        player.efgPct,
    tsPct:         player.tsPct,
    usagePct:      parseFloat((player.usagePct * usageMultiplier).toFixed(1)),
    ortg:          player.ortg,
    drtg:          player.drtg,
    bpm:           player.bpm,
    winShares:     parseFloat((player.winShares * countingMultiplier).toFixed(1)),
    per:           player.per,
    minutesPerGame: parseFloat(projectedMPG.toFixed(1)),
    fgaPerGame:    player.fgaPerGame   !== undefined ? parseFloat((player.fgaPerGame  * countingMultiplier).toFixed(1)) : undefined,
    ftaPerGame:    player.ftaPerGame   !== undefined ? parseFloat((player.ftaPerGame  * countingMultiplier).toFixed(1)) : undefined,
    fg3mPerGame:   player.fg3mPerGame  !== undefined ? parseFloat((player.fg3mPerGame * countingMultiplier).toFixed(1)) : undefined,
    orebPerGame:   player.orebPerGame  !== undefined ? parseFloat((player.orebPerGame * countingMultiplier).toFixed(1)) : undefined,
    drebPerGame:   player.drebPerGame  !== undefined ? parseFloat((player.drebPerGame * countingMultiplier).toFixed(1)) : undefined,
    foulsPerGame:  player.foulsPerGame !== undefined ? parseFloat((player.foulsPerGame * paceMultiplier * minutesMultiplier).toFixed(1)) : undefined,
  }
}

/**
 * Project aggregated team stats for the active scenario.
 * When mlPredictions are provided (after "Run Predictions"), each player's
 * counting stats are sourced from the ML output so team totals match the
 * Projected Box Score. Rate stats (FG%, 3P%, ORTG, DRTG) still come from
 * the heuristic since the ML model doesn't project efficiency metrics.
 */
export function projectTeamStats(
  scenario: RosterScenario,
  allPlayers: Player[],
  mlPredictions?: Record<string, import('@/types').MLPrediction>
): ProjectedTeamStats {
  const playerMap = new Map(allPlayers.map(p => [p.id, p]))

  const rosterIds = getRosterPlayerIds(scenario)
  const activePlayers = rosterIds
    .map(id => playerMap.get(id))
    .filter((p): p is Player => p !== undefined)

  if (activePlayers.length === 0) {
    return getDefaultTeamStats()
  }

  const projections = activePlayers.map(p => {
    const heuristic = projectPlayerStats(p, scenario, allPlayers)
    const ml = mlPredictions?.[p.id]
    const mlValid = ml && ml.total_rebounds !== undefined && ml.fg_pct !== undefined
    if (!mlValid) return heuristic
    // Use ML counting stats so team totals match the Projected Box Score.
    // Rate stats (FG%, ORTG, DRTG) stay heuristic — ML doesn't project efficiency.
    return {
      ...heuristic,
      ppg:           ml.points,
      rpg:           ml.total_rebounds,
      apg:           ml.assists,
      spg:           ml.steals,
      bpg:           ml.blocks,
      topg:          ml.turnovers,
      minutesPerGame: ml.projected_mpg,
    }
  })

  // Normalize counting stats to 200 total player-minutes (5 players × 40 min).
  // When coaches haven't set minutes, each player's minutesMultiplier = 1 and their
  // full per-game stats are summed — a 13-player roster would inflate PPG ~2.6×.
  // totalMinutes is the sum of each player's projected MPG from projectPlayerStats.
  const totalMinutes = projections.reduce((s, p) => s + p.minutesPerGame, 0)
  const countNorm = totalMinutes > 200 ? 200 / totalMinutes : 1

  const ppg = parseFloat((projections.reduce((s, p) => s + p.ppg, 0) * countNorm).toFixed(1))
  const rpg = parseFloat((projections.reduce((s, p) => s + p.rpg, 0) * countNorm).toFixed(1))
  const apg = parseFloat((projections.reduce((s, p) => s + p.apg, 0) * countNorm).toFixed(1))

  // FG%, 3P%, eFG% — weighted by projected FGA so high-volume shooters drive the average.
  // eFG% is recomputed from aggregated makes/attempts rather than averaging individual rates.
  const totalFGA   = projections.reduce((s, p) => s + (p.fgaPerGame  ?? 0), 0)
  const total3PA   = projections.reduce((s, p) => s + (p.fg3mPerGame ?? 0) / Math.max(p.fg3Pct / 100, 0.001), 0)
  const totalFGM   = projections.reduce((s, p) => s + (p.fgaPerGame  ?? 0) * (p.fgPct  / 100), 0)
  const total3PM   = projections.reduce((s, p) => s + (p.fg3mPerGame ?? 0), 0)
  const total3PAttempts = projections.reduce((s, p) => {
    const fga3 = p.fg3Pct > 0 ? (p.fg3mPerGame ?? 0) / (p.fg3Pct / 100) : 0
    return s + fga3
  }, 0)

  const fgPct  = totalFGA > 0
    ? parseFloat((totalFGM / totalFGA * 100).toFixed(1))
    : parseFloat((projections.reduce((s, p) => s + p.fgPct, 0) / projections.length).toFixed(1))
  const fg3Pct = total3PAttempts > 0
    ? parseFloat((total3PM / total3PAttempts * 100).toFixed(1))
    : parseFloat((projections.reduce((s, p) => s + p.fg3Pct, 0) / projections.length).toFixed(1))
  const efgPct = totalFGA > 0
    ? parseFloat(((totalFGM + 0.5 * total3PM) / totalFGA * 100).toFixed(1))
    : parseFloat((projections.reduce((s, p) => s + p.efgPct, 0) / projections.length).toFixed(1))

  // ORTG and DRTG — weighted by projected minutes so starters drive team efficiency.
  const ortg = totalMinutes > 0
    ? parseFloat((projections.reduce((s, p) => s + p.ortg * p.minutesPerGame, 0) / totalMinutes).toFixed(1))
    : parseFloat((projections.reduce((s, p) => s + p.ortg, 0) / projections.length).toFixed(1))
  const drtg = totalMinutes > 0
    ? parseFloat((projections.reduce((s, p) => s + p.drtg * p.minutesPerGame, 0) / totalMinutes).toFixed(1))
    : parseFloat((projections.reduce((s, p) => s + p.drtg, 0) / projections.length).toFixed(1))
  const netRating = parseFloat((ortg - drtg).toFixed(1))

  // Conference averages (hardcoded MCC baseline)
  const confAvg = getMCCConferenceAverage()

  // Radar axes (0–100 relative to conference avg)
  const scoring = Math.min(100, Math.round((ppg / 75) * 100))
  const rebounding = Math.min(100, Math.round((rpg / 40) * 100))
  const playmaking = Math.min(100, Math.round((apg / 20) * 100))
  const shooting3pt = Math.min(100, Math.round((fg3Pct / 45) * 100))
  const defense = Math.min(100, Math.round(((120 - drtg) / 30) * 100))
  const efficiency = Math.min(100, Math.round((efgPct / 65) * 100))

  return {
    ppg, rpg, apg, fgPct, fg3Pct, efgPct, ortg, drtg, netRating,
    pace: PROGRAM_PACE,
    scoring, rebounding, playmaking, shooting3pt, defense, efficiency,
    conferenceAvg: confAvg,
    lastYearStats: getLastYearStats(),
  }
}

function getLastYearStats(): ProjectedTeamStats['lastYearStats'] {
  return {
    ppg: 68.2,
    rpg: 34.1,
    apg: 13.4,
    fgPct: 43.1,
    fg3Pct: 32.6,
    efgPct: 49.2,
    ortg: 104,
    drtg: 109,
    netRating: -5,
    pace: 68,
    scoring: 58,
    rebounding: 55,
    playmaking: 50,
    shooting3pt: 52,
    defense: 52,
    efficiency: 58,
  }
}

function getMCCConferenceAverage(): ProjectedTeamStats['conferenceAvg'] {
  return {
    ppg: 72.4,
    rpg: 35.8,
    apg: 14.2,
    fgPct: 44.2,
    fg3Pct: 33.8,
    efgPct: 50.4,
    ortg: 108,
    drtg: 108,
    netRating: 0,
    pace: 70,
    scoring: 62,
    rebounding: 58,
    playmaking: 54,
    shooting3pt: 56,
    defense: 58,
    efficiency: 62,
  }
}

function getDefaultTeamStats(): ProjectedTeamStats {
  const confAvg = getMCCConferenceAverage()
  return {
    ppg: 0, rpg: 0, apg: 0, fgPct: 0, fg3Pct: 0, efgPct: 0,
    ortg: 0, drtg: 0, netRating: 0, pace: PROGRAM_PACE,
    scoring: 0, rebounding: 0, playmaking: 0, shooting3pt: 0, defense: 0, efficiency: 0,
    conferenceAvg: confAvg,
    lastYearStats: getLastYearStats(),
  }
}

/**
 * Identify roster gaps and return top N players to fill them.
 */
export function getGapFillRecommendations(
  scenario: RosterScenario,
  allPlayers: Player[],
  model: EvaluationModel,
  n: number = 6
): Player[] {
  // Count empty slots per position
  const filledIds = new Set(scenario.slots.map(s => s.playerId).filter(Boolean))
  const gapCount: Record<string, number> = {}
  for (const slot of scenario.slots) {
    if (slot.playerId === null) {
      gapCount[slot.position] = (gapCount[slot.position] ?? 0) + 1
    }
  }

  const positions = Object.keys(gapCount)
  if (positions.length === 0) return []

  // All eligible portal players (not on roster, not returners)
  const ACTIVE_STATUSES = new Set(['available', 'contacted', 'offered', 'visit_scheduled'])
  const portalPool = allPlayers.filter(p =>
    !p.isReturner && ACTIVE_STATUSES.has(p.portalStatus) && !filledIds.has(p.id)
  )

  // Score across the full portal pool so normalization is fair across positions
  const scoreMap = computeAllFitScores(portalPool, model)

  // For each position with gaps, build a ranked list of candidates
  const rankedByPosition: Record<string, Player[]> = {}
  for (const pos of positions) {
    rankedByPosition[pos] = portalPool
      .filter(p => p.position === pos)
      .sort((a, b) => (scoreMap[b.id] ?? 0) - (scoreMap[a.id] ?? 0))
  }

  // Proportional slot allocation — positions with more gaps get more recs,
  // but every position with a gap gets at least 1.
  const totalGaps = positions.reduce((s, p) => s + gapCount[p], 0)
  // Sort most-needed first so ties go to the bigger gap
  const sortedPositions = [...positions].sort((a, b) => gapCount[b] - gapCount[a])

  const allocation: Record<string, number> = {}
  let allocated = 0
  for (const pos of sortedPositions) {
    const share = Math.max(1, Math.round((gapCount[pos] / totalGaps) * n))
    const capped = Math.min(share, rankedByPosition[pos].length)
    allocation[pos] = capped
    allocated += capped
  }

  // If rounding pushed us over n, trim from least-needed positions
  for (let i = sortedPositions.length - 1; i >= 0 && allocated > n; i--) {
    const pos = sortedPositions[i]
    const trim = Math.min(allocation[pos] - 1, allocated - n)
    if (trim > 0) { allocation[pos] -= trim; allocated -= trim }
  }

  // If under n (positions ran out of candidates), redistribute to others
  let changed = true
  while (allocated < n && changed) {
    changed = false
    for (const pos of sortedPositions) {
      if (allocated >= n) break
      if (allocation[pos] < rankedByPosition[pos].length) {
        allocation[pos]++; allocated++; changed = true
      }
    }
  }

  // Interleave round-robin so the carousel always shows position variety:
  // slot 0 → best PG, slot 1 → best C, slot 2 → second-best PG, …
  const queues = sortedPositions.map(pos => rankedByPosition[pos].slice(0, allocation[pos]))
  const result: Player[] = []
  let round = 0
  while (result.length < n) {
    let added = false
    for (const queue of queues) {
      if (round < queue.length) {
        result.push(queue[round])
        added = true
        if (result.length >= n) break
      }
    }
    if (!added) break
    round++
  }

  return result
}

/**
 * Generate a human-readable roster impact sentence for a player.
 */
export function generateRosterImpact(
  player: Player,
  scenario: RosterScenario,
  allPlayers: Player[]
): string {
  const proj = projectPlayerStats(player, scenario, allPlayers)
  const pos = player.position

  const posLabel: Record<string, string> = {
    PG: 'point guard',
    SG: 'shooting guard',
    SF: 'small forward',
    PF: 'power forward',
    C: 'center',
  }

  // Find if there's a gap at this position
  const emptyAtPosition = scenario.slots.filter(
    s => s.position === pos && s.playerId === null
  ).length

  const gapText = emptyAtPosition > 0 ? ` to fill your current roster gap at ${pos}` : ''

  const stat3P = player.fg3Pct >= 38 ? ` and elite ${formatStatStr(player.fg3Pct, '%')} 3PT shooting` : ''
  const statDef = player.bpg >= 2.0 ? ` with elite rim protection (${player.bpg} BPG)` : ''

  return `Projected to add ${proj.ppg} PPG${stat3P}${statDef}${gapText}.`
}

function formatStatStr(n: number, suffix: string): string {
  return `${n.toFixed(1)}${suffix}`
}
