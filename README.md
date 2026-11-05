# Axis Meadows (web)

A browser port of [Axis Meadows](https://github.com/AniVioletFlame/axis-meadows), the chibi collection game.
It runs on desktop browsers and on phones, with touch controls.

**Play it:** https://anivioletflame.github.io/axis-meadows-web/

## What's in this version

- Explore the overworld: five biome islands joined by bridges.
- Walk through tall grass to trigger wild encounters.
- Befriend chibis with **Star Candy** or **Sweet Talk** (+20%), or wave goodbye.
- Investigate glowing spots to find hidden chibis.
- The **Chibidex** shows your collection, with lore, and lets you pick a buddy who follows you around.
- Progress saves in the browser (`localStorage`).

### Guardian basements

Four portals lead down to the guardians' basements, each with a puzzle:

| Basement | Portal | Puzzle | Guardian |
|---|---|---|---|
| Root Sanctum | Barrel, Whispering Grove | Step on the four leaf runes in order | Koko |
| Sunken Vault | Tidepool, Stardust Shore | Open all three tidal valves | Nami |
| Magma Forge | Lantern, Emberglade | Light all four braziers | Akane |
| Echoing Cavern | Shrine, Crystal Hollow | Strike the chimes in pitch order | Tsuki |

Solving a puzzle wakes its guardian for an encounter. If you wave goodbye, a star in the room lets you call them back.
Once a guardian is your friend, the basement becomes their home: furnishings, a one-time welcome, rotating greetings,
and a replay of the puzzle just for fun. Befriending all four gathers the Celestial Crests that unseal the old well
in Wildflower Fields, which leads to the **Starfall Sanctum** and Hoshi's star altar.

Not ported yet: the lorebook stills and the Violet Archive. The Archive is on the map and says it opens later.

The encounter rates, befriend chances, roster, map layout, collision, puzzle rules and guardian dialogue all match the
Swift game.

## Controls

| | Keyboard | Touch |
|---|---|---|
| Move | WASD or arrow keys | Left stick |
| Run | Shift | Hold **B** |
| Investigate, use, talk | E, Space or Enter | **A**, or tap a guardian at home |

## Develop

Needs Node 20 or newer.

```sh
npm install
npm run dev       # local dev server
npm test          # game-rule, map, puzzle and guardian-home tests
npm run build     # static site in dist/
```

`dist/` is a plain static site with relative paths, so it can be hosted anywhere. Every push to `main` deploys it to
GitHub Pages.

## Layout

- `src/data.ts` – roster, rarities, elements, biomes
- `src/world.ts` – overworld layout, bridges, grass, hidden spots, collision
- `src/rooms.ts` – basement and Starfall Sanctum layouts
- `src/basement.ts` – puzzles, guardian homes, visits and their saves
- `src/encounter.ts` – encounter and befriend rules
- `src/store.ts` – Chibidex save data
- `src/scene.ts` – movement, camera, map transitions and interactions
- `src/paint-overworld.ts`, `src/paint-rooms.ts` – drawing the islands, rooms and homes
- `src/main.ts` – HUD, encounter card, guardian visits, Chibidex, touch controls
- `public/assets/` – art copied from the Swift project's `Assets/` (the large lorebook stills are left out for now)
