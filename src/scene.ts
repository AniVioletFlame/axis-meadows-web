// The game canvas: movement, camera, map changes and interactions, ported from OverworldScene.swift.
// World space is y-up (SpriteKit). Drawing uses a transform where a world point (x, y) lands at canvas (x, -y).

import { BIOME, BIOMES, ELEMENT, byID, type Biome } from './data';
import { ALL_PATH_STATES, img, loadAll, paths } from './assets';
import {
  BASEMENT, BASEMENT_TYPES, HOMES, SUPREME_CELESTIAL, homeGuardian, isBasement, type ActiveMap, type BasementEngine, type HomeID,
} from './basement';
import { bakeOverworld, drawGlimmers, drawSpot, makeSparkles, type Glimmer } from './paint-overworld';
import {
  ROOM_STYLE, bakeRoom, drawAltar, drawGuardianStar, drawHome, drawLadder, drawPuzzle, drawResident, homeEffect, makeMotes,
  residentReaction, roomGround, type Effect,
} from './paint-rooms';
import { HOME_PROPS, PUZZLES, ROOM_SPAWN, currentHome, roomNodes, roomSize, type RoomNode } from './rooms';
import type { Chibidex } from './store';
import {
  COLS, GRASS_TILES, PLAYER_SPEED, PLAYER_START, ROWS, SCENERY, SPOTS, TILE, WORLD_H, biomeAt, facingFor, isWalkable, key,
  type Facing, type Spot,
} from './world';

const PLAYER_DIR: Record<Facing, string> = {
  down: 'front', up: 'back', left: 'side', right: 'side',
  downLeft: 'downLeft', downRight: 'downRight', upLeft: 'upLeft', upRight: 'upRight',
};
const FADE = 0.25; // seconds each way, as in transitionTo(map:spawnPos:)

export interface SceneHooks {
  onGrassStep(biome: Biome): void;
  /** Hidden spots, the archive and the sealed well. Open portals are handled by the scene. */
  onSpot(spot: Spot): void;
  promptFor(spot: Spot): string;
  onPrompt(text: string | null): void;
  onBiome(biome: Biome): void;
  onMapChanged(map: ActiveMap): void;
  /** Arrived in a befriended guardian's home, after the fade or after an encounter. */
  onHomeEntered(): void;
  /** The player visits the guardian at home. */
  onResident(): void;
}

type Point = { x: number; y: number };

export class GameScene {
  map: ActiveMap = 'overworld';
  player: Point = { ...PLAYER_START };
  stick = { x: 0, y: 0 };
  sprint = false;
  paused = false;

  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private camTx = 0;
  private camTy = 0;
  private now = 0;
  private ready = false;

  private world: HTMLCanvasElement | null = null;
  private ocean: CanvasPattern | null = null;
  private sparkles: Glimmer[] = [];
  private room: HTMLCanvasElement | null = null;
  private motes: Glimmer[] = [];
  private nodes: RoomNode[] = [];
  private effects: Effect[] = [];
  private hopStart = -10;

  private overworldPos: Point = { ...PLAYER_START };
  private fade: { start: number; target: ActiveMap; spawn: Point; switched: boolean } | null = null;

  private facing: Facing = 'down';
  private moving = false;
  private walkTime = 0;
  private lastTile = -1;
  private lastBiome: Biome | null = null;
  private lastRune: number | null = null;
  private trail: Point[] = [];
  private buddyPos: Point = { x: PLAYER_START.x - 24, y: PLAYER_START.y };
  private buddyID: string | null = null;
  private nearbySpot: Spot | null = null;
  private nearbyNode: RoomNode | null = null;
  private lastPrompt: string | null = '';
  private lastInteract = 0;
  private keys = new Set<string>();

  constructor(
    private canvas: HTMLCanvasElement,
    private hooks: SceneHooks,
    private basement: BasementEngine,
    private dex: Chibidex,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.bindInput();
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  async init() {
    const list: string[] = ['grounds/ground-stardust-ocean.png'];
    for (const b of BIOMES) {
      const f = BIOME[b].file;
      list.push(paths.ground(f), paths.grass(f), paths.pathTile(f));
      for (const st of ALL_PATH_STATES) list.push(paths.pathTile(f, st));
    }
    for (const s of SCENERY) list.push(paths.scenery(s.prop));
    // The Violet Archive and Sanctuary spots are drawn from shapes and have no landmark image.
    const proceduralSpots = new Set(['meadow-violet-archive', 'shore-our-horizon', 'crystal-lotus-pond']);
    for (const s of SPOTS) if (!proceduralSpots.has(s.id)) list.push(paths.landmark(s.id));
    for (const dir of new Set(Object.values(PLAYER_DIR))) for (let f = 1; f <= 4; f++) list.push(paths.player(dir, f));
    for (const m of [...BASEMENT_TYPES, 'starfall'] as const) list.push(roomGround(m));
    for (const t of BASEMENT_TYPES) list.push(paths.scenery(PUZZLES[t].prop), paths.follower(BASEMENT[t].guardianID));
    for (const h of HOMES) for (const [name] of HOME_PROPS[h]) list.push(paths.scenery(name));
    list.push(paths.scenery('prop-dungeon-ladder'), paths.scenery('prop-star-altar'));
    await loadAll(list);

    this.world = bakeOverworld();
    const oceanImg = img('grounds/ground-stardust-ocean.png');
    if (oceanImg) this.ocean = this.ctx.createPattern(oceanImg, 'repeat');
    this.sparkles = makeSparkles();
    this.ready = true;
    this.hooks.onBiome(biomeAt(Math.floor(this.player.x / TILE), Math.floor(this.player.y / TILE)) ?? 'wildflowerFields');
  }

  setBuddy(id: string | null) {
    if (id && id !== this.buddyID) {
      void loadAll([paths.follower(id)]);
      this.buddyPos = { x: this.player.x - 24, y: this.player.y };
      this.trail = [];
    }
    this.buddyID = id;
  }

  /** Teleport directly to an overworld tile (e.g. from the Sanctuary Heart tab). */
  teleportToOverworldTile(col: number, row: number) {
    const spawn = { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
    if (this.map !== 'overworld') {
      this.overworldPos = spawn;
      this.transitionTo('overworld', spawn);
    } else {
      this.player = spawn;
      this.buddyPos = { x: spawn.x - 24, y: spawn.y };
      this.trail = [];
      const b = biomeAt(col, row);
      if (b) {
        this.lastBiome = b;
        this.hooks.onBiome(b);
      }
    }
  }

  /** Stop movement while an overlay is open, as pauseForEncounter() did. */
  pause() {
    this.paused = true;
    this.stopInput();
  }
  resume() {
    this.paused = false;
    this.keys.clear();
    this.moving = false;
  }
  private stopInput() {
    this.keys.clear();
    this.stick = { x: 0, y: 0 };
    this.sprint = false;
    this.moving = false;
  }

  private befriended(id: string) {
    return this.dex.entry(id).befriended;
  }

  /** The befriended guardian's home the player is standing in, if any. */
  home(): HomeID | null {
    return currentHome(this.map, (id) => this.befriended(id));
  }

  /** Rebuild the room after an encounter or a replay, as refreshGuardianRoom() did. */
  refreshRoom() {
    if (!this.ready) return;
    if (isBasement(this.map)) {
      this.nodes = roomNodes(this.map, this.basement.solved, (id) => this.befriended(id));
      this.lastRune = null;
    }
    if (this.home()) this.hooks.onHomeEntered();
  }

  /** The guardian hops and a little symbol floats up. */
  reactResident() {
    const h = this.home();
    if (!h) return;
    this.hopStart = this.now;
    this.effects.push(residentReaction(h, this.now));
  }

  interact() {
    if (this.paused || this.fade || !this.ready) return;
    const now = performance.now();
    if (now - this.lastInteract < 400) return;
    this.lastInteract = now;
    if (this.map === 'overworld') {
      if (this.nearbySpot) this.handleSpot(this.nearbySpot);
    } else if (this.nearbyNode) {
      this.handleNode(this.nearbyNode);
    }
  }

  private handleSpot(s: Spot) {
    if (s.portal === 'starfall') {
      if (this.dex.starfallUnlocked) this.transitionTo('starfall', ROOM_SPAWN);
      else this.hooks.onSpot(s);
    } else if (s.portal) {
      this.transitionTo(s.portal, ROOM_SPAWN);
    } else {
      this.hooks.onSpot(s);
    }
  }

  private handleNode(n: RoomNode) {
    const b = this.basement;
    switch (n.kind) {
      case 'resident':
        this.hooks.onResident();
        break;
      case 'guardian':
        if (isBasement(this.map)) b.retryGuardian(this.map, this.befriended(BASEMENT[this.map].guardianID));
        break;
      case 'rune':
        if (this.lastRune !== n.index) {
          this.lastRune = n.index;
          b.stepOnRune(n.index);
        }
        break;
      case 'ladder':
        this.transitionTo('overworld', this.overworldPos);
        break;
      case 'valve':
        this.celebrate('nami', b.turnValve(n.index));
        break;
      case 'brazier':
        this.celebrate('akane', b.lightBrazier(n.index));
        break;
      case 'chime':
        this.celebrate('tsuki', b.strikeChime(n.index));
        break;
      case 'altar':
        b.onGuardianAwakened?.(SUPREME_CELESTIAL);
        break;
    }
  }

  /** Puzzle pieces stir the home's furnishings once the guardian lives there. */
  private celebrate(home: HomeID, done: boolean) {
    if (this.home() !== home) return;
    const fx = homeEffect(home, done, this.now);
    if (fx) this.effects.push(fx);
    if (done) this.reactResident();
  }

  // ---------- maps and transitions ----------

  transitionTo(target: ActiveMap, spawn: Point) {
    if (this.fade) return;
    this.stopInput();
    this.fade = { start: this.now, target, spawn: { ...spawn }, switched: false };
  }

  private stepFade() {
    const f = this.fade;
    if (!f) return;
    const e = this.now - f.start;
    if (!f.switched && e >= FADE) {
      f.switched = true;
      if (this.map === 'overworld') this.overworldPos = { ...this.player };
      this.map = f.target;
      this.basement.enterMap(f.target);
      this.buildMap();
      this.player = { ...f.spawn };
      this.trail = [];
      this.buddyPos = { x: this.player.x - 24, y: this.player.y };
      this.hooks.onMapChanged(this.map);
    }
    if (e >= FADE * 2) {
      this.fade = null;
      this.stopInput();
      if (this.home()) this.hooks.onHomeEntered();
    }
  }

  private buildMap() {
    this.lastTile = -1;
    this.lastRune = null;
    this.effects = [];
    this.nearbySpot = null;
    this.nearbyNode = null;
    this.lastPrompt = null;
    this.hooks.onPrompt(null);
    if (this.map === 'overworld') {
      this.nodes = [];
      this.room = null;
      this.motes = [];
      return;
    }
    this.nodes = roomNodes(this.map, this.basement.solved, (id) => this.befriended(id));
    this.room = bakeRoom(this.map);
    this.motes = makeMotes(this.map);
  }

  private size() {
    return this.map === 'overworld' ? { cols: COLS, rows: ROWS } : roomSize(this.map);
  }

  // ---------- input ----------

  private bindInput() {
    const moveKeys = new Set(['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's']);
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      // Let Space/Enter press a focused button (encounter actions, dialogue, tabs) instead of investigating.
      if ((k === ' ' || k === 'enter') && e.target instanceof HTMLElement && e.target.closest('button')) return;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
      if (k === 'e' || k === ' ' || k === 'enter') {
        if (!this.paused) {
          e.preventDefault();
          if (!e.repeat) this.interact();
        }
        return;
      }
      if (k === 'shift') this.sprint = true;
      if (this.paused || this.fade) return;
      if (moveKeys.has(k)) {
        e.preventDefault();
        this.keys.add(k);
      }
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys.delete(k);
      if (k === 'shift') this.sprint = false;
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.sprint = false;
    });
    // Click or tap the guardian at home to visit, as mouseDown/touchesEnded did.
    this.canvas.addEventListener('pointerup', (e) => {
      if (this.paused || this.fade) return;
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left - this.camTx, y = this.camTy - (e.clientY - r.top);
      const resident = this.nodes.find((n) => n.kind === 'resident');
      if (resident && Math.hypot(x - resident.x, y - resident.y) < 40) this.hooks.onResident();
    });
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = this.canvas.getBoundingClientRect();
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
  }

  // ---------- frame loop ----------

  start() {
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 20);
      last = now;
      this.now = now / 1000;
      if (this.ready) {
        this.stepFade();
        this.update(dt);
        this.draw();
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  private update(dt: number) {
    if (this.paused || this.fade) {
      this.moving = false;
      return;
    }
    let dx = 0, dy = 0;
    if (this.keys.has('arrowleft') || this.keys.has('a')) dx -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) dx += 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) dy -= 1;
    if (this.keys.has('arrowup') || this.keys.has('w')) dy += 1;
    if (this.stick.x !== 0 || this.stick.y !== 0) {
      dx = this.stick.x;
      dy = this.stick.y;
    }
    const len = Math.hypot(dx, dy);
    const moving = len > 0.08;
    if (moving) this.facing = facingFor(dx, dy) ?? this.facing;
    if (moving !== this.moving) this.walkTime = 0;
    this.moving = moving;

    if (moving) {
      this.walkTime += dt;
      const { cols, rows } = this.size();
      const speed = PLAYER_SPEED * (this.sprint ? 1.7 : 1) * dt;
      const nx = Math.min(Math.max(this.player.x + (dx / len) * speed, TILE), (cols - 1) * TILE);
      const ny = Math.min(Math.max(this.player.y + (dy / len) * speed, TILE), (rows - 1) * TILE);
      if (this.map === 'overworld') {
        // Resolve axes separately so the player slides along banks and bridge rails.
        if (isWalkable(nx, this.player.y)) this.player.x = nx;
        if (isWalkable(this.player.x, ny)) this.player.y = ny;
      } else {
        this.player = { x: nx, y: ny };
      }

      this.trail.push({ ...this.player });
      if (this.trail.length > 12) this.buddyPos = this.trail.shift()!;

      if (this.map === 'overworld') this.checkTile();
      else if (this.map === 'root-sanctum') this.checkRuneStep();
    }
    this.updatePrompt();
  }

  private checkTile() {
    const col = Math.floor(this.player.x / TILE), row = Math.floor(this.player.y / TILE);
    const k = key(col, row);
    if (k === this.lastTile) return;
    this.lastTile = k;
    const biome = biomeAt(col, row);
    if (biome && biome !== this.lastBiome) {
      this.lastBiome = biome;
      this.hooks.onBiome(biome);
    }
    const grass = GRASS_TILES.get(k);
    if (grass) this.hooks.onGrassStep(grass);
  }

  /** Walking onto a leaf rune counts as stepping on it. */
  private checkRuneStep() {
    for (const n of this.nodes) {
      if (n.kind !== 'rune' || Math.hypot(this.player.x - n.x, this.player.y - n.y) >= 24) continue;
      if (this.lastRune !== n.index) {
        this.lastRune = n.index;
        this.basement.stepOnRune(n.index);
      }
      return;
    }
    this.lastRune = null;
  }

  private updatePrompt() {
    let best = 75;
    let text: string | null = null;
    this.nearbySpot = null;
    this.nearbyNode = null;
    if (this.map === 'overworld') {
      for (const s of SPOTS) {
        const d = Math.hypot(this.player.x - s.x, this.player.y - s.y);
        if (d < best) {
          best = d;
          this.nearbySpot = s;
        }
      }
      if (this.nearbySpot) text = this.hooks.promptFor(this.nearbySpot);
    } else {
      for (const n of this.nodes) {
        const d = Math.hypot(this.player.x - n.x, this.player.y - n.y);
        if (d < best) {
          best = d;
          this.nearbyNode = n;
        }
      }
      if (this.nearbyNode) text = this.nearbyNode.label;
    }
    if (text !== this.lastPrompt) {
      this.lastPrompt = text;
      this.hooks.onPrompt(text);
    }
  }

  // ---------- drawing ----------

  private draw() {
    const t = this.now;
    const dpr = this.canvas.width / Math.max(1, this.w);
    const g = this.ctx;
    const outdoors = this.map === 'overworld';
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.fillStyle = outdoors ? 'rgb(5,13,31)' : ROOM_STYLE[this.map as Exclude<ActiveMap, 'overworld'>].bg;
    g.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Camera on the player; whole device pixels keep the pixel art crisp.
    this.camTx = this.w / 2 - this.player.x;
    this.camTy = this.h / 2 + this.player.y;
    const tx = Math.round(this.camTx * dpr), ty = Math.round(this.camTy * dpr);
    g.setTransform(dpr, 0, 0, dpr, tx, ty);

    if (outdoors) this.drawOverworld(g, t, tx / dpr, ty / dpr);
    else this.drawRoom(g, t);

    // Buddy follower, hidden while visiting her own home
    const home = this.home();
    if (this.buddyID && !(home && homeGuardian(home) === this.buddyID)) this.drawBuddy(g);
    this.drawPlayer(g);

    // Fade curtain between maps
    if (this.fade) {
      const e = t - this.fade.start;
      const a = e < FADE ? e / FADE : Math.max(0, 1 - (e - FADE) / FADE);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = `rgba(0,0,0,${Math.min(1, a)})`;
      g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private drawOverworld(g: CanvasRenderingContext2D, t: number, ox: number, oy: number) {
    if (this.ocean) {
      g.fillStyle = this.ocean;
      g.fillRect(-ox - 64, -oy - 64, this.w + 128, this.h + 128);
    }
    drawGlimmers(g, this.sparkles, t);
    if (this.world) g.drawImage(this.world, 0, -WORLD_H);
    const pulse = 0.65 + 0.25 * Math.sin((t * Math.PI) / 1.2);
    for (const s of SPOTS) drawSpot(g, s, pulse, t);
  }

  private drawRoom(g: CanvasRenderingContext2D, t: number) {
    drawGlimmers(g, this.motes, t);
    if (this.room) g.drawImage(this.room, 0, -this.room.height);
    const home = this.home();
    if (home) drawHome(g, home, t);
    this.drawEffects(g, 'furnish', t);
    if (isBasement(this.map)) drawPuzzle(g, this.map, this.basement);
    drawLadder(g);
    if (this.map === 'starfall') drawAltar(g, t);
    for (const n of this.nodes) {
      if (n.kind === 'guardian') drawGuardianStar(g);
      if (n.kind === 'resident' && home) {
        const e = t - this.hopStart;
        const hop = e < 0.16 ? 7 * (e / 0.16) : e < 0.36 ? 7 * (1 - (e - 0.16) / 0.2) : 0;
        drawResident(g, homeGuardian(home), hop);
      }
    }
    this.drawEffects(g, 'resident', t);
  }

  private drawEffects(g: CanvasRenderingContext2D, layer: Effect['layer'], t: number) {
    this.effects = this.effects.filter((fx) => t - fx.start < fx.dur);
    for (const fx of this.effects) if (fx.layer === layer) fx.draw(g, Math.max(0, (t - fx.start) / fx.dur), t);
  }

  private drawBuddy(g: CanvasRenderingContext2D) {
    const b = this.buddyPos;
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.beginPath();
    g.ellipse(b.x, -(b.y - 12), 9, 4, 0, 0, Math.PI * 2);
    g.fill();
    const tex = img(paths.follower(this.buddyID!));
    if (tex) g.drawImage(tex, b.x - 16, -b.y - 16, 32, 32);
    else {
      const chibi = byID(this.buddyID!);
      g.fillStyle = chibi ? ELEMENT[chibi.element].color : '#999';
      g.strokeStyle = '#fff';
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(b.x, -b.y, 13, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
  }

  /** 48x48, anchor (0.5, 0.18); side frames face left and are mirrored for right. */
  private drawPlayer(g: CanvasRenderingContext2D) {
    const p = this.player;
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.beginPath();
    g.ellipse(p.x, -(p.y + 2), 13, 5, 0, 0, Math.PI * 2);
    g.fill();
    const frameDur = this.sprint ? 0.11 : 0.16;
    const frame = this.moving ? (Math.floor(this.walkTime / frameDur) % 4) + 1 : 1;
    const dir = PLAYER_DIR[this.facing];
    const tex = img(paths.player(dir, frame)) ?? img(paths.player(dir, 1));
    if (!tex) return;
    const top = -(p.y - 0.18 * 48) - 48;
    if (this.facing === 'right') {
      g.save();
      g.translate(p.x, 0);
      g.scale(-1, 1);
      g.drawImage(tex, -24, top, 48, 48);
      g.restore();
    } else {
      g.drawImage(tex, p.x - 24, top, 48, 48);
    }
  }
}
