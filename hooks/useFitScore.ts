'use client'

import { useMemo } from 'react'
import { useNexusStore } from '@/store'
import { computeAllFitScores } from '@/lib/fitScore'
import type { Player } from '@/types'

/**
 * Compute fit scores for all players (portal + returners), normalized to 0–100.
 * Returns a Record<playerId, score>.
 * Memoized — only recomputes when the active model or player list changes.
 */
export function useAllFitScores(): Record<string, number> {
  const players = useNexusStore(s => s.players)
  const returners = useNexusStore(s => s.returners)
  const models = useNexusStore(s => s.models)
  const activeModelId = useNexusStore(s => s.activeModelId)

  return useMemo(() => {
    const model = models.find(m => m.id === activeModelId)
    if (!model) return {}
    return computeAllFitScores([...players, ...returners], model)
  }, [players, returners, models, activeModelId])
}

/**
 * Compute the fit score (0–100) for a single player given the active model.
 * Reads from the pool-normalized scores — cannot be computed in isolation.
 */
export function useFitScore(player: Player | null): number | undefined {
  const scores = useAllFitScores()
  if (!player) return undefined
  return scores[player.id]
}
