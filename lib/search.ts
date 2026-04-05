// ─────────────────────────────────────────────────────────────────────────────
// Nexus Analytics — Player Search & Filter
// Post-beta seam: replace this function body with an API call to the NL search
// endpoint. Function signature stays identical — zero component changes needed.
// ─────────────────────────────────────────────────────────────────────────────
import type { Player, FilterState } from '@/types'
import { parseHeightInches } from '@/lib/utils'

/**
 * Filter and search players client-side.
 * In beta: pure JS text matching + stat range filtering.
 * Post-beta: function body replaced with NL search API call.
 */
export function filterPlayers(
  players: Player[],
  filters: FilterState,
  query: string,
  fitScores?: Record<string, number>
): Player[] {
  let results = [...players]

  // Text search across name, school, conference
  if (query.trim()) {
    const q = query.toLowerCase().trim()
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.previousSchool.toLowerCase().includes(q) ||
      p.conference.toLowerCase().includes(q) ||
      p.position.toLowerCase().includes(q)
    )
  }

  // Position filter
  if (filters.positions.length > 0) {
    results = results.filter(p => filters.positions.includes(p.position))
  }

  // Conference filter
  if (filters.conferences.length > 0) {
    results = results.filter(p => filters.conferences.includes(p.conference))
  }

  // Class year filter
  if (filters.classYears.length > 0) {
    results = results.filter(p => filters.classYears.includes(p.classYear))
  }

  // Portal status filter
  if (filters.portalStatuses.length > 0) {
    results = results.filter(p => filters.portalStatuses.includes(p.portalStatus))
  }

  // Stat range filters
  results = results.filter(p => {
    const ppgOk = p.ppg >= filters.ppgRange.min && p.ppg <= filters.ppgRange.max
    const fg3Ok = p.fg3Pct >= filters.fg3PctRange.min && p.fg3Pct <= filters.fg3PctRange.max
    const efgOk = p.efgPct >= filters.efgPctRange.min && p.efgPct <= filters.efgPctRange.max
    const eligOk = p.eligibilityRemaining >= filters.minEligibility
    const heightIn = parseHeightInches(p.height)
    const heightRange = filters.heightRange ?? { min: 60, max: 96 }
    const heightOk = heightIn >= heightRange.min && heightIn <= heightRange.max
    return ppgOk && fg3Ok && efgOk && eligOk && heightOk
  })

  // Fit score filter (only if fitScores provided and threshold > 0)
  if (fitScores && filters.minFitScore > 0) {
    results = results.filter(p => (fitScores[p.id] ?? 0) >= filters.minFitScore)
  }

  return results
}

/**
 * Get all unique conference names from the player dataset.
 */
export function getUniqueConferences(players: Player[]): string[] {
  const conferences = new Set(players.map(p => p.conference))
  return Array.from(conferences).sort()
}

/**
 * Sort players by a given field.
 */
export type SortField = 'fitScore' | 'ppg' | 'rpg' | 'apg' | 'fg3Pct' | 'efgPct' | 'name' | 'portalEntryDate'

export function sortPlayers(
  players: Player[],
  field: SortField,
  fitScores?: Record<string, number>
): Player[] {
  const sorted = [...players]

  sorted.sort((a, b) => {
    switch (field) {
      case 'fitScore': {
        const aScore = fitScores?.[a.id] ?? 0
        const bScore = fitScores?.[b.id] ?? 0
        return bScore - aScore
      }
      case 'ppg':           return b.ppg - a.ppg
      case 'rpg':           return b.rpg - a.rpg
      case 'apg':           return b.apg - a.apg
      case 'fg3Pct':        return b.fg3Pct - a.fg3Pct
      case 'efgPct':        return b.efgPct - a.efgPct
      case 'name':          return a.name.localeCompare(b.name)
      case 'portalEntryDate': return new Date(b.portalEntryDate).getTime() - new Date(a.portalEntryDate).getTime()
      default:              return 0
    }
  })

  return sorted
}
