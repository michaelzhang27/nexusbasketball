import { cn } from '@/lib/utils'

interface FitScoreBadgeProps {
  score: number | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function FitScoreBadge({ score, size = 'md', className }: FitScoreBadgeProps) {
  const isUndefined = score === undefined || score === null

  const colorClass = isUndefined
    ? 'bg-gray-800 text-gray-500 border-gray-700'
    : score >= 80
    ? 'bg-green-900/50 text-green-400 border-green-700'
    : score >= 60
    ? 'bg-amber-900/50 text-amber-400 border-amber-700'
    : 'bg-red-900/50 text-red-400 border-red-700'

  const sizeClass = {
    sm: 'text-xs px-1.5 py-0.5 min-h-[20px]',
    md: 'text-xs px-2 py-1 min-h-[24px]',
    lg: 'text-sm px-2.5 py-1 min-h-[28px]',
  }[size]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-mono font-semibold rounded-md border',
        colorClass,
        sizeClass,
        className
      )}
    >
      {isUndefined ? 'N/A' : score}
    </span>
  )
}

function getFitScoreLabel(score: number | undefined): string {
  if (score === undefined) return 'No Model'
  if (score >= 80) return 'Tier 1'
  if (score >= 60) return 'Tier 2'
  return 'Tier 3'
}

export { FitScoreBadge, getFitScoreLabel }
