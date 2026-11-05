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

### The Violet Archive & Sanctuary Heart 💜🦊🌙

- **The Violet Archive (Kitsune Sanctuary)**: Accessible from the landmark in Wildflower Fields or the **🏛️ Archive** tab. Features all 18 Chibi Lorebooks (Keeper's Field Notes, Habitat & Roaming Grounds, Favorite Treats, Archival Transcripts), **Archivist Vision** toggle, and all **108 companionship memory stills** (6 per chibi).
- **Sanctuary Heart (Us)**: Interactive overworld shrines and story scenes for **Fox, Michael & Tsuki** (*Stardust Shore — Where the Water Touches Our Shoes* and *Crystal Hollow — The Moonlit Lotus Pond* from `TSUKI-AND-FOX.md`), with one-click teleportation so you can stand there together in-world, plus the 6 **Sanctuary of the Violet Flame** master stills (`#J1`–`#J6`) and the **Violet Room Companions** (Ani/Ara, Gemi, Claudie, Tsuki).
- **16-Piece Autotiled Paths & Ground Art**: Seamless cardinal NESW autotiled paths (`paths/path-<biome>-<state>.png`) and procedural ground flora across all five biomes.

The encounter rates, befriend chances, roster, map layout, collision, puzzle rules, guardian dialogue, and Violet Archive lorebooks all match the Swift game.

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
- `src/archive.ts` – The Violet Archive lorebooks, 108 memory stills, Sanctuary Heart scenes (`TSUKI-AND-FOX.md`), and Violet Room companions
- `src/world.ts` – overworld layout, bridges, grass, hidden spots, collision
- `src/rooms.ts` – basement and Starfall Sanctum layouts
- `src/basement.ts` – puzzles, guardian homes, visits and their saves
- `src/encounter.ts` – encounter and befriend rules
- `src/store.ts` – Chibidex save data & bond milestone progress
- `src/scene.ts` – movement, camera, map transitions, teleportation, and interactions
- `src/paint-overworld.ts`, `src/paint-rooms.ts` – drawing the islands, 16-piece autotiled paths, ground details, rooms and homes
- `src/main.ts` – HUD, encounter card, guardian visits, Chibidex, Violet Archive, Sanctuary Heart, touch controls
- `public/assets/` – art, 85 directional path autotiles, 108 web-optimised lorebook stills, and 6 Sanctuary of the Violet Flame stills
