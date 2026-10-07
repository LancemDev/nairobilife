import type { Choice, EventDef } from "../types";

const ok = (result: string, effect: Choice["effect"] = {}): Choice => ({ label: "Sawa", result, effect });

export const EVENTS: EventDef[] = [
  // --- Travel ---
  {
    id: "nganya", context: "travel:matatu", weight: 3, title: "Nganya vibes",
    text: "This matatu has LED lights, three screens and a sound system worth more than your rent. The makanga is dancing on the door.",
    choices: [
      { label: "Vibe along", result: "Best commute of your life.", effect: { needs: { fun: 15 }, moodlet: "nganya" } },
      { label: "Put in earphones", result: "You survive. Your ears are ringing.", effect: { needs: { energy: -3 } } },
    ],
  },
  {
    id: "change", context: "travel:matatu", weight: 3, title: "\"Tuko na shida ya change\"",
    text: "You paid with a KSh 200 note. The makanga has no change and keeps avoiding your eyes.",
    choices: [
      { label: "Let it go", result: "KSh 50 gone. That's Kanairo.", effect: { money: -50, moodlet: "noChange" } },
      {
        label: "Demand your change", odds: { base: 0.4, skill: "hustle" },
        result: "He finds the change. The whole matatu respects you now.", effect: { skills: { hustle: 1 }, needs: { fun: 4 } },
        fail: { result: "He drops you off early. You walk the rest.", effect: { money: -50, minutes: 25, needs: { energy: -6 }, moodlet: "noChange" } },
      },
    ],
  },
  {
    id: "crackdown", context: "travel:matatu", weight: 2, title: "NTSA crackdown",
    text: "Traffic police stop your matatu for \"loud music and excess passengers\". Everyone gets out.",
    choices: [ok("You walk the last stretch.", { minutes: 30, needs: { energy: -8 } })],
  },
  {
    id: "thikaJam", context: "travel:matatu", weight: 2, title: "Jam ya maana",
    text: "Total gridlock. The makanga takes the matatu onto the pavement. It doesn't help.",
    choices: [ok("Forty extra minutes. You know every billboard by heart now.", { minutes: 40, moodlet: "traffic" })],
  },
  {
    id: "shortcut", context: "travel:boda", weight: 3, title: "Shortcut!",
    text: "Your boda guy goes onto a footpath, through a market and between two buildings.",
    choices: [ok("Faster than Google Maps said. Your shoes are muddy.", { needs: { fun: 10, hygiene: -10 }, moodlet: "bodaThrill" })],
  },
  {
    id: "bodafall", context: "travel:boda", weight: 1, title: "Close call",
    text: "A matatu cuts in front of you and the boda swerves hard.",
    choices: [
      {
        label: "Hold on tight", odds: { base: 0.6, skill: "fitness" },
        result: "You hold on. Heart racing, but fine.", effect: { needs: { fun: 5 } },
        fail: { result: "You fall off. Scraped knee, clinic visit, KSh 800.", effect: { money: -800, needs: { hygiene: -20, fun: -10 }, minutes: 60 } },
      },
    ],
  },
  {
    id: "politics", context: "travel:cab", weight: 2, title: "Driver wants to talk politics",
    text: "\"Hii serikali, wewe unaonaje?\" He turns the radio down and waits.",
    choices: [
      { label: "Debate him", result: "Twenty minutes of debate. You both kept your opinions.", effect: { skills: { charm: 1 }, needs: { social: 10, fun: 5 } } },
      { label: "Pretend to sleep", result: "The fake nap turns into a real one.", effect: { needs: { energy: 6 } } },
    ],
  },
  {
    id: "smokieguy", context: "travel:walk", weight: 2, title: "Smokie guy at the stage",
    text: "The smell hits you before you see the cart.",
    choices: [
      { label: "Buy one (KSh 50)", result: "Worth it.", effect: { money: -50, needs: { hunger: 12 } } },
      { label: "Keep walking", result: "Discipline. Your stomach disagrees.", effect: { needs: { fun: -2 } } },
    ],
  },
  {
    id: "clamp", context: "travel:car", weight: 2, title: "Kanjo clamp!",
    text: "You parked for five minutes. The county askaris have clamped your wheel.",
    choices: [
      { label: "Pay the clamping fee (KSh 3,000)", result: "Unclamped. Lesson learned.", effect: { money: -3000, moodlet: "noChange" } },
      { label: "Negotiate", odds: { base: 0.35, skill: "charm" }, result: "They let you off with a warning.", effect: { skills: { charm: 1 } }, fail: { result: "Now it's KSh 5,000 plus towing. Ouch.", effect: { money: -5000, minutes: 60 } } },
    ],
  },
  {
    id: "motorcade", context: "travel:car", weight: 1, title: "Motorcade!",
    text: "Sirens. Uhuru Highway is closed for a VIP motorcade. Everyone waits.",
    choices: [ok("Thirty minutes of watching black cars go past.", { minutes: 30, moodlet: "traffic" })],
  },

  // --- Arrivals ---
  {
    id: "kanjo", context: "arrive:gikomba", weight: 2, title: "Kanjo raid!",
    text: "City council askaris are sweeping through the market. Everyone is running.",
    choices: [
      {
        label: "Run", odds: { base: 0.45, skill: "fitness" }, result: "You get away clean. Gikomba legend.", effect: { skills: { fitness: 1 }, needs: { energy: -8 }, moodlet: "gotAway" },
        fail: { result: "Caught. It costs KSh 500 to make it go away.", effect: { money: -500, moodlet: "arrested" } },
      },
      { label: "Stand still and look innocent", result: "They walk past you. Acting skills unlocked.", effect: { skills: { charm: 1 } } },
    ],
  },
  {
    id: "pickpocket", context: "arrive:cbd", weight: 2, when: (s) => !s.policies.includes("streetLights") && s.money > 1000, title: "Pinji alert",
    text: "Someone bumps into you at the stage. Your hand goes to your pocket…",
    choices: [
      {
        label: "Grab his arm", odds: { base: 0.4, skill: "fitness" }, result: "You catch him. The crowd handles the rest. Phone safe.", effect: { moodlet: "gotAway" },
        fail: { result: "Too late. He's gone with KSh 1,000.", effect: { money: -1000, moodlet: "scammed" } },
      },
    ],
  },
  {
    id: "westlandsContact", context: "arrive:westlands", weight: 1, title: "Familiar face",
    text: "Someone at a café recognises you from a meetup.",
    choices: [ok("You talk APIs over chai. Useful contact.", { skills: { tech: 1, charm: 1 }, needs: { social: 15 } })],
  },
  {
    id: "eastleighPrayer", context: "arrive:eastleigh", weight: 1, title: "Adhan",
    text: "The call to prayer rings out and the shutters come down for a few minutes.",
    choices: [ok("You get a cup of spiced tea while you wait.", { needs: { fun: 5 } })],
  },
  {
    id: "rongaiNganya", context: "arrive:rongai", weight: 2, title: "Nganya launch",
    text: "A brand-new nganya is being unveiled at the stage: graffiti, smoke machine, a DJ on the roof.",
    choices: [ok("You film everything. The video does numbers.", { needs: { fun: 20 }, skills: { photography: 1 }, moodlet: "nganya" })],
  },

  // --- Daily life ---
  {
    id: "cousin", context: "daily", weight: 3, title: "Message from shags",
    text: "Your cousin: \"Niaje! Mum says you're doing big things in Kanairo. Can you send 1,000 for school fees?\"",
    choices: [
      { label: "Send KSh 1,000", result: "Family is family. Black tax paid.", effect: { money: -1000, skills: { charm: 1 }, moodlet: "goodDeed" } },
      { label: "\"Mimi si bank\"", result: "You feel a little guilty.", effect: { moodlet: "guilty" } },
    ],
  },
  {
    id: "chama", context: "daily", weight: 2, title: "Chama day",
    text: "Your chama WhatsApp group: \"Contributions are due today, wapendwa 🙏🏾\"",
    choices: [
      { label: "Contribute KSh 1,000", result: "Saving together. You learn a bit about investing.", effect: { money: -1000, skills: { hustle: 2 }, needs: { social: 10 } } },
      { label: "Leave them on blue ticks", result: "Someone posts a pointed Bible verse.", effect: { skills: { charm: -1 } } },
    ],
  },
  {
    id: "funeral", context: "daily", weight: 1, title: "Funeral harambee",
    text: "A colleague lost their father. The MC will read out every contribution, to the shilling.",
    choices: [
      { label: "Contribute KSh 2,000", result: "\"…and from our dear friend, two thousand shillings!\" Applause.", effect: { money: -2000, needs: { social: 15 }, moodlet: "goodDeed" } },
      { label: "Contribute KSh 200", result: "\"…two hundred shillings.\" A small, polite clap.", effect: { money: -200, moodlet: "embarrassed" } },
      { label: "Send condolences", result: "You send a heartfelt message. Some people notice you didn't contribute.", effect: { moodlet: "guilty" } },
    ],
  },
  {
    id: "rain", context: "daily", weight: 2, title: "Long rains",
    text: "It's pouring and Ngong Road is flooding. Your shoes give up.",
    choices: [ok("Soaked. The city keeps going.", { needs: { hygiene: -10 }, moodlet: "rained" })],
  },
  {
    id: "naivasha", context: "daily", weight: 1, when: (s) => s.money > 5000, title: "Naivasha trip?",
    text: "The group chat is planning a last-minute trip to Naivasha. Leaving now.",
    choices: [
      { label: "Pack a bag (KSh 5,000)", result: "Boat rides, hippos, too much nyama. Unforgettable.", effect: { money: -5000, minutes: 600, needs: { fun: 45, social: 40, energy: -20 }, skills: { charm: 2 } } },
      { label: "\"Next time\"", result: "Your Instagram feed is painful today.", effect: { needs: { fun: -8 } } },
    ],
  },
  {
    id: "overtime", context: "daily", weight: 2, when: (s) => s.job !== null, title: "Boss on the phone",
    text: "\"Can you come in early tomorrow and stay late? We're short-staffed.\"",
    choices: [
      { label: "\"Sawa boss\"", result: "The boss notices. Performance up.", effect: { performance: 12, needs: { energy: -10, fun: -5 } } },
      { label: "\"Niko na issue kidogo\"", result: "The boss sighs loudly.", effect: { performance: -5 } },
    ],
  },
  {
    id: "scamCall", context: "daily", weight: 2, title: "\"Hii ni customer care…\"",
    text: "An SMS: \"Mpendwa, umetumiwa KSh 3,500 kimakosa. Tafadhali rudisha kwa 07xx…\"",
    choices: [
      { label: "Send it back", result: "Your balance never went up. Classic scam.", effect: { money: -3500, moodlet: "scammed" } },
      { label: "Check your M-Pesa first", result: "No money came in. Blocked and reported.", effect: { skills: { hustle: 1 } } },
    ],
  },
  {
    id: "betTip", context: "daily", weight: 2, title: "\"Sure bet hii\"",
    text: "Your boy Brayo: \"Bro, nimeshinda 40k on Ndege jana! Weka tu 2k, it's guaranteed.\"",
    choices: [
      { label: "Put KSh 2,000 on it", odds: { base: 0.3 }, result: "It hit! KSh 6,000 back. Don't get used to it.", effect: { money: 4000, moodlet: "bigWin" }, fail: { result: "The plane flew off with your 2k.", effect: { money: -2000, moodlet: "betLoss" } } },
      { label: "\"Hapana, Brayo\"", result: "Your M-Pesa thanks you.", effect: {} },
    ],
  },
  {
    id: "nikoKadi", context: "daily", weight: 2, when: (s) => !s.voter, title: "Niko Kadi!",
    text: "TikTok is full of Gen Z voter-registration dances. Your whole mbogi has registered.",
    choices: [ok("Register at the IEBC desk in KICC to join them.", { needs: { social: 5 } })],
  },
  {
    id: "landlordVisit", context: "daily", weight: 2, when: (s) => s.arrears > 0, title: "Landlord at the door",
    text: "Mzee landlord is knocking. \"Kijana, rent ni lini?\"",
    choices: [
      { label: "Beg for more time", odds: { base: 0.5, skill: "charm" }, result: "He gives you one more week. Pole pole.", effect: {}, fail: { result: "He threatens to remove your door.", effect: { moodlet: "landlord" } } },
    ],
  },
  {
    id: "crusade", context: "daily", weight: 1, title: "Crusade at Jeevanjee",
    text: "A loud crusade is setting up. The pastor promises miracles at 5pm.",
    choices: [
      { label: "Go and see", result: "Three hours of music, prayer and drama.", effect: { minutes: 180, needs: { fun: 15, social: 20 }, moodlet: "blessed" } },
      { label: "Skip it", result: "You can hear it from your house anyway.", effect: {} },
    ],
  },
  {
    id: "fuelHike", context: "daily", weight: 1, title: "Fuel prices up again",
    text: "EPRA has raised fuel prices. Matatu fares have jumped overnight.",
    choices: [ok("Everyone on X is furious. The memes are excellent.", { needs: { fun: 3 }, moodlet: "sapa" })],
  },

  // --- Arrest ---
  {
    id: "arrest", context: "arrest", weight: 1, title: "Arrested!",
    text: "\"Wewe! Kuja hapa.\" Two karao grab your arm. You're going to the station.",
    choices: [],
  },
];
