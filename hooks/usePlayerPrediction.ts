import { useState, useEffect } from 'react'
import type { MLPrediction } from '@/types'

export type { MLPrediction }

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8005'

/**
 * Fetch an XGBoost ML prediction for a single player.
 * Pass projectedMpg to override the player's historical minutes.
 * Returns null when playerId is null (disabled) or the backend is unavailable.
 *
 * NOTE: This hook is only for local/custom "what-if" projections in the
 * SidePanel. Authoritative roster predictions live in the Zustand store
 * under `rosterPredictions` and are fetched via the batch endpoint when
 * the coach clicks "Run Predictions" in MinutesManager.
 */
export function usePlayerPrediction(
  playerId: string | null,
  projectedMpg?: number,
): { prediction: MLPrediction | null; isLoading: boolean } {
  const [prediction, setPrediction] = useState<MLPrediction | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!playerId) {
      setPrediction(null)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)

    const url = new URL(`${API_BASE}/api/players/${playerId}/prediction`)
    if (projectedMpg !== undefined) {
      url.searchParams.set('projected_mpg', String(projectedMpg))
    }

    fetch(url.toString(), { signal: controller.signal })
      .then(r => (r.ok ? r.json() : null))
      .then((data: MLPrediction | null) => {
        if (data) setPrediction(data)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [playerId, projectedMpg])

  return { prediction, isLoading }
}
