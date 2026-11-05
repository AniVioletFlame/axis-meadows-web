// Basement puzzles, guardian homes and visits, ported from BasementEngine.swift.

import type { Biome } from './data';
import type { Storage } from './store';

export type BasementType = 'root-sanctum' | 'sunken-vault' | 'magma-forge' | 'echoing-cavern';
export type ActiveMap = 'overworld' | 'starfall' | BasementType;
export type HomeID = 'koko' | 'nami' | 'akane' | 'tsuki';

export const BASEMENT_TYPES: BasementType[] = ['root-sanctum', 'sunken-vault', 'magma-forge', 'echoing-cavern'];
export const isBasement = (m: ActiveMap): m is BasementType => (BASEMENT_TYPES as string[]).includes(m);

export const BASEMENT: Record<BasementType, { name: string; biome: Biome; guardianID: string; puzzleHint: string }> = {
  'root-sanctum': {
    name: 'Root Sanctum', biome: 'whisperingGrove', guardianID: 'koko-barrel',
    puzzleHint: 'Step on the 4 ancient leaf runes in harmonic resonance.',
  },
  'sunken-vault': {
    name: 'Sunken Vault', biome: 'stardustShore', guardianID: 'nami-tide',
    puzzleHint: 'Turn all 3 tidal valves to flood the center star pool.',
  },
  'magma-forge': {
    name: 'Magma Forge', biome: 'emberglade', guardianID: 'akane-crimson',
    puzzleHint: 'Light all 4 flame braziers to awaken the crimson forge.',
  },
  'echoing-cavern': {
    name: 'Echoing Cavern', biome: 'crystalHollow', guardianID: 'tsuki-moon',
    puzzleHint: 'Strike the 3 crystal chimes in harmonic pitch order.',
  },
};

export const SUPREME_CELESTIAL = 'hoshi-star';

export function mapName(m: ActiveMap): string {
  if (m === 'overworld') return 'Axis Meadows';
  if (m === 'starfall') return 'Starfall Sanctum';
  return BASEMENT[m].name;
}

const KEY_PREFIX = 'axis-meadows.';

interface HomeDef {
  basement: BasementType; name: string; title: string; hint: string; replayTitle: string;
  welcome: string[]; greetings: string[]; welcomeKey: string; greetingKey: string;
}

const home = (id: HomeID, def: Omit<HomeDef, 'welcomeKey' | 'greetingKey'>): HomeDef => ({
  ...def,
  welcomeKey: `${KEY_PREFIX}sanctums.${id}.homecoming.v1`,
  greetingKey: `${KEY_PREFIX}sanctums.${id}.greeting.v1`,
});

export const HOMES: HomeID[] = ['koko', 'nami', 'akane', 'tsuki'];

export const HOME: Record<HomeID, HomeDef> = {
  koko: home('koko', {
    basement: 'root-sanctum', name: 'Koko', title: 'Koko’s Root Home',
    hint: 'A warm nook among the roots. Visit Koko, or play the leaf-song.',
    replayTitle: 'Play the leaf-song',
    welcome: [
      'You came back! I tucked some cushions between the roots. Come sit with me?',
      'The runes can stay. They make lovely little night-lights. And we can still play our leaf-song together.',
      'I saved you the soft cushion. This place feels like home now.',
    ],
    greetings: [
      'Shh... the roots are napping. I saved a crunchy acorn biscuit for you.',
      'I tried counting the leaves. Fell asleep at seven. Want to sit a while?',
      'Our leaf-song still works! A little game, then a very important snack break?',
      "You're here. Good. The other cushion was getting lonely.",
    ],
  }),
  nami: home('nami', {
    basement: 'sunken-vault', name: 'Nami', title: 'Nami’s Tidepool Home',
    hint: 'Shells, soft tides, and tea for two. Visit Nami, or play with the currents.',
    replayTitle: 'Play with the tides',
    welcome: [
      'There you are! I found shells for the pool and made us a floating tea tray. Mind the little waves!',
      'The old valves still guide the currents. Open all three and watch the water dance. No guardian duties today—just us.',
      'I used to listen for footsteps up above. Now I can put the kettle on when I hear yours. Welcome home.',
    ],
    greetings: [
      'Your cup drifted over to mine. I think the tide wants us to stay for tea.',
      'I found a shell that sounds like rain. Here—listen with me.',
      'Want to wake the currents? Three little valves, one very unnecessary splash!',
      'Nothing washed away while you were gone. Your spot is still right here.',
    ],
  }),
  akane: home('akane', {
    basement: 'magma-forge', name: 'Akane', title: 'Akane’s Hearth Home',
    hint: 'A gentle hearth beneath the forge. Visit Akane, or kindle the four flames.',
    replayTitle: 'Kindle the hearth',
    welcome: [
      'You returned. Good! A guardian should know how to keep a guest warm. I made us a place by the hearth.',
      'My flames warm without burning. The four braziers still answer to us—light them together and watch the hearth bloom.',
      "The forge can rest tonight. Sit beside me. You needn't prove your courage every time you come home.",
    ],
    greetings: [
      'I guarded the last toasted bun with my life. It is yours. Naturally.',
      'Even a fierce flame needs somewhere quiet to rest. That cushion is for you.',
      'Four braziers, one blooming hearth. Shall we wake it together?',
      "Your hands look cold. Come closer—the fire knows you're a friend.",
    ],
  }),
  tsuki: home('tsuki', {
    basement: 'echoing-cavern', name: 'Tsuki', title: 'Tsuki’s Moonlit Home',
    hint: 'Moonlight, soft cushions, and a song. Visit Tsuki, or ring the crystal chimes.',
    replayTitle: 'Play the moon-song',
    welcome: [
      'Oh... your footsteps. I know their rhythm now. I made a quiet little place for us beneath the crystals.',
      'The chimes still remember our song: high, low, then middle. We can play it whenever you like. The moon will listen.',
      'I left a book open and a cushion beside mine. You can tell me about your day... or we can just be quiet together.',
    ],
    greetings: [
      'I saved our page. Though I may have read the same sentence three times while waiting for your footsteps.',
      'Listen... the crystals are humming. I think they remember you, too.',
      'High, low, middle. A little moon-song before we settle in?',
      "You don't have to fill the quiet. I'm happy sharing it with you.",
    ],
  }),
};

export const homeAt = (m: ActiveMap): HomeID | null => HOMES.find((h) => HOME[h].basement === m) ?? null;
export const homeGuardian = (h: HomeID) => BASEMENT[HOME[h].basement].guardianID;

export interface Visit { home: HomeID; isHomecoming: boolean; lines: string[]; page: number }
export const visitLine = (v: Visit) => v.lines[v.page];
export const isLastPage = (v: Visit) => v.page === v.lines.length - 1;

const SOLVED_KEY = `${KEY_PREFIX}sanctums.solved.v1`;

export class BasementEngine {
  currentMap: ActiveMap = 'overworld';
  solved = new Set<BasementType>();
  message: string | null = null;
  visit: Visit | null = null;

  runes: number[] = [];
  valves = new Set<number>();
  braziers = new Set<number>();
  chimes: number[] = [];
  readonly targetRunes = [0, 2, 1, 3];
  readonly targetChimes = [2, 0, 1];

  replayingRunes = false;
  replayingValves = false;
  replayingBraziers = false;
  replayingChimes = false;

  onGuardianAwakened: ((chibiID: string) => void) | null = null;
  private listeners = new Set<() => void>();

  constructor(private storage: Storage | null) {
    try {
      const raw = storage?.getItem(SOLVED_KEY);
      const list = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(list)) for (const t of list) if (isBasement(t)) this.solved.add(t);
    } catch {
      /* a corrupt value just means nothing solved yet */
    }
    this.restoreCompletedVisuals();
  }

  onChange(fn: () => void) {
    this.listeners.add(fn);
  }
  private emit() {
    for (const fn of this.listeners) fn();
  }

  private get(key: string) {
    try {
      return this.storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  private set(key: string, value: string) {
    try {
      this.storage?.setItem(key, value);
    } catch {
      /* storage full or blocked */
    }
  }

  /** Older saves know the guardian friendship but not the puzzle state. */
  reconcileBefriendedGuardians(ids: Iterable<string>) {
    const set = new Set(ids);
    for (const t of BASEMENT_TYPES) if (set.has(BASEMENT[t].guardianID)) this.solved.add(t);
    this.persistSolved();
    this.restoreCompletedVisuals();
    this.emit();
  }

  private persistSolved() {
    this.set(SOLVED_KEY, JSON.stringify([...this.solved].sort()));
  }

  private restoreCompletedVisuals() {
    if (this.solved.has('root-sanctum')) this.runes = [...this.targetRunes];
    if (this.solved.has('sunken-vault')) this.valves = new Set([0, 1, 2]);
    if (this.solved.has('magma-forge')) this.braziers = new Set([0, 1, 2, 3]);
    if (this.solved.has('echoing-cavern')) this.chimes = [...this.targetChimes];
  }

  /** A solved room whose guardian was not befriended can call the guardian back. */
  retryGuardian(type: BasementType, isBefriended: boolean) {
    if (this.currentMap !== type || !this.solved.has(type) || isBefriended) return;
    this.onGuardianAwakened?.(BASEMENT[type].guardianID);
  }

  beginGuardianVisit(isHomecoming = false) {
    const h = homeAt(this.currentMap);
    if (!h || this.visit) return;
    const def = HOME[h];
    if (isHomecoming) {
      if (this.get(def.welcomeKey) === 'true') return;
      this.visit = { home: h, isHomecoming: true, lines: def.welcome, page: 0 };
    } else {
      const stored = Number.parseInt(this.get(def.greetingKey) ?? '0', 10);
      const index = Math.max(0, Number.isFinite(stored) ? stored : 0) % def.greetings.length;
      this.visit = { home: h, isHomecoming: false, lines: [def.greetings[index]], page: 0 };
      this.set(def.greetingKey, String((index + 1) % def.greetings.length));
    }
    this.emit();
  }

  advanceGuardianVisit() {
    const v = this.visit;
    if (!v) return;
    if (isLastPage(v)) {
      // The welcome only counts as seen once its last line is dismissed.
      if (v.isHomecoming) this.set(HOME[v.home].welcomeKey, 'true');
      this.visit = null;
    } else {
      this.visit = { ...v, page: v.page + 1 };
    }
    this.emit();
  }

  startHomeReplay() {
    switch (homeAt(this.currentMap)) {
      case 'koko': return this.startRootReplay();
      case 'nami': return this.startTidalReplay();
      case 'akane': return this.startBrazierReplay();
      case 'tsuki': return this.startChimeReplay();
    }
  }

  startRootReplay() {
    if (this.currentMap !== 'root-sanctum' || !this.solved.has('root-sanctum')) return;
    this.replayingRunes = true;
    this.runes = [];
    this.say('Koko\'s leaf-song: left, right, top, bottom. Just for fun!');
  }
  startTidalReplay() {
    if (this.currentMap !== 'sunken-vault' || !this.solved.has('sunken-vault')) return;
    this.replayingValves = true;
    this.valves = new Set();
    this.say("Nami's tide game: open all three valves and watch the currents dance!");
  }
  startBrazierReplay() {
    if (this.currentMap !== 'magma-forge' || !this.solved.has('magma-forge')) return;
    this.replayingBraziers = true;
    this.braziers = new Set();
    this.say("Akane's hearth game: kindle all four braziers to make the fire bloom!");
  }
  startChimeReplay() {
    if (this.currentMap !== 'echoing-cavern' || !this.solved.has('echoing-cavern')) return;
    this.replayingChimes = true;
    this.chimes = [];
    this.say("Tsuki's moon-song: high, low, then middle. Let the moonlight dance!");
  }

  enterMap(map: ActiveMap) {
    this.replayingRunes = false;
    this.replayingValves = false;
    this.replayingBraziers = false;
    this.replayingChimes = false;
    this.visit = null;
    this.restoreCompletedVisuals();
    this.currentMap = map;
    this.message = null;
    this.emit();
  }

  exitToOverworld() {
    this.enterMap('overworld');
  }

  private say(text: string) {
    this.message = text;
    this.emit();
  }

  private solve(type: BasementType, text: string) {
    this.solved.add(type);
    this.persistSolved();
    this.say(text);
    this.onGuardianAwakened?.(BASEMENT[type].guardianID);
  }

  // Puzzle 1: Root Sanctum leaf runes, stepped on in order.
  stepOnRune(index: number): boolean {
    if (this.currentMap !== 'root-sanctum' || !Number.isInteger(index) || index < 0 || index > 3) return false;
    if (!this.replayingRunes && this.solved.has('root-sanctum')) {
      this.say('The leaf rune hums warmly beneath your feet.');
      return false;
    }
    const step = this.runes.length;
    if (index === this.targetRunes[step]) {
      this.runes = [...this.runes, index];
      if (this.runes.length === this.targetRunes.length) {
        if (this.replayingRunes) {
          this.replayingRunes = false;
          this.say('Koko claps! A perfect leaf-song. Time for biscuits.');
          return true;
        }
        this.solve('root-sanctum', '🌿 The ancient roots part! Guardian Koko awakens!');
        return true;
      }
      this.say(`✨ Rune ${step + 1}/4 glows with harmony!`);
    } else {
      this.runes = [];
      this.say('💨 The glyphs dim... Harmony broken. Try again!');
    }
    return false;
  }

  // Puzzle 2: Sunken Vault tidal valves, toggled open in any order.
  turnValve(index: number): boolean {
    if (this.currentMap !== 'sunken-vault' || !Number.isInteger(index) || index < 0 || index > 2) return false;
    if (!this.replayingValves && this.solved.has('sunken-vault')) {
      this.say('The valve sends a gentle ripple across the pool.');
      return false;
    }
    if (this.valves.has(index)) {
      this.valves.delete(index);
      this.say(`🌊 Valve ${index + 1} closed.`);
      return false;
    }
    this.valves.add(index);
    if (this.valves.size === 3) {
      if (this.replayingValves) {
        this.replayingValves = false;
        this.say('Nami laughs as the currents twirl. The tea stayed in its cups!');
        return true;
      }
      this.solve('sunken-vault', '🌊 The tides surge! Guardian Nami rises from the depths!');
      return true;
    }
    this.say(`🌊 Valve ${index + 1} opened! (${this.valves.size}/3)`);
    return false;
  }

  // Puzzle 3: Magma Forge braziers, lit in any order.
  lightBrazier(index: number): boolean {
    if (this.currentMap !== 'magma-forge' || !Number.isInteger(index) || index < 0 || index > 3) return false;
    if (!this.replayingBraziers && this.solved.has('magma-forge')) {
      this.say('The brazier answers with a friendly flicker.');
      return false;
    }
    if (this.braziers.has(index)) {
      this.say('🔥 This brazier is already roaring!');
      return false;
    }
    this.braziers.add(index);
    if (this.braziers.size === 4) {
      if (this.replayingBraziers) {
        this.replayingBraziers = false;
        this.say('The hearth blooms! Akane grins. A fine flame—and fine company.');
        return true;
      }
      this.solve('magma-forge', '🔥 The Crimson Bloom ignites! Guardian Akane descends!');
      return true;
    }
    this.say(`🔥 Brazier ${index + 1} ignited! (${this.braziers.size}/4)`);
    return false;
  }

  // Puzzle 4: Echoing Cavern chimes, struck in pitch order.
  strikeChime(index: number): boolean {
    if (this.currentMap !== 'echoing-cavern' || !Number.isInteger(index) || index < 0 || index > 2) return false;
    if (!this.replayingChimes && this.solved.has('echoing-cavern')) {
      this.say('The crystal chime hums softly. Visit Tsuki to play the moon-song again.');
      return false;
    }
    const step = this.chimes.length;
    if (index === this.targetChimes[step]) {
      this.chimes = [...this.chimes, index];
      if (this.chimes.length === this.targetChimes.length) {
        if (this.replayingChimes) {
          this.replayingChimes = false;
          this.say('The moon-song glimmers through the room. Tsuki smiles—one more quiet memory together.');
          return true;
        }
        this.solve('echoing-cavern', '🔔 The crystal bells ring in pure accord! Guardian Tsuki appears!');
        return true;
      }
      this.say(`✨ Chime resonant note ${step + 1}/3!`);
    } else {
      this.chimes = [];
      this.say('🔔 Discordant tone... The echoes reset. Try again!');
    }
    return false;
  }
}
