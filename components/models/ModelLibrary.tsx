'use client'

import { Plus } from 'lucide-react'
import { useNexusStore } from '@/store'
import { FitScoreBadge } from '@/components/shared/FitScoreBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { getAccessToken } from '@/lib/auth'
import { deleteModel as deleteModelFromCloud } from '@/lib/api'
import type { EvaluationModel } from '@/types'

interface ModelLibraryProps {
  selectedModelId: string | null
  onSelectModel: (model: EvaluationModel) => void
}

export function ModelLibrary({ selectedModelId, onSelectModel }: ModelLibraryProps) {
  const { show } = useToast()
  const models = useNexusStore(s => s.models)
  const activeModelId = useNexusStore(s => s.activeModelId)
  const setActiveModel = useNexusStore(s => s.setActiveModel)
  const deleteModel = useNexusStore(s => s.deleteModel)

  const presetModels = models.filter(m => m.isPreset)
  const customModels = models.filter(m => !m.isPreset)

  function handleSetActive(modelId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setActiveModel(modelId)
    show('Fit scores updated', 'success')
  }

  function handleNewModel() {
    // Seed with the Historical preset's coefficients as a starting point
    const historical = models.find(m => m.id === 'model-balanced')
    const seedCoeffs = historical
      ? historical.coefficients
      : {
          Guard: { points: 0.860, fga: 0.560, fta: 0.246, fg3m: 0.389, assists: 0.580, turnovers: 0.964, oreb: 0.613, dreb: 0.116, steals: 1.369, blocks: 1.327, fouls: 0.367 },
          Big:   { points: 0.860, fga: 0.780, fta: 0.343, fg3m: 0.389, assists: 1.034, turnovers: 0.964, oreb: 0.181, dreb: 0.181, steals: 1.008, blocks: 0.703, fouls: 0.367 },
        }
    const newModel: EvaluationModel = {
      id: `model-custom-${Date.now()}`,
      name: 'New Custom Model',
      description: '',
      isPreset: false,
      createdAt: new Date().toISOString(),
      coefficients: {
        Guard: { ...seedCoeffs.Guard },
        Big:   { ...seedCoeffs.Big },
      },
    }
    onSelectModel(newModel)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Model Library</h2>
        <Button size="sm" variant="secondary" onClick={handleNewModel}>
          <Plus className="w-3.5 h-3.5" />
          New
        </Button>
      </div>

      {/* Custom models */}
      {customModels.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-600 uppercase tracking-wide">Custom</p>
          {customModels.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              isActive={model.id === activeModelId}
              isSelected={model.id === selectedModelId}
              onSelect={() => onSelectModel(model)}
              onSetActive={(e) => handleSetActive(model.id, e)}
              onDelete={async () => {
                deleteModel(model.id)
                show('Model deleted', 'info')
                try {
                  const token = await getAccessToken()
                  if (token) await deleteModelFromCloud(token, model.id)
                } catch { /* silent */ }
              }}
            />
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Preset models */}
      <div className="space-y-1.5">
        <p className="text-xs text-gray-600 uppercase tracking-wide">Presets (read-only)</p>
        {presetModels.map(model => (
          <ModelCard
            key={model.id}
            model={model}
            isActive={model.id === activeModelId}
            isSelected={model.id === selectedModelId}
            onSelect={() => onSelectModel(model)}
            onSetActive={(e) => handleSetActive(model.id, e)}
          />
        ))}
      </div>
    </div>
  )
}

function ModelCard({
  model,
  isActive,
  isSelected,
  onSelect,
  onSetActive,
  onDelete,
}: {
  model: EvaluationModel
  isActive: boolean
  isSelected: boolean
  onSelect: () => void
  onSetActive: (e: React.MouseEvent) => void
  onDelete?: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'p-3 rounded-xl border cursor-pointer transition-all',
        isSelected
          ? 'bg-white/8 border-white/20'
          : 'bg-[#1a1e24] border-white/8 hover:border-white/15',
        isActive && 'border-l-2 border-l-blue-500'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-white truncate">{model.name}</span>
        {isActive && <Badge variant="blue" className="text-[10px] shrink-0">Active</Badge>}
      </div>
      {model.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{model.description}</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        {!isActive && (
          <button
            onClick={onSetActive}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Set active
          </button>
        )}
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors ml-auto"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
