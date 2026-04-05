'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors cursor-pointer select-none',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          // Variants
          variant === 'primary' && 'bg-blue-600 hover:bg-blue-500 text-white',
          variant === 'secondary' && 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
          variant === 'ghost' && 'hover:bg-white/5 text-gray-400 hover:text-white',
          variant === 'danger' && 'bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-400',
          // Sizes
          size === 'sm' && 'text-xs px-3 py-1.5 gap-1.5',
          size === 'md' && 'text-sm px-4 py-2 gap-2',
          size === 'lg' && 'text-sm px-5 py-2.5 gap-2',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
