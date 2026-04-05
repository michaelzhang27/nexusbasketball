'use client'

import { useMemo } from 'react'
import { Zap } from 'lucide-react'
import { useNexusStore } from '@/store'
import { useActiveScenario } from '@/hooks/useProjectedStats'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { FitScoreBadge } from '@/components/shared/FitScoreBadge'
import { getGapFillRecommendations } from '@/lib/projections'
import { computeAllFitScores } from '@/lib/fitScore'
import { cn, positionColor } from '@/lib/utils'

export function RecommendedSection() {
  const players = useNexusStore(s => s.players)
  const returners = useNexusStore(s => s.returners)
  const models = useNexusStore(s => s.models)
  const activeModelId = useNexusStore(s => s.activeModelId)
  const openSidePanel = useNexusStore(s => s.openSidePanel)
  const scenario = useActiveScenario()

  const recommendations = useMemo(() => {
    if (!scenario) return []
    const model = models.find(m => m.id === activeModelId)
    if (!model) return []
    const allPlayers = [...players, ...returners]
    return getGapFillRecommendations(scenario, allPlayers, model, 6)
  }, [scenario, models, activeModelId, players, returners])

  const activeModel = models.find(m => m.id === activeModelId)

  // Compute normalized fit scores for all recommendations
  const recommendationScores = useMemo(() => {
    if (!activeModel || recommendations.length === 0) return {}
    return computeAllFitScores([...players, ...returners], activeModel)
  }, [recommendations, activeModel, players, returners])

  if (recommendations.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-white">Recommended for your roster</h2>
        {activeModel && (
          <span className="text-xs text-gray-600">based on {activeModel.name} model</span>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {recommendations.map(player => {
          const score = recommendationScores[player.id]
          return (
            <button
              key={player.id}
              onClick={() => openSidePanel(player.id, 'stats')}
              className="flex flex-col items-center gap-2 p-3 bg-[#14171c] border border-white/10 rounded-xl min-w-[130px] hover:border-white/20 transition-colors shrink-0 text-left"
            >
              <PlayerAvatar player={player} size={40} />
              <div className="text-center w-full">
                <p className="text-xs font-medium text-white truncate">{player.name}</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded text-white', positionColor(player.position))}>
                    {player.position}
                  </span>
                </div>
              </div>
              <FitScoreBadge score={score} size="sm" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
