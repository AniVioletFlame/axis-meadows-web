// Encounter rules, ported from EncounterEngine.swift.

import { befriendRate, byID, forBiome, hidden, wildGrass, type Biome, type Chibi, type Rarity } from './data';
import type { Chibidex } from './store';

export type Result = 'befriended' | 'shy' | null;

const SPOT_TO_CHIBI: Record<string, string> = {
  'grove-barrel': 'koko-barrel',
  'grove-mushroom': 'kaede-leaf',
  'crystal-shrine': 'tsuki-moon',
  'crystal-bell': 'suzu-bell',
  'crystal-star-pool': 'hoshi-star',
  'ember-lantern': 'hotaru-firefly',
  'ember-hollow-tree': 'tsubaki-ember',
  'shore-tidepool': 'nami-tide',
  'shore-driftwood': 'aoi-current',
  'meadow-old-well': 'hana-petal',
};

export class EncounterEngine {
  readonly safeSteps = 2;
  readonly baseChance = 0.18;
  readonly sweetTalkBonus = 0.2;

  active: Chibi | null = null;
  result: Result = null;
  private stepsSince = 0;
  private listeners = new Set<() => void>();

  constructor(private dex: Chibidex, private rng: () => number = Math.random) {}

  onChange(fn: () => void) {
    this.listeners.add(fn);
  }
  private emit() {
    for (const fn of this.listeners) fn();
  }

  /** Called once per new tall-grass tile. Returns true if an encounter starts. */
  stepTaken(biome: Biome): boolean {
    this.stepsSince += 1;
    if (this.stepsSince <= this.safeSteps) return false;
    const ramp = (this.stepsSince - this.safeSteps) * 0.02;
    const chance = Math.min(this.baseChance + ramp, 0.4);
    if (this.rng() < chance) {
      this.trigger(biome);
      return this.active !== null;
    }
    return false;
  }

  private trigger(biome: Biome) {
    this.stepsSince = 0;
    const pool = wildGrass(biome);
    if (!pool.length) return;
    const roll = this.rng();
    const rarity: Rarity = roll < 0.5 ? 'common' : roll < 0.8 ? 'uncommon' : roll < 0.95 ? 'rare' : 'celestial';
    const filtered = pool.filter((c) => c.rarity === rarity);
    const list = filtered.length ? filtered : pool;
    this.begin(list[Math.floor(this.rng() * list.length)]);
  }

  checkHiddenSpot(spotID: string, biome: Biome): boolean {
    const mapped = SPOT_TO_CHIBI[spotID];
    let target = mapped ? byID(mapped) : undefined;
    if (!target) {
      const list = hidden(biome);
      const all = forBiome(biome);
      target = list[0] ?? all[Math.floor(this.rng() * all.length)];
    }
    if (!target) return false;
    this.begin(target);
    return true;
  }

  private begin(chibi: Chibi) {
    this.active = chibi;
    this.result = null;
    this.dex.incrementEncounter(chibi.id);
    this.emit();
  }

  attemptBefriend(sweetTalked: boolean): boolean {
    const chibi = this.active;
    if (!chibi) return false;
    const chance = Math.min(befriendRate(chibi) + (sweetTalked ? this.sweetTalkBonus : 0), 0.95);
    const ok = this.rng() <= chance;
    this.result = ok ? 'befriended' : 'shy';
    if (ok) this.dex.markBefriended(chibi.id);
    this.emit();
    return ok;
  }

  /** Wave goodbye, or close after befriending. */
  clear() {
    this.active = null;
    this.result = null;
    this.emit();
  }
}
