import type { Area, Estate, Unit, Venue } from "../types";

export const AREAS: Area[] = [
  { id: "cbd", name: "CBD", emoji: "🏙️", x: 50, y: 47, blurb: "Everyone passes through, nobody stays.", vibe: "Kencom imejaa, makanga wanaita \"Ngong Road, Rongai, tao tao!\"" },
  { id: "westlands", name: "Westlands", emoji: "🌃", x: 36, y: 35, blurb: "\"Westie\": tech offices by day, Woodvale Grove by night.", vibe: "Amapiano owns Saturday here." },
  { id: "kilimani", name: "Kilimani", emoji: "☕", x: 34, y: 52, blurb: "Young professionals, rooftop bars, content houses.", vibe: "Everyone here has a podcast." },
  { id: "upperhill", name: "Upper Hill", emoji: "🏢", x: 44, y: 56, blurb: "Banks, KNH and a lot of lanyards.", vibe: "Lunch is at the kibanda, not the canteen." },
  { id: "eastleigh", name: "Eastleigh", emoji: "🛍️", x: 61, y: 38, blurb: "Somali trade hub. Wholesale everything, best food after 6pm.", vibe: "Warrias wameshinda kwa duka, chai ni ya spice." },
  { id: "gikomba", name: "Gikomba", emoji: "🧺", x: 61, y: 51, blurb: "Mitumba heaven. Haggle or go home.", vibe: "\"Mia mia! Chagua chagua!\"" },
  { id: "eastlands", name: "Eastlands", emoji: "🎶", x: 74, y: 47, blurb: "Birthplace of Sheng, gengetone and nganya culture.", vibe: "Mtaa ni mtaa. Hapa ndio kwa kina mbogi." },
  { id: "thikaroad", name: "Thika Road", emoji: "🛣️", x: 66, y: 22, blurb: "TRM, Kasarani stadium and bachelors in Roysambu.", vibe: "\"Roysambu convinces you to stay single. Kasarani inspires you to marry.\"" },
  { id: "ruaka", name: "Ruaka", emoji: "🎡", x: 33, y: 13, blurb: "Apartments everywhere, a big mall, water sometimes.", vibe: "Maji ilienda Jumanne, haijarudi." },
  { id: "karura", name: "Karura Forest", emoji: "🌳", x: 47, y: 25, blurb: "1,000 hectares of green inside the city.", vibe: "Sunday runners and first dates." },
  { id: "southb", name: "South B & C", emoji: "🏘️", x: 58, y: 63, blurb: "Quiet, middle class, great nyama and biryani.", vibe: "Kila mtu anajua kila mtu." },
  { id: "langata", name: "Lang'ata", emoji: "🦒", x: 40, y: 73, blurb: "Carnivore, giraffes and lions next to the skyline.", vibe: "Simba kwa park, nyama kwa Carnivore." },
  { id: "karen", name: "Karen", emoji: "🐎", x: 22, y: 78, blurb: "Money, space and quiet.", vibe: "\"Karen people\" don't take matatus." },
  { id: "runda", name: "Runda", emoji: "🏰", x: 53, y: 11, blurb: "Diplomats, gated mansions, Village Market.", vibe: "The gate has a gate." },
  { id: "rongai", name: "Rongai", emoji: "🚐", x: 32, y: 90, blurb: "Home of the flashiest nganyas in Kenya.", vibe: "Nganya inahukumiwa na face card, sound, lights na vibe." },
  { id: "kitengela", name: "Kitengela", emoji: "🌆", x: 80, y: 88, blurb: "Nairobi's new party town and land boom.", vibe: "Plot ni plot. Namanga Road haikulali." },
  { id: "jkia", name: "JKIA", emoji: "✈️", x: 74, y: 70, blurb: "The airport, Mombasa Road and the Expressway.", vibe: "Expressway ni ya wenye doh." },
  { id: "ngong", name: "Ngong Hills", emoji: "⛰️", x: 10, y: 88, blurb: "Wind turbines and views over the Rift Valley.", vibe: "Weekend hike, Monday regret." },
];

export const UNITS: Unit[] = [
  { id: "single", name: "Single room", rent: 900, slots: 4 },
  { id: "bedsitter", name: "Bedsitter", rent: 1500, slots: 6 },
  { id: "onebed", name: "One-bedroom", rent: 3000, slots: 9 },
  { id: "twobed", name: "Two-bedroom", rent: 5000, slots: 12 },
  { id: "maisonette", name: "Maisonette", rent: 9000, slots: 16 },
  { id: "mansion", name: "Mansion", rent: 20000, slots: 24 },
];

const toilet = (cost: number) => ({ id: "toilet", label: cost ? `Public washroom (KSh ${cost})` : "Use the washroom", emoji: "🚻", minutes: 10, cost, needs: { bladder: 100 }, text: "Relief." });

export const ESTATES: Estate[] = [
  {
    id: "kayole", name: "Kayole", area: "eastlands", x: 87, y: 50, rentFactor: 1, water: 0.25, noise: 10,
    units: ["single", "bedsitter", "onebed"],
    blurb: "\"Oyole\". Low rent, loud neighbours, a lot of the city's music and athletes.",
    actions: [
      { id: "kinyozi", label: "Fresh fade at the kinyozi", emoji: "💈", minutes: 40, cost: 150, needs: { hygiene: 10 }, skills: { charm: 1 }, moodlet: "drip", text: "Clean lines. You look like money." },
      { id: "videoShoot", label: "Watch a gengetone video shoot", emoji: "🎥", minutes: 90, needs: { fun: 15, social: 10 }, skills: { dance: 1, music: 1 }, tags: ["music"], text: "Ten takes of the same dance move. Everyone's in the background." },
    ],
  },
  {
    id: "pipeline", name: "Pipeline", area: "eastlands", x: 70, y: 58, rentFactor: 1, water: 0.35, noise: 15,
    units: ["single", "bedsitter", "onebed", "twobed"],
    blurb: "Nairobi's densest estate: 12-storey flats, 300 tenants a block, no lift.",
    actions: [
      { id: "stairs", label: "Climb nine floors with shopping", emoji: "🪜", minutes: 15, needs: { energy: -8 }, skills: { fitness: 1 }, tags: ["workout"], text: "No lift. Your calves are made of steel now." },
      { id: "caretaker", label: "Argue with the caretaker about water", emoji: "🗯️", minutes: 30, needs: { fun: -4, social: 12 }, skills: { charm: 1 }, text: "He blames the county. You blame him. Neighbours join in." },
    ],
  },
  {
    id: "umoja", name: "Umoja", area: "eastlands", x: 77, y: 42, rentFactor: 1.15, water: 0.2, noise: 8,
    units: ["bedsitter", "onebed", "twobed"],
    blurb: "\"Umoja\" means unity, and here it shows. Affordable and close to town.",
    actions: [
      { id: "umojaMarket", label: "Chill at Umoja market", emoji: "🛒", minutes: 60, needs: { social: 15, fun: 5 }, text: "Everyone knows your name and your business." },
      { id: "cleanup", label: "Join the estate clean-up", emoji: "🧹", minutes: 120, needs: { social: 20, hygiene: -10 }, moodlet: "goodDeed", text: "Gutters cleared, sodas shared. Mtaa love." },
    ],
  },
  {
    id: "buruburu", name: "Buruburu", area: "eastlands", x: 68, y: 46, rentFactor: 1.4, water: 0.15, noise: 4,
    units: ["bedsitter", "onebed", "twobed", "maisonette"],
    blurb: "\"Buru\", Eastlands' crown jewel: 1960s gates, middle-class calm.",
    actions: [
      { id: "buruChill", label: "Nyama & football at a Buru local", emoji: "📺", minutes: 120, cost: 600, needs: { hunger: 30, fun: 15, social: 15 }, tags: ["eat", "nyama"], text: "EPL on the big screen, a plate of choma, loud opinions." },
    ],
  },
  {
    id: "roysambu", name: "Roysambu", area: "thikaroad", x: 63, y: 24, rentFactor: 1.3, water: 0.2, noise: 10,
    units: ["single", "bedsitter", "onebed", "twobed"],
    blurb: "Bachelor's paradise off Thika Road. Young, loud, and next to TRM.",
    actions: [
      { id: "roysambuNight", label: "Lounge-hop in Roysambu", emoji: "🍻", minutes: 180, cost: 1200, open: [19, 3], needs: { fun: 30, social: 25, energy: -15 }, moodlet: "partied", tags: ["party"], text: "Three lounges, same playlist, new friends." },
    ],
  },
  {
    id: "kasarani", name: "Kasarani", area: "thikaroad", x: 71, y: 17, rentFactor: 1.3, water: 0.15, noise: 3,
    units: ["bedsitter", "onebed", "twobed", "maisonette"],
    blurb: "Families, mama mbogas, the stadium. People settle down here.",
    actions: [
      { id: "estateJog", label: "Evening jog round the estate", emoji: "🏃🏾", minutes: 45, needs: { energy: -8, hygiene: -10, fun: 5 }, skills: { fitness: 2 }, tags: ["workout"], text: "Kids cheer you on. Mostly they laugh." },
    ],
  },
  {
    id: "southb", name: "South B", area: "southb", x: 59, y: 61, rentFactor: 1.6, water: 0.12, noise: 3,
    units: ["bedsitter", "onebed", "twobed", "maisonette"],
    blurb: "Quiet, central-ish, everyone knows everyone. South C's biryani is next door.",
    actions: [
      { id: "biryaniC", label: "Biryani at a South C hotel", emoji: "🍚", minutes: 45, cost: 450, needs: { hunger: 50, fun: 6 }, tags: ["eat"], text: "Rich, spiced, generous. Worth the walk." },
    ],
  },
  {
    id: "rongai", name: "Rongai", area: "rongai", x: 33, y: 92, rentFactor: 1, water: 0.15, noise: 8,
    units: ["single", "bedsitter", "onebed", "twobed", "maisonette"],
    blurb: "Far, affordable, and the nganya capital of Kenya.",
    actions: [
      { id: "nganyaWatch", label: "Watch nganyas pull into the stage", emoji: "🚐", minutes: 60, needs: { fun: 15 }, skills: { photography: 1 }, moodlet: "nganya", tags: ["music"], text: "Bapesta-level graffiti, screens, lights. Art on wheels." },
    ],
  },
  {
    id: "kitengela", name: "Kitengela", area: "kitengela", x: 82, y: 86, rentFactor: 1.1, water: 0.2, noise: 6,
    units: ["bedsitter", "onebed", "twobed", "maisonette"],
    blurb: "Party town on Namanga Road, plots everywhere, a very long commute.",
    actions: [
      { id: "plotVisit", label: "Tour plots with a broker", emoji: "📐", minutes: 120, needs: { energy: -6, fun: 4 }, skills: { hustle: 1 }, text: "\"Hii ni investment, boss. Tarmac inakuja.\"" },
    ],
  },
  {
    id: "ruaka", name: "Ruaka", area: "ruaka", x: 38, y: 10, rentFactor: 1.6, water: 0.35, noise: 6,
    units: ["bedsitter", "onebed", "twobed"],
    blurb: "Apartments on top of apartments, Two Rivers next door.",
    actions: [
      { id: "tanker", label: "Wait for the water bowser", emoji: "🚚", minutes: 60, needs: { fun: -5, social: 10 }, text: "Neighbours and jerrycans. The bowser comes, eventually." },
    ],
  },
  {
    id: "westlands", name: "Westlands", area: "westlands", x: 34, y: 38, rentFactor: 2.6, water: 0.08, noise: 6,
    units: ["bedsitter", "onebed", "twobed"],
    blurb: "Glass towers, Woodvale Grove at night, a 10-minute walk to work.",
    actions: [],
  },
  {
    id: "kilimani", name: "Kilimani", area: "kilimani", x: 31, y: 55, rentFactor: 2.8, water: 0.08, noise: 4,
    units: ["bedsitter", "onebed", "twobed"],
    blurb: "Rooftop gyms, serious coffee, and everyone's a creative.",
    actions: [
      { id: "rooftop", label: "Rooftop sundowners", emoji: "🍹", minutes: 120, cost: 1500, open: [16, 23], needs: { fun: 25, social: 20 }, tags: ["party"], text: "Golden hour over Kilimani. Very Instagrammable." },
    ],
  },
  {
    id: "karen", name: "Karen", area: "karen", x: 20, y: 80, rentFactor: 4, water: 0.02, noise: 0,
    units: ["twobed", "maisonette", "mansion"],
    blurb: "Big plots, horses, peace. You've made it.",
    actions: [
      { id: "garden", label: "Tea in the garden", emoji: "🫖", minutes: 60, needs: { fun: 15, energy: 5 }, moodlet: "nature", tags: ["relax"], text: "Birds, flowers, silence. Rich-people peace." },
    ],
  },
  {
    id: "runda", name: "Runda", area: "runda", x: 51, y: 11, rentFactor: 5, water: 0.01, noise: 0,
    units: ["maisonette", "mansion"],
    blurb: "Diplomats and old money. The gate has a gate.",
    actions: [
      { id: "pool", label: "Pool day", emoji: "🏊🏾", minutes: 120, needs: { fun: 25, hygiene: 10, energy: -5 }, skills: { fitness: 2 }, tags: ["relax"], text: "Your own pool. The neighbour's is bigger." },
    ],
  },
];

export const VENUES: Venue[] = [
  // CBD
  {
    id: "kencom", area: "cbd", name: "Kencom Stage", emoji: "🚏", blurb: "The centre of everything: matatus, hawkers, preachers, boda guys.",
    actions: [
      toilet(10),
      { id: "smokie", label: "Smokie pasua", emoji: "🌭", minutes: 15, cost: 50, needs: { hunger: 12 }, tags: ["eat", "street"], risk: { chance: 0.02, sickness: "foodPoison" }, text: "Smokie with kachumbari. Breakfast of champions." },
      { id: "maize", label: "Roasted maize with chilli", emoji: "🌽", minutes: 15, cost: 40, needs: { hunger: 10, fun: 3 }, tags: ["eat", "street"], text: "Charcoal-roasted, lime and chilli. Perfect." },
      { id: "hawk", label: "Hawk phone covers on Moi Avenue", emoji: "📱", minutes: 180, open: [8, 20], needs: { energy: -12, social: 10 }, skills: { hustle: 1 }, earn: { base: 200, skill: "hustle", per: 14 }, tags: ["gig"], text: "Shouting prices, dodging kanjo." },
      { id: "pickpocket", label: "Pick a pocket at the stage", emoji: "🫳🏾", minutes: 20, needs: { fun: 5 }, skills: { hustle: 1 }, crime: { catch: 0.45, fine: 10000, reward: [500, 3000] }, text: "Quick hands in the crowd." },
    ],
  },
  {
    id: "jeevanjee", area: "cbd", name: "Jeevanjee Gardens", emoji: "🌳", blurb: "Preachers, draughts-playing mzees and lunchtime naps.",
    actions: [
      { id: "preachers", label: "Listen to the preachers", emoji: "📢", minutes: 30, needs: { fun: 5 }, skills: { charm: 1 }, tags: ["worship"], text: "Loud, confident, persuasive. Take notes." },
      { id: "draughts", label: "Play draughts with the mzees", emoji: "⚫", minutes: 60, needs: { fun: 10, social: 15 }, skills: { hustle: 1 }, tags: ["gist"], text: "They beat you twice and tell you about 1982." },
      { id: "grassNap", label: "Nap on the grass", emoji: "😴", minutes: 45, needs: { energy: 10, hygiene: -5 }, tags: ["relax"], text: "Bag under your head, one eye open." },
    ],
  },
  {
    id: "riverroad", area: "cbd", name: "River Road", emoji: "🎙️", blurb: "Studios, electronics, chapo madondo and buses to everywhere.",
    actions: [
      toilet(10),
      { id: "chapo", label: "Chapo madondo at a hotel", emoji: "🫓", minutes: 30, cost: 120, needs: { hunger: 35 }, tags: ["eat"], text: "Two chapatis and beans. A River Road classic." },
      { id: "studio", label: "Record a song in a River Road studio", emoji: "🎤", minutes: 150, cost: 1000, needs: { fun: 15, energy: -8 }, skills: { music: 4 }, tags: ["music"], rolls: [{ chance: 0.08, skill: "music", text: "The producer shares it with a DJ. It's getting plays!", moodlet: "viral" }], text: "Autotune does some heavy lifting." },
      { id: "luthuli", label: "Window-shop on Luthuli Avenue", emoji: "📲", minutes: 45, needs: { fun: 6 }, skills: { tech: 1 }, text: "Every phone, every charger, every \"original\"." },
      { id: "fakePerfume", label: "Sell \"original\" perfume", emoji: "🧴", minutes: 120, needs: { social: 10 }, skills: { hustle: 2, charm: 1 }, crime: { catch: 0.3, fine: 8000, reward: [800, 2500] }, text: "\"Hii ni original kabisa, boss.\"" },
    ],
  },
  {
    id: "library", area: "cbd", name: "McMillan Library", emoji: "📚", blurb: "Old building, quiet reading rooms, free Wi-Fi.",
    actions: [
      { id: "study", label: "Study tech", emoji: "💻", minutes: 120, open: [9, 18], needs: { fun: -6 }, skills: { tech: 2 }, tags: ["study"], text: "Tutorials on the free Wi-Fi. You understand recursion. Almost." },
      { id: "novel", label: "Read a Kenyan novel", emoji: "📖", minutes: 90, open: [9, 18], needs: { fun: 10 }, skills: { charm: 1, comedy: 1 }, tags: ["study"], text: "Ngũgĩ, then something lighter." },
    ],
  },
  {
    id: "kicc", area: "cbd", name: "KICC & Huduma Centre", emoji: "🏛️", blurb: "Government offices, the IEBC desk and the best rooftop view in town.",
    actions: [
      { id: "rooftopView", label: "KICC rooftop view", emoji: "🌇", minutes: 60, cost: 400, open: [9, 18], needs: { fun: 18 }, skills: { photography: 2 }, tags: ["nature"], text: "All of Kanairo below you. Great photos." },
      { id: "huduma", label: "Queue at Huduma Centre", emoji: "🪪", minutes: 120, open: [8, 17], needs: { fun: -10, energy: -5, social: 5 }, text: "Number 487. They're serving 212. You make friends in the queue." },
    ],
  },
  {
    id: "jamia", area: "cbd", name: "Jamia Mosque", emoji: "🕌", blurb: "Green domes in the middle of the CBD.",
    actions: [
      { id: "pray", label: "Pray at Jamia", emoji: "🤲🏾", minutes: 45, needs: { fun: 8, social: 8 }, moodlet: "blessed", tags: ["worship"], text: "Calm in the middle of the noise." },
      { id: "alms", label: "Give to those in need (KSh 200)", emoji: "💛", minutes: 10, cost: 200, moodlet: "goodDeed", text: "Small, but it matters." },
    ],
  },
  {
    id: "uon", area: "cbd", name: "University of Nairobi", emoji: "🎓", blurb: "UoN main campus: comrades, lecture halls and the Great Court.",
    actions: [
      { id: "comrades", label: "Hang out with comrades", emoji: "🧑🏾‍🎓", minutes: 90, needs: { social: 20, fun: 10 }, tags: ["gist"], text: "Politics, sheng, and plans to change the world by Friday." },
    ],
  },
  {
    id: "milimani", area: "cbd", name: "Milimani Law Courts", emoji: "⚖️", blurb: "Lawyers in suits, clients in a hurry.",
    actions: [
      { id: "watchCase", label: "Sit in on a court case", emoji: "👨🏾‍⚖️", minutes: 90, open: [9, 16], needs: { fun: 6 }, skills: { charm: 1 }, tags: ["study"], text: "Objection! Sustained. You're hooked." },
    ],
  },

  // Westlands
  {
    id: "techhub", area: "westlands", name: "Westie Tech Hub", emoji: "💻", blurb: "Startups, standing desks and free coffee.",
    actions: [
      { id: "meetup", label: "Tech meetup", emoji: "🍕", minutes: 120, open: [17, 21], needs: { social: 15, fun: 4 }, skills: { tech: 2, charm: 1 }, text: "Free pizza, slides about AI, a few new contacts." },
      { id: "hackathon", label: "Weekend hackathon", emoji: "🏆", minutes: 480, req: { weekend: true }, needs: { energy: -25, fun: 10, social: 20 }, skills: { tech: 6 }, rolls: [{ chance: 0.12, skill: "tech", text: "Your team won! KSh 50,000 prize.", money: 50000, moodlet: "crowdLoved" }], text: "Twelve Red Bulls and a working demo." },
      { id: "freelance", label: "Freelance gig on your laptop", emoji: "🧑🏾‍💻", minutes: 240, needs: { energy: -10, fun: -4 }, skills: { tech: 1 }, earn: { base: 500, skill: "tech", per: 60 }, req: { object: "laptop" }, tags: ["gig"], text: "A client from abroad needs a landing page by tonight." },
    ],
  },
  {
    id: "alchemist", area: "westlands", name: "The Alchemist", emoji: "🍔", blurb: "Open-air bar, food trucks, thrifted denim and DJs.",
    actions: [
      toilet(0),
      { id: "foodTruck", label: "Food truck & drinks", emoji: "🌮", minutes: 90, cost: 900, needs: { hunger: 35, fun: 15, social: 15 }, tags: ["eat"], text: "Tacos, burgers, a cold one under fairy lights." },
      { id: "alchemistDance", label: "Dance to the left-field DJs", emoji: "💃🏾", minutes: 120, cost: 500, open: [20, 3], needs: { fun: 25, energy: -12, social: 10 }, skills: { dance: 2 }, moodlet: "partied", tags: ["party", "dance"], text: "The DJ plays something nobody knows. Everybody dances." },
    ],
  },
  {
    id: "k1", area: "westlands", name: "K1 Klubhouse", emoji: "🪩", blurb: "Three floors, international DJs, the strictest door in town.",
    actions: [
      toilet(0),
      { id: "club", label: "Club till 4am", emoji: "🪩", minutes: 300, cost: 2000, open: [21, 2], needs: { fun: 45, energy: -30, hygiene: -15, social: 25 }, skills: { dance: 2, charm: 1 }, moodlet: "partied", tags: ["party", "dance"], text: "Amapiano, gengetone, and a 4am mutura run." },
      { id: "vip", label: "Book a VIP table", emoji: "🍾", minutes: 240, cost: 25000, open: [21, 2], needs: { fun: 60, social: 40, energy: -20 }, skills: { charm: 3 }, moodlet: "bigRide", tags: ["party"], text: "Sparklers, bottles, the DJ shouts your name." },
      { id: "sneakVip", label: "Sneak into the VIP section", emoji: "🥷🏾", minutes: 120, open: [22, 3], needs: { fun: 30, social: 20 }, skills: { charm: 1 }, moodlet: "partied", crime: { catch: 0.4, fine: 5000 }, tags: ["party"], text: "Free bottles, borrowed confidence." },
    ],
  },
  {
    id: "sarit", area: "westlands", name: "Sarit Centre", emoji: "🛍️", blurb: "Old-school mall, cinema, food court.",
    actions: [
      toilet(0),
      { id: "luku", label: "Shop for new luku", emoji: "👟", minutes: 90, cost: 3500, needs: { fun: 12 }, skills: { charm: 2 }, moodlet: "drip", text: "New sneakers. You walk different now." },
      { id: "movieSarit", label: "Watch a movie", emoji: "🎬", minutes: 150, cost: 700, open: [10, 23], needs: { fun: 28 }, tags: ["movie"], text: "Popcorn, AC, two hours away from your problems." },
    ],
  },
  {
    id: "comedyClub", area: "westlands", name: "Westlands Comedy Night", emoji: "🎤", blurb: "Open mics, roasts and the next big comedian.",
    actions: [
      { id: "openMic", label: "Do 5 minutes at the open mic", emoji: "🎙️", minutes: 60, open: [19, 23], needs: { fun: 10, social: 15 }, skills: { comedy: 3 }, rolls: [{ chance: 0.35, skill: "comedy", text: "The room erupts. They're quoting you at the bar.", moodlet: "crowdLoved" }, { chance: 1, text: "Silence. One guy coughs. You'll be back.", moodlet: "roasted" }], text: "Your heart is racing." },
      { id: "watchComedy", label: "Watch the show", emoji: "😂", minutes: 120, cost: 1000, open: [19, 23], needs: { fun: 30, social: 10 }, skills: { comedy: 1 }, text: "Your stomach hurts from laughing." },
    ],
  },

  // Kilimani
  {
    id: "gym", area: "kilimani", name: "Kilimani Gym", emoji: "🏋🏾", blurb: "Rooftop gym, mirrors, protein shakes.",
    actions: [
      toilet(0),
      { id: "workout", label: "Gym session", emoji: "🏋🏾", minutes: 90, cost: 300, open: [5, 22], needs: { energy: -15, hygiene: -20, fun: 4 }, skills: { fitness: 3 }, moodlet: "pumped", tags: ["workout"], text: "Leg day. You'll feel it tomorrow." },
      { id: "trainer", label: "Session with a personal trainer", emoji: "🧑🏾‍🏫", minutes: 60, cost: 1500, open: [6, 20], needs: { energy: -20, hygiene: -20 }, skills: { fitness: 6 }, moodlet: "pumped", tags: ["workout"], text: "\"One more!\" He says that eight times." },
      { id: "gymShower", label: "Shower at the gym", emoji: "🚿", minutes: 15, needs: { hygiene: 70 }, text: "Hot water that actually works." },
    ],
  },
  {
    id: "bootcamp", area: "kilimani", name: "Coding Bootcamp", emoji: "👩🏾‍💻", blurb: "Bootcamp classes for the next Silicon Savannah unicorn.",
    actions: [
      { id: "class", label: "Coding class", emoji: "⌨️", minutes: 180, cost: 500, open: [8, 20], needs: { energy: -10, fun: -4, social: 8 }, skills: { tech: 4 }, tags: ["study"], text: "Today: JavaScript. Tomorrow: more JavaScript." },
    ],
  },
  {
    id: "contenthouse", area: "kilimani", name: "Kilimani Content House", emoji: "📸", blurb: "Ring lights, matching outfits, a lot of takes.",
    actions: [
      { id: "tiktok", label: "Shoot TikToks", emoji: "📱", minutes: 120, needs: { fun: 15, energy: -6, social: 10 }, skills: { photography: 2, dance: 1 }, rolls: [{ chance: 0.08, skill: "photography", text: "One of your videos blew up overnight!", moodlet: "viral" }], tags: ["dance"], text: "The MBOKA challenge, take 14." },
      { id: "photoshoot", label: "Book a photoshoot", emoji: "📷", minutes: 120, cost: 2500, needs: { fun: 15 }, skills: { photography: 4, charm: 1 }, moodlet: "drip", text: "Grannycore fit, golden hour. Feed sorted." },
    ],
  },
  {
    id: "kenyattaMarket", area: "kilimani", name: "Kenyatta Market", emoji: "🔥", blurb: "The nyama choma strip, mutura and the salons.",
    actions: [
      toilet(10),
      { id: "kmNyama", label: "Nyama choma & ugali", emoji: "🍖", minutes: 75, cost: 800, needs: { hunger: 55, fun: 15, social: 10 }, moodlet: "feast", tags: ["eat", "nyama"], text: "Half a kilo of goat, ugali, kachumbari. Life is good." },
      { id: "mutura", label: "Mutura from the evening cart", emoji: "🌭", minutes: 15, cost: 100, open: [17, 23], needs: { hunger: 15, fun: 5 }, tags: ["eat", "street"], risk: { chance: 0.03, sickness: "foodPoison" }, text: "Hot, spicy, mysterious. Delicious." },
      { id: "braids", label: "Get your hair done", emoji: "💇🏾", minutes: 180, cost: 1500, needs: { fun: 8, hygiene: 10, social: 15 }, skills: { charm: 2 }, moodlet: "drip", text: "Three hours of gossip, and you look incredible." },
    ],
  },
  {
    id: "radio", area: "kilimani", name: "Radio Station", emoji: "📻", blurb: "Morning shows, call-ins and gossip segments.",
    actions: [
      { id: "callIn", label: "Call in to the morning show", emoji: "☎️", minutes: 20, open: [6, 10], needs: { fun: 8, social: 6 }, skills: { comedy: 1 }, text: "You're on air! You say hi to your whole mbogi." },
    ],
  },
  {
    id: "church", area: "kilimani", name: "Ngong Road Church", emoji: "⛪", blurb: "Big choir, bigger sermons, a fellowship lunch after.",
    actions: [
      { id: "service", label: "Sunday service", emoji: "🙏🏾", minutes: 150, req: { weekend: true }, needs: { fun: 12, social: 25 }, moodlet: "blessed", tags: ["worship"], text: "Praise and worship goes for an hour. Nobody complains." },
      { id: "offering", label: "Give an offering (KSh 500)", emoji: "💵", minutes: 5, cost: 500, moodlet: "goodDeed", tags: ["worship"], text: "The pastor nods at you." },
    ],
  },

  // Upper Hill
  {
    id: "bank", area: "upperhill", name: "Bank HQ", emoji: "🏦", blurb: "Marble floors and a long queue.",
    actions: [
      { id: "mixer", label: "Network at a corporate mixer", emoji: "🤝🏾", minutes: 90, open: [17, 21], cost: 500, needs: { fun: 5, social: 20 }, skills: { charm: 2, hustle: 1 }, text: "Business cards and opinions on the economy." },
    ],
  },
  {
    id: "callcentre", area: "upperhill", name: "Call Centre", emoji: "☎️", blurb: "Headsets, scripts and \"how may I help you?\"",
    actions: [],
  },
  {
    id: "knh", area: "upperhill", name: "Kenyatta National Hospital", emoji: "🏥", blurb: "The country's biggest hospital. Bring patience.",
    actions: [
      toilet(0),
      { id: "donateBlood", label: "Donate blood", emoji: "🩸", minutes: 45, needs: { energy: -10 }, moodlet: "goodDeed", req: { healthy: true }, text: "A soda, a biscuit and a sticker. Hero." },
    ],
  },
  {
    id: "kibanda", area: "upperhill", name: "Upper Hill Kibanda", emoji: "🍛", blurb: "Where the bankers really eat.",
    actions: [
      { id: "kibandaLunch", label: "Rice, beans and chapo", emoji: "🍛", minutes: 30, cost: 150, needs: { hunger: 40, social: 5 }, tags: ["eat"], text: "Unbeatable value." },
    ],
  },

  // Eastleigh
  {
    id: "firstAve", area: "eastleigh", name: "First Avenue Malls", emoji: "🛍️", blurb: "Wholesale clothes, shoes, perfume, phones.",
    actions: [
      { id: "wholesaleLuku", label: "Buy wholesale luku", emoji: "🧥", minutes: 90, cost: 1500, needs: { fun: 10 }, skills: { charm: 1, hustle: 1 }, moodlet: "drip", text: "Half the price of Sarit. Same tag." },
      { id: "haggle", label: "Learn the wholesale game", emoji: "📦", minutes: 120, open: [8, 19], needs: { energy: -6, fun: 4, social: 10 }, skills: { hustle: 2 }, text: "You watch traders close deals and pick up a few tricks." },
    ],
  },
  {
    id: "eatStreet", area: "eastleigh", name: "Eastleigh Food Street", emoji: "🥙", blurb: "From 6pm the street turns into a feast.",
    actions: [
      toilet(10),
      { id: "shawarma", label: "Shawarma & spiced tea", emoji: "🥙", minutes: 40, cost: 350, open: [17, 2], needs: { hunger: 40, fun: 10 }, tags: ["eat", "street"], text: "Hot, garlicky, perfect. The chai is ridiculous." },
      { id: "camel", label: "Camel meat & rice", emoji: "🍖", minutes: 60, cost: 600, needs: { hunger: 60, fun: 8 }, moodlet: "feast", tags: ["eat", "nyama"], text: "Slow-cooked and tender. You'll be back." },
    ],
  },
  {
    id: "desert", area: "eastleigh", name: "Desert Ground", emoji: "⚽", blurb: "Dusty pitch, serious football.",
    actions: [
      { id: "football", label: "Pick-up football", emoji: "⚽", minutes: 90, open: [6, 19], needs: { energy: -15, hygiene: -20, fun: 15, social: 20 }, skills: { fitness: 3 }, tags: ["workout"], text: "You scored once. You'll talk about it for a week." },
    ],
  },

  // Gikomba
  {
    id: "gikomba", area: "gikomba", name: "Gikomba Market", emoji: "🧺", blurb: "East Africa's biggest mitumba market.",
    actions: [
      toilet(10),
      { id: "mitumba", label: "Hunt for mitumba drip", emoji: "🧥", minutes: 90, cost: 500, open: [6, 19], needs: { fun: 10 }, skills: { charm: 1, hustle: 1 }, moodlet: "drip", text: "A barely-worn jacket for 300 bob. You look great." },
      { id: "githeri", label: "Githeri at the market", emoji: "🥣", minutes: 20, cost: 80, needs: { hunger: 30 }, tags: ["eat", "street"], text: "Filling, cheap, honest food." },
      { id: "flipThrift", label: "Flip thrift on TikTok", emoji: "📦", minutes: 240, open: [6, 18], cost: 1000, needs: { energy: -10 }, skills: { hustle: 2, photography: 1 }, earn: { base: 1200, skill: "hustle", per: 25 }, tags: ["gig"], text: "Buy bales, style them, sell them online as a \"stylist\"." },
    ],
  },

  // Eastlands (shared venues)
  {
    id: "outering", area: "eastlands", name: "Outering Road Club", emoji: "🪩", blurb: "Where Eastlands Gen Z goes out.",
    actions: [
      toilet(0),
      { id: "outeringClub", label: "Party on Outering", emoji: "🔊", minutes: 240, cost: 800, open: [21, 3], needs: { fun: 40, energy: -25, social: 25 }, skills: { dance: 2 }, moodlet: "partied", tags: ["party", "dance"], text: "Gengetone all night. Your voice is gone." },
    ],
  },
  {
    id: "nganyaStage", area: "eastlands", name: "Umoja Nganya Stage", emoji: "🚐", blurb: "Graffiti, LEDs and sound systems worth more than houses.",
    actions: [
      { id: "nganyaPhotos", label: "Shoot nganya art for IG", emoji: "📷", minutes: 60, needs: { fun: 12 }, skills: { photography: 2 }, moodlet: "nganya", text: "Rihanna, Bob Marley and a Lamborghini, airbrushed on a matatu." },
      { id: "nganyaCrew", label: "Hang with a nganya crew", emoji: "🧢", minutes: 90, needs: { social: 20, fun: 10 }, skills: { hustle: 1, music: 1 }, tags: ["music", "gist"], text: "Everyone has a story about Bapesta." },
      { id: "tagWall", label: "Tag a wall without a permit", emoji: "🎨", minutes: 90, needs: { fun: 20 }, skills: { photography: 1 }, crime: { catch: 0.3, fine: 4000 }, text: "A giant mural of your mbogi. Art or vandalism? The karao decide." },
    ],
  },
  {
    id: "school", area: "eastlands", name: "Eastlands Primary School", emoji: "🏫", blurb: "Big classes, small budget, big hearts.",
    actions: [
      { id: "tuition", label: "Give private tuition", emoji: "✏️", minutes: 120, open: [15, 20], needs: { energy: -8, social: 10 }, skills: { charm: 1 }, earn: { base: 400, skill: "tech", per: 10 }, tags: ["gig"], text: "Fractions, then more fractions." },
    ],
  },

  // Thika Road
  {
    id: "trm", area: "thikaroad", name: "Thika Road Mall", emoji: "🛒", blurb: "TRM: supermarket, food court, cinema.",
    actions: [
      toilet(0),
      { id: "foodCourt", label: "Fried chicken at the food court", emoji: "🍗", minutes: 40, cost: 650, needs: { hunger: 40, fun: 8 }, tags: ["eat"], text: "Chips and quarter chicken, the Kenyan classic." },
      { id: "movieTrm", label: "Watch a movie", emoji: "🎬", minutes: 150, cost: 600, open: [10, 23], needs: { fun: 28 }, tags: ["movie"], text: "Students' discount night. Loud audience." },
    ],
  },
  {
    id: "stadium", area: "thikaroad", name: "Kasarani Stadium", emoji: "🏟️", blurb: "Mashemeji derbies, concerts and athletics.",
    actions: [
      { id: "derby", label: "Mashemeji Derby: Gor vs Ingwe", emoji: "⚽", minutes: 180, cost: 500, req: { weekend: true }, needs: { fun: 30, social: 30, energy: -10 }, rolls: [{ chance: 0.5, text: "Your side won! You're hoarse from singing.", moodlet: "derby" }, { chance: 1, text: "Your side lost. The bus home is very quiet.", moodlet: "derbyLoss" }], tags: ["party"], text: "Green against blue, the whole stadium shaking." },
      { id: "track", label: "Run the track", emoji: "🏃🏾", minutes: 60, open: [6, 18], needs: { energy: -15, hygiene: -15 }, skills: { fitness: 3 }, tags: ["workout"], text: "Same track as the champions. Much slower." },
    ],
  },

  // Ruaka
  {
    id: "tworivers", area: "ruaka", name: "Two Rivers Mall", emoji: "🎡", blurb: "Big mall, bigger Ferris wheel.",
    actions: [
      toilet(0),
      { id: "ferris", label: "Ride the Ferris wheel", emoji: "🎡", minutes: 30, cost: 500, open: [10, 22], needs: { fun: 20 }, skills: { photography: 1 }, text: "All of Nairobi, all the way to Ngong Hills." },
      { id: "movieTR", label: "Watch a movie", emoji: "🎬", minutes: 150, cost: 800, open: [10, 23], needs: { fun: 30 }, tags: ["movie"], text: "Recliner seats. You nearly fall asleep." },
      { id: "window", label: "Window shopping", emoji: "🛍️", minutes: 60, open: [9, 22], needs: { fun: 6, energy: -5 }, text: "You can't afford it yet. One day." },
    ],
  },

  // Karura
  {
    id: "karura", area: "karura", name: "Karura Forest", emoji: "🌳", blurb: "Trails, a waterfall, the River Café.",
    actions: [
      { id: "karuraRun", label: "Trail run", emoji: "🏃🏾", minutes: 75, cost: 100, open: [6, 18], needs: { energy: -15, hygiene: -15, fun: 12 }, skills: { fitness: 3 }, moodlet: "nature", tags: ["workout", "nature"], text: "Monkeys, mud and fresh air." },
      { id: "waterfall", label: "Walk to the waterfall", emoji: "💧", minutes: 120, cost: 100, open: [6, 18], needs: { fun: 25, energy: -8 }, skills: { photography: 1 }, moodlet: "nature", tags: ["nature"], text: "It's bigger than you expected. Very peaceful." },
      { id: "picnic", label: "Picnic in the glades", emoji: "🧺", minutes: 120, cost: 1200, open: [8, 18], needs: { hunger: 30, fun: 20, social: 15 }, moodlet: "nature", tags: ["eat", "nature"], text: "Samosas, juice, a blanket under the trees." },
    ],
  },

  // South B / C
  {
    id: "southJoints", area: "southb", name: "South B Nyama Joint", emoji: "🍖", blurb: "Neighbourhood nyama, football on TV.",
    actions: [
      toilet(0),
      { id: "southNyama", label: "Nyama choma with the neighbours", emoji: "🍖", minutes: 90, cost: 700, needs: { hunger: 50, fun: 15, social: 20 }, moodlet: "feast", tags: ["eat", "nyama"], text: "Everyone has an opinion about the referee." },
    ],
  },

  // Lang'ata
  {
    id: "carnivore", area: "langata", name: "Carnivore", emoji: "🔥", blurb: "Meat on swords until you wave the white flag.",
    actions: [
      toilet(0),
      { id: "carnivoreFeast", label: "Nyama choma feast", emoji: "🔥", minutes: 120, cost: 3500, open: [12, 23], needs: { hunger: 70, fun: 30, social: 10 }, moodlet: "feast", tags: ["eat", "nyama"], text: "They keep bringing meat until you surrender the flag." },
    ],
  },
  {
    id: "park", area: "langata", name: "Nairobi National Park", emoji: "🦁", blurb: "Lions with the skyline behind them.",
    actions: [
      { id: "safari", label: "Game drive", emoji: "🦁", minutes: 240, cost: 1000, open: [6, 18], needs: { fun: 40, energy: -10 }, skills: { photography: 2 }, moodlet: "nature", tags: ["nature"], text: "Lions with the city skyline behind them. Only in Nairobi." },
      { id: "giraffe", label: "Feed giraffes at the Giraffe Centre", emoji: "🦒", minutes: 90, cost: 500, open: [9, 17], needs: { fun: 25 }, skills: { photography: 1 }, moodlet: "nature", tags: ["nature"], text: "A very long purple tongue. You scream a little." },
    ],
  },

  // Karen
  {
    id: "hubKaren", area: "karen", name: "The Hub Karen", emoji: "🥂", blurb: "Brunch, boutiques and good dogs.",
    actions: [
      toilet(0),
      { id: "brunch", label: "Sunday brunch", emoji: "🥞", minutes: 120, cost: 3000, needs: { hunger: 45, fun: 20, social: 20 }, tags: ["eat"], text: "Bottomless mimosas and very polite conversation." },
      { id: "horse", label: "Go horse riding", emoji: "🐎", minutes: 120, cost: 5000, open: [7, 17], needs: { fun: 35, energy: -10 }, skills: { fitness: 2 }, moodlet: "nature", tags: ["nature"], text: "The horse knows you don't know what you're doing." },
    ],
  },

  // Runda / Gigiri
  {
    id: "villageMarket", area: "runda", name: "Village Market", emoji: "🛍️", blurb: "Diplomats' mall with the Maasai market on Fridays.",
    actions: [
      toilet(0),
      { id: "maasaiMarket", label: "Browse the Maasai market", emoji: "📿", minutes: 90, cost: 1000, needs: { fun: 15 }, skills: { hustle: 1 }, moodlet: "cultured", text: "Beads, kikoys and a lot of bargaining." },
    ],
  },

  // Rongai
  {
    id: "rongaiStage", area: "rongai", name: "Rongai Stage", emoji: "🚐", blurb: "Nganya capital. Rides are judged on face card, sound, lights and vibe.",
    actions: [
      { id: "flashNganya", label: "Take the flashiest nganya for a spin", emoji: "🔊", minutes: 60, cost: 150, needs: { fun: 25, social: 10 }, moodlet: "nganya", tags: ["music"], text: "Screens, lasers, a sound system that rattles your teeth." },
    ],
  },

  // Kitengela
  {
    id: "namanga", area: "kitengela", name: "Namanga Road Clubs", emoji: "🌆", blurb: "Neon, big screens and late nights.",
    actions: [
      toilet(0),
      { id: "kitengelaParty", label: "Party on Namanga Road", emoji: "🎉", minutes: 240, cost: 1200, open: [20, 3], needs: { fun: 40, energy: -25, social: 25 }, skills: { dance: 2 }, moodlet: "partied", tags: ["party", "dance"], text: "Nairobians drove an hour for this, and it was worth it." },
    ],
  },
  {
    id: "mjengo", area: "kitengela", name: "Mjengo Site", emoji: "🏗️", blurb: "Apartments going up everywhere.",
    actions: [
      { id: "casual", label: "Casual work on the mjengo", emoji: "🧱", minutes: 360, open: [7, 10], needs: { energy: -30, hygiene: -30, hunger: -10 }, skills: { fitness: 3 }, earn: { base: 700, skill: "fitness", per: 5 }, tags: ["gig"], text: "Carrying blocks up three floors. Cash at 5pm." },
    ],
  },

  // JKIA
  {
    id: "jkia", area: "jkia", name: "JKIA", emoji: "✈️", blurb: "Kenya's gateway to the world.",
    actions: [
      toilet(0),
      { id: "planeSpot", label: "Watch planes from the viewing deck", emoji: "🛬", minutes: 60, needs: { fun: 12 }, skills: { photography: 1 }, text: "One day you'll be on one of those, going somewhere nice." },
      { id: "cafe", label: "Coffee & samosa at the café", emoji: "☕", minutes: 30, cost: 650, needs: { hunger: 15, energy: 10, fun: 4 }, tags: ["eat"], text: "Airport prices: KSh 650 for what costs 150 in town. Still, good coffee." },
      { id: "foodCourt", label: "Pilau & kachumbari at the food court", emoji: "🍛", minutes: 45, cost: 1100, needs: { hunger: 55, fun: 6 }, tags: ["eat"], text: "Pilau, kachumbari and a soda, eaten while you watch the departures board." },
      { id: "nyamaAirport", label: "Nyama choma at the terminal grill", emoji: "🍖", minutes: 60, cost: 1800, needs: { hunger: 70, fun: 12 }, tags: ["eat", "nyama"], text: "Half a kilo of goat and ugali before take-off. Hakuna matata." },
      { id: "dutyFree", label: "Browse duty free", emoji: "🛍️", minutes: 30, needs: { fun: 8 }, tags: ["shop"], text: "Perfume testers, Kenyan tea gift boxes and a KSh 40,000 handbag." },
      { id: "dutyFreeBuy", label: "Buy perfume at duty free", emoji: "🧴", minutes: 20, cost: 6500, needs: { fun: 22 }, moodlet: "fresh", tags: ["shop"], text: "You smell like a first-class ticket." },
      { id: "piano", label: "Play the terminal piano", emoji: "🎹", minutes: 30, needs: { fun: 18, social: 10 }, skills: { music: 2 }, tags: ["music"], rolls: [{ chance: 0.12, skill: "music", text: "A crowd gathers and films you. A tourist tips you KSh 1,000.", money: 1000, moodlet: "applause" }, { chance: 0.25, text: "A kid sits next to you and bangs out chopsticks. Duet!" }], text: "Travellers slow down with their trolleys to listen." },
      { id: "chargePhone", label: "Charge your phone at the gate", emoji: "🔌", minutes: 30, needs: { fun: 3 }, text: "Every socket has a queue. You find one behind a pillar." },
    ],
  },

  // Ngong Hills
  {
    id: "ngongHills", area: "ngong", name: "Ngong Hills", emoji: "⛰️", blurb: "Seven peaks, wind turbines and the Rift Valley.",
    actions: [
      { id: "hike", label: "Hike the seven peaks", emoji: "🥾", minutes: 300, cost: 300, open: [6, 14], needs: { fun: 40, energy: -30, hygiene: -20 }, skills: { fitness: 5, photography: 2 }, moodlet: "nature", tags: ["nature", "workout"], text: "Peak four nearly broke you. The view fixed it." },
    ],
  },
];
