'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useNexusStore } from '@/store'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { FitScoreBadge } from '@/components/shared/FitScoreBadge'
import { computeAllFitScores } from '@/lib/fitScore'
import { cn, positionColor } from '@/lib/utils'
import type { EvaluationModel } from '@/types'

interface LivePreviewProps {
  draftModel: EvaluationModel
}

export function LivePreview({ draftModel }: LivePreviewProps) {
  const players = useNexusStore(s => s.players)
  const models = useNexusStore(s => s.models)
  const activeModelId = useNexusStore(s => s.activeModelId)
  const [debouncedModel, setDebouncedModel] = useState(draftModel)

  // Debounce model changes 300ms
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedModel(draftModel), 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [draftModel])

  const activeModel = models.find(m => m.id === activeModelId)

  const preview = useMemo(() => {
    // Compute pool-normalized scores for both models
    const draftScores  = computeAllFitScores(players, debouncedModel)
    const activeScores = activeModel ? computeAllFitScores(players, activeModel) : null

    // Rank by draft model score
    const draftRanked = [...players]
      .map(p => ({ player: p, score: draftScores[p.id] ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    if (!activeScores) return draftRanked.map((r, i) => ({ ...r, rank: i + 1, delta: 0 }))

    // Rank by active model to compute delta
    const activeRankedIds = [...players]
      .map(p => ({ id: p.id, score: activeScores[p.id] ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .map(r => r.id)

    return draftRanked.map((r, i) => {
      const activeRank = activeRankedIds.indexOf(r.player.id) + 1
      return {
        ...r,
        rank: i + 1,
        delta: activeRank - (i + 1), // positive = moved up vs. active model
      }
    })
  }, [players, debouncedModel, activeModel])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Live Preview</h3>
          <p className="text-xs text-gray-600 mt-0.5">Top 10 from your overall board rankings</p>
        </div>
        <span className="text-xs text-gray-600">vs. active model</span>
      </div>

      <div className="space-y-1.5">
        {preview.map(({ player, score, rank, delta }) => (
          <div
            key={player.id}
            className="flex items-center gap-2.5 p-2.5 bg-[#1a1e24] rounded-lg"
          >
            <span className="text-gray-600 font-mono text-xs w-5 text-right">{rank}</span>
            <PlayerAvatar player={player} size={28} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{player.name}</p>
              <span className={cn('text-xs font-medium px-1 py-0.5 rounded text-white', positionColor(player.position))}>
                {player.position}
              </span>
            </div>
            <FitScoreBadge score={score} size="sm" />
            <Delta delta={delta} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Delta({ delta }: { delta: number }) {
  if (Math.abs(delta) === 0) {
    return <span className="text-gray-600"><Minus className="w-3 h-3" /></span>
  }
  if (delta > 0) {
    return (
      <span className="flex items-center gap-0.5 text-green-400 text-xs font-mono">
        <TrendingUp className="w-3 h-3" />+{delta}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-0.5 text-red-400 text-xs font-mono">
      <TrendingDown className="w-3 h-3" />{delta}
    </span>
  )
}
