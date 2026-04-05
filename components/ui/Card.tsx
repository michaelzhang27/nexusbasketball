import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'inner'
}

function Card({ className, variant = 'base', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        variant === 'base' && 'bg-[#14171c] border border-white/10 rounded-xl p-4',
        variant === 'inner' && 'bg-[#1a1e24] border border-white/[0.08] rounded-lg p-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card }
export type { CardProps }
