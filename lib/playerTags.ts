import type { Player } from '@/types'

export interface PlayerTag {
  label: string
  color: string  // tailwind classes
  description: string
}

type TagDef = PlayerTag & { test: (p: Player) => boolean; excludes?: string[] }

// ── Tag definitions in priority order ────────────────────────────────────────
// Combo tags first — so they supersede their component single-trait tags.

const TAG_DEFS: TagDef[] = [
  // ── Combo ──────────────────────────────────────────────────────────────────
  {
    label: '3&D',
    color: 'bg-violet-900/50 text-violet-300 border-violet-700/50',
    description: '34%+ from three with 1.0+ steals or 0.8+ blocks per game',
    test: p =>
      p.fg3Pct >= 34 &&
      (p.fg3mPerGame ?? 0) >= 1.2 &&
      (p.spg >= 1.0 || p.bpg >= 0.8),
  },
  {
    label: 'Stretch Big',
    color: 'bg-violet-900/50 text-violet-300 border-violet-700/50',
    description: 'Big who spaces the floor — 32%+ from three on meaningful volume',
    test: p =>
      (p.position === 'PF' || p.position === 'C') &&
      p.fg3Pct >= 32 &&
      (p.fg3mPerGame ?? 0) >= 0.8,
  },
  {
    label: 'Two-Way',
    color: 'bg-violet-900/50 text-violet-300 border-violet-700/50',
    description: 'Contributes on both ends — 1.1+ steals and 0.8+ blocks per game',
    test: p => p.spg >= 1.1 && p.bpg >= 0.8,
  },

  // ── Scoring ────────────────────────────────────────────────────────────────
  {
    label: 'Elite Scorer',
    color: 'bg-green-900/50 text-green-300 border-green-700/50',
    description: '18+ points per game',
    excludes: ['Scorer'],
    test: p => p.ppg >= 18,
  },
  {
    label: 'Scorer',
    color: 'bg-green-900/50 text-green-300 border-green-700/50',
    description: '13+ points per game',
    test: p => p.ppg >= 13,
  },
  {
    label: 'High Usage',
    color: 'bg-green-900/50 text-green-300 border-green-700/50',
    description: '28%+ usage rate — primary offensive option on their team',
    test: p => p.usagePct >= 28,
  },
  {
    label: 'Efficient Scorer',
    color: 'bg-green-900/50 text-green-300 border-green-700/50',
    description: '60%+ true shooting on 10+ points per game',
    test: p => p.tsPct >= 60 && p.ppg >= 10,
  },

  // ── Shooting ───────────────────────────────────────────────────────────────
  {
    label: 'Sharpshooter',
    color: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
    description: '38%+ from three on 1.5+ attempts per game',
    excludes: ['3-Point Threat'],
    test: p => p.fg3Pct >= 38 && (p.fg3mPerGame ?? 0) >= 1.5,
  },
  {
    label: '3-Point Threat',
    color: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
    description: '34%+ from three on 1.2+ attempts per game',
    test: p => p.fg3Pct >= 34 && (p.fg3mPerGame ?? 0) >= 1.2,
  },
  {
    label: 'FT Marksman',
    color: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
    description: '80%+ from the free-throw line on 2.5+ attempts per game',
    test: p => p.ftPct >= 80 && (p.ftaPerGame ?? 0) >= 2.5,
  },

  // ── Defense ────────────────────────────────────────────────────────────────
  {
    label: 'Rim Protector',
    color: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
    description: '1.5+ blocks per game',
    test: p => p.bpg >= 1.5,
  },
  {
    label: 'Disruptor',
    color: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
    description: '1.2+ steals per game',
    test: p => p.spg >= 1.2,
  },

  // ── Rebounding ─────────────────────────────────────────────────────────────
  {
    label: 'Glass Eater',
    color: 'bg-orange-900/50 text-orange-300 border-orange-700/50',
    description: '8+ rebounds per game',
    excludes: ['Rebounder'],
    test: p => p.rpg >= 8,
  },
  {
    label: 'Rebounder',
    color: 'bg-orange-900/50 text-orange-300 border-orange-700/50',
    description: '6+ rebounds per game',
    test: p => p.rpg >= 6,
  },
  {
    label: 'O-Board Threat',
    color: 'bg-orange-900/50 text-orange-300 border-orange-700/50',
    description: '2.0+ offensive rebounds per game',
    test: p => (p.orebPerGame ?? 0) >= 2.0,
  },

  // ── Playmaking ─────────────────────────────────────────────────────────────
  {
    label: 'Floor General',
    color: 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50',
    description: '5.5+ assists per game',
    excludes: ['Playmaker'],
    test: p => p.apg >= 5.5,
  },
  {
    label: 'Playmaker',
    color: 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50',
    description: '4.0+ assists per game',
    test: p => p.apg >= 4.0,
  },
]

const MAX_TAGS = 3

export function getPlayerTags(player: Player): PlayerTag[] {
  const tags: PlayerTag[] = []
  const blocked = new Set<string>()
  for (const { test, excludes, ...tag } of TAG_DEFS) {
    if (tags.length >= MAX_TAGS) break
    if (blocked.has(tag.label)) continue
    if (test(player)) {
      tags.push(tag)
      excludes?.forEach(label => blocked.add(label))
    }
  }
  return tags
}
