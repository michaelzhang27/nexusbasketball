// ─────────────────────────────────────────────────────────────────────────────
// Nexus Analytics — Type Definitions
// All TypeScript interfaces and types for the application.
// Post-beta: API responses will be cast to these types at the data layer seam.
// ─────────────────────────────────────────────────────────────────────────────

export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'

// 2-endpoint position system: Guard (pos 1 = PG) and Big (pos 5 = C).
// Coefficients for SG/SF/PF are linearly interpolated at score time.
export type ModelGroupPosition = 'Guard' | 'Big'

export type ClassYear = 'FR' | 'SO' | 'JR' | 'SR' | 'GRAD'

export type PipelineStatus =
  | 'not_in_portal'
  | 'available'
  | 'contacted'
  | 'visit_scheduled'
  | 'offered'
  | 'committed'
  | 'passed'

export type NilDealStatus =
  | 'not_targeted'
  | 'targeted'
  | 'offered'
  | 'negotiating'
  | 'signed'

// ─────────────────────────────────────────────────────────────────────────────
// Player Stats — standalone so it can be reused for prevSeasonStats
// Post-beta seam: this shape is what the DB query returns per-season row
// ─────────────────────────────────────────────────────────────────────────────
export interface PlayerStats {
  season?: string // e.g. '2025-26' — undefined means current season
  ppg: number
  rpg: number
  apg: number
  spg: number
  bpg: number
  topg: number
  fgPct: number // 0–100
  fg3Pct: number // 0–100
  ftPct: number // 0–100
  efgPct: number // 0–100
  tsPct: number // 0–100
  usagePct: number // usage rate %
  ortg: number // offensive rating
  drtg: number // defensive rating
  bpm: number // box plus/minus
  winShares: number // season total
  per: number // player efficiency rating
  minutesPerGame: number
  // Per-game counting stats needed for per-40 fit score computation
  fgaPerGame?: number  // FG attempts per game
  ftaPerGame?: number  // FT attempts per game
  fg3mPerGame?: number // 3-pointers made per game
  orebPerGame?: number // offensive rebounds per game
  drebPerGame?: number // defensive rebounds per game
  foulsPerGame?: number // personal fouls per game
  totalMinutes?: number // season total minutes (general_minutes); used for fit score eligibility
}

// ─────────────────────────────────────────────────────────────────────────────
// Player — the core entity
// ─────────────────────────────────────────────────────────────────────────────
export interface Player extends PlayerStats {
  id: string
  name: string
  position: Position
  previousSchool: string
  conference: string
  classYear: ClassYear
  eligibilityRemaining: number // 1–4
  height: string // e.g. '6\'4"'
  weight: number // lbs
  hometown: string // City, State
  portalEntryDate: string // ISO date string
  portalStatus: PipelineStatus
  avatarColor: string // hex for initials avatar
  nilEstimate: [number, number] // [low, high] in dollars
  notes: string[]
  fitScore?: number // computed at runtime, never stored
  // Optional fields — always present in beta data, seam for future DB pull
  isReturner?: boolean
  photoUrl?: string
  prevSeasonStats?: PlayerStats // previous season — post-beta: from DB query with season indicator
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluation Model — per-40 stat importance weights (all stored as positive)
// Penalty stats (fga, fta, turnovers, fouls) are negated at computation time.
// ─────────────────────────────────────────────────────────────────────────────
export interface ModelCoefficients {
  points:    number // Scoring importance
  fga:       number // Shot selection penalty importance (higher → more penalizes shot volume)
  fta:       number // FT aggression penalty importance
  fg3m:      number // 3-point shooting importance
  assists:   number // Playmaking importance
  turnovers: number // Ball security penalty importance (higher → more penalizes turnovers)
  oreb:      number // Offensive rebounding importance
  dreb:      number // Defensive rebounding importance
  steals:    number // Steal importance
  blocks:    number // Block importance
  fouls:     number // Foul avoidance penalty importance (higher → more penalizes fouls)
}

// 2-endpoint coefficients: Guard (position 1 = PG) and Big (position 5 = C)
export type PositionCoefficients = Record<ModelGroupPosition, ModelCoefficients>

export interface EvaluationModel {
  id: string
  name: string
  description: string
  coefficients: PositionCoefficients
  isPreset?: boolean // preset templates are read-only
  createdAt: string // ISO date string
}

// ─────────────────────────────────────────────────────────────────────────────
// Roster Scenario (also called "Team")
// ─────────────────────────────────────────────────────────────────────────────
export interface RosterSlot {
  index: number
  position: Position
  playerId: string | null
  isReturnerSlot: boolean
}

// Free-form roster groups used by the Roster canvas (separate from position slots)
export interface RosterGroupEntry {
  id: 'guards' | 'wings' | 'bigs' | 'flex'
  label: string
  playerIds: string[]
}

/** Confidence interval for a player's projected minutes */
export interface MinuteRange {
  min: number  // 0–40
  max: number  // 0–40, expected = (min + max) / 2
}

export interface RosterScenario {
  id: string
  name: string
  slots: RosterSlot[]
  budget: number // in whole dollars, default 5_000_000
  createdAt: string
  // Per-team state — seam: post-beta from DB
  boardGroups: BoardGroup[]
  watchlistIds: string[]
  nilDeals: Record<string, NilDeal>
  playerMinutes: Record<string, MinuteRange> // playerId → [min, max] range; expected = (min+max)/2
  rosterGroups: RosterGroupEntry[]      // free-form canvas groups (Guards/Wings/Bigs/Flex)
}

// ─────────────────────────────────────────────────────────────────────────────
// Board
// ─────────────────────────────────────────────────────────────────────────────
export interface BoardGroup {
  id: string // 'overall' | 'PG' | 'SG' | 'SF' | 'PF' | 'C' | custom
  name: string
  playerIds: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// NIL
// ─────────────────────────────────────────────────────────────────────────────
export interface NilDeal {
  playerId: string
  scenarioId: string
  status: NilDealStatus
  offerAmount: number // whole dollars
  notes: string
  justification: string // coach's valuation rationale
}

export interface BudgetState {
  total: number
  committed: number // sum of signed deals
  targeted: number // sum of targeted/offered/negotiating deals
  remaining: number // total - committed - targeted
}

// ─────────────────────────────────────────────────────────────────────────────
// NIL Market Data
// ─────────────────────────────────────────────────────────────────────────────
export interface PositionTierRates {
  tier1: [number, number] // fit score 80+
  tier2: [number, number] // fit score 60–79
  tier3: [number, number] // fit score <60
}

export interface ConferenceBenchmark {
  conference: string
  averageSpend: number
  range: [number, number]
}

export interface MarketTrend {
  direction: 'up' | 'down' | 'flat'
  pct: number
  note: string
}

export interface NilMarketData {
  rates: Record<Position, PositionTierRates>
  conferenceBenchmarks: ConferenceBenchmark[]
  marketTrend: MarketTrend
}

// ─────────────────────────────────────────────────────────────────────────────
// Conference Schedule
// ─────────────────────────────────────────────────────────────────────────────
export interface ConferenceGame {
  id: string
  opponent: string
  location: 'home' | 'away' | 'neutral'
  date: string // ISO date string
  opponentStrength: number // 0–1
  opponentRecord: string // e.g. '14-8'
}

// ─────────────────────────────────────────────────────────────────────────────
// Conference Predictor Output
// ─────────────────────────────────────────────────────────────────────────────
export interface GamePrediction {
  game: ConferenceGame
  winProbability: number // 0–1
  confidenceInterval: [number, number] // [P25, P75] as 0–1
}

export interface ConferencePrediction {
  games: GamePrediction[]
  projectedWins: number
  projectedRecord: string // e.g. '11-7'
  winsDistribution: number[] // histogram of win counts across simulations, index = wins
  swingGames: GamePrediction[] // 3 closest-to-50% games
}

// ─────────────────────────────────────────────────────────────────────────────
// Projections Output
// ─────────────────────────────────────────────────────────────────────────────
export interface ProjectedTeamStats {
  ppg: number
  rpg: number
  apg: number
  fgPct: number
  fg3Pct: number
  efgPct: number
  ortg: number
  drtg: number
  netRating: number
  pace: number
  // Radar chart axes (0–100 relative scale)
  scoring: number
  rebounding: number
  playmaking: number
  shooting3pt: number
  defense: number
  efficiency: number
  // Conference averages for comparison
  conferenceAvg: {
    ppg: number
    rpg: number
    apg: number
    fgPct: number
    fg3Pct: number
    efgPct: number
    ortg: number
    drtg: number
    netRating: number
    pace: number
    scoring: number
    rebounding: number
    playmaking: number
    shooting3pt: number
    defense: number
    efficiency: number
  }
  // Last year's team stats for comparison
  lastYearStats: {
    ppg: number
    rpg: number
    apg: number
    fgPct: number
    fg3Pct: number
    efgPct: number
    ortg: number
    drtg: number
    netRating: number
    pace: number
    scoring: number
    rebounding: number
    playmaking: number
    shooting3pt: number
    defense: number
    efficiency: number
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Explore / Search
// ─────────────────────────────────────────────────────────────────────────────
export interface StatRange {
  min: number
  max: number
}

// A custom slider filter the coach can add/remove
export interface CustomStatSlider {
  id: string
  statKey: keyof Omit<PlayerStats, 'season'>
  label: string
  min: number
  max: number
  step: number
  range: StatRange
}

export interface FilterState {
  positions: Position[]
  conferences: string[]
  classYears: ClassYear[]
  portalStatuses: PipelineStatus[]
  ppgRange: StatRange
  fg3PctRange: StatRange
  efgPctRange: StatRange
  heightRange: StatRange // in inches; 60=5'0", 96=8'0"
  minEligibility: number
  minFitScore: number
  customSliders: CustomStatSlider[]
}

export const DEFAULT_FILTER_STATE: FilterState = {
  positions: [],
  conferences: [],
  classYears: [],
  portalStatuses: [],
  ppgRange: { min: 0, max: 30 },
  fg3PctRange: { min: 0, max: 50 },
  efgPctRange: { min: 40, max: 70 },
  heightRange: { min: 60, max: 96 },
  minEligibility: 1,
  minFitScore: 0,
  customSliders: [],
}

// ─────────────────────────────────────────────────────────────────────────────
// Side Panel — Film tab is last
// ─────────────────────────────────────────────────────────────────────────────
export type SidePanelTab = 'stats' | 'notes' | 'fit' | 'film'

export interface SidePanelState {
  isOpen: boolean
  playerId: string | null
  activeTab: SidePanelTab
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'warning' | 'info' | 'error'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

// ─────────────────────────────────────────────────────────────────────────────
// ML Prediction — result from the XGBoost stat predictor
// ─────────────────────────────────────────────────────────────────────────────
export interface MLPrediction {
  player_id: string
  projected_mpg: number
  // Scoring
  points: number
  fg_made: number
  fg_attempted: number
  fg_pct: number           // decimal 0–1
  fg3_made: number
  fg3_attempted: number
  fg3_pct: number          // decimal 0–1
  fg2_made: number
  fg2_attempted: number
  fg2_pct: number          // decimal 0–1
  ft_made: number
  ft_attempted: number
  ft_pct: number           // decimal 0–1
  // Playmaking
  assists: number
  turnovers: number
  // Rebounding
  offensive_rebounds: number
  defensive_rebounds: number
  total_rebounds: number
  // Defense
  steals: number
  blocks: number
  fouls: number
  // Efficiency
  shooting_efficiency: number
  scoring_efficiency: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Conference Prediction — result from the BPM-based backend predictor
// ─────────────────────────────────────────────────────────────────────────────
export interface ConferencePredictResult {
  win_probabilities: Record<string, number>  // opponent name -> win probability (0–1)
  monte_carlo: {
    distribution: Record<string, number>     // wins (as string key) -> simulation count
    most_likely_wins: number
    simulations: number
    max_possible_wins: number
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Team Context — KenPom-style stats returned by /api/team-context/{team}
// ─────────────────────────────────────────────────────────────────────────────
export interface TeamSeasonStats {
  team: string
  conference: string
  games: number
  wins: number
  adj_oe: number        // Adjusted offensive efficiency (pts per 100 poss)
  adj_de: number        // Adjusted defensive efficiency (pts allowed per 100 poss)
  net_rating: number    // adj_oe - adj_de
  barthag: number       // Power rating: probability of beating avg D1 team (0–1)
  efg_o: number         // Effective FG% offense (0–100)
  efg_d: number         // Effective FG% allowed defense (0–100)
  tor: number           // Turnover rate % offense
  tord: number          // Turnover rate % forced (defense)
  orb: number           // Offensive rebound %
  drb: number           // Defensive rebound %
  ftr: number           // Free throw rate offense (FTA/FGA × 100)
  ftrd: number          // Free throw rate allowed (FTA/FGA × 100)
  two_p_o: number       // 2P% offense (0–100)
  two_p_d: number       // 2P% allowed defense (0–100)
  three_p_o: number     // 3P% offense (0–100)
  three_p_d: number     // 3P% allowed defense (0–100)
  adj_t: number         // Adjusted tempo (possessions per 40 min)
  wab: number           // Wins above bubble
  conference_rank: number
  conference_size: number
}

export interface TeamContext {
  team: TeamSeasonStats
  conference_avg: TeamSeasonStats
  conference_standings: Array<{ team: string; net_rating: number }>
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth (stub — post-beta replaced with Clerk)
// ─────────────────────────────────────────────────────────────────────────────
export interface AuthUser {
  name: string
  role: 'head_coach' | 'assistant_coach' | 'analyst'
  school: string
  conference: string
  dataView: 'mens' | 'womens'
}

export interface AuthState {
  user: AuthUser
  isLoaded: boolean
}
