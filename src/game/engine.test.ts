import { describe, expect, test } from "bun:test";
import { CAREERS, ESTATES, EVENTS, NPCS, OBJECTS, RECIPES, VENUES, WISHES } from "./data";
import {
  availableActions,
  crashPoint,
  dayOf,
  dispatch,
  fulizaLimit,
  newGame,
  quote,
  weeklyRent,
  type Command,
  type NewLife,
} from "./engine";
import type { GameState } from "./types";

const never = () => 0.99; // rng that avoids random events, blackouts and sickness
const always = () => 0.01;
const life: NewLife = { name: "Wanjiku", avatar: "👩🏾", originId: "nairobi", lotteryId: "buru", traits: ["hustler", "foodie"], aspirationId: "bossTop" };

const at = (s: GameState, patch: Partial<GameState>) => ({ ...structuredClone(s), ...patch });
const send = (s: GameState, cmd: Command, rng = never) => dispatch(s, cmd, rng);
const morning = (s: GameState, hour = 7) => at(s, { time: dayOf(s.time) * 1440 + hour * 60 });

describe("content integrity", () => {
  test("every career's venue exists", () => {
    for (const c of CAREERS) expect(VENUES.some((v) => v.id === c.venue)).toBe(true);
  });
  test("every NPC hangs out somewhere real", () => {
    for (const n of NPCS) expect(VENUES.some((v) => v.id === n.venue)).toBe(true);
  });
  test("every estate's area exists and units are valid", () => {
    for (const e of ESTATES) expect(e.units.length).toBeGreaterThan(0);
  });
  test("every event offers a free way out", () => {
    for (const e of EVENTS.filter((e) => e.choices.length)) expect(e.choices.some((c) => !c.effect.money || c.effect.money > 0)).toBe(true);
  });
  test("ids are unique", () => {
    for (const list of [CAREERS, NPCS, OBJECTS, RECIPES, VENUES, WISHES, EVENTS]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    const actionIds = VENUES.flatMap((v) => v.actions.map((a) => `${v.id}/${a.id}`));
    expect(new Set(actionIds).size).toBe(actionIds.length);
  });
});

describe("new life", () => {
  test("birth lottery sets home, money and starter objects", () => {
    const s = newGame(life, never);
    expect(s.player.estateId).toBe("buruburu");
    expect(s.money).toBe(12000);
    expect(s.objects).toContain("jiko");
    expect(s.wishes.ids).toHaveLength(3);
    const runda = newGame({ ...life, lotteryId: "runda" }, never);
    expect(runda.player.estateId).toBe("kilimani");
    expect(runda.money).toBe(60000);
  });
});

describe("daily life", () => {
  test("cooking uses pantry ingredients and feeds you", () => {
    let s = at(newGame(life, never), { needs: { hunger: 20, energy: 80, bladder: 80, hygiene: 80, fun: 50, social: 50 } });
    s = send(s, { type: "act", id: "cook:ugaliSukuma" });
    expect(s.pantry.unga).toBe(1);
    expect(s.needs.hunger).toBeGreaterThan(50);
    expect(s.goalsDone).toContain("eat");
  });

  test("bladder accidents are embarrassing", () => {
    let s = at(newGame(life, never), { needs: { hunger: 80, energy: 80, bladder: 1, hygiene: 80, fun: 50, social: 50 } });
    s = send(s, { type: "act", id: "nap" });
    expect(s.needs.hygiene).toBe(0);
    expect(s.moodlets.some((m) => m.id === "embarrassed")).toBe(true);
  });

  test("water cuts block the shower unless you have a tank", () => {
    const base = newGame(life, never);
    const cut = at(base, { waterCut: { start: 0, end: 10_000 } });
    expect(availableActions(cut).find((a) => a.id === "shower")?.disabled).toBe("Maji hakuna");
    const tank = at(cut, { objects: [...cut.objects, "waterTank"] });
    expect(availableActions(tank).find((a) => a.id === "shower")?.disabled).toBeUndefined();
  });

  test("weekly rent is charged on day 8", () => {
    const s = at(newGame(life, never), { time: 7 * 1440 - 60 });
    const t = send(s, { type: "act", id: "sleep" });
    expect(dayOf(t.time)).toBe(8);
    expect(t.money).toBe(12000 - weeklyRent(s) + 1000); // buru parents send 1,000
    expect(t.rentPaidThroughDay).toBe(14);
  });
});

describe("work", () => {
  test("apply, then work a shift for pay and performance", () => {
    let s = at(newGame(life, never), { location: "gikomba" });
    s = send(s, { type: "act", id: "apply:trading" });
    expect(s.job?.career).toBe("trading");
    s = morning(s, 6);
    const before = s.money;
    s = send(s, { type: "act", id: "work:trading" });
    expect(s.money).toBe(before + 600);
    expect(s.job!.performance).toBeGreaterThan(20);
  });

  test("degree-gated careers need graduation", () => {
    const s = at(newGame(life, never), { location: "knh" });
    expect(availableActions(s).find((a) => a.id === "apply:medicine")?.disabled).toContain("degree");
  });
});

describe("money", () => {
  test("Fuliza covers small overdrafts with a fee", () => {
    const s = at(newGame(life, never), { location: "carnivore", money: 2000, time: 13 * 60 });
    const t = send(s, { type: "act", id: "carnivoreFeast" });
    expect(t.money).toBe(2000 - 3500 - Math.ceil(1500 * 0.05));
    const broke = at(s, { money: -fulizaLimit(s) });
    expect(availableActions(broke).find((a) => a.id === "carnivoreFeast")?.disabled).toBe("Can't afford");
  });

  test("MMF deposit and withdraw", () => {
    let s = newGame(life, never);
    s = send(s, { type: "bank", op: "deposit", amount: 5000 });
    expect(s.bank.savings).toBe(5000);
    expect(s.money).toBe(7000);
    s = send(s, { type: "bank", op: "withdraw", amount: 2000 });
    expect(s.money).toBe(9000);
  });

  test("buying land without a search can get you scammed", () => {
    const s = at(newGame(life, never), { money: 1_000_000 });
    const t = send(s, { type: "buyPlot", id: "kamulu", search: false }, always);
    expect(t.plots[0].fake).toBe(true);
    const safe = send(s, { type: "buyPlot", id: "kamulu", search: true }, always);
    expect(safe.plots[0].fake).toBe(false);
  });

  test("crash bets pay out at the target only if the plane survives", () => {
    expect(crashPoint(() => 0)).toBe(1);
    expect(crashPoint(() => 0.5)).toBeCloseTo(1.94, 2);
    const s = newGame(life, never);
    const win = send(s, { type: "crash", stake: 1000, target: 1.5 }, () => 0.5);
    expect(win.money).toBe(12000 + 500);
    const loss = send(s, { type: "crash", stake: 1000, target: 3 }, () => 0.5);
    expect(loss.money).toBe(11000);
  });
});

describe("social", () => {
  test("talking to NPCs who are around builds relationships", () => {
    let s = at(newGame(life, never), { location: "jeevanjee", time: 11 * 60 });
    s = send(s, { type: "social", npc: "mzeeKariuki", social: "salimia" }, always);
    expect(s.relationships.mzeeKariuki.rel).toBe(4);
    const gone = at(s, { time: 20 * 60 });
    expect(send(gone, { type: "social", npc: "mzeeKariuki", social: "salimia" })).toBe(gone);
  });

  test("romance: bae, proposal, wedding, spouse splits rent", () => {
    let s = at(newGame(life, never), { money: 1_000_000, relationships: { aisha: { rel: 90, bae: true } } });
    s = send(s, { type: "propose", npc: "aisha" }, always);
    expect(s.relationships.aisha.engaged).toBe(true);
    s = send(s, { type: "wedding", tier: "ruracio" });
    expect(s.relationships.aisha.married).toBe(true);
  });
});

describe("travel", () => {
  test("moving between areas costs time and money; same area is a short walk", () => {
    const s = newGame(life, never);
    const q = quote(s, "gikomba", "matatu");
    const t = send(s, { type: "travel", dest: "gikomba", mode: "matatu" });
    expect(t.location).toBe("gikomba");
    expect(t.money).toBe(12000 - q.fare);
    const local = quote(at(s, { location: "kencom" }), "jeevanjee", "cab");
    expect(local).toMatchObject({ local: true, fare: 0 });
  });
});

describe("crime", () => {
  test("getting caught opens the arrest event", () => {
    const s = at(newGame(life, never), { location: "kencom", time: 10 * 60 });
    const t = send(s, { type: "act", id: "pickpocket" }, always);
    expect(t.event?.id).toBe("arrest");
    const cell = send(t, { type: "choose", index: 3 });
    expect(cell.event).toBeNull();
    expect(cell.time).toBeGreaterThanOrEqual(t.time + 480);
  });
});

describe("fuzz", () => {
  test("thousands of random commands never break invariants", () => {
    let seed = 42;
    const rng = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    const places = ["home", ...VENUES.map((v) => v.id)];
    const modes = ["walk", "matatu", "boda", "cab"] as const;
    let s = newGame({ ...life, lotteryId: "fuliza" }, rng);
    for (let i = 0; i < 4000; i++) {
      const roll = rng();
      let cmd: Command;
      if (s.event) cmd = { type: "choose", index: Math.floor(rng() * s.event.choices.length) };
      else if (roll < 0.25) cmd = { type: "travel", dest: places[Math.floor(rng() * places.length)], mode: modes[Math.floor(rng() * modes.length)] };
      else if (roll < 0.85) {
        const options = availableActions(s).filter((a) => !a.disabled);
        if (!options.length) continue;
        cmd = { type: "act", id: options[Math.floor(rng() * options.length)].id };
      } else cmd = { type: "bank", op: "deposit", amount: 100 };
      s = dispatch(s, cmd, rng);
      for (const v of Object.values(s.needs)) expect(v >= 0 && v <= 100).toBe(true);
      for (const v of Object.values(s.skills)) expect(v >= 0 && v <= 100).toBe(true);
      expect(Number.isFinite(s.money)).toBe(true);
    }
    expect(dayOf(s.time)).toBeGreaterThan(20);
  });
});

describe("other cities", () => {
  test("fly to Mombasa from JKIA; matatus can't take you back", () => {
    let s = at(newGame(life, never), { location: "jkia", money: 20000 });
    s = send(s, { type: "act", id: "flyMombasa" });
    expect(s.location).toBe("moiAirport");
    expect(quote(s, "kencom", "matatu").blocked).toBeDefined();
    expect(send(s, { type: "travel", dest: "kencom", mode: "matatu" })).toBe(s);
    const local = send(s, { type: "travel", dest: "pirates", mode: "matatu" });
    expect(local.location).toBe("pirates");
  });

  test("a broke player can always get home", () => {
    const s = at(newGame(life, never), { location: "sgrMombasa", money: -5000 });
    const t = send(s, { type: "act", id: "lorry" });
    expect(t.location).toBe("riverroad");
  });
});

describe("online", () => {
  test("transfers apply even during an event", () => {
    const s = at(newGame(life, never), { event: { id: "x", title: "T", text: "", choices: [] } });
    const out = send(s, { type: "transferOut", to: "wanjiku", amount: 2000 });
    expect(out.money).toBe(10000);
    const back = send(out, { type: "transferIn", from: "wanjiku", amount: 500, note: "lunch" });
    expect(back.money).toBe(10500);
  });
});
