"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { dispatch, newGame, type Command, type NewLife } from "./engine";
import type { GameState } from "./types";

interface GameStore {
  game: GameState | null;
  start: (life: NewLife) => void;
  send: (cmd: Command) => void;
  /** Replace the local life with one from the cloud. */
  load: (game: GameState) => void;
  reset: () => void;
}

const safeStorage = createJSONStorage(() => ({
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
}));

export const useGame = create<GameStore>()(
  persist(
    (set) => ({
      game: null,
      start: (life) => set({ game: newGame(life) }),
      send: (cmd) => set((s) => (s.game ? { game: dispatch(s.game, cmd) } : s)),
      load: (game) => set({ game }),
      reset: () => set({ game: null }),
    }),
    {
      name: "nairobilife-save",
      version: 2,
      storage: safeStorage,
      skipHydration: true,
      // v1 saves predate the life-sim rewrite; start fresh.
      migrate: (persisted, version) => (version < 2 ? { game: null } : persisted) as GameStore,
    },
  ),
);
