'use client'

import { useMemo, useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Clock, Play, RefreshCw, Loader2 } from 'lucide-react'
import { useNexusStore, useActiveRosterGroups, useActivePlayerMinutes } from '@/store'
import { useAllPlayers } from '@/hooks/usePlayer'
import { useActiveScenario } from '@/hooks/useProjectedStats'
import { autoAssignMinutes } from '@/lib/projections'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { Slider } from '@/components/ui/Slider'
import { cn, positionColor } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import type { MinuteRange, MLPrediction } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8005'

const TOTAL_MINUTES = 200
const TOLERANCE = 5

export function MinutesManager() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)

  const rosterGroups = useActiveRosterGroups()
  const playerMinutes = useActivePlayerMinutes()
  const updatePlayerMinutes = useNexusStore(s => s.updatePlayerMinutes)
  const runPredictions = useNexusStore(s => s.runPredictions)
  const setRosterPredictions = useNexusStore(s => s.setRosterPredictions)
  const setConferenceResult = useNexusStore(s => s.setConferenceResult)
  const setTeamContext = useNexusStore(s => s.setTeamContext)
  const isPredicted = useNexusStore(s => s.isPredicted)
  const predictionsStale = useNexusStore(s => s.predictionsStale)
  const models = useNexusStore(s => s.models)
  const activeModelId = useNexusStore(s => s.activeModelId)
  const allPlayers = useAllPlayers()
  const scenario = useActiveScenario()

  const rosterPlayerIds = useMemo(() =>
    [...new Set(rosterGroups.flatMap(g => g.playerIds))],
    [rosterGroups]
  )

  const playerMap = new Map(allPlayers.map(p => [p.id, p]))

  // Compute sum of expected minutes (midpoint of each range)
  const totalExpected = useMemo(() =>
    rosterPlayerIds.reduce((sum, id) => {
      const p = playerMap.get(id)
      const entry = playerMinutes[id]
      if (entry) return sum + (entry.min + entry.max) / 2
      return sum + (p?.minutesPerGame ?? 25)
    }, 0),
    [rosterPlayerIds, playerMinutes, playerMap]
  )

  const deviation = Math.abs(totalExpected - TOTAL_MINUTES)
  const isValid = deviation <= TOLERANCE

  function handleAutoAssign() {
    const model = models.find(m => m.id === activeModelId)
    if (!model) return
    const assigned = autoAssignMinutes(rosterPlayerIds, allPlayers, model)
    for (const [playerId, range] of Object.entries(assigned)) {
      updatePlayerMinutes(playerId, range)
    }
  }

  async function handlePredict() {
    if (!isValid || isPredicting) return
    setIsPredicting(true)

    // Build the batch payload — one entry per roster player with their expected MPG
    const playerMap = new Map(allPlayers.map(p => [p.id, p]))
    const payload = rosterPlayerIds.map(id => {
      const p = playerMap.get(id)
      const range = playerMinutes[id]
      const projected_mpg = range
        ? (range.min + range.max) / 2
        : (p?.minutesPerGame ?? 25)
      return { player_id: id, projected_mpg }
    })

    // ── ML player stat predictions ─────────────────────────────────────────
    try {
      const res = await fetch(`${API_BASE}/api/players/predictions/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: payload }),
      })
      if (res.ok) {
        const results: MLPrediction[] = await res.json()
        const map: Record<string, MLPrediction> = {}
        for (const r of results) map[r.player_id] = r
        setRosterPredictions(map)
      }
    } catch {
      // Backend unavailable — box score falls back to heuristic projections
    }

    // ── Conference record prediction ────────────────────────────────────────
    try {
      // Get the coach's team name from Supabase auth metadata
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const teamName: string | undefined = user?.user_metadata?.team_name

      if (teamName) {
        // Collect BPM and minutes for all roster players
        const playerBpm = rosterPlayerIds.map(id => playerMap.get(id)?.bpm ?? 0)
        const playerMins = rosterPlayerIds.map(id => {
          const range = playerMinutes[id]
          const p = playerMap.get(id)
          return range ? (range.min + range.max) / 2 : (p?.minutesPerGame ?? 25)
        })

        const confRes = await fetch(`${API_BASE}/api/conference-predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            team_name: teamName,
            player_bpm: playerBpm,
            player_minutes: playerMins,
          }),
        })
        if (confRes.ok) {
          setConferenceResult(await confRes.json())
        }

        // ── Team context (KenPom-style stats for Team Analytics) ─────────────
        try {
          const ctxRes = await fetch(
            `${API_BASE}/api/team-context/${encodeURIComponent(teamName)}`,
          )
          if (ctxRes.ok) {
            setTeamContext(await ctxRes.json())
          }
        } catch {
          // Team context unavailable — TeamStats shows last-year comparison as N/A
        }
      }
    } catch {
      // Conference prediction unavailable — ConferencePredictor shows no-data state
    }

    // Mark predictions as run regardless of whether backends responded
    runPredictions()
    setIsPredicting(false)
  }

  if (rosterPlayerIds.length === 0) return null

  const showStaleWarning = isPredicted && predictionsStale

  return (
    <div className="bg-[#14171c] border border-white/10 rounded-xl overflow-hidden">
      {/* Stale banner */}
      {showStaleWarning && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-amber-900/20 border-b border-amber-700/30">
          <span className="text-xs text-amber-400">Minutes changed — predictions are out of date.</span>
          <button
            onClick={handlePredict}
            disabled={!isValid || isPredicting}
            className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 font-medium transition-colors disabled:opacity-50"
          >
            {isPredicting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {isPredicting ? 'Running…' : 'Rerun'}
          </button>
        </div>
      )}

      {/* Header row */}
      <div
        onClick={() => setIsExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-white">Minutes Rotation</span>
          <span className={cn(
            'text-xs font-mono px-2 py-0.5 rounded-full border',
            isValid
              ? 'text-green-400 bg-green-900/20 border-green-700/30'
              : 'text-amber-400 bg-amber-900/20 border-amber-700/30'
          )}>
            {Math.round(totalExpected)}/200 expected
          </span>
          {!isValid && (
            <span className="text-xs text-amber-400">
              {totalExpected > TOTAL_MINUTES
                ? `+${Math.round(totalExpected - TOTAL_MINUTES)} over`
                : `${Math.round(TOTAL_MINUTES - totalExpected)} under`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); handleAutoAssign() }}
            className="flex items-center gap-1.5 px-3 py-1 text-xs text-blue-400 bg-blue-900/20 border border-blue-700/30 rounded-lg hover:bg-blue-900/30 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            AI Assign
          </button>
          <button
            onClick={e => { e.stopPropagation(); handlePredict() }}
            disabled={!isValid || isPredicting}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
              showStaleWarning
                ? 'text-amber-300 bg-amber-900/20 border-amber-700/30 hover:bg-amber-900/30'
                : isPredicted
                  ? 'text-gray-400 bg-white/5 border-white/10 hover:bg-white/8'
                  : 'text-green-300 bg-green-900/20 border-green-700/30 hover:bg-green-900/30'
            )}
          >
            {isPredicting
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Running…</>
              : showStaleWarning
                ? <><RefreshCw className="w-3 h-3" /> Rerun</>
                : isPredicted
                  ? <><RefreshCw className="w-3 h-3" /> Rerun</>
                  : <><Play className="w-3 h-3" /> Predict</>
            }
          </button>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
          <p className="text-xs text-gray-600">
            Set a minutes range for each player. The <span className="text-gray-400">midpoint</span> is the expected value — all midpoints must sum to 200. Wider ranges = higher uncertainty.
          </p>

          {rosterPlayerIds.map(playerId => {
            const player = playerMap.get(playerId)
            if (!player) return null
            const entry: MinuteRange = playerMinutes[playerId] ?? {
              min: Math.max(0, (player.minutesPerGame ?? 25) - 4),
              max: Math.min(40, (player.minutesPerGame ?? 25) + 4),
            }
            const expected = (entry.min + entry.max) / 2

            return (
              <div key={playerId} className="flex items-center gap-3">
                <PlayerAvatar player={player} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white truncate">{player.name}</span>
                      <span className={cn('text-[10px] font-medium px-1 py-0.5 rounded text-white', positionColor(player.position))}>
                        {player.position}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-gray-400 shrink-0">
                      {entry.min}–{entry.max} min
                      <span className="text-gray-600 ml-1">(exp: {expected.toFixed(1)})</span>
                    </span>
                  </div>
                  <Slider
                    value={[entry.min, entry.max]}
                    onValueChange={([min, max]) => updatePlayerMinutes(playerId, { min, max })}
                    min={0}
                    max={40}
                    step={1}
                  />
                </div>
              </div>
            )
          })}

          {/* Total bar */}
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Expected total</span>
              <span className={cn('font-mono', isValid ? 'text-green-400' : 'text-amber-400')}>
                {Math.round(totalExpected)} / 200
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', isValid ? 'bg-green-500' : 'bg-amber-500')}
                style={{ width: `${Math.min(100, (totalExpected / TOTAL_MINUTES) * 100)}%` }}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
