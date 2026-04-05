'use client'

import * as RadixSelect from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  triggerClassName?: string
}

function Select({ value, onValueChange, options, placeholder = 'Select...', className, triggerClassName }: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger
        className={cn(
          'inline-flex items-center justify-between gap-2',
          'bg-white/5 border border-white/10 rounded-lg px-3 py-2',
          'text-sm text-white placeholder:text-gray-600',
          'hover:bg-white/8 focus:outline-none focus:border-blue-500',
          'transition-colors cursor-pointer min-w-[140px]',
          triggerClassName
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon asChild>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className={cn(
            'bg-[#1a1e24] border border-white/12 rounded-lg shadow-xl',
            'overflow-hidden z-50 min-w-[var(--radix-select-trigger-width)]',
            'animate-fade-in',
            className
          )}
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  'relative flex items-center gap-2 px-3 py-2 text-sm rounded-md',
                  'text-gray-300 cursor-pointer select-none',
                  'hover:bg-white/8 focus:bg-white/8 focus:outline-none',
                  'data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed',
                  'data-[highlighted]:bg-white/8 data-[highlighted]:text-white',
                  'transition-colors'
                )}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="ml-auto">
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}

export { Select }
export type { SelectProps, SelectOption }
