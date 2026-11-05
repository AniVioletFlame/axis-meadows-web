// Canvas overworld, ported from the overworld parts of OverworldScene.swift.
// World space is y-up (SpriteKit); canvas space is y-down, so y is flipped when drawing.

import { BIOME, BIOMES, ELEMENT, byID, type Biome } from './data';
import { img, loadAll, paths } from './assets';
import {
  BRIDGES, BRIDGE_TILES, COLS, GRASS_TILES, PATH_TILES, PLAYER_SPEED, PLAYER_START, REGIONS, ROWS,
  SCENERY, SPOTS, TILE, WORLD_H, WORLD_W, biomeAt, facingFor, isWalkable, key, type Facing, type Spot,
} from './world';

const PLAYER_DIR: Record<Facing, string> = {
  down: 'front', up: 'back', left: 'side', right: 'side',
  downLeft: 'downLeft', downRight: 'downRight', upLeft: 'upLeft', upRight: 'upRight',
};

const PATH_COLOR: Record<Biome, string> = {
  wildflowerFields: 'rgb(153,122,71)',
  crystalHollow: 'rgb(99,87,140)',
  emberglade: 'rgb(97,61,59)',
  stardustShore: 'rgb(130,148,163)',
  whisperingGrove: 'rgb(87,71,41)',
};
const FLECK_COLOR: Record<Biome, string> = {
  crystalHollow: 'rgba(207,194,255,0.65)',
  emberglade: 'rgba(242,140,66,0.55)',
  stardustShore: 'rgba(204,224,232,0.6)',
  wildflowerFields: 'rgba(138,112,64,0.5)',
  whisperingGrove: 'rgba(138,112,64,0.5)',
};
const GROUND_FALLBACK: Record<Biome, string> = {
  wildflowerFields: 'rgb(97,166,71)', whisperingGrove: 'rgb(51,107,56)', stardustShore: 'rgb(64,128,153)',
  emberglade: 'rgb(133,61,41)', crystalHollow: 'rgb(71,56,122)',
};
const GRASS_FALLBACK: Record<Biome, string> = {
  wildflowerFields: 'rgb(71,191,77)', whisperingGrove: 'rgb(38,140,64)', stardustShore: 'rgb(51,173,199)',
  emberglade: 'rgb(199,82,31)', crystalHollow: 'rgb(115,77,184)',
};
const SPARKLE_COLORS = ['rgba(115,217,255,0.8)', 'rgba(204,166,255,0.75)', 'rgba(255,230,140,0.85)', 'rgba(77,242,217,0.7)'];

export interface SceneHooks {
  onGrassStep(biome: Biome): void;
  onSpot(spot: Spot): void;
  promptFor(spot: Spot): string;
  onPrompt(text: string | null): void;
  onBiome(biome: Biome): void;
}

interface Sparkle { x: number; y: number; size: number; color: string; dx: number; dy: number; peak: number; delay: number; fadeIn: number; fadeOut: number; rest: number }

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class OverworldScene {
  private ctx: CanvasRenderingContext2D;
  private world!: HTMLCanvasElement;
  private ocean: CanvasPattern | null = null;
  private sparkles: Sparkle[] = [];
  private w = 0;
  private h = 0;

  player = { ...PLAYER_START };
  private facing: Facing = 'down';
  private moving = false;
  private walkTime = 0;
  private lastTile = -1;
  private lastBiome: Biome | null = null;
  private trail: { x: number; y: number }[] = [];
  private buddyPos = { x: PLAYER_START.x - 24, y: PLAYER_START.y };
  private buddyID: string | null = null;
  private nearby: Spot | null = null;
  private lastPrompt: string | null = '';
  private lastInteract = 0;

  private keys = new Set<string>();
  stick = { x: 0, y: 0 };
  sprint = false;
  paused = false;
  private ready = false;

  constructor(private canvas: HTMLCanvasElement, private hooks: SceneHooks) {
    this.ctx = canvas.getContext('2d')!;
    this.bindKeys();
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  async init() {
    const list: string[] = ['grounds/ground-stardust-ocean.png'];
    for (const b of BIOMES) list.push(paths.ground(BIOME[b].file), paths.grass(BIOME[b].file));
    for (const s of SCENERY) list.push(paths.scenery(s.prop));
    // The Violet Archive is drawn from shapes and has no landmark image.
    for (const s of SPOTS) if (s.id !== 'meadow-violet-archive') list.push(paths.landmark(s.id));
    for (const dir of new Set(Object.values(PLAYER_DIR))) for (let f = 1; f <= 4; f++) list.push(paths.player(dir, f));
    await loadAll(list);
    this.bakeWorld();
    const oceanImg = img('grounds/ground-stardust-ocean.png');
    if (oceanImg) this.ocean = this.ctx.createPattern(oceanImg, 'repeat');
    this.makeSparkles();
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

  /** Stop movement when an overlay opens, as pauseForEncounter() did. */
  pause() {
    this.paused = true;
    this.keys.clear();
    this.stick = { x: 0, y: 0 };
    this.sprint = false;
    this.moving = false;
  }
  resume() {
    this.paused = false;
    this.keys.clear();
    this.moving = false;
  }

  interact() {
    if (this.paused) return;
    const now = performance.now();
    if (now - this.lastInteract < 400) return;
    this.lastInteract = now;
    if (this.nearby) this.hooks.onSpot(this.nearby);
  }

  private bindKeys() {
    const moveKeys = new Set(['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's']);
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      // Let Space/Enter press a focused button (encounter actions, tabs) instead of investigating.
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
      if (this.paused) return;
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
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = this.canvas.getBoundingClientRect();
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
  }

  // ---------- static world bake ----------

  private bakeWorld() {
    const c = document.createElement('canvas');
    c.width = WORLD_W;
    c.height = WORLD_H;
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    const top = (row: number) => WORLD_H - (row + 1) * TILE;

    // Ground
    for (const region of REGIONS) {
      const tex = img(paths.ground(BIOME[region.biome].file));
      for (let col = region.cols[0]; col <= region.cols[1]; col++) {
        for (let row = region.rows[0]; row <= region.rows[1]; row++) {
          if (tex) g.drawImage(tex, col * TILE, top(row), TILE, TILE);
          else {
            g.fillStyle = GROUND_FALLBACK[region.biome];
            g.fillRect(col * TILE, top(row), TILE, TILE);
          }
        }
      }
    }

    // Paths with deterministic flecks
    for (const k of PATH_TILES) {
      const col = Math.floor(k / 1000), row = k % 1000;
      const biome = biomeAt(col, row) ?? 'wildflowerFields';
      g.fillStyle = PATH_COLOR[biome];
      g.fillRect(col * TILE, top(row), TILE, TILE);
      g.fillStyle = FLECK_COLOR[biome];
      const cx = col * TILE + TILE / 2, cy = WORLD_H - (row * TILE + TILE / 2);
      for (let i = 0; i < 3; i++) {
        const ox = ((col * 7 + i * 13) % 38) - 19;
        const oy = ((row * 11 + i * 7) % 38) - 19;
        g.beginPath();
        g.ellipse(cx + ox, cy - oy, 1.5, 1, 0, 0, Math.PI * 2);
        g.fill();
      }
    }

    // Bridges
    for (const span of BRIDGES) {
      const cx = (span.col + (span.vertical ? 1 : 3)) * TILE;
      const cy = WORLD_H - (span.row + (span.vertical ? 3 : 1)) * TILE;
      g.save();
      g.translate(cx, cy);
      if (span.vertical) g.rotate(Math.PI / 2);
      g.fillStyle = 'rgb(97,59,31)';
      g.fillRect(-152, -48, 304, 96);
      g.fillStyle = 'rgb(163,112,61)';
      for (let p = 0; p < 19; p++) g.fillRect(p * 16 - 144 - 7, -44, 14, 88);
      for (const edge of [-46, 46]) {
        g.fillStyle = 'rgb(69,43,31)';
        g.fillRect(-152, edge - 2.5, 304, 5);
        g.fillStyle = 'rgb(201,158,92)';
        for (const x of [-144, -48, 48, 144]) g.fillRect(x - 4.5, edge - 6, 9, 12);
      }
      g.restore();
    }

    // Surf along exposed island edges, leaving bridge landings open
    g.fillStyle = 'rgba(0,255,255,0.4)';
    for (const region of REGIONS) {
      for (let col = region.cols[0]; col <= region.cols[1]; col++) {
        for (let row = region.rows[0]; row <= region.rows[1]; row++) {
          for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nc = col + ox, nr = row + oy;
            if (biomeAt(nc, nr) !== null || BRIDGE_TILES.has(key(nc, nr))) continue;
            const w = ox === 0 ? 46 : 4, h = ox === 0 ? 4 : 46;
            const x = col * TILE + 24 + ox * 24, y = WORLD_H - (row * TILE + 24 + oy * 24);
            g.fillRect(x - w / 2, y - h / 2, w, h);
          }
        }
      }
    }

    // Tall grass
    for (const [k, biome] of GRASS_TILES) {
      const col = Math.floor(k / 1000), row = k % 1000;
      const tex = img(paths.grass(BIOME[biome].file));
      if (tex) g.drawImage(tex, col * TILE, top(row), TILE, TILE);
      else {
        g.fillStyle = GRASS_FALLBACK[biome];
        g.fillRect(col * TILE, top(row), TILE, TILE);
      }
    }

    // Scenery props: 64x96, anchor (0.5, 0.04), placed 20pt below tile centre
    for (const s of SCENERY) {
      const tex = img(paths.scenery(s.prop));
      if (!tex) continue;
      const bottom = s.y - 20 - 0.04 * 96;
      g.drawImage(tex, s.x - 32, WORLD_H - (bottom + 96), 64, 96);
    }

    this.world = c;
  }

  private makeSparkles() {
    const padX = 12 * TILE, padY = 12 * TILE;
    let tries = 0;
    while (tries++ < 85) {
      const x = rand(-padX, WORLD_W + padX), y = rand(-padY, WORLD_H + padY);
      if (x > 0 && x < WORLD_W && y > 0 && y < WORLD_H) continue;
      this.sparkles.push({
        x, y, size: rand(2.5, 5.5), color: SPARKLE_COLORS[Math.floor(Math.random() * 4)],
        dx: rand(-12, 12), dy: rand(-6, 8), peak: rand(0.5, 0.95), delay: rand(0.1, 3),
        fadeIn: 2, fadeOut: rand(0.8, 1.6), rest: rand(1, 4),
      });
    }
  }

  // ---------- frame loop ----------

  start() {
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 20);
      last = now;
      if (this.ready) {
        this.update(dt);
        this.draw(now / 1000);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  private update(dt: number) {
    if (this.paused) {
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
      const speed = PLAYER_SPEED * (this.sprint ? 1.7 : 1) * dt;
      const nx = Math.min(Math.max(this.player.x + (dx / len) * speed, TILE), (COLS - 1) * TILE);
      const ny = Math.min(Math.max(this.player.y + (dy / len) * speed, TILE), (ROWS - 1) * TILE);
      // Resolve axes separately so the player slides along banks and bridge rails.
      if (isWalkable(nx, this.player.y)) this.player.x = nx;
      if (isWalkable(this.player.x, ny)) this.player.y = ny;

      this.trail.push({ ...this.player });
      if (this.trail.length > 12) this.buddyPos = this.trail.shift()!;

      const col = Math.floor(this.player.x / TILE), row = Math.floor(this.player.y / TILE);
      const k = key(col, row);
      if (k !== this.lastTile) {
        this.lastTile = k;
        const biome = biomeAt(col, row);
        if (biome && biome !== this.lastBiome) {
          this.lastBiome = biome;
          this.hooks.onBiome(biome);
        }
        const grass = GRASS_TILES.get(k);
        if (grass) this.hooks.onGrassStep(grass);
      }
    }
    this.updatePrompt();
  }

  private updatePrompt() {
    let best = 75;
    this.nearby = null;
    for (const s of SPOTS) {
      const d = Math.hypot(this.player.x - s.x, this.player.y - s.y);
      if (d < best) {
        best = d;
        this.nearby = s;
      }
    }
    const text = this.nearby ? this.hooks.promptFor(this.nearby) : null;
    if (text !== this.lastPrompt) {
      this.lastPrompt = text;
      this.hooks.onPrompt(text);
    }
  }

  private draw(t: number) {
    const dpr = this.canvas.width / Math.max(1, this.w);
    const g = this.ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.fillStyle = 'rgb(5,13,31)';
    g.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Camera: world (x, y-up) -> screen. Rounded to whole device pixels to keep pixel art crisp.
    const camX = this.player.x, camY = this.player.y;
    const ox = Math.round((this.w / 2 - camX) * dpr) / dpr;
    const oy = Math.round((this.h / 2 - (WORLD_H - camY)) * dpr) / dpr;
    g.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
    // In this transform, a world point (x, y) is drawn at (x, WORLD_H - y).
    const Y = (y: number) => WORLD_H - y;

    // Ocean backdrop, anchored to the world so it scrolls with the map
    if (this.ocean) {
      g.fillStyle = this.ocean;
      g.fillRect(-ox - 64, -oy - 64, this.w + 128, this.h + 128);
    }

    // Sparkles in the stardust sea
    for (const s of this.sparkles) {
      const cycle = s.delay + s.fadeIn + s.fadeOut + s.rest;
      const p = t % cycle;
      let a = 0, prog = 0;
      if (p > s.delay && p < s.delay + s.fadeIn) {
        prog = (p - s.delay) / s.fadeIn;
        a = s.peak * Math.min(1, prog * 1.6);
      } else if (p >= s.delay + s.fadeIn && p < s.delay + s.fadeIn + s.fadeOut) {
        prog = 1;
        a = s.peak * (1 - (p - s.delay - s.fadeIn) / s.fadeOut);
      }
      if (a <= 0.01) continue;
      const scale = prog < 0.5 ? 1 + 0.8 * prog : 1.4 - 1.2 * (prog - 0.5);
      g.globalAlpha = a;
      g.fillStyle = s.color;
      g.shadowColor = s.color;
      g.shadowBlur = s.size * 1.6;
      g.beginPath();
      g.arc(s.x + s.dx * prog, Y(s.y + s.dy * prog), (s.size / 2) * scale, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    g.shadowBlur = 0;

    g.drawImage(this.world, 0, 0);

    // Hidden spots and portals
    const pulse = 0.65 + 0.25 * Math.sin((t * Math.PI) / 1.2);
    for (const s of SPOTS) this.drawSpot(g, s, pulse, t);

    // Buddy follower
    if (this.buddyID) {
      const b = this.buddyPos;
      g.fillStyle = 'rgba(0,0,0,0.2)';
      g.beginPath();
      g.ellipse(b.x, Y(b.y - 12), 9, 4, 0, 0, Math.PI * 2);
      g.fill();
      const tex = img(paths.follower(this.buddyID));
      if (tex) g.drawImage(tex, b.x - 16, Y(b.y) - 16, 32, 32);
      else {
        const chibi = byID(this.buddyID);
        g.fillStyle = chibi ? ELEMENT[chibi.element].color : '#999';
        g.strokeStyle = '#fff';
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(b.x, Y(b.y), 13, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
    }

    // Player: 48x48, anchor (0.5, 0.18), side frames face left and are mirrored for right
    const p = this.player;
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.beginPath();
    g.ellipse(p.x, Y(p.y + 2), 13, 5, 0, 0, Math.PI * 2);
    g.fill();
    const frameDur = this.sprint ? 0.11 : 0.16;
    const frame = this.moving ? (Math.floor(this.walkTime / frameDur) % 4) + 1 : 1;
    const tex = img(paths.player(PLAYER_DIR[this.facing], frame)) ?? img(paths.player(PLAYER_DIR[this.facing], 1));
    if (tex) {
      const top = Y(p.y - 0.18 * 48) - 48;
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

  private drawSpot(g: CanvasRenderingContext2D, s: Spot, pulse: number, t: number) {
    const Y = (y: number) => WORLD_H - y;
    const portal = s.portal !== null;
    g.save();
    g.globalAlpha = pulse;
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.strokeStyle = portal ? 'rgba(0,255,255,0.7)' : 'rgba(128,0,128,0.4)';
    g.lineWidth = portal ? 2 : 1.5;
    g.shadowColor = portal ? 'rgba(0,255,255,0.9)' : 'rgba(170,80,220,0.8)';
    g.shadowBlur = portal ? 10 : 6;
    g.beginPath();
    g.ellipse(s.x, Y(s.y - 6), 19, 9, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.restore();

    if (s.id === 'meadow-violet-archive') {
      this.drawArchive(g, s.x, s.y, t);
      return;
    }
    const tex = img(paths.landmark(s.id));
    if (tex) {
      g.drawImage(tex, s.x - 24, Y(s.y - 0.22 * 48) - 48, 48, 48);
    } else {
      g.save();
      g.fillStyle = portal ? 'rgba(0,255,255,0.3)' : 'rgba(128,0,128,0.25)';
      g.strokeStyle = portal ? 'cyan' : 'purple';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(s.x, Y(s.y), 18, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.restore();
    }
  }

  /** The Violet Archive building, drawn from shapes as in the original. */
  private drawArchive(g: CanvasRenderingContext2D, x: number, y: number, t: number) {
    const Y = (v: number) => WORLD_H - v;
    const rrect = (cx: number, cy: number, w: number, h: number, r: number, fill: string, stroke?: string, lw = 1, glow = 0) => {
      g.save();
      g.beginPath();
      g.roundRect(x + cx - w / 2, Y(y + cy) - h / 2, w, h, r);
      g.fillStyle = fill;
      if (glow) {
        g.shadowColor = stroke ?? fill;
        g.shadowBlur = glow * 2;
      }
      g.fill();
      if (stroke) {
        g.strokeStyle = stroke;
        g.lineWidth = lw;
        g.stroke();
      }
      g.restore();
    };
    const circle = (cx: number, cy: number, r: number, fill: string, glow: number) => {
      g.save();
      g.beginPath();
      g.arc(x + cx, Y(y + cy), r, 0, Math.PI * 2);
      g.fillStyle = fill;
      g.shadowColor = fill;
      g.shadowBlur = glow * 2;
      g.fill();
      g.strokeStyle = '#fff';
      g.lineWidth = 1;
      g.stroke();
      g.restore();
    };
    rrect(0, -4, 58, 20, 4, 'rgb(71,51,92)', 'rgb(153,115,191)', 1.5);
    rrect(0, 16, 46, 50, 8, 'rgb(46,31,66)', 'rgb(191,153,242)', 2);
    rrect(0, 10, 24, 32, 6, 'rgba(115,64,179,0.9)', 'rgba(0,255,255,0.8)', 1.5, 4);
    circle(0, 44, 6, 'rgb(255,230,0)', 5);
    for (const [i, side] of [-25, 25].entries()) {
      rrect(side, 0, 4, 16, 0, 'rgb(102,77,128)');
      g.globalAlpha = 0.85 + 0.15 * Math.sin(t * (4.5 + i) + i * 2);
      circle(side, 10, 5, 'rgba(217,166,255,0.95)', 6);
      g.globalAlpha = 1;
    }
  }
}
