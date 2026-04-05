'use client'

import { useState } from 'react'
import { Plus, X, Search, AlertTriangle } from 'lucide-react'
import { useNexusStore, useActiveBoardGroups, useWatchlistIds, useActiveRosterGroups } from '@/store'
import { useAllPlayers } from '@/hooks/usePlayer'

import { useFitScore } from '@/hooks/useFitScore'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { FitScoreBadge } from '@/components/shared/FitScoreBadge'
import { cn, positionColor } from '@/lib/utils'
import type { Player, RosterGroupEntry } from '@/types'

const MAX_ROSTER = 15

const GROUP_DEFS: { id: RosterGroupEntry['id']; label: string }[] = [
  { id: 'guards', label: 'Guards' },
  { id: 'wings',  label: 'Wings' },
  { id: 'bigs',   label: 'Bigs' },
  { id: 'flex',   label: 'Flex / Bench' },
]

export function RosterCanvas() {
  const rosterGroups = useActiveRosterGroups()
  const allPlayers = useAllPlayers()
  const addToRosterGroup = useNexusStore(s => s.addToRosterGroup)
  const removeFromRosterGroup = useNexusStore(s => s.removeFromRosterGroup)
  const openSidePanel = useNexusStore(s => s.openSidePanel)

  const totalPlayers = rosterGroups.reduce((sum, g) => sum + g.playerIds.length, 0)
  const playerMap = new Map(allPlayers.map(p => [p.id, p]))

  return (
    <div className="space-y-6">
      {totalPlayers >= MAX_ROSTER && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Roster is at the {MAX_ROSTER}-player limit. Remove a player before adding more.
        </div>
      )}

      {GROUP_DEFS.map(({ id, label }) => {
        const group = rosterGroups.find(g => g.id === id) ?? { id, label, playerIds: [] }
        const groupPlayers = group.playerIds.map(pid => playerMap.get(pid)).filter((p): p is Player => p !== undefined)

        return (
          <div key={id}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs text-gray-500 uppercase tracking-widest font-medium">{label}</h3>
              <span className="text-xs text-gray-700">{groupPlayers.length}</span>
              <span className="h-px flex-1 bg-white/5" />
            </div>

            <div className="flex flex-wrap gap-2">
              {groupPlayers.map(player => (
                <RosterPlayerCard
                  key={player.id}
                  player={player}
                  onRemove={() => removeFromRosterGroup(player.id)}
                  onOpen={() => openSidePanel(player.id, 'stats')}
                />
              ))}

              {/* Add player button — always shown, blocked if at max */}
              <AddPlayerButton
                groupId={id}
                allPlayers={allPlayers}
                existingIds={new Set(rosterGroups.flatMap(g => g.playerIds))}
                atCapacity={totalPlayers >= MAX_ROSTER}
                onAdd={(playerId) => addToRosterGroup(id, playerId)}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RosterPlayerCard({
  player,
  onRemove,
  onOpen,
}: {
  player: Player
  onRemove: () => void
  onOpen: () => void
}) {
  const fitScore = useFitScore(player)

  return (
    <div
      className="group relative bg-[#1a1e24] border border-white/10 rounded-xl p-3 cursor-pointer hover:border-white/20 transition-colors w-[160px] shrink-0"
      onClick={onOpen}
    >
      <button
        onClick={e => { e.stopPropagation(); onRemove() }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-600 hover:text-red-400 bg-[#14171c] rounded"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="flex flex-col items-center gap-2 text-center">
        <PlayerAvatar player={player} size={36} />
        <div>
          <p className="text-xs font-medium text-white truncate w-full">{player.name}</p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span className={cn('text-[10px] font-medium px-1 py-0.5 rounded text-white', positionColor(player.position))}>
              {player.position}
            </span>
          </div>
          <p className="text-[10px] text-gray-600 mt-0.5">{player.height} · {player.weight} lbs</p>
        </div>
        <FitScoreBadge score={fitScore} size="sm" />
      </div>
    </div>
  )
}

function AddPlayerButton({
  groupId,
  allPlayers,
  existingIds,
  atCapacity,
  onAdd,
}: {
  groupId: string
  allPlayers: Player[]
  existingIds: Set<string>
  atCapacity: boolean
  onAdd: (playerId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const boardGroups = useActiveBoardGroups()
  const watchlistIds = useWatchlistIds()

  const boardPlayerIds = new Set(boardGroups.find(g => g.id === 'overall')?.playerIds ?? [])
  const eligibleIds = new Set([...watchlistIds, ...boardPlayerIds])

  const results = allPlayers
    .filter(p =>
      !existingIds.has(p.id) &&
      (p.isReturner || eligibleIds.has(p.id)) &&
      (!query || p.name.toLowerCase().includes(query.toLowerCase()) || p.previousSchool.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, 8)

  if (!isOpen) {
    return (
      <button
        onClick={() => !atCapacity && setIsOpen(true)}
        className={cn(
          'w-[160px] h-[130px] shrink-0 border border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors',
          atCapacity
            ? 'border-amber-700/30 cursor-not-allowed'
            : 'border-white/10 hover:border-white/25 hover:bg-white/3 cursor-pointer'
        )}
      >
        {atCapacity
          ? <AlertTriangle className="w-5 h-5 text-amber-600" />
          : <Plus className="w-5 h-5 text-gray-600" />
        }
        <span className={cn('text-xs', atCapacity ? 'text-amber-600' : 'text-gray-600')}>
          {atCapacity ? 'Roster full' : 'Add player'}
        </span>
      </button>
    )
  }

  return (
    <div className="w-[220px] bg-[#1a1e24] border border-blue-500/40 rounded-xl p-3 shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search board / watchlist..."
          className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-600 focus:outline-none"
        />
        <button onClick={() => { setIsOpen(false); setQuery('') }} className="text-gray-600 hover:text-gray-400">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-1 max-h-52 overflow-y-auto">
        {results.map(p => (
          <button
            key={p.id}
            onClick={() => { onAdd(p.id); setIsOpen(false); setQuery('') }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left transition-colors"
          >
            <PlayerAvatar player={p} size={22} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white truncate">{p.name}</p>
              <p className="text-[10px] text-gray-500">{p.position} · {p.previousSchool}</p>
            </div>
            <span className="text-[10px] text-gray-600 font-mono shrink-0">{p.ppg.toFixed(1)}</span>
          </button>
        ))}
        {results.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-2">
            {query ? 'No matches' : 'No eligible players — add to board or watchlist first'}
          </p>
        )}
      </div>
      <p className="text-[10px] text-gray-700 mt-1.5">From your board and watchlist.</p>
    </div>
  )
}
