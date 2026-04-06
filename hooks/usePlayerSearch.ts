'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNexusStore } from '@/store'
import { computeAllFitScores } from '@/lib/fitScore'
import type { Player, FilterState } from '@/types'
import type { SortField } from '@/lib/search'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8005'
const LIMIT = 48

function buildParams(
  filters: FilterState,
  q: string,
  sort: SortField,
  offset: number,
): string {
  const p = new URLSearchParams()
  if (q.trim()) p.set('q', q.trim())
  // fit score sort is client-side; send ppg as the server sort so order is sensible
  p.set('sort', sort === 'fitScore' ? 'ppg' : sort)
  p.set('offset', String(offset))
  p.set('limit', String(LIMIT))

  // Categorical filters always apply — even during text search
  if (filters.positions.length) p.set('positions', filters.positions.join(','))
  if (filters.conferences.length) p.set('conferences', filters.conferences.join(','))
  if (filters.classYears.length) p.set('class_years', filters.classYears.join(','))
  if (filters.portalStatuses.length) p.set('portal_statuses', filters.portalStatuses.join(','))

  // Stat range filters only apply when browsing (no text query).
  // Name/school/conference search must reach every player regardless of their stats —
  // the DEFAULT_FILTER_STATE has efgPctRange {40-70} which would silently exclude
  // players with low/no FGA stats when searching by name.
  if (!q.trim()) {
    p.set('ppg_min', String(filters.ppgRange.min))
    p.set('ppg_max', String(filters.ppgRange.max))
    p.set('fg3_min', String(filters.fg3PctRange.min))
    p.set('fg3_max', String(filters.fg3PctRange.max))
    p.set('efg_min', String(filters.efgPctRange.min))
    p.set('efg_max', String(filters.efgPctRange.max))
    p.set('min_elig', String(filters.minEligibility))
    if (filters.heightRange) {
      p.set('min_height', String(filters.heightRange.min))
      p.set('max_height', String(filters.heightRange.max))
    }
  }

  return p.toString()
}

interface UsePlayerSearchResult {
  players: Player[]
  total: number
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  loadMore: () => void
}

export function usePlayerSearch(
  filterState: FilterState,
  searchQuery: string,
  sortField: SortField,
): UsePlayerSearchResult {
  const [players, setPlayers] = useState<Player[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Snapshot of filter state at the time of the last committed fetch,
  // used by loadMore so it paginates the same query.
  const committedRef = useRef({ filterState, searchQuery, sortField })

  const models = useNexusStore(s => s.models)
  const activeModelId = useNexusStore(s => s.activeModelId)
  const dataView = useNexusStore(s => s.dataView)

  // Debounced state — gates the fresh-fetch effect
  const [debounced, setDebounced] = useState({ filterState, searchQuery, sortField, dataView })
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(
      () => setDebounced({ filterState, searchQuery, sortField, dataView }),
      200,
    )
    return () => clearTimeout(timerRef.current)
  }, [filterState, searchQuery, sortField, dataView])

  // Fresh fetch whenever debounced state changes
  useEffect(() => {
    setIsLoading(true)
    setOffset(0)
    committedRef.current = debounced

    const params = buildParams(debounced.filterState, debounced.searchQuery, debounced.sortField, 0)
    const genderParam = debounced.dataView === 'womens' ? '&gender=womens' : ''
    const controller = new AbortController()

    fetch(`${API_BASE}/api/players/search?${params}${genderParam}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        setPlayers(data.players ?? [])
        setTotal(data.total ?? 0)
        setIsLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') setIsLoading(false)
      })

    return () => controller.abort()
  }, [debounced])

  const loadMore = useCallback(() => {
    const newOffset = offset + LIMIT
    setIsLoadingMore(true)
    const { filterState: fs, searchQuery: sq, sortField: sf, dataView: dv } = committedRef.current
    const params = buildParams(fs, sq, sf, newOffset)
    const genderParam = dv === 'womens' ? '&gender=womens' : ''

    fetch(`${API_BASE}/api/players/search?${params}${genderParam}`)
      .then(r => r.json())
      .then(data => {
        setPlayers(prev => [...prev, ...(data.players ?? [])])
        setOffset(newOffset)
        setIsLoadingMore(false)
      })
      .catch(() => setIsLoadingMore(false))
  }, [offset])

  // Fit score sort is client-side on the current batch only
  const sortedPlayers = useMemo(() => {
    if (debounced.sortField !== 'fitScore') return players
    const model = models.find(m => m.id === activeModelId)
    if (!model) return players
    const scoreMap = computeAllFitScores(players, model)
    return [...players]
      .map(p => ({ ...p, fitScore: scoreMap[p.id] ?? 0 }))
      .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
  }, [players, debounced.sortField, models, activeModelId])

  return {
    players: sortedPlayers,
    total,
    isLoading,
    isLoadingMore,
    hasMore: offset + LIMIT < total,
    loadMore,
  }
}
