'use client'

import dynamic from 'next/dynamic'
import { useNexusStore } from '@/store'
import { cn } from '@/lib/utils'

const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ReferenceLine = dynamic(() => import('recharts').then(m => m.ReferenceLine), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

export function ConferencePredictor() {
  const conferenceResult = useNexusStore(s => s.conferenceResult)

  if (!conferenceResult) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">Conference Record Predictor</h2>
        </div>
        <p className="text-xs text-gray-600 bg-white/3 border border-white/8 rounded-lg px-3 py-2">
          No team assigned to your account, or prediction unavailable. Make sure your team is set during sign-up.
        </p>
      </div>
    )
  }

  const { win_probabilities, monte_carlo } = conferenceResult

  // Build sorted histogram data (JSON keys come back as strings, convert to numbers)
  const histogramData = Object.entries(monte_carlo.distribution)
    .map(([wins, count]) => ({ wins: Number(wins), count }))
    .sort((a, b) => a.wins - b.wins)

  const totalSims = monte_carlo.simulations
  const maxPossible = monte_carlo.max_possible_wins

  // P10 / P90 from cumulative distribution
  let cumulative = 0
  let p10Wins = 0
  let p90Wins = 0
  for (const { wins, count } of histogramData) {
    cumulative += count
    if (cumulative / totalSims >= 0.1 && p10Wins === 0) p10Wins = wins
    if (cumulative / totalSims >= 0.9 && p90Wins === 0) { p90Wins = wins; break }
  }

  // Sort opponents by win probability
  const opponents = Object.entries(win_probabilities).sort((a, b) => b[1] - a[1])
  const strongFavorite = opponents.filter(([, p]) => p >= 0.7).slice(0, 3)
  const toughMatchups = opponents.filter(([, p]) => p <= 0.45).slice(-3).reverse()

  const projectedWins = monte_carlo.most_likely_wins
  const projectedLosses = maxPossible - projectedWins

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-white">Conference Record Predictor</h2>
        <span className="text-xs text-gray-600">{totalSims.toLocaleString()} Monte Carlo simulations</span>
      </div>

      <p className="text-xs text-gray-600 bg-white/3 border border-white/8 rounded-lg px-3 py-2">
        Predictions use BPM-calibrated win probabilities vs every conference opponent (each played twice).
      </p>

      {/* Summary + histogram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#14171c] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-500 mb-1">Projected Record</p>
          <p className="text-4xl font-mono font-bold text-white">{projectedWins}–{projectedLosses}</p>
          <p className="text-xs text-gray-600 mt-2">
            P10–P90: {p10Wins}–{maxPossible - p10Wins} to {p90Wins}–{maxPossible - p90Wins}
          </p>
        </div>

        <div className="md:col-span-2 bg-[#14171c] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-2">Win Count Distribution ({totalSims.toLocaleString()} simulations)</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="wins" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#1a1e24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: unknown) => [`${v} sims`, 'Count']}
                  labelFormatter={(l: unknown) => `${l} wins`}
                />
                <ReferenceLine x={projectedWins} stroke="#60a5fa" strokeDasharray="4 2" />
                <Bar dataKey="count" fill="#60a5fa" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Opponent win probability grid */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Win Probability vs Each Opponent</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {opponents.map(([opponent, prob]) => {
            const pct = Math.round(prob * 100)
            return (
              <div
                key={opponent}
                className="bg-[#1a1e24] rounded-lg p-3 border border-white/8"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-white font-medium truncate pr-2">{opponent}</span>
                  <span className={cn(
                    'text-sm font-mono font-bold shrink-0',
                    pct >= 60 ? 'text-green-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'
                  )}>
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', pct >= 60 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Best opportunities + Tough matchups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strongFavorite.length > 0 && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Best Win Opportunities
            </h3>
            <div className="space-y-2">
              {strongFavorite.map(([opponent, prob]) => (
                <div key={opponent} className="flex items-center justify-between bg-green-900/15 border border-green-700/25 rounded-lg px-3 py-2">
                  <span className="text-sm text-white">{opponent}</span>
                  <span className="text-sm font-mono font-bold text-green-400">{Math.round(prob * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {toughMatchups.length > 0 && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Toughest Matchups
            </h3>
            <div className="space-y-2">
              {toughMatchups.map(([opponent, prob]) => (
                <div key={opponent} className="flex items-center justify-between bg-red-900/15 border border-red-700/25 rounded-lg px-3 py-2">
                  <span className="text-sm text-white">{opponent}</span>
                  <span className="text-sm font-mono font-bold text-red-400">{Math.round(prob * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
