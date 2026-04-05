'use client'

import { useState } from 'react'
import { Save, Sparkles } from 'lucide-react'
import { useNexusStore } from '@/store'
import { CoefficientSlider } from './CoefficientSlider'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { getAccessToken } from '@/lib/auth'
import { saveModel as saveModelToCloud } from '@/lib/api'
import type { EvaluationModel, ModelCoefficients, ModelGroupPosition } from '@/types'

// 2 position-endpoint tabs — coefficients for SG/SF/PF are interpolated at score time
const GROUPS: { value: ModelGroupPosition; label: string; hint: string }[] = [
  { value: 'Guard', label: 'Guards', hint: 'PG endpoint' },
  { value: 'Big',   label: 'Bigs',   hint: 'C endpoint'  },
]

const COEFFICIENT_GROUPS: { label: string; keys: (keyof ModelCoefficients)[] }[] = [
  { label: 'Scoring',     keys: ['points', 'fg3m', 'fga', 'fta'] },
  { label: 'Playmaking',  keys: ['assists', 'turnovers'] },
  { label: 'Rebounding',  keys: ['oreb', 'dreb'] },
  { label: 'Defense',     keys: ['steals', 'blocks', 'fouls'] },
]

// User-friendly labels — penalty stats clarify the direction
const STAT_LABELS: Record<keyof ModelCoefficients, string> = {
  points:    'Scoring',
  fga:       'Shot Selection',   // importance of penalizing high shot volume
  fta:       'FT Aggression',    // importance of penalizing excessive FT attempts
  fg3m:      '3PT Shooting',
  assists:   'Assists',
  turnovers: 'Ball Security',    // importance of penalizing turnovers
  oreb:      'Off. Rebounds',
  dreb:      'Def. Rebounds',
  steals:    'Steals',
  blocks:    'Blocks',
  fouls:     'Foul Avoidance',   // importance of penalizing fouls
}

interface ModelBuilderProps {
  model: EvaluationModel
  onModelChange: (model: EvaluationModel) => void
}

export function ModelBuilder({ model, onModelChange }: ModelBuilderProps) {
  const { show } = useToast()
  const saveModel = useNexusStore(s => s.saveModel)
  const [activeGroup, setActiveGroup] = useState<ModelGroupPosition>('Guard')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(COEFFICIENT_GROUPS.map(g => g.label))
  )

  const isReadOnly = !!model.isPreset

  function updateCoefficient(stat: keyof ModelCoefficients, value: number) {
    if (isReadOnly) return
    onModelChange({
      ...model,
      coefficients: {
        ...model.coefficients,
        [activeGroup]: {
          ...model.coefficients[activeGroup],
          [stat]: parseFloat(value.toFixed(1)),
        },
      },
    })
  }

  function resetCoefficient(stat: keyof ModelCoefficients) {
    if (isReadOnly) return
    updateCoefficient(stat, 1.0)
  }

  async function handleSave() {
    saveModel(model)
    show('Model saved', 'success')
    try {
      const token = await getAccessToken()
      if (token) await saveModelToCloud(token, model)
    } catch { /* silent — model is always in localStorage */ }
  }

  function handleAIForecast() {
    // Coming soon — not yet implemented
  }

  function isGroupCustomized(group: ModelGroupPosition): boolean {
    if (model.isPreset) return false
    const coeffs = model.coefficients[group]
    return Object.values(coeffs).some(v => Math.abs(v - 1.0) > 0.05)
  }

  function toggleGroup(label: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const currentCoeffs = model.coefficients[activeGroup]

  return (
    <div className="space-y-4">
      {/* Model name */}
      <div className="space-y-2">
        <input
          value={model.name}
          onChange={e => !isReadOnly && onModelChange({ ...model, name: e.target.value })}
          readOnly={isReadOnly}
          placeholder="Model name..."
          className={cn(
            'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2',
            'text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors',
            isReadOnly && 'opacity-60 cursor-not-allowed'
          )}
        />
        <textarea
          value={model.description}
          onChange={e => !isReadOnly && onModelChange({ ...model, description: e.target.value })}
          readOnly={isReadOnly}
          placeholder="Describe the philosophy behind this model..."
          rows={2}
          className={cn(
            'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2',
            'text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none',
            isReadOnly && 'opacity-60 cursor-not-allowed'
          )}
        />
      </div>

      {/* AI forecast button — coming soon */}
      {!isReadOnly && (
        <button
          disabled
          title="Coming soon"
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-sm border-white/8 bg-white/3 text-gray-600 cursor-not-allowed"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Use AI to forecast coefficients
          <span className="text-[10px] bg-white/8 px-1.5 py-0.5 rounded-full">Coming soon</span>
        </button>
      )}

      {/* Position group tabs */}
      <div className="flex gap-1.5">
        {GROUPS.map(({ value, label, hint }) => (
          <button
            key={value}
            onClick={() => setActiveGroup(value)}
            className={cn(
              'relative flex-1 px-3 py-2 text-xs rounded-lg border transition-colors text-center',
              activeGroup === value
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
            )}
          >
            <span className="font-medium">{label}</span>
            <span className="block text-[10px] opacity-60 mt-0.5">{hint}</span>
            {isGroupCustomized(value) && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-400" />
            )}
          </button>
        ))}
      </div>

      {isReadOnly && (
        <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 px-3 py-2 rounded-lg">
          Preset models are read-only. Create your own model to customize coefficients.
        </p>
      )}

      {/* Coefficient groups */}
      <div className="space-y-3">
        {COEFFICIENT_GROUPS.map(group => (
          <div key={group.label} className="bg-[#1a1e24] rounded-xl overflow-hidden">
            <button
              onClick={() => toggleGroup(group.label)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
            >
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{group.label}</span>
              <span className="text-gray-600 text-xs">{expandedGroups.has(group.label) ? '▲' : '▼'}</span>
            </button>
            {expandedGroups.has(group.label) && (
              <div className="px-4 pb-3 space-y-3">
                {group.keys.map(stat => (
                  <CoefficientSlider
                    key={stat}
                    label={STAT_LABELS[stat]}
                    value={currentCoeffs[stat]}
                    onChange={v => updateCoefficient(stat, v)}
                    onReset={() => resetCoefficient(stat)}
                    disabled={isReadOnly}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save button */}
      {!isReadOnly && (
        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4" />
          Save Model
        </Button>
      )}
    </div>
  )
}
