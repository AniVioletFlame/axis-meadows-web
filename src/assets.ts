// Image loading. All art lives under public/assets, copied from the Swift project's Assets/.

const BASE = `${import.meta.env.BASE_URL}assets/`;
const cache = new Map<string, HTMLImageElement>();

export const assetURL = (path: string) => BASE + path;

export function img(path: string): HTMLImageElement | undefined {
  const i = cache.get(path);
  return i && i.complete && i.naturalWidth > 0 ? i : undefined;
}

const pending = new Map<string, Promise<HTMLImageElement | undefined>>();

/** Loads an image once; repeated calls for the same path share one promise. Missing art resolves to undefined. */
export function load(path: string): Promise<HTMLImageElement | undefined> {
  let p = pending.get(path);
  if (!p) {
    p = new Promise((resolve) => {
      const i = new Image();
      cache.set(path, i);
      i.onload = () => resolve(i);
      i.onerror = () => resolve(undefined);
      i.src = assetURL(path);
    });
    pending.set(path, p);
  }
  return p;
}

export const loadAll = (paths: string[]) => Promise.all(paths.map(load));

export const ALL_PATH_STATES = [
  'nesw', 'nes', 'new', 'nsw', 'esw', 'ns', 'ew',
  'ne', 'wn', 'es', 'sw', 'n', 'e', 's', 'w', 'isolated',
] as const;

export function pathAutotileState(north: boolean, east: boolean, south: boolean, west: boolean): string {
  if (north && east && south && west) return 'nesw';
  if (north && east && south && !west) return 'nes';
  if (north && east && !south && west) return 'new';
  if (north && !east && south && west) return 'nsw';
  if (!north && east && south && west) return 'esw';
  if (north && !east && south && !west) return 'ns';
  if (!north && east && !south && west) return 'ew';
  if (north && east && !south && !west) return 'ne';
  if (north && !east && !south && west) return 'wn';
  if (!north && east && south && !west) return 'es';
  if (!north && !east && south && west) return 'sw';
  if (north && !east && !south && !west) return 'n';
  if (!north && east && !south && !west) return 'e';
  if (!north && !east && south && !west) return 's';
  if (!north && !east && !south && west) return 'w';
  return 'isolated';
}

export const paths = {
  portrait: (id: string) => `portraits/${id}.png`,
  follower: (id: string) => `overworld/${id}.png`,
  icon: (element: string) => `icons/${element}.png`,
  ground: (file: string) => `grounds/ground-${file}.png`,
  pathTile: (file: string, state?: string) => state ? `paths/path-${file}-${state}.png` : `paths/path-${file}.png`,
  grass: (file: string) => `grass/grass-${file}.png`,
  backdrop: (file: string) => `encounter-backdrops/bg-${file}.png`,
  landmark: (id: string) => `landmarks/${id}.png`,
  scenery: (prop: string) => `scenery/${prop}.png`,
  fx: (name: string) => `interaction-fx/${name}.png`,
  player: (dir: string, frame: number) => `player/axis-${dir}-${frame}.png`,
  still: (key: string) => `stills/${key}.jpg`,
  sanctuary: (file: string) => `sanctuary/${file}`,
};
