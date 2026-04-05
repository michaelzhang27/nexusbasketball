'use client'

import {
  DndContext,
  closestCenter,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useState } from 'react'
import { useNexusStore } from '@/store'
import { BoardGroup } from './BoardGroup'
import { BoardCard } from './BoardCard'
import type { Player } from '@/types'

interface DraggableBoardProps {
  groupId: string
  players: Player[]
  showWatchlist?: boolean
}

export function DraggableBoard({ groupId, players, showWatchlist = true }: DraggableBoardProps) {
  const reorderBoard = useNexusStore(s => s.reorderBoard)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // prevent accidental drags
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const activePlayer = activeId ? players.find(p => p.id === activeId) : null
  const activeRank = activeId ? players.findIndex(p => p.id === activeId) + 1 : 0

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const oldIndex = players.findIndex(p => p.id === active.id)
    const newIndex = players.findIndex(p => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(players.map(p => p.id), oldIndex, newIndex)
    reorderBoard(groupId, newOrder)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <BoardGroup groupId={groupId} players={players} showWatchlist={showWatchlist} />

      <DragOverlay>
        {activePlayer ? (
          <BoardCard player={activePlayer} rank={activeRank} isDragOverlay showWatchlist={showWatchlist} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
