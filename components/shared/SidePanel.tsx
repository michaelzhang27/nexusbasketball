'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { X, Star, Play, Film, FileText, BarChart3, TrendingUp, Trash2, Loader2 } from 'lucide-react'
import * as RadixTabs from '@radix-ui/react-tabs'
import { useNexusStore, useActivePlayerMinutes } from '@/store'
import { usePlayer, useAllPlayers } from '@/hooks/usePlayer'
import { useFitScore } from '@/hooks/useFitScore'
import { useToast } from '@/hooks/useToast'
import { useActiveScenario } from '@/hooks/useProjectedStats'
import { usePlayerPrediction } from '@/hooks/usePlayerPrediction'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { FitScoreBadge } from '@/components/shared/FitScoreBadge'
import { StatRow } from '@/components/shared/StatRow'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'
import { cn, formatDate, positionColor } from '@/lib/utils'
import { computeAllFitScores } from '@/lib/fitScore'
import { getAccessToken } from '@/lib/auth'
import { savePlayerNotes } from '@/lib/api'
import type { SidePanelTab, Player } from '@/types'

// ── Main SidePanel ────────────────────────────────────────────────────────────
export function SidePanel() {
  const sidePanel = useNexusStore(s => s.sidePanel)
  const closeSidePanel = useNexusStore(s => s.closeSidePanel)
  const setSidePanelTab = useNexusStore(s => s.setSidePanelTab)

  const player = usePlayer(sidePanel.playerId)

  return (
    <>
      {/* Backdrop */}
      {sidePanel.isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
          onClick={closeSidePanel}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-[480px] bg-[#0f1114] border-l border-white/10',
          'z-50 flex flex-col transition-transform duration-[250ms] ease-out',
          sidePanel.isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {sidePanel.isOpen && player ? (
          <>
            <PanelHeader player={player} onClose={closeSidePanel} />

            <RadixTabs.Root
              value={sidePanel.activeTab}
              onValueChange={(v) => setSidePanelTab(v as SidePanelTab)}
              className="flex flex-col flex-1 min-h-0"
            >
              <TabBar activeTab={sidePanel.activeTab} />
              <div className="flex-1 overflow-y-auto">
                <RadixTabs.Content value="stats" className="p-4">
                  <StatsTab playerId={player.id} />
                </RadixTabs.Content>
                <RadixTabs.Content value="notes" className="p-4">
                  <NotesTab playerId={player.id} />
                </RadixTabs.Content>
                <RadixTabs.Content value="fit" className="p-4">
                  <FitTab playerId={player.id} />
                </RadixTabs.Content>
                <RadixTabs.Content value="film" className="p-4">
                  <FilmTab playerName={player.name} />
                </RadixTabs.Content>
              </div>
            </RadixTabs.Root>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            No player selected
          </div>
        )}
      </div>
    </>
  )
}

// ── Panel header ──────────────────────────────────────────────────────────────
function PanelHeader({ player, onClose }: { player: Player; onClose: () => void }) {
  const toggleWatchlist = useNexusStore(s => s.toggleWatchlist)
  const scenarios = useNexusStore(s => s.scenarios)
  const activeScenarioId = useNexusStore(s => s.activeScenarioId)
  const isWatchlisted = (scenarios.find(s => s.id === activeScenarioId)?.watchlistIds ?? []).includes(player.id)
  const fitScore = useFitScore(player)

  return (
    <div className="flex items-start gap-3 p-4 border-b border-white/10 shrink-0">
      <PlayerAvatar player={player} size={48} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-semibold text-white truncate">{player.name}</h2>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full text-white', positionColor(player.position))}>
            {player.position}
          </span>
          <FitScoreBadge score={fitScore} size="sm" />
        </div>
        <p className="text-sm text-gray-400 mt-0.5">{player.previousSchool} · {player.conference}</p>
        <p className="text-xs text-gray-600 mt-0.5">{player.height} · {player.weight} lbs · {player.hometown}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => toggleWatchlist(player.id)}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
        >
          <Star
            className={cn(
              'w-4 h-4 transition-colors',
              isWatchlisted ? 'fill-amber-400 text-amber-400' : 'text-gray-600 hover:text-gray-400'
            )}
          />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Tab bar — Film is last ─────────────────────────────────────────────────────
const TABS: { value: SidePanelTab; label: string; icon: typeof BarChart3 }[] = [
  { value: 'stats', label: 'Stats',         icon: BarChart3 },
  { value: 'notes', label: 'Notes',         icon: FileText },
  { value: 'fit',   label: 'Breakdown',     icon: TrendingUp },
  { value: 'film',  label: 'Film',          icon: Film },
]

function TabBar({ activeTab }: { activeTab: SidePanelTab }) {
  return (
    <RadixTabs.List className="flex border-b border-white/10 shrink-0">
      {TABS.map(tab => (
        <RadixTabs.Trigger
          key={tab.value}
          value={tab.value}
          className={cn(
            'flex items-center gap-1.5 px-3 py-3 text-sm transition-colors relative flex-1 justify-center',
            'hover:text-white focus:outline-none',
            activeTab === tab.value
              ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500'
              : 'text-gray-500'
          )}
        >
          <tab.icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{tab.label}</span>
        </RadixTabs.Trigger>
      ))}
    </RadixTabs.List>
  )
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────
function StatsTab({ playerId }: { playerId: string }) {
  const player = usePlayer(playerId)
  const [showPrevSeason, setShowPrevSeason] = useState(false)

  const isPredicted      = useNexusStore(s => s.isPredicted)
  const playerMinutes    = useActivePlayerMinutes()
  const rosterPredictions = useNexusStore(s => s.rosterPredictions)

  // The authoritative roster prediction for this player (set by MinutesManager batch fetch)
  const rosterPrediction = rosterPredictions[playerId] ?? null

  // ── Slider range ──────────────────────────────────────────────────────────
  // Initialises to the roster minutes range, or ±4 around historical average.
  const buildDefaultRange = (p: typeof player): [number, number] => {
    const rosterRange = playerMinutes[p?.id ?? '']
    if (rosterRange) return [rosterRange.min, rosterRange.max]
    const base = p?.minutesPerGame ?? 25
    return [Math.max(0, Math.round(base) - 4), Math.min(40, Math.round(base) + 4)]
  }

  const [range, setRange] = useState<[number, number]>(() => buildDefaultRange(player))

  // localCommittedMpg: set when the coach manually clicks "Project" with a
  // slider value that differs from the roster's committed MPG. This creates a
  // "what-if" override on top of the roster ground truth.
  const [localCommittedMpg, setLocalCommittedMpg] = useState<number | null>(null)

  // Reset everything when switching to a different player
  useEffect(() => {
    setRange(buildDefaultRange(player))
    setLocalCommittedMpg(null)
  }, [playerId])  // eslint-disable-line react-hooks/exhaustive-deps

  // When the roster runs (or re-runs) predictions, sync slider to roster range
  // and clear any local override so the roster becomes the ground truth again.
  useEffect(() => {
    const rosterRange = playerMinutes[playerId]
    if (isPredicted && rosterPrediction) {
      if (rosterRange) {
        setRange([rosterRange.min, rosterRange.max])
      } else {
        // No explicit roster range — center slider on the predicted MPG ±4
        const mpg = rosterPrediction.projected_mpg
        setRange([Math.max(0, Math.round(mpg) - 4), Math.min(40, Math.round(mpg) + 4)])
      }
      setLocalCommittedMpg(null)
    }
  }, [rosterPrediction?.projected_mpg, isPredicted])  // eslint-disable-line react-hooks/exhaustive-deps

  const expectedMpg = parseFloat(((range[0] + range[1]) / 2).toFixed(1))

  // The roster's committed MPG (midpoint of the roster range, or the predicted MPG)
  const rosterMpg = rosterPrediction?.projected_mpg ?? null

  // Has the slider moved away from the roster ground truth?
  const divergedFromRoster = rosterMpg !== null && Math.abs(expectedMpg - rosterMpg) > 0.1

  // Has the slider moved from whatever was last locally projected?
  const isDirty = localCommittedMpg !== null && Math.abs(expectedMpg - localCommittedMpg) > 0.1

  function handleProject() {
    setLocalCommittedMpg(expectedMpg)
  }

  function handleReset() {
    setRange(buildDefaultRange(player))
    setLocalCommittedMpg(null)
  }

  // Local prediction — fires whenever the coach has explicitly clicked "Project".
  // Works regardless of whether roster predictions have been run.
  const { prediction: localPrediction, isLoading: predLoading } = usePlayerPrediction(
    (localCommittedMpg !== null && !showPrevSeason && player)
      ? player.id
      : null,
    localCommittedMpg ?? expectedMpg,
  )

  // ── Active prediction logic ───────────────────────────────────────────────
  // Priority: local (coach clicked "Project") → roster ground truth → null
  const activePrediction =
    (localCommittedMpg !== null && localPrediction)
      ? localPrediction
      : (isPredicted ? rosterPrediction : null)

  const isLocalOverride = activePrediction !== null && activePrediction !== rosterPrediction
  const isFromRoster    = activePrediction === rosterPrediction && rosterPrediction !== null

  if (!player) return null

  const stats   = showPrevSeason && player.prevSeasonStats ? player.prevSeasonStats : player
  // Derived projected efficiency stats from predicted counting stats
  const projEfgPct = (activePrediction && activePrediction.fg_attempted > 0)
    ? parseFloat(((activePrediction.fg_made + 0.5 * activePrediction.fg3_made) / activePrediction.fg_attempted * 100).toFixed(1))
    : undefined

  const projTsPct = (activePrediction && activePrediction.fg_attempted > 0 && activePrediction.ft_attempted > 0)
    ? parseFloat((activePrediction.points / (2 * (activePrediction.fg_attempted + 0.44 * activePrediction.ft_attempted)) * 100).toFixed(1))
    : undefined


  // Button appearance
  const showProjectBtn = !showPrevSeason
  const btnLabel =
    isDirty                ? 'Re-project' :
    localCommittedMpg !== null ? 'Projected'  :
    isFromRoster               ? 'Synced'     : 'Project'
  const btnStyle =
    isDirty                    ? 'bg-amber-600 hover:bg-amber-500 text-white' :
    localCommittedMpg !== null ? 'bg-white/8 border border-white/10 text-gray-400 hover:bg-white/12' :
    isFromRoster               ? 'bg-white/8 border border-white/10 text-gray-500 cursor-default' :
                                 'bg-blue-600 hover:bg-blue-500 text-white'

  return (
    <div className="space-y-4">
      {player.prevSeasonStats && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {showPrevSeason ? `Season: ${player.prevSeasonStats.season ?? '2024-25'}` : 'Season: 2025-26'}
          </span>
          <button
            onClick={() => setShowPrevSeason(v => !v)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showPrevSeason ? 'Show Current Season' : 'Show Previous Season'}
          </button>
        </div>
      )}

      {/* Minutes projection — hidden when viewing prev season */}
      {!showPrevSeason && (
        <div className="bg-[#1a1e24] rounded-lg px-3 py-3 space-y-2.5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Projected Minutes</span>
            <div className="flex items-center gap-2">
              {predLoading && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
              <span className="text-xs font-mono text-gray-400 tabular-nums">
                {range[0]}–{range[1]} min
              </span>
              <span className="text-xs font-mono text-blue-300 tabular-nums">
                (exp: {expectedMpg.toFixed(1)})
              </span>
            </div>
          </div>

          {/* Range slider */}
          <Slider
            value={range}
            onValueChange={([min, max]) => setRange([min, max])}
            min={0}
            max={40}
            step={1}
          />

          {/* Footer row */}
          <div className="flex items-center justify-between pt-0.5">
            <button
              onClick={handleReset}
              className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
            >
              reset
            </button>

            {/* Status badge */}
            {isFromRoster && !divergedFromRoster && (
              <span className="text-[10px] text-blue-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                synced from roster
              </span>
            )}
            {isLocalOverride && !isDirty && (
              <span className="text-[10px] text-amber-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                custom projection
              </span>
            )}

            {showProjectBtn && (
              <button
                onClick={isFromRoster && !divergedFromRoster ? undefined : handleProject}
                disabled={isFromRoster && !divergedFromRoster}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  btnStyle,
                )}
              >
                {btnLabel}
              </button>
            )}
          </div>

          {activePrediction && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 border-t border-white/5 pt-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
              {isLocalOverride
                ? `Custom projection at ${localCommittedMpg?.toFixed(1)} min/g`
                : `ML-projected at ${rosterMpg?.toFixed(1)} min/g (roster)`}
            </div>
          )}
        </div>
      )}

      {/* Column headers — only when a projection is active */}
      {!showPrevSeason && activePrediction && (
        <div className="flex items-center justify-end gap-3 px-1 -mb-1">
          <span className="text-[10px] text-gray-600 uppercase tracking-widest w-16 text-right">Now</span>
          <span className="text-[10px] text-blue-500 uppercase tracking-widest w-20 text-right">Projected</span>
        </div>
      )}

      <section>
        <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-medium">Scoring</h3>
        <div className="bg-[#1a1e24] rounded-lg px-3">
          <StatRowWithProj label="PPG"   value={stats.ppg}       projected={!showPrevSeason ? activePrediction?.points      : undefined} />
          <StatRowWithProj label="FGA/G" value={stats.fgaPerGame  ?? 0} projected={!showPrevSeason ? activePrediction?.fg_attempted : undefined} />
          <StatRowWithProj label="FG%"   value={stats.fgPct}           projected={!showPrevSeason ? activePrediction?.fg_pct   : undefined} format="pct" />
          <StatRowWithProj label="3PM/G" value={stats.fg3mPerGame ?? 0} projected={!showPrevSeason ? activePrediction?.fg3_made  : undefined} />
          <StatRowWithProj label="3PT%"  value={stats.fg3Pct}          projected={!showPrevSeason ? activePrediction?.fg3_pct  : undefined} format="pct" />
          <StatRowWithProj label="FTA/G" value={stats.ftaPerGame  ?? 0} projected={!showPrevSeason ? activePrediction?.ft_attempted : undefined} />
          <StatRowWithProj label="FT%"   value={stats.ftPct}      projected={!showPrevSeason ? activePrediction?.ft_pct   : undefined} format="pct" />
        </div>
      </section>

      <section>
        <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-medium">Playmaking & Defense</h3>
        <div className="bg-[#1a1e24] rounded-lg px-3">
          <StatRowWithProj label="APG"     value={stats.apg}         projected={!showPrevSeason ? activePrediction?.assists    : undefined} />
          <StatRowWithProj label="TOV/G"   value={stats.topg}        projected={!showPrevSeason ? activePrediction?.turnovers  : undefined} />
          <StatRow
            label="AST/TO"
            value={stats.topg > 0 ? parseFloat((stats.apg / stats.topg).toFixed(2)) : stats.apg}
            compact
          />
          <StatRowWithProj label="SPG"     value={stats.spg}         projected={!showPrevSeason ? activePrediction?.steals     : undefined} />
          <StatRowWithProj label="BPG"     value={stats.bpg}         projected={!showPrevSeason ? activePrediction?.blocks     : undefined} />
          <StatRowWithProj label="Fouls/G" value={stats.foulsPerGame ?? 0} projected={!showPrevSeason ? activePrediction?.fouls     : undefined} />
        </div>
      </section>

      <section>
        <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-medium">Rebounding</h3>
        <div className="bg-[#1a1e24] rounded-lg px-3">
          <StatRowWithProj label="RPG"    value={stats.rpg}          projected={!showPrevSeason ? activePrediction?.total_rebounds      : undefined} />
          <StatRowWithProj label="OREB/G" value={stats.orebPerGame  ?? 0} projected={!showPrevSeason ? activePrediction?.offensive_rebounds  : undefined} />
          <StatRowWithProj label="DREB/G" value={stats.drebPerGame  ?? 0} projected={!showPrevSeason ? activePrediction?.defensive_rebounds  : undefined} />
          <StatRow         label="Min/G"  value={stats.minutesPerGame} compact />
        </div>
      </section>

      <section>
        <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-medium">Efficiency</h3>
        <div className="bg-[#1a1e24] rounded-lg px-3">
          <StatRowWithProj label="eFG%"   value={stats.efgPct}  projected={!showPrevSeason ? projEfgPct : undefined} format="pct" />
          <StatRowWithProj label="TS%"    value={stats.tsPct}   projected={!showPrevSeason ? projTsPct  : undefined} format="pct" />
          <StatRow         label="PER"    value={stats.per}     compact />
          <StatRow         label="Usage%" value={stats.usagePct} format="pct" compact />
        </div>
      </section>

      <section>
        <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-medium">Advanced</h3>
        <div className="bg-[#1a1e24] rounded-lg px-3">
          <StatRow label="BPM"        value={stats.bpm}       compact />
          <StatRow label="Win Shares" value={stats.winShares} compact />
          <StatRow label="ORTG"       value={stats.ortg}      compact />
          <StatRow label="DRTG"       value={stats.drtg}      compact />
        </div>
      </section>
    </div>
  )
}

/** Stat row that shows current value alongside a projected (blue) value */
function StatRowWithProj({
  label, value, projected, format,
}: {
  label: string
  value: number
  projected?: number
  format?: 'pct'
}) {
  const fmt = (v: number) => format === 'pct' ? `${v.toFixed(1)}%` : v.toFixed(1)
  const delta = projected !== undefined ? projected - value : 0
  const hasChange = projected !== undefined && Math.abs(delta) > 0.05

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
      <div className="flex items-center gap-3 ml-auto">
        <span className="font-mono text-sm text-white">{fmt(value)}</span>
        {projected !== undefined && (
          <span className={cn(
            'font-mono text-sm',
            hasChange ? (delta > 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-600'
          )}>
            {fmt(projected)}
            {hasChange && (
              <span className="text-[10px] ml-1">
                ({delta > 0 ? '+' : ''}{fmt(delta)})
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}

const STUB_PLAYLISTS = [
  { title: 'Scoring Highlights', clips: 12, duration: '18:24' },
  { title: 'Defensive Plays',    clips: 8,  duration: '11:50' },
  { title: 'Pick & Roll Reads',  clips: 6,  duration: '9:05' },
  { title: 'Transition Offense', clips: 10, duration: '14:38' },
]

// ── Film Tab — last, Synergy note ─────────────────────────────────────────────
function FilmTab({ playerName }: { playerName: string }) {
  return (
    <div className="space-y-4">
      <div className="relative bg-[#1a1e24] rounded-xl aspect-video flex items-center justify-center border border-white/10">
        <div className="flex flex-col items-center gap-2 text-gray-600">
          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
            <Play className="w-6 h-6 ml-1" />
          </div>
          <span className="text-sm">Film integration coming soon</span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 h-1 bg-white/10 rounded-full">
          <div className="h-full w-1/3 bg-blue-500 rounded-full" />
        </div>
      </div>

      <p className="text-xs text-blue-400 bg-blue-900/15 border border-blue-700/20 rounded-lg px-3 py-2">
        Synergy integration coming soon.
      </p>

      {/* Playlists */}
      <div>
        <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-medium">Playlists</h4>
        <div className="space-y-1.5">
          {STUB_PLAYLISTS.map(pl => (
            <div
              key={pl.title}
              className="flex items-center gap-3 px-3 py-2.5 bg-[#1a1e24] rounded-lg border border-white/5 cursor-default"
            >
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Play className="w-3 h-3 text-gray-500 ml-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{pl.title}</p>
                <p className="text-[10px] text-gray-600">{pl.clips} clips · {pl.duration}</p>
              </div>
              <Film className="w-3.5 h-3.5 text-gray-700 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────
function NotesTab({ playerId }: { playerId: string }) {
  const [noteText, setNoteText] = useState('')
  const addPlayerNote = useNexusStore(s => s.addPlayerNote)
  const deletePlayerNote = useNexusStore(s => s.deletePlayerNote)
  const playerNotes = useNexusStore(s => s.playerNotes)
  const { show } = useToast()

  const notes = playerNotes[playerId] ?? []

  async function syncToCloud(updatedNotes: string[]) {
    try {
      const token = await getAccessToken()
      if (!token) return
      await savePlayerNotes(token, playerId, updatedNotes)
    } catch { /* silent — notes are always in localStorage */ }
  }

  const handleSave = useCallback(() => {
    const trimmed = noteText.trim()
    if (!trimmed) return
    addPlayerNote(playerId, trimmed)
    setNoteText('')
    show('Note saved', 'success')
    syncToCloud([...notes, trimmed])
  }, [noteText, playerId, addPlayerNote, show, notes])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Add a scouting note..."
          rows={3}
          className={cn(
            'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2',
            'text-sm text-white placeholder:text-gray-600',
            'focus:outline-none focus:border-blue-500 resize-none transition-colors'
          )}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
          }}
        />
        <Button size="sm" onClick={handleSave} disabled={!noteText.trim()} className="w-full">
          Save note
        </Button>
      </div>

      {notes.length > 0 ? (
        <div className="space-y-2">
          {[...notes].reverse().map((note, reversedIndex) => {
            const index = notes.length - 1 - reversedIndex
            return (
              <div key={index} className="group bg-[#1a1e24] rounded-lg p-3 border border-white/8">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-300 flex-1">{note}</p>
                  <button
                    onClick={() => {
                      deletePlayerNote(playerId, index)
                      syncToCloud(notes.filter((_, i) => i !== index))
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1.5">Note #{index + 1}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-600 text-center py-4">No notes yet. Add your first scouting note above.</p>
      )}
    </div>
  )
}

// ── Fit Breakdown Tab ─────────────────────────────────────────────────────────
function FitTab({ playerId }: { playerId: string }) {
  const player = usePlayer(playerId)
  const models = useNexusStore(s => s.models)
  const activeModelId = useNexusStore(s => s.activeModelId)
  const allPlayers = useAllPlayers()
  const scenario = useActiveScenario()

  const model = models.find(m => m.id === activeModelId)

  if (!model || !player) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <BarChart3 className="w-8 h-8 text-gray-700" />
        <div className="text-center">
          <p className="text-sm text-gray-400">No model active</p>
          <p className="text-xs text-gray-600 mt-1">Set an active model in the Models tab to see fit breakdowns.</p>
        </div>
      </div>
    )
  }

  // Pool-normalized fit scores (all players at same position for proper normalization)
  const portalAtPosition = allPlayers.filter(p => p.position === player.position && !p.isReturner)
  const positionScoreMap = useMemo(
    () => computeAllFitScores(portalAtPosition, model),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [portalAtPosition.length, model.id, model.coefficients],
  )
  const fitScore = positionScoreMap[player.id] ?? 0

  // Portal rank for this position
  const ranked = portalAtPosition
    .map(p => ({ id: p.id, score: positionScoreMap[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score)
  const rank = ranked.findIndex(r => r.id === player.id) + 1

  // Roster comparison at same position
  const rosterPlayerIds = new Set(scenario?.slots.map(s => s.playerId).filter(Boolean) ?? [])
  const rosterAtPosition = allPlayers.filter(p =>
    rosterPlayerIds.has(p.id) && p.position === player.position && p.id !== player.id
  )
  const rosterAvg = rosterAtPosition.length > 0
    ? {
        ppg:    avg(rosterAtPosition, 'ppg'),
        rpg:    avg(rosterAtPosition, 'rpg'),
        apg:    avg(rosterAtPosition, 'apg'),
        fg3Pct: avg(rosterAtPosition, 'fg3Pct'),
        efgPct: avg(rosterAtPosition, 'efgPct'),
        bpm:    avg(rosterAtPosition, 'bpm'),
      }
    : null

  // Skill grades — percentile among all players at same position
  const allAtPosition = useMemo(
    () => allPlayers.filter(p => p.position === player.position),
    [allPlayers, player.position],
  )

  const skills = useMemo(() => [
    { label: 'Scoring',    key: 'ppg'    as keyof Player, value: player.ppg,    unit: 'PPG'  },
    { label: 'Efficiency', key: 'efgPct' as keyof Player, value: player.efgPct, unit: 'eFG%' },
    { label: 'Rebounding', key: 'rpg'    as keyof Player, value: player.rpg,    unit: 'RPG'  },
    { label: 'Playmaking', key: 'apg'    as keyof Player, value: player.apg,    unit: 'APG'  },
    { label: 'Steals',     key: 'spg'    as keyof Player, value: player.spg,    unit: 'SPG'  },
    { label: 'Rim Prot.',  key: 'bpg'    as keyof Player, value: player.bpg,    unit: 'BPG'  },
  ].map(s => ({
    ...s,
    pct: pctRank(allAtPosition, player.id, s.key),
  })), [allAtPosition, player])

  const strengths = skills.filter(s => s.pct >= 72)
  const concerns  = skills.filter(s => s.pct < 28)

  return (
    <div className="space-y-4">
      {/* Fit score summary */}
      <div className="bg-[#1a1e24] rounded-lg p-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Overall fit score</p>
          <p className="text-xs text-gray-600 mt-0.5">
            #{rank} among {player.position}s in portal · {model.name}
          </p>
        </div>
        <div className="text-2xl font-mono font-bold text-white">
          {fitScore}<span className="text-gray-600 text-base">/100</span>
        </div>
      </div>

      {/* vs. roster at same position */}
      {rosterAvg && (
        <div className="bg-[#1a1e24] rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-2">vs. your current {player.position}s on roster</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(['ppg', 'rpg', 'apg', 'fg3Pct', 'efgPct', 'bpm'] as const).map(k => {
              const playerVal = player[k as keyof Player] as number
              const rosterVal = rosterAvg[k as keyof typeof rosterAvg] as number
              const diff = playerVal - rosterVal
              return (
                <div key={k} className="bg-white/5 rounded-lg p-2">
                  <p className="text-[10px] text-gray-600 uppercase">{k}</p>
                  <p className="text-sm font-mono text-white">{playerVal.toFixed(1)}</p>
                  <p className={cn('text-[10px] font-mono', diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-600')}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)} vs avg
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Skill profile */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-medium">
          Skill Profile <span className="normal-case text-gray-700">— among {allAtPosition.length} {player.position}s</span>
        </p>
        <div className="space-y-2.5">
          {skills.map(s => (
            <SkillBar key={s.label} label={s.label} pct={s.pct} value={s.value} unit={s.unit} />
          ))}
        </div>
      </div>

      {/* Key strengths */}
      {strengths.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-medium">Key Strengths</p>
          <div className="space-y-1.5">
            {strengths.map(s => (
              <div key={s.label} className="flex items-start gap-2 px-3 py-2 bg-green-900/10 border border-green-700/20 rounded-lg text-xs">
                <span className="text-green-400 shrink-0 mt-px">★</span>
                <span className="text-gray-300">
                  <span className="font-medium">{s.label}</span>
                  {' — top '}{Math.max(1, 100 - s.pct)}% among {player.position}s
                  <span className="text-gray-500 ml-1">({s.value.toFixed(1)} {s.unit})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas to watch */}
      {concerns.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-medium">Areas to Watch</p>
          <div className="space-y-1.5">
            {concerns.map(s => (
              <div key={s.label} className="flex items-start gap-2 px-3 py-2 bg-amber-900/10 border border-amber-700/20 rounded-lg text-xs">
                <span className="text-amber-500 shrink-0 mt-px">!</span>
                <span className="text-gray-400">
                  <span className="font-medium">{s.label}</span>
                  {' — bottom '}{Math.max(1, s.pct)}% among {player.position}s
                  <span className="text-gray-500 ml-1">({s.value.toFixed(1)} {s.unit})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function avg(players: Player[], key: keyof Player): number {
  if (players.length === 0) return 0
  return players.reduce((sum, p) => sum + (p[key] as number), 0) / players.length
}

// ── Skill grade helpers ───────────────────────────────────────────────────────

function pctRank(players: Player[], playerId: string, key: keyof Player): number {
  const val = players.find(p => p.id === playerId)?.[key] as number ?? 0
  const below = players.filter(p => (p[key] as number) < val).length
  return players.length > 1 ? Math.round((below / (players.length - 1)) * 100) : 50
}

function gradeFromPct(pct: number): { grade: string; color: string } {
  if (pct >= 93) return { grade: 'A+', color: 'text-emerald-400' }
  if (pct >= 85) return { grade: 'A',  color: 'text-emerald-400' }
  if (pct >= 78) return { grade: 'A-', color: 'text-green-400' }
  if (pct >= 70) return { grade: 'B+', color: 'text-green-400' }
  if (pct >= 62) return { grade: 'B',  color: 'text-blue-400' }
  if (pct >= 55) return { grade: 'B-', color: 'text-blue-400' }
  if (pct >= 46) return { grade: 'C+', color: 'text-gray-300' }
  if (pct >= 38) return { grade: 'C',  color: 'text-gray-300' }
  if (pct >= 30) return { grade: 'C-', color: 'text-amber-400' }
  if (pct >= 22) return { grade: 'D+', color: 'text-amber-400' }
  if (pct >= 15) return { grade: 'D',  color: 'text-red-400' }
  return          { grade: 'F',  color: 'text-red-500' }
}

function SkillBar({
  label, pct, value, unit,
}: {
  label: string; pct: number; value: number; unit: string
}) {
  const { grade, color } = gradeFromPct(pct)
  const barColor = pct >= 70 ? 'bg-green-500' : pct >= 45 ? 'bg-blue-500' : 'bg-amber-600'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-600 font-mono w-12 text-right shrink-0">
        {value.toFixed(1)}{unit.includes('%') ? '%' : ''}
      </span>
      <span className={cn('font-semibold font-mono w-6 text-right shrink-0', color)}>{grade}</span>
    </div>
  )
}
