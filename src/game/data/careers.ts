import type { Career } from "../types";

const WEEKENDS_OFF = [5, 6];
const SUNDAY_OFF = [6];

export const CAREERS: Career[] = [
  {
    id: "tech", name: "Tech", emoji: "💻", venue: "techhub", skill: "tech", shiftHours: 8, start: [8, 12], off: WEEKENDS_OFF,
    levels: [
      { title: "Dev Intern", pay: 1500, req: { tech: 15 } },
      { title: "Junior Developer", pay: 3500, req: { tech: 30 } },
      { title: "Senior Developer", pay: 7000, req: { tech: 50 } },
      { title: "Tech Lead", pay: 12000, req: { tech: 65, charm: 25 } },
      { title: "CTO", pay: 22000, req: { tech: 80, charm: 40 } },
    ],
  },
  {
    id: "banking", name: "Banking", emoji: "🏦", venue: "bank", skill: "charm", shiftHours: 8, start: [7, 10], off: WEEKENDS_OFF,
    levels: [
      { title: "Bank Teller", pay: 1800, req: { charm: 15, tech: 10 } },
      { title: "Relationship Officer", pay: 3500, req: { charm: 30, hustle: 20 } },
      { title: "Branch Manager", pay: 7500, req: { charm: 45, hustle: 35 }, degree: true },
      { title: "Regional Manager", pay: 13000, req: { charm: 60, hustle: 50 }, degree: true },
      { title: "MD & CEO", pay: 30000, req: { charm: 75, hustle: 65 }, degree: true },
    ],
  },
  {
    id: "music", name: "Gengetone", emoji: "🎤", venue: "riverroad", skill: "music", shiftHours: 6, start: [10, 20], off: [],
    levels: [
      { title: "Hook Singer", pay: 600, req: {} },
      { title: "Studio Rat", pay: 1200, req: { music: 20 } },
      { title: "Opening Act", pay: 3500, req: { music: 35, dance: 20 } },
      { title: "Headliner", pay: 10000, req: { music: 55, charm: 35 } },
      { title: "Gengetone Legend", pay: 28000, req: { music: 75, charm: 50 } },
    ],
  },
  {
    id: "trading", name: "Market Trading", emoji: "🧺", venue: "gikomba", skill: "hustle", shiftHours: 6, start: [5, 11], off: SUNDAY_OFF,
    levels: [
      { title: "Mama Mboga's Helper", pay: 600, req: {} },
      { title: "Stall Owner", pay: 1300, req: { hustle: 20 } },
      { title: "Wholesaler", pay: 3200, req: { hustle: 40 } },
      { title: "Eastleigh Importer", pay: 8000, req: { hustle: 60, charm: 25 } },
      { title: "Gikomba Kingpin", pay: 16000, req: { hustle: 75 } },
    ],
  },
  {
    id: "matatu", name: "Matatu", emoji: "🚐", venue: "kencom", skill: "hustle", shiftHours: 8, start: [5, 10], off: [],
    levels: [
      { title: "Tout at the Stage", pay: 700, req: {} },
      { title: "Makanga (Conductor)", pay: 1100, req: { hustle: 15, charm: 10 } },
      { title: "Nganya Driver", pay: 2000, req: { hustle: 25, fitness: 20 } },
      { title: "Nganya Owner", pay: 6500, req: { hustle: 45 } },
      { title: "SACCO Chairman", pay: 15000, req: { hustle: 60, charm: 45 } },
    ],
  },
  {
    id: "boda", name: "Boda Boda", emoji: "🏍️", venue: "kencom", skill: "fitness", shiftHours: 8, start: [6, 15], off: [],
    levels: [
      { title: "Rider (Rented Bike)", pay: 900, req: { fitness: 10 } },
      { title: "Rider (Own Bike)", pay: 1700, req: { fitness: 20, hustle: 15 } },
      { title: "Stage Chairman", pay: 3200, req: { hustle: 30, charm: 25 } },
      { title: "Delivery Fleet Owner", pay: 7000, req: { hustle: 45, tech: 20 } },
      { title: "Logistics Boss", pay: 14000, req: { hustle: 60, tech: 35 } },
    ],
  },
  {
    id: "nursing", name: "Nursing", emoji: "🩺", venue: "knh", skill: "charm", shiftHours: 8, start: [6, 20], off: [],
    levels: [
      { title: "Student Nurse", pay: 800, req: { fitness: 10 } },
      { title: "Staff Nurse", pay: 2800, req: { charm: 25, fitness: 15 }, degree: true },
      { title: "Senior Nurse", pay: 4500, req: { charm: 40 }, degree: true },
      { title: "Matron", pay: 8000, req: { charm: 55, hustle: 30 }, degree: true },
      { title: "Chief Nursing Officer", pay: 14000, req: { charm: 70, hustle: 45 }, degree: true },
    ],
  },
  {
    id: "medicine", name: "Medicine", emoji: "👩🏾‍⚕️", venue: "knh", skill: "tech", shiftHours: 10, start: [6, 14], off: [],
    levels: [
      { title: "Intern Doctor", pay: 3000, req: { tech: 30 }, degree: true },
      { title: "Medical Officer", pay: 6500, req: { tech: 45 }, degree: true },
      { title: "Registrar", pay: 10000, req: { tech: 55, charm: 30 }, degree: true },
      { title: "Consultant", pay: 18000, req: { tech: 70, charm: 40 }, degree: true },
      { title: "Hospital CEO", pay: 32000, req: { tech: 75, charm: 60, hustle: 40 }, degree: true },
    ],
  },
  {
    id: "salon", name: "Salon & Kinyozi", emoji: "💇🏾", venue: "kenyattaMarket", skill: "charm", shiftHours: 7, start: [7, 12], off: SUNDAY_OFF,
    levels: [
      { title: "Salon Assistant", pay: 600, req: {} },
      { title: "Barber / Stylist", pay: 1200, req: { charm: 15 } },
      { title: "Braiding Pro", pay: 2500, req: { charm: 30, photography: 10 } },
      { title: "Salon Manager", pay: 4500, req: { charm: 45, hustle: 30 } },
      { title: "Salon Chain Boss", pay: 11000, req: { charm: 60, hustle: 50 } },
    ],
  },
  {
    id: "chef", name: "Chef", emoji: "👨🏾‍🍳", venue: "carnivore", skill: "cooking", shiftHours: 8, start: [9, 15], off: [],
    levels: [
      { title: "Dishwasher", pay: 700, req: {} },
      { title: "Line Cook", pay: 1400, req: { cooking: 15 } },
      { title: "Sous Chef", pay: 3500, req: { cooking: 35 } },
      { title: "Head Chef", pay: 7500, req: { cooking: 55, charm: 25 } },
      { title: "Celebrity Chef", pay: 18000, req: { cooking: 75, charm: 45 } },
    ],
  },
  {
    id: "waiter", name: "Hospitality", emoji: "🍽️", venue: "carnivore", skill: "charm", shiftHours: 7, start: [11, 17], off: [],
    levels: [
      { title: "Waiter", pay: 900, req: {} },
      { title: "Head Waiter", pay: 1600, req: { charm: 25 } },
      { title: "Floor Manager", pay: 3200, req: { charm: 40, hustle: 25 } },
      { title: "Restaurant GM", pay: 7000, req: { charm: 55, hustle: 40 } },
      { title: "Hotelier", pay: 16000, req: { charm: 70, hustle: 55 } },
    ],
  },
  {
    id: "dj", name: "DJ", emoji: "🎧", venue: "k1", skill: "music", shiftHours: 6, start: [20, 23], off: [0, 1],
    levels: [
      { title: "Hype Man", pay: 800, req: { dance: 10 } },
      { title: "Resident DJ", pay: 2500, req: { music: 25 } },
      { title: "Club Headliner", pay: 6000, req: { music: 45, dance: 25 } },
      { title: "Festival DJ", pay: 14000, req: { music: 60, charm: 35 } },
      { title: "Global DJ", pay: 30000, req: { music: 75, charm: 50 } },
    ],
  },
  {
    id: "fitnessCoach", name: "Fitness", emoji: "🏋🏾", venue: "gym", skill: "fitness", shiftHours: 6, start: [5, 14], off: SUNDAY_OFF,
    levels: [
      { title: "Gym Floor Assistant", pay: 700, req: { fitness: 15 } },
      { title: "Personal Trainer", pay: 2000, req: { fitness: 30 } },
      { title: "Head Coach", pay: 4000, req: { fitness: 45, charm: 25 } },
      { title: "Gym Manager", pay: 7000, req: { fitness: 55, hustle: 35 } },
      { title: "Fitness Mogul", pay: 15000, req: { fitness: 70, photography: 40 } },
    ],
  },
  {
    id: "creator", name: "Content Creator", emoji: "📸", venue: "contenthouse", skill: "photography", shiftHours: 6, start: [9, 18], off: [],
    levels: [
      { title: "Aspiring Creator", pay: 400, req: {} },
      { title: "Micro-Influencer", pay: 1500, req: { photography: 20, charm: 15 } },
      { title: "Brand Ambassador", pay: 5000, req: { photography: 35, charm: 30 } },
      { title: "Content Mogul", pay: 12000, req: { photography: 55, comedy: 25 } },
      { title: "Celebrity Influencer", pay: 26000, req: { photography: 70, charm: 55 } },
    ],
  },
  {
    id: "teaching", name: "Teaching", emoji: "👩🏾‍🏫", venue: "school", skill: "charm", shiftHours: 8, start: [7, 8], off: WEEKENDS_OFF,
    levels: [
      { title: "BOM Teacher", pay: 900, req: { tech: 10 } },
      { title: "TSC Teacher", pay: 2200, req: { charm: 20, tech: 20 }, degree: true },
      { title: "Head of Department", pay: 3500, req: { charm: 35, tech: 30 }, degree: true },
      { title: "Deputy Head", pay: 5000, req: { charm: 45, hustle: 25 }, degree: true },
      { title: "School Proprietor", pay: 12000, req: { charm: 55, hustle: 50 }, degree: true },
    ],
  },
  {
    id: "football", name: "Football", emoji: "⚽", venue: "stadium", skill: "comedy", shiftHours: 6, start: [12, 18], off: [0, 1],
    levels: [
      { title: "Viewing Centre Attendant", pay: 600, req: {} },
      { title: "Match Commentator", pay: 1500, req: { comedy: 20, charm: 15 } },
      { title: "Radio Pundit", pay: 3500, req: { comedy: 35, charm: 30 } },
      { title: "TV Pundit", pay: 8000, req: { comedy: 50, charm: 45 } },
      { title: "Football Agent", pay: 18000, req: { hustle: 60, charm: 55 } },
    ],
  },
  {
    id: "law", name: "Law", emoji: "⚖️", venue: "milimani", skill: "charm", shiftHours: 9, start: [7, 10], off: WEEKENDS_OFF,
    levels: [
      { title: "Law Clerk", pay: 1500, req: { charm: 15 } },
      { title: "Associate", pay: 4500, req: { charm: 30, tech: 20 }, degree: true },
      { title: "Senior Associate", pay: 9000, req: { charm: 45, hustle: 30 }, degree: true },
      { title: "Partner", pay: 18000, req: { charm: 60, hustle: 45 }, degree: true },
      { title: "Senior Counsel", pay: 35000, req: { charm: 75, hustle: 60 }, degree: true },
    ],
  },
  {
    id: "civil", name: "Civil Service", emoji: "🏛️", venue: "kicc", skill: "hustle", shiftHours: 8, start: [8, 9], off: WEEKENDS_OFF,
    levels: [
      { title: "Huduma Clerk", pay: 1300, req: { tech: 10 } },
      { title: "Administrative Officer", pay: 3000, req: { charm: 25, tech: 20 }, degree: true },
      { title: "Assistant Director", pay: 6000, req: { charm: 40, hustle: 30 }, degree: true },
      { title: "Director", pay: 11000, req: { charm: 50, hustle: 45 }, degree: true },
      { title: "Principal Secretary", pay: 24000, req: { charm: 65, hustle: 60 }, degree: true },
    ],
  },
  {
    id: "radio", name: "Broadcasting", emoji: "📻", venue: "radio", skill: "comedy", shiftHours: 5, start: [5, 7], off: WEEKENDS_OFF,
    levels: [
      { title: "Intern Reporter", pay: 800, req: { charm: 10 } },
      { title: "Newsroom Reporter", pay: 2000, req: { charm: 25, tech: 15 } },
      { title: "On-Air Presenter", pay: 5000, req: { comedy: 35, charm: 35 } },
      { title: "Programme Director", pay: 10000, req: { comedy: 50, hustle: 35 } },
      { title: "Station Manager", pay: 18000, req: { charm: 60, hustle: 50 } },
    ],
  },
  {
    id: "aviation", name: "Aviation", emoji: "✈️", venue: "jkia", skill: "fitness", shiftHours: 10, start: [4, 16], off: [3],
    levels: [
      { title: "Cabin Crew", pay: 2500, req: { charm: 25, fitness: 20 } },
      { title: "Senior Purser", pay: 5000, req: { charm: 40, fitness: 25 } },
      { title: "First Officer", pay: 12000, req: { tech: 50, fitness: 35 }, degree: true },
      { title: "Captain", pay: 22000, req: { tech: 65, fitness: 40 }, degree: true },
      { title: "Chief Pilot", pay: 35000, req: { tech: 75, charm: 50 }, degree: true },
    ],
  },
  {
    id: "callcentre", name: "Call Centre", emoji: "☎️", venue: "callcentre", skill: "charm", shiftHours: 8, start: [7, 11], off: [6],
    levels: [
      { title: "Customer Care Agent", pay: 1200, req: { charm: 10 } },
      { title: "Team Lead", pay: 2400, req: { charm: 30 } },
      { title: "Operations Manager", pay: 5000, req: { charm: 45, tech: 20 } },
      { title: "Country Manager", pay: 11000, req: { charm: 60, hustle: 40 }, degree: true },
      { title: "BPO Founder", pay: 22000, req: { charm: 70, hustle: 60 } },
    ],
  },
  {
    id: "security", name: "Security", emoji: "💂🏾", venue: "sarit", skill: "fitness", shiftHours: 10, start: [17, 20], off: [],
    levels: [
      { title: "Night Watchman", pay: 700, req: {} },
      { title: "Mall Guard", pay: 1100, req: { fitness: 15 } },
      { title: "Shift Supervisor", pay: 2200, req: { fitness: 25, charm: 20 } },
      { title: "Security Manager", pay: 4500, req: { fitness: 35, hustle: 30 } },
      { title: "Security Firm Owner", pay: 11000, req: { hustle: 55, charm: 40 } },
    ],
  },
];

export const WORK_TONES = [
  { id: "normal", label: "Fanya Kazi", emoji: "🧑🏾‍💼", desc: "Steady pace." },
  { id: "hard", label: "Kaza Mshipi", emoji: "🔥", desc: "Big performance, drains energy and fun." },
  { id: "gist", label: "Piga Story", emoji: "💬", desc: "Social up, performance slow." },
  { id: "suckUp", label: "Lamba Boss", emoji: "🙇🏾", desc: "Charm helps. Risky." },
  { id: "chill", label: "Pole Pole", emoji: "😴", desc: "Save energy. Performance drops." },
];
