import type { Grocery, HomeObject, Recipe } from "../types";

export const OBJECTS: HomeObject[] = [
  // sleep
  { id: "mattress", name: "Foam mattress", emoji: "🛏️", cat: "sleep", price: 2500, desc: "On the floor. It works.", quality: 0.8 },
  { id: "springBed", name: "Spring bed", emoji: "🛏️", cat: "sleep", price: 14000, desc: "Proper bed, proper sleep.", quality: 1 },
  { id: "kingBed", name: "King-size bed", emoji: "👑", cat: "sleep", price: 65000, desc: "Hotel-level sleep.", quality: 1.25 },
  // kitchen
  { id: "jiko", name: "Charcoal jiko", emoji: "🔥", cat: "kitchen", price: 800, desc: "Slow, smoky, works through blackouts.", quality: 0.85 },
  { id: "gasCooker", name: "Gas cooker", emoji: "🍳", cat: "kitchen", price: 6500, desc: "Two burners and a refill every month.", quality: 1 },
  { id: "fridge", name: "Fridge", emoji: "🧊", cat: "kitchen", price: 38000, desc: "Cold soda, and groceries cost 10% less (bulk buying)." },
  // bath
  { id: "bucket", name: "Bucket & basin", emoji: "🪣", cat: "bath", price: 400, desc: "The Kenyan shower.", quality: 0.8 },
  { id: "shower", name: "Instant shower", emoji: "🚿", cat: "bath", price: 8500, desc: "Hot water when there's water and power.", quality: 1.15 },
  { id: "toilet", name: "Own toilet", emoji: "🚽", cat: "bath", price: 12000, desc: "No more queueing for the plot toilet." },
  { id: "waterTank", name: "Water tank", emoji: "🛢️", cat: "bath", price: 25000, desc: "Rationing? Not your problem." },
  // comfort
  { id: "plasticChairs", name: "Plastic chairs", emoji: "🪑", cat: "comfort", price: 1500, desc: "Every Kenyan home has them." },
  { id: "sofa", name: "Sofa set", emoji: "🛋️", cat: "comfort", price: 18000, desc: "Five-seater with the doilies." },
  { id: "bigSofa", name: "Leather sectional", emoji: "🛋️", cat: "comfort", price: 85000, desc: "You sink in and never get up.", quality: 1.3 },
  // fun
  { id: "radio", name: "Radio", emoji: "📻", cat: "fun", price: 1500, desc: "Morning shows and Sunday Rhumba. Runs on batteries." },
  { id: "tv", name: "Smart TV", emoji: "📺", cat: "fun", price: 28000, desc: "Showmax, YouTube, local news.", quality: 1 },
  { id: "bigTv", name: "75\" TV", emoji: "📺", cat: "fun", price: 120000, desc: "The derby looks real.", quality: 1.4 },
  { id: "console", name: "Game console", emoji: "🎮", cat: "fun", price: 85000, desc: "FIFA with the boys." },
  { id: "speaker", name: "Party speaker", emoji: "🔊", cat: "fun", price: 12000, desc: "The neighbours hate it." },
  { id: "dog", name: "Simba the dog", emoji: "🐕", cat: "fun", price: 3000, desc: "Local breed, loyal, loud." },
  // skill
  { id: "bookshelf", name: "Bookshelf", emoji: "📚", cat: "skill", price: 5000, desc: "Read to learn." },
  { id: "laptop", name: "Laptop", emoji: "💻", cat: "skill", price: 60000, desc: "Code, freelance, apply for jobs." },
  { id: "guitar", name: "Guitar", emoji: "🎸", cat: "skill", price: 9000, desc: "Practise music." },
  { id: "dumbbells", name: "Dumbbells", emoji: "🏋🏾", cat: "skill", price: 6000, desc: "Home workouts." },
  { id: "mirror", name: "Standing mirror", emoji: "🪞", cat: "skill", price: 3000, desc: "Practise jokes and pick-up lines." },
  { id: "ringLight", name: "Ring light", emoji: "💡", cat: "skill", price: 4500, desc: "Shoot content at home." },
  { id: "camera", name: "DSLR camera", emoji: "📷", cat: "skill", price: 90000, desc: "Serious photography.", quality: 1.5 },
  // power
  { id: "lamp", name: "Rechargeable lamp", emoji: "🔦", cat: "power", price: 900, desc: "Read during blackouts." },
  { id: "generator", name: "Generator", emoji: "⛽", cat: "power", price: 45000, desc: "Power during KPLC cuts (fuel KSh 300 per cut)." },
  { id: "solar", name: "Solar + inverter", emoji: "☀️", cat: "power", price: 140000, desc: "Free power during cuts." },
  // decor
  { id: "plant", name: "Potted plant", emoji: "🪴", cat: "decor", price: 800, desc: "Small mood boost at home." },
  { id: "kikoy", name: "Kikoy throws", emoji: "🧣", cat: "decor", price: 2500, desc: "Colour everywhere." },
  { id: "art", name: "Maasai-market art", emoji: "🖼️", cat: "decor", price: 6000, desc: "Very cultured." },
  { id: "curtains", name: "Silk curtains", emoji: "🪟", cat: "decor", price: 9000, desc: "Your mum would approve." },
  // luxury
  { id: "chandelier", name: "Chandelier", emoji: "💎", cat: "luxury", price: 350000, desc: "For the photos." },
  { id: "jacuzzi", name: "Jacuzzi", emoji: "🛁", cat: "luxury", price: 900000, desc: "Peak relaxation.", quality: 1.5 },
  { id: "homeCinema", name: "Home cinema", emoji: "🎬", cat: "luxury", price: 1500000, desc: "Why go to Two Rivers?", quality: 1.8 },
  { id: "poolTable", name: "Pool table", emoji: "🎱", cat: "luxury", price: 450000, desc: "Hustle your friends." },
];

/** Prices are per meal portion. */
export const GROCERIES: Grocery[] = [
  { id: "unga", name: "Unga (maize flour)", emoji: "🌽", price: 60 },
  { id: "sukuma", name: "Sukuma wiki", emoji: "🥬", price: 30 },
  { id: "tomato", name: "Tomatoes", emoji: "🍅", price: 20 },
  { id: "onion", name: "Onions", emoji: "🧅", price: 15 },
  { id: "eggs", name: "Eggs (x3)", emoji: "🥚", price: 60 },
  { id: "beef", name: "Beef", emoji: "🥩", price: 250 },
  { id: "chicken", name: "Kienyeji chicken", emoji: "🍗", price: 450 },
  { id: "rice", name: "Pishori rice", emoji: "🍚", price: 70 },
  { id: "beans", name: "Beans", emoji: "🫘", price: 60 },
  { id: "atta", name: "Atta (wheat flour)", emoji: "🌾", price: 50 },
  { id: "oil", name: "Cooking oil", emoji: "🫗", price: 40 },
  { id: "milk", name: "Milk", emoji: "🥛", price: 50 },
  { id: "tea", name: "Tea leaves", emoji: "🍃", price: 10 },
  { id: "sugar", name: "Sugar", emoji: "🍬", price: 20 },
  { id: "potatoes", name: "Potatoes", emoji: "🥔", price: 50 },
  { id: "bread", name: "Bread", emoji: "🍞", price: 65 },
  { id: "pilau", name: "Pilau masala", emoji: "🧂", price: 20 },
  { id: "githeriMix", name: "Githeri mix", emoji: "🥣", price: 60 },
  { id: "omena", name: "Omena", emoji: "🐟", price: 80 },
];

/** What the mama mboga at your estate stocks. */
export const MAMA_MBOGA = ["unga", "sukuma", "tomato", "onion", "eggs", "potatoes", "githeriMix", "omena", "milk", "bread", "tea", "sugar"];

export const RECIPES: Recipe[] = [
  { id: "chai", name: "Chai", emoji: "🫖", needs: { tea: 1, milk: 1, sugar: 1 }, minutes: 15, hunger: 6, fun: 6, cooking: 0 },
  { id: "breadTea", name: "Bread & chai", emoji: "🍞", needs: { bread: 1, tea: 1, milk: 1 }, minutes: 15, hunger: 25, fun: 5, cooking: 0 },
  { id: "ugaliSukuma", name: "Ugali sukuma", emoji: "🥬", needs: { unga: 1, sukuma: 1, tomato: 1 }, minutes: 45, hunger: 50, fun: 3, cooking: 0 },
  { id: "chipsMayai", name: "Chips mayai", emoji: "🍳", needs: { potatoes: 1, eggs: 1, oil: 1 }, minutes: 35, hunger: 50, fun: 10, cooking: 5 },
  { id: "githeri", name: "Githeri", emoji: "🥣", needs: { githeriMix: 1, tomato: 1, onion: 1 }, minutes: 60, hunger: 55, fun: 4, cooking: 5 },
  { id: "omenaUgali", name: "Omena & ugali", emoji: "🐟", needs: { omena: 1, unga: 1, tomato: 1 }, minutes: 45, hunger: 55, fun: 6, cooking: 10 },
  { id: "chapatiBeans", name: "Chapati madondo", emoji: "🫓", needs: { atta: 1, oil: 1, beans: 1, onion: 1 }, minutes: 75, hunger: 60, fun: 10, cooking: 15 },
  { id: "ugaliBeef", name: "Ugali & beef stew", emoji: "🍲", needs: { unga: 1, beef: 1, tomato: 1, onion: 1 }, minutes: 60, hunger: 65, fun: 12, cooking: 15 },
  { id: "chickenStew", name: "Kienyeji chicken & rice", emoji: "🍗", needs: { chicken: 1, rice: 1, tomato: 1, onion: 1 }, minutes: 90, hunger: 75, fun: 18, cooking: 25 },
  { id: "pilauDish", name: "Beef pilau", emoji: "🍛", needs: { rice: 1, beef: 1, pilau: 1, onion: 1, oil: 1 }, minutes: 80, hunger: 75, fun: 20, cooking: 30 },
];

/** Food delivery app menu (delivered in 40 minutes, KSh 100 fee). */
export const DELIVERY_MENU = [
  { id: "chipsKuku", name: "Chips kuku", emoji: "🍗", price: 650, hunger: 50, fun: 10 },
  { id: "smocha", name: "Smocha (smokie + chapati)", emoji: "🌯", price: 120, hunger: 25, fun: 5 },
  { id: "pilauDelivery", name: "Pilau & kachumbari", emoji: "🍛", price: 500, hunger: 55, fun: 8 },
  { id: "pizza", name: "Large pizza", emoji: "🍕", price: 1400, hunger: 65, fun: 18 },
  { id: "burger", name: "Burger & fries", emoji: "🍔", price: 950, hunger: 55, fun: 14 },
  { id: "biryaniDelivery", name: "Chicken biryani", emoji: "🍚", price: 700, hunger: 60, fun: 12 },
];
export const DELIVERY_FEE = 100;
export const SUPERMARKET_VENUES = ["trm", "tworivers", "sarit", "villageMarket", "hubKaren"];
