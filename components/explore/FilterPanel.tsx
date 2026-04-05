'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useNexusStore } from '@/store'
import { useAllFitScores } from '@/hooks/useFitScore'
import { Slider } from '@/components/ui/Slider'
import { cn } from '@/lib/utils'
import type { Position, ClassYear, PipelineStatus, CustomStatSlider, PlayerStats } from '@/types'

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']
const CLASS_YEARS: ClassYear[] = ['FR', 'SO', 'JR', 'SR', 'GRAD']
const PORTAL_STATUSES: { value: PipelineStatus; label: string }[] = [
  { value: 'not_in_portal',   label: 'Not in Portal' },
  { value: 'available',       label: 'In Portal' },
  { value: 'contacted',       label: 'Contacted' },
  { value: 'visit_scheduled', label: 'Visit Scheduled' },
  { value: 'offered',         label: 'Offered' },
]

// All addable stat sliders with their defaults
const ADDABLE_STATS: { key: keyof Omit<PlayerStats, 'season'>; label: string; min: number; max: number; step: number }[] = [
  { key: 'rpg',          label: 'RPG',       min: 0,   max: 12,  step: 0.5 },
  { key: 'apg',          label: 'APG',       min: 0,   max: 10,  step: 0.5 },
  { key: 'spg',          label: 'SPG',       min: 0,   max: 3,   step: 0.1 },
  { key: 'bpg',          label: 'BPG',       min: 0,   max: 4,   step: 0.1 },
  { key: 'topg',         label: 'TOV',       min: 0,   max: 5,   step: 0.1 },
  { key: 'fgPct',        label: 'FG%',       min: 30,  max: 65,  step: 1 },
  { key: 'ftPct',        label: 'FT%',       min: 50,  max: 100, step: 1 },
  { key: 'tsPct',        label: 'TS%',       min: 40,  max: 70,  step: 1 },
  { key: 'usagePct',     label: 'Usage%',    min: 10,  max: 35,  step: 1 },
  { key: 'ortg',         label: 'ORTG',      min: 85,  max: 130, step: 1 },
  { key: 'drtg',         label: 'DRTG',      min: 85,  max: 125, step: 1 },
  { key: 'bpm',          label: 'BPM',       min: -6,  max: 12,  step: 0.5 },
  { key: 'per',          label: 'PER',       min: 10,  max: 35,  step: 0.5 },
  { key: 'minutesPerGame', label: 'Min/G',   min: 10,  max: 40,  step: 1 },
  { key: 'winShares',    label: 'Win Shares', min: 0,  max: 12,  step: 0.5 },
]

export function FilterPanel() {
  const filterState = useNexusStore(s => s.filterState)
  const setFilterState = useNexusStore(s => s.setFilterState)
  const resetFilters = useNexusStore(s => s.resetFilters)
  const players = useNexusStore(s => s.players)
  const activeModelId = useNexusStore(s => s.activeModelId)
  const fitScores = useAllFitScores()
  const hasModel = !!activeModelId
  const [showAddMenu, setShowAddMenu] = useState(false)

  const allConferences = [...new Set(players.map(p => p.conference))].sort()

  function togglePosition(pos: Position) {
    const current = filterState.positions
    setFilterState({
      positions: current.includes(pos) ? current.filter(p => p !== pos) : [...current, pos],
    })
  }

  function toggleConference(conf: string) {
    const current = filterState.conferences
    setFilterState({
      conferences: current.includes(conf) ? current.filter(c => c !== conf) : [...current, conf],
    })
  }

  function toggleClassYear(year: ClassYear) {
    const current = filterState.classYears
    setFilterState({
      classYears: current.includes(year) ? current.filter(y => y !== year) : [...current, year],
    })
  }

  function toggleStatus(status: PipelineStatus) {
    const current = filterState.portalStatuses
    setFilterState({
      portalStatuses: current.includes(status) ? current.filter(s => s !== status) : [...current, status],
    })
  }

  function addCustomSlider(stat: typeof ADDABLE_STATS[number]) {
    const already = filterState.customSliders.some(s => s.statKey === stat.key)
    if (already) { setShowAddMenu(false); return }
    const newSlider: CustomStatSlider = {
      id: `custom-${stat.key}`,
      statKey: stat.key,
      label: stat.label,
      min: stat.min,
      max: stat.max,
      step: stat.step,
      range: { min: stat.min, max: stat.max },
    }
    setFilterState({ customSliders: [...filterState.customSliders, newSlider] })
    setShowAddMenu(false)
  }

  function removeCustomSlider(id: string) {
    setFilterState({ customSliders: filterState.customSliders.filter(s => s.id !== id) })
  }

  function updateCustomSliderRange(id: string, range: { min: number; max: number }) {
    setFilterState({
      customSliders: filterState.customSliders.map(s => s.id === id ? { ...s, range } : s),
    })
  }

  const usedStatKeys = new Set(filterState.customSliders.map(s => s.statKey))
  const availableToAdd = ADDABLE_STATS.filter(s => !usedStatKeys.has(s.key))

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Filters</h2>
        <button
          onClick={resetFilters}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Reset all
        </button>
      </div>

      {/* Position */}
      <FilterSection title="Position">
        <div className="flex flex-wrap gap-1.5">
          {POSITIONS.map(pos => (
            <button
              key={pos}
              onClick={() => togglePosition(pos)}
              className={cn(
                'px-3 py-1 text-xs rounded-lg border transition-colors',
                filterState.positions.includes(pos)
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
              )}
            >
              {pos}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Class year */}
      <FilterSection title="Class Year">
        <div className="flex flex-wrap gap-1.5">
          {CLASS_YEARS.map(year => (
            <button
              key={year}
              onClick={() => toggleClassYear(year)}
              className={cn(
                'px-3 py-1 text-xs rounded-lg border transition-colors',
                filterState.classYears.includes(year)
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Portal Status */}
      <FilterSection title="Portal Status">
        <div className="space-y-1.5">
          {PORTAL_STATUSES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filterState.portalStatuses.includes(value)}
                onChange={() => toggleStatus(value)}
                className="accent-blue-500"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Conference */}
      <FilterSection title="Conference">
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {allConferences.map(conf => (
            <label key={conf} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filterState.conferences.includes(conf)}
                onChange={() => toggleConference(conf)}
                className="accent-blue-500"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors truncate">{conf}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* PPG Range */}
      <FilterSection title={`PPG: ${filterState.ppgRange.min} – ${filterState.ppgRange.max}`}>
        <Slider
          value={[filterState.ppgRange.min, filterState.ppgRange.max]}
          onValueChange={([min, max]) => setFilterState({ ppgRange: { min, max } })}
          min={0} max={30} step={0.5}
        />
      </FilterSection>

      {/* 3P% Range */}
      <FilterSection title={`3P%: ${filterState.fg3PctRange.min} – ${filterState.fg3PctRange.max}`}>
        <Slider
          value={[filterState.fg3PctRange.min, filterState.fg3PctRange.max]}
          onValueChange={([min, max]) => setFilterState({ fg3PctRange: { min, max } })}
          min={0} max={50} step={1}
        />
      </FilterSection>

      {/* eFG% Range */}
      <FilterSection title={`eFG%: ${filterState.efgPctRange.min} – ${filterState.efgPctRange.max}`}>
        <Slider
          value={[filterState.efgPctRange.min, filterState.efgPctRange.max]}
          onValueChange={([min, max]) => setFilterState({ efgPctRange: { min, max } })}
          min={40} max={70} step={1}
        />
      </FilterSection>

      {/* Height Range */}
      <FilterSection title={`Height: ${Math.floor((filterState.heightRange?.min ?? 60) / 12)}'${(filterState.heightRange?.min ?? 60) % 12}" – ${Math.floor((filterState.heightRange?.max ?? 96) / 12)}'${(filterState.heightRange?.max ?? 96) % 12}"`}>
        <Slider
          value={[filterState.heightRange?.min ?? 60, filterState.heightRange?.max ?? 96]}
          onValueChange={([min, max]) => setFilterState({ heightRange: { min, max } })}
          min={60} max={96} step={1}
        />
      </FilterSection>

      {/* Min Eligibility */}
      <FilterSection title={`Min Eligibility: ${filterState.minEligibility}yr`}>
        <Slider
          value={[filterState.minEligibility]}
          onValueChange={([v]) => setFilterState({ minEligibility: v })}
          min={1} max={4} step={1}
        />
      </FilterSection>

      {/* Fit Score Min */}
      <FilterSection title={`Min Fit Score: ${filterState.minFitScore}`}>
        <div className="relative">
          <Slider
            value={[filterState.minFitScore]}
            onValueChange={([v]) => setFilterState({ minFitScore: v })}
            min={0} max={100} step={5}
            disabled={!hasModel}
          />
          {!hasModel && (
            <p className="text-xs text-gray-600 mt-1.5">Set an active model to filter by fit score</p>
          )}
        </div>
      </FilterSection>

      {/* Custom sliders */}
      {filterState.customSliders.map(slider => (
        <div key={slider.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              {slider.label}: {slider.range.min.toFixed(1)} – {slider.range.max.toFixed(1)}
            </h3>
            <button
              onClick={() => removeCustomSlider(slider.id)}
              className="text-gray-600 hover:text-red-400 transition-colors"
              title="Remove filter"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <Slider
            value={[slider.range.min, slider.range.max]}
            onValueChange={([min, max]) => updateCustomSliderRange(slider.id, { min, max })}
            min={slider.min} max={slider.max} step={slider.step}
          />
        </div>
      ))}

      {/* Add filter button */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-white/10 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:border-white/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add stat filter
        </button>

        {showAddMenu && availableToAdd.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-[#1a1e24] border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
            {availableToAdd.map(stat => (
              <button
                key={stat.key}
                onClick={() => addCustomSlider(stat)}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {stat.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs text-gray-500 uppercase tracking-wide font-medium">{title}</h3>
      {children}
    </div>
  )
}
