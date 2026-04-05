'use client'

import { useState } from 'react'
import { useNexusStore } from '@/store'
import { usePlayerSearch } from '@/hooks/usePlayerSearch'
import { SearchBar } from '@/components/explore/SearchBar'
import { FilterPanel } from '@/components/explore/FilterPanel'
import { PlayerResultCard } from '@/components/explore/PlayerResultCard'
import { RecommendedSection } from '@/components/explore/RecommendedSection'
import { Select } from '@/components/ui/Select'
import type { SortField } from '@/lib/search'
import { Loader2 } from 'lucide-react'

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'fitScore',        label: 'Fit Score' },
  { value: 'ppg',             label: 'PPG' },
  { value: 'rpg',             label: 'RPG' },
  { value: 'apg',             label: 'APG' },
  { value: 'fg3Pct',          label: '3P%' },
  { value: 'efgPct',          label: 'eFG%' },
  { value: 'name',            label: 'Name A-Z' },
  { value: 'portalEntryDate', label: 'Portal Entry Date' },
]

function CardSkeleton() {
  return (
    <div className="bg-[#14171c] border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-white/10 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/5 rounded w-1/2" />
          <div className="h-3 bg-white/5 rounded w-3/4" />
        </div>
        <div className="w-12 h-6 bg-white/10 rounded" />
      </div>
      <div className="flex gap-4 py-2 border-y border-white/5 mb-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="h-4 bg-white/10 rounded w-8" />
            <div className="h-2.5 bg-white/5 rounded w-6" />
          </div>
        ))}
      </div>
      <div className="h-3 bg-white/5 rounded w-full mb-2" />
      <div className="h-3 bg-white/5 rounded w-4/5 mb-3" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-7 bg-white/5 rounded-lg w-16" />
        ))}
      </div>
    </div>
  )
}

export default function ExplorePage() {
  const [sortField, setSortField] = useState<SortField>('fitScore')

  const searchQuery = useNexusStore(s => s.searchQuery)
  const filterState = useNexusStore(s => s.filterState)

  const { players, total, isLoading, isLoadingMore, hasMore, loadMore } =
    usePlayerSearch(filterState, searchQuery, sortField)

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Left filter panel */}
      <aside className="w-[320px] shrink-0 border-r border-white/10 bg-[#0f1114] p-4 overflow-y-auto">
        <FilterPanel />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 p-6 overflow-y-auto">
        <RecommendedSection />

        <div className="mb-4">
          <SearchBar />
        </div>

        {/* Sort + results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {isLoading ? (
              <span className="text-gray-600">Searching…</span>
            ) : (
              <>{total.toLocaleString()} player{total !== 1 ? 's' : ''} found</>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Sort by:</span>
            <Select
              value={sortField}
              onValueChange={(v) => setSortField(v as SortField)}
              options={SORT_OPTIONS}
              triggerClassName="text-xs py-1 px-2.5 min-w-[130px]"
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : players.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {players.map(player => (
                <PlayerResultCard key={player.id} player={player} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    `Load more (${total - players.length} remaining)`
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-600">
            <p className="text-sm">No players match your search and filters.</p>
            <button
              onClick={() => useNexusStore.getState().resetFilters()}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
