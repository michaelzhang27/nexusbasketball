'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Settings, User } from 'lucide-react'
import { useNexusStore } from '@/store'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useAuth, useSignOut } from '@/lib/auth'
import { getInitials, cn } from '@/lib/utils'

const TABS = [
  { href: '/board',   label: 'Board' },
  { href: '/explore', label: 'Explore' },
  { href: '/roster',  label: 'Roster' },
  { href: '/models',  label: 'Models' },
  { href: '/nil',     label: 'NIL' },
]

export function TopNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const signOut = useSignOut()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const scenarios = useNexusStore(s => s.scenarios)
  const activeScenarioId = useNexusStore(s => s.activeScenarioId)
  const setActiveScenario = useNexusStore(s => s.setActiveScenario)
  const createScenario = useNexusStore(s => s.createScenario)

  const models = useNexusStore(s => s.models)
  const activeModelId = useNexusStore(s => s.activeModelId)
  const setActiveModel = useNexusStore(s => s.setActiveModel)
  const activeModel = models.find(m => m.id === activeModelId)

  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  const scenarioOptions = [
    ...scenarios.map(s => ({ value: s.id, label: s.name })),
    { value: '__new__', label: '+ New team' },
  ]
  const modelOptions = models.map(m => ({ value: m.id, label: m.name }))

  function handleScenarioChange(value: string) {
    if (value === '__new__') {
      setNewTeamName('')
      setNameDialogOpen(true)
    } else {
      setActiveScenario(value)
    }
  }

  function handleCreateTeam() {
    const name = newTeamName.trim() || `Team ${scenarios.length + 1}`
    createScenario(name)
    setNameDialogOpen(false)
  }

  useEffect(() => {
    if (nameDialogOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 50)
    }
  }, [nameDialogOpen])

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <>
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#0f1114] border-b border-white/10 z-30 flex items-center px-4 gap-4">
      {/* Left: Wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-bold tracking-widest text-blue-400 text-sm uppercase">
          Nexus Analytics
        </span>
        <Badge variant="amber" className="text-[10px] px-1.5 py-0.5">BETA</Badge>
      </div>

      {/* Center: Tab navigation */}
      <nav className="flex-1 flex items-center justify-center gap-1">
        {TABS.map(tab => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'px-4 py-1.5 text-sm rounded-lg transition-colors relative',
                isActive
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Right: Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Team selector */}
        <Select
          value={activeScenarioId}
          onValueChange={handleScenarioChange}
          options={scenarioOptions}
          triggerClassName="text-xs py-1 px-2.5 min-w-[130px]"
        />

        {/* Model selector */}
        <Select
          value={activeModelId}
          onValueChange={setActiveModel}
          options={modelOptions}
          triggerClassName="text-xs py-1 px-2.5 min-w-[110px] text-blue-400"
        />

        {/* Coach avatar + profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            title={user.name}
          >
            {getInitials(user.name)}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1e24] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{user.school}</p>
                <p className="text-xs text-gray-600">{user.conference} · {user.role.replace('_', ' ')}</p>
              </div>

              {/* Active team + model */}
              <div className="px-4 py-2.5 border-b border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Active team</span>
                  <span className="text-xs text-white font-medium truncate max-w-[120px]">
                    {scenarios.find(s => s.id === activeScenarioId)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Model</span>
                  <span className="text-xs text-blue-400 font-medium truncate max-w-[120px]">
                    {activeModel?.name}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="py-1">
                <button className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-left">
                  <User className="w-3.5 h-3.5" />
                  Profile settings
                </button>
                <button className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-left">
                  <Settings className="w-3.5 h-3.5" />
                  Preferences
                </button>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* New team name dialog */}

    {nameDialogOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        onClick={e => { if (e.target === e.currentTarget) setNameDialogOpen(false) }}
      >
        <div className="bg-[#1a1e24] border border-white/10 rounded-xl shadow-2xl p-6 w-80">
          <h3 className="text-sm font-semibold text-white mb-4">Name your roster</h3>
          <input
            ref={nameInputRef}
            type="text"
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateTeam()
              if (e.key === 'Escape') setNameDialogOpen(false)
            }}
            placeholder={`Team ${scenarios.length + 1}`}
            className="w-full bg-[#0f1114] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 mb-4"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setNameDialogOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTeam}
              className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
