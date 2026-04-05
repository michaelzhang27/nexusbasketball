'use client'

import { useMemo } from 'react'
import { useActiveNilDeals, useActiveRosterGroups } from '@/store'
import { useActiveScenario } from '@/hooks/useProjectedStats'
import { useAllPlayers } from '@/hooks/usePlayer'
import { formatDollar, positionColor, cn } from '@/lib/utils'
import type { NilDealStatus, Position } from '@/types'

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']

const STATUS_ORDER: NilDealStatus[] = ['signed', 'negotiating', 'offered', 'targeted']
const STATUS_LABELS: Record<NilDealStatus, string> = {
  signed: 'Signed', negotiating: 'Negotiating', offered: 'Offered',
  targeted: 'Targeted', not_targeted: 'Not Targeted',
}
const STATUS_COLOR: Record<NilDealStatus, string> = {
  signed: 'bg-green-500', negotiating: 'bg-orange-500',
  offered: 'bg-amber-500', targeted: 'bg-blue-500', not_targeted: 'bg-gray-600',
}

export function NilPortfolioSummary() {
  const nilDeals = useActiveNilDeals()
  const scenario = useActiveScenario()
  const allPlayers = useAllPlayers()
  const rosterGroups = useActiveRosterGroups()

  const summary = useMemo(() => {
    if (!scenario) return null

    const playerMap = new Map(allPlayers.map(p => [p.id, p]))
    const rosterPlayerIds = [...new Set(rosterGroups.flatMap(g => g.playerIds))]

    // Status breakdown
    const statusCounts: Partial<Record<NilDealStatus, { count: number; totalOffer: number }>> = {}
    for (const pid of rosterPlayerIds) {
      const deal = nilDeals[pid]
      const status: NilDealStatus = deal?.status ?? 'not_targeted'
      if (!statusCounts[status]) statusCounts[status] = { count: 0, totalOffer: 0 }
      statusCounts[status]!.count++
      statusCounts[status]!.totalOffer += deal?.offerAmount ?? 0
    }

    // Budget by position (committed only — no fake market rate estimates)
    const posBudget: Partial<Record<Position, { committed: number }>> = {}
    for (const pid of rosterPlayerIds) {
      const player = playerMap.get(pid)
      if (!player) continue
      const deal = nilDeals[pid]
      const pos = player.position
      if (!posBudget[pos]) posBudget[pos] = { committed: 0 }
      posBudget[pos]!.committed += deal?.offerAmount ?? 0
    }

    const totalOffer = Object.values(nilDeals).reduce((s, d) => s + (d?.offerAmount ?? 0), 0)
    const budget = scenario.budget

    return { statusCounts, posBudget, totalOffer, budget, rosterSize: rosterPlayerIds.length }
  }, [nilDeals, scenario, allPlayers, rosterGroups])

  if (!summary) return null

  const activeDeals = STATUS_ORDER.filter(s => summary.statusCounts[s]?.count)

  return (
    <div className="bg-[#14171c] border border-white/10 rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-semibold text-white">Portfolio Summary</h3>

      {/* Deal pipeline */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Deal Pipeline</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STATUS_ORDER.map(status => {
            const data = summary.statusCounts[status]
            return (
              <div key={status} className="bg-[#1a1e24] rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className={cn('w-2 h-2 rounded-full', STATUS_COLOR[status])} />
                  <span className="text-xs text-gray-500">{STATUS_LABELS[status]}</span>
                </div>
                <p className="text-xl font-mono font-bold text-white">{data?.count ?? 0}</p>
                {data && data.totalOffer > 0 && (
                  <p className="text-[10px] text-gray-600 font-mono mt-0.5">{formatDollar(data.totalOffer)}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Budget by position */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Allocation by Position</p>
        <div className="space-y-2">
          {POSITIONS.filter(pos => summary.posBudget[pos]).map(pos => {
            const data = summary.posBudget[pos]!
            const pct = summary.budget > 0 ? Math.min(100, (data.committed / summary.budget) * 100) : 0
            return (
              <div key={pos} className="flex items-center gap-3">
                <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded text-white w-8 text-center shrink-0', positionColor(pos))}>
                  {pos}
                </span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-500 w-24 text-right shrink-0">
                  {data.committed > 0 ? formatDollar(data.committed) : <span className="text-gray-700">—</span>}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
        <div className="text-center">
          <p className="text-xs text-gray-600">Roster Size</p>
          <p className="text-lg font-mono font-semibold text-white">{summary.rosterSize}</p>
          <p className="text-[10px] text-gray-700">of 15 max</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">Committed</p>
          <p className="text-lg font-mono font-semibold text-green-400">{formatDollar(summary.totalOffer)}</p>
          <p className="text-[10px] text-gray-700">in offers</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">Remaining</p>
          <p className={cn('text-lg font-mono font-semibold', summary.budget - summary.totalOffer < 0 ? 'text-red-400' : 'text-white')}>
            {formatDollar(Math.max(0, summary.budget - summary.totalOffer))}
          </p>
          <p className="text-[10px] text-gray-700">budget left</p>
        </div>
      </div>
    </div>
  )
}
