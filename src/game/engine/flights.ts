import { AIRLINES, AIRPORT_OF, BOARDING_OPENS, CABINS, CHECKIN_CLOSES, CITY_NAME, CITY_OF_AIRPORT, GATE_CLOSES, LOUNGE_PASS, ROUTES, type Cabin, type CityKey } from "../data";
import type { GameState } from "../types";
import { DAY, addMoodlet, addNeeds, advance, canAfford, log, pay, price } from "./core";
import type { ActionImpl } from "./actions";

export type FlightStatus = "On time" | "Delayed" | "Check-in closed" | "Boarding" | "Gate closed";

export interface Departure {
  code: string;
  airline: string;
  to: CityKey;
  /** Absolute game minute of departure (after any delay). */
  dep: number;
  air: number;
  gate: number;
  fares: Record<Cabin, number>;
  status: FlightStatus;
  delayed: boolean;
}

const hash = (str: string) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** The next 24 hours of departures from the airport you're standing in. */
export function departures(s: GameState): Departure[] {
  const city = CITY_OF_AIRPORT[s.location];
  if (!city) return [];
  const dayStart = s.time - (s.time % DAY);
  const out: Departure[] = [];
  ROUTES.forEach((r, ri) => {
    if (r.from !== city) return;
    r.deps.forEach(([h, al], di) => {
      for (const offset of [0, 1]) {
        const airline = AIRLINES[al];
        const code = `${airline.code} ${100 + ri * 10 + di}`;
        const day = Math.floor((dayStart + offset * DAY) / DAY);
        // Roughly one flight in eight runs late; it's the same delay for everyone that day.
        const delayed = hash(`${code}${day}`) % 8 === 0;
        const dep = dayStart + offset * DAY + Math.round(h * 60) + (delayed ? 40 + (hash(code) % 4) * 15 : 0);
        if (dep < s.time - 30 || dep > s.time + DAY) continue;
        const left = dep - s.time;
        const status: FlightStatus = left < GATE_CLOSES ? "Gate closed" : left <= BOARDING_OPENS ? "Boarding" : left < CHECKIN_CLOSES ? "Check-in closed" : delayed ? "Delayed" : "On time";
        const fares = Object.fromEntries(CABINS.map((c) => [c.id, price(s, Math.round((r.fare * c.mult) / 50) * 50)])) as Record<Cabin, number>;
        out.push({ code, airline: airline.name, to: r.to, dep, air: r.air, gate: 1 + (hash(code) % 14), fares, status, delayed });
      }
    });
  });
  return out.sort((a, b) => a.dep - b.dep);
}

export const canBook = (d: Departure) => d.status === "On time" || d.status === "Delayed";

export function bookFlight(s: GameState, code: string, dep: number, cabin: Cabin): boolean {
  const f = departures(s).find((x) => x.code === code && x.dep === dep);
  if (!f || !canBook(f) || s.flight) return false;
  const fare = f.fares[cabin];
  if (!canAfford(s, fare)) return false;
  pay(s, fare);
  advance(s, 15, Math.random);
  s.flight = { from: s.location, to: f.to, dep: f.dep, air: f.air, code: f.code, airline: f.airline, gate: f.gate, cabin, fare };
  log(s, `🎫 Checked in on ${f.airline} ${f.code} to ${CITY_NAME[f.to]}. Gate ${f.gate}, boarding ${BOARDING_OPENS} min before take-off.`, "good");
  return true;
}

export function cancelFlight(s: GameState): boolean {
  if (!s.flight) return false;
  const refund = Math.round(s.flight.fare / 2);
  s.money += refund;
  log(s, `🎫 Ticket for ${s.flight.code} cancelled. KSh ${refund.toLocaleString()} refunded after fees.`);
  s.flight = null;
  return true;
}

/** Lounge, boarding and the departures board: things that depend on your ticket. */
export function airportActions(s: GameState): ActionImpl[] {
  const city = CITY_OF_AIRPORT[s.location];
  if (!city) return [];
  const list: ActionImpl[] = [
    { id: "departures", label: "Departures & check-in", emoji: "🛫", minutes: 0, cost: 0, section: "Airport", detail: s.flight ? `Your flight: ${s.flight.code}` : "Pick a flight and check in.", run: () => ({ action: "departures" }) },
  ];
  const business = s.flight?.from === s.location && s.flight.cabin === "business";
  const pass = business ? 0 : price(s, LOUNGE_PASS);
  const loungeName = { nairobi: "Simba Lounge", mombasa: "Pwani Lounge", kisumu: "Lakeview Lounge" }[city];
  const lounge = (id: string, label: string, emoji: string, minutes: number, needs: Parameters<typeof addNeeds>[1], text: string): ActionImpl => ({
    id, label, emoji, minutes, cost: pass, section: "Lounge",
    detail: business ? "Free with your business ticket." : `Day pass KSh ${pass.toLocaleString()}. Free when you fly business.`,
    disabled: canAfford(s, pass) ? undefined : "Can't afford",
    run: (d, rng) => {
      pay(d, pass);
      advance(d, minutes, rng);
      addNeeds(d, needs);
      addMoodlet(d, "jetSetter");
      log(d, `${emoji} ${text}`);
      return { action: id, tags: ["relax"], venue: d.location };
    },
  });
  list.push(
    lounge("loungeChill", `Chill in the ${loungeName}`, "🛋️", 60, { energy: 15, fun: 15, hygiene: 10 }, "Soft armchairs, free Wi-Fi, a quiet window over the apron."),
    lounge("loungeBuffet", "Lounge buffet", "🍽️", 45, { hunger: 60, fun: 10 }, "Samosas, pilau, fruit and as much chai as you want."),
  );
  const f = s.flight;
  if (f && f.from === s.location) {
    const opens = f.dep - BOARDING_OPENS;
    if (s.time < opens)
      list.push({
        id: "waitGate", label: `Wait at Gate ${f.gate}`, emoji: "⏳", minutes: opens - s.time, cost: 0, section: "Gate", detail: `Until boarding opens for ${f.code}.`,
        run: (d, rng) => {
          advance(d, opens - d.time, rng);
          log(d, `📢 "${f.airline} flight ${f.code} to ${CITY_NAME[f.to]} is now boarding at Gate ${f.gate}."`, "event");
        },
      });
    else
      list.push({
        id: "board", label: `Board ${f.code} to ${CITY_NAME[f.to]}`, emoji: "✈️", minutes: f.dep - s.time + f.air, cost: 0, section: "Gate",
        detail: `${f.cabin === "business" ? "Business" : "Economy"} · Gate ${f.gate} · ${f.air} min in the air`,
        run: (d, rng) => {
          // Clear the ticket first so passing time doesn't count it as missed.
          d.flight = null;
          advance(d, f.dep - d.time + f.air, rng);
          addNeeds(d, f.cabin === "business" ? { energy: 10, fun: 15, hunger: 25 } : { energy: -8, fun: 8, hunger: 5 });
          addMoodlet(d, "jetSetter");
          d.location = AIRPORT_OF[f.to];
          log(d, `✈️ ${f.code} touched down in ${CITY_NAME[f.to]}. ${f.to === "mombasa" ? "The heat hits you on the stairs." : f.to === "kisumu" ? "The lake glitters as you land." : "Karibu Kanairo. Grab a jacket."}`, "good");
          return { action: "fly", tags: ["travel"], venue: d.location };
        },
      });
  }
  return list;
}
