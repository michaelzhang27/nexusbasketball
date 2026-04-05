'use client'

import { useNexusStore } from '@/store'
import type { Player } from '@/types'

/**
 * Returns a player by ID from the store (portal players + returners).
 */
export function usePlayer(id: string | null): Player | null {
  const players = useNexusStore(s => s.players)
  const returners = useNexusStore(s => s.returners)

  if (!id) return null

  return (
    players.find(p => p.id === id) ??
    returners.find(p => p.id === id) ??
    null
  )
}

/**
 * Returns a map of all players (portal + returners) keyed by ID.
 */
export function usePlayerMap(): Map<string, Player> {
  const players = useNexusStore(s => s.players)
  const returners = useNexusStore(s => s.returners)

  return new Map([...players, ...returners].map(p => [p.id, p]))
}

/**
 * Returns all players (portal + returners) as a combined array.
 */
export function useAllPlayers(): Player[] {
  const players = useNexusStore(s => s.players)
  const returners = useNexusStore(s => s.returners)
  return [...players, ...returners]
}
