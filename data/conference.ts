// ─────────────────────────────────────────────────────────────────────────────
// Nexus Analytics — Conference Schedule Data
// Lakewood University — Midwest Collegiate Conference (MCC), 18-game schedule
// Post-beta seam: replace with API call to schedule service.
// ─────────────────────────────────────────────────────────────────────────────
import type { ConferenceGame } from '@/types'

export const CONFERENCE_SCHEDULE: ConferenceGame[] = [
  {
    id: 'g1',
    opponent: 'Ridgecrest State',
    location: 'home',
    date: '2025-01-04',
    opponentStrength: 0.52,
    opponentRecord: '8-6',
  },
  {
    id: 'g2',
    opponent: 'Bayside University',
    location: 'away',
    date: '2025-01-08',
    opponentStrength: 0.68,
    opponentRecord: '11-4',
  },
  {
    id: 'g3',
    opponent: 'Northview Tech',
    location: 'home',
    date: '2025-01-11',
    opponentStrength: 0.44,
    opponentRecord: '7-8',
  },
  {
    id: 'g4',
    opponent: 'Summit College',
    location: 'away',
    date: '2025-01-15',
    opponentStrength: 0.74,
    opponentRecord: '13-3',
  },
  {
    id: 'g5',
    opponent: 'Harborview University',
    location: 'home',
    date: '2025-01-18',
    opponentStrength: 0.58,
    opponentRecord: '9-6',
  },
  {
    id: 'g6',
    opponent: 'Crestfield University',
    location: 'away',
    date: '2025-01-22',
    opponentStrength: 0.48,
    opponentRecord: '8-7',
  },
  {
    id: 'g7',
    opponent: 'Lakeland State',
    location: 'home',
    date: '2025-01-25',
    opponentStrength: 0.62,
    opponentRecord: '10-5',
  },
  {
    id: 'g8',
    opponent: 'Twin Peaks University',
    location: 'neutral',
    date: '2025-01-29',
    opponentStrength: 0.55,
    opponentRecord: '9-6',
  },
  {
    id: 'g9',
    opponent: 'Westbrook College',
    location: 'away',
    date: '2025-02-01',
    opponentStrength: 0.38,
    opponentRecord: '6-10',
  },
  {
    id: 'g10',
    opponent: 'Iron Range University',
    location: 'home',
    date: '2025-02-05',
    opponentStrength: 0.71,
    opponentRecord: '12-4',
  },
  {
    id: 'g11',
    opponent: 'Ridgecrest State',
    location: 'away',
    date: '2025-02-08',
    opponentStrength: 0.54,
    opponentRecord: '10-7',
  },
  {
    id: 'g12',
    opponent: 'Bayside University',
    location: 'home',
    date: '2025-02-12',
    opponentStrength: 0.66,
    opponentRecord: '13-5',
  },
  {
    id: 'g13',
    opponent: 'Northview Tech',
    location: 'away',
    date: '2025-02-15',
    opponentStrength: 0.42,
    opponentRecord: '9-11',
  },
  {
    id: 'g14',
    opponent: 'Summit College',
    location: 'home',
    date: '2025-02-19',
    opponentStrength: 0.76,
    opponentRecord: '16-4',
  },
  {
    id: 'g15',
    opponent: 'Harborview University',
    location: 'away',
    date: '2025-02-22',
    opponentStrength: 0.60,
    opponentRecord: '12-8',
  },
  {
    id: 'g16',
    opponent: 'Lakeland State',
    location: 'away',
    date: '2025-02-26',
    opponentStrength: 0.64,
    opponentRecord: '13-8',
  },
  {
    id: 'g17',
    opponent: 'Westbrook College',
    location: 'home',
    date: '2025-03-01',
    opponentStrength: 0.36,
    opponentRecord: '7-14',
  },
  {
    id: 'g18',
    opponent: 'Iron Range University',
    location: 'away',
    date: '2025-03-05',
    opponentStrength: 0.73,
    opponentRecord: '16-5',
  },
]

// Conference metadata
export const LAKEWOOD_CONFERENCE = 'MCC' // Midwest Collegiate Conference
export const LAKEWOOD_SCHOOL = 'Lakewood University'
export const PROGRAM_PACE = 70 // target possessions per game
