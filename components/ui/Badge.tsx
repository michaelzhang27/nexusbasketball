import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray' | 'outline'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full',
        variant === 'default' && 'bg-blue-900/40 text-blue-400 border border-blue-700/50',
        variant === 'blue'    && 'bg-blue-900/40 text-blue-400 border border-blue-700/50',
        variant === 'green'   && 'bg-green-900/40 text-green-400 border border-green-700/50',
        variant === 'amber'   && 'bg-amber-900/40 text-amber-400 border border-amber-700/50',
        variant === 'red'     && 'bg-red-900/40 text-red-400 border border-red-700/50',
        variant === 'purple'  && 'bg-violet-900/40 text-violet-400 border border-violet-700/50',
        variant === 'gray'    && 'bg-gray-800 text-gray-400 border border-gray-700',
        variant === 'outline' && 'border border-white/20 text-gray-300',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge }
export type { BadgeProps, BadgeVariant }
