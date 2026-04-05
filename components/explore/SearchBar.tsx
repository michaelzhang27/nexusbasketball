'use client'

import { Search, Sparkles } from 'lucide-react'
import { useNexusStore } from '@/store'
import { cn } from '@/lib/utils'
import { useCallback, useRef, useState } from 'react'

type SearchMode = 'name' | 'natural'

export function SearchBar() {
  const searchQuery = useNexusStore(s => s.searchQuery)
  const setSearchQuery = useNexusStore(s => s.setSearchQuery)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mode, setMode] = useState<SearchMode>('name')

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (timerRef.current) clearTimeout(timerRef.current)
    // Natural language mode: stub — search still works on name for now
    timerRef.current = setTimeout(() => setSearchQuery(val), 150)
  }, [setSearchQuery])

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setMode('name')}
          className={cn(
            'px-3 py-1 text-xs rounded transition-colors',
            mode === 'name'
              ? 'bg-white/10 text-white'
              : 'text-gray-500 hover:text-gray-300'
          )}
        >
          Name Search
        </button>
        <button
          onClick={() => setMode('natural')}
          className={cn(
            'flex items-center gap-1 px-3 py-1 text-xs rounded transition-colors',
            mode === 'natural'
              ? 'bg-blue-600/30 text-blue-300'
              : 'text-gray-500 hover:text-gray-300'
          )}
        >
          <Sparkles className="w-3 h-3" />
          Natural Language
        </button>
      </div>

      {/* Search input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          defaultValue={searchQuery}
          onChange={handleChange}
          placeholder={
            mode === 'name'
              ? 'Search by name, school, or conference...'
              : 'e.g. "two-way guard who can shoot threes from the Big 12"'
          }
          className={cn(
            'w-full bg-white/5 border rounded-xl',
            'pl-9 pr-4 py-3 text-sm text-white placeholder:text-gray-600',
            'focus:outline-none transition-colors',
            mode === 'natural'
              ? 'border-blue-500/40 focus:border-blue-400'
              : 'border-white/10 focus:border-blue-500'
          )}
        />
        {mode === 'natural' && (
          <div className="absolute right-3 bg-blue-900/30 border border-blue-700/30 rounded px-2 py-0.5">
            <span className="text-[10px] text-blue-400">AI — coming soon</span>
          </div>
        )}
      </div>
    </div>
  )
}
