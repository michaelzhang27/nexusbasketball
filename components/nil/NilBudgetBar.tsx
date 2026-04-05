'use client'

import { useState } from 'react'
import { useNexusStore, useActiveNilDeals } from '@/store'
import { useActiveScenario } from '@/hooks/useProjectedStats'
import { computeBudgetState } from '@/lib/nil'
import { formatDollar, cn } from '@/lib/utils'

export function NilBudgetBar() {
  const scenario = useActiveScenario()
  const nilDeals = useActiveNilDeals()
  const updateScenarioBudget = useNexusStore(s => s.updateScenarioBudget)
  const activeScenarioId = useNexusStore(s => s.activeScenarioId)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')

  if (!scenario) return null

  const budget = computeBudgetState(scenario, nilDeals)
  const committedPct = Math.min(100, (budget.committed / budget.total) * 100)
  const targetedPct = Math.min(100, (budget.targeted / budget.total) * 100)
  const isOverBudget = budget.remaining < 0

  function handleBudgetEdit() {
    setBudgetInput(String(scenario!.budget))
    setIsEditingBudget(true)
  }

  function commitBudget() {
    const val = parseInt(budgetInput.replace(/[^0-9]/g, ''), 10)
    if (!isNaN(val) && val > 0) {
      updateScenarioBudget(activeScenarioId, val)
    }
    setIsEditingBudget(false)
  }

  return (
    <div className="space-y-3">
      {/* Budget figures */}
      <div className="flex items-center gap-6 flex-wrap">
        <BudgetFigure
          label="Total Budget"
          value={budget.total}
          onClick={handleBudgetEdit}
          isEditing={isEditingBudget}
          inputValue={budgetInput}
          onInputChange={setBudgetInput}
          onBlur={commitBudget}
          editable
        />
        <BudgetFigure label="Committed" value={budget.committed} color="text-blue-400" />
        <BudgetFigure label="Targeted" value={budget.targeted} color="text-amber-400" />
        <BudgetFigure
          label="Remaining"
          value={budget.remaining}
          color={isOverBudget ? 'text-red-400' : budget.remaining < budget.total * 0.2 ? 'text-amber-400' : 'text-green-400'}
        />
      </div>

      {/* Bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full flex">
          <div
            className={cn('h-full transition-all', isOverBudget ? 'bg-red-500' : 'bg-blue-500')}
            style={{ width: `${committedPct}%` }}
          />
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${Math.min(targetedPct, 100 - committedPct)}%` }}
          />
        </div>
      </div>

      {isOverBudget && (
        <p className="text-xs text-red-400">⚠ Over budget by {formatDollar(Math.abs(budget.remaining))}</p>
      )}
    </div>
  )
}

function BudgetFigure({
  label,
  value,
  color = 'text-white',
  onClick,
  isEditing,
  inputValue,
  onInputChange,
  onBlur,
  editable,
}: {
  label: string
  value: number
  color?: string
  onClick?: () => void
  isEditing?: boolean
  inputValue?: string
  onInputChange?: (v: string) => void
  onBlur?: () => void
  editable?: boolean
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      {isEditing && editable ? (
        <input
          autoFocus
          value={inputValue}
          onChange={e => onInputChange?.(e.target.value)}
          onBlur={onBlur}
          onKeyDown={e => { if (e.key === 'Enter') onBlur?.() }}
          className="font-mono text-sm text-white bg-white/5 border border-blue-500 rounded px-2 py-0.5 w-28 focus:outline-none"
        />
      ) : (
        <button
          onClick={onClick}
          className={cn('font-mono text-sm font-semibold text-left', color, editable && 'hover:opacity-80')}
        >
          {formatDollar(Math.abs(value))}{value < 0 ? ' over' : ''}
        </button>
      )}
    </div>
  )
}
