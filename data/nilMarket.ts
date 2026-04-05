// ─────────────────────────────────────────────────────────────────────────────
// Nexus Analytics — NIL Market Rate Data
// Post-beta seam: replace with API call to NIL market data service.
// ─────────────────────────────────────────────────────────────────────────────
import type { NilMarketData } from '@/types'

export const NIL_MARKET_DATA: NilMarketData = {
  rates: {
    PG: {
      tier1: [350000, 600000], // fit score 80+
      tier2: [180000, 349000], // fit score 60–79
      tier3: [60000, 179000],  // fit score <60
    },
    SG: {
      tier1: [320000, 560000],
      tier2: [160000, 319000],
      tier3: [50000, 159000],
    },
    SF: {
      tier1: [300000, 520000],
      tier2: [150000, 299000],
      tier3: [45000, 149000],
    },
    PF: {
      tier1: [280000, 480000],
      tier2: [130000, 279000],
      tier3: [40000, 129000],
    },
    C: {
      tier1: [260000, 450000],
      tier2: [120000, 259000],
      tier3: [35000, 119000],
    },
  },
  conferenceBenchmarks: [
    { conference: 'SEC', averageSpend: 2_800_000, range: [1_800_000, 4_200_000] },
    { conference: 'Big Ten', averageSpend: 2_600_000, range: [1_600_000, 4_000_000] },
    { conference: 'Big 12', averageSpend: 2_400_000, range: [1_400_000, 3_800_000] },
    { conference: 'ACC', averageSpend: 2_200_000, range: [1_200_000, 3_600_000] },
    { conference: 'Big East', averageSpend: 2_000_000, range: [1_000_000, 3_200_000] },
    { conference: 'Mountain West', averageSpend: 1_200_000, range: [600_000, 2_000_000] },
    { conference: 'WCC', averageSpend: 1_000_000, range: [500_000, 1_800_000] },
    { conference: 'MCC (Your Program)', averageSpend: 800_000, range: [400_000, 1_400_000] },
  ],
  marketTrend: {
    direction: 'up',
    pct: 18,
    note: 'Transfer portal NIL spend up 18% YoY as programs compete for immediate contributors. Guard market especially competitive.',
  },
}
