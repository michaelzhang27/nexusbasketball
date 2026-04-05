import { cn, formatDollar, formatPct } from '@/lib/utils'

interface StatRowProps {
  label: string
  value: number | string
  unit?: string
  compare?: number // if provided, show delta vs this number
  format?: 'pct' | 'dollar' | 'default'
  className?: string
  compact?: boolean
}

function StatRow({ label, value, unit, compare, format, className, compact = false }: StatRowProps) {
  const displayValue = (() => {
    if (typeof value === 'string') return value
    if (format === 'pct') return formatPct(value)
    if (format === 'dollar') return formatDollar(value)
    if (unit) return `${value}${unit}`
    return typeof value === 'number' ? value.toFixed(1) : value
  })()

  const delta = compare !== undefined && typeof value === 'number'
    ? value - compare
    : null

  const deltaColor = delta === null
    ? ''
    : delta > 0.5 ? 'text-green-400'
    : delta < -0.5 ? 'text-red-400'
    : 'text-gray-400'

  return (
    <div className={cn(
      'flex items-center justify-between',
      compact ? 'py-1' : 'py-2',
      'border-b border-white/5 last:border-0',
      className
    )}>
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        {delta !== null && (
          <span className={cn('text-xs font-mono', deltaColor)}>
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
          </span>
        )}
        <span className="font-mono text-white font-semibold text-sm">{displayValue}</span>
      </div>
    </div>
  )
}

export { StatRow }
