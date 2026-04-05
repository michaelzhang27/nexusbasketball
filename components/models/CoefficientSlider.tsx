'use client'

import { RotateCcw } from 'lucide-react'
import { Slider } from '@/components/ui/Slider'
import { cn } from '@/lib/utils'

interface CoefficientSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  onReset: () => void
  disabled?: boolean
}

export function CoefficientSlider({ label, value, onChange, onReset, disabled = false }: CoefficientSliderProps) {
  const isCustomized = Math.abs(value - 1.0) > 0.05

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-28 shrink-0">
        <span className={cn(
          'text-sm',
          disabled ? 'text-gray-600' : 'text-gray-400'
        )}>
          {label}
        </span>
        {isCustomized && !disabled && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
        )}
      </div>

      <div className="flex-1">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={0}
          max={5}
          step={0.1}
          disabled={disabled}
        />
      </div>

      <span className={cn(
        'font-mono text-sm w-8 text-right shrink-0',
        disabled ? 'text-gray-600' : isCustomized ? 'text-blue-400' : 'text-gray-400'
      )}>
        {value.toFixed(1)}
      </span>

      <button
        onClick={onReset}
        disabled={disabled || !isCustomized}
        className={cn(
          'p-1 rounded transition-colors shrink-0',
          !disabled && isCustomized
            ? 'text-gray-500 hover:text-gray-300'
            : 'text-gray-700 cursor-not-allowed'
        )}
        title="Reset to 1.0"
      >
        <RotateCcw className="w-3 h-3" />
      </button>
    </div>
  )
}
