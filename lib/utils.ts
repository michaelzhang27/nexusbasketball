import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Position } from '@/types'

// ── className utility ─────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ── Dollar formatting ─────────────────────────────────────────────────────────
export function formatDollar(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (n >= 1_000) {
    const k = n / 1_000
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}k`
  }
  return `$${n}`
}

// ── Percentage formatting ─────────────────────────────────────────────────────
export function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

// ── Record formatting ─────────────────────────────────────────────────────────
export function formatRecord(wins: number, losses: number): string {
  return `${Math.round(wins)}-${Math.round(losses)}`
}

// ── Player initials ───────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// ── Score clamping ────────────────────────────────────────────────────────────
export function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

// ── Position color (Tailwind bg class) ───────────────────────────────────────
export function positionColor(pos: Position): string {
  switch (pos) {
    case 'PG': return 'bg-blue-500'
    case 'SG': return 'bg-violet-500'
    case 'SF': return 'bg-emerald-500'
    case 'PF': return 'bg-amber-500'
    case 'C':  return 'bg-rose-500'
  }
}

// ── Position text color ───────────────────────────────────────────────────────
export function positionTextColor(pos: Position): string {
  switch (pos) {
    case 'PG': return 'text-blue-400'
    case 'SG': return 'text-violet-400'
    case 'SF': return 'text-emerald-400'
    case 'PF': return 'text-amber-400'
    case 'C':  return 'text-rose-400'
  }
}

// ── Ordinal suffix ────────────────────────────────────────────────────────────
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

// ── Date formatting ───────────────────────────────────────────────────────────
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Number rounding to nearest N ─────────────────────────────────────────────
export function roundToNearest(n: number, nearest: number): number {
  return Math.round(n / nearest) * nearest
}

// ── Sigmoid function (used in conference predictor) ───────────────────────────
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

// ── Height string → inches (e.g. "6'4\"" → 76) ───────────────────────────────
export function parseHeightInches(height: string): number {
  const match = height.match(/(\d+)'(\d+)"?/)
  if (!match) return 72 // default 6'0"
  return parseInt(match[1]) * 12 + parseInt(match[2])
}
