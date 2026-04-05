'use client'

import * as RadixSlider from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

interface SliderProps {
  value: [number, number] | [number]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
}: SliderProps) {
  return (
    <RadixSlider.Root
      className={cn(
        'relative flex items-center select-none touch-none w-full h-5',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
    >
      <RadixSlider.Track className="bg-white/10 relative grow rounded-full h-1">
        <RadixSlider.Range className="absolute bg-blue-500 rounded-full h-full" />
      </RadixSlider.Track>

      {value.map((_, i) => (
        <RadixSlider.Thumb
          key={i}
          className={cn(
            'block w-4 h-4 bg-blue-500 rounded-full shadow',
            'hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50',
            'transition-colors cursor-grab active:cursor-grabbing',
            disabled && 'cursor-not-allowed'
          )}
        />
      ))}
    </RadixSlider.Root>
  )
}

export { Slider }
export type { SliderProps }
