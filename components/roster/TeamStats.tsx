'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import * as RadixTabs from '@radix-ui/react-tabs'
import { useNexusStore } from '@/store'
import { useProjectedTeamStats } from '@/hooks/useProjectedStats'
import { cn } from '@/lib/utils'
import type { TeamSeasonStats } from '@/types'

// Dynamic import for Recharts (SSR-safe)
const RadarChart      = dynamic(() => import('recharts').then(m => m.RadarChart),      { ssr: false })
const Radar           = dynamic(() => import('recharts').then(m => m.Radar),           { ssr: false })
const PolarGrid       = dynamic(() => import('recharts').then(m => m.PolarGrid),       { ssr: false })
const PolarAngleAxis  = dynamic(() => import('recharts').then(m => m.PolarAngleAxis),  { ssr: false })
const PolarRadiusAxis = dynamic(() => import('recharts').then(m => m.PolarRadiusAxis), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const BarChart        = dynamic(() => import('recharts').then(m => m.BarChart),        { ssr: false })
const Bar             = dynamic(() => import('recharts').then(m => m.Bar),             { ssr: false })
const XAxis           = dynamic(() => import('recharts').then(m => m.XAxis),           { ssr: false })
const YAxis           = dynamic(() => import('recharts').then(m => m.YAxis),           { ssr: false })
const CartesianGrid   = dynamic(() => import('recharts').then(m => m.CartesianGrid),   { ssr: false })
const Tooltip         = dynamic(() => import('recharts').then(m => m.Tooltip),         { ssr: false })
const Legend          = dynamic(() => import('recharts').then(m => m.Legend),          { ssr: false })

type StatTab = 'overview' | 'fourfactors' | 'efficiency' | 'shooting' | 'radar'

// ── Shared helpers ────────────────────────────────────────────────────────────

function StatCompareRow({
  label, team, compare, better = 'higher', format = 'number', decimals = 1,
}: {
  label: string; team: number; compare: number
  better?: 'higher' | 'lower'; format?: 'number' | 'pct'; decimals?: number
}) {
  const fmt = (v: number) => format === 'pct' ? `${v.toFixed(decimals)}%` : v.toFixed(decimals)
  const delta = team - compare
  const isGood = better === 'higher' ? delta > 0 : delta < 0
  const neutral = Math.abs(delta) < 0.05
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-3 text-xs font-mono">
        <span className="text-white w-12 text-right">{fmt(team)}</span>
        <span className="text-gray-600 w-14 text-right">{fmt(compare)}</span>
        <span className={cn('w-10 text-right', neutral ? 'text-gray-600' : isGood ? 'text-green-400' : 'text-red-400')}>
          {delta >= 0 ? '+' : ''}{fmt(delta)}
        </span>
      </div>
    </div>
  )
}

function FactorBar({
  label, description, teamValue, compareValue, min, max, better = 'higher',
}: {
  label: string; description: string; teamValue: number; compareValue: number
  min: number; max: number; better?: 'higher' | 'lower'
}) {
  const range = max - min
  const teamPct    = Math.min(100, Math.max(0, ((teamValue - min) / range) * 100))
  const comparePct = Math.min(100, Math.max(0, ((compareValue - min) / range) * 100))
  const isGood = better === 'higher' ? teamValue >= compareValue : teamValue <= compareValue
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-xs font-medium text-white">{label}</span>
          <span className="ml-2 text-[10px] text-gray-600">{description}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className={isGood ? 'text-green-400' : 'text-red-400'}>{teamValue.toFixed(1)}</span>
          <span className="text-gray-600">{compareValue.toFixed(1)}</span>
        </div>
      </div>
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-white/10 rounded-full" style={{ width: `${comparePct}%` }} />
        <div className={cn('absolute top-0 left-0 h-full rounded-full', isGood ? 'bg-blue-500' : 'bg-amber-500')} style={{ width: `${teamPct}%` }} />
      </div>
    </div>
  )
}

function BigStatCard({
  label, value, compare, better = 'higher', unit = '', subtitle,
}: {
  label: string; value: number; compare: number
  better?: 'higher' | 'lower'; unit?: string; subtitle?: string
}) {
  const delta = value - compare
  const isGood = better === 'higher' ? delta > 0 : delta < 0
  return (
    <div className="bg-[#1a1e24] rounded-xl p-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-mono font-bold text-white">{value.toFixed(1)}{unit}</p>
      {subtitle && <p className="text-[10px] text-gray-600 mt-0.5">{subtitle}</p>}
      <p className="text-[10px] text-gray-600 mt-1">
        Conf avg: {compare.toFixed(1)}{unit}{' '}
        <span className={cn('font-mono', isGood ? 'text-green-400' : 'text-red-400')}>
          ({delta >= 0 ? '+' : ''}{delta.toFixed(1)})
        </span>
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function TeamStats() {
  const [activeTab, setActiveTab] = useState<StatTab>('overview')
  const teamStats   = useProjectedTeamStats()
  const teamContext = useNexusStore(s => s.teamContext)
  const isPredicted = useNexusStore(s => s.isPredicted)

  if (!teamStats) {
    return <div className="text-gray-600 text-sm text-center py-4">Add players to the roster to see team analytics.</div>
  }

  const confAvg = teamContext?.conference_avg ?? null
  // Use projected efficiency metrics when predictions have been run,
  // falling back to last year's actual stats otherwise.
  const showProjected = isPredicted

  // When predictions exist, overlay projected values onto the historical team stats.
  // Fields we can project: adj_oe, adj_de, net_rating, efg_o, three_p_o, adj_t.
  // All other KenPom fields (four factors, shooting splits, barthag) stay historical.
  const effectiveTeam = useMemo(() => {
    if (!teamContext || !teamStats || !showProjected) return teamContext?.team ?? null
    return {
      ...teamContext.team,
      adj_oe:     teamStats.ortg,
      adj_de:     teamStats.drtg,
      net_rating: teamStats.netRating,
      efg_o:      teamStats.efgPct,
      three_p_o:  teamStats.fg3Pct,
      adj_t:      teamStats.pace,
    }
  }, [teamContext, teamStats, showProjected])

  // Re-sort conference standings with our projected net rating inserted.
  const effectiveStandings = useMemo(() => {
    if (!teamContext || !teamStats || !showProjected) return teamContext?.conference_standings ?? []
    return [...teamContext.conference_standings]
      .map(e =>
        e.team.toLowerCase() === teamContext.team.team.toLowerCase()
          ? { ...e, net_rating: teamStats.netRating }
          : e
      )
      .sort((a, b) => b.net_rating - a.net_rating)
  }, [teamContext, teamStats, showProjected])

  const effectiveRank = useMemo(() => {
    if (!teamContext) return null
    if (!showProjected || !teamStats) return teamContext.team.conference_rank
    const idx = effectiveStandings.findIndex(
      e => e.team.toLowerCase() === teamContext.team.team.toLowerCase()
    )
    return idx >= 0 ? idx + 1 : teamContext.team.conference_rank
  }, [teamContext, teamStats, showProjected, effectiveStandings])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500">
          {teamContext
            ? `${teamContext.team.team} · ${teamContext.team.conference} · ${showProjected ? 'Projected roster vs conference average' : 'Last year vs conference average'}`
            : 'Set your team in account settings to see conference comparisons.'}
        </p>
      </div>

      <RadixTabs.Root value={activeTab} onValueChange={v => setActiveTab(v as StatTab)}>
        <RadixTabs.List className="flex border-b border-white/10 mb-4 overflow-x-auto">
          {([
            ['overview',    'Overview'],
            ['fourfactors', 'Four Factors'],
            ['efficiency',  'Efficiency'],
            ['shooting',    'Shooting'],
            ['radar',       'Radar'],
          ] as const).map(([value, label]) => (
            <RadixTabs.Trigger
              key={value}
              value={value}
              className={cn(
                'px-4 py-2.5 text-sm transition-colors relative whitespace-nowrap',
                activeTab === value
                  ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {label}
            </RadixTabs.Trigger>
          ))}
        </RadixTabs.List>

        {/* ── Overview ──────────────────────────────────────────────────────── */}
        <RadixTabs.Content value="overview">
          <div className="grid grid-cols-2 gap-4">
            {/* Left: projected counting stats */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xs text-gray-500 uppercase tracking-wide">Projected Offense</h3>
                <span className="text-[10px] text-blue-400 bg-blue-900/15 rounded px-1.5 py-0.5 border border-blue-700/20">ML</span>
              </div>
              <div className="bg-[#1a1e24] rounded-lg px-3 py-1">
                {[
                  { label: 'PPG',  value: teamStats.ppg.toFixed(1) },
                  { label: 'RPG',  value: teamStats.rpg.toFixed(1) },
                  { label: 'APG',  value: teamStats.apg.toFixed(1) },
                  { label: 'FG%',  value: `${teamStats.fgPct.toFixed(1)}%` },
                  { label: '3P%',  value: `${teamStats.fg3Pct.toFixed(1)}%` },
                  { label: 'eFG%', value: `${teamStats.efgPct.toFixed(1)}%` },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} className={cn('flex justify-between py-2', i < arr.length - 1 && 'border-b border-white/5')}>
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-xs font-mono text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: projected efficiency vs conf avg (or last year's actual if not predicted) */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xs text-gray-500 uppercase tracking-wide">
                  {confAvg ? 'Team vs Conf Avg' : 'Efficiency'}
                </h3>
                {showProjected && (
                  <span className="text-[10px] text-blue-400 bg-blue-900/15 rounded px-1.5 py-0.5 border border-blue-700/20">Projected</span>
                )}
              </div>
              <div className="bg-[#1a1e24] rounded-lg px-3 py-1">
                {confAvg ? (
                  <>
                    <div className="flex items-center justify-between py-1 text-[10px] text-gray-600 border-b border-white/5">
                      <span>Metric</span>
                      <div className="flex gap-3">
                        <span className="w-12 text-right text-white">Team</span>
                        <span className="w-14 text-right">Conf</span>
                        <span className="w-10 text-right">Δ</span>
                      </div>
                    </div>
                    <StatCompareRow
                      label="Adj OE"
                      team={showProjected ? teamStats.ortg : teamContext!.team.adj_oe}
                      compare={confAvg.adj_oe}
                    />
                    <StatCompareRow
                      label="Adj DE"
                      team={showProjected ? teamStats.drtg : teamContext!.team.adj_de}
                      compare={confAvg.adj_de}
                      better="lower"
                    />
                    <StatCompareRow
                      label="Net Rtg"
                      team={showProjected ? teamStats.netRating : teamContext!.team.net_rating}
                      compare={confAvg.net_rating}
                    />
                    <StatCompareRow
                      label="eFG% O"
                      team={showProjected ? teamStats.efgPct : teamContext!.team.efg_o}
                      compare={confAvg.efg_o}
                      format="pct"
                    />
                    <StatCompareRow
                      label="Tempo"
                      team={showProjected ? teamStats.pace : teamContext!.team.adj_t}
                      compare={confAvg.adj_t}
                    />
                    {/* WAB requires full schedule simulation — show actual only */}
                    <StatCompareRow
                      label={showProjected ? 'WAB (last yr)' : 'WAB'}
                      team={teamContext!.team.wab}
                      compare={confAvg.wab}
                    />
                  </>
                ) : (
                  [
                    { label: 'Proj ORTG', value: teamStats.ortg.toFixed(0) },
                    { label: 'Proj DRTG', value: teamStats.drtg.toFixed(0) },
                    { label: 'Net Rtg',   value: `${teamStats.netRating > 0 ? '+' : ''}${teamStats.netRating.toFixed(0)}` },
                    { label: 'Pace',      value: teamStats.pace.toFixed(0) },
                    { label: 'RPG',       value: teamStats.rpg.toFixed(1) },
                    { label: 'APG',       value: teamStats.apg.toFixed(1) },
                  ].map(({ label, value }, i, arr) => (
                    <div key={label} className={cn('flex justify-between py-2', i < arr.length - 1 && 'border-b border-white/5')}>
                      <span className="text-xs text-gray-400">{label}</span>
                      <span className="text-xs font-mono text-white">{value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Conference standings strip */}
          {teamContext && (
            <div className="mt-4 bg-[#1a1e24] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-wide">Conference Standings by Net Rating</p>
                {showProjected && <span className="text-[10px] text-blue-400 bg-blue-900/15 rounded px-1.5 py-0.5 border border-blue-700/20">Projected</span>}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {effectiveStandings.slice(0, 16).map((entry, i) => {
                  const isOurs = entry.team.toLowerCase() === teamContext.team.team.toLowerCase()
                  return (
                    <div
                      key={entry.team}
                      title={`${entry.team}: ${entry.net_rating > 0 ? '+' : ''}${entry.net_rating.toFixed(1)}`}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono',
                        isOurs ? 'bg-blue-600 text-white font-bold' : 'bg-white/5 text-gray-500'
                      )}
                    >
                      <span className={isOurs ? 'text-blue-200' : 'text-gray-600'}>#{i + 1}</span>
                      <span>{entry.team.split(' ').pop()}</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-gray-700 mt-1.5">
                {teamContext.team.team} ranked #{effectiveRank} of {teamContext.team.conference_size} in {teamContext.team.conference} by net rating
              </p>
            </div>
          )}
        </RadixTabs.Content>

        {/* ── Four Factors ──────────────────────────────────────────────────── */}
        <RadixTabs.Content value="fourfactors">
          {!confAvg || !teamContext || !effectiveTeam ? (
            <div className="text-center py-8 text-gray-600 text-xs">
              Set your team in account settings and run predictions to see Four Factors analysis.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Offense</h3>
                    {showProjected && <span className="text-[10px] text-blue-400 bg-blue-900/15 rounded px-1.5 py-0.5 border border-blue-700/20">Projected</span>}
                  </div>
                  <FactorBar label="eFG%"    description="Effective field goal %"              teamValue={effectiveTeam.efg_o} compareValue={confAvg.efg_o} min={44} max={62} />
                  <FactorBar label="TOV%"    description="Turnover rate (lower = better)"      teamValue={effectiveTeam.tor}   compareValue={confAvg.tor}   min={12} max={24} better="lower" />
                  <FactorBar label="ORB%"    description="Offensive rebound rate"              teamValue={effectiveTeam.orb}   compareValue={confAvg.orb}   min={20} max={45} />
                  <FactorBar label="FTR"     description="Free throw rate (FTA/FGA × 100)"     teamValue={effectiveTeam.ftr}   compareValue={confAvg.ftr}   min={20} max={50} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Defense</h3>
                  <FactorBar label="eFG% Allowed" description="Opponent eFG% (lower = better)"    teamValue={effectiveTeam.efg_d} compareValue={confAvg.efg_d} min={44} max={62} better="lower" />
                  <FactorBar label="TOV% Forced"  description="Opponent turnover rate"             teamValue={effectiveTeam.tord}  compareValue={confAvg.tord}  min={12} max={24} />
                  <FactorBar label="DRB%"         description="Defensive rebound rate"             teamValue={effectiveTeam.drb}   compareValue={confAvg.drb}   min={55} max={80} />
                  <FactorBar label="FTR Allowed"  description="Opponent FT rate (lower = better)"  teamValue={effectiveTeam.ftrd}  compareValue={confAvg.ftrd}  min={20} max={50} better="lower" />
                </div>
              </div>
              <div className="mt-4 p-3 bg-[#1a1e24] rounded-lg text-xs text-gray-500">
                The Four Factors (Dean Oliver) predict wins better than any single stat. eFG% (40%), TOV% (25%), ORB% (20%), FTR (15%). Blue = team, gray line = conf avg.
                {showProjected && ' eFG% uses projected roster data; TOV%, ORB%, FTR reflect last season\'s team system.'}
              </div>
            </>
          )}
        </RadixTabs.Content>

        {/* ── Efficiency ────────────────────────────────────────────────────── */}
        <RadixTabs.Content value="efficiency">
          {!confAvg || !teamContext || !effectiveTeam ? (
            <div className="text-center py-8 text-gray-600 text-xs">
              Set your team in account settings and run predictions to see efficiency metrics.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                {showProjected && <span className="text-[10px] text-blue-400 bg-blue-900/15 rounded px-1.5 py-0.5 border border-blue-700/20">Projected</span>}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <BigStatCard label="Adj Offensive Eff" value={effectiveTeam.adj_oe}     compare={confAvg.adj_oe}     unit=" pts/100" subtitle="Points per 100 possessions" />
                <BigStatCard label="Adj Defensive Eff" value={effectiveTeam.adj_de}     compare={confAvg.adj_de}     better="lower" unit=" pts/100" subtitle="Points allowed per 100 poss" />
                <BigStatCard label="Net Rating"        value={effectiveTeam.net_rating} compare={confAvg.net_rating} subtitle="ADJOE − ADJDE" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <BigStatCard label="Power Rating"      value={Math.round(teamContext.team.barthag * 1000) / 10} compare={Math.round(confAvg.barthag * 1000) / 10} unit="%" subtitle="Prob of beating avg D1 team" />
                <BigStatCard label="Adj Tempo"         value={effectiveTeam.adj_t} compare={confAvg.adj_t} unit=" poss" subtitle="Possessions per 40 min" />
                <BigStatCard label="Wins Above Bubble" value={teamContext.team.wab} compare={confAvg.wab} subtitle={showProjected ? 'Last season (not projected)' : 'Wins vs bubble schedule'} />
              </div>
              <div className="mt-3 bg-[#1a1e24] rounded-lg p-3 text-xs">
                <p className="text-gray-500 mb-0.5">Conference ranking{showProjected ? ' (projected)' : ''}</p>
                <p className="text-2xl font-mono font-bold text-white">
                  #{effectiveRank}
                  <span className="text-sm text-gray-500 ml-1">/ {teamContext.team.conference_size}</span>
                </p>
                <p className="text-gray-600 mt-0.5">{teamContext.team.team} in {teamContext.team.conference} by net rating</p>
              </div>
            </>
          )}
        </RadixTabs.Content>

        {/* ── Shooting ──────────────────────────────────────────────────────── */}
        <RadixTabs.Content value="shooting">
          {!confAvg || !teamContext || !effectiveTeam ? (
            <div className="text-center py-8 text-gray-600 text-xs">
              Set your team in account settings and run predictions to see shooting splits.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                {showProjected && <span className="text-[10px] text-blue-400 bg-blue-900/15 rounded px-1.5 py-0.5 border border-blue-700/20">Projected</span>}
              </div>
              <div className="h-52 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { zone: '2P% Off', team: effectiveTeam.two_p_o,   compare: confAvg.two_p_o },
                      { zone: '3P% Off', team: effectiveTeam.three_p_o, compare: confAvg.three_p_o },
                      { zone: '2P% Def', team: effectiveTeam.two_p_d,   compare: confAvg.two_p_d },
                      { zone: '3P% Def', team: effectiveTeam.three_p_d, compare: confAvg.three_p_d },
                    ]}
                    margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="zone" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={[25, 65]} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={{ background: '#1a1e24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 }} formatter={(v: unknown) => [`${(v as number).toFixed(1)}%`]} />
                    <Bar dataKey="team"    name={teamContext.team.team} fill="#60a5fa" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="compare" name="Conf Avg"              fill="#374151" radius={[4, 4, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: '2P% Off', val: effectiveTeam.two_p_o,   cmp: confAvg.two_p_o,   better: 'higher' as const },
                  { label: '3P% Off', val: effectiveTeam.three_p_o, cmp: confAvg.three_p_o, better: 'higher' as const },
                  { label: '2P% Def', val: effectiveTeam.two_p_d,   cmp: confAvg.two_p_d,   better: 'lower'  as const },
                  { label: '3P% Def', val: effectiveTeam.three_p_d, cmp: confAvg.three_p_d, better: 'lower'  as const },
                ].map(({ label, val, cmp, better }) => {
                  const delta = val - cmp
                  const isGood = better === 'higher' ? delta > 0 : delta < 0
                  return (
                    <div key={label} className="bg-[#1a1e24] rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
                      <p className="font-mono text-lg font-bold text-white">{val.toFixed(1)}%</p>
                      <p className={cn('text-[10px] font-mono mt-0.5', isGood ? 'text-green-400' : 'text-red-400')}>
                        {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs conf
                      </p>
                    </div>
                  )
                })}
              </div>
              <p className="mt-3 text-[10px] text-gray-600">
                Defensive %: lower is better. 2P% Def = interior contest quality; 3P% Def = perimeter contest quality.
                {showProjected && ' 3P% Off uses projected roster data; other splits reflect last season.'}
              </p>
            </>
          )}
        </RadixTabs.Content>

        {/* ── Radar ─────────────────────────────────────────────────────────── */}
        <RadixTabs.Content value="radar">
          {confAvg && effectiveTeam
            ? <RadarFromContext team={effectiveTeam} confAvg={confAvg} showProjected={showProjected} />
            : <RadarFromProjected teamStats={teamStats} />
          }
        </RadixTabs.Content>
      </RadixTabs.Root>
    </div>
  )
}

// ── Radar helpers ─────────────────────────────────────────────────────────────

function norm(value: number, min: number, max: number) {
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
}

function RadarFromContext({ team, confAvg, showProjected }: { team: TeamSeasonStats; confAvg: TeamSeasonStats; showProjected?: boolean }) {
  const data = [
    { axis: 'Offense',      team: norm(team.adj_oe,          85, 130), compare: norm(confAvg.adj_oe,          85, 130) },
    { axis: 'Defense',      team: norm(130 - team.adj_de,    15,  45), compare: norm(130 - confAvg.adj_de,    15,  45) },
    { axis: 'Shooting',     team: norm(team.efg_o,           44,  62), compare: norm(confAvg.efg_o,           44,  62) },
    { axis: 'Ball Security',team: norm(24 - team.tor,         0,  12), compare: norm(24 - confAvg.tor,         0,  12) },
    { axis: 'Rebounding',   team: norm(team.orb,             20,  45), compare: norm(confAvg.orb,             20,  45) },
    { axis: 'Pace',         team: norm(team.adj_t,           60,  78), compare: norm(confAvg.adj_t,           60,  78) },
  ]
  return (
    <div className="h-72">
      <div className="flex items-center gap-2 mb-2">
        {showProjected && <span className="text-[10px] text-blue-400 bg-blue-900/15 rounded px-1.5 py-0.5 border border-blue-700/20">Projected</span>}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name={team.team}   dataKey="team"    stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.25} />
          <Radar name="Conf Avg" dataKey="compare" stroke="#6b7280" fill="#6b7280" fillOpacity={0.1} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function RadarFromProjected({ teamStats }: { teamStats: NonNullable<ReturnType<typeof useProjectedTeamStats>> }) {
  const data = [
    { axis: 'Scoring',    team: teamStats.scoring,    compare: teamStats.conferenceAvg.scoring },
    { axis: 'Rebounding', team: teamStats.rebounding, compare: teamStats.conferenceAvg.rebounding },
    { axis: 'Playmaking', team: teamStats.playmaking, compare: teamStats.conferenceAvg.playmaking },
    { axis: '3PT',        team: teamStats.shooting3pt, compare: teamStats.conferenceAvg.shooting3pt },
    { axis: 'Defense',    team: teamStats.defense,    compare: teamStats.conferenceAvg.defense },
    { axis: 'Efficiency', team: teamStats.efficiency, compare: teamStats.conferenceAvg.efficiency },
  ]
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Your Team" dataKey="team"    stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.2} />
          <Radar name="Conf Avg"  dataKey="compare" stroke="#6b7280" fill="#6b7280" fillOpacity={0.1} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-center text-[10px] text-gray-600 mt-2">
        Set your team to see real KenPom-based data
      </p>
    </div>
  )
}
