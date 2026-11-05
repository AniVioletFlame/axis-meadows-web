// Ported from the Swift BridgeTests, MeadowLayoutTests and PlayerFacingTests.
import { describe, expect, it } from 'vitest';
import { BIOMES } from '../src/data';
import {
  BRIDGES, GRASS_TILES, LOCAL_LAYOUT, PATH_TILES, SPOTS, TILE, biomeAt, circuitTile, facingFor,
  isWalkable, key, unkey,
} from '../src/world';

const NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function flood(start: number, walkable: Set<number>) {
  const reached = new Set([start]);
  const pending = [start];
  while (pending.length) {
    const [c, r] = unkey(pending.pop()!);
    for (const [dx, dy] of NEIGHBORS) {
      const n = key(c + dx, r + dy);
      if (walkable.has(n) && !reached.has(n)) {
        reached.add(n);
        pending.push(n);
      }
    }
  }
  return reached;
}
const center = (c: number, r: number) => [c * TILE + 24, r * TILE + 24] as const;

describe('island layout', () => {
  it('gives every biome a 24x24 island and keeps paths on land', () => {
    const counts: Record<string, number> = {};
    for (let c = 0; c < 84; c++) for (let r = 0; r < 54; r++) {
      const b = biomeAt(c, r);
      if (b) counts[b] = (counts[b] ?? 0) + 1;
    }
    for (const b of BIOMES) expect(counts[b]).toBe(24 * 24);
    for (const k of PATH_TILES) expect(biomeAt(...unkey(k))).not.toBeNull();
  });

  it('connects every meadow clearing without crossing encounter grass', () => {
    const { paths, grass } = LOCAL_LAYOUT.meadow;
    const reached = flood(key(4, 12), paths);
    expect(reached.size).toBe(paths.size);
    for (const [c, r] of [[4, 11], [4, 17], [8, 6], [11, 8]]) expect(reached.has(key(c, r))).toBe(true);
    for (const k of paths) expect(grass.has(k)).toBe(false);
    expect(grass.size).toBeGreaterThan(0);
  });

  it('never puts tall grass on a path, and every biome has some', () => {
    for (const k of GRASS_TILES.keys()) expect(PATH_TILES.has(k)).toBe(false);
    for (const b of BIOMES) expect([...GRASS_TILES.values()].includes(b)).toBe(true);
  });

  it('places every hidden spot on land in its own biome', () => {
    for (const s of SPOTS) expect(biomeAt(Math.floor(s.x / TILE), Math.floor(s.y / TILE))).toBe(s.biome);
  });
});

describe('bridges', () => {
  it('can all be crossed, and open water is blocked', () => {
    for (const span of BRIDGES) {
      for (let len = 0; len < 6; len++) for (let w = 0; w < 2; w++) {
        const c = span.col + (span.vertical ? w : len), r = span.row + (span.vertical ? len : w);
        expect(isWalkable(...center(c, r))).toBe(true);
        expect(biomeAt(c, r)).toBeNull();
      }
      const before = span.vertical ? key(span.col, span.row - 1) : key(span.col - 1, span.row);
      const after = span.vertical ? key(span.col, span.row + 6) : key(span.col + 6, span.row);
      expect(PATH_TILES.has(before)).toBe(true);
      expect(PATH_TILES.has(after)).toBe(true);
    }
    for (const [c, r] of [[27, 42], [57, 27], [42, 27], [72, 27]]) expect(isWalkable(...center(c, r))).toBe(false);
  });

  it('keeps every guardian home reachable when any one crossing is removed', () => {
    const homes = [[36, 41], [66, 41], [36, 11], [66, 11]];
    for (const omitted of [[2, 3], [4, 5], [6, 7], [8, 9]]) {
      const walkable = new Set(PATH_TILES);
      BRIDGES.forEach((span, i) => {
        if (omitted.includes(i)) return;
        for (let len = 0; len < 6; len++) for (let w = 0; w < 2; w++) {
          walkable.add(key(span.col + (span.vertical ? w : len), span.row + (span.vertical ? len : w)));
        }
      });
      const reached = flood(key(8, 42), walkable);
      for (const [c, r] of homes) expect(reached.has(key(c, r))).toBe(true);
    }
  });

  it('doubles the circuit width', () => {
    expect(circuitTile(4, 11)).toEqual([8, 41]);
    expect(circuitTile(21, 7)).toEqual([36, 37]);
    expect(circuitTile(45, 6)).toEqual([36, 6]);
  });
});

describe('player facing', () => {
  it('covers all eight sectors and the dead zone', () => {
    const cases: [number, number, string][] = [
      [0, -1, 'down'], [0, 1, 'up'], [-1, 0, 'left'], [1, 0, 'right'],
      [-1, -1, 'downLeft'], [1, -1, 'downRight'], [-1, 1, 'upLeft'], [1, 1, 'upRight'],
      [1, 0.2, 'right'], [0.2, 1, 'up'], [1, 0.5, 'upRight'],
    ];
    for (const [x, y, f] of cases) expect(facingFor(x, y)).toBe(f);
    expect(facingFor(0.01, 0.01)).toBeNull();
  });
});
