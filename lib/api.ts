// ─────────────────────────────────────────────────────────────────────────────
// Nexus Analytics — FastAPI client
// All user-data mutations (scenarios, notes, models) go through FastAPI so the
// backend remains the single source of truth and auth is enforced server-side.
// ─────────────────────────────────────────────────────────────────────────────

import type { RosterScenario, EvaluationModel } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8005'

// ── Shared fetch helper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

// ── User data bootstrap ───────────────────────────────────────────────────────

export interface UserCloudData {
  scenarios:    RosterScenario[]
  player_notes: Record<string, string[]>
  models:       EvaluationModel[]
}

/** Fetch all user data in one shot on app load. */
export async function fetchUserData(token: string): Promise<UserCloudData | null> {
  return apiFetch<UserCloudData>('/api/user/data', token)
}

// ── Scenarios ─────────────────────────────────────────────────────────────────

/** Upsert a scenario (create or update). */
export async function saveScenario(token: string, scenario: RosterScenario): Promise<boolean> {
  const result = await apiFetch<{ ok: boolean }>(
    `/api/user/scenarios/${scenario.id}`,
    token,
    { method: 'PUT', body: JSON.stringify(scenario) },
  )
  return result !== null
}

/** Delete a scenario by ID. */
export async function deleteScenario(token: string, scenarioId: string): Promise<boolean> {
  const result = await apiFetch<{ ok: boolean }>(
    `/api/user/scenarios/${scenarioId}`,
    token,
    { method: 'DELETE' },
  )
  return result !== null
}

// ── Player notes ──────────────────────────────────────────────────────────────

/** Save all notes for a single player. */
export async function savePlayerNotes(
  token: string,
  playerId: string,
  notes: string[],
): Promise<boolean> {
  const result = await apiFetch<{ ok: boolean }>(
    `/api/user/notes/${playerId}`,
    token,
    { method: 'PUT', body: JSON.stringify({ notes }) },
  )
  return result !== null
}

// ── Evaluation models ─────────────────────────────────────────────────────────

/** Upsert a custom evaluation model. */
export async function saveModel(token: string, model: EvaluationModel): Promise<boolean> {
  const result = await apiFetch<{ ok: boolean }>(
    `/api/user/models/${model.id}`,
    token,
    { method: 'PUT', body: JSON.stringify(model) },
  )
  return result !== null
}

/** Delete a custom evaluation model. */
export async function deleteModel(token: string, modelId: string): Promise<boolean> {
  const result = await apiFetch<{ ok: boolean }>(
    `/api/user/models/${modelId}`,
    token,
    { method: 'DELETE' },
  )
  return result !== null
}
