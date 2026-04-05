'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { NIL_MARKET_DATA } from '@/data/nilMarket'
import { formatDollar } from '@/lib/utils'
import type { Position } from '@/types'

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']

export function MarketIntelligence() {
  const [isExpanded, setIsExpanded] = useState(false)
  const { rates, conferenceBenchmarks, marketTrend } = NIL_MARKET_DATA

  const TrendIcon = marketTrend.direction === 'up'
    ? TrendingUp
    : marketTrend.direction === 'down'
    ? TrendingDown
    : Minus

  const trendColor = marketTrend.direction === 'up'
    ? 'text-green-400'
    : marketTrend.direction === 'down'
    ? 'text-red-400'
    : 'text-gray-400'

  return (
    <div className="bg-[#14171c] border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <h3 className="text-sm font-semibold text-white">Market Intelligence</h3>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-5 border-t border-white/10 pt-4">
          {/* Market trend */}
          <div className="flex items-center gap-3 bg-[#1a1e24] rounded-xl p-3">
            <TrendIcon className={`w-5 h-5 ${trendColor}`} />
            <div>
              <p className={`text-sm font-semibold ${trendColor}`}>
                NIL Market {marketTrend.direction === 'up' ? 'Rising' : marketTrend.direction === 'down' ? 'Falling' : 'Stable'} +{marketTrend.pct}% YoY
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{marketTrend.note}</p>
            </div>
          </div>

          {/* Position rate table */}
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Market Rates by Position</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-3 text-gray-500 font-medium">POS</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Tier 1 (80+)</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Tier 2 (60-79)</th>
                    <th className="text-right py-2 pl-3 text-gray-500 font-medium">Tier 3 (&lt;60)</th>
                  </tr>
                </thead>
                <tbody>
                  {POSITIONS.map(pos => (
                    <tr key={pos} className="border-b border-white/5 last:border-0">
                      <td className="py-2 pr-3 font-medium text-gray-300">{pos}</td>
                      <td className="py-2 px-3 text-right font-mono text-green-400">
                        {formatDollar(rates[pos].tier1[0])}–{formatDollar(rates[pos].tier1[1])}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-amber-400">
                        {formatDollar(rates[pos].tier2[0])}–{formatDollar(rates[pos].tier2[1])}
                      </td>
                      <td className="py-2 pl-3 text-right font-mono text-gray-400">
                        {formatDollar(rates[pos].tier3[0])}–{formatDollar(rates[pos].tier3[1])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conference benchmarks */}
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Conference Spend Benchmarks</h4>
            <div className="space-y-2">
              {conferenceBenchmarks.map(bench => {
                const pct = Math.min(100, (bench.averageSpend / 3_000_000) * 100)
                return (
                  <div key={bench.conference} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-36 truncate">{bench.conference}</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-mono text-gray-500 w-20 text-right">{formatDollar(bench.averageSpend)}/yr</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
