// Ported from the Swift GuardianHomeTests, plus room layout checks.
import { describe, expect, it } from 'vitest';
import { BasementEngine, HOME, homeAt, homeGuardian, visitLine } from '../src/basement';
import { LADDER_SPOT, PUZZLES, ROOM_SPAWN, roomNodes, roomSize } from '../src/rooms';
import type { Storage } from '../src/store';
import { SPOTS, TILE } from '../src/world';

const memory = (): Storage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};
const counter = (engine: BasementEngine, box: { n: number }) => {
  engine.onGuardianAwakened = () => (box.n += 1);
};

describe('guardian puzzles and homes', () => {
  it('keeps a solved puzzle after a relaunch and lets you call a missed guardian back', () => {
    const storage = memory();
    const engine = new BasementEngine(storage);
    engine.enterMap('root-sanctum');
    const encounters = { n: 0 };
    counter(engine, encounters);
    for (const rune of [0, 2, 1, 3]) engine.stepOnRune(rune);
    expect(encounters.n).toBe(1);
    const restored = new BasementEngine(storage);
    expect(restored.solved.has('root-sanctum')).toBe(true);
    expect(restored.runes).toEqual([0, 2, 1, 3]);
    restored.enterMap('root-sanctum');
    counter(restored, encounters);
    restored.retryGuardian('root-sanctum', false);
    expect(encounters.n).toBe(2);
    restored.retryGuardian('root-sanctum', true);
    expect(encounters.n).toBe(2);
  });

  it('replays without awarding another guardian or erasing progress', () => {
    const storage = memory();
    const engine = new BasementEngine(storage);
    engine.reconcileBefriendedGuardians(['koko-barrel']);
    engine.enterMap('root-sanctum');
    const encounters = { n: 0 };
    counter(engine, encounters);
    engine.startRootReplay();
    engine.stepOnRune(1);
    expect(engine.runes).toEqual([]);
    for (const rune of [0, 2, 1, 3]) engine.stepOnRune(rune);
    expect(encounters.n).toBe(0);
    expect(engine.replayingRunes).toBe(false);
    expect(new BasementEngine(storage).solved.has('root-sanctum')).toBe(true);
    engine.startRootReplay();
    engine.stepOnRune(0);
    engine.exitToOverworld();
    expect(engine.replayingRunes).toBe(false);
    expect(engine.runes).toEqual([0, 2, 1, 3]);
  });

  it('completes the homecoming once and rotates greetings', () => {
    const storage = memory();
    const engine = new BasementEngine(storage);
    engine.enterMap('root-sanctum');
    engine.beginGuardianVisit(true);
    expect(engine.visit?.page).toBe(0);
    const interrupted = new BasementEngine(storage);
    interrupted.enterMap('root-sanctum');
    interrupted.beginGuardianVisit(true);
    expect(interrupted.visit).not.toBeNull();
    for (let i = 0; i < 3; i++) engine.advanceGuardianVisit();
    expect(engine.visit).toBeNull();
    const restored = new BasementEngine(storage);
    restored.enterMap('root-sanctum');
    restored.beginGuardianVisit(true);
    expect(restored.visit).toBeNull();
    restored.beginGuardianVisit();
    const first = restored.visit && visitLine(restored.visit);
    restored.advanceGuardianVisit();
    expect(restored.visit).toBeNull();
    restored.beginGuardianVisit();
    expect(restored.visit && visitLine(restored.visit)).not.toBe(first);
  });

  it('migrates old friendships without clearing other puzzles', () => {
    const storage = memory();
    const engine = new BasementEngine(storage);
    engine.reconcileBefriendedGuardians(['koko-barrel', 'nami-tide']);
    engine.reconcileBefriendedGuardians(['tsuki-moon']);
    const restored = new BasementEngine(storage);
    expect([...restored.solved].sort()).toEqual(['echoing-cavern', 'root-sanctum', 'sunken-vault']);
    expect([...restored.valves].sort()).toEqual([0, 1, 2]);
    expect(restored.chimes).toEqual([2, 0, 1]);
  });

  it("recovers Nami's puzzle and replay across a relaunch", () => {
    const storage = memory();
    const engine = new BasementEngine(storage);
    engine.enterMap('sunken-vault');
    const encounters = { n: 0 };
    counter(engine, encounters);
    engine.turnValve(-1);
    expect(engine.valves.size).toBe(0);
    for (const valve of [2, 0, 1]) engine.turnValve(valve);
    expect(encounters.n).toBe(1);
    const restored = new BasementEngine(storage);
    restored.enterMap('sunken-vault');
    expect([...restored.valves].sort()).toEqual([0, 1, 2]);
    counter(restored, encounters);
    restored.retryGuardian('sunken-vault', false);
    expect(encounters.n).toBe(2);
    restored.startHomeReplay();
    restored.turnValve(0);
    restored.turnValve(0);
    expect(restored.valves.size).toBe(0);
    for (const valve of [1, 2, 0]) restored.turnValve(valve);
    expect(restored.replayingValves).toBe(false);
    expect(encounters.n).toBe(2);
    expect(restored.solved.has('sunken-vault')).toBe(true);
    restored.startHomeReplay();
    restored.turnValve(1);
    restored.exitToOverworld();
    expect(restored.replayingValves).toBe(false);
    expect([...restored.valves].sort()).toEqual([0, 1, 2]);
  });

  it('remembers separate welcomes per home and keeps an existing Koko save', () => {
    const storage = memory();
    storage.setItem(HOME.koko.welcomeKey, 'true');
    storage.setItem(HOME.koko.greetingKey, '2');
    const engine = new BasementEngine(storage);
    engine.enterMap('root-sanctum');
    engine.beginGuardianVisit(true);
    expect(engine.visit).toBeNull();
    engine.beginGuardianVisit();
    expect(engine.visit && visitLine(engine.visit)).toBe(HOME.koko.greetings[2]);
    engine.advanceGuardianVisit();
    engine.enterMap('sunken-vault');
    engine.beginGuardianVisit(true);
    expect(engine.visit?.home).toBe('nami');
    expect(engine.visit?.page).toBe(0);
    for (let i = 0; i < 3; i++) engine.advanceGuardianVisit();
    const restored = new BasementEngine(storage);
    restored.enterMap('sunken-vault');
    restored.beginGuardianVisit(true);
    expect(restored.visit).toBeNull();
    restored.beginGuardianVisit();
    expect(restored.visit && visitLine(restored.visit)).toBe(HOME.nami.greetings[0]);
    restored.advanceGuardianVisit();
    restored.beginGuardianVisit();
    expect(restored.visit && visitLine(restored.visit)).toBe(HOME.nami.greetings[1]);
  });

  it("doesn't use up Nami's welcome if you leave halfway", () => {
    const engine = new BasementEngine(memory());
    engine.enterMap('sunken-vault');
    engine.beginGuardianVisit(true);
    engine.advanceGuardianVisit();
    engine.exitToOverworld();
    expect(engine.visit).toBeNull();
    engine.enterMap('sunken-vault');
    engine.beginGuardianVisit(true);
    expect(engine.visit?.page).toBe(0);
    engine.exitToOverworld();
    engine.startTidalReplay();
    expect(engine.replayingValves).toBe(false);
  });

  it("recovers Akane's braziers and replays without a duplicate unlock", () => {
    const storage = memory();
    const engine = new BasementEngine(storage);
    engine.enterMap('magma-forge');
    const encounters = { n: 0 };
    counter(engine, encounters);
    engine.lightBrazier(4);
    expect(engine.braziers.size).toBe(0);
    for (const i of [3, 1, 0, 2]) engine.lightBrazier(i);
    expect(encounters.n).toBe(1);
    const restored = new BasementEngine(storage);
    restored.enterMap('magma-forge');
    expect([...restored.braziers].sort()).toEqual([0, 1, 2, 3]);
    counter(restored, encounters);
    restored.retryGuardian('magma-forge', false);
    expect(encounters.n).toBe(2);
    restored.retryGuardian('magma-forge', true);
    expect(encounters.n).toBe(2);
    restored.startHomeReplay();
    restored.lightBrazier(1);
    restored.lightBrazier(1);
    expect([...restored.braziers]).toEqual([1]);
    for (const i of [0, 2, 3]) restored.lightBrazier(i);
    expect(restored.replayingBraziers).toBe(false);
    expect(encounters.n).toBe(2);
    expect(new BasementEngine(storage).solved.has('magma-forge')).toBe(true);
    restored.startHomeReplay();
    restored.lightBrazier(0);
    restored.exitToOverworld();
    expect(restored.replayingBraziers).toBe(false);
    expect([...restored.braziers].sort()).toEqual([0, 1, 2, 3]);
  });

  it("keeps Akane's welcome independent and restarts an interrupted visit", () => {
    const storage = memory();
    storage.setItem(HOME.koko.welcomeKey, 'true');
    storage.setItem(HOME.nami.welcomeKey, 'true');
    const engine = new BasementEngine(storage);
    engine.enterMap('magma-forge');
    engine.beginGuardianVisit(true);
    expect(engine.visit?.home).toBe('akane');
    engine.advanceGuardianVisit();
    engine.exitToOverworld();
    const restored = new BasementEngine(storage);
    restored.enterMap('magma-forge');
    restored.beginGuardianVisit(true);
    expect(restored.visit?.page).toBe(0);
    for (let i = 0; i < 3; i++) restored.advanceGuardianVisit();
    const welcomed = new BasementEngine(storage);
    welcomed.enterMap('magma-forge');
    welcomed.beginGuardianVisit(true);
    expect(welcomed.visit).toBeNull();
    welcomed.beginGuardianVisit();
    expect(welcomed.visit && visitLine(welcomed.visit)).toBe(HOME.akane.greetings[0]);
    welcomed.advanceGuardianVisit();
    welcomed.beginGuardianVisit();
    expect(welcomed.visit && visitLine(welcomed.visit)).toBe(HOME.akane.greetings[1]);
    expect(storage.getItem(HOME.koko.welcomeKey)).toBe('true');
    expect(storage.getItem(HOME.nami.welcomeKey)).toBe('true');
  });

  it('maps each home to its guardian and blocks replays of unsolved puzzles', () => {
    expect(homeGuardian(homeAt('root-sanctum')!)).toBe('koko-barrel');
    expect(homeGuardian(homeAt('sunken-vault')!)).toBe('nami-tide');
    expect(homeGuardian(homeAt('magma-forge')!)).toBe('akane-crimson');
    expect(homeGuardian(homeAt('echoing-cavern')!)).toBe('tsuki-moon');
    const engine = new BasementEngine(memory());
    engine.enterMap('magma-forge');
    engine.startHomeReplay();
    expect(engine.replayingBraziers).toBe(false);
    engine.reconcileBefriendedGuardians(['akane-crimson']);
    expect(engine.solved.has('magma-forge')).toBe(true);
  });

  it("recovers Tsuki's chimes and replays without a duplicate unlock", () => {
    const storage = memory();
    const engine = new BasementEngine(storage);
    engine.enterMap('echoing-cavern');
    engine.startHomeReplay();
    expect(engine.replayingChimes).toBe(false);
    const encounters = { n: 0 };
    counter(engine, encounters);
    engine.strikeChime(-1);
    expect(engine.chimes).toEqual([]);
    engine.strikeChime(2);
    engine.strikeChime(1);
    expect(engine.chimes).toEqual([]);
    for (const note of [2, 0, 1]) engine.strikeChime(note);
    expect(encounters.n).toBe(1);
    const restored = new BasementEngine(storage);
    restored.enterMap('echoing-cavern');
    expect(restored.chimes).toEqual([2, 0, 1]);
    counter(restored, encounters);
    restored.retryGuardian('echoing-cavern', false);
    expect(encounters.n).toBe(2);
    restored.startHomeReplay();
    restored.strikeChime(0);
    expect(restored.chimes).toEqual([]);
    for (const note of [2, 0, 1]) restored.strikeChime(note);
    expect(restored.replayingChimes).toBe(false);
    restored.strikeChime(2);
    expect(encounters.n).toBe(2);
    restored.startHomeReplay();
    restored.strikeChime(2);
    expect(new BasementEngine(storage).chimes).toEqual([2, 0, 1]);
    restored.exitToOverworld();
    expect(restored.replayingChimes).toBe(false);
    expect(restored.chimes).toEqual([2, 0, 1]);
    expect(restored.solved.has('echoing-cavern')).toBe(true);
  });

  it("keeps the other homes' saves while Tsuki welcomes you once", () => {
    const storage = memory();
    for (const h of ['koko', 'nami', 'akane'] as const) {
      storage.setItem(HOME[h].welcomeKey, 'true');
      storage.setItem(HOME[h].greetingKey, '2');
    }
    const engine = new BasementEngine(storage);
    engine.enterMap('echoing-cavern');
    engine.beginGuardianVisit(true);
    expect(engine.visit?.home).toBe('tsuki');
    engine.advanceGuardianVisit();
    engine.exitToOverworld();
    engine.enterMap('echoing-cavern');
    engine.beginGuardianVisit(true);
    expect(engine.visit?.page).toBe(0);
    for (let i = 0; i < 3; i++) engine.advanceGuardianVisit();
    const restored = new BasementEngine(storage);
    restored.enterMap('echoing-cavern');
    restored.beginGuardianVisit(true);
    expect(restored.visit).toBeNull();
    for (const line of HOME.tsuki.greetings) {
      restored.beginGuardianVisit();
      expect(restored.visit && visitLine(restored.visit)).toBe(line);
      restored.advanceGuardianVisit();
    }
    restored.beginGuardianVisit();
    expect(restored.visit && visitLine(restored.visit)).toBe(HOME.tsuki.greetings[0]);
    for (const h of ['koko', 'nami', 'akane'] as const) {
      expect(storage.getItem(HOME[h].welcomeKey)).toBe('true');
      expect(storage.getItem(HOME[h].greetingKey)).toBe('2');
    }
  });

  it('survives a corrupt solved-puzzle save', () => {
    const storage = memory();
    storage.setItem('axis-meadows.sanctums.solved.v1', '{nope');
    expect(new BasementEngine(storage).solved.size).toBe(0);
  });
});

describe('rooms', () => {
  const none = () => false;

  it('shows the guardian star only for a solved puzzle whose guardian is not a friend', () => {
    const kinds = (solved: string[], friends: string[]) =>
      roomNodes('root-sanctum', new Set(solved as never[]), (id) => friends.includes(id)).map((n) => n.kind);
    expect(kinds([], [])).toEqual(['ladder', 'rune', 'rune', 'rune', 'rune']);
    expect(kinds(['root-sanctum'], [])).toContain('guardian');
    const home = kinds(['root-sanctum'], ['koko-barrel']);
    expect(home).toContain('resident');
    expect(home).not.toContain('guardian');
  });

  it('gives the Starfall Sanctum an exit and the star altar', () => {
    expect(roomNodes('starfall', new Set(), none).map((n) => n.label)).toEqual(['Exit to Axis Meadows', 'Approach Fallen Star Hoshi']);
  });

  it('keeps every puzzle piece inside its room, and spawns out of prompt range', () => {
    for (const [map, puzzle] of Object.entries(PUZZLES)) {
      const { cols, rows } = roomSize(map as keyof typeof PUZZLES);
      for (const s of puzzle.spots) {
        expect(s.x).toBeGreaterThan(TILE);
        expect(s.x).toBeLessThan((cols - 1) * TILE);
        expect(s.y).toBeGreaterThan(TILE);
        expect(s.y).toBeLessThan((rows - 1) * TILE);
        expect(Math.hypot(s.x - ROOM_SPAWN.x, s.y - ROOM_SPAWN.y)).toBeGreaterThanOrEqual(24); // no rune underfoot on arrival
      }
    }
    expect(Math.hypot(LADDER_SPOT.x - ROOM_SPAWN.x, LADDER_SPOT.y - ROOM_SPAWN.y)).toBeGreaterThan(75);
  });

  it('links each basement portal to the basement of its own biome', () => {
    const portals = SPOTS.filter((s) => s.portal && s.portal !== 'starfall');
    expect(portals.map((s) => s.portal).sort()).toEqual(['echoing-cavern', 'magma-forge', 'root-sanctum', 'sunken-vault']);
    const biomeOf = { 'root-sanctum': 'whisperingGrove', 'sunken-vault': 'stardustShore', 'magma-forge': 'emberglade', 'echoing-cavern': 'crystalHollow' } as const;
    for (const s of portals) expect(s.biome).toBe(biomeOf[s.portal as keyof typeof biomeOf]);
  });
});
