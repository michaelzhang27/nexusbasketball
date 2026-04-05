'use client'

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BoardCard } from './BoardCard'
import type { Player } from '@/types'

interface BoardGroupProps {
  groupId: string
  players: Player[]
  startRank?: number
  showWatchlist?: boolean
}

export function BoardGroup({ groupId, players, startRank = 1, showWatchlist = true }: BoardGroupProps) {
  const ids = players.map(p => p.id)

  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy} id={groupId}>
      <div className="space-y-1.5">
        {players.map((player, index) => (
          <BoardCard
            key={player.id}
            player={player}
            rank={startRank + index}
            allPositionPlayers={players.filter(p => p.position === player.position)}
            showWatchlist={showWatchlist}
          />
        ))}
        {players.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-sm">
            No players in this group
          </div>
        )}
      </div>
    </SortableContext>
  )
}
