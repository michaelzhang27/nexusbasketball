'use client'

import { useMemo } from 'react'
import { useNexusStore } from '@/store'
import { projectPlayerStats, projectTeamStats } from '@/lib/projections'
import type { Player, PlayerStats, ProjectedTeamStats, RosterScenario } from '@/types'

/**
 * Compute projected stats for a single player in the active scenario.
 */
export function useProjectedStats(player: Player | null): PlayerStats | null {
  const scenarios = useNexusStore(s => s.scenarios)
  const activeScenarioId = useNexusStore(s => s.activeScenarioId)
  const players = useNexusStore(s => s.players)
  const returners = useNexusStore(s => s.returners)

  return useMemo(() => {
    if (!player) return null
    const scenario = scenarios.find(s => s.id === activeScenarioId)
    if (!scenario) return null
    const allPlayers = [...players, ...returners]
    return projectPlayerStats(player, scenario, allPlayers)
  }, [player, scenarios, activeScenarioId, players, returners])
}

/**
 * Compute projected team stats for the active scenario.
 */
export function useProjectedTeamStats(): ProjectedTeamStats | null {
  const scenarios = useNexusStore(s => s.scenarios)
  const activeScenarioId = useNexusStore(s => s.activeScenarioId)
  const players = useNexusStore(s => s.players)
  const returners = useNexusStore(s => s.returners)

  return useMemo(() => {
    const scenario = scenarios.find(s => s.id === activeScenarioId)
    if (!scenario) return null
    const allPlayers = [...players, ...returners]
    return projectTeamStats(scenario, allPlayers)
  }, [scenarios, activeScenarioId, players, returners])
}

/**
 * Get the active scenario object.
 */
export function useActiveScenario(): RosterScenario | null {
  const scenarios = useNexusStore(s => s.scenarios)
  const activeScenarioId = useNexusStore(s => s.activeScenarioId)
  return scenarios.find(s => s.id === activeScenarioId) ?? null
}
