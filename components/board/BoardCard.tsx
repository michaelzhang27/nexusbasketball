'use client'

import { useState } from 'react'
import { ChevronRight, GripVertical, Star, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNexusStore, useWatchlistIds } from '@/store'
import { useFitScore } from '@/hooks/useFitScore'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { FitScoreBadge } from '@/components/shared/FitScoreBadge'
import { StatusPill } from '@/components/shared/StatusPill'
import { cn, positionColor } from '@/lib/utils'
import type { Player, PipelineStatus } from '@/types'
import { useMemo } from 'react'

interface BoardCardProps {
  player: Player
  rank: number
  isDragOverlay?: boolean
  allPositionPlayers?: Player[] // for gradient stat coloring
  showWatchlist?: boolean       // show star (watchlist view)
}

// Stat keys shown on the card
type StatKey = 'ppg' | 'rpg' | 'apg' | 'fg3Pct' | 'efgPct'
const STAT_KEYS: { key: StatKey; label: string }[] = [
  { key: 'ppg',    label: 'PPG' },
  { key: 'rpg',    label: 'RPG' },
  { key: 'apg',    label: 'APG' },
  { key: 'fg3Pct', label: '3P%' },
  { key: 'efgPct', label: 'eFG%' },
]

/** Interpolate white → green based on 0–1 position in range */
function statColor(value: number, min: number, max: number): string {
  if (max === min) return '#ffffff'
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  // White (#ffffff) to green (#4ade80) gradient
  const r = Math.round(255 - t * (255 - 74))
  const g = Math.round(255 - t * (255 - 222))
  const b = Math.round(255 - t * (255 - 128))
  return `rgb(${r},${g},${b})`
}

export function BoardCard({
  player,
  rank,
  isDragOverlay = false,
  allPositionPlayers = [],
  showWatchlist = true,
}: BoardCardProps) {
  const [isRemoving, setIsRemoving] = useState(false)

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: player.id })

  const style = { transform: CSS.Transform.toString(transform), transition }

  const fitScore = useFitScore(player)
  const watchlistIds = useWatchlistIds()
  const toggleWatchlist = useNexusStore(s => s.toggleWatchlist)
  const openSidePanel = useNexusStore(s => s.openSidePanel)
  const removeFromBoard = useNexusStore(s => s.removeFromBoard)
  const updatePlayerStatus = useNexusStore(s => s.updatePlayerStatus)
  const scenarios = useNexusStore(s => s.scenarios)
  const activeScenarioId = useNexusStore(s => s.activeScenarioId)

  const isWatchlisted = watchlistIds.includes(player.id)
  const scenario = scenarios.find(s => s.id === activeScenarioId)

  // Compute min/max per stat across same-position players for gradient
  const statRanges = useMemo(() => {
    const pool = allPositionPlayers.length > 1 ? allPositionPlayers : [player]
    const ranges: Record<StatKey, { min: number; max: number }> = {
      ppg: { min: Infinity, max: -Infinity },
      rpg: { min: Infinity, max: -Infinity },
      apg: { min: Infinity, max: -Infinity },
      fg3Pct: { min: Infinity, max: -Infinity },
      efgPct: { min: Infinity, max: -Infinity },
    }
    for (const p of pool) {
      for (const { key } of STAT_KEYS) {
        ranges[key].min = Math.min(ranges[key].min, p[key])
        ranges[key].max = Math.max(ranges[key].max, p[key])
      }
    }
    return ranges
  }, [allPositionPlayers, player])

  function handleStatusChange(newStatus: PipelineStatus) {
    updatePlayerStatus(player.id, newStatus)
    if (newStatus === 'passed') {
      setIsRemoving(true)
      setTimeout(() => removeFromBoard(player.id), 400)
    }
  }

  if (isDragging) {
    return <div ref={setNodeRef} style={style} className="h-[72px] bg-white/5 rounded-xl border border-blue-500/30" />
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5',
        'bg-[#14171c] border border-white/10 rounded-xl',
        'hover:border-white/20 hover:bg-[#1a1e24] transition-all duration-300',
        isDragOverlay && 'shadow-2xl border-white/20 scale-[1.02]',
        isRemoving && 'opacity-0 scale-95 -translate-x-4'
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none"
        tabIndex={-1}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Rank */}
      <span className="text-gray-600 font-mono text-sm w-5 text-right shrink-0 select-none">{rank}</span>

      {/* Avatar */}
      <PlayerAvatar player={player} size={40} />

      {/* Name block */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-medium text-sm truncate">{player.name}</span>
          <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded text-white', positionColor(player.position))}>
            {player.position}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-gray-400 truncate">{player.previousSchool}</span>
          <span className="text-gray-600 text-xs">·</span>
          <span className="text-xs text-gray-600">{player.classYear}</span>
          <span className="text-gray-600 text-xs">·</span>
          <span className="text-xs text-gray-600">{player.eligibilityRemaining}yr</span>
        </div>
        <p className="text-xs text-gray-700 mt-0.5">{player.height} · {player.weight} lbs</p>
      </div>

      {/* Stats strip — gradient colored by position peers */}
      <div className="hidden md:flex items-center gap-4 shrink-0">
        {STAT_KEYS.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center min-w-[36px]">
            <span
              className="font-mono text-sm font-semibold"
              style={{ color: statColor(player[key], statRanges[key].min, statRanges[key].max) }}
            >
              {player[key].toFixed(1)}
            </span>
            <span className="text-[10px] text-gray-600 uppercase tracking-wide">{label}</span>
          </div>
        ))}
      </div>

      {/* Fit score */}
      <button
        onClick={(e) => { e.stopPropagation(); openSidePanel(player.id, 'fit') }}
        className="shrink-0"
      >
        <FitScoreBadge score={fitScore} size="sm" />
      </button>

      {/* Status pill (with change + passed→remove animation) */}
      <div className="hidden lg:block shrink-0">
        <StatusPill
          status={player.portalStatus}
          onChange={handleStatusChange}
        />
      </div>

      {/* Watchlist star (only in watchlist view) */}
      {showWatchlist && (
        <button
          onClick={(e) => { e.stopPropagation(); toggleWatchlist(player.id) }}
          className="p-1 shrink-0 hover:bg-white/5 rounded transition-colors"
        >
          <Star
            className={cn(
              'w-4 h-4 transition-colors',
              isWatchlisted ? 'fill-amber-400 text-amber-400' : 'text-gray-600 hover:text-gray-400'
            )}
          />
        </button>
      )}

      {/* Expand */}
      <button
        onClick={(e) => { e.stopPropagation(); openSidePanel(player.id, 'stats') }}
        className="p-1 shrink-0 text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
