import { AREA, CAR, CBD_PARKING } from "../data";
import type { GameState, Rng, TravelMode } from "../types";
import { addMoodlet, advance, canAfford, checkBody, clamp, isRushHour, log, pay, placeOf, progress, triggerEvent } from "./core";

const DISTANCE_KM = 0.4;
const LOCAL_WALK = 8;

const MODES: Record<Exclude<TravelMode, "car">, { label: string; emoji: string; kmh: number; rushKmh: number; wait: number; base: number; perKm: number }> = {
  walk: { label: "Walk", emoji: "🚶🏾", kmh: 5, rushKmh: 5, wait: 0, base: 0, perKm: 0 },
  matatu: { label: "Matatu", emoji: "🚐", kmh: 20, rushKmh: 10, wait: 12, base: 40, perKm: 4 },
  boda: { label: "Boda boda", emoji: "🏍️", kmh: 28, rushKmh: 24, wait: 3, base: 50, perKm: 25 },
  cab: { label: "Cab", emoji: "🚕", kmh: 32, rushKmh: 12, wait: 6, base: 200, perKm: 55 },
};

export function travelModes(s: GameState) {
  const modes: { id: TravelMode; label: string; emoji: string }[] = Object.entries(MODES).map(([id, m]) => ({ id: id as TravelMode, label: m.label, emoji: m.emoji }));
  if (s.carId) modes.push({ id: "car", label: CAR[s.carId].name, emoji: CAR[s.carId].emoji });
  return modes;
}

export const cityOf = (area: string) => AREA[area]?.city ?? "nairobi";

export interface Quote {
  km: number;
  minutes: number;
  fare: number;
  rush: boolean;
  energy: number;
  local: boolean;
  /** Set when road travel can't get you there at all. */
  blocked?: string;
}

export function quote(s: GameState, dest: string, mode: TravelMode): Quote {
  const a = placeOf(s);
  const b = placeOf(s, dest);
  const rush = isRushHour(s.time);
  if (cityOf(a.area) !== cityOf(b.area)) return { km: 0, minutes: 0, fare: Infinity, rush, energy: 0, local: false, blocked: cityOf(a.area) === "nairobi" ? "Fly from JKIA or take the SGR" : "Fly or take the train back" };
  if (a.area === b.area) return { km: 0.5, minutes: LOCAL_WALK, fare: 0, rush, energy: 1, local: true };
  const km = Math.hypot(a.x - b.x, a.y - b.y) * DISTANCE_KM;
  if (mode === "car") {
    const car = s.carId ? CAR[s.carId] : null;
    if (!car) return { km, minutes: 0, fare: Infinity, rush, energy: 0, local: false };
    const minutes = Math.max(5, Math.round(2 + (km / (rush ? 13 : car.kmh)) * 60));
    const fare = Math.round(km * car.perKm + (b.area === "cbd" ? CBD_PARKING : 0));
    return { km, minutes, fare, rush, energy: 0, local: false };
  }
  const m = MODES[mode];
  const minutes = Math.max(5, Math.round(m.wait + (km / (rush ? m.rushKmh : m.kmh)) * 60));
  let fare = mode === "walk" ? 0 : (m.base + km * m.perKm) * (rush && mode === "matatu" ? 1.5 : 1);
  if (mode === "matatu" && s.policies.includes("fareCap")) fare *= 0.7;
  if (mode === "boda" && s.policies.includes("fareCap")) fare *= 0.9;
  return { km, minutes, fare: Math.round(fare / 10) * 10, rush, energy: mode === "walk" ? Math.round(km * 2.5) : 0, local: false };
}

const EVENT_CHANCE: Record<TravelMode, number> = { walk: 0.1, matatu: 0.3, boda: 0.15, cab: 0.1, car: 0.12 };

export function travel(state: GameState, dest: string, mode: TravelMode, rng: Rng = Math.random): GameState {
  if (state.event || dest === state.location) return state;
  if (mode === "car" && !state.carId) return state;
  const q = quote(state, dest, mode);
  if (q.blocked || !canAfford(state, q.fare)) return state;
  const s = structuredClone(state);
  pay(s, q.fare);
  s.needs.energy = clamp(s.needs.energy - q.energy);
  advance(s, q.minutes, rng);
  s.location = dest;
  const to = placeOf(s);
  if (q.local) {
    log(s, `🚶🏾 Walked over to ${to.name}.`);
  } else {
    const label = mode === "car" ? CAR[s.carId!].name : MODES[mode].label;
    const emoji = mode === "car" ? CAR[s.carId!].emoji : MODES[mode].emoji;
    log(s, `${emoji} ${label} to ${to.name} (${q.minutes} min${q.fare ? `, KSh ${q.fare.toLocaleString()}` : ""}).`);
    if (mode === "cab") addMoodlet(s, "acRide");
    if (mode === "car") addMoodlet(s, CAR[s.carId!].price >= 7_000_000 ? "bigRide" : "acRide");
    if (mode === "boda" && rng() < 0.3) addMoodlet(s, "bodaThrill");
    if (q.rush && (mode === "matatu" || mode === "cab" || mode === "car")) addMoodlet(s, "traffic");
    if (rng() < EVENT_CHANCE[mode]) triggerEvent(s, `travel:${mode}`, rng);
    else if (rng() < 0.15) triggerEvent(s, `arrive:${to.area}`, rng);
  }
  checkBody(s, rng);
  progress(s, { venue: dest === "home" ? undefined : dest, area: to.area });
  return s;
}
