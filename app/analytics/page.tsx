'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8005'
const SESSION_KEY = 'nexus_analytics_auth'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserActivity {
  scenario_count: number
  total_budget: number
  total_committed: number
  total_targeted: number
  nil_deal_count: number
  note_count: number
  prediction_count: number
  projection_count: number
}

interface UserScenario {
  id: string
  name: string
  budget: number
  nil_deal_count: number
  committed: number
  targeted: number
  created_at: string
}

interface UserDetail {
  id: string
  email: string
  name: string
  school: string
  conference: string
  team_name: string
  created_at: string
  activity: UserActivity
  scenarios: UserScenario[]
}

interface AccountBudget {
  user_id: string
  name: string
  email: string
  school: string
  team_name: string
  scenario_name: string
  budget: number
  committed: number
  targeted: number
  remaining: number
}

interface NilEntry {
  school: string
  scenario: string
  amount: number
  status: string
}

interface NilPlayerData {
  player_name: string
  entries: NilEntry[]
}

interface AnalyticsData {
  user_count: number
  roster_count: number
  users_by_school: Record<string, number>
  users_by_conference: Record<string, number>
  user_details: UserDetail[]
  nil_by_player: Record<string, NilPlayerData>
  account_budgets: AccountBudget[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

const STATUS_COLORS: Record<string, string> = {
  signed:       'text-green-400 bg-green-900/30 border-green-700/40',
  negotiating:  'text-blue-400 bg-blue-900/30 border-blue-700/40',
  offered:      'text-amber-400 bg-amber-900/30 border-amber-700/40',
  targeted:     'text-purple-400 bg-purple-900/30 border-purple-700/40',
  not_targeted: 'text-gray-500 bg-white/5 border-white/10',
}

// ── Password gate ─────────────────────────────────────────────────────────────

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value === 'courtexai') {
      sessionStorage.setItem(SESSION_KEY, '1')
      onUnlock()
    } else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1114] flex items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <p className="text-xs text-blue-400 uppercase tracking-widest font-semibold mb-1">Nexus Analytics</p>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Enter the admin password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={value}
            onChange={e => { setValue(e.target.value); setError(false) }}
            placeholder="Password"
            autoFocus
            className={`w-full bg-[#1a1e24] border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors`}
          />
          {error && <p className="text-xs text-red-400">Incorrect password.</p>}
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#14171c] border border-white/10 rounded-xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-bold text-white font-mono">{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  )
}

// ── User detail modal ─────────────────────────────────────────────────────────

function UserModal({ user, onClose }: { user: UserDetail; onClose: () => void }) {
  const a = user.activity
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#14171c] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/10">
          <div>
            <p className="text-base font-semibold text-white">{user.name || '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
            <p className="text-xs text-gray-600 mt-0.5">{user.team_name || '—'} · {user.conference} · Joined {formatDate(user.created_at)}</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Activity summary */}
        <div className="p-5 border-b border-white/10">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Activity</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Rosters', value: a.scenario_count || 1 },
              { label: 'NIL Deals', value: a.nil_deal_count },
              { label: 'Roster Predictions', value: a.prediction_count },
              { label: 'Player Projections', value: a.projection_count },
              { label: 'Player Notes', value: a.note_count },
              { label: 'Total Budget', value: fmt(a.total_budget || 5_000_000) },
              { label: 'Committed NIL', value: fmt(a.total_committed) },
            ].map(item => (
              <div key={item.label} className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-lg font-bold text-white font-mono">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scenarios */}
        <div className="p-5">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Saved Rosters</p>
          {user.scenarios.length === 0 ? (
            <p className="text-xs text-gray-600">Using default roster only (not yet saved to cloud)</p>
          ) : (
            <div className="space-y-2">
              {user.scenarios.map(s => {
                const used = s.committed + s.targeted
                const pct = s.budget > 0 ? Math.min(100, (used / s.budget) * 100) : 0
                return (
                  <div key={s.id} className="bg-white/5 rounded-xl px-4 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{s.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.nil_deal_count} active NIL deals · Created {formatDate(s.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-xs font-mono text-gray-400">{fmt(s.budget)} budget</p>
                      <p className="text-xs font-mono text-green-400">{fmt(s.committed)} signed</p>
                    </div>
                    <div className="w-16">
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5 text-right">{Math.round(pct)}% used</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'users' | 'nil' | 'budgets'>('users')
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/analytics`, {
          headers: { 'X-Analytics-Key': 'courtexai' },
        })
        if (!res.ok) throw new Error('Failed to load analytics')
        setData(await res.json())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1114] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading analytics…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f1114] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-red-400">{error ?? 'Failed to load data'}</p>
          <p className="text-xs text-gray-600">Make sure the backend is running.</p>
        </div>
      </div>
    )
  }

  const totalCommitted = data.account_budgets.reduce((s, b) => s + b.committed, 0)
  const totalTargeted  = data.account_budgets.reduce((s, b) => s + b.targeted, 0)
  const totalBudget    = data.account_budgets.reduce((s, b) => s + b.budget, 0)

  // Top players by total offer amount
  const playerTotals = Object.entries(data.nil_by_player)
    .map(([id, playerData]) => ({
      id,
      name: playerData.player_name,
      entries: playerData.entries,
      total: playerData.entries.reduce((s, e) => s + e.amount, 0),
      topSchool: [...playerData.entries].sort((a, b) => b.amount - a.amount)[0]?.school ?? '—',
      offerCount: playerData.entries.filter(e => e.status !== 'not_targeted').length,
    }))
    .filter(p => p.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 30)

  const TABS = [
    { id: 'users', label: 'Users' },
    { id: 'nil', label: 'NIL Activity' },
    { id: 'budgets', label: 'Account Budgets' },
  ] as const

  return (
    <div className="min-h-screen bg-[#0f1114] text-white">
      {selectedUser && (
        <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}

      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-blue-400 uppercase tracking-widest font-semibold">Nexus Analytics</p>
          <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem(SESSION_KEY); window.location.reload() }}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Lock
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={data.user_count} sub={`${Object.keys(data.users_by_school).filter(s => s !== 'Unknown').length} schools`} />
          <StatCard label="Total Rosters" value={data.roster_count} sub="incl. default rosters" />
          <StatCard label="Total Committed NIL" value={fmt(totalCommitted)} sub="signed deals" />
          <StatCard label="Total Budget Allocated" value={fmt(totalBudget)} sub={`${fmt(totalTargeted)} targeted`} />
        </div>

        {/* School breakdown + conference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#14171c] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Users by School</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(data.users_by_school).map(([school, count]) => (
                <div key={school} className="flex items-center justify-between">
                  <span className="text-sm text-white truncate pr-3">{school}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(count / data.user_count) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-gray-400 w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#14171c] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Users by Conference</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(data.users_by_conference).map(([conf, count]) => (
                <div key={conf} className="flex items-center justify-between">
                  <span className="text-sm text-white truncate pr-3">{conf}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(count / data.user_count) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-gray-400 w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 mb-4 border-b border-white/10">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </button>
            ))}
          </div>

          {/* Users tab */}
          {activeTab === 'users' && (
            <div className="bg-[#14171c] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-xs text-gray-500">Click a row to see full account detail</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500">
                      <th className="text-left px-4 py-3 font-medium">Name</th>
                      <th className="text-left px-4 py-3 font-medium">Email</th>
                      <th className="text-left px-4 py-3 font-medium">School</th>
                      <th className="text-left px-4 py-3 font-medium">Conference</th>
                      <th className="text-right px-4 py-3 font-medium">Rosters</th>
                      <th className="text-right px-4 py-3 font-medium">NIL Deals</th>
                      <th className="text-right px-4 py-3 font-medium">Predictions</th>
                      <th className="text-right px-4 py-3 font-medium">Projections</th>
                      <th className="text-right px-4 py-3 font-medium">Notes</th>
                      <th className="text-left px-4 py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.user_details.map(u => (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-white font-medium">{u.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{u.email}</td>
                        <td className="px-4 py-3 text-gray-300">{u.school}</td>
                        <td className="px-4 py-3 text-gray-500">{u.conference}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-300">{u.activity.scenario_count || 1}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-300">{u.activity.nil_deal_count}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-300">{u.activity.prediction_count}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-300">{u.activity.projection_count}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-300">{u.activity.note_count}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(u.created_at)}</td>
                      </tr>
                    ))}
                    {data.user_details.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-gray-600">No users yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NIL activity tab */}
          {activeTab === 'nil' && (
            <div className="space-y-4">
              {playerTotals.length === 0 ? (
                <div className="text-center py-12 text-gray-600 text-sm">No NIL deal activity yet</div>
              ) : (
                <div className="bg-[#14171c] border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-xs text-gray-500">Top players by total offer value across all accounts</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-500">
                          <th className="text-left px-4 py-3 font-medium">Player</th>
                          <th className="text-left px-4 py-3 font-medium">Offers</th>
                          <th className="text-left px-4 py-3 font-medium">Top School</th>
                          <th className="text-right px-4 py-3 font-medium">Total Value</th>
                          <th className="text-left px-4 py-3 font-medium">Breakdown</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerTotals.map(p => (
                          <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-white font-medium">{p.name || '—'}</p>
                              <p className="text-gray-600 font-mono text-[10px]">{p.id}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-300">{p.offerCount}</td>
                            <td className="px-4 py-3 text-white">{p.topSchool}</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-green-400">{fmt(p.total)}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {p.entries.filter(e => e.amount > 0).slice(0, 4).map((e, i) => (
                                  <span
                                    key={i}
                                    className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[e.status] ?? STATUS_COLORS.not_targeted}`}
                                  >
                                    {e.school}: {fmt(e.amount)}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account budgets tab */}
          {activeTab === 'budgets' && (
            <div className="bg-[#14171c] border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500">
                      <th className="text-left px-4 py-3 font-medium">Name</th>
                      <th className="text-left px-4 py-3 font-medium">Email</th>
                      <th className="text-left px-4 py-3 font-medium">School</th>
                      <th className="text-left px-4 py-3 font-medium">Scenario</th>
                      <th className="text-right px-4 py-3 font-medium">Budget</th>
                      <th className="text-right px-4 py-3 font-medium">Committed</th>
                      <th className="text-right px-4 py-3 font-medium">Targeted</th>
                      <th className="text-right px-4 py-3 font-medium">Remaining</th>
                      <th className="px-4 py-3 font-medium">Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.account_budgets
                      .filter(b => b.budget > 0)
                      .sort((a, b) => b.budget - a.budget)
                      .map((b, i) => {
                        const used = b.committed + b.targeted
                        const pct = b.budget > 0 ? Math.min(100, (used / b.budget) * 100) : 0
                        return (
                          <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                            <td className="px-4 py-3 text-white font-medium">{b.name || '—'}</td>
                            <td className="px-4 py-3 text-gray-500">{b.email}</td>
                            <td className="px-4 py-3 text-gray-300">{b.school}</td>
                            <td className="px-4 py-3 text-gray-400">{b.scenario_name}</td>
                            <td className="px-4 py-3 text-right font-mono text-gray-300">{fmt(b.budget)}</td>
                            <td className="px-4 py-3 text-right font-mono text-green-400">{fmt(b.committed)}</td>
                            <td className="px-4 py-3 text-right font-mono text-amber-400">{fmt(b.targeted)}</td>
                            <td className="px-4 py-3 text-right font-mono text-gray-400">{fmt(b.remaining)}</td>
                            <td className="px-4 py-3">
                              <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    {data.account_budgets.filter(b => b.budget > 0).length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-gray-600">No budget data yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(SESSION_KEY) === '1')
    setChecking(false)
  }, [])

  if (checking) return null

  return unlocked
    ? <Dashboard />
    : <PasswordGate onUnlock={() => setUnlocked(true)} />
}
