'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PipelineStatus } from '@/types'

const STATUS_CONFIG: Record<PipelineStatus, { label: string; className: string }> = {
  not_in_portal:   { label: 'Not in Portal',   className: 'bg-zinc-900 text-zinc-500 border-zinc-700' },
  available:       { label: 'In Portal',        className: 'bg-gray-800 text-gray-300 border-gray-600' },
  contacted:       { label: 'Contacted',        className: 'bg-blue-900/40 text-blue-400 border-blue-700/50' },
  visit_scheduled: { label: 'Visit Scheduled',  className: 'bg-violet-900/40 text-violet-400 border-violet-700/50' },
  offered:         { label: 'Offered',          className: 'bg-amber-900/40 text-amber-400 border-amber-700/50' },
  committed:       { label: 'Committed',        className: 'bg-green-900/40 text-green-400 border-green-700/50' },
  passed:          { label: 'Passed',           className: 'bg-red-900/40 text-red-400 border-red-700/50' },
}

// not_in_portal is excluded — coaches can't manually set a player to that state
const ALL_STATUSES: PipelineStatus[] = [
  'available', 'contacted', 'visit_scheduled', 'offered', 'committed', 'passed',
]

interface StatusPillProps {
  status: PipelineStatus
  onChange?: (newStatus: PipelineStatus) => void
  className?: string
}

function StatusPill({ status, onChange, className }: StatusPillProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const config = STATUS_CONFIG[status]

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!onChange) {
    return (
      <span
        className={cn(
          'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border',
          config.className,
          className
        )}
      >
        {config.label}
      </span>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
          'cursor-pointer hover:opacity-90 transition-opacity',
          config.className,
          className
        )}
      >
        {config.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-[#1a1e24] border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[150px]">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={(e) => {
                e.stopPropagation()
                onChange(s)
                setOpen(false)
              }}
              className={cn(
                'w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/5',
                s === status ? 'text-white font-semibold bg-white/5' : 'text-gray-400',
                s === 'passed' && 'text-red-400 hover:text-red-300'
              )}
            >
              {STATUS_CONFIG[s].label}
              {s === 'passed' && (
                <span className="ml-1 text-gray-600 text-[10px]">— removes from board</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { StatusPill, STATUS_CONFIG, ALL_STATUSES }
