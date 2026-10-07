import type { Business, Car, Course, Office, Plot, Policy, Sickness } from "../types";

export const BUSINESSES: Business[] = [
  { id: "smokieStand", name: "Smokie & egg stand", emoji: "🌭", price: 15000, weekly: [2500, 5500], blurb: "A cart at the stage. Kanjo permitting." },
  { id: "mitumbaStall", name: "Mitumba stall", emoji: "🧥", price: 40000, weekly: [4000, 9000], blurb: "A Gikomba stall with a bale a week." },
  { id: "mpesaShop", name: "M-Pesa & airtime shop", emoji: "📲", price: 80000, weekly: [6000, 12000], blurb: "Float, commission, a lot of \"niaje boss\"." },
  { id: "kinyozi", name: "Kinyozi", emoji: "💈", price: 150000, weekly: [10000, 22000], blurb: "Three chairs, one TV, endless football arguments." },
  { id: "chipsJoint", name: "Chips & kuku joint", emoji: "🍟", price: 220000, weekly: [14000, 30000], blurb: "Students' favourite, open late." },
  { id: "carWash", name: "Car wash", emoji: "🚿", price: 320000, weekly: [20000, 40000], blurb: "Pressure washers and loud music." },
  { id: "nganya", name: "Nganya matatu", emoji: "🚐", price: 4500000, weekly: [250000, 520000], blurb: "Graffiti, screens, a crew of five. NTSA permitting." },
  { id: "flats", name: "Block of flats in Pipeline", emoji: "🏢", price: 25000000, weekly: [1100000, 1700000], blurb: "300 tenants, one caretaker, zero lifts." },
];
export const BUSINESS_RESALE = 0.6;

export const PLOTS: Plot[] = [
  { id: "kamulu", name: "1/8 acre in Kamulu", price: 350000, growth: 0.008, cartel: 0.25, blurb: "Cheap now. \"Tarmac inakuja.\"" },
  { id: "juja", name: "1/8 acre in Juja", price: 700000, growth: 0.01, cartel: 0.15, blurb: "Near the university. Student hostels?" },
  { id: "kitengelaPlot", name: "1/8 acre in Kitengela", price: 1100000, growth: 0.012, cartel: 0.12, blurb: "Kitengela is booming." },
  { id: "ruiru", name: "1/4 acre in Ruiru", price: 1600000, growth: 0.01, cartel: 0.08, blurb: "Off the bypass, ready title." },
  { id: "konza", name: "1/4 acre near Konza", price: 2200000, growth: 0.018, cartel: 0.1, blurb: "\"Techno city coming soon.\" Since 2008." },
  { id: "syokimau", name: "1/4 acre in Syokimau", price: 3000000, growth: 0.008, cartel: 0.05, blurb: "SGR next door, steady value." },
  { id: "karenPlot", name: "Half acre in Karen", price: 25000000, growth: 0.006, cartel: 0.01, blurb: "Old money. Doesn't move fast, doesn't fall." },
];
export const LAND_SEARCH_FEE = 5000;
export const LAND_SELL_FEE = 0.05;

export const CARS: Car[] = [
  { id: "vitz", name: "Toyota Vitz", emoji: "🚗", price: 750000, kmh: 30, perKm: 15, blurb: "Every first-time buyer's car." },
  { id: "probox", name: "Toyota Probox", emoji: "🚙", price: 950000, kmh: 30, perKm: 18, blurb: "The hustler's workhorse. Indestructible." },
  { id: "subaru", name: "Subaru Forester", emoji: "🏎️", price: 1900000, kmh: 34, perKm: 28, blurb: "Welcome to the Subaru gang. Loud exhaust optional." },
  { id: "markX", name: "Toyota Mark X", emoji: "🚘", price: 2500000, kmh: 34, perKm: 30, blurb: "The Nairobi slay-queen magnet." },
  { id: "prado", name: "Toyota Prado TX", emoji: "🚙", price: 7500000, kmh: 34, perKm: 45, blurb: "Mid-level boss energy." },
  { id: "v8", name: "Land Cruiser V8", emoji: "🛻", price: 16000000, kmh: 36, perKm: 60, blurb: "Mheshimiwa's ride. Matatus give way." },
  { id: "rangeRover", name: "Range Rover", emoji: "🚘", price: 28000000, kmh: 38, perKm: 55, blurb: "Karen school run." },
  { id: "gWagon", name: "G-Wagon", emoji: "🛻", price: 38000000, kmh: 38, perKm: 65, blurb: "You've officially made it." },
];
export const CAR_RESALE = 0.7;
export const CBD_PARKING = 300;

export const SICKNESSES: Sickness[] = [
  { id: "flu", name: "Homa (flu)", emoji: "🤧", serious: false, days: 2, blurb: "Runny nose, body aches." },
  { id: "foodPoison", name: "Tumbo joto", emoji: "🤢", serious: false, days: 1, blurb: "That street food hit back." },
  { id: "typhoid", name: "Typhoid", emoji: "🤒", serious: true, days: 4, blurb: "Needs a proper doctor." },
  { id: "malaria", name: "Malaria", emoji: "🦟", serious: true, days: 4, blurb: "Caught on a trip upcountry." },
];
export const CHEMIST_COST = 350;
export const CLINIC_COST = 2500;
export const ADMIT_COST = 18000;
export const SHA_WEEKLY = 300;
export const SHA_COVER = 0.8;

export const OFFICES: Office[] = [
  { id: "mca", title: "MCA", allowance: 15000, runFee: 5000, charm: 20, campaign: 50000 },
  { id: "mp", title: "MP", allowance: 60000, runFee: 50000, charm: 40, campaign: 1000000 },
  { id: "senator", title: "Senator", allowance: 80000, runFee: 100000, charm: 50, campaign: 2500000 },
  { id: "governor", title: "Governor of Nairobi", allowance: 150000, runFee: 250000, charm: 60, campaign: 6000000 },
];

export const POLICIES: Policy[] = [
  { id: "streetLights", label: "Fix the street lights", emoji: "💡", desc: "Fewer pickpockets and muggings." },
  { id: "bowsers", label: "Water bowsers for every estate", emoji: "🚚", desc: "Water rationing hits half as often." },
  { id: "fareCap", label: "Matatu fare cap", emoji: "🚐", desc: "Matatu fares 30% lower." },
  { id: "hustleFund", label: "Youth hustle fund", emoji: "💸", desc: "Side hustles pay 20% more." },
  { id: "cbdWifi", label: "Free Wi-Fi in the CBD", emoji: "📶", desc: "Skills grow 20% faster in the CBD." },
  { id: "festival", label: "Nairobi festival season", emoji: "🎉", desc: "Parties and nightlife are 20% more fun." },
];

export const COURSES: Course[] = [
  { id: "cs", name: "BSc Computer Science", skill: "tech", fees: 60000 },
  { id: "commerce", name: "BCom", skill: "hustle", fees: 50000 },
  { id: "law", name: "LLB Law", skill: "charm", fees: 80000 },
  { id: "medicine", name: "MBChB Medicine", skill: "tech", fees: 120000 },
  { id: "journalism", name: "BA Journalism", skill: "comedy", fees: 45000 },
  { id: "music", name: "BA Music & Theatre", skill: "music", fees: 45000 },
];
export const CLASSES_TO_GRADUATE = 12;

export const BANK = {
  /** Money market fund interest per day. */
  mmfDaily: 0.0004,
  /** Digital lender interest per week, compounding. */
  loanWeekly: 0.12,
  loanMax: 50000,
  bondReturn: 0.06,
  bondDays: 28,
  bondMin: 50000,
};

export const DERBY_ODDS = { gor: 2.4, draw: 3.1, ingwe: 2.8 };
