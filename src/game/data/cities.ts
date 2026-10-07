import type { Area, Npc, Venue } from "../types";

/** Mombasa and Kisumu: reached by flight from JKIA or the SGR, not by matatu. */
export const CITY_AREAS: Area[] = [
  { id: "mombasa", city: "mombasa", name: "Mombasa", emoji: "🏝️", x: 0, y: 0, blurb: "Pwani: Old Town alleys, the beach, and pole pole.", vibe: "Pole pole ndio mwendo. Karibu Pwani!" },
  { id: "kisumu", city: "kisumu", name: "Kisumu", emoji: "🐟", x: 0, y: 0, blurb: "Lakeside city: fresh tilapia, rhumba nights, hippos at Dunga.", vibe: "Ber ahinya! Samaki ni ya leo." },
];

const fly = (id: string, label: string, cost: number, goTo: string, text: string) => ({ id, label, emoji: "✈️", minutes: 150, cost, goTo, needs: { energy: -8, fun: 8 }, moodlet: "jetSetter", tags: ["travel"], text });

export const CITY_VENUES: Venue[] = [
  // Nairobi departures
  {
    id: "sgrNairobi", area: "jkia", name: "SGR Nairobi Terminus", emoji: "🚆", blurb: "Madaraka Express to the coast, out past Syokimau.",
    actions: [
      { id: "sgrEconomy", label: "Madaraka Express to Mombasa (economy)", emoji: "🚆", minutes: 330, cost: 1500, goTo: "sgrMombasa", open: [7, 16], needs: { energy: -10, fun: 10, social: 10 }, tags: ["travel"], text: "Five hours of savannah, the odd giraffe, and a family sharing chapati with you." },
      { id: "sgrFirst", label: "Madaraka Express to Mombasa (first class)", emoji: "🛋️", minutes: 300, cost: 4500, goTo: "sgrMombasa", open: [7, 16], needs: { energy: 5, fun: 12 }, tags: ["travel"], text: "Leg room, a quiet carriage and a view of Tsavo." },
    ],
  },
  // Mombasa
  {
    id: "moiAirport", area: "mombasa", name: "Moi International Airport", emoji: "🛫", blurb: "Hot, humid, and the start of every coast holiday.",
    actions: [{ id: "toilet", label: "Use the washroom", emoji: "🚻", minutes: 10, needs: { bladder: 100 }, text: "Relief." }, fly("flyMbsNbo", "Fly back to Nairobi", 7500, "jkia", "An hour up, and you can already feel the Nairobi cold.")],
  },
  {
    id: "sgrMombasa", area: "mombasa", name: "SGR Mombasa Terminus", emoji: "🚆", blurb: "Miritini station, the end of the line.",
    actions: [
      { id: "busBack", label: "Night bus to Nairobi", emoji: "🚌", minutes: 540, cost: 1200, sleep: true, goTo: "riverroad", needs: { hygiene: -15 }, tags: ["travel"], text: "Nine hours up Mombasa Road. You wake up on River Road." },
      { id: "lorry", label: "Hitch a lorry to Nairobi (free)", emoji: "🚛", minutes: 780, goTo: "riverroad", needs: { energy: -20, hygiene: -30, fun: -10 }, tags: ["travel"], text: "The driver plays the same Benga album four times. You make it." },
      { id: "sgrBack", label: "Madaraka Express to Nairobi", emoji: "🚆", minutes: 330, cost: 1500, goTo: "sgrNairobi", open: [7, 16], needs: { energy: -10, fun: 8 }, tags: ["travel"], text: "Back up the line to Kanairo." },
    ],
  },
  {
    id: "oldTown", area: "mombasa", name: "Old Town & Fort Jesus", emoji: "🏰", blurb: "Carved Swahili doors, narrow alleys and a 16th-century fort.",
    actions: [
      { id: "fortJesus", label: "Tour Fort Jesus", emoji: "🏰", minutes: 120, cost: 1200, open: [8, 18], needs: { fun: 25 }, skills: { photography: 2 }, moodlet: "cultured", tags: ["nature"], text: "Portuguese walls, Omani history, a lot of cannons." },
      { id: "kahawa", label: "Kahawa chungu from a street seller", emoji: "☕", minutes: 20, cost: 20, needs: { fun: 6, energy: 6, social: 8 }, tags: ["street"], text: "Bitter, spiced coffee in a tiny cup, poured from a brass pot." },
      { id: "biriani", label: "Swahili biriani & mahamri", emoji: "🍛", minutes: 45, cost: 400, needs: { hunger: 55, fun: 12 }, moodlet: "feast", tags: ["eat"], text: "Coastal biriani, the way it's meant to be." },
    ],
  },
  {
    id: "pirates", area: "mombasa", name: "Jomo Kenyatta Public Beach", emoji: "🏖️", blurb: "\"Pirates\": camels, madafu and the whole city on a Sunday.",
    actions: [
      { id: "swim", label: "Swim in the Indian Ocean", emoji: "🌊", minutes: 90, needs: { fun: 30, hygiene: -10, energy: -10 }, skills: { fitness: 2 }, moodlet: "beach", tags: ["nature", "workout"], text: "Warm water, white sand. Nairobi who?" },
      { id: "madafu", label: "Madafu & viazi karai", emoji: "🥥", minutes: 30, cost: 150, needs: { hunger: 20, fun: 10 }, tags: ["eat", "street"], text: "Fresh coconut water and chilli-dusted potato fritters." },
      { id: "camelRide", label: "Camel ride on the beach", emoji: "🐪", minutes: 30, cost: 500, needs: { fun: 18 }, skills: { photography: 1 }, text: "Taller than it looks. You scream once." },
      { id: "beachEvening", label: "Evening on the beach", emoji: "🌅", minutes: 120, open: [16, 22], needs: { fun: 20, social: 15 }, moodlet: "beach", risk: { chance: 0.06, sickness: "malaria" }, tags: ["nature"], text: "Sunset, music from a car, mosquitoes from everywhere." },
    ],
  },
  {
    id: "nyaliHotel", area: "mombasa", name: "Nyali Beach Hotel", emoji: "🏨", blurb: "Pool, buffet and a room with an ocean view.",
    actions: [
      { id: "toilet", label: "Use the washroom", emoji: "🚻", minutes: 10, needs: { bladder: 100 }, text: "Relief." },
      { id: "hotelNight", label: "Spend the night (KSh 9,000)", emoji: "🛏️", minutes: 480, cost: 9000, sleep: true, needs: { energy: 100, hygiene: 60 }, moodlet: "sleptWell", text: "Ocean breeze, AC, and the best sleep you've had in months." },
      { id: "buffet", label: "Seafood buffet", emoji: "🦐", minutes: 90, cost: 3500, needs: { hunger: 70, fun: 25 }, moodlet: "feast", tags: ["eat"], text: "Prawns, octopus, coconut fish. You go back four times." },
      { id: "coastClub", label: "Party at a Nyali club", emoji: "🪩", minutes: 240, cost: 1500, open: [21, 3], needs: { fun: 40, social: 30, energy: -25 }, skills: { dance: 2 }, moodlet: "partied", tags: ["party", "dance"], text: "Bongo, amapiano and coastal heat." },
    ],
  },
  // Kisumu
  {
    id: "kisumuAirport", area: "kisumu", name: "Kisumu International Airport", emoji: "🛫", blurb: "Small airport, big welcome.",
    actions: [{ id: "toilet", label: "Use the washroom", emoji: "🚻", minutes: 10, needs: { bladder: 100 }, text: "Relief." }, fly("flyKsmNbo", "Fly back to Nairobi", 6500, "jkia", "Forty-five minutes over the Rift Valley.")],
  },
  {
    id: "dunga", area: "kisumu", name: "Dunga Beach", emoji: "🐟", blurb: "Fishing boats, hippos and the freshest tilapia in Kenya.",
    actions: [
      { id: "tilapia", label: "Whole fried tilapia & ugali", emoji: "🐟", minutes: 60, cost: 600, needs: { hunger: 65, fun: 15, social: 10 }, moodlet: "feast", tags: ["eat"], text: "Straight from the lake to the pan. Eat with your hands." },
      { id: "hippoBoat", label: "Boat ride to see hippos", emoji: "🦛", minutes: 90, cost: 1500, needs: { fun: 30 }, skills: { photography: 2 }, moodlet: "nature", risk: { chance: 0.05, sickness: "malaria" }, tags: ["nature"], text: "The boatman keeps a very respectful distance." },
    ],
  },
  {
    id: "impala", area: "kisumu", name: "Kisumu Impala Sanctuary", emoji: "🦌", blurb: "Lakeshore walks with impalas and zebras.",
    actions: [{ id: "impalaWalk", label: "Lakeshore walk", emoji: "🦓", minutes: 90, cost: 300, open: [7, 18], needs: { fun: 20, energy: -6 }, moodlet: "nature", tags: ["nature"], text: "Zebras, impalas and a sunset over Lake Victoria." }],
  },
  {
    id: "kisumuTown", area: "kisumu", name: "Oginga Odinga Street", emoji: "🎷", blurb: "Town centre: hotels, rhumba bars and roadside fish.",
    actions: [
      { id: "toilet", label: "Public washroom (KSh 10)", emoji: "🚻", minutes: 10, cost: 10, needs: { bladder: 100 }, text: "Relief." },
      { id: "busBack", label: "Night bus to Nairobi", emoji: "🚌", minutes: 420, cost: 1000, sleep: true, goTo: "riverroad", needs: { hygiene: -15 }, tags: ["travel"], text: "Seven hours through the Rift Valley. You wake up on River Road." },
      { id: "lorry", label: "Hitch a lorry to Nairobi (free)", emoji: "🚛", minutes: 660, goTo: "riverroad", needs: { energy: -20, hygiene: -30, fun: -10 }, tags: ["travel"], text: "The driver plays the same Benga album four times. You make it." },
      { id: "rhumba", label: "Rhumba night", emoji: "🎷", minutes: 180, cost: 800, open: [20, 2], needs: { fun: 35, social: 30, energy: -15 }, skills: { dance: 3 }, moodlet: "partied", tags: ["party", "dance"], text: "Lingala and ohangla until your feet give up." },
      { id: "kisumuHotel", label: "Hotel night (KSh 4,500)", emoji: "🛏️", minutes: 480, cost: 4500, sleep: true, needs: { energy: 95, hygiene: 50 }, moodlet: "sleptWell", text: "A quiet room with a view of the lake." },
    ],
  },
];

export const CITY_NPCS: Npc[] = [
  { id: "bakari", name: "Mzee Bakari", emoji: "👳🏾‍♂️", age: 64, venue: "oldTown", hours: [7, 20], bio: "Sells kahawa chungu in Old Town. Has seen every tourist trick.", line: "\"Karibu sana, mgeni. Kahawa?\"" },
  { id: "akinyi", name: "Akinyi", emoji: "👩🏾", age: 31, venue: "dunga", hours: [6, 19], bio: "Fish trader at Dunga. Knows every boat and every price.", line: "\"Ber ahinya! This one was swimming an hour ago.\"" },
];
