// ─────────────────────────────────────────────────────────────────────────────
// Nexus Analytics — Pre-built Scenarios (clean slate)
// All scenarios start empty — coaches build rosters from real player data.
// Post-beta seam: replace this export with an API call to the scenario service.
// ─────────────────────────────────────────────────────────────────────────────
import type { RosterScenario, BoardGroup, RosterGroupEntry } from '@/types'

function emptyBoardGroups(): BoardGroup[] {
  return [
    { id: 'overall', name: 'Overall', playerIds: [] },
    { id: 'PG',      name: 'PG',      playerIds: [] },
    { id: 'SG',      name: 'SG',      playerIds: [] },
    { id: 'SF',      name: 'SF',      playerIds: [] },
    { id: 'PF',      name: 'PF',      playerIds: [] },
    { id: 'C',       name: 'C',       playerIds: [] },
  ]
}

function emptyRosterGroups(): RosterGroupEntry[] {
  return [
    { id: 'guards', label: 'Guards', playerIds: [] },
    { id: 'wings',  label: 'Wings',  playerIds: [] },
    { id: 'bigs',   label: 'Bigs',   playerIds: [] },
    { id: 'flex',   label: 'Flex',   playerIds: [] },
  ]
}

function emptySlots(): RosterScenario['slots'] {
  return [
    { index: 0,  position: 'PG', playerId: null, isReturnerSlot: false },
    { index: 1,  position: 'PG', playerId: null, isReturnerSlot: false },
    { index: 2,  position: 'SG', playerId: null, isReturnerSlot: false },
    { index: 3,  position: 'SG', playerId: null, isReturnerSlot: false },
    { index: 4,  position: 'SF', playerId: null, isReturnerSlot: false },
    { index: 5,  position: 'SF', playerId: null, isReturnerSlot: false },
    { index: 6,  position: 'PF', playerId: null, isReturnerSlot: false },
    { index: 7,  position: 'PF', playerId: null, isReturnerSlot: false },
    { index: 8,  position: 'PF', playerId: null, isReturnerSlot: false },
    { index: 9,  position: 'C',  playerId: null, isReturnerSlot: false },
    { index: 10, position: 'C',  playerId: null, isReturnerSlot: false },
    { index: 11, position: 'PG', playerId: null, isReturnerSlot: false },
    { index: 12, position: 'SF', playerId: null, isReturnerSlot: false },
  ]
}

export const PRESET_SCENARIOS: RosterScenario[] = [
  {
    id: 'scenario-default',
    name: 'Default Roster',
    budget: 5_000_000,
    createdAt: '2025-04-01T00:00:00.000Z',
    boardGroups: emptyBoardGroups(),
    watchlistIds: [],
    nilDeals: {},
    playerMinutes: {},
    slots: emptySlots(),
    rosterGroups: emptyRosterGroups(),
  },
]
