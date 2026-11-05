# Axis Meadows (web)

A browser port of [Axis Meadows](https://github.com/AniVioletFlame/axis-meadows), the chibi collection game.
It runs on desktop browsers and on phones, with touch controls.

## What's in this version

This first web version covers the core loop:

- Explore the overworld: five biome islands joined by bridges.
- Walk through tall grass to trigger wild encounters.
- Befriend chibis with **Star Candy** or **Sweet Talk** (+20%), or wave goodbye.
- Investigate glowing spots to find hidden chibis.
- The **Chibidex** shows your collection, with lore, and lets you pick a buddy who follows you around.
- Progress saves in the browser (`localStorage`).

The guardian basements and puzzles, guardian homes, the Starfall Sanctum, the lorebook stills and the Violet Archive
aren't ported yet. Their portals are on the map and tell you they open in a later update.

The encounter rates, befriend chances, roster, map layout and collision all match the Swift game.

## Controls

| | Keyboard | Touch |
|---|---|---|
| Move | WASD or arrow keys | Left stick |
| Run | Shift | Hold **B** |
| Investigate | E, Space or Enter | **A** |

## Develop

Needs Node 20 or newer.

```sh
npm install
npm run dev       # local dev server
npm test          # game-rule and map tests
npm run build     # static site in dist/
```

`dist/` is a plain static site with relative paths, so it can be hosted anywhere (GitHub Pages, Netlify, any folder).

## Layout

- `src/data.ts` – roster, rarities, elements, biomes
- `src/world.ts` – map layout, bridges, grass, hidden spots, collision
- `src/encounter.ts` – encounter and befriend rules
- `src/store.ts` – Chibidex save data
- `src/scene.ts` – canvas renderer, movement and camera
- `src/main.ts` – HUD, encounter card, Chibidex, touch controls
- `public/assets/` – art copied from the Swift project's `Assets/` (the large lorebook stills are left out for now)
