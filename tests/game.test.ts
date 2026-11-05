import { describe, expect, it } from 'vitest';
import { ROSTER } from '../src/data';
import { EncounterEngine } from '../src/encounter';
import { Chibidex, type Storage } from '../src/store';

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
