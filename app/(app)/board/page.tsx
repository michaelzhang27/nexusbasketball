'use client'

import { useState, useMemo } from 'react'
import { Download, LayoutGrid, List, Star, Plus, Search, X, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useNexusStore, useWatchlistIds, useActiveBoardGroups } from '@/store'
import { DraggableBoard } from '@/components/board/DraggableBoard'
import { Button } from '@/components/ui/Button'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { FitScoreBadge } from '@/components/shared/FitScoreBadge'
import { StatusPill } from '@/components/shared/StatusPill'
import { useToast } from '@/hooks/useToast'
import { useFitScore } from '@/hooks/useFitScore'
import { cn, positionColor } from '@/lib/utils'
import type { Position, Player, PipelineStatus } from '@/types'

type ViewMode = 'overall' | 'position' | 'watchlist'
type PosGrouping = '5pos' | 'guards-wings-bigs'

const ALL_POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']

const GROUP_LABELS: { id: 'guards' | 'wings' | 'bigs'; label: string }[] = [
  { id: 'guards', label: 'Guards' },
  { id: 'wings',  label: 'Wings'  },
  { id: 'bigs',   label: 'Bigs'   },
]

type FreeGroups = Record<'guards' | 'wings' | 'bigs', string[]>

export default function BoardPage() {
  const { show } = useToast()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('overall')
  const [posGrouping, setPosGrouping] = useState<PosGrouping>('5pos')
  // Free-form groupings — coaches assign players manually; will be DB-backed post-beta
  const [freeGroups, setFreeGroups] = useState<FreeGroups>({ guards: [], wings: [], bigs: [] })

  const players = useNexusStore(s => s.players)
  const boardGroups = useActiveBoardGroups()
  const watchlistIds = useWatchlistIds()
  const toggleWatchlist = useNexusStore(s => s.toggleWatchlist)
  const addToBoard = useNexusStore(s => s.addToBoard)
  const reorderBoard = useNexusStore(s => s.reorderBoard)

  const getGroupPlayers = (groupId: string): Player[] => {
    const group = boardGroups.find(g => g.id === groupId)
    if (!group) return []
    return group.playerIds
      .map(id => players.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined)
  }

  const overallPlayers = getGroupPlayers('overall')

  const watchlistPlayers = useMemo(() => {
    const watchSet = new Set(watchlistIds)
    return players.filter(p => watchSet.has(p.id))
  }, [players, watchlistIds])

  function handleAddToPositionBoard(pos: Position, playerId: string) {
    const overallGroup = boardGroups.find(g => g.id === 'overall')
    const posGroup = boardGroups.find(g => g.id === pos)
    if (overallGroup && !overallGroup.playerIds.includes(playerId)) {
      reorderBoard('overall', [...overallGroup.playerIds, playerId])
    }
    if (posGroup && !posGroup.playerIds.includes(playerId)) {
      reorderBoard(pos, [...posGroup.playerIds, playerId])
    }
    show('Added to board', 'success')
  }

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Left sidebar */}
      <aside className="w-[200px] shrink-0 border-r border-white/10 bg-[#0f1114] flex flex-col p-4 gap-4">
        <div>
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-medium">View</h2>
          <nav className="space-y-1">
            {([
              { mode: 'overall' as ViewMode,   icon: List,       label: 'Overall' },
              { mode: 'position' as ViewMode,  icon: LayoutGrid, label: 'By Position' },
              { mode: 'watchlist' as ViewMode, icon: Star,       label: 'Watchlist' },
            ] as const).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  viewMode === mode
                    ? 'bg-white/8 text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {mode === 'watchlist' && watchlistIds.length > 0 && (
                  <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                    {watchlistIds.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Position grouping toggle — only in position view */}
        {viewMode === 'position' && (
          <div>
            <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-medium">Grouping</h2>
            <div className="space-y-1">
              {([
                { value: '5pos' as PosGrouping,             label: '5 Positions' },
                { value: 'guards-wings-bigs' as PosGrouping, label: 'Guards / Wings / Bigs' },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setPosGrouping(value)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-xs transition-colors',
                    posGrouping === value
                      ? 'bg-white/8 text-white'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stat color legend */}
        <div className="mt-auto space-y-1.5 pt-4 border-t border-white/5">
          <h3 className="text-xs text-gray-600 uppercase tracking-widest font-medium">Stat Colors</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: 'rgb(74,222,128)' }} />
            <span className="text-xs text-gray-600">Best at position</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-white/70" />
            <span className="text-xs text-gray-600">Lowest</span>
          </div>
          <p className="text-xs text-gray-700 pt-1">{overallPlayers.length} on board</p>
        </div>
      </aside>

      {/* Main board area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
          <h1 className="text-white font-semibold">
            {viewMode === 'overall' && 'Rankings'}
            {viewMode === 'position' && 'By Position'}
            {viewMode === 'watchlist' && 'Watchlist'}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/explore')}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Players
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => show('PDF export coming soon — your rankings are ready, the generator is being built.', 'info')}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Board content */}
        <div className="flex-1 overflow-y-auto overflow-x-auto px-6 py-4">
          {viewMode === 'overall' && (
            <DraggableBoard groupId="overall" players={overallPlayers} showWatchlist={false} />
          )}

          {viewMode === 'position' && posGrouping === '5pos' && (
            <div className="space-y-8">
              {ALL_POSITIONS.map(pos => (
                <PositionColumn
                  key={pos}
                  pos={pos}
                  players={getGroupPlayers(pos)}
                  allPlayers={players}
                  onAdd={(playerId) => handleAddToPositionBoard(pos, playerId)}
                />
              ))}
            </div>
          )}

          {viewMode === 'position' && posGrouping === 'guards-wings-bigs' && (
            <div className="space-y-10">
              {GROUP_LABELS.map(({ id, label }) => {
                const groupPlayerIds = freeGroups[id]
                const groupPlayers = groupPlayerIds
                  .map(pid => players.find(p => p.id === pid))
                  .filter((p): p is Player => p !== undefined)
                const allAssigned = new Set(Object.values(freeGroups).flat())
                return (
                  <FreeFormGroup
                    key={id}
                    label={label}
                    players={groupPlayers}
                    boardPlayers={players.filter(p => !allAssigned.has(p.id) || groupPlayerIds.includes(p.id))}
                    onAdd={(playerId) => setFreeGroups(prev => ({ ...prev, [id]: [...prev[id], playerId] }))}
                    onRemove={(playerId) => setFreeGroups(prev => ({ ...prev, [id]: prev[id].filter(id => id !== playerId) }))}
                  />
                )
              })}
            </div>
          )}

          {viewMode === 'watchlist' && (
            <WatchlistView
              watchlistPlayers={watchlistPlayers}
              onRemove={(id) => {
                toggleWatchlist(id)
                show('Removed from watchlist', 'info')
              }}
              onMoveToBoard={(id) => {
                addToBoard(id)
                show('Added to board', 'success')
              }}
              onAddMore={() => router.push('/explore')}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Free-form group (used in guards/wings/bigs view) ─────────────────────────
function FreeFormGroup({
  label,
  players,
  boardPlayers,
  onAdd,
  onRemove,
}: {
  label: string
  players: Player[]
  boardPlayers: Player[]   // pool to add from (overall board, not yet in this group)
  onAdd: (playerId: string) => void
  onRemove: (playerId: string) => void
}) {
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const openSidePanel = useNexusStore(s => s.openSidePanel)
  const existingIds = new Set(players.map(p => p.id))

  const results = boardPlayers
    .filter(p =>
      !existingIds.has(p.id) &&
      (!query || p.name.toLowerCase().includes(query.toLowerCase()) || p.previousSchool.toLowerCase().includes(query.toLowerCase()))
    )

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-xs text-gray-400 uppercase tracking-widest font-semibold">{label}</h3>
        <span className="text-xs text-gray-700">{players.length}</span>
        <span className="h-px flex-1 bg-white/5" />
      </div>

      <div className="space-y-1.5">
        {players.map(player => (
          <div
            key={player.id}
            className="group flex items-center gap-3 px-3 py-2.5 bg-[#14171c] border border-white/10 rounded-xl hover:border-white/20 transition-colors"
          >
            <PlayerAvatar player={player} size={32} />
            <div className="flex-1 min-w-0">
              <button
                onClick={() => openSidePanel(player.id, 'stats')}
                className="text-sm text-white font-medium hover:text-blue-400 transition-colors truncate block"
              >
                {player.name}
              </button>
              <p className="text-xs text-gray-500">{player.position} · {player.previousSchool}</p>
            </div>
            <div className="hidden md:flex items-center gap-3 shrink-0 text-center">
              {[
                { label: 'PPG', value: player.ppg },
                { label: 'RPG', value: player.rpg },
                { label: 'APG', value: player.apg },
              ].map(({ label: l, value }) => (
                <div key={l} className="flex flex-col items-center min-w-[28px]">
                  <span className="font-mono text-xs text-white">{value.toFixed(1)}</span>
                  <span className="text-[10px] text-gray-600 uppercase">{l}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onRemove(player.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-600 hover:text-red-400 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {players.length === 0 && !showSearch && (
          <p className="text-xs text-gray-700 py-2">No players assigned yet.</p>
        )}
      </div>

      {!showSearch ? (
        <button
          onClick={() => setShowSearch(true)}
          className="mt-2 flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors py-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add player
        </button>
      ) : (
        <div className="mt-2 bg-[#1a1e24] border border-blue-500/40 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search board players…"
              className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-600 focus:outline-none"
            />
            <button onClick={() => { setShowSearch(false); setQuery('') }}>
              <X className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400" />
            </button>
          </div>
          <div className="space-y-0.5 max-h-44 overflow-y-auto">
            {results.map(p => (
              <button
                key={p.id}
                onClick={() => { onAdd(p.id); setShowSearch(false); setQuery('') }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left transition-colors"
              >
                <PlayerAvatar player={p} size={22} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-500">{p.position} · {p.previousSchool}</p>
                </div>
                <span className="text-[10px] font-mono text-gray-600 shrink-0">{p.ppg.toFixed(1)}</span>
              </button>
            ))}
            {results.length === 0 && (
              <p className="text-xs text-gray-600 py-2 text-center">
                {query ? 'No matches' : 'All players already assigned'}
              </p>
            )}
          </div>
          <p className="text-[10px] text-gray-700 mt-1.5">All available players.</p>
        </div>
      )}
    </div>
  )
}

// ── Position column (used in 5pos view) ───────────────────────────────────────
function PositionColumn({
  pos,
  players,
  allPlayers,
  onAdd,
}: {
  pos: Position
  players: Player[]
  allPlayers: Player[]
  onAdd: (playerId: string) => void
}) {
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')

  const existingIds = new Set(players.map(p => p.id))
  const results = allPlayers
    .filter(p =>
      p.position === pos &&
      !existingIds.has(p.id) &&
      (!query || p.name.toLowerCase().includes(query.toLowerCase()) || p.previousSchool.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, 8)

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-300">{pos}</span>
        <span className="text-xs text-gray-600">{players.length}</span>
      </div>

      <DraggableBoard groupId={pos} players={players} showWatchlist={false} />

      {!showSearch ? (
        <button
          onClick={() => setShowSearch(true)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-white/10 rounded-xl text-xs text-gray-600 hover:text-gray-400 hover:border-white/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add {pos}
        </button>
      ) : (
        <div className="mt-2 bg-[#1a1e24] border border-blue-500/40 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${pos}s…`}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-600 focus:outline-none"
            />
            <button onClick={() => { setShowSearch(false); setQuery('') }}>
              <X className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400" />
            </button>
          </div>
          <div className="space-y-0.5 max-h-44 overflow-y-auto">
            {results.map(p => (
              <button
                key={p.id}
                onClick={() => { onAdd(p.id); setShowSearch(false); setQuery('') }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left transition-colors"
              >
                <PlayerAvatar player={p} size={22} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{p.previousSchool}</p>
                </div>
                <span className="text-[10px] font-mono text-gray-600 shrink-0">{p.ppg.toFixed(1)}</span>
              </button>
            ))}
            {results.length === 0 && (
              <p className="text-xs text-gray-600 py-2 text-center">
                {query ? 'No matches' : `All ${pos}s already on board`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Watchlist view ─────────────────────────────────────────────────────────────
function WatchlistView({
  watchlistPlayers,
  onRemove,
  onMoveToBoard,
  onAddMore,
}: {
  watchlistPlayers: Player[]
  onRemove: (id: string) => void
  onMoveToBoard: (id: string) => void
  onAddMore: () => void
}) {
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  function handleRemove(id: string) {
    setRemovingIds(prev => new Set(prev).add(id))
    setTimeout(() => onRemove(id), 300)
  }

  if (watchlistPlayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-600">
        <Star className="w-8 h-8" />
        <p className="text-sm">No players on your watchlist yet.</p>
        <p className="text-xs">Star players on the explore tab to track them here.</p>
        <button
          onClick={onAddMore}
          className="mt-2 flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Browse players
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {watchlistPlayers.map(player => (
        <WatchlistCard
          key={player.id}
          player={player}
          isRemoving={removingIds.has(player.id)}
          onRemove={() => handleRemove(player.id)}
          onMoveToBoard={() => onMoveToBoard(player.id)}
        />
      ))}
      <button
        onClick={onAddMore}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/10 rounded-xl text-gray-600 hover:text-gray-400 hover:border-white/20 transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        Add more players
      </button>
    </div>
  )
}

function WatchlistCard({
  player,
  isRemoving,
  onRemove,
  onMoveToBoard,
}: {
  player: Player
  isRemoving: boolean
  onRemove: () => void
  onMoveToBoard: () => void
}) {
  const openSidePanel = useNexusStore(s => s.openSidePanel)
  const updatePlayerStatus = useNexusStore(s => s.updatePlayerStatus)
  const fitScore = useFitScore(player)

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-3',
        'bg-[#14171c] border border-white/10 rounded-xl',
        'hover:border-white/20 transition-all duration-300',
        isRemoving && 'opacity-0 scale-95 translate-x-4'
      )}
    >
      <PlayerAvatar player={player} size={40} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => openSidePanel(player.id, 'stats')}
            className="text-white font-medium text-sm hover:text-blue-400 transition-colors"
          >
            {player.name}
          </button>
          <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded text-white', positionColor(player.position))}>
            {player.position}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {player.previousSchool} · {player.classYear} · {player.height} / {player.weight} lbs
        </p>
      </div>

      {/* Stats strip */}
      <div className="hidden md:flex items-center gap-4 shrink-0">
        {[
          { label: 'PPG',  value: player.ppg },
          { label: 'RPG',  value: player.rpg },
          { label: 'APG',  value: player.apg },
          { label: '3P%',  value: player.fg3Pct },
          { label: 'eFG%', value: player.efgPct },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center min-w-[32px]">
            <span className="font-mono text-sm text-white">{value.toFixed(1)}</span>
            <span className="text-[10px] text-gray-600 uppercase">{label}</span>
          </div>
        ))}
      </div>

      <FitScoreBadge score={fitScore} size="sm" />

      <div onClick={e => e.stopPropagation()}>
        <StatusPill
          status={player.portalStatus}
          onChange={(s: PipelineStatus) => updatePlayerStatus(player.id, s)}
        />
      </div>

      {/* Move to board */}
      <button
        onClick={onMoveToBoard}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-blue-900/20 border border-blue-700/30"
        title="Move to board"
      >
        <ArrowRight className="w-3.5 h-3.5" />
        Board
      </button>

      {/* Remove star */}
      <button
        onClick={onRemove}
        className="p-1 shrink-0 hover:bg-white/5 rounded transition-colors"
        title="Remove from watchlist"
      >
        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
      </button>
    </div>
  )
}
