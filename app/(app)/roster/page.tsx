'use client'

import { useMemo, useEffect, useRef } from 'react'
import { ScenarioBar } from '@/components/roster/ScenarioBar'
import { RosterCanvas } from '@/components/roster/RosterCanvas'
import { MinutesManager } from '@/components/roster/MinutesManager'
import { TeamStats } from '@/components/roster/TeamStats'
import { ConferencePredictor } from '@/components/roster/ConferencePredictor'
import { Card } from '@/components/ui/Card'
import { useNexusStore, useActiveRosterGroups } from '@/store'
import { useAllPlayers } from '@/hooks/usePlayer'
import { useActiveScenario } from '@/hooks/useProjectedStats'
import { projectPlayerStats } from '@/lib/projections'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { cn, positionColor } from '@/lib/utils'

export default function RosterPage() {
  const isPredicted = useNexusStore(s => s.isPredicted)
  const predictionsRef = useRef<HTMLDivElement>(null)
  const prevIsPredicted = useRef(isPredicted)

  // Auto-scroll to predictions the moment they first appear (false → true transition only)
  useEffect(() => {
    if (isPredicted && !prevIsPredicted.current) {
      predictionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    prevIsPredicted.current = isPredicted
  }, [isPredicted])

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">
      <ScenarioBar />
      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        <section>
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Roster Builder</h2>
          <RosterCanvas />
        </section>

        <section>
          <MinutesManager />
        </section>

        {/* Predictions — revealed with staggered animation after predict */}
        {isPredicted && (
          <div ref={predictionsRef}>
            <section
              className="animate-reveal-up opacity-0"
              style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
            >
              <ProjectedBoxScore />
            </section>

            <section
              className="animate-reveal-up opacity-0"
              style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
            >
              <Card>
                <h2 className="text-sm font-semibold text-gray-300 mb-4">Team Analytics</h2>
                <TeamStats />
              </Card>
            </section>

            <section
              className="animate-reveal-up opacity-0"
              style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
            >
              <Card>
                <ConferencePredictor />
              </Card>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Projected Box Score ───────────────────────────────────────────────────────
function ProjectedBoxScore() {
  const rosterGroups = useActiveRosterGroups()
  const allPlayers = useAllPlayers()
  const scenario = useActiveScenario()
  // Ground-truth ML predictions stored in Zustand by MinutesManager when "Run Predictions" fires
  const mlPredictions = useNexusStore(s => s.rosterPredictions)

  const rosterPlayerIds = useMemo(
    () => [...new Set(rosterGroups.flatMap(g => g.playerIds))],
    [rosterGroups],
  )

  const rows = useMemo(() => {
    if (!scenario) return []
    const playerMap = new Map(allPlayers.map(p => [p.id, p]))
    return rosterPlayerIds
      .map(id => {
        const player = playerMap.get(id)
        if (!player) return null
        const heuristic = projectPlayerStats(player, scenario, allPlayers)
        const ml = mlPredictions[id]
        // Guard against stale persisted predictions that predate the new MLPrediction shape
        const mlIsFullShape = ml && ml.total_rebounds !== undefined && ml.fg_pct !== undefined
        const proj = mlIsFullShape
          ? {
              ...heuristic,
              ppg: ml.points,
              rpg: ml.total_rebounds,
              apg: ml.assists,
              spg: ml.steals,
              bpg: ml.blocks,
              topg: ml.turnovers,
              fgPct: parseFloat(ml.fg_pct.toFixed(1)),
              fg3Pct: parseFloat(ml.fg3_pct.toFixed(1)),
              ftPct: parseFloat(ml.ft_pct.toFixed(1)),
              minutesPerGame: ml.projected_mpg,
            }
          : heuristic
        return { player, proj }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.proj.minutesPerGame - a.proj.minutesPerGame)
  }, [rosterPlayerIds, allPlayers, scenario, mlPredictions])

  if (rows.length === 0) return null

  const hasML = Object.keys(mlPredictions).length > 0

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-300">Projected Box Score</h2>
        {hasML && (
          <span className="flex items-center gap-1.5 text-[11px] text-blue-400 bg-blue-900/15 border border-blue-700/20 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            ML predictions
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10 text-gray-500">
              <th className="text-left py-2 pr-3 font-medium">Player</th>
              <th className="text-right py-2 px-2 font-medium">MIN</th>
              <th className="text-right py-2 px-2 font-medium">PPG</th>
              <th className="text-right py-2 px-2 font-medium">RPG</th>
              <th className="text-right py-2 px-2 font-medium">APG</th>
              <th className="text-right py-2 px-2 font-medium">FG%</th>
              <th className="text-right py-2 px-2 font-medium">3P%</th>
              <th className="text-right py-2 px-2 font-medium">SPG</th>
              <th className="text-right py-2 pl-2 font-medium">BPG</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ player, proj }) => {
              const mlData = mlPredictions[player.id]
              const isML = Boolean(mlData && mlData.total_rebounds !== undefined)
              return (
                <tr key={player.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <PlayerAvatar player={player} size={22} />
                      <div>
                        <span className="text-white">{player.name}</span>
                        <span className={cn('ml-1.5 text-[10px] font-medium px-1 py-0.5 rounded text-white', positionColor(player.position))}>
                          {player.position}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-400">{proj.minutesPerGame.toFixed(0)}</td>
                  <td className={cn('py-2 px-2 text-right font-mono font-medium', isML ? 'text-blue-300' : 'text-white')}>{proj.ppg.toFixed(1)}</td>
                  <td className={cn('py-2 px-2 text-right font-mono', isML ? 'text-blue-300' : 'text-gray-300')}>{proj.rpg.toFixed(1)}</td>
                  <td className={cn('py-2 px-2 text-right font-mono', isML ? 'text-blue-300' : 'text-gray-300')}>{proj.apg.toFixed(1)}</td>
                  <td className="py-2 px-2 text-right font-mono text-gray-300">{proj.fgPct.toFixed(1)}%</td>
                  <td className="py-2 px-2 text-right font-mono text-gray-300">{proj.fg3Pct.toFixed(1)}%</td>
                  <td className={cn('py-2 px-2 text-right font-mono', isML ? 'text-blue-300' : 'text-gray-300')}>{proj.spg.toFixed(1)}</td>
                  <td className={cn('py-2 pl-2 text-right font-mono', isML ? 'text-blue-300' : 'text-gray-300')}>{proj.bpg.toFixed(1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
