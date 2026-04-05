// ─────────────────────────────────────────────────────────────────────────────
// Nexus Analytics — NIL Valuation Functions
// Pure functions — no React, no side effects.
// Post-beta seam: replace with calls to the NIL valuation API.
// ─────────────────────────────────────────────────────────────────────────────
import type { Player, RosterScenario, NilMarketData, NilDeal, BudgetState } from '@/types'
import { roundToNearest } from '@/lib/utils'

type ScarcityLevel = 'high_need' | 'normal' | 'depth'

/**
 * Compute roster-adjusted NIL value range for a player.
 * Returns [low, high] tuple in whole dollars.
 */
export function computeRosterAdjustedNil(
  player: Player,
  scenario: RosterScenario,
  fitScore: number,
  marketRates: NilMarketData
): [number, number] {
  // Determine tier from fit score
  const tier = fitScore >= 80 ? 'tier1' : fitScore >= 60 ? 'tier2' : 'tier3'

  // Get base market rate for this position + tier
  const positionRates = marketRates.rates[player.position]
  const [baseLow, baseHigh] = positionRates[tier]

  // Count empty/returner-only slots at this position
  const slotsAtPosition = scenario.slots.filter(s => s.position === player.position)
  const emptySlots = slotsAtPosition.filter(s => s.playerId === null).length
  const returnerOnlySlots = slotsAtPosition.filter(s => {
    if (s.playerId === null) return false
    return s.isReturnerSlot
  }).length

  const openCount = emptySlots + returnerOnlySlots

  // Scarcity multiplier
  let scarcityMultiplier: number
  if (openCount === 0) {
    scarcityMultiplier = 0.8 // depth piece
  } else if (openCount === 1) {
    scarcityMultiplier = 1.0 // normal need
  } else {
    scarcityMultiplier = 1.2 // high need
  }

  // Check if player fills the #1 statistical gap (based on PPG)
  const teamPlayers = scenario.slots
    .filter(s => s.playerId !== null)
    .map(s => s.playerId!)

  const isFillingPrimaryGap = !teamPlayers.includes(player.id) && openCount >= 2
  if (isFillingPrimaryGap) {
    scarcityMultiplier += 0.15
  }

  const adjustedLow = roundToNearest(baseLow * scarcityMultiplier, 5000)
  const adjustedHigh = roundToNearest(baseHigh * scarcityMultiplier, 5000)

  return [adjustedLow, adjustedHigh]
}

/**
 * Compute a single projected NIL value for a player (not a range).
 * Takes projected minutes into account: more minutes = more value.
 * Baseline = 28 MPG starter.
 */
export function computeNilValue(
  player: Player,
  scenario: RosterScenario,
  fitScore: number,
  marketRates: NilMarketData
): number {
  const tier = fitScore >= 80 ? 'tier1' : fitScore >= 60 ? 'tier2' : 'tier3'
  const [baseLow, baseHigh] = marketRates.rates[player.position][tier]
  const midpoint = (baseLow + baseHigh) / 2

  // Scarcity
  const slotsAtPosition = scenario.slots.filter(s => s.position === player.position)
  const emptySlots = slotsAtPosition.filter(s => s.playerId === null).length
  const returnerSlots = slotsAtPosition.filter(s => s.isReturnerSlot && s.playerId !== null).length
  const openCount = emptySlots + returnerSlots
  const scarcityMultiplier = openCount === 0 ? 0.8 : openCount >= 2 ? 1.2 : 1.0

  // Minutes factor (28 MPG = baseline starter)
  const actualMPG = player.minutesPerGame > 0 ? player.minutesPerGame : 25
  const minuteEntry = scenario.playerMinutes[player.id]
  const projectedMPG = minuteEntry ? (minuteEntry.min + minuteEntry.max) / 2 : actualMPG
  const minutesFactor = projectedMPG / 28

  return roundToNearest(midpoint * scarcityMultiplier * minutesFactor, 5000)
}

/**
 * Get the scarcity level for display purposes.
 */
export function getScarcityLevel(
  player: Player,
  scenario: RosterScenario
): ScarcityLevel {
  const slotsAtPosition = scenario.slots.filter(s => s.position === player.position)
  const emptySlots = slotsAtPosition.filter(s => s.playerId === null).length
  const returnerOnlySlots = slotsAtPosition.filter(s => s.isReturnerSlot && s.playerId !== null).length
  const openCount = emptySlots + returnerOnlySlots

  if (openCount === 0) return 'depth'
  if (openCount >= 2) return 'high_need'
  return 'normal'
}

/**
 * Compute overall budget state for a scenario.
 */
export function computeBudgetState(
  scenario: RosterScenario,
  nilDeals: Record<string, NilDeal>
): BudgetState {
  let committed = 0
  let targeted = 0

  for (const deal of Object.values(nilDeals)) {
    if (deal.scenarioId !== scenario.id) continue

    if (deal.status === 'signed') {
      committed += deal.offerAmount
    } else if (
      deal.status === 'targeted' ||
      deal.status === 'offered' ||
      deal.status === 'negotiating'
    ) {
      targeted += deal.offerAmount
    }
  }

  return {
    total: scenario.budget,
    committed,
    targeted,
    remaining: scenario.budget - committed - targeted,
  }
}
