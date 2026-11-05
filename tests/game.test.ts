import { describe, expect, it } from 'vitest';
import { ARCHIVE_BY_ID, ARCHIVE_ENTRIES, SANCTUARY_SCENES, SANCTUARY_STILLS } from '../src/archive';
import { ALL_PATH_STATES, pathAutotileState } from '../src/assets';
import { ROSTER } from '../src/data';
import { EncounterEngine } from '../src/encounter';
import { Chibidex, type Storage } from '../src/store';
import { TILE, biomeAt, isWalkable } from '../src/world';

const memory = (): Storage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};
const seq = (...values: number[]) => () => values.shift() ?? 0.99;

describe('chibidex', () => {
  it('starts with all 18 chibis and saves befriending', () => {
    const storage = memory();
    const dex = new Chibidex(storage);
    expect(dex.totalCount).toBe(18);
    dex.markBefriended('luna-breeze');
    dex.setBuddy('luna-breeze');
    const reloaded = new Chibidex(storage);
    expect(reloaded.entry('luna-breeze').befriended).toBe(true);
    expect(reloaded.entry('luna-breeze').friendshipCount).toBe(1);
    expect(reloaded.buddy?.chibiID).toBe('luna-breeze');
    expect(reloaded.befriendedCount).toBe(1);
  });

  it('counts crests from the four guardians', () => {
    const dex = new Chibidex(memory());
    for (const id of ['koko-barrel', 'nami-tide', 'akane-crimson']) dex.markBefriended(id);
    expect(dex.crestCount).toBe(3);
    expect(dex.starfallUnlocked).toBe(false);
    dex.markBefriended('tsuki-moon');
    expect(dex.starfallUnlocked).toBe(true);
  });

  it('survives a corrupt save', () => {
    const storage = memory();
    storage.setItem('axis-meadows.chibidex.v1', '{not json');
    expect(new Chibidex(storage).totalCount).toBe(ROSTER.length);
  });
});

describe('encounters', () => {
  it('gives two safe grass steps, then rolls', () => {
    const dex = new Chibidex(memory());
    // step 3 roll 0.1 < 0.20 triggers; rarity roll 0.1 -> common; pick index 0
    const engine = new EncounterEngine(dex, seq(0.1, 0.1, 0));
    expect(engine.stepTaken('wildflowerFields')).toBe(false);
    expect(engine.stepTaken('wildflowerFields')).toBe(false);
    expect(engine.stepTaken('wildflowerFields')).toBe(true);
    expect(engine.active?.id).toBe('luna-breeze');
    expect(dex.entry('luna-breeze').encounterCount).toBe(1);
  });

  it('only offers wild-grass chibis from the biome', () => {
    const dex = new Chibidex(memory());
    for (let i = 0; i < 200; i++) {
      const engine = new EncounterEngine(dex);
      for (let s = 0; s < 40 && !engine.active; s++) engine.stepTaken('crystalHollow');
      if (engine.active) expect(['hikari-stardust', 'tsuki-moon']).toContain(engine.active.id);
    }
  });

  it('applies the sweet-talk bonus and caps at 95%', () => {
    const dex = new Chibidex(memory());
    const engine = new EncounterEngine(dex, seq(0.5));
    engine.checkHiddenSpot('crystal-star-pool', 'crystalHollow'); // Hoshi, celestial 15%
    expect(engine.active?.id).toBe('hoshi-star');
    expect(engine.attemptBefriend(true)).toBe(false); // 0.5 > 0.35
    expect(engine.result).toBe('shy');
    const lucky = new EncounterEngine(dex, seq(0.3));
    lucky.checkHiddenSpot('crystal-star-pool', 'crystalHollow');
    expect(lucky.attemptBefriend(true)).toBe(true); // 0.3 <= 0.35
    expect(dex.entry('hoshi-star').befriended).toBe(true);
  });
});

describe('violet archive and sanctuary heart', () => {
  it('catalogues all 18 chibis with 6 memory stills each (108 total)', () => {
    expect(ARCHIVE_ENTRIES.length).toBe(18);
    let totalStills = 0;
    for (const entry of ARCHIVE_ENTRIES) {
      expect(ARCHIVE_BY_ID[entry.chibi.id]).toBe(entry);
      expect(entry.stills.length).toBe(6);
      expect(entry.keeperNotes.length).toBeGreaterThan(10);
      expect(entry.habitatSecrets.length).toBeGreaterThan(10);
      expect(entry.favoriteTreat.length).toBeGreaterThan(5);
      entry.stills.forEach((st, idx) => {
        expect(st.id).toBe(idx + 1);
        expect(st.requiredFriendship).toBe((idx + 1) * 100);
        expect(st.assetKey).toBe(`${entry.chibi.id}-still-${idx + 1}`);
        totalStills += 1;
      });
    }
    expect(totalStills).toBe(108);
    expect(SANCTUARY_STILLS.length).toBe(6);
  });

  it('tracks bond milestones and still unlocks up to 600', () => {
    const dex = new Chibidex(memory());
    expect(dex.unlockedStillCount('tsuki-moon')).toBe(0);
    dex.giftBond('tsuki-moon', 250);
    expect(dex.friendshipCount('tsuki-moon')).toBe(250);
    expect(dex.unlockedStillCount('tsuki-moon')).toBe(2);
    expect(dex.progressToNextStill('tsuki-moon')).toEqual({ current: 50, target: 100, percent: 0.5 });
    dex.giftBond('tsuki-moon', 400);
    expect(dex.friendshipCount('tsuki-moon')).toBe(600);
    expect(dex.unlockedStillCount('tsuki-moon')).toBe(6);
    expect(dex.totalUnlockedStills(false)).toBe(6);
    expect(dex.totalUnlockedStills(true)).toBe(108);
  });

  it('places both TSUKI-AND-FOX sanctuary scenes on walkable tiles in their biomes', () => {
    expect(SANCTUARY_SCENES.length).toBe(2);
    for (const sc of SANCTUARY_SCENES) {
      const [col, row] = sc.tile;
      expect(biomeAt(col, row)).toBe(sc.biome);
      expect(isWalkable(col * TILE + TILE / 2, row * TILE + TILE / 2)).toBe(true);
    }
  });

  it('maps all 16 cardinal path neighbor combinations to unique autotile states', () => {
    const seen = new Set<string>();
    for (const n of [false, true]) {
      for (const e of [false, true]) {
        for (const s of [false, true]) {
          for (const w of [false, true]) {
            seen.add(pathAutotileState(n, e, s, w));
          }
        }
      }
    }
    expect(seen.size).toBe(16);
    for (const st of ALL_PATH_STATES) expect(seen.has(st)).toBe(true);
  });
});
