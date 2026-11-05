// Overworld layout ported from OverworldScene.swift.
// Coordinates follow the original SpriteKit convention: origin bottom-left, y grows upward.
// The renderer flips y when drawing.

import type { Biome } from './data';
import type { ActiveMap } from './basement';

export const TILE = 48;
export const COLS = 84;
export const ROWS = 54;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;
export const PLAYER_SPEED = 210;
export const PLAYER_START = { x: 8 * TILE, y: 42 * TILE };

export type Tile = readonly [number, number];
export const key = (c: number, r: number) => c * 1000 + r;
export const unkey = (k: number): Tile => [Math.floor(k / 1000), k % 1000];

interface Region { biome: Biome; cols: [number, number]; rows: [number, number] }

export const REGIONS: Region[] = [
  { biome: 'wildflowerFields', cols: [0, 23], rows: [30, 53] },
  { biome: 'whisperingGrove', cols: [30, 53], rows: [30, 53] },
  { biome: 'stardustShore', cols: [60, 83], rows: [30, 53] },
  { biome: 'emberglade', cols: [30, 53], rows: [0, 23] },
  { biome: 'crystalHollow', cols: [60, 83], rows: [0, 23] },
];

const inRange = (v: number, [a, b]: [number, number]) => v >= a && v <= b;

export function biomeAt(c: number, r: number): Biome | null {
  return REGIONS.find((g) => inRange(c, g.cols) && inRange(r, g.rows))?.biome ?? null;
}

// The layout was authored on a narrower "circuit" and then doubled in width.
export function circuitTile(c: number, r: number): Tile {
  if (c <= 11) return [c * 2, r + 30];
  if (c >= 18 && c <= 29) return [30 + (c - 18) * 2, r + 30];
  if (c >= 30 && c <= 41) return [60 + (c - 30) * 2, r + 30];
  if (c >= 42 && c <= 53) return [30 + (c - 42) * 2, r];
  return [60 + (c - 54) * 2, r];
}

function expanded(c: number, r: number): Tile[] {
  const [x, y] = circuitTile(c, r);
  return [[x, y], [x + 1, y]];
}

function rects(list: [[number, number], [number, number]][]): Set<number> {
  const s = new Set<number>();
  for (const [[c0, c1], [r0, r1]] of list) for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) s.add(key(c, r));
  return s;
}
const minus = (a: Set<number>, b: Set<number>) => new Set([...a].filter((k) => !b.has(k)));

const meadowPaths = rects([
  [[3, 8], [11, 12]], [[8, 11], [8, 9]], [[8, 11], [16, 17]], [[8, 11], [12, 13]], [[8, 8], [6, 17]],
  [[3, 5], [10, 13]], [[4, 4], [13, 17]], [[3, 5], [16, 18]], [[4, 8], [15, 15]], [[8, 8], [6, 15]], [[7, 9], [5, 7]],
]);
const meadowGrass = minus(rects([[[1, 2], [5, 7]], [[6, 7], [19, 21]], [[9, 10], [16, 19]], [[4, 5], [5, 7]]]), meadowPaths);

const grovePaths = rects([
  [[21, 29], [11, 12]], [[18, 21], [8, 9]], [[18, 21], [16, 17]], [[21, 21], [7, 17]], [[21, 27], [16, 16]],
  [[27, 27], [9, 17]], [[21, 27], [9, 9]], [[20, 22], [6, 8]], [[26, 28], [16, 18]], [[23, 25], [7, 9]],
]);
const groveGrass = minus(rects([[[19, 20], [14, 17]], [[23, 25], [18, 20]], [[24, 25], [13, 14]], [[27, 28], [3, 5]]]), grovePaths);

const shorePaths = rects([
  [[30, 41], [11, 12]], [[33, 33], [6, 11]], [[32, 34], [5, 7]], [[36, 36], [12, 16]], [[36, 39], [16, 16]],
  [[39, 39], [16, 18]], [[38, 40], [17, 19]], [[39, 39], [5, 11]], [[37, 40], [4, 6]],
]);
const shoreGrass = minus(rects([[[31, 32], [15, 18]], [[36, 37], [7, 9]], [[39, 40], [20, 21]], [[34, 35], [2, 3]]]), shorePaths);

const emberPaths = rects([
  [[42, 53], [11, 12]], [[45, 45], [6, 11]], [[44, 46], [5, 7]], [[45, 45], [12, 17]], [[44, 47], [16, 18]],
  [[47, 51], [17, 17]], [[51, 51], [12, 17]], [[50, 52], [16, 18]],
]);
const emberGrass = minus(rects([[[43, 44], [8, 9]], [[48, 50], [4, 7]], [[47, 48], [13, 14]], [[50, 52], [20, 21]]]), emberPaths);

const crystalPaths = rects([
  [[54, 63], [11, 12]], [[57, 57], [6, 17]], [[56, 58], [5, 7]], [[56, 58], [16, 18]], [[57, 63], [15, 15]],
  [[63, 63], [12, 18]], [[62, 64], [17, 19]],
]);
const crystalGrass = minus(rects([[[55, 56], [8, 9]], [[60, 62], [7, 9]], [[59, 60], [13, 14]], [[62, 63], [20, 21]]]), crystalPaths);

export interface BridgeSpan { col: number; row: number; vertical: boolean }
export const BRIDGES: BridgeSpan[] = [
  { col: 24, row: 38, vertical: false }, { col: 24, row: 46, vertical: false },
  { col: 54, row: 38, vertical: false }, { col: 54, row: 46, vertical: false },
  { col: 54, row: 8, vertical: false }, { col: 54, row: 16, vertical: false },
  { col: 36, row: 24, vertical: true }, { col: 46, row: 24, vertical: true },
  { col: 66, row: 24, vertical: true }, { col: 76, row: 24, vertical: true },
];

export const BRIDGE_TILES = new Set<number>();
for (const b of BRIDGES) {
  for (let len = 0; len < 6; len++) for (let w = 0; w < 2; w++) {
    BRIDGE_TILES.add(key(b.col + (b.vertical ? w : len), b.row + (b.vertical ? len : w)));
  }
}

export const PATH_TILES = new Set<number>();
for (const set of [meadowPaths, grovePaths, shorePaths, emberPaths, crystalPaths]) {
  for (const k of set) for (const [c, r] of expanded(...unkey(k))) PATH_TILES.add(key(c, r));
}
const addRect = (c0: number, c1: number, r0: number, r1: number) => {
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) PATH_TILES.add(key(c, r));
};
for (const start of [30, 60]) {
  for (const row of [8, 16, 38, 46]) addRect(start, start + 23, row, row + 1);
  for (const col of [start + 6, start + 16]) {
    addRect(col, col + 1, 11, 23);
    addRect(col, col + 1, 30, 42);
  }
}

/** World tiles with tall grass, mapped to the biome that owns them. */
export const GRASS_TILES = new Map<number, Biome>();
const grassByBiome: [Biome, Set<number>][] = [
  ['wildflowerFields', meadowGrass], ['whisperingGrove', groveGrass], ['stardustShore', shoreGrass],
  ['emberglade', emberGrass], ['crystalHollow', crystalGrass],
];
for (const [biome, set] of grassByBiome) {
  for (const k of set) for (const [c, r] of expanded(...unkey(k))) {
    if (!PATH_TILES.has(key(c, r))) GRASS_TILES.set(key(c, r), biome);
  }
}

/** Same footprint check as the original: four corners of a 16pt box must be on land or a bridge. */
export function isWalkable(x: number, y: number): boolean {
  for (const dx of [-8, 8]) for (const dy of [-8, 8]) {
    const px = x + dx, py = y + dy;
    if (px < 0 || py < 0 || px >= WORLD_W || py >= WORLD_H) return false;
    const c = Math.floor(px / TILE), r = Math.floor(py / TILE);
    if (biomeAt(c, r) === null && !BRIDGE_TILES.has(key(c, r))) return false;
  }
  return true;
}

export const tileCenter = (c: number, r: number) => ({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });

export interface Spot {
  id: string; biome: Biome; x: number; y: number; label: string;
  /** Where the spot leads, for portals. */
  portal: Exclude<ActiveMap, 'overworld'> | null;
}

const SPOT_DEFS: [string, Biome, number, number, string, Spot['portal']][] = [
  ['grove-barrel', 'whisperingGrove', 21, 7, 'Root Sanctum (B1)', 'root-sanctum'],
  ['grove-mushroom', 'whisperingGrove', 27, 17, 'Giant Mushroom', null],
  ['crystal-shrine', 'crystalHollow', 57, 6, 'Echoing Cavern (B1)', 'echoing-cavern'],
  ['crystal-bell', 'crystalHollow', 63, 18, 'Cracked Bell', null],
  ['crystal-star-pool', 'crystalHollow', 57, 17, 'Star Pool', null],
  ['ember-hollow-tree', 'emberglade', 45, 6, 'Hollow Tree', null],
  ['ember-lantern', 'emberglade', 51, 17, 'Magma Forge (B1)', 'magma-forge'],
  ['shore-driftwood', 'stardustShore', 33, 6, 'Driftwood', null],
  ['shore-tidepool', 'stardustShore', 39, 18, 'Sunken Vault (B1)', 'sunken-vault'],
  ['meadow-old-well', 'wildflowerFields', 4, 11, 'Starfall Sanctum', 'starfall'],
  ['meadow-violet-archive', 'wildflowerFields', 11, 12, 'The Violet Archive', null],
  ['shore-our-horizon', 'stardustShore', 38, 6, 'Moonlit Shoreline (Fox & Michael)', null],
  ['crystal-lotus-pond', 'crystalHollow', 58, 16, 'Lotus Crystal Ledge (Tsuki & Us)', null],
];

export const SPOTS: Spot[] = SPOT_DEFS.map(([id, biome, c, r, label, portal]) => {
  const [x, y] = circuitTile(c, r);
  return { id, biome, label, portal, ...tileCenter(x, y) };
});

export const SCENERY: { prop: string; x: number; y: number }[] = ([
  ['prop-wildflower-bush', 2, 18], ['prop-wildflower-bush', 6, 17], ['prop-wildflower-bush', 9, 8],
  ['prop-wildflower-fence-post', 2, 10], ['prop-wildflower-fence-post', 6, 10], ['prop-wildflower-flower-crate', 4, 17],
  ['prop-grove-log-bench', 8, 6], ['prop-grove-canopy-tree', 19, 19], ['prop-grove-canopy-tree', 24, 20],
  ['prop-grove-canopy-tree', 28, 5], ['prop-grove-canopy-tree', 19, 5], ['prop-grove-log-bench', 24, 8],
  ['prop-shore-glowing-coral', 37, 19], ['prop-shore-glowing-coral', 40, 15], ['prop-shore-starfish-rock', 31, 5],
  ['prop-shore-starfish-rock', 40, 4], ['prop-grove-log-bench', 38, 5], ['prop-ember-volcanic-stones', 49, 19],
  ['prop-ember-volcanic-stones', 43, 5], ['prop-ember-brazier', 46, 17], ['prop-ember-smoky-stump', 44, 16],
  ['prop-ember-smoky-stump', 47, 18], ['prop-crystal-amethyst-cluster', 55, 19], ['prop-crystal-amethyst-cluster', 64, 16],
  ['prop-crystal-ancient-marker', 59, 5], ['prop-crystal-stalagmite', 62, 5], ['prop-crystal-stalagmite', 60, 20],
] as [string, number, number][]).map(([prop, c, r]) => {
  const [x, y] = circuitTile(c, r);
  return { prop, ...tileCenter(x, y) };
});

export type Facing = 'down' | 'up' | 'left' | 'right' | 'downLeft' | 'downRight' | 'upLeft' | 'upRight';

/** Eight equal 45° sectors, as in PlayerFacing.direction(for:). dy is y-up. */
export function facingFor(dx: number, dy: number): Facing | null {
  if (Math.hypot(dx, dy) <= 0.08) return null;
  const x = Math.abs(dx), y = Math.abs(dy);
  const t = 0.41421356237;
  if (y < x * t) return dx > 0 ? 'right' : 'left';
  if (x < y * t) return dy > 0 ? 'up' : 'down';
  if (dy > 0) return dx > 0 ? 'upRight' : 'upLeft';
  return dx > 0 ? 'downRight' : 'downLeft';
}

/** Pre-widening layout sets, exported for tests. */
export const LOCAL_LAYOUT = {
  meadow: { paths: meadowPaths, grass: meadowGrass },
  grove: { paths: grovePaths, grass: groveGrass },
  shore: { paths: shorePaths, grass: shoreGrass },
  ember: { paths: emberPaths, grass: emberGrass },
  crystal: { paths: crystalPaths, grass: crystalGrass },
};
