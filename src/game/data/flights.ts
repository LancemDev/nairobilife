/** Domestic flights. Airlines are fictional; times repeat every day. */
export type CityKey = "nairobi" | "mombasa" | "kisumu";

export const AIRPORT_OF: Record<CityKey, string> = { nairobi: "jkia", mombasa: "moiAirport", kisumu: "kisumuAirport" };
export const CITY_OF_AIRPORT: Record<string, CityKey> = { jkia: "nairobi", moiAirport: "mombasa", kisumuAirport: "kisumu" };
export const CITY_NAME: Record<CityKey, string> = { nairobi: "Nairobi", mombasa: "Mombasa", kisumu: "Kisumu" };

export const AIRLINES = [
  { code: "TW", name: "Twiga Air" },
  { code: "SX", name: "Simba Express" },
  { code: "PW", name: "Pwani Wings" },
];

export interface Route {
  from: CityKey;
  to: CityKey;
  /** Minutes in the air. */
  air: number;
  fare: number;
  /** Departure hours each day, with the airline index. */
  deps: [number, number][];
}

export const ROUTES: Route[] = [
  { from: "nairobi", to: "mombasa", air: 60, fare: 6500, deps: [[6.5, 0], [9.25, 1], [12.67, 0], [16.08, 2], [19.33, 1]] },
  { from: "nairobi", to: "kisumu", air: 50, fare: 5500, deps: [[7.17, 1], [11.5, 0], [17.75, 2]] },
  { from: "mombasa", to: "nairobi", air: 60, fare: 6500, deps: [[8.33, 0], [11.25, 2], [15, 1], [18.5, 0], [21.17, 2]] },
  { from: "kisumu", to: "nairobi", air: 50, fare: 5500, deps: [[8.75, 0], [13.5, 1], [19.67, 2]] },
  { from: "mombasa", to: "kisumu", air: 85, fare: 9000, deps: [[10.5, 2]] },
  { from: "kisumu", to: "mombasa", air: 85, fare: 9000, deps: [[14.25, 2]] },
];

export const CABINS = [
  { id: "economy", label: "Economy", mult: 1 },
  { id: "business", label: "Business", mult: 2.6 },
] as const;
export type Cabin = (typeof CABINS)[number]["id"];

/** Minutes before departure: booking/check-in closes, boarding opens, the gate closes. */
export const CHECKIN_CLOSES = 40;
export const BOARDING_OPENS = 45;
export const GATE_CLOSES = 10;
/** A business ticket gets you into the lounge free; everyone else pays at the door. */
export const LOUNGE_PASS = 3000;
