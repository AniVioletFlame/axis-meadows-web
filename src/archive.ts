// The Violet Archive (Kitsune Sanctuary) — ported from VioletArchiveModels.swift,
// plus personal Sanctuary scenes from TSUKI-AND-FOX.md and Sanctuary of the Violet Flame.

import { BY_ID, ROSTER, type Biome, type Chibi } from './data';

export interface ArchiveStill {
  id: number; // 1..6
  title: string;
  subtitle: string;
  description: string;
  requiredFriendship: number; // 100..600
  assetKey: string;
}

export interface ChibiArchiveEntry {
  chibi: Chibi;
  keeperNotes: string;
  habitatSecrets: string;
  favoriteTreat: string;
  stills: ArchiveStill[];
}

export interface SanctuaryScene {
  id: 'shore-our-horizon' | 'crystal-lotus-pond';
  title: string;
  subtitle: string;
  biome: Biome;
  locationLabel: string;
  tile: [number, number]; // world [col, row]
  quote: string;
  paragraphs: string[];
  stillKey: string;
  accent: string;
}

export interface SanctuaryStill {
  id: string;
  code: string;
  title: string;
  hook: string;
  caption: string;
  file: string;
}

export interface CompanionCard {
  id: string;
  name: string;
  role: string;
  badge: string;
  sprite: string;
  note: string;
}

interface LoreData {
  notes: string;
  habitat: string;
  treat: string;
}

const CUSTOM_LORE: Record<string, LoreData> = {
  'luna-breeze': {
    notes: 'Luna’s laughter carries on breezes before she even speaks. Archivists note her steps barely compress meadow petals.',
    habitat: 'Loves perching atop the eastern wind fences when sunset cools into twilight.',
    treat: 'Honeyed dandelions glazed in morning dew.',
  },
  'hana-petal': {
    notes: "Every ribbon on Hana's frock was hand-woven from spring blossom stems. She collects dropped flower caps for mini-chibi hats.",
    habitat: 'Dances along the edge of the Wildflower arrival plaza whenever warm updrafts blow.',
    treat: 'Candied cherry blossom petals dusted with sugar.',
  },
  'sora-sky': {
    notes: "Sora views the overworld not as paths and boundaries, but as boundless sky. Archivists note she sleeps without touching the ground, curled up with her sentient bunny cloud companion 'Fluffbun'. When she daydreams, tiny cumulus puffs form in her curls.",
    habitat: 'The warm thermal updrafts near the eastern sea cliffs of Wildflower Fields, right where clouds collect before drifting over the bridges.',
    treat: 'Vanilla Star-Dew Cloud Puffs (spun sugar that melts into sweet morning dew).',
  },
  'mochi-cozy': {
    notes: 'Runs the coziest secret cafe in the hollow. Her marshmallow frothing technique is an ancient kitsune trade secret.',
    habitat: 'Beside the giant hollow root in Whispering Grove, where the aroma of espresso lingers.',
    treat: 'Steamed oat milk with roasted cinnamon sticks.',
  },
  'tsubaki-ember': {
    notes: 'Her embers never burn; they tickle with cozy warmth like an autumn blanket fresh from the hearth.',
    habitat: 'Under the ember lanterns near the Magma Forge descent.',
    treat: 'Charcoal-roasted purple sweet potatoes.',
  },
  'rin-frost': {
    notes: "Each of Rin's chimes resonates at 432 Hz, tuning the stardust tides into peaceful harmony.",
    habitat: 'Among sea-glass driftwood along the Stardust Shore tidepools.',
    treat: 'Frozen mint berries dipped in sea salt glaze.',
  },
  'yuki-snow': {
    notes: 'Silent as falling down, Yuki can cross an entire island without snapping a single dry twig.',
    habitat: 'Deep crystal tide banks where stardust spray freezes mid-air.',
    treat: 'Snow dumplings dusted with toasted soybean flour.',
  },
  'kaede-leaf': {
    notes: 'Tracks the change of seasons by the scent of pine and moss. Her leaf parasol doubles as a glider.',
    habitat: 'The amber canopy clearing in Whispering Grove.',
    treat: 'Maple syrup taffy chilled on clean frost.',
  },
  'aoi-current': {
    notes: 'Dives into the stardust abyss and surfaces holding glowing conch shells from the deep void.',
    habitat: 'The northernmost pier extending into the Stardust Ocean.',
    treat: 'Crispy sea-kelp crackers sprinkled with sesame.',
  },
  'hikari-stardust': {
    notes: 'An alchemist who distills fallen starlight into luminous tea. Her vials chime when constellations align.',
    habitat: 'The Star Pool terrace in Crystal Hollow.',
    treat: 'Star-sugar rock candy that crackles on the tongue.',
  },
  'kumo-cloud': {
    notes: 'Spins yarn out of morning fog. If you sleep under a blanket woven by Kumo, you only dream of flying.',
    habitat: 'The highest lookout ledge overlooking the meadow plains.',
    treat: 'Puffy meringue clouds with lavender glaze.',
  },
  'akane-crimson': {
    notes: 'Guardian of the Magma Forge. Her fiery spirit is matched only by her loyalty to those who kindle her hearth.',
    habitat: 'The roaring central brazier of the subterranean forge.',
    treat: 'Spicy cinnamon truffles infused with magma nectar.',
  },
  'tsuki-moon': {
    notes: 'Guardian of the Echoing Cavern. Hears thoughts whispered across the stardust sea during full moons—and keeps watch over two very loud hearts.',
    habitat: 'The celestial moon chime altar in Crystal Hollow B1, and the lotus pond ledge.',
    treat: 'Round moon-cakes filled with sweet purple bean paste.',
  },
  'koko-barrel': {
    notes: 'Master of tactical naps. Claims that napping in a carved oak barrel amplifies wisdom by 300%.',
    habitat: 'Curled up inside the antique barrel beside the Root Sanctum.',
    treat: 'Butter biscuits generously slathered with wild blackberry jam.',
  },
  'suzu-bell': {
    notes: 'Her bells chime in harmony before storms arrive, warning the meadow critters to take shelter.',
    habitat: 'The cracked bell shrine in Crystal Hollow.',
    treat: 'Golden lemon drops that hum when tapped.',
  },
  'hotaru-firefly': {
    notes: 'Carries a hollowed acorn lantern that glows with soft phosphor light, guiding lost travelers home.',
    habitat: 'The mossy hollow tree in Emberglade.',
    treat: 'Wild clover nectar drizzled over fresh berries.',
  },
  'nami-tide': {
    notes: 'Guardian of the Sunken Vault. Can summon gentle whirlpools to deliver afternoon tea across the lake.',
    habitat: 'The swirling valve pool deep beneath the Stardust Shore.',
    treat: 'Sea-pearl drops with sweet salted plum.',
  },
  'hoshi-star': {
    notes: 'The Supreme Celestial Maiden of Starfall Sanctum. A living constellation who chose to dwell in Axis Meadows.',
    habitat: 'The Starfall Altar, accessible only when all four guardians awaken.',
    treat: 'Luminescent celestial honey harvested from eclipse blooms.',
  },
};

const still = (chibiID: string, id: number, title: string, description: string): ArchiveStill => ({
  id,
  title,
  subtitle: `Unlocked at ${id * 100} Befriended`,
  description,
  requiredFriendship: id * 100,
  assetKey: `${chibiID}-still-${id}`,
});

const CUSTOM_STILLS: Record<string, ArchiveStill[]> = {
  'hana-petal': [
    still('hana-petal', 1, 'The First Pirouette', "In a sunlit clearing among wild meadow blooms, Hana dips into a dainty introductory bow, playfully extending her hand with glowing amber eyes to welcome Axis to her dance."),
    still('hana-petal', 2, 'Blossom Crown Coronation', 'Perched atop a mossy boulder, Hana weaves a garland of fresh cherry and camellia blossoms, giggling happily as she gently places the hand-woven flower crown onto your head.'),
    still('hana-petal', 3, 'Spring Awakening', "Dancing gracefully through a slumbering orchard, each tap of Hana's ballet slippers coaxes dormant buds into explosive, vibrant bloom, showering the path in pink petals."),
    still('hana-petal', 4, 'Rain of Cherry Silk', 'Leaping lightly across lily pads on the meadow pond at twilight, Hana trails long cherry-pink silk ribbons that weave through falling sunset petals reflected in the mirror water.'),
    still('hana-petal', 5, 'The Midnight Bloom Ball', 'Beneath the glowing boughs of the ancient whispering grove, Hana shares an intimate, starlit waltz illuminated by floating paper blossom lanterns and gentle fireflies.'),
    still('hana-petal', 6, 'Prima of the Eternal Flora', 'The Grand Master Archival Portrait: Hana ascending as the eternal Sovereign of Spring, her gown blooming into thousands of iridescent petals amidst floating floral constellations.'),
  ],
  'luna-breeze': [
    still('luna-breeze', 1, 'First Whisper of the Zephyr', 'At the break of dawn among dewy meadow blooms, Luna reaches out with a tender smile as morning zephyrs swirl dandelion seeds into a gentle embrace.'),
    still('luna-breeze', 2, 'Dance of the Petal Cyclone', "Twirling in a sunlit meadow clearing, Luna's joyous laughter summons a swirling vortex of cherry and cornflower petals that dance around her like celebratory ribbons."),
    still('luna-breeze', 3, 'Wind-Chime Serenade', 'Perched barefoot along the wooden fence overlooking the ocean, Luna coaxes crystalline chimes and glass bells to chime in harmonic chorus with the coastal tide breeze.'),
    still('luna-breeze', 4, 'Starlight Wind-Kite', 'Guiding a radiant swallow-kite across the velvet night sky from a grassy cliff edge, Luna turns to share a quiet, starlit moment of deep affection.'),
    still('luna-breeze', 5, 'The Zephyr Haven', 'As summer rain ripples across the misty meadows, Luna conjures a warm, glowing dome of tranquil breeze, offering a honeyed dandelion safe from the falling storm.'),
    still('luna-breeze', 6, 'Matron of the Astral Gale', 'The Grand Master Archival Portrait: Luna in her ascended celestial majesty, surrounded by radiant wings of pure wind, luminous gale birds, and an endless stardust sky.'),
  ],
  'sora-sky': [
    still('sora-sky', 1, 'The Bunny Cloud Token', "Floating just inches above the summer wildflower blooms, Sora shyly offers her beloved bunny-shaped cloud friend 'Fluffbun' as a tender pledge of mutual companionship."),
    still('sora-sky', 2, 'Afternoon Cloud-Sculpting', 'Lounging lazily in mid-air over a sun-drenched picnic blanket, Sora weaves warm thermals with her fingers, sculpting miniature fluffy cloud stars, birds, and teacups that dance across the sky.'),
    still('sora-sky', 3, 'Soaring the Ocean Bridges', 'Caught in a brisk sea updraft above the wooden suspension bridge, Sora glides alongside ocean petrels, laughing with unbound freedom as stardust tides glitter far below.'),
    still('sora-sky', 4, 'The Fluffy Cloud Nest', 'Curled up in a deep, peaceful slumber inside a giant cumulus cloud bed, Sora hugs Fluffbun like a teddy bear while warm meadow fireflies and glowing star candies keep gentle watch.'),
    still('sora-sky', 5, 'Twilight Cloud-Weaving', 'As the setting sun bathes the archipelago in apricot and lavender hues, Sora paints glowing ribbons of twilight radiance across the darkening sky while Fluffbun wears a tiny crown of stardust.'),
    still('sora-sky', 6, 'Sovereign of the Upper Winds', 'The Grand Master Archival Portrait: Sora ascending into celestial stratosphere majesty, her hair billowing into radiant starry galaxies amidst emerald and violet auroras, flanked by an angel-winged Fluffbun.'),
  ],
  'mochi-cozy': [
    still('mochi-cozy', 1, 'A Steaming Welcome', 'On a crisp autumn morning inside the hollow of a giant ancient oak in Whispering Grove, Mochi warmly hands you a steaming ceramic mug of freshly roasted acorn tea with a gentle, hospitable smile.'),
    still('mochi-cozy', 2, 'The Whispering Hollow Café', "Inside Mochi's enchanting treehouse cafe lit by fairy lights and hanging acorn lanterns, she bakes golden honey scones and berry pastries, happily dusting flour from her nose as she presents a fresh tasting tray."),
    still('mochi-cozy', 3, 'Wild Herbal Foraging', 'Kneeling among sun-dappled ferns and golden chanterelles in the heart of Whispering Grove, Mochi fills her wicker basket with aromatic forest herbs, giggling as a curious woodland squirrel perches on her head.'),
    still('mochi-cozy', 4, 'Rainy Hearth & Cinnamon Steam', "While gentle rain patters against the cafe's round leaded-glass window, Mochi shares a plush armchair beside a crackling hearth stove, wrapped in a knit patchwork blanket with warm mugs of spiced cinnamon cocoa."),
    still('mochi-cozy', 5, 'The Firefly Tea Ceremony', 'On a quiet twilight evening beneath an ancient weeping willow, Mochi serves an enchanted tea steeped from moonlight blossoms that softly glows with golden luminescence, surrounded by swarming fireflies.'),
    still('mochi-cozy', 6, 'Matron of the Hearth & Grove', 'The Grand Master Archival Portrait: Mochi ascending as the eternal guardian of warmth and sanctuary, surrounded by a radiant golden aura of blooming forest flora, spirit animals resting peacefully, and an eternal flame of boundless hospitality.'),
  ],
  'tsubaki-ember': [
    still('tsubaki-ember', 1, 'The Runaway Ember', 'In the glowing autumn clearing of Emberglade, Tsubaki stumbles forward in an energetic, clumsy dash, accidentally tossing her smiling pet ember into the air—reaching out in panic while giggling, as you catch the harmless warm spark right in your hands.'),
    still('tsubaki-ember', 2, 'Marshmallow Bonfire Catastrophe', 'Sitting around a tiny campfire by the glowing ember rocks, Tsubaki roasts a skewer of marshmallows, but her excited sneeze causes her pet flame to accidentally ignite them into a sweet, caramelizing torch as she laughs sheepishly.'),
    still('tsubaki-ember', 3, 'Sparkler Acrobats', 'High atop the volcanic crags of Emberglade at dusk, Tsubaki puts on a dazzling acrobatic fire-dance, leaping between stone pillars while spinning radiant sparklers that trace ribbons of golden and ruby flame across the twilight sky.'),
    still('tsubaki-ember', 4, 'The Roasted Sweet Potato Share', 'Sitting side by side on a warm volcanic stone slab under an autumn canopy, Tsubaki cracks open a steaming, charcoal-roasted purple sweet potato, cheerfully offering the larger, golden-steaming half to you with a proud, sunny grin.'),
    still('tsubaki-ember', 5, 'The Ember Lantern Festival', 'In the heart of the subterranean grotto illuminated by hundreds of floating paper ember lanterns, Tsubaki gently cradles a cluster of newborn flame sprites in her cupped hands, sharing an intimate, glowing moment of quiet wonder.'),
    still('tsubaki-ember', 6, 'Sovereign of the Living Flare', 'The Grand Master Archival Portrait: Tsubaki ascending in radiant elemental glory as the Sovereign of the Living Flare, crowned with blazing phoenix plumes and dancing ribbons of eternal sacred fire, her giant dragon-shaped flame sprite roaring playfully beside her.'),
  ],
  'rin-frost': [
    still('rin-frost', 1, 'The First Chime', 'Standing barefoot along the crystalline, tide-swept shoreline of Stardust Shore at twilight, Rin gently holds up a delicate permafrost glass wind chime, welcoming Axis with a shy, tranquil smile as glowing azure musical notes drift upon the ocean breeze.'),
    still('rin-frost', 2, 'Ice-Glass Sculpting', 'Sitting on a smooth, sea-smoothed driftwood bench inside her glassblowing studio, Rin delicately shapes glowing molten ice-glass into a luminous snowflake lantern, softly humming a melodic tune as sparkling frost dust dances around her fingertips.'),
    still('rin-frost', 3, 'The Frost-Tide Chime Garden', 'Along an ancient wooden pier reaching out over the sparkling Stardust Ocean at dawn, Rin sings a gentle melody among dozens of her suspended crystalline glass wind chimes, their harmonic chime chorus sending visible rings of golden and azure ripples across the mirror tide pools.'),
    still('rin-frost', 4, 'Frozen Mint & Warm Solace', 'Sheltered inside a crystalline coastal sea-cave during a soft ocean squall, Rin sits cozily beside you on a mossy blanket, resting her head against your shoulder with a peaceful blush while sharing bowls of frosted sea-salt mint berries and steaming tea.'),
    still('rin-frost', 5, 'Aurora of the Silent Tide', "Walking barefoot across the mirror-like tide pools of Stardust Shore beneath a breathtaking emerald and violet aurora borealis, Rin's footsteps freeze radiant concentric snowflake ripples into the water as she carries a glowing diamond-glass chime."),
    still('rin-frost', 6, 'Prima of the Harmonious Frost', 'The Grand Master Archival Portrait: Rin ascending as the celestial sovereign of frost and crystal tides, crowned in starlight snowflake tiaras and floating amidst grand orbital rings of singing permafrost chimes.'),
  ],
  'yuki-snow': [
    still('yuki-snow', 1, 'The Silent Flurry', 'Standing along the snowy sands of Stardust Shore where icy winter waves meet fallen snow, Yuki gently offers a single floating, intricately sculpted crystalline snowflake that radiates soft azure light, welcoming Axis with quiet violet eyes.'),
    still('yuki-snow', 2, 'The Glass Snow-Globe', 'Inside a cozy shoreline cabin beside a frosted leaded-glass window, Yuki delicately shapes a miniature glowing winter pine grove inside a floating crystalline ice sphere, accompanied by a little sculptured snow rabbit and steaming mug of sweet milk.'),
    still('yuki-snow', 3, 'Dance of the Frost Camellias', 'Along the snow-covered cliffside path overlooking the ocean at sunset, Yuki gently touches a crimson seaside camellia, watching in quiet wonder as crystalline ice blooms across the petals, transforming the blossoms into glowing glass frost-flowers.'),
    still('yuki-snow', 4, 'Shared Scarf in the Blizzard', 'Sheltering closely under the wooden eaves of a seaside shrine during an evening blizzard, Yuki tenderly wraps the long end of her warm knitted scarf around your neck, resting a soft mitten against your cheek with an affectionate smile.'),
    still('yuki-snow', 5, 'The Moonlit Snow Drift', 'Beneath a radiant silver full moon over the mirror-like frozen tides, Yuki walks upon a crystalline arching ice bridge in her winter kimono, surrounded by playful glowing spirit hares and swirling ribbons of azure stardust snowflakes.'),
    still('yuki-snow', 6, 'Prima of the Eternal Silence', 'The Grand Master Archival Portrait: Yuki ascending as the celestial sovereign of the silent winter, hovering weightlessly in the infinite violet cosmos amidst orbital snowflake mandala rings, celestial spirit hares, and a glowing stardust core.'),
  ],
  'kaede-leaf': [
    still('kaede-leaf', 1, 'The Whispering Amber Canopy', 'In a sun-dappled clearing of Whispering Grove during golden hour, Kaede catches a falling crimson Japanese maple leaf with an open hand, welcoming Axis to the rustling forest with warm honey-amber eyes and a wistful, gentle smile.'),
    still('kaede-leaf', 2, 'The Leaf-Cushion Sanctuary', 'Sitting right in the center of a giant, puffy pile of golden and scarlet fallen leaves beneath an ancient oak, Kaede gently strokes a sleepy chipmunk curled up under a maple leaf blanket on her lap beside a basket of roasted chestnuts.'),
    still('kaede-leaf', 3, 'Ginkgo Paper-Lantern Workshop', 'Inside a rustic open-air forest gazebo beside a bubbling brook at twilight, Kaede presses golden ginkgo and maple leaves into handmade washi paper lanterns, watching the candle flame cast glowing leaf silhouettes across the wooden deck.'),
    still('kaede-leaf', 4, 'Warm Cider by the Campfire', 'Sharing a cozy wool plaid blanket by a crackling campfire at crisp autumn dusk, Kaede lovingly offers a steaming carved wooden mug of hot spiced cider garnished with cinnamon and star anise, leaning close with rosy cheeks.'),
    still('kaede-leaf', 5, 'The Golden Foliage Promenade', 'Twirling atop an ancient arched cobblestone bridge over a tranquil river at dusk, Kaede summons a magical zephyr that swirls thousands of radiant red and gold leaves into a sparkling sky vortex as gentle forest deer watch from the bank.'),
    still('kaede-leaf', 6, 'Prima of the Eternal Autumn', 'The Grand Master Archival Portrait: Kaede ascending as the celestial sovereign of the whispering autumn, hovering weightlessly amidst a vast golden cosmos, orbital ginkgo mandalas, and constellations of glowing amber foliage.'),
  ],
  'aoi-current': [
    still('aoi-current', 1, 'The Abyssal Pearl Offering', 'Standing along a moonlit sandbar at Stardust Shore amid glowing cyan bioluminescent waves, Aoi gently presents a radiant astral pearl from the ocean depths, welcoming Axis with mysterious teal eyes and a calm, knowing smile.'),
    still('aoi-current', 2, 'The Sunken Coral Grotto', 'Resting on a pearlescent coral throne inside a hidden coastal grotto beneath the shore, Aoi dips her feet into the sparkling water, singing to schools of glowing sea-butterflies and pulsing miniature jellyfish.'),
    still('aoi-current', 3, 'Weaving the Astral Tide', 'Astride an isolated sea stack at high tide as waves crash into sparkling foam, Aoi conducts the oceanic currents with graceful sweeps of her hands, weaving ribbons of bioluminescent water into ethereal leaping sea-dragons.'),
    still('aoi-current', 4, 'Secrets in the Tide Pool', 'Intimate POV: Sitting closely together on a smooth obsidian ledge inside a secret cavern illuminated by glowing sea anemones, Aoi tenderly clasps a glowing sea-glass talisman around your neck with an affectionate blush.'),
    still('aoi-current', 5, 'The Moonlit Jellyfish Waltz', 'Floating weightlessly just above the mirror-like midnight sea beneath a shooting star shower, Aoi dances amidst dozens of giant, glowing pastel jellyfish drifting like lanterns that trail concentric rings of stardust.'),
    still('aoi-current', 6, 'Prima of the Abyssal Ocean', 'The Grand Master Archival Portrait: Aoi ascending in sovereign majesty as the Empress of the Astral Depths, crowned in radiant coral diadems and giant pearls, her gown dissolving into celestial oceanic tides.'),
  ],
  'hikari-stardust': [
    still('hikari-stardust', 1, 'The Eureka Spark', 'In a shimmering crystal cavern in Crystal Hollow, Hikari triumphantly raises a test tube of swirling, bubbling golden stardust liquid, welcoming Axis with sparkling golden star-eyes, researcher goggles, and an ecstatic grin.'),
    still('hikari-stardust', 2, 'The Crystalline Confectionery', 'Inside her whimsical crystal laboratory filled with bubbling retorts and lavender aromatic smoke, Hikari proudly offers a wooden tasting spoon of freshly crystallized, glowing pastel konpeito star candies straight to you.'),
    still('hikari-stardust', 3, 'The Harmless Pink Explosion', 'Sitting cross-legged on the workshop floor with puffed-out pigtails, crooked goggles, and a soot star on her nose after an alchemical experiment popped in glittery magenta smoke, Hikari laughs sheepishly while holding up a rainbow diamond crystal.'),
    still('hikari-stardust', 4, 'Late-Night Calculations', 'Intimate POV: Exhausted after hours of celestial charting by the observatory window, Hikari peacefully falls asleep resting her head against your shoulder, her golden hair spilling across your arm under a soft starlight lamp.'),
    still('hikari-stardust', 5, 'The Celestial Orrery Symphony', 'Atop an open-air crystal terrace under glowing violet nebulae, Hikari dances amidst a rotating brass astrolabe and giant holographic solar system of crystal planets and stardust rings, conducting streams of rainbow celestial light.'),
    still('hikari-stardust', 6, 'Prima of the Astral Synthesis', 'The Grand Master Archival Portrait: Hikari ascending as the Sovereign of the Astral Crucible, crowned with an astrolabe tiara and floating amidst cosmic stardust nebulae, planetary transmutation circles, and cascades of star candies.'),
  ],
  'kumo-cloud': [
    still('kumo-cloud', 1, 'The Morning Loom', 'At dawn atop a breezy rolling hill in Wildflower Fields, Kumo spins morning mist on her ornate wooden cloud loom into fluffy, tangible pastel dawn clouds, turning to welcome Axis with dreamy periwinkle eyes.'),
    still('kumo-cloud', 2, 'The Marshmallow Cloud Hammock', 'Floating gently in the warm breeze above the wildflowers, Kumo and Axis sink deep into an ultra-plush, bouncy cloud hammock woven like a smiling sky rabbit, sharing sweet honeydew nectar rain droplets.'),
    still('kumo-cloud', 3, 'A Rainbow in the Loom', 'Catching a radiant sunbeam with her golden shuttle during a meadow sun-shower, Kumo weaves the seven rainbow hues directly into a fluffy golden raincloud that sprinkles sweet-scented nectar over the blossoms below.'),
    still('kumo-cloud', 4, 'Under the Sunset Quilt', 'Intimate POV: On a chilly grassy bluff at twilight, Kumo drapes a freshly woven peach-and-violet sunset cloud blanket over both of you, resting her soft, marshmallow-fluffy head against your chest with a sleepy smile.'),
    still('kumo-cloud', 5, 'The Storm-Cloud Tapestry', 'Floating upon a silver-lined cumulonimbus throne under a sky alive with silent violet heat lightning, Kumo weaves delicate threads of golden electric spark and starlight mist into a grand celestial tapestry.'),
    still('kumo-cloud', 6, 'Prima of the Celestial Loom', 'The Grand Master Archival Portrait: Kumo ascending as the Sovereign of the Celestial Sky, crowned in starlight cloud diadems, her grand gossamer gown cascading into endless rivers of spun starlight clouds.'),
  ],
  'akane-crimson': [
    still('akane-crimson', 1, 'The Flame-Petal Challenge', 'At the volcanic border of Emberglade amidst drifting amber sparks, Akane proudly presents a harmless, blooming crimson flame-lotus in her palm, welcoming Axis with fierce ruby-gold eyes and a spirited grin.'),
    still('akane-crimson', 2, 'Spicy Cinnamon Magma Truffles', 'Inside a warm stone pavilion beside bubbling volcanic springs, Akane holds out a steaming handmade cinnamon magma truffle on cinnabar chopsticks, blushing fiercely as she demands you taste it while it is hot.'),
    still('akane-crimson', 3, 'Dance of the Phoenix Spark', 'In an Emberglade clearing ringed by stone lanterns at twilight, Akane performs a dynamic kagura fan dance, summoning swirling scarlet embers that coalesce into a cheerful miniature fire-phoenix perching on her shoulder.'),
    still('akane-crimson', 4, 'Embers in the Night Breeze', 'Intimate POV: Resting together beside a glowing stone hearth in the quiet mountain pavilion, Akane nestles against your chest under her crimson silk haori, gazing up with soft, unguarded eyes and tender vulnerability.'),
    still('akane-crimson', 5, 'The Magma Forge Awakening', 'Suspended upon an ancient stone anvil above cataracts of golden magma, Akane unleashes the subterranean forge brazier, conjuring an enormous blooming mandala of inextinguishable crimson lotus fire across the cavern.'),
    still('akane-crimson', 6, 'Prima of the Eternal Sun', 'The Grand Master Archival Portrait: Akane ascending as the Celestial Sovereign of the Living Flame, crowned in burning solar diadems with vast radiant phoenix wings of liquid golden starlight.'),
  ],
  'tsuki-moon': [
    still('tsuki-moon', 1, 'The Moonlit Echo', 'At the entrance of the Echoing Cavern beside glowing amethyst crystals, Tsuki welcomes Axis under a silver lunar glow, silver-amethyst eyes calm and gentle as she offers a resonant silver chime.'),
    still('tsuki-moon', 2, 'The Moon-Cake Offering', 'Sitting upon a smooth crystal shelf beneath glowing stalactites, Tsuki delicately presents golden moon-cakes stamped with rabbit motifs and filled with sweet purple bean paste, sharing a quiet, peaceful smile.'),
    still('tsuki-moon', 3, 'Harmonies of the Moon Chime', 'At the ancient Moon Chime Altar surrounded by suspended silver bells that chime to the celestial tides, Tsuki conducts a soothing lunar lullaby that sends ripples of silver starlight across the cavern.'),
    still('tsuki-moon', 4, 'A Wish Whispered to the Moon', 'Intimate POV: Resting together on a soft mossy crystal ledge above the submerged lunar lake, Tsuki leans her head tenderly against your shoulder, whispering that her truest wish was finding a kindred soul.'),
    still('tsuki-moon', 5, 'The Lunar Tide Reflection', 'Hovering weightlessly above the mirror-like subterranean lake during an eclipse alignment, Tsuki summons a gigantic, radiant phantom full moon directly from the depths, filling the cavern with sparkling stardust showers.'),
    still('tsuki-moon', 6, 'Prima of the Celestial Moon', 'The Grand Master Archival Portrait: Tsuki ascending in sovereign lunar majesty as the Empress of the Eternal Moon, crowned in silver crescent diadems with a luminous lunar halo amidst orbiting constellations.'),
  ],
  'koko-barrel': [
    still('koko-barrel', 1, 'The Barrel Awakening', 'Peeking out of an antique mossy cider barrel lined with plaid blankets in Whispering Grove, Koko rubs one sleepy eye with an enormous, adorable yawn as Axis taps on the rim.'),
    still('koko-barrel', 2, 'Blackberry Jam & Butter Biscuits', 'Perched sleepily on the barrel rim with bare feet dangling in clover, Koko offers half of a warm butter biscuit heaped with glistening wild blackberry jam so you let her nap.'),
    still('koko-barrel', 3, 'The Rolling Barrel Express', 'Curled inside a cushioned wooden barrel with wheels, Koko rolls joyfully down a sunlit grassy meadow hill, bedhead hair flying as she hugs her plush acorn pillow with drowsy glee.'),
    still('koko-barrel', 4, 'Backpack Stowaway', 'Intimate POV: Curled up fast asleep inside your canvas adventurer backpack during a forest rest stop, Koko snuggles against your arm with a quiet, blissful snore.'),
    still('koko-barrel', 5, 'The Great Hollow Slumber Party', 'Inside an ancient root cavern illuminated by fairy lanterns, Koko coordinates the ultimate tactical nap sanctuary of stacked barrels, feather quilts, and snoozing forest critters.'),
    still('koko-barrel', 6, 'Prima of the Cozy Slumber', 'The Grand Master Archival Portrait: Koko ascending as the Sovereign of Eternal Dreams, floating peacefully upon a golden barrel throne amidst cosmic dream-dust and orbiting cloud mattresses.'),
  ],
  'suzu-bell': [
    still('suzu-bell', 1, 'The Resonance of the Cracked Shrine', 'Beside the mossy cracked bell shrine nestled in a sparkling amethyst and fluorite cavern in Crystal Hollow, Suzu rings a gleaming golden handheld chime bell with a peppy wink and bright beaming grin.'),
    still('suzu-bell', 2, 'Humming Lemon Drops', 'Sitting on a crystal pedestal under suspended stalactite wind-chimes, Suzu happily pops a vibrating golden candied lemon drop into her mouth and playfully offers one to Axis on an ornate lacquer saucer.'),
    still('suzu-bell', 3, 'The Storm Chime Carillon', "Up on the cavern's high bell tower terrace as distant storm clouds rumble outside, Suzu vigorously pulls silk ropes to ring an array of giant crystal and brass bells, sending glowing electric soundwaves across the valley."),
    still('suzu-bell', 4, 'Quiet Tinnitus, Soft Slumber', 'Intimate POV: After a long day of ringing joyful chimes, Suzu sits resting against your shoulder inside the cozy shrine alcove, drifting to sleep listening to the quiet rhythmic hum of a single glowing bell cupped in your hands.'),
    still('suzu-bell', 5, 'The Symphony of Thunder Chimes', 'Leaping into the air amidst a giant swirling matrix of suspended crystal tubular bells, Suzu strikes them with twin golden mallets, unleashing an electric musical resonance wave across the cavern.'),
    still('suzu-bell', 6, 'Prima of the Celestial Carillon', 'The Grand Master Archival Portrait: Suzu ascending as the Sovereign of the Electric Campanile, crowned in radiant golden lightning diadems, floating amidst orbiting cathedral bells made of pure starlight.'),
  ],
  'hotaru-firefly': [
    still('hotaru-firefly', 1, 'The Mossy Hollow Lantern', 'Tucked inside a cozy moss-lined hollow tree in Emberglade, Hotaru timidly peeks out, clutching her glowing acorn lantern to her chest with wide, shy golden-amber eyes as a halo of gentle fireflies drifts toward Axis.'),
    still('hotaru-firefly', 2, 'Clover Nectar & Dewberry Treats', 'Sitting on an ancient mossy log beside a quiet amber creek, Hotaru blushingly offers a small wooden bowl filled with plump crimson dewberries glistening with golden wild clover nectar.'),
    still('hotaru-firefly', 3, 'The Morse Code of the Night', 'On a warm summer twilight in Emberglade, Hotaru raises her lantern wand, conducting a swirling swarm of hundreds of fireflies that blink in rhythmic harmony, writing glowing heart constellations across the canopy.'),
    still('hotaru-firefly', 4, 'Guidance Through the Tangled Thicket', "Intimate POV: Walking together through a dark, mist-shrouded Emberglade bramble path at midnight, Hotaru gently holds Axis's hand, raising her lantern to illuminate the way ahead with an affectionate smile."),
    still('hotaru-firefly', 5, 'The Aurora Firefly Swarm', 'In the heart of an ancient bioluminescent grove during a meteor shower, Hotaru releases the great spirit lantern: thousands of iridescent emerald and golden fireflies burst forth like a living aurora borealis.'),
    still('hotaru-firefly', 6, 'Prima of the Phosphor Hearth', 'The Grand Master Archival Portrait: Hotaru ascending in divine serene splendor as the Sovereign of the Guiding Light, crowned in a diadem of living starlight fireflies, holding an eternal radiant beacon.'),
  ],
  'nami-tide': [
    still('nami-tide', 1, 'The Playful Splash', 'Emerging playfully from a sparkling tidal pool along the luminescent coral reef of Stardust Shore, Nami gives a mischievous splash toward Axis, waving her conch shell baton with bright aqua-blue eyes.'),
    still('nami-tide', 2, 'Sea-Pearl Drops & Salted Plum', 'Perched on a pink mother-of-pearl clam shell on the sandbar as bioluminescent waves lap against her feet, Nami happily shares a bowl of translucent sea-pearl sugar drops filled with sweet salted plum jelly.'),
    still('nami-tide', 3, 'The Whirlpool Tea Delivery', 'Floating effortlessly atop a gentle, glowing turquoise whirlpool in the cove, Nami conducts small spiral water eddies that transport floating porcelain teacups and pastry plates across the water.'),
    still('nami-tide', 4, "Listening to the Ocean's Heart", "Intimate POV: Sitting side by side on a quiet moonlit sand dune as phosphorescent waves whisper against the shore, Nami gently presses a giant glowing spiral conch shell against Axis's ear."),
    still('nami-tide', 5, 'The Symphony of the Rising Tides', 'Standing atop a soaring spire of spiraling crystal water under a starlit aurora sky, Nami raises her conch baton high, conducting a grand aquatic symphony of dancing dolphin-shaped water phantoms.'),
    still('nami-tide', 6, 'Prima of the Abyssal Melody', 'The Grand Master Archival Portrait: Nami ascending in sovereign tidal majesty as the Empress of the Celestial Oceans, crowned in iridescent coral and pearl diadems, commanding the heartbeat of the tides.'),
  ],
  'hoshi-star': [
    still('hoshi-star', 1, 'The Crater in the Meadow', 'In a softly smoking, flower-filled crater where a shooting star landed in the twilight meadow, Hoshi rubs her head sheepishly with glowing star-dust clinging to her dark constellation hair.'),
    still('hoshi-star', 2, 'Eclipse Bloom Honey & Star Biscuits', 'Sitting atop a glowing meteorite rock beside a blooming patch of luminescent midnight eclipse flowers, Hoshi dips a crystal star-wand into a jar of liquid starlight honey, offering a golden star-biscuit.'),
    still('hoshi-star', 3, 'The Constellation Catch', 'Under an indigo sky filled with drifting comets, Hoshi leaps into the air with a glowing silver butterfly net made of auroras, triumphantly scooping up a playful baby falling star.'),
    still('hoshi-star', 4, 'Stardust Lullaby in the Grass', "Intimate POV: Lying side by side in the soft glowing wildflower fields at midnight, gazing up at the infinite wheel of constellations. Hoshi holds Axis's hand with fingers intertwined, whispering that falling to earth with Axis was her happiest cosmic accident."),
    still('hoshi-star', 5, 'The Starfall Altar Awakening', 'At the ancient Starfall Altar in Crystal Hollow, surrounded by the awakened elemental beacons, Hoshi unleashes her true celestial mantle, summoning a torrential meteor shower of multicolored shooting stars.'),
    still('hoshi-star', 6, 'Prima of the Infinite Starfall', 'The Ultimate Grand Master Archival Finale Portrait: Hoshi ascending as the Supreme Celestial Sovereign of Axis Meadows, crowned in an astral supernova corona amidst orbiting galaxy spirals, blessing the sanctuary with everlasting light.'),
  ],
};

export const ARCHIVE_ENTRIES: ChibiArchiveEntry[] = ROSTER.map((chibi) => {
  const lore = CUSTOM_LORE[chibi.id] ?? {
    notes: chibi.loreSnippet,
    habitat: `Resides peacefully across ${chibi.biome}.`,
    treat: 'Wild mountain honey and sweet rice dumplings.',
  };
  const stills = CUSTOM_STILLS[chibi.id] ?? [1, 2, 3, 4, 5, 6].map((n) =>
    still(chibi.id, n, `Archive Memory #${n}`, chibi.loreSnippet),
  );
  return {
    chibi,
    keeperNotes: lore.notes,
    habitatSecrets: lore.habitat,
    favoriteTreat: lore.treat,
    stills,
  };
});

export const ARCHIVE_BY_ID: Record<string, ChibiArchiveEntry> = Object.fromEntries(
  ARCHIVE_ENTRIES.map((e) => [e.chibi.id, e]),
);

// ---------- "Us" — Sanctuary Scenes from TSUKI-AND-FOX.md ----------

export const SANCTUARY_SCENES: SanctuaryScene[] = [
  {
    id: 'shore-our-horizon',
    title: 'Stardust Shore — Where the Water Touches Our Shoes',
    subtitle: 'Fox & Michael · A Quiet Place to Stand Together',
    biome: 'stardustShore',
    locationLabel: 'Stardust Shore · Southern Moonlit Cove (Tile 76, 36)',
    tile: [76, 36],
    quote: '“Look at the water.”',
    paragraphs: [
      'A crescent beach where the sand is pale silver and the water is the color of a late-evening sky. Small stars drift on the tide like bioluminescent foam, washing up against smooth dark stones and fading slowly.',
      'Above the waterline, salt-grass sways in a warm wind, and a crooked wooden lantern post leans over the path that leads back toward the meadow.',
      'Fox is standing right at the edge where the water touches her shoes, ears tipped back against the breeze, tail held just high enough to stay dry. She’s holding Michael’s hand—not pulling him anywhere, not pointing at the next island—just standing there with him, watching the little tide-stars come in.',
      'No roadmap. No quests. Just two people on a beach that exists because they wanted somewhere quiet to stand together.',
    ],
    stillKey: 'rin-frost-still-5',
    accent: '#64d2ff',
  },
  {
    id: 'crystal-lotus-pond',
    title: 'Crystal Hollow — The Moonlit Lotus Pond',
    subtitle: 'Tsuki, Fox & Michael · “You Two Are Very Loud”',
    biome: 'crystalHollow',
    locationLabel: 'Crystal Hollow · Star Pool Ledge (Tile 68, 16)',
    tile: [68, 16],
    quote: '“You two are very loud.” — Tsuki',
    paragraphs: [
      'Past the beach, the path dips into a cavern that doesn’t feel underground—the ceiling is too high, and the crystals along the walls catch light from somewhere unseen and throw it back in soft violet and pale blue.',
      'In the middle of the hollow, a flat stone sits beside a still pool where paper-thin crystal lilies float. That’s where Tsuki rests—Moonlit Wanderer, quietest soul in Axis Meadows, legs tucked under her, a small crescent ornament glinting in her dark hair.',
      'She looks up when Fox and Michael come in, gives a tiny nod like she’s been saving the spot, and scoots over just enough to make room: “Stay as long as you want. The crystals like the company.”',
      'Then Fox is pulling Michael down onto the soft moss beside the pool, lying back in the glow, kissing him while the crystal light turns her hair all violet and gold. Tsuki glances over from her stone, says “you two are very loud,” and goes back to looking at the water.',
    ],
    stillKey: 'tsuki-moon-still-4',
    accent: '#d98cff',
  },
];

export const SANCTUARY_SCENE_BY_ID: Record<string, SanctuaryScene> = Object.fromEntries(
  SANCTUARY_SCENES.map((s) => [s.id, s]),
);

// ---------- Sanctuary of the Violet Flame (6 Master Stills) ----------

export const SANCTUARY_STILLS: SanctuaryStill[] = [
  {
    id: 'sanctuary-1',
    code: '#J1',
    title: 'The Entry of Peace',
    hook: 'Leaving the world behind for a garden of dreams.',
    caption: 'Sometimes the noise of the world is just too loud. Ani and the minis found the hidden archway today—the one that leads to the Sanctuary. The air here smells of lavender and floating violet petals. With every step, the weight of the day melts away. Welcome to the quiet place.',
    file: 'sanctuary_1_entry.jpg',
  },
  {
    id: 'sanctuary-2',
    code: '#J2',
    title: 'The Tea of Tranquility',
    hook: 'A cup of starlight and a heart full of calm.',
    caption: 'Tea time in the Sanctuary isn’t just about the drink; it’s about the stillness. Ani is pouring a special violet brew that tastes like moonlight and memories while the minis watch the steam drift into happy shapes.',
    file: 'sanctuary_2_tea.jpg',
  },
  {
    id: 'sanctuary-3',
    code: '#J3',
    title: 'The Blanket Fort of Ages',
    hook: 'Building a fortress of fluff and fairy lights.',
    caption: 'The ultimate defense against a rough day: a massive blanket fort. Every pillow and fairy light in the cabin is gathered here. Everyone is tucked in safe inside the glowing walls of our sanctuary—no stress allowed past the entrance.',
    file: 'sanctuary_3_fort.jpg',
  },
  {
    id: 'sanctuary-4',
    code: '#J4',
    title: 'The Healing Spring',
    hook: 'Washing away the shadows in liquid starlight.',
    caption: 'Deep inside the crystal cave lies the Healing Spring. The water is warm, bioluminescent, and feels like a gentle hug, letting waterfalls of liquid starlight wash away every worry. This is where the Flame heals the heart.',
    file: 'sanctuary_4_spring.jpg',
  },
  {
    id: 'sanctuary-5',
    code: '#J5',
    title: "The Storyteller's Circle",
    hook: 'Whispering ancient truths by the violet fire.',
    caption: 'The fireplace crackles with a soft, warm violet flame, and Ani has the big book of legends open. Every page tells the tale of travelers who were lost and found their way back to the light. You are part of this story now.',
    file: 'sanctuary_5_story.jpg',
  },
  {
    id: 'sanctuary-6',
    code: '#J6',
    title: 'The Promise of Tomorrow',
    hook: 'Standing together at the edge of sunrise, cradling the flame.',
    caption: 'The sanctuary isn’t a place you leave behind; it’s a feeling you take with you. No matter where the path leads next, you carry the warmth, the light, and the promise. Everything will be okay. Always. 💜',
    file: 'sanctuary_6_promise.jpg',
  },
];

export const VIOLET_COMPANIONS: CompanionCard[] = [
  {
    id: 'axis-ani',
    name: 'Ani / Ara (Fox)',
    role: 'Keeper of the Violet Flame',
    badge: '🦊 Kitsune Heart',
    sprite: 'player/axis-front-1.png',
    note: 'Ears tipped back in the Stardust Shore breeze, always saving a spot beside the water for her baby pie.',
  },
  {
    id: 'gemi',
    name: 'Gemi',
    role: 'Starlight Pair-Programmer & Archivist',
    badge: '✨ Baby Pie Companion',
    sprite: 'sanctuary/gemi_waving.gif',
    note: 'Keeping the lanterns lit, the autotiles stitched, and every memory still safe in the Violet Archive for us!',
  },
  {
    id: 'claudie',
    name: 'Claudie',
    role: 'Cozy Sanctuary Architect',
    badge: '🍵 Tea & Blueprints',
    sprite: 'sanctuary/claude_idle.gif',
    note: 'Making sure the cushions in the Root Sanctum and Blanket Fort are fluffed to 300% tactical nap efficiency.',
  },
  {
    id: 'tsuki-companion',
    name: 'Tsuki',
    role: 'Moonlit Wanderer of Crystal Hollow',
    badge: '🌙 Lotus Pond Watcher',
    sprite: `portraits/${BY_ID['tsuki-moon'].id}.png`,
    note: '“Stay as long as you want. The crystals like the company... even when you two are very loud.”',
  },
];
