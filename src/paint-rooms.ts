// Basement, guardian-home and Starfall Sanctum art, ported from the SpriteKit shapes in OverworldScene.swift.
// Same transform as the overworld: a world point (x, y-up) is drawn at canvas (x, -y).

import { img, paths } from './assets';
import type { ActiveMap, BasementEngine, BasementType, HomeID } from './basement';
import { rand, type Glimmer } from './paint-overworld';
import { ALTAR_SPOT, HOME_PROPS, LADDER_SPOT, PUZZLES, RESIDENT_SPOT, roomSize, type NodeKind } from './rooms';
import { TILE, tileCenter } from './world';

type G = CanvasRenderingContext2D;
type RoomMap = Exclude<ActiveMap, 'overworld'>;

// SpriteKit's named colours.
const BROWN = 'rgb(153,102,51)';
const ORANGE = 'rgb(255,128,0)';
const YELLOW = 'rgb(255,255,0)';
const PURPLE = 'rgb(128,0,128)';
const CYAN = 'rgb(0,255,255)';
const GRAY = 'rgb(128,128,128)';
const WHITE = 'rgb(255,255,255)';

export const ROOM_STYLE: Record<RoomMap, { bg: string; mote: string; rising: boolean; floor: string }> = {
  starfall: { bg: 'rgb(8,3,20)', mote: 'rgba(242,204,255,0.85)', rising: false, floor: 'rgb(10,5,20)' },
  'root-sanctum': { bg: 'rgb(5,15,8)', mote: 'rgba(115,242,102,0.8)', rising: true, floor: 'rgb(26,20,41)' },
  'sunken-vault': { bg: 'rgb(3,13,31)', mote: 'rgba(89,217,255,0.8)', rising: false, floor: 'rgb(26,20,41)' },
  'magma-forge': { bg: 'rgb(18,5,3)', mote: 'rgba(255,115,38,0.85)', rising: true, floor: 'rgb(26,20,41)' },
  'echoing-cavern': { bg: 'rgb(10,5,26)', mote: 'rgba(217,140,255,0.85)', rising: false, floor: 'rgb(26,20,41)' },
};

export const roomGround = (map: RoomMap) => paths.ground(map === 'starfall' ? 'starfall-sanctum' : map);

// ---------- shape helpers ----------

interface Style { fill?: string; stroke?: string; lw?: number; glow?: number; glowColor?: string }

function paint(g: G, s: Style) {
  g.save();
  if (s.glow) {
    g.shadowColor = s.glowColor ?? s.stroke ?? s.fill ?? WHITE;
    g.shadowBlur = s.glow * 1.6;
  }
  if (s.fill) {
    g.fillStyle = s.fill;
    g.fill();
  }
  if (s.stroke) {
    g.strokeStyle = s.stroke;
    g.lineWidth = s.lw ?? 1;
    g.stroke();
  }
  g.restore();
}
function ellipse(g: G, x: number, y: number, w: number, h: number, s: Style) {
  g.beginPath();
  g.ellipse(x, -y, w / 2, h / 2, 0, 0, Math.PI * 2);
  paint(g, s);
}
function circle(g: G, x: number, y: number, r: number, s: Style) {
  g.beginPath();
  g.arc(x, -y, r, 0, Math.PI * 2);
  paint(g, s);
}
function rrect(g: G, x: number, y: number, w: number, h: number, r: number, s: Style) {
  g.beginPath();
  g.roundRect(x - w / 2, -y - h / 2, w, h, r);
  paint(g, s);
}
/** Path from y-up points relative to (ox, oy). Commands: ['M', x, y] | ['Q', cx, cy, x, y] | ['C', c1x, c1y, c2x, c2y, x, y]. */
function path(g: G, ox: number, oy: number, cmds: (string | number)[][], s: Style, scaleY = 1) {
  g.save();
  g.translate(ox, -oy);
  g.scale(1, scaleY);
  g.beginPath();
  for (const [op, ...n] of cmds as [string, ...number[]][]) {
    if (op === 'M') g.moveTo(n[0], -n[1]);
    else if (op === 'Q') g.quadraticCurveTo(n[0], -n[1], n[2], -n[3]);
    else if (op === 'C') g.bezierCurveTo(n[0], -n[1], n[2], -n[3], n[4], -n[5]);
  }
  g.closePath();
  paint(g, s);
  g.restore();
}
function sprite(g: G, file: string, x: number, y: number, size: number, alpha = 1) {
  const tex = img(file);
  if (!tex) return false;
  g.save();
  g.globalAlpha *= alpha;
  g.drawImage(tex, x - size / 2, -y - size / 2, size, size);
  g.restore();
  return true;
}
/** 0 -> 1 -> 0 over `period` seconds. */
const tri = (t: number, period: number) => {
  const p = (t % period) / (period / 2);
  return p < 1 ? p : 2 - p;
};

// ---------- floors and motes ----------

/** The room floor, tiled once. Drawn at (0, -height). */
export function bakeRoom(map: RoomMap): HTMLCanvasElement {
  const { cols, rows } = roomSize(map);
  const c = document.createElement('canvas');
  c.width = cols * TILE;
  c.height = rows * TILE;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const tex = img(roomGround(map));
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      if (tex) g.drawImage(tex, col * TILE, c.height - (row + 1) * TILE, TILE, TILE);
      else {
        g.fillStyle = ROOM_STYLE[map].floor;
        g.fillRect(col * TILE, c.height - (row + 1) * TILE, TILE, TILE);
      }
    }
  }
  return c;
}

/** Motes drifting in the abyss around the room, never over it. */
export function makeMotes(map: RoomMap): Glimmer[] {
  const { cols, rows } = roomSize(map);
  const w = cols * TILE, h = rows * TILE;
  const padX = ((44 - cols) / 2) * TILE, padY = ((36 - rows) / 2) * TILE;
  const style = ROOM_STYLE[map];
  const list: Glimmer[] = [];
  for (let tries = 0; tries < 55; tries++) {
    const x = rand(-padX, w + padX), y = rand(-padY, h + padY);
    if (x > 0 && x < w && y > 0 && y < h) continue;
    const size = rand(2, 5), rise = rand(2.5, 5);
    list.push({
      x, y, size, color: style.mote, dx: rand(-20, 20), dy: style.rising ? rand(30, 80) : rand(-20, 20),
      peak: rand(0.5, 0.9), delay: rand(0.1, 3), fadeIn: rise * 0.4, move: rise, fadeOut: rise * 0.6,
      rest: rand(1, 3), pulse: false, glow: size * 2,
    });
  }
  return list;
}

// ---------- puzzle pieces, ladder, altar, guardian ----------

const PUZZLE_STYLE: Partial<Record<NodeKind, { rgb: string; fillA: number; glow: number; r: number; dim: number; lw: number }>> = {
  rune: { rgb: '0,255,0', fillA: 0.25, glow: 8, r: 26, dim: 0.65, lw: 1.5 },
  valve: { rgb: '0,255,255', fillA: 0.3, glow: 10, r: 28, dim: 0.65, lw: 1 },
  brazier: { rgb: '255,128,0', fillA: 0.3, glow: 12, r: 28, dim: 0.6, lw: 1 },
  chime: { rgb: '128,0,128', fillA: 0.35, glow: 10, r: 28, dim: 0.65, lw: 1 },
};

export function isLit(map: BasementType, b: BasementEngine, i: number) {
  switch (map) {
    case 'root-sanctum': return b.runes.includes(i);
    case 'sunken-vault': return b.valves.has(i);
    case 'magma-forge': return b.braziers.has(i);
    case 'echoing-cavern': return b.chimes.includes(i);
  }
}

export function drawPuzzle(g: G, map: BasementType, b: BasementEngine) {
  const puzzle = PUZZLES[map];
  const st = PUZZLE_STYLE[puzzle.kind]!;
  puzzle.spots.forEach((s, i) => {
    const on = isLit(map, b, i);
    if (on) circle(g, s.x, s.y, st.r, { fill: `rgba(${st.rgb},${st.fillA})`, stroke: `rgb(${st.rgb})`, lw: st.lw, glow: st.glow });
    if (!sprite(g, paths.scenery(puzzle.prop), s.x, s.y, 52, on ? 1 : st.dim)) {
      circle(g, s.x, s.y, 20, { fill: `rgba(${st.rgb},${on ? 0.6 : 0.2})`, stroke: `rgb(${st.rgb})`, lw: 2 });
    }
  });
}

export function drawLadder(g: G) {
  const { x, y } = LADDER_SPOT;
  if (!sprite(g, paths.scenery('prop-dungeon-ladder'), x, y, 54)) {
    rrect(g, x, y, 36, 44, 4, { fill: 'rgba(255,128,0,0.3)', stroke: ORANGE, lw: 2 });
  }
}

export function drawAltar(g: G, t: number) {
  const { x, y } = ALTAR_SPOT;
  const scale = 1 + 0.1 * tri(t, 2.4);
  if (!sprite(g, paths.scenery('prop-star-altar'), x, y, 72 * scale)) {
    circle(g, x, y, 36, { fill: 'rgba(128,0,128,0.5)', stroke: YELLOW, lw: 3, glow: 14 });
  }
}

/** A solved room whose guardian was not befriended shows a star to call them back. */
export function drawGuardianStar(g: G) {
  g.save();
  g.font = '38px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.fillStyle = YELLOW;
  g.fillText('✦', RESIDENT_SPOT.x, -RESIDENT_SPOT.y);
  g.restore();
}

export function drawResident(g: G, guardianID: string, hop: number) {
  sprite(g, paths.follower(guardianID), RESIDENT_SPOT.x, RESIDENT_SPOT.y + hop, 54);
}

// ---------- guardian homes ----------

const NAMI_POOL = tileCenter(8, 7);
const AKANE_HEARTH = tileCenter(8, 9);
const TSUKI_MOON = tileCenter(8, 10);
const tsukiMoonY = (t: number) => TSUKI_MOON.y + 4 * tri(t, 4);

const SHELL: (string | number)[][] = [['M', 0, -7], ['Q', -12, -3, -11, 5], ['Q', 0, 17, 11, 5], ['Q', 12, -3, 0, -7]];
const FLAME: (string | number)[][] = [['M', 0, -8], ['Q', -15, -3, -11, 8], ['Q', -6, 19, 0, 29], ['Q', 4, 14, 11, 8], ['Q', 15, -3, 0, -8]];
const CRESCENT: (string | number)[][] = [['M', 10, 27], ['C', -35, 32, -35, -32, 10, -27], ['C', -10, -14, -10, 14, 10, 27]];

function homeProps(g: G, home: HomeID) {
  for (const [name, col, row, size] of HOME_PROPS[home]) {
    const p = tileCenter(col, row);
    sprite(g, paths.scenery(name), p.x, p.y, size);
  }
}

export function drawHome(g: G, home: HomeID, t: number) {
  const c = tileCenter(8, 7);
  switch (home) {
    case 'koko': {
      ellipse(g, c.x, c.y, 150, 82, { fill: 'rgba(115,64,64,0.8)', stroke: 'rgba(232,179,102,0.8)', lw: 3 });
      for (const x of [-48, 48]) rrect(g, c.x + x, c.y - 20, 34, 23, 9, { fill: 'rgb(173,120,158)', stroke: 'rgba(255,255,255,0.5)' });
      homeProps(g, home);
      const plate = tileCenter(9, 8);
      ellipse(g, plate.x, plate.y, 30, 16, { fill: BROWN, stroke: ORANGE });
      for (const x of [-7, 0, 7]) circle(g, plate.x + x, plate.y, 4, { fill: ORANGE, stroke: BROWN });
      const lamp = tileCenter(6, 8);
      circle(g, lamp.x, lamp.y, 9, { fill: YELLOW, stroke: ORANGE, glow: 18, glowColor: 'rgba(255,220,0,0.9)' });
      break;
    }
    case 'nami': {
      const p = NAMI_POOL;
      ellipse(g, p.x, p.y, 190, 100, { fill: 'rgba(13,89,120,0.94)', stroke: 'rgb(130,222,224)', lw: 5 });
      const u = (t % 3) / 1.5;
      const scale = u < 1 ? 0.9 + 0.22 * u : 1.12 - 0.22 * (u - 1);
      g.save();
      g.globalAlpha = u < 1 ? 0.8 - 0.55 * u : 0.25 + 0.55 * (u - 1);
      ellipse(g, p.x, p.y, 142 * scale, 65 * scale, { stroke: 'rgba(0,255,255,0.65)', lw: 2 });
      g.restore();
      for (const [x, y] of [[-62, -33], [-38, -46], [48, -44]]) {
        path(g, p.x + x, p.y + y, SHELL, { fill: 'rgb(255,201,184)', stroke: 'rgba(255,255,255,0.85)' });
      }
      const k = tri(t, 3.6);
      const tray = { x: p.x + 53 - 5 * k, y: p.y + 9 + 3 * k };
      ellipse(g, tray.x, tray.y, 50, 26, { fill: 'rgb(143,89,56)', stroke: 'rgb(245,191,117)', lw: 2 });
      for (const x of [-10, 10]) {
        ellipse(g, tray.x + x, tray.y + 1, 12, 9, { fill: WHITE, stroke: CYAN });
        ellipse(g, tray.x + x, tray.y + 1, 7, 4, { fill: BROWN });
      }
      homeProps(g, home);
      break;
    }
    case 'akane': {
      ellipse(g, c.x, c.y, 174, 86, { fill: 'rgba(97,33,48,0.95)', stroke: 'rgb(242,153,74)', lw: 3 });
      for (const x of [-53, 53]) rrect(g, c.x + x, c.y - 23, 34, 25, 9, { fill: 'rgb(199,102,64)', stroke: 'rgba(255,255,0,0.55)' });
      const h = AKANE_HEARTH;
      ellipse(g, h.x, h.y, 102, 47, { fill: 'rgb(48,41,43)', stroke: GRAY, lw: 5 });
      for (const x of [-20, 0, 20]) {
        const down = 0.7 + Math.abs(x) / 100, up = 0.9 + Math.abs(x) / 100;
        const q = t % (down + up);
        const sy = q < down ? 1.06 - 0.2 * (q / down) : 0.86 + 0.2 * ((q - down) / up);
        path(g, h.x + x, h.y, FLAME, { fill: ORANGE, stroke: YELLOW, glow: 6, glowColor: 'rgba(255,170,0,0.9)' }, sy);
      }
      homeProps(g, home);
      const plate = tileCenter(10, 7);
      ellipse(g, plate.x, plate.y, 39, 21, { fill: BROWN, stroke: ORANGE });
      for (const x of [-9, 9]) ellipse(g, plate.x + x, plate.y, 15, 11, { fill: 'rgb(235,166,77)', stroke: BROWN });
      break;
    }
    case 'tsuki': {
      ellipse(g, c.x, c.y, 174, 80, { fill: 'rgba(56,48,99,0.95)', stroke: 'rgb(179,163,242)', lw: 3 });
      for (const x of [-53, 53]) rrect(g, c.x + x, c.y - 22, 34, 25, 9, { fill: 'rgb(125,102,176)', stroke: 'rgba(255,255,255,0.6)' });
      path(g, TSUKI_MOON.x, tsukiMoonY(t), CRESCENT, { fill: 'rgb(227,217,255)', stroke: WHITE, glow: 7 });
      for (const col of [6, 10]) {
        const b = tileCenter(col, 9);
        rrect(g, b.x, b.y, 35, 23, 3, { fill: 'rgb(209,199,235)', stroke: PURPLE, lw: 2 });
        g.fillStyle = PURPLE;
        g.fillRect(b.x - 0.5, -b.y - 9.5, 1, 19);
      }
      break;
    }
  }
}

// ---------- short-lived effects ----------

export interface Effect { start: number; dur: number; layer: 'furnish' | 'resident'; draw(g: G, p: number, t: number): void }

/** Nami's pool ripples, Akane's hearth blooms, Tsuki's moon sheds stars. Koko has none. */
export function homeEffect(home: HomeID, celebrate: boolean, now: number): Effect | null {
  switch (home) {
    case 'nami':
      return {
        start: now, dur: 0.8, layer: 'furnish',
        draw(g, p) {
          g.save();
          g.globalAlpha = 1 - p;
          ellipse(g, NAMI_POOL.x, NAMI_POOL.y, 110 * (1 + 0.6 * p), 55 * (1 + 0.6 * p), { stroke: 'rgba(255,255,255,0.85)', lw: 2 });
          g.restore();
        },
      };
    case 'akane': {
      const peak = celebrate ? 1.8 : 1.25;
      return {
        start: now, dur: 0.7, layer: 'furnish',
        draw(g, p) {
          const s = 1 + (peak - 1) * p;
          g.save();
          g.globalAlpha = 1 - p;
          ellipse(g, AKANE_HEARTH.x, AKANE_HEARTH.y, 80 * s, 38 * s, { fill: 'rgba(255,128,0,0.3)', stroke: 'rgba(255,255,0,0.8)', glow: 8 });
          g.restore();
        },
      };
    }
    case 'tsuki':
      return {
        start: now, dur: 1.1, layer: 'furnish',
        draw(g, p, t) {
          const n = celebrate ? 7 : 1;
          g.save();
          g.globalAlpha = 1 - p;
          g.fillStyle = WHITE;
          g.font = `${celebrate ? 18 : 13}px system-ui, sans-serif`;
          g.textAlign = 'center';
          for (let i = 0; i < n; i++) {
            g.fillText('✦', TSUKI_MOON.x + (i - (celebrate ? 3 : 0)) * 16, -(tsukiMoonY(t) - 10 + 34 * p));
          }
          g.restore();
        },
      };
    default:
      return null;
  }
}

const REACTION: Record<HomeID, [string, string]> = {
  koko: ['♥', 'rgb(255,45,85)'],
  nami: ['♫', CYAN],
  akane: ['♥', ORANGE],
  tsuki: ['✦', PURPLE],
};

/** The little symbol that floats up when a guardian is greeted or celebrates. */
export function residentReaction(home: HomeID, now: number): Effect {
  const [symbol, color] = REACTION[home];
  return {
    start: now, dur: 0.9, layer: 'resident',
    draw(g, p) {
      g.save();
      g.globalAlpha = 1 - p;
      g.fillStyle = color;
      g.font = 'bold 20px system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText(symbol, RESIDENT_SPOT.x, -(RESIDENT_SPOT.y + 40 + 18 * p));
      g.restore();
    },
  };
}
