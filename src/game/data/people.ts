import type { Npc, SocialDef } from "../types";

export const NPCS: Npc[] = [
  { id: "otieno", name: "Otieno", emoji: "🧢", age: 24, venue: "kencom", hours: [5, 21], bio: "Makanga on the Rongai route. Knows everyone, owes everyone.", line: "\"Tao, tao! Ni jongo tu, panda tukam! Mbele kuna nafasi ya mmoja!\"" },
  { id: "mzeeKariuki", name: "Mzee Kariuki", emoji: "👴🏾", age: 68, venue: "jeevanjee", hours: [10, 17], bio: "Retired civil servant. Undefeated at draughts since 1982.", line: "\"Kijana, unacheza ama unaangalia?\"" },
  { id: "baraka", name: "Baraka", emoji: "🧑🏾‍🎓", age: 21, venue: "uon", hours: [9, 20], bio: "Comrade, student leader in waiting, always has a plan.", line: "\"Comrade power! Form ni gani leo?\"" },
  { id: "shiro", name: "Shiro", emoji: "👩🏾‍💻", age: 27, venue: "techhub", hours: [9, 19], bio: "Senior dev at a fintech startup. Codes faster than she talks.", line: "\"Have you tried turning it off and on?\"" },
  { id: "kevo", name: "DJ Kevo", emoji: "🎧", age: 29, venue: "k1", hours: [21, 3], bio: "Resident DJ. Amapiano on Saturdays, gengetone when he's in the mood.", line: "\"Mbogi iko wapi?! Hii ni warena, make some noise!\"" },
  { id: "juma", name: "Juma", emoji: "😂", age: 26, venue: "comedyClub", hours: [19, 23], bio: "Up-and-coming comedian, roasts everyone, including you.", line: "\"Wewe ni wa Pipeline? I can tell from the calves.\"" },
  { id: "wanjiru", name: "Wanjiru", emoji: "🤳🏾", age: 23, venue: "contenthouse", hours: [10, 18], bio: "Content creator with a grannycore wardrobe and 80k followers.", line: "\"Rada! Shika hii ring light, una diglo?\"" },
  { id: "mamaNjeri", name: "Mama Njeri", emoji: "👩🏾‍🦱", age: 45, venue: "kenyattaMarket", hours: [8, 19], bio: "Runs a salon at Kenyatta Market. Knows everything about everyone.", line: "\"Ai! Si you're the one from the TikTok?\"" },
  { id: "achieng", name: "Achieng", emoji: "👩🏾‍⚕️", age: 30, venue: "knh", hours: [7, 19], bio: "Nurse at KNH. Tough, kind, permanently tired.", line: "\"Kunywa maji, my dear. You look finished.\"" },
  { id: "nyokabi", name: "Nyokabi", emoji: "👩🏾‍💼", age: 33, venue: "bank", hours: [8, 18], bio: "Relationship manager. Talks about money markets for fun.", line: "\"Are you on an MMF yet? Why not?\"" },
  { id: "fatuma", name: "Fatuma", emoji: "🧕🏾", age: 35, venue: "firstAve", hours: [8, 19], bio: "Runs three shops on First Avenue. Fierce negotiator.", line: "\"Bei ya mwisho? For you, special price.\"" },
  { id: "kamau", name: "Kamau", emoji: "🧺", age: 38, venue: "gikomba", hours: [5, 18], bio: "Mitumba bale king. Can spot a designer label from across the market.", line: "\"Chagua chagua! Mia mia!\"" },
  { id: "brayo", name: "Brayo", emoji: "🕺🏾", age: 20, venue: "nganyaStage", hours: [12, 22], bio: "Gen Z, nganya fanatic, does every dance challenge.", line: "\"Wueh! Umeona Baba Yaga mpya? Ni warena!\"" },
  { id: "aisha", name: "Aisha", emoji: "🧕🏽", age: 28, venue: "southJoints", hours: [17, 23], bio: "South C girl. Knows the best biryani and the best gossip.", line: "\"You've not had biryani until you've had my aunt's.\"" },
  { id: "wairimu", name: "Wairimu", emoji: "👩🏾‍✈️", age: 29, venue: "jkia", hours: [5, 23], bio: "Twiga Air cabin crew. Has seen every kind of passenger.", line: "\"Seatbelts, phones on flight mode, and no, you can't sit in business.\"" },
  { id: "hassan", name: "Hassan", emoji: "🧳", age: 41, venue: "jkia", hours: [6, 22], bio: "Mombasa businessman. Flies twice a week and knows every lounge.", line: "\"Wee, Nairobi traffic! Si bora tu nipande ndege.\"" },
  { id: "mwanaisha", name: "Mwanaisha", emoji: "🧕🏾", age: 31, venue: "moiAirport", hours: [7, 22], bio: "Tour guide who meets every flight with a sign and a smile.", line: "\"Karibu Pwani! Taxi, hotel, Fort Jesus? Niko na kila kitu.\"" },
  { id: "atieno", name: "Atieno", emoji: "👩🏾", age: 26, venue: "kisumuAirport", hours: [7, 21], bio: "Flying home to Kisumu for her cousin's wedding.", line: "\"Uko na plan ya weekend? Kisumu iko poa sana.\"" },
  { id: "mosh", name: "Mosh", emoji: "🏍️", age: 27, venue: "kencom", hours: [5, 23], bio: "Boda rider at Kencom. Knows every shortcut and where the hessy stand.", line: "\"Boss, boda? Nakufikisha chap chap. Shika hapa vizuri.\"" },
  { id: "dennoh", name: "Dennoh", emoji: "🎧", age: 23, venue: "rongaiStage", hours: [5, 23], bio: "Makanga on Baba Yaga. Hangs off the door like it's nothing.", line: "\"Ongata! Ongata! Baba Yaga iko na nafasi, panda tukam!\"" },
  { id: "kaka", name: "Kaka", emoji: "🏍️", age: 31, venue: "nganyaStage", hours: [6, 22], bio: "Umoja boda rider, chairman of the stage. Rwabe to anywhere in the mayibe.", line: "\"Uko na form ya Inner Core? Rwabe tu, tunaenda.\"" },
  { id: "kiprop", name: "Kiprop", emoji: "🏃🏾", age: 25, venue: "karura", hours: [6, 11], bio: "Eldoret-born runner training for the Nairobi Marathon.", line: "\"Twende! Ten more kilometres!\"" },
];

export const SOCIALS: SocialDef[] = [
  { id: "salimia", label: "Salimia", emoji: "👋🏾", minRel: -100, rel: 4, social: 8, chance: 0.95, minutes: 10 },
  { id: "gist", label: "Piga story", emoji: "💬", minRel: 0, rel: 6, social: 15, fun: 4, skill: "charm", chance: 0.85, minutes: 25 },
  { id: "joke", label: "Crack a joke", emoji: "😂", minRel: 0, rel: 7, social: 12, fun: 10, skill: "comedy", chance: 0.65, minutes: 10 },
  { id: "hype", label: "Hype them up", emoji: "🙌🏾", minRel: 10, rel: 5, social: 10, chance: 0.9, minutes: 10 },
  { id: "deep", label: "Talk about life", emoji: "🫂", minRel: 25, rel: 10, social: 20, chance: 0.85, minutes: 40 },
  { id: "hangOut", label: "Hang out", emoji: "🍻", minRel: 35, rel: 12, social: 25, fun: 15, chance: 0.9, minutes: 90 },
  { id: "hug", label: "Hug", emoji: "🤗", minRel: 45, rel: 5, social: 10, chance: 0.9, minutes: 5 },
  { id: "flirt", label: "Flirt", emoji: "😏", minRel: 15, rel: 6, social: 12, fun: 6, skill: "charm", chance: 0.55, minutes: 15, romantic: true },
  { id: "kiss", label: "Kiss", emoji: "💋", minRel: 55, rel: 8, social: 15, fun: 10, chance: 0.65, minutes: 5, romantic: true },
  { id: "askOut", label: "Ask to be your bae", emoji: "💘", minRel: 65, rel: 15, social: 20, skill: "charm", chance: 0.55, minutes: 20, romantic: true },
  { id: "askMoney", label: "Omba packe", emoji: "🙏🏾", minRel: 50, rel: -12, social: 4, chance: 0.6, minutes: 15, ask: 1500 },
  { id: "shade", label: "Throw shade", emoji: "😒", minRel: -100, rel: -15, social: 4, fun: 10, chance: 1, minutes: 10 },
];

export const relLabel = (rel: number, bae = false, married = false) =>
  married
    ? { label: "Mpenzi wa Maisha", color: "#c8102e" }
    : bae
      ? { label: "Bae", color: "#ff4d8d" }
      : rel <= -30
        ? { label: "Adui", color: "#c8102e" }
        : rel < 10
          ? { label: "Msee tu", color: "#8d99ae" }
          : rel < 30
            ? { label: "Mjuana", color: "#48cae4" }
            : rel < 60
              ? { label: "Beste", color: "#0b7a3b" }
              : { label: "Mbogi", color: "#f2b705" };

export const WEDDING_TIERS = [
  { id: "ruracio", label: "Ruracio & small wedding", emoji: "🐐", cost: 150000, desc: "Goats, family and a church wedding." },
  { id: "harusi", label: "Full harusi", emoji: "💒", cost: 600000, desc: "Tents, MC, a convoy of cars, the whole mtaa." },
  { id: "society", label: "Society wedding", emoji: "🥂", cost: 3000000, desc: "Destination photos, a choir, a helicopter exit." },
];
export const RING_COST = 50000;
export const DATE_COST = 2500;
