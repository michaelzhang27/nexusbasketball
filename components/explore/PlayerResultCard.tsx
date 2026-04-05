'use client'

import { useMemo } from 'react'
import { Star, Plus, ClipboardList, UserPlus, ChevronRight } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useNexusStore, useWatchlistIds, useActiveBoardGroups } from '@/store'
import { useFitScore } from '@/hooks/useFitScore'
import { useActiveScenario } from '@/hooks/useProjectedStats'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { FitScoreBadge, getFitScoreLabel } from '@/components/shared/FitScoreBadge'
import { StatusPill } from '@/components/shared/StatusPill'
import { Badge } from '@/components/ui/Badge'
import { generateRosterImpact } from '@/lib/projections'
import { cn, positionColor, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import type { Player } from '@/types'

interface PlayerResultCardProps {
  player: Player
}

export function PlayerResultCard({ player }: PlayerResultCardProps) {
  const { show } = useToast()
  const fitScore = useFitScore(player)
  const scenario = useActiveScenario()
  const players = useNexusStore(s => s.players)
  const returners = useNexusStore(s => s.returners)
  const toggleWatchlist = useNexusStore(s => s.toggleWatchlist)
  const watchlistIds = useWatchlistIds()
  const openSidePanel = useNexusStore(s => s.openSidePanel)
  const boardGroups = useActiveBoardGroups()
  const reorderBoard = useNexusStore(s => s.reorderBoard)
  const updateScenarioSlot = useNexusStore(s => s.updateScenarioSlot)
  const updatePlayerStatus = useNexusStore(s => s.updatePlayerStatus)
  const activeScenarioId = useNexusStore(s => s.activeScenarioId)

  const isWatchlisted = watchlistIds.includes(player.id)
  const isOnBoard = boardGroups.find(g => g.id === 'overall')?.playerIds.includes(player.id) ?? false

  const rosterImpact = useMemo(() => {
    if (!scenario) return null
    const allPlayers = [...players, ...returners]
    return generateRosterImpact(player, scenario, allPlayers)
  }, [player, scenario, players, returners])

  function handleAddToBoard() {
    const overallGroup = boardGroups.find(g => g.id === 'overall')
    const posGroup = boardGroups.find(g => g.id === player.position)
    if (!overallGroup) return

    if (!overallGroup.playerIds.includes(player.id)) {
      reorderBoard('overall', [...overallGroup.playerIds, player.id])
    }
    if (posGroup && !posGroup.playerIds.includes(player.id)) {
      reorderBoard(player.position, [...posGroup.playerIds, player.id])
    }
    show(`${player.name} added to board`, 'success')
  }

  function handleAddToRoster() {
    if (!scenario) return
    const emptySlot = scenario.slots.find(s => s.position === player.position && s.playerId === null && !s.isReturnerSlot)
    if (!emptySlot) {
      show(`No open ${player.position} slot in current scenario`, 'warning')
      return
    }
    updateScenarioSlot(activeScenarioId, emptySlot.index, player.id)
    show(`${player.name} added to roster`, 'success')
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <div
        className="bg-[#14171c] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors cursor-pointer"
        onClick={() => openSidePanel(player.id, 'stats')}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <PlayerAvatar player={player} size={44} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-sm truncate">{player.name}</span>
              <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded text-white', positionColor(player.position))}>
                {player.position}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{player.previousSchool}</p>
            <p className="text-xs text-gray-600">{player.conference} · {player.classYear} · {player.eligibilityRemaining}yr eligible</p>
            <p className="text-xs text-gray-700 mt-0.5">{player.height} · {player.weight} lbs</p>
          </div>
          <div className="flex flex-col items-end gap-1" onClick={e => e.stopPropagation()}>
            <FitScoreBadge score={fitScore} size="md" />
            <StatusPill
              status={player.portalStatus}
              onChange={player.portalStatus !== 'not_in_portal' ? s => updatePlayerStatus(player.id, s) : undefined}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3 py-2 border-y border-white/5">
          {[
            { label: 'PPG', value: player.ppg },
            { label: 'RPG', value: player.rpg },
            { label: 'APG', value: player.apg },
            { label: '3P%', value: player.fg3Pct },
            { label: 'eFG%', value: player.efgPct },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center flex-1">
              <span className="font-mono text-sm font-semibold text-white">{value.toFixed(1)}</span>
              <span className="text-[10px] text-gray-600 uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>

        {/* Roster impact */}
        {rosterImpact && (
          <p className="text-xs text-gray-400 mb-2 leading-relaxed">{rosterImpact}</p>
        )}

        {/* NIL range */}
        <p className="text-xs text-gray-600 mb-3 italic">Estimated market rate NIL coming soon</p>

        {/* Action buttons */}
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <ActionButton
            tooltip="Add to Board"
            onClick={handleAddToBoard}
            icon={<ClipboardList className="w-3.5 h-3.5" />}
            active={isOnBoard}
          />
          <ActionButton
            tooltip={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            onClick={() => { toggleWatchlist(player.id); show(isWatchlisted ? 'Removed from watchlist' : `${player.name} added to watchlist`, 'success') }}
            icon={<Star className={cn('w-3.5 h-3.5', isWatchlisted && 'fill-amber-400 text-amber-400')} />}
            active={isWatchlisted}
          />
          <ActionButton
            tooltip="Add to Roster"
            onClick={handleAddToRoster}
            icon={<UserPlus className="w-3.5 h-3.5" />}
          />
          <ActionButton
            tooltip="Open Profile"
            onClick={() => openSidePanel(player.id, 'stats')}
            icon={<ChevronRight className="w-3.5 h-3.5" />}
          />
        </div>
      </div>
    </Tooltip.Provider>
  )
}

function ActionButton({
  tooltip,
  onClick,
  icon,
  active,
}: {
  tooltip: string
  onClick: () => void
  icon: React.ReactNode
  active?: boolean
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors',
            active
              ? 'bg-blue-900/40 border-blue-700/50 text-blue-400'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
          )}
        >
          {icon}
          <span className="hidden sm:inline">{tooltip.split(' ').slice(1).join(' ')}</span>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="bg-[#1a1e24] border border-white/10 text-xs text-gray-300 px-2 py-1 rounded-lg shadow-lg z-50"
          sideOffset={4}
        >
          {tooltip}
          <Tooltip.Arrow className="fill-[#1a1e24]" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
