'use client'

import { useState } from 'react'
import { Plus, X, Search, AlertTriangle } from 'lucide-react'
import { useNexusStore } from '@/store'
import { useWatchlistIds, useActiveBoardGroups } from '@/store'
import { usePlayer } from '@/hooks/usePlayer'
import { useFitScore } from '@/hooks/useFitScore'
import { useProjectedStats } from '@/hooks/useProjectedStats'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { FitScoreBadge } from '@/components/shared/FitScoreBadge'
import { cn, positionColor } from '@/lib/utils'
import type { RosterSlot as RosterSlotType } from '@/types'

const MAX_ROSTER_SIZE = 15

interface RosterSlotProps {
  slot: RosterSlotType
  scenarioId: string
}

export function RosterSlot({ slot, scenarioId }: RosterSlotProps) {
  const player = usePlayer(slot.playerId)

  if (slot.playerId && player) {
    return <FilledSlot slot={slot} player={player} scenarioId={scenarioId} />
  }

  return <EmptySlot slot={slot} scenarioId={scenarioId} />
}

function FilledSlot({
  slot,
  player,
  scenarioId,
}: RosterSlotProps & { player: NonNullable<ReturnType<typeof usePlayer>> }) {
  const updateScenarioSlot = useNexusStore(s => s.updateScenarioSlot)
  const openSidePanel = useNexusStore(s => s.openSidePanel)
  const fitScore = useFitScore(player)
  const projectedStats = useProjectedStats(player)

  return (
    <div
      className="relative group bg-[#1a1e24] border border-white/10 rounded-xl p-3 cursor-pointer hover:border-white/20 transition-colors"
      onClick={() => openSidePanel(player.id, 'stats')}
    >
      {/* Returner badge */}
      {slot.isReturnerSlot && (
        <span className="absolute top-2 left-2 text-[10px] text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-medium">R</span>
      )}

      <div className="flex items-center gap-2.5">
        <PlayerAvatar player={player} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{player.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn('text-xs font-medium px-1 py-0.5 rounded text-white', positionColor(player.position))}>
              {player.position}
            </span>
            <span className="text-xs text-gray-500 truncate">{player.previousSchool}</span>
          </div>
          {projectedStats && (
            <p className="text-xs text-blue-400 mt-0.5">
              Proj: {projectedStats.ppg} PPG
            </p>
          )}
        </div>
        <FitScoreBadge score={fitScore} size="sm" />
      </div>

      {/* Remove button — all players removable */}
      <button
        onClick={e => { e.stopPropagation(); updateScenarioSlot(scenarioId, slot.index, null) }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-red-400 bg-[#14171c] rounded"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

function EmptySlot({ slot, scenarioId }: { slot: RosterSlotType; scenarioId: string }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const players = useNexusStore(s => s.players)
  const returners = useNexusStore(s => s.returners)
  const updateScenarioSlot = useNexusStore(s => s.updateScenarioSlot)
  const scenarios = useNexusStore(s => s.scenarios)
  const watchlistIds = useWatchlistIds()
  const boardGroups = useActiveBoardGroups()

  const scenario = scenarios.find(s => s.id === scenarioId)
  const filledIds = new Set(scenario?.slots.map(s => s.playerId).filter(Boolean) ?? [])
  const filledCount = filledIds.size

  const isAtCapacity = filledCount >= MAX_ROSTER_SIZE

  // Restrict search pool to players on watchlist OR board
  const boardPlayerIds = new Set(boardGroups.find(g => g.id === 'overall')?.playerIds ?? [])
  const eligiblePlayerIds = new Set([...watchlistIds, ...boardPlayerIds])

  // Returners can always be added (they're your own players)
  const allPlayers = [...players, ...returners]
  const eligiblePlayers = allPlayers.filter(p =>
    p.position === slot.position &&
    !filledIds.has(p.id) &&
    (p.isReturner || eligiblePlayerIds.has(p.id)) &&
    (!query || p.name.toLowerCase().includes(query.toLowerCase()) || p.previousSchool.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 8)

  if (isSearchOpen) {
    return (
      <div className="bg-[#1a1e24] border border-blue-500/40 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${slot.position} from board/watchlist...`}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
          />
          <button onClick={() => setIsSearchOpen(false)} className="text-gray-600 hover:text-gray-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {isAtCapacity ? (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Roster is at the 15-player limit. Remove a player first.
          </div>
        ) : (
          <>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {eligiblePlayers.map(p => (
                <button
                  key={p.id}
                  onClick={() => { updateScenarioSlot(scenarioId, slot.index, p.id); setIsSearchOpen(false); setQuery('') }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left transition-colors"
                >
                  <PlayerAvatar player={p} size={24} />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.previousSchool}</p>
                  </div>
                  <span className="text-xs text-gray-600 ml-auto font-mono">{p.ppg} PPG</span>
                </button>
              ))}
              {eligiblePlayers.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-2">
                  {query ? 'No matches' : 'No eligible players — add players to your board or watchlist first'}
                </p>
              )}
            </div>
            <p className="text-[10px] text-gray-700 mt-2 px-1">Only players on your board or watchlist appear here.</p>
          </>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsSearchOpen(true)}
      className="w-full bg-white/3 border border-dashed border-white/10 rounded-xl p-3 hover:border-white/20 hover:bg-white/5 transition-colors group"
    >
      <div className="flex items-center gap-2">
        <div className={cn('w-9 h-9 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors')}>
          {isAtCapacity
            ? <AlertTriangle className="w-4 h-4 text-amber-600" />
            : <Plus className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
          }
        </div>
        <div className="text-left">
          <p className={cn('text-sm transition-colors', isAtCapacity ? 'text-amber-600' : 'text-gray-600 group-hover:text-gray-400')}>
            {slot.position} — Open
          </p>
          <p className="text-xs text-gray-700">
            {isAtCapacity ? 'Roster full (15 max)' : 'Click to add player'}
          </p>
        </div>
      </div>
    </button>
  )
}
