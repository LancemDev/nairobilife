import { CAREERS } from "./careers";
import { ASPIRATIONS, BIRTH_LOTTERY, MOODLETS, ORIGINS, REWARDS, TRAITS, WISHES } from "./character";
import { BUSINESSES, CARS, COURSES, OFFICES, PLOTS, POLICIES, SICKNESSES } from "./economy";
import { GROCERIES, OBJECTS, RECIPES } from "./home";
import { CITY_AREAS, CITY_NPCS, CITY_VENUES } from "./cities";
import { NPCS as NAIROBI_NPCS, SOCIALS } from "./people";
import { AREAS as NAIROBI_AREAS, ESTATES, UNITS, VENUES as NAIROBI_VENUES } from "./places";

export * from "./careers";
export * from "./character";
export * from "./economy";
export * from "./events";
export * from "./home";
export { relLabel, WEDDING_TIERS, RING_COST, DATE_COST, SOCIALS } from "./people";
export { ESTATES, UNITS } from "./places";
export { CITY_AREAS };

/** Nairobi plus the cities you can fly or train to. */
export const AREAS = [...NAIROBI_AREAS, ...CITY_AREAS];
export const VENUES = [...NAIROBI_VENUES, ...CITY_VENUES];
export const NPCS = [...NAIROBI_NPCS, ...CITY_NPCS];


const byId = <T extends { id: string }>(list: T[]) => Object.fromEntries(list.map((x) => [x.id, x])) as Record<string, T>;

export const AREA = byId(AREAS);
export const VENUE = byId(VENUES);
export const ESTATE = byId(ESTATES);
export const UNIT = byId(UNITS);
export const CAREER = byId(CAREERS);
export const TRAIT = byId(TRAITS);
export const MOODLET = byId(MOODLETS);
export const REWARD = byId(REWARDS);
export const WISH = byId(WISHES);
export const ASPIRATION = byId(ASPIRATIONS);
export const LOTTERY = byId(BIRTH_LOTTERY);
export const ORIGIN = byId(ORIGINS);
export const NPC = byId(NPCS);
export const SOCIAL = byId(SOCIALS);
export const OBJECT = byId(OBJECTS);
export const GROCERY = byId(GROCERIES);
export const RECIPE = byId(RECIPES);
export const BUSINESS = byId(BUSINESSES);
export const PLOT = byId(PLOTS);
export const CAR = byId(CARS);
export const SICKNESS = byId(SICKNESSES);
export const OFFICE = byId(OFFICES);
export const POLICY = byId(POLICIES);
export const COURSE = byId(COURSES);
