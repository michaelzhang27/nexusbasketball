'use client'

import { AlertTriangle } from 'lucide-react'
import { useNexusStore, useActiveNilDeals } from '@/store'
import { useFitScore } from '@/hooks/useFitScore'
import { useActiveScenario } from '@/hooks/useProjectedStats'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { FitScoreBadge } from '@/components/shared/FitScoreBadge'
import { formatDollar, cn, positionColor } from '@/lib/utils'
import type { Player, NilDealStatus } from '@/types'

const DEAL_STATUS_OPTIONS: { value: NilDealStatus; label: string }[] = [
  { value: 'not_targeted', label: 'Not Targeted' },
  { value: 'targeted',     label: 'Targeted' },
  { value: 'offered',      label: 'Offered' },
  { value: 'negotiating',  label: 'Negotiating' },
  { value: 'signed',       label: 'Signed' },
]

const STATUS_STYLES: Record<NilDealStatus, { dot: string; label: string; pill: string }> = {
  not_targeted: { dot: 'bg-gray-600',   label: 'text-gray-500',  pill: 'bg-gray-800/50 border-gray-700/40' },
  targeted:     { dot: 'bg-blue-500',   label: 'text-blue-400',  pill: 'bg-blue-900/20 border-blue-700/30' },
  offered:      { dot: 'bg-amber-500',  label: 'text-amber-400', pill: 'bg-amber-900/20 border-amber-700/30' },
  negotiating:  { dot: 'bg-orange-500', label: 'text-orange-400', pill: 'bg-orange-900/20 border-orange-700/30' },
  signed:       { dot: 'bg-green-500',  label: 'text-green-400', pill: 'bg-green-900/20 border-green-700/30' },
}

function bpmColor(bpm: number) {
  if (bpm >= 2)  return 'text-green-400'
  if (bpm >= 0)  return 'text-gray-300'
  return 'text-red-400'
}

interface NilDealCardProps {
  player: Player
  suggestedValue: number   // BPM-proportional share of team budget
  bpmShare: number         // fraction 0–1 of team's total positive BPM
}

export function NilDealCard({ player, suggestedValue, bpmShare }: NilDealCardProps) {
  const fitScore = useFitScore(player)
  const scenario = useActiveScenario()
  const nilDeals = useActiveNilDeals()
  const updateNilDeal = useNexusStore(s => s.updateNilDeal)
  const openSidePanel = useNexusStore(s => s.openSidePanel)

  const deal = nilDeals[player.id]
  const dealStatus: NilDealStatus = deal?.status ?? 'not_targeted'
  const offerAmount = deal?.offerAmount ?? 0
  const justification = deal?.justification ?? ''

  const statusStyle = STATUS_STYLES[dealStatus]

  // How far off is current offer vs suggested?
  const offerDelta = offerAmount > 0 && suggestedValue > 0
    ? offerAmount - suggestedValue
    : null

  // Eligibility warning: 1 year remaining is risky for a NIL commitment
  const eligibilityWarning = player.eligibilityRemaining <= 1

  function handleOfferChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0
    updateNilDeal(player.id, { offerAmount: val })
  }

  return (
    <div className={cn('border rounded-xl p-4 transition-colors', statusStyle.pill)}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <PlayerAvatar player={player} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openSidePanel(player.id, 'stats')}
              className="text-white font-medium text-sm hover:text-blue-400 transition-colors"
            >
              {player.name}
            </button>
            <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded text-white', positionColor(player.position))}>
              {player.position}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{player.previousSchool} · {player.conference}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn('text-[11px] font-mono', bpmColor(player.bpm))}>
              {player.bpm >= 0 ? '+' : ''}{player.bpm.toFixed(1)} BPM
            </span>
            {eligibilityWarning && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                {player.eligibilityRemaining === 0 ? 'No eligibility left' : '1 yr remaining'}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <FitScoreBadge score={fitScore} size="sm" />
          <div className={cn('flex items-center gap-1.5 text-xs font-medium', statusStyle.label)}>
            <span className={cn('w-2 h-2 rounded-full', statusStyle.dot)} />
            {DEAL_STATUS_OPTIONS.find(o => o.value === dealStatus)?.label}
          </div>
        </div>
      </div>

      {/* NIL value boxes */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Market Rate — coming soon */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 opacity-50">
          <p className="text-xs text-gray-500 mb-1">Market Rate</p>
          <p className="text-sm font-mono text-gray-500 italic">Coming soon</p>
          <p className="text-[10px] text-gray-600 mt-1">Portal market data</p>
        </div>

        {/* Your Value — BPM-proportional */}
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
          <p className="text-xs text-blue-400 mb-1">Your Value</p>
          <p className="text-sm font-mono text-blue-300 font-semibold">
            {suggestedValue > 0 ? formatDollar(suggestedValue) : '—'}
          </p>
          <p className="text-[10px] text-blue-500/70 mt-1">
            {bpmShare > 0
              ? `${(bpmShare * 100).toFixed(1)}% of team BPM`
              : 'Negative BPM — no allocation'}
          </p>
        </div>
      </div>

      {/* Offer vs suggested delta — shown when both are set */}
      {offerDelta !== null && (
        <div className={cn(
          'flex items-center justify-between px-3 py-1.5 rounded-lg text-xs mb-3',
          Math.abs(offerDelta) < suggestedValue * 0.1
            ? 'bg-green-900/15 border border-green-700/20 text-green-400'
            : offerDelta > 0
            ? 'bg-amber-900/15 border border-amber-700/20 text-amber-400'
            : 'bg-white/5 border border-white/10 text-gray-400'
        )}>
          <span>Offer vs suggested</span>
          <span className="font-mono">
            {offerDelta >= 0 ? '+' : ''}{formatDollar(offerDelta)}
            {offerDelta > suggestedValue * 0.25 && ' · over budget signal'}
          </span>
        </div>
      )}

      {/* Deal status selector */}
      <div className="flex items-center gap-1 flex-wrap mb-3">
        {DEAL_STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => updateNilDeal(player.id, { status: opt.value })}
            className={cn(
              'px-2.5 py-1 text-xs rounded-lg border transition-colors',
              dealStatus === opt.value
                ? cn(STATUS_STYLES[opt.value].dot.replace('bg-', 'bg-').replace('-500', '-900/40'), 'border-current', STATUS_STYLES[opt.value].label)
                : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Offer amount + justification — only when targeted or beyond */}
      {dealStatus !== 'not_targeted' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Offer amount:</span>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
              <input
                type="number"
                value={offerAmount || ''}
                onChange={handleOfferChange}
                placeholder="0"
                className={cn(
                  'bg-white/5 border border-white/10 rounded-lg pl-5 pr-3 py-1.5',
                  'text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500',
                  'w-32 transition-colors'
                )}
              />
            </div>
            {offerAmount > 0 && suggestedValue > 0 && (
              <span className="text-xs text-gray-600">
                suggested {formatDollar(suggestedValue)}
              </span>
            )}
          </div>
          <textarea
            value={justification}
            onChange={e => updateNilDeal(player.id, { justification: e.target.value })}
            placeholder="Valuation rationale (e.g. need at position, proven scorer, fills system gap)..."
            rows={2}
            className={cn(
              'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2',
              'text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 resize-none transition-colors'
            )}
          />
        </div>
      )}
    </div>
  )
}
