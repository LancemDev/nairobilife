"use client";

import { create } from "zustand";

export type Overlay = "map" | "phone" | "buy" | "departures" | null;
export type PhoneApp = "messages" | "contacts" | "watu" | "profile" | "houses" | "mpesa" | "benki" | "chakula" | "kazi" | "mali" | "ndege" | "siasa" | "gist";

export interface Ride {
  kind: import("@/world/RideScene").RideKind;
  title: string;
  from: string;
  to: string;
  minutes: number;
  /** What to dispatch when the ride ends (not when it's cancelled). */
  finish: import("@/game/engine").Command;
}

interface UiStore {
  ride: Ride | null;
  startRide: (ride: Ride | null) => void;
  overlay: Overlay;
  app: PhoneApp | null;
  /** Open conversation inside the Messages app. */
  chatWith: string | null;
  open: (overlay: Overlay) => void;
  /** Opens the phone on an app, optionally straight into a chat. */
  openApp: (app: PhoneApp | null, chatWith?: string | null) => void;
  setChat: (username: string | null) => void;
}

export const useUi = create<UiStore>()((set) => ({
  ride: null,
  startRide: (ride) => set({ ride, overlay: null }),
  overlay: null,
  app: null,
  chatWith: null,
  open: (overlay) => set({ overlay }),
  openApp: (app, chatWith = null) => set({ overlay: "phone", app, chatWith }),
  setChat: (chatWith) => set({ chatWith }),
}));
