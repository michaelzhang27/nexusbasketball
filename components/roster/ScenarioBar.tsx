'use client'

import { useState } from 'react'
import { RotateCcw, GitCompare, Check, X, Pencil, CloudUpload, Loader2 } from 'lucide-react'
import { useNexusStore } from '@/store'
import { useActiveScenario } from '@/hooks/useProjectedStats'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { computeBudgetState } from '@/lib/nil'
import { formatDollar, cn } from '@/lib/utils'
import { getAccessToken } from '@/lib/auth'
import { saveScenario } from '@/lib/api'

export function ScenarioBar() {
  const { show } = useToast()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [budgetValue, setBudgetValue] = useState('')

  const [isSaving, setIsSaving] = useState(false)

  const activeScenarioId = useNexusStore(s => s.activeScenarioId)
  const renameScenario = useNexusStore(s => s.renameScenario)
  const resetScenarioToReturners = useNexusStore(s => s.resetScenarioToReturners)
  const updateScenarioBudget = useNexusStore(s => s.updateScenarioBudget)

  const scenario = useActiveScenario()
  const nilDeals = scenario?.nilDeals ?? {}
  const budget = scenario ? computeBudgetState(scenario, nilDeals) : null

  function startRename() {
    setRenameValue(scenario?.name ?? '')
    setIsRenaming(true)
  }

  function commitRename() {
    if (renameValue.trim() && scenario) {
      renameScenario(scenario.id, renameValue.trim())
      show('Scenario renamed', 'success')
    }
    setIsRenaming(false)
  }

  function startEditBudget() {
    setBudgetValue(String(scenario?.budget ?? 5_000_000))
    setIsEditingBudget(true)
  }

  function commitBudget() {
    const val = parseInt(budgetValue.replace(/[^0-9]/g, ''), 10)
    if (!isNaN(val) && val > 0 && scenario) {
      updateScenarioBudget(scenario.id, val)
      show('Budget updated', 'success')
    }
    setIsEditingBudget(false)
  }

  async function handleSave() {
    if (!scenario || isSaving) return
    setIsSaving(true)
    try {
      const token = await getAccessToken()
      if (!token) {
        show('Sign in to save to cloud', 'error')
        return
      }
      const ok = await saveScenario(token, scenario)
      show(ok ? 'Roster saved to cloud' : 'Save failed — try again', ok ? 'success' : 'error')
    } catch {
      show('Save failed — try again', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const budgetPct = budget ? Math.min(100, ((budget.committed + budget.targeted) / budget.total) * 100) : 0
  const isOverBudget = budget ? budget.remaining < 0 : false

  return (
    <div className="flex items-center gap-4 px-6 py-3 border-b border-white/10 bg-[#0f1114] flex-wrap">
      {/* Scenario name + inline rename */}
      <div className="flex items-center gap-2">
        {isRenaming ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setIsRenaming(false) }}
              className="bg-white/5 border border-blue-500 rounded px-2 py-1 text-sm text-white w-40 focus:outline-none"
            />
            <button onClick={commitRename} className="p-1 text-green-400 hover:text-green-300"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setIsRenaming(false)} className="p-1 text-gray-500 hover:text-gray-300"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white">{scenario?.name}</span>
            <button
              onClick={startRename}
              className="p-1 text-gray-600 hover:text-gray-400 transition-colors"
              title="Rename scenario"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Budget bar */}
      {budget && (
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">NIL Budget:</span>
                {isEditingBudget ? (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">$</span>
                    <input
                      autoFocus
                      value={budgetValue}
                      onChange={e => setBudgetValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitBudget(); if (e.key === 'Escape') setIsEditingBudget(false) }}
                      className="bg-white/5 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white w-24 focus:outline-none"
                    />
                    <button onClick={commitBudget} className="text-green-400 hover:text-green-300"><Check className="w-3 h-3" /></button>
                    <button onClick={() => setIsEditingBudget(false)} className="text-gray-500 hover:text-gray-300"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <button
                    onClick={startEditBudget}
                    className="text-gray-400 hover:text-white font-mono transition-colors"
                    title="Edit budget"
                  >
                    {formatDollar(budget.total)}
                  </button>
                )}
              </div>
              <span className={cn('font-mono', isOverBudget ? 'text-red-400' : 'text-gray-400')}>
                {formatDollar(budget.remaining)} remaining
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full flex">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(100, (budget.committed / budget.total) * 100)}%` }}
                />
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${Math.min(100, (budget.targeted / budget.total) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          {isOverBudget && (
            <span className="text-xs text-red-400 bg-red-900/30 border border-red-700/40 px-2 py-0.5 rounded shrink-0">Over Budget</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => show('Side-by-side scenario comparison — coming soon.', 'info')}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Compare</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            resetScenarioToReturners(activeScenarioId)
            show('Roster reset to returners', 'info')
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <CloudUpload className="w-3.5 h-3.5" />
          }
          <span className="hidden sm:inline">{isSaving ? 'Saving…' : 'Save'}</span>
        </Button>
      </div>
    </div>
  )
}
