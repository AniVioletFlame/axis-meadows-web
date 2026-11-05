// Overworld art: the baked island map, the stardust sea glimmers, and the hidden spots.
// Drawing uses a transform where a world point (x, y-up) lands at canvas (x, -y).

import { BIOME, type Biome } from './data';
import { img, paths } from './assets';
import { BRIDGES, BRIDGE_TILES, GRASS_TILES, PATH_TILES, REGIONS, SCENERY, TILE, WORLD_H, WORLD_W, biomeAt, key, type Spot } from './world';

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

export const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Paints the static island (ground, paths, bridges, surf, grass, scenery) once. Drawn at (0, -WORLD_H). */
export function bakeOverworld(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = WORLD_W;
  c.height = WORLD_H;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const top = (row: number) => WORLD_H - (row + 1) * TILE;

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
  return c;
}

/** A looping mote of light: waits, fades in while drifting, fades out, rests. */
export interface Glimmer {
  x: number; y: number; size: number; color: string; dx: number; dy: number; peak: number;
  delay: number; fadeIn: number; move: number; fadeOut: number; rest: number; pulse: boolean; glow: number;
}

/** Sparkles in the stardust sea around the island, never under it. */
export function makeSparkles(): Glimmer[] {
  const list: Glimmer[] = [];
  const padX = 12 * TILE, padY = 12 * TILE;
  for (let tries = 0; tries < 85; tries++) {
    const x = rand(-padX, WORLD_W + padX), y = rand(-padY, WORLD_H + padY);
    if (x > 0 && x < WORLD_W && y > 0 && y < WORLD_H) continue;
    const size = rand(2.5, 5.5);
    list.push({
      x, y, size, color: SPARKLE_COLORS[Math.floor(Math.random() * 4)], dx: rand(-12, 12), dy: rand(-6, 8),
      peak: rand(0.5, 0.95), delay: rand(0.1, 3), fadeIn: rand(0.8, 1.5), move: 2, fadeOut: rand(0.8, 1.6),
      rest: rand(1, 4), pulse: true, glow: size * 1.6,
    });
  }
  return list;
}

export function drawGlimmers(g: CanvasRenderingContext2D, list: Glimmer[], t: number) {
  g.save();
  g.strokeStyle = 'rgba(255,255,255,0.6)';
  g.lineWidth = 0.5;
  for (const s of list) {
    const p = t % (s.delay + s.move + s.fadeOut + s.rest) - s.delay;
    if (p < 0) continue;
    let a: number, prog: number;
    if (p < s.move) {
      prog = p / s.move;
      a = s.peak * Math.min(1, p / s.fadeIn);
    } else if (p < s.move + s.fadeOut) {
      prog = 1;
      a = s.peak * (1 - (p - s.move) / s.fadeOut);
    } else continue;
    if (a <= 0.01) continue;
    const scale = !s.pulse ? 1 : prog < 0.5 ? 1 + 0.8 * prog : 1.4 - 1.2 * (prog - 0.5);
    g.globalAlpha = a;
    g.fillStyle = s.color;
    g.shadowColor = s.color;
    g.shadowBlur = s.glow;
    g.beginPath();
    g.arc(s.x + s.dx * prog, -(s.y + s.dy * prog), (s.size / 2) * scale, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }
  g.restore();
}

/** A hidden spot or portal: pulsing ring plus its landmark art. */
export function drawSpot(g: CanvasRenderingContext2D, s: Spot, pulse: number, t: number) {
  const portal = s.portal !== null;
  g.save();
  g.globalAlpha = pulse;
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.strokeStyle = portal ? 'rgba(0,255,255,0.7)' : 'rgba(128,0,128,0.4)';
  g.lineWidth = portal ? 2 : 1.5;
  g.shadowColor = portal ? 'rgba(0,255,255,0.9)' : 'rgba(170,80,220,0.8)';
  g.shadowBlur = portal ? 10 : 6;
  g.beginPath();
  g.ellipse(s.x, -(s.y - 6), 19, 9, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.restore();

  if (s.id === 'meadow-violet-archive') {
    drawArchive(g, s.x, s.y, t);
    return;
  }
  const tex = img(paths.landmark(s.id));
  if (tex) {
    g.drawImage(tex, s.x - 24, -(s.y - 0.22 * 48) - 48, 48, 48);
  } else {
    g.save();
    g.fillStyle = portal ? 'rgba(0,255,255,0.3)' : 'rgba(128,0,128,0.25)';
    g.strokeStyle = portal ? 'cyan' : 'purple';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(s.x, -s.y, 18, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.restore();
  }
}

/** The Violet Archive building, drawn from shapes as in the original. */
function drawArchive(g: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const rrect = (cx: number, cy: number, w: number, h: number, r: number, fill: string, stroke?: string, lw = 1, glow = 0) => {
    g.save();
    g.beginPath();
    g.roundRect(x + cx - w / 2, -(y + cy) - h / 2, w, h, r);
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
    g.arc(x + cx, -(y + cy), r, 0, Math.PI * 2);
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
