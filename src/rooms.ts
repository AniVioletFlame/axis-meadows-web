// Room layouts for the basements and the Starfall Sanctum, ported from OverworldScene.swift.
// Same y-up coordinates as the overworld.

import { BASEMENT, HOME, homeAt, isBasement, type ActiveMap, type BasementType, type HomeID } from './basement';
import { TILE, tileCenter } from './world';

export type NodeKind = 'ladder' | 'rune' | 'valve' | 'brazier' | 'chime' | 'guardian' | 'resident' | 'altar';
export interface RoomNode { kind: NodeKind; index: number; x: number; y: number; label: string }

export const roomSize = (map: ActiveMap) => ({ cols: 16, rows: map === 'starfall' ? 14 : 12 });
export const ROOM_SPAWN = { x: 8 * TILE, y: 4 * TILE };
export const LADDER_SPOT = tileCenter(8, 2);
export const RESIDENT_SPOT = tileCenter(8, 7);
export const ALTAR_SPOT = tileCenter(8, 8);

// Puzzle pieces sit on tile corners in the original, not tile centres.
const corner = (c: number, r: number) => ({ x: c * TILE, y: r * TILE });

export const PUZZLES: Record<BasementType, { kind: NodeKind; prop: string; spots: { x: number; y: number }[]; label: (i: number) => string }> = {
  'root-sanctum': {
    kind: 'rune', prop: 'prop-rune-leaf',
    spots: [corner(4, 6), corner(7, 9), corner(11, 6), corner(7, 4)],
    label: (i) => `Step on Rune ${i + 1}`,
  },
  'sunken-vault': {
    kind: 'valve', prop: 'prop-tidal-valve',
    spots: [corner(4, 7), corner(8, 9), corner(12, 7)],
    label: (i) => `Turn Tidal Valve ${i + 1}`,
  },
  'magma-forge': {
    kind: 'brazier', prop: 'prop-flame-brazier',
    spots: [corner(4, 4), corner(4, 8), corner(12, 8), corner(12, 4)],
    label: (i) => `Light Brazier ${i + 1}`,
  },
  'echoing-cavern': {
    kind: 'chime', prop: 'prop-crystal-chime',
    spots: [corner(5, 6), corner(8, 8), corner(11, 6)],
    label: (i) => `Strike 🔔 ${['Low', 'Mid', 'High'][i]}`,
  },
};

/** Furniture props for each guardian home: image, tile, drawn size. */
export const HOME_PROPS: Record<HomeID, [string, number, number, number][]> = {
  koko: [['prop-grove-log-bench', 10, 8, 68], ['prop-grove-mushroom-cluster', 5, 8, 68]],
  nami: [['prop-shore-starfish-rock', 6, 6, 60], ['prop-shore-glowing-coral', 10, 8, 60], ['prop-shore-tide-reeds', 6, 8, 60]],
  akane: [['prop-ember-volcanic-stones', 6, 9, 62], ['prop-ember-smoky-stump', 10, 6, 62]],
  tsuki: [],
};

/** The guardian's home, once that guardian is a friend. */
export function currentHome(map: ActiveMap, isBefriended: (id: string) => boolean): HomeID | null {
  const h = homeAt(map);
  return h && isBefriended(BASEMENT[HOME[h].basement].guardianID) ? h : null;
}

/** Interactive nodes in a room, in the order the original added them (ties go to the first). */
export function roomNodes(map: ActiveMap, solved: ReadonlySet<BasementType>, isBefriended: (id: string) => boolean): RoomNode[] {
  if (map === 'overworld') return [];
  const nodes: RoomNode[] = [{
    kind: 'ladder', index: 0, ...LADDER_SPOT,
    label: map === 'starfall' ? 'Exit to Axis Meadows' : 'Climb Ladder (Exit)',
  }];
  if (map === 'starfall') {
    nodes.push({ kind: 'altar', index: 0, ...ALTAR_SPOT, label: 'Approach Fallen Star Hoshi' });
    return nodes;
  }
  if (!isBasement(map)) return nodes;
  const puzzle = PUZZLES[map];
  puzzle.spots.forEach((p, i) => nodes.push({ kind: puzzle.kind, index: i, ...p, label: puzzle.label(i) }));
  const home = currentHome(map, isBefriended);
  if (home) {
    nodes.push({ kind: 'resident', index: 0, ...RESIDENT_SPOT, label: `Visit ${HOME[home].name}` });
  } else if (solved.has(map)) {
    nodes.push({ kind: 'guardian', index: 0, ...RESIDENT_SPOT, label: 'Call the guardian' });
  }
  return nodes;
}
