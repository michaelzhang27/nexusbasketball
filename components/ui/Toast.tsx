'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Toast, ToastType } from '@/types'

// ── Context ───────────────────────────────────────────────────────────────────
interface ToastContextValue {
  show: (message: string, type?: ToastType) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────
function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const toast: Toast = { id, message, type }

    setToasts(prev => {
      const next = [...prev, toast]
      return next.slice(-5) // max 5 toasts
    })

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Toaster toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </ToastContext.Provider>
  )
}

// ── Toaster (renderer) ────────────────────────────────────────────────────────
interface ToasterProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

function Toaster({ toasts, onDismiss }: ToasterProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// ── Individual toast ──────────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const Icon = {
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
    error: AlertCircle,
  }[toast.type]

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl',
        'bg-[#1a1e24] border min-w-[280px] max-w-[360px]',
        'animate-toast-in',
        toast.type === 'success' && 'border-green-700/50',
        toast.type === 'warning' && 'border-amber-700/50',
        toast.type === 'info'    && 'border-blue-700/50',
        toast.type === 'error'   && 'border-red-700/50',
      )}
    >
      <Icon
        className={cn(
          'w-4 h-4 shrink-0',
          toast.type === 'success' && 'text-green-400',
          toast.type === 'warning' && 'text-amber-400',
          toast.type === 'info'    && 'text-blue-400',
          toast.type === 'error'   && 'text-red-400',
        )}
      />
      <span className="text-sm text-gray-200 flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-500 hover:text-gray-300 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export { ToastProvider, Toaster }
