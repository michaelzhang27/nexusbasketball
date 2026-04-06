"use client";

import { useEffect } from "react";
import { useNexusStore } from "@/store";
import { getAccessToken } from "@/lib/auth";
import { fetchUserData, saveScenario } from "@/lib/api";
import { createClient } from "@/lib/supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8005";

/**
 * 1. Triggers Zustand persist rehydration from localStorage.
 * 2. Resolves the Supabase session to determine data_view (mens/womens),
 *    updates the store, then fetches the correct player set from the backend.
 * 3. If the user is authenticated, loads their cloud data (scenarios, notes, models).
 * Must be a client component rendered inside the layout.
 */
export function StoreHydration() {
  // Rehydrate from localStorage first so local state is available immediately.
  useEffect(() => {
    useNexusStore.persist.rehydrate();
  }, []);

  // Fetch players from backend — gender determined by the user's data_view.
  useEffect(() => {
    async function fetchPlayers() {
      try {
        // Supabase returns the cached session synchronously-fast; no visible delay.
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const dataView = (user?.user_metadata?.data_view ?? "mens") as "mens" | "womens";
        useNexusStore.getState().setDataView(dataView);

        const url = dataView === "womens"
          ? `${API_BASE}/api/players?gender=womens`
          : `${API_BASE}/api/players`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        useNexusStore.getState().setPlayers(data);
      } catch {
        console.warn(
          "Nexus API unavailable — start the backend with: uvicorn main:app --reload --port 8005",
        );
      }
    }
    fetchPlayers();
  }, []);

  // Load cloud user data after auth resolves.
  useEffect(() => {
    async function syncUserData() {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const data = await fetchUserData(token);
        if (data) {
          useNexusStore.getState().loadUserData(data);
        }
      } catch {
        // Not logged in or API unavailable — app works offline via localStorage.
      }
    }
    syncUserData();
  }, []);

  // Auto-save scenarios to Supabase whenever they change.
  // Debounced 2 s after the last mutation so rapid edits don't spam the backend.
  useEffect(() => {
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    const pendingIds = new Set<string>();

    const unsubscribe = useNexusStore.subscribe((state, prevState) => {
      if (state.scenarios === prevState.scenarios) return;

      for (const scenario of state.scenarios) {
        const prev = prevState.scenarios.find((p) => p.id === scenario.id);
        if (prev !== scenario) pendingIds.add(scenario.id);
      }

      if (pendingIds.size === 0) return;

      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        try {
          const token = await getAccessToken();
          if (!token) return;
          const ids = [...pendingIds];
          pendingIds.clear();
          const currentScenarios = useNexusStore.getState().scenarios;
          for (const id of ids) {
            const scenario = currentScenarios.find((s) => s.id === id);
            if (scenario) await saveScenario(token, scenario);
          }
        } catch {
          // Silent — localStorage is the fallback; auto-save failure is non-critical.
        }
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, []);

  return null;
}
