'use client'

import { useMemo } from 'react'
import { Download, FileText, Play } from 'lucide-react'
import { useNexusStore, useActiveRosterGroups } from '@/store'
import { useActiveScenario } from '@/hooks/useProjectedStats'
import { NilBudgetBar } from '@/components/nil/NilBudgetBar'
import { NilDealCard } from '@/components/nil/NilDealCard'
import { NilPortfolioSummary } from '@/components/nil/NilPortfolioSummary'
import { MinutesManager } from '@/components/roster/MinutesManager'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { useAllPlayers } from '@/hooks/usePlayer'
import { cn } from '@/lib/utils'

export default function NilPage() {
  const { show } = useToast()
  const scenario = useActiveScenario()
  const allPlayers = useAllPlayers()
  const isPredicted = useNexusStore(s => s.isPredicted)
  const predictionsStale = useNexusStore(s => s.predictionsStale)
  const rosterGroups = useActiveRosterGroups()

  const rosterPlayers = useMemo(() => {
    if (!scenario) return []
    const playerMap = new Map(allPlayers.map(p => [p.id, p]))
    const ids = [...new Set(rosterGroups.flatMap(g => g.playerIds))]
    return ids.map(id => playerMap.get(id)).filter((p): p is NonNullable<typeof p> => p !== undefined)
  }, [scenario, allPlayers, rosterGroups])

  // BPM-proportional suggested NIL values: each player's share = max(bpm,0) / totalPositiveBpm * budget
  const bpmSuggested = useMemo(() => {
    const budget = scenario?.budget ?? 0
    const totalPositiveBpm = rosterPlayers.reduce((s, p) => s + Math.max(0, p.bpm), 0)
    const result: Record<string, { value: number; share: number }> = {}
    for (const p of rosterPlayers) {
      const share = totalPositiveBpm > 0 ? Math.max(0, p.bpm) / totalPositiveBpm : 0
      result[p.id] = { value: Math.round(share * budget), share }
    }
    return result
  }, [rosterPlayers, scenario?.budget])

  const hasPlayers = rosterPlayers.length > 0

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">
      {/* Context bar */}
      <div className="border-b border-white/10 bg-[#0f1114] px-6 py-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-400">NIL Planning for</p>
            <p className="text-sm font-semibold text-white">{scenario?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm"
              onClick={() => show('PDF export coming soon.', 'info')}>
              <Download className="w-3.5 h-3.5" />
              Export Report
            </Button>
            <Button variant="secondary" size="sm"
              onClick={() => show('PDF export coming soon.', 'info')}>
              <FileText className="w-3.5 h-3.5" />
              Build Collective Deck
            </Button>
          </div>
        </div>
        <NilBudgetBar />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Minutes manager — always visible so coaches can adjust without going to Roster tab */}
        {hasPlayers && (
          <MinutesManager />
        )}

        {/* Gate: show NIL cards only after predictions */}
        {!hasPlayers ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-600">
            <p className="text-sm">No players in the active roster scenario.</p>
            <p className="text-xs">Add players in the Roster tab to see NIL valuations.</p>
          </div>
        ) : !isPredicted ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-white">Assign minutes first</p>
              <p className="text-xs text-gray-500">
                Set each player's minutes range above so that the expected total equals 200, then run predictions to see NIL valuations.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Play className="w-3.5 h-3.5" />
              Use the "Run Predictions" button in the minutes panel above.
            </div>
          </div>
        ) : (
          <>
            {/* Stale warning — predictions visible but flagged */}
            {predictionsStale && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-900/20 border border-amber-700/30 rounded-xl text-xs text-amber-400">
                <span>Minutes changed since last prediction. Rerun predictions in the panel above to refresh valuations.</span>
              </div>
            )}

            <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-3', predictionsStale && 'opacity-60')}>
              {rosterPlayers.map(player => (
                <NilDealCard
                  key={player.id}
                  player={player}
                  suggestedValue={bpmSuggested[player.id]?.value ?? 0}
                  bpmShare={bpmSuggested[player.id]?.share ?? 0}
                />
              ))}
            </div>

            <NilPortfolioSummary />
          </>
        )}
      </div>
    </div>
  )
}
