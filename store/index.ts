// ─────────────────────────────────────────────────────────────────────────────
// Nexus Analytics — Zustand Global Store
// Single store, all state slices. localStorage persistence via persist middleware.
// Hydration: skipHydration=true prevents SSR/client mismatch. The
// <StoreHydration /> component in layout.tsx calls rehydrate() on mount.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Player,
  RosterScenario,
  EvaluationModel,
  BoardGroup,
  NilDeal,
  FilterState,
  SidePanelState,
  SidePanelTab,
  ModelCoefficients,
  MinuteRange,
  MLPrediction,
  ConferencePredictResult,
  TeamContext,
} from '@/types'
import { DEFAULT_FILTER_STATE } from '@/types'
import { PRESET_SCENARIOS } from '@/data/scenarios'

// ── Preset evaluation models (Guard = pos 1 endpoint, Big = pos 5 endpoint) ───
// Coefficients are stored as positive importance weights.
// Penalty stats (fga, fta, turnovers, fouls) are negated at score computation time.

const defaultCoefficients = (): ModelCoefficients => ({
  points: 1.0, fga: 1.0, fta: 1.0, fg3m: 1.0, assists: 1.0,
  turnovers: 1.0, oreb: 1.0, dreb: 1.0, steals: 1.0, blocks: 1.0, fouls: 1.0,
})

const PRESET_MODELS: EvaluationModel[] = [
  {
    id: 'model-balanced',
    name: 'Historical',
    description: 'Coefficients derived from ML analysis of what statistically correlates with winning across D1 basketball. Guard and Big endpoints interpolate across all five positions.',
    isPreset: true,
    createdAt: '2025-04-01T00:00:00.000Z',
    coefficients: {
      // Position 1 (PG) weights from validated formula
      Guard: { points: 0.860, fga: 0.560, fta: 0.246, fg3m: 0.389, assists: 0.580, turnovers: 0.964, oreb: 0.613, dreb: 0.116, steals: 1.369, blocks: 1.327, fouls: 0.367 },
      // Position 5 (C) weights from validated formula
      Big:   { points: 0.860, fga: 0.780, fta: 0.343, fg3m: 0.389, assists: 1.034, turnovers: 0.964, oreb: 0.181, dreb: 0.181, steals: 1.008, blocks: 0.703, fouls: 0.367 },
    },
  },
  {
    id: 'model-3pt',
    name: 'Three-Point Emphasis',
    description: 'Heavily rewards 3-point shooting and penalizes poor shot selection. Built for spread offenses that live behind the arc.',
    isPreset: true,
    createdAt: '2025-04-01T00:00:01.000Z',
    coefficients: {
      Guard: { points: 0.7, fga: 0.4, fta: 0.2, fg3m: 1.9, assists: 0.7, turnovers: 0.9, oreb: 0.3, dreb: 0.1, steals: 0.9, blocks: 0.7, fouls: 0.3 },
      Big:   { points: 0.7, fga: 0.5, fta: 0.3, fg3m: 1.5, assists: 0.8, turnovers: 0.9, oreb: 0.4, dreb: 0.3, steals: 0.7, blocks: 0.5, fouls: 0.3 },
    },
  },
  {
    id: 'model-defense',
    name: 'Defense First',
    description: 'Prioritizes steals, blocks, and ball security. Guards who pressure the ball and bigs who protect the paint score highest.',
    isPreset: true,
    createdAt: '2025-04-01T00:00:02.000Z',
    coefficients: {
      Guard: { points: 0.4, fga: 0.3, fta: 0.1, fg3m: 0.2, assists: 0.5, turnovers: 1.2, oreb: 0.4, dreb: 0.3, steals: 2.5, blocks: 1.5, fouls: 0.2 },
      Big:   { points: 0.4, fga: 0.4, fta: 0.2, fg3m: 0.2, assists: 0.4, turnovers: 1.2, oreb: 0.4, dreb: 0.8, steals: 1.5, blocks: 2.5, fouls: 0.2 },
    },
  },
  {
    id: 'model-playmaking',
    name: 'Playmaking Focused',
    description: 'Prioritizes assist volume and ball security above all else. Ideal for motion offenses that run through a true point-of-attack creator.',
    isPreset: true,
    createdAt: '2025-04-01T00:00:03.000Z',
    coefficients: {
      Guard: { points: 0.5, fga: 0.4, fta: 0.2, fg3m: 0.4, assists: 2.2, turnovers: 1.5, oreb: 0.3, dreb: 0.2, steals: 1.0, blocks: 0.5, fouls: 0.3 },
      Big:   { points: 0.5, fga: 0.5, fta: 0.3, fg3m: 0.3, assists: 1.7, turnovers: 1.5, oreb: 0.3, dreb: 0.5, steals: 0.8, blocks: 0.7, fouls: 0.3 },
    },
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Migrate a scenario that may be missing new fields (from old localStorage). */
function migrateScenario(s: RosterScenario): RosterScenario {
  const defaultScenario = PRESET_SCENARIOS.find(p => p.id === 'scenario-default')!
  // Build rosterGroups from slots if missing
  const defaultRosterGroups = (): import('@/types').RosterGroupEntry[] => {
    const slotIds = s.slots.map(sl => sl.playerId)
    const filled = (indices: number[]) =>
      indices.map(i => slotIds[i]).filter((id): id is string => id !== null)
    return [
      { id: 'guards', label: 'Guards', playerIds: filled([0, 1, 2, 3]) },
      { id: 'wings',  label: 'Wings',  playerIds: filled([4, 5]) },
      { id: 'bigs',   label: 'Bigs',   playerIds: filled([6, 7, 8, 9, 10]) },
      { id: 'flex',   label: 'Flex',   playerIds: filled([11, 12]) },
    ]
  }
  return {
    ...s,
    boardGroups:   s.boardGroups   ?? defaultScenario.boardGroups,
    watchlistIds:  s.watchlistIds  ?? [],
    nilDeals:      s.nilDeals      ?? {},
    playerMinutes: Object.fromEntries(
      Object.entries(s.playerMinutes ?? {}).map(([k, v]) =>
        typeof v === 'number'
          ? [k, { min: Math.max(0, (v as number) - 4), max: Math.min(40, (v as number) + 4) }]
          : [k, v]
      )
    ) as Record<string, MinuteRange>,
    rosterGroups:  s.rosterGroups  ?? defaultRosterGroups(),
  }
}

// ── Store type ────────────────────────────────────────────────────────────────
export interface NexusStore {
  // Data
  players: Player[]
  returners: Player[]

  // Scenarios (teams)
  activeScenarioId: string
  scenarios: RosterScenario[]

  // Models
  activeModelId: string
  models: EvaluationModel[]

  // Notes
  playerNotes: Record<string, string[]>

  // Side panel
  sidePanel: SidePanelState

  // Search / filter
  searchQuery: string
  filterState: FilterState

  // Predictions
  isPredicted: boolean
  predictionsStale: boolean
  // Ground-truth ML predictions from the last roster "Run Predictions" run.
  // Keyed by player_id. Active scenario's predictions live here.
  rosterPredictions: Record<string, MLPrediction>
  // Conference record prediction from the BPM-based backend predictor.
  conferenceResult: ConferencePredictResult | null
  // Team context: last-year KenPom-style stats + conference averages from backend CSV.
  teamContext: TeamContext | null
  // Per-scenario snapshot so predictions survive scenario switching.
  scenarioPredictions: Record<string, { rosterPredictions: Record<string, MLPrediction>; isPredicted: boolean; conferenceResult: ConferencePredictResult | null; teamContext: TeamContext | null }>

  // ── Selectors (derived from active scenario) ───────────────────────────────
  getActiveBoardGroups: () => BoardGroup[]
  getActiveNilDeals: () => Record<string, NilDeal>
  getActivePlayerMinutes: () => Record<string, MinuteRange>

  // ── Actions ────────────────────────────────────────────────────────────────

  // Board (per-team)
  reorderBoard: (groupId: string, newOrder: string[]) => void
  addToBoard: (playerId: string) => void
  removeFromBoard: (playerId: string) => void

  // Watchlist
  toggleWatchlist: (playerId: string) => void
  isWatchlisted: (playerId: string) => boolean

  // Notes
  addPlayerNote: (playerId: string, note: string) => void
  deletePlayerNote: (playerId: string, index: number) => void

  // Side panel
  openSidePanel: (playerId: string, tab?: SidePanelTab) => void
  closeSidePanel: () => void
  setSidePanelTab: (tab: SidePanelTab) => void

  // Scenarios
  setActiveScenario: (scenarioId: string) => void
  updateScenarioSlot: (scenarioId: string, slotIndex: number, playerId: string | null) => void
  createScenario: (name: string) => void
  renameScenario: (scenarioId: string, name: string) => void
  resetScenarioToReturners: (scenarioId: string) => void
  updateScenarioBudget: (scenarioId: string, budget: number) => void
  deleteScenario: (scenarioId: string) => void

  // Models
  setActiveModel: (modelId: string) => void
  saveModel: (model: EvaluationModel) => void
  deleteModel: (modelId: string) => void

  // Roster groups (free-form canvas)
  addToRosterGroup: (groupId: string, playerId: string) => void
  removeFromRosterGroup: (playerId: string) => void

  // NIL (per-team)
  updateNilDeal: (playerId: string, deal: Partial<NilDeal>) => void

  // Player minutes (per-team)
  updatePlayerMinutes: (playerId: string, range: MinuteRange) => void

  // Predictions
  runPredictions: () => void
  setRosterPredictions: (predictions: Record<string, MLPrediction>) => void
  setConferenceResult: (result: ConferencePredictResult | null) => void
  setTeamContext: (context: TeamContext | null) => void

  // Player pipeline status
  updatePlayerStatus: (playerId: string, status: import('@/types').PipelineStatus) => void

  // Players (loaded from API on startup)
  setPlayers: (players: Player[]) => void

  // Cloud data bootstrap (called by StoreHydration after login)
  loadUserData: (data: { scenarios: RosterScenario[]; player_notes: Record<string, string[]>; models: EvaluationModel[] }) => void

  // Search
  setSearchQuery: (query: string) => void
  setFilterState: (filters: Partial<FilterState>) => void
  resetFilters: () => void
}

// ── Store implementation ──────────────────────────────────────────────────────
export const useNexusStore = create<NexusStore>()(
  persist(
    (set, get) => ({
      // ── Initial data — populated by API fetch in StoreHydration ─────────
      players: [],
      returners: [],

      // ── Scenarios ─────────────────────────────────────────────────────────
      activeScenarioId: 'scenario-default',
      scenarios: PRESET_SCENARIOS,

      // ── Models ────────────────────────────────────────────────────────────
      activeModelId: 'model-balanced',
      models: PRESET_MODELS,

      // ── Notes ─────────────────────────────────────────────────────────────
      playerNotes: {},

      // ── Side panel ────────────────────────────────────────────────────────
      sidePanel: {
        isOpen: false,
        playerId: null,
        activeTab: 'stats',
      },

      // ── Search ────────────────────────────────────────────────────────────
      searchQuery: '',
      filterState: DEFAULT_FILTER_STATE,

      // ── Predictions ───────────────────────────────────────────────────────
      isPredicted: false,
      predictionsStale: false,
      rosterPredictions: {},
      conferenceResult: null,
      teamContext: null,
      // Per-scenario snapshot so predictions survive scenario switching
      scenarioPredictions: {} as Record<string, { rosterPredictions: Record<string, MLPrediction>; isPredicted: boolean; conferenceResult: ConferencePredictResult | null; teamContext: TeamContext | null }>,

      // ── Selectors ─────────────────────────────────────────────────────────
      getActiveBoardGroups: () => {
        const { scenarios, activeScenarioId } = get()
        const s = scenarios.find(s => s.id === activeScenarioId)
        return s?.boardGroups ?? []
      },

      getActiveNilDeals: () => {
        const { scenarios, activeScenarioId } = get()
        const s = scenarios.find(s => s.id === activeScenarioId)
        return s?.nilDeals ?? {}
      },

      getActivePlayerMinutes: () => {
        const { scenarios, activeScenarioId } = get()
        const s = scenarios.find(s => s.id === activeScenarioId)
        return s?.playerMinutes ?? {}
      },

      // ── Board actions (per-team) ───────────────────────────────────────────
      reorderBoard: (groupId, newOrder) => {
        const { activeScenarioId } = get()
        set(state => ({
          scenarios: state.scenarios.map(s =>
            s.id !== activeScenarioId ? s : {
              ...s,
              boardGroups: s.boardGroups.map(g =>
                g.id === groupId ? { ...g, playerIds: newOrder } : g
              ),
            }
          ),
        }))
      },

      addToBoard: (playerId) => {
        const { activeScenarioId, players } = get()
        const player = players.find(p => p.id === playerId)
        if (!player) return
        set(state => ({
          scenarios: state.scenarios.map(s => {
            if (s.id !== activeScenarioId) return s
            const updated = s.boardGroups.map(g => {
              if (g.id !== 'overall' && g.id !== player.position) return g
              if (g.playerIds.includes(playerId)) return g
              return { ...g, playerIds: [...g.playerIds, playerId] }
            })
            return { ...s, boardGroups: updated }
          }),
        }))
      },

      removeFromBoard: (playerId) => {
        const { activeScenarioId } = get()
        set(state => ({
          scenarios: state.scenarios.map(s => {
            if (s.id !== activeScenarioId) return s
            return {
              ...s,
              boardGroups: s.boardGroups.map(g => ({
                ...g,
                playerIds: g.playerIds.filter(id => id !== playerId),
              })),
            }
          }),
        }))
      },

      // ── Roster group actions (free-form canvas) ──────────────────────────
      addToRosterGroup: (groupId, playerId) => {
        const { activeScenarioId } = get()
        set(state => ({
          scenarios: state.scenarios.map(s => {
            if (s.id !== activeScenarioId) return s
            // Remove from any existing group first
            const cleaned = s.rosterGroups.map(g => ({
              ...g,
              playerIds: g.playerIds.filter(id => id !== playerId),
            }))
            // Add to target group
            const updated = cleaned.map(g =>
              g.id === groupId && !g.playerIds.includes(playerId)
                ? { ...g, playerIds: [...g.playerIds, playerId] }
                : g
            )
            return { ...s, rosterGroups: updated }
          }),
        }))
      },

      removeFromRosterGroup: (playerId) => {
        const { activeScenarioId } = get()
        set(state => ({
          scenarios: state.scenarios.map(s =>
            s.id !== activeScenarioId ? s : {
              ...s,
              rosterGroups: s.rosterGroups.map(g => ({
                ...g,
                playerIds: g.playerIds.filter(id => id !== playerId),
              })),
            }
          ),
        }))
      },

      // ── Watchlist actions ─────────────────────────────────────────────────
      // Watchlist is stored on the active scenario's nilDeals as a lightweight flag
      // For simplicity, we use a global watchlistIds on the scenario
      toggleWatchlist: (playerId) => {
        const { activeScenarioId } = get()
        set(state => ({
          scenarios: state.scenarios.map(s => {
            if (s.id !== activeScenarioId) return s
            const watchlist = s.watchlistIds ?? []
            const has = watchlist.includes(playerId)
            return {
              ...s,
              watchlistIds: has
                ? watchlist.filter(id => id !== playerId)
                : [...watchlist, playerId],
            }
          }),
        }))
      },

      isWatchlisted: (playerId) => {
        const { scenarios, activeScenarioId } = get()
        const s = scenarios.find(s => s.id === activeScenarioId)
        return (s?.watchlistIds ?? []).includes(playerId)
      },

      // ── Notes actions ─────────────────────────────────────────────────────
      addPlayerNote: (playerId, note) => {
        set(state => ({
          playerNotes: {
            ...state.playerNotes,
            [playerId]: [...(state.playerNotes[playerId] ?? []), note],
          },
        }))
      },

      deletePlayerNote: (playerId, index) => {
        set(state => {
          const notes = [...(state.playerNotes[playerId] ?? [])]
          notes.splice(index, 1)
          return {
            playerNotes: { ...state.playerNotes, [playerId]: notes },
          }
        })
      },

      // ── Side panel actions ────────────────────────────────────────────────
      openSidePanel: (playerId, tab = 'stats') => {
        set({ sidePanel: { isOpen: true, playerId, activeTab: tab } })
      },

      closeSidePanel: () => {
        set(state => ({
          sidePanel: { ...state.sidePanel, isOpen: false },
        }))
      },

      setSidePanelTab: (tab) => {
        set(state => ({
          sidePanel: { ...state.sidePanel, activeTab: tab },
        }))
      },

      // ── Scenario actions ──────────────────────────────────────────────────
      setActiveScenario: (scenarioId) => {
        const { activeScenarioId, isPredicted, rosterPredictions, conferenceResult, teamContext, scenarioPredictions } = get()
        // Save current scenario's predictions before switching
        const updatedMap = {
          ...scenarioPredictions,
          [activeScenarioId]: { rosterPredictions, isPredicted, conferenceResult, teamContext },
        }
        // Restore the target scenario's predictions (or default to empty)
        const saved = updatedMap[scenarioId]
        set({
          activeScenarioId: scenarioId,
          isPredicted: saved?.isPredicted ?? false,
          predictionsStale: false,
          rosterPredictions: saved?.rosterPredictions ?? {},
          conferenceResult: saved?.conferenceResult ?? null,
          teamContext: saved?.teamContext ?? null,
          scenarioPredictions: updatedMap,
        })
      },

      updateScenarioSlot: (scenarioId, slotIndex, playerId) => {
        set(state => ({
          scenarios: state.scenarios.map(s =>
            s.id !== scenarioId ? s : {
              ...s,
              slots: s.slots.map(slot =>
                slot.index === slotIndex ? { ...slot, playerId } : slot
              ),
            }
          ),
        }))
      },

      createScenario: (name) => {
        const state = get()
        const currentScenario = state.scenarios.find(s => s.id === state.activeScenarioId)
        if (!currentScenario) return

        const newScenario: RosterScenario = {
          ...currentScenario,
          id: `scenario-${Date.now()}`,
          name,
          createdAt: new Date().toISOString(),
          // Clone board state and reset NIL/minutes for the new team
          boardGroups: currentScenario.boardGroups.map(g => ({ ...g })),
          nilDeals: {},
          playerMinutes: {},
          // Reset all non-returner slots
          slots: currentScenario.slots.map(slot => ({
            ...slot,
            playerId: slot.isReturnerSlot ? slot.playerId : null,
          })),
          // Reset roster groups to returners only
          rosterGroups: (currentScenario.rosterGroups ?? []).map(g => ({
            ...g,
            playerIds: g.playerIds.filter(id => {
              const slot = currentScenario.slots.find(s => s.playerId === id)
              return slot?.isReturnerSlot ?? false
            }),
          })),
        }

        set(state => ({
          scenarios: [...state.scenarios, newScenario],
          activeScenarioId: newScenario.id,
        }))
      },

      renameScenario: (scenarioId, name) => {
        set(state => ({
          scenarios: state.scenarios.map(s =>
            s.id === scenarioId ? { ...s, name } : s
          ),
        }))
      },

      resetScenarioToReturners: (scenarioId) => {
        const defaultScenario = PRESET_SCENARIOS.find(s => s.id === 'scenario-default')
        if (!defaultScenario) return

        set(state => ({
          scenarios: state.scenarios.map(s => {
            if (s.id !== scenarioId) return s
            const resetSlots = s.slots.map(slot => ({
              ...slot,
              playerId: slot.isReturnerSlot
                ? (defaultScenario.slots.find(ds => ds.index === slot.index)?.playerId ?? null)
                : null,
            }))
            const returnerIds = new Set(resetSlots.filter(sl => sl.isReturnerSlot && sl.playerId).map(sl => sl.playerId!))
            return {
              ...s,
              slots: resetSlots,
              rosterGroups: (s.rosterGroups ?? defaultScenario.rosterGroups).map(g => ({
                ...g,
                playerIds: g.playerIds.filter(id => returnerIds.has(id)),
              })),
              playerMinutes: {},
            }
          }),
        }))
      },

      updateScenarioBudget: (scenarioId, budget) => {
        set(state => ({
          scenarios: state.scenarios.map(s =>
            s.id === scenarioId ? { ...s, budget } : s
          ),
        }))
      },

      deleteScenario: (scenarioId) => {
        const state = get()
        // Cannot delete if only 1 scenario remains
        if (state.scenarios.length <= 1) return
        // Cannot delete preset scenarios
        const isPreset = PRESET_SCENARIOS.some(s => s.id === scenarioId)
        if (isPreset) return

        const remaining = state.scenarios.filter(s => s.id !== scenarioId)
        const newActive = state.activeScenarioId === scenarioId
          ? (remaining[0]?.id ?? 'scenario-default')
          : state.activeScenarioId

        set({
          scenarios: remaining,
          activeScenarioId: newActive,
        })
      },

      // ── Model actions ─────────────────────────────────────────────────────
      setActiveModel: (modelId) => {
        set({ activeModelId: modelId })
      },

      saveModel: (model) => {
        set(state => {
          const exists = state.models.some(m => m.id === model.id)
          if (exists) {
            return { models: state.models.map(m => m.id === model.id ? model : m) }
          }
          return { models: [...state.models, model] }
        })
      },

      deleteModel: (modelId) => {
        const state = get()
        const model = state.models.find(m => m.id === modelId)
        if (!model || model.isPreset) return

        set(prev => ({
          models: prev.models.filter(m => m.id !== modelId),
          activeModelId: prev.activeModelId === modelId ? 'model-balanced' : prev.activeModelId,
        }))
      },

      // ── NIL actions (per-team) ────────────────────────────────────────────
      updateNilDeal: (playerId, dealUpdate) => {
        const { activeScenarioId } = get()
        set(state => {
          return {
            scenarios: state.scenarios.map(s => {
              if (s.id !== activeScenarioId) return s
              const existing = s.nilDeals[playerId] ?? {
                playerId,
                scenarioId: activeScenarioId,
                status: 'not_targeted' as const,
                offerAmount: 0,
                notes: '',
                justification: '',
              }
              return {
                ...s,
                nilDeals: {
                  ...s.nilDeals,
                  [playerId]: { ...existing, ...dealUpdate },
                },
              }
            }),
          }
        })
      },

      // ── Player minutes (per-team) ─────────────────────────────────────────
      updatePlayerMinutes: (playerId, range) => {
        const { activeScenarioId } = get()
        set(state => ({
          predictionsStale: true,
          scenarios: state.scenarios.map(s =>
            s.id !== activeScenarioId ? s : {
              ...s,
              playerMinutes: { ...s.playerMinutes, [playerId]: range },
            }
          ),
        }))
      },

      // ── Predictions ───────────────────────────────────────────────────────
      runPredictions: () => {
        const { activeScenarioId, rosterPredictions, conferenceResult, teamContext, scenarioPredictions } = get()
        set({
          isPredicted: true,
          predictionsStale: false,
          scenarioPredictions: {
            ...scenarioPredictions,
            [activeScenarioId]: { rosterPredictions, isPredicted: true, conferenceResult, teamContext },
          },
        })
      },

      setRosterPredictions: (predictions) => {
        const { activeScenarioId, isPredicted, conferenceResult, teamContext, scenarioPredictions } = get()
        set({
          rosterPredictions: predictions,
          scenarioPredictions: {
            ...scenarioPredictions,
            [activeScenarioId]: { rosterPredictions: predictions, isPredicted, conferenceResult, teamContext },
          },
        })
      },

      setConferenceResult: (result) => {
        const { activeScenarioId, isPredicted, rosterPredictions, teamContext, scenarioPredictions } = get()
        set({
          conferenceResult: result,
          scenarioPredictions: {
            ...scenarioPredictions,
            [activeScenarioId]: { rosterPredictions, isPredicted, conferenceResult: result, teamContext },
          },
        })
      },

      setTeamContext: (context) => {
        const { activeScenarioId, isPredicted, rosterPredictions, conferenceResult, scenarioPredictions } = get()
        set({
          teamContext: context,
          scenarioPredictions: {
            ...scenarioPredictions,
            [activeScenarioId]: { rosterPredictions, isPredicted, conferenceResult, teamContext: context },
          },
        })
      },

      // ── Player pipeline status ────────────────────────────────────────────
      updatePlayerStatus: (playerId, status) => {
        set(state => ({
          players: state.players.map(p =>
            p.id === playerId ? { ...p, portalStatus: status } : p
          ),
        }))
      },

      setPlayers: (players) => set({ players }),

      // ── Cloud data bootstrap ──────────────────────────────────────────────
      loadUserData: (data) => {
        set(state => {
          // Scenarios: cloud versions replace matching local ones; cloud-only ones are added.
          // Preset scenarios (from code) are never replaced by cloud data.
          const presetIds = new Set(PRESET_SCENARIOS.map(s => s.id))
          const cloudById = new Map(data.scenarios.map(s => [s.id, migrateScenario(s)]))

          const merged = state.scenarios.map(s =>
            !presetIds.has(s.id) && cloudById.has(s.id) ? cloudById.get(s.id)! : s
          )
          const localIds = new Set(state.scenarios.map(s => s.id))
          const newFromCloud = data.scenarios
            .filter(s => !localIds.has(s.id))
            .map(migrateScenario)

          // Models: cloud custom models replace matching ones; presets always from code.
          const cloudModelById = new Map(data.models.map(m => [m.id, m]))
          const mergedModels = state.models.map(m =>
            !m.isPreset && cloudModelById.has(m.id) ? cloudModelById.get(m.id)! : m
          )
          const localModelIds = new Set(state.models.map(m => m.id))
          const newModelsFromCloud = data.models.filter(m => !localModelIds.has(m.id))

          // Notes: cloud wins for any key present in both.
          const mergedNotes = { ...state.playerNotes, ...data.player_notes }

          return {
            scenarios: [...merged, ...newFromCloud],
            models: [...mergedModels, ...newModelsFromCloud],
            playerNotes: mergedNotes,
          }
        })
      },

      // ── Search actions ────────────────────────────────────────────────────
      setSearchQuery: (query) => set({ searchQuery: query }),

      setFilterState: (filters) => {
        set(state => ({ filterState: { ...state.filterState, ...filters } }))
      },

      resetFilters: () => {
        set({ filterState: DEFAULT_FILTER_STATE, searchQuery: '' })
      },
    }),
    {
      name: 'nexus-store-v3', // v3: per-40 fit score model schema (Guard/Big endpoints)
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        playerNotes: state.playerNotes,
        scenarios: state.scenarios,
        models: state.models,
        activeScenarioId: state.activeScenarioId,
        activeModelId: state.activeModelId,
        rosterPredictions: state.rosterPredictions,
        isPredicted: state.isPredicted,
        conferenceResult: state.conferenceResult,
        teamContext: state.teamContext,
        scenarioPredictions: state.scenarioPredictions,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Migrate scenarios from old localStorage shapes
        state.scenarios = state.scenarios.map(migrateScenario)
        // Clear any persisted predictions that predate the expanded MLPrediction shape.
        // Old predictions lack total_rebounds / fg_pct — accessing them crashes the roster table.
        const isFullShape = (p: unknown) =>
          p !== null && typeof p === 'object' &&
          'total_rebounds' in (p as object) && 'fg_pct' in (p as object)
        const clean = (map: Record<string, unknown>) =>
          Object.fromEntries(Object.entries(map).filter(([, v]) => isFullShape(v)))
        state.rosterPredictions = clean(state.rosterPredictions as Record<string, unknown>) as typeof state.rosterPredictions
        if (state.scenarioPredictions) {
          for (const key of Object.keys(state.scenarioPredictions)) {
            const entry = state.scenarioPredictions[key]
            if (entry?.rosterPredictions) {
              entry.rosterPredictions = clean(entry.rosterPredictions as Record<string, unknown>) as typeof entry.rosterPredictions
            }
          }
        }
      },
    }
  )
)

// ── Convenience selectors ─────────────────────────────────────────────────────
export function useWatchlistIds(): string[] {
  return useNexusStore(state => {
    const s = state.scenarios.find(sc => sc.id === state.activeScenarioId)
    return s?.watchlistIds ?? []
  })
}

export function useActiveBoardGroups(): import('@/types').BoardGroup[] {
  return useNexusStore(state => {
    const s = state.scenarios.find(sc => sc.id === state.activeScenarioId)
    return s?.boardGroups ?? []
  })
}

export function useActiveNilDeals(): Record<string, import('@/types').NilDeal> {
  return useNexusStore(state => {
    const s = state.scenarios.find(sc => sc.id === state.activeScenarioId)
    return s?.nilDeals ?? {}
  })
}

export function useActivePlayerMinutes(): Record<string, MinuteRange> {
  return useNexusStore(state => {
    const s = state.scenarios.find(sc => sc.id === state.activeScenarioId)
    return s?.playerMinutes ?? {}
  })
}

export function useActiveRosterGroups(): import('@/types').RosterGroupEntry[] {
  return useNexusStore(state => {
    const s = state.scenarios.find(sc => sc.id === state.activeScenarioId)
    return s?.rosterGroups ?? []
  })
}
