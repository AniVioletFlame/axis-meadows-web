// Game data ported from the Swift sources (ChibiModels.swift, ChibiRoster.swift).

export type Rarity = 'common' | 'uncommon' | 'rare' | 'celestial';
export type Element = 'meadow' | 'celestial' | 'flame' | 'tide' | 'wind' | 'spark' | 'shadow' | 'blossom';
export type EncounterType = 'wildGrass' | 'hidden';
export type Biome = 'wildflowerFields' | 'whisperingGrove' | 'stardustShore' | 'emberglade' | 'crystalHollow';

export const RARITY: Record<Rarity, { befriendRate: number; stars: number; name: string }> = {
  common: { befriendRate: 0.85, stars: 1, name: 'Common' },
  uncommon: { befriendRate: 0.6, stars: 2, name: 'Uncommon' },
  rare: { befriendRate: 0.35, stars: 3, name: 'Rare' },
  celestial: { befriendRate: 0.15, stars: 4, name: 'Celestial' },
};

export const ELEMENT: Record<Element, { emoji: string; name: string; color: string }> = {
  meadow: { emoji: '🌿', name: 'Meadow', color: 'rgb(102,204,102)' },
  celestial: { emoji: '✨', name: 'Celestial', color: 'rgb(230,230,128)' },
  flame: { emoji: '🔥', name: 'Flame', color: 'rgb(230,102,77)' },
  tide: { emoji: '🌊', name: 'Tide', color: 'rgb(77,153,230)' },
  wind: { emoji: '💨', name: 'Wind', color: 'rgb(179,230,230)' },
  spark: { emoji: '⚡', name: 'Spark', color: 'rgb(230,204,51)' },
  shadow: { emoji: '🌑', name: 'Shadow', color: 'rgb(102,77,153)' },
  blossom: { emoji: '🌸', name: 'Blossom', color: 'rgb(230,153,204)' },
};

export const BIOMES: Biome[] = ['wildflowerFields', 'whisperingGrove', 'stardustShore', 'emberglade', 'crystalHollow'];

export const BIOME: Record<Biome, { name: string; description: string; file: string }> = {
  wildflowerFields: {
    name: 'Wildflower Fields',
    description: 'A boundless sea of pastel blooms dancing in an endless spring breeze.',
    file: 'wildflower-fields',
  },
  whisperingGrove: {
    name: 'Whispering Grove',
    description: 'Ancient trees murmur forgotten secrets in dappled emerald light.',
    file: 'whispering-grove',
  },
  stardustShore: {
    name: 'Stardust Shore',
    description: 'Where the astral sea meets luminous, glassy sands.',
    file: 'stardust-shore',
  },
  emberglade: {
    name: 'Emberglade',
    description: 'A warm, twilight forest bathed in the soft glow of eternal embers.',
    file: 'emberglade',
  },
  crystalHollow: {
    name: 'Crystal Hollow',
    description: 'Caverns that thrum with resonant, ancient magic and glittering geodes.',
    file: 'crystal-hollow',
  },
};

export interface Chibi {
  id: string;
  name: string;
  title: string;
  element: Element;
  rarity: Rarity;
  encounterType: EncounterType;
  biome: Biome;
  personality: string;
  greetDialogue: string;
  befriendDialogue: string;
  loreSnippet: string;
}

export const befriendRate = (c: Chibi) => RARITY[c.rarity].befriendRate;

export const ROSTER: Chibi[] = [
  {
    id: 'luna-breeze', name: 'Luna', title: 'The Breeze Maiden', element: 'wind', rarity: 'common',
    encounterType: 'wildGrass', biome: 'wildflowerFields', personality: 'Free-spirited and airy',
    greetDialogue: 'Ah, hello! Did the wind guide you here too?',
    befriendDialogue: "Yay! Let's ride the updrafts together!",
    loreSnippet: "Luna spends her days chasing dandelion seeds across the meadows. It's said that her laughter summons gentle spring gales.",
  },
  {
    id: 'hana-petal', name: 'Hana', title: 'The Petal Dancer', element: 'blossom', rarity: 'common',
    encounterType: 'wildGrass', biome: 'wildflowerFields', personality: 'Graceful and cheerful',
    greetDialogue: 'Care to join me for a waltz among the flowers?',
    befriendDialogue: 'Oh, what a lovely partnership this will be!',
    loreSnippet: 'Every step Hana takes causes dormant buds to bloom. She considers every petal a close friend.',
  },
  {
    id: 'sora-sky', name: 'Sora', title: 'The Sky Drifter', element: 'wind', rarity: 'common',
    encounterType: 'wildGrass', biome: 'wildflowerFields', personality: 'Dreamy and head-in-the-clouds',
    greetDialogue: 'Hmm? Sorry, I was busy watching that cloud shaped like a bunny.',
    befriendDialogue: "Since we're friends now, can we cloud-watch together?",
    loreSnippet: 'Sora is rarely found on the ground, preferring to float just above the grass. She keeps a collection of particularly fluffy clouds.',
  },
  {
    id: 'mochi-cozy', name: 'Mochi', title: 'The Cozy Barista', element: 'meadow', rarity: 'common',
    encounterType: 'wildGrass', biome: 'whisperingGrove', personality: 'Warm and hospitable',
    greetDialogue: "Welcome! Would you like a cup of acorn tea? It's freshly brewed!",
    befriendDialogue: "I'll make sure your mug is always full, friend!",
    loreSnippet: 'Mochi runs a tiny pop-up cafe in the hollows of ancient trees. Her herbal blends are famous for curing bad moods.',
  },
  {
    id: 'tsubaki-ember', name: 'Tsubaki', title: 'The Ember Spark', element: 'flame', rarity: 'uncommon',
    encounterType: 'wildGrass', biome: 'emberglade', personality: 'Energetic and slightly clumsy',
    greetDialogue: 'Whoa, watch out! I almost dropped my spark!',
    befriendDialogue: "You caught me! Let's go cause some (harmless) trouble!",
    loreSnippet: 'Tsubaki carries a tiny, unextinguishable ember that she treats like a pet. She frequently accidentally toasts marshmallows.',
  },
  {
    id: 'rin-frost', name: 'Rin', title: 'The Frost Chime', element: 'tide', rarity: 'uncommon',
    encounterType: 'wildGrass', biome: 'stardustShore', personality: 'Cool and melodious',
    greetDialogue: 'Do you hear that? The ice is singing a new song today.',
    befriendDialogue: "Your warmth is... surprisingly pleasant. Let's travel together.",
    loreSnippet: 'Rin sculpts delicate chimes out of permafrost. The music they make when the sea breeze hits them can calm even the wildest storms.',
  },
  {
    id: 'yuki-snow', name: 'Yuki', title: 'The Silent Snow', element: 'tide', rarity: 'uncommon',
    encounterType: 'wildGrass', biome: 'stardustShore', personality: 'Quiet and observant',
    greetDialogue: '...',
    befriendDialogue: "I like you. You don't mind the quiet.",
    loreSnippet: 'Yuki speaks very little, preferring to communicate through the intricate snowflakes she crafts. Each flake tells a story of the ancient shores.',
  },
  {
    id: 'kaede-leaf', name: 'Kaede', title: 'The Autumn Leaf', element: 'meadow', rarity: 'uncommon',
    encounterType: 'wildGrass', biome: 'whisperingGrove', personality: 'Nostalgic and gentle',
    greetDialogue: "The leaves are changing colors again. Isn't it beautiful?",
    befriendDialogue: 'May our friendship be as enduring as the ancient oaks.',
    loreSnippet: 'Kaede is the guardian of the falling leaves. She ensures that every leaf has a soft place to land before winter comes.',
  },
  {
    id: 'aoi-current', name: 'Aoi', title: 'The Deep Current', element: 'tide', rarity: 'rare',
    encounterType: 'wildGrass', biome: 'stardustShore', personality: 'Mysterious and deep',
    greetDialogue: 'The ocean holds many secrets. Are you here to uncover them?',
    befriendDialogue: 'You have a brave soul. I will share my depths with you.',
    loreSnippet: 'Aoi rarely surfaces from the deep trenches of the astral sea. When she does, she brings luminescent pearls that glow with forgotten magic.',
  },
  {
    id: 'hikari-stardust', name: 'Hikari', title: 'The Stardust Alchemist', element: 'celestial', rarity: 'rare',
    encounterType: 'wildGrass', biome: 'crystalHollow', personality: 'Curious and bright',
    greetDialogue: 'Fascinating! The stardust concentration here is off the charts!',
    befriendDialogue: "We'll make the perfect research team! To the laboratory!",
    loreSnippet: 'Hikari synthesizes stardust into crystalline candies. Her experiments often result in harmless, colorful explosions.',
  },
  {
    id: 'kumo-cloud', name: 'Kumo', title: 'The Cloud Weaver', element: 'wind', rarity: 'rare',
    encounterType: 'wildGrass', biome: 'wildflowerFields', personality: 'Diligent but easily distracted',
    greetDialogue: 'Just a moment, I need to finish weaving this cumulonimbus.',
    befriendDialogue: "My loom is yours! I'll weave us a soft bed in the sky.",
    loreSnippet: 'Kumo uses a magical loom to spin fog and mist into sturdy clouds. The rain from her clouds is said to taste like sweet nectar.',
  },
  {
    id: 'akane-crimson', name: 'Akane', title: 'The Crimson Bloom', element: 'flame', rarity: 'celestial',
    encounterType: 'wildGrass', biome: 'emberglade', personality: 'Fierce and passionate',
    greetDialogue: 'Halt! Only those with a burning heart may approach me.',
    befriendDialogue: 'Your spirit shines bright! I shall lend you my flame.',
    loreSnippet: 'Akane is a legendary guardian of the Emberglade. Her petals are made of pure, inextinguishable fire that warms without burning.',
  },
  {
    id: 'tsuki-moon', name: 'Tsuki', title: 'The Moonlit Wanderer', element: 'celestial', rarity: 'celestial',
    encounterType: 'wildGrass', biome: 'crystalHollow', personality: 'Serene and ethereal',
    greetDialogue: 'The moon has guided us together, traveler.',
    befriendDialogue: 'As long as the moon shines, I will be by your side.',
    loreSnippet: 'Tsuki is said to be a piece of the moon that fell to Axis Meadows. She wanders the Hollows, illuminating the darkest crystal caves.',
  },
  {
    id: 'koko-barrel', name: 'Koko', title: 'The Barrel Napper', element: 'meadow', rarity: 'uncommon',
    encounterType: 'hidden', biome: 'whisperingGrove', personality: 'Sleepy and cozy',
    greetDialogue: '*yawn*... Who turned on the sun? I was sleeping...',
    befriendDialogue: 'Can I sleep in your backpack? It looks comfy...',
    loreSnippet: "Koko can fall asleep literally anywhere, but prefers discarded cider barrels. If you hear snoring from a log, it's probably her.",
  },
  {
    id: 'suzu-bell', name: 'Suzu', title: 'The Bell Keeper', element: 'spark', rarity: 'rare',
    encounterType: 'hidden', biome: 'crystalHollow', personality: 'Peppy and noisy',
    greetDialogue: 'Ding ding! Did you find me by following the sound?',
    befriendDialogue: "Ring-a-ding! We're gonna make so much beautiful noise!",
    loreSnippet: 'Suzu guards the ancient crystal bells of the Hollow. Every time a new Chibi is born, she rings a chime that echoes across the realm.',
  },
  {
    id: 'hotaru-firefly', name: 'Hotaru', title: 'The Firefly Child', element: 'spark', rarity: 'uncommon',
    encounterType: 'hidden', biome: 'emberglade', personality: 'Shy but glowing',
    greetDialogue: "Oh! You found my hiding spot. Please don't startle the fireflies...",
    befriendDialogue: "I-I'll light the way for you, if you want.",
    loreSnippet: 'Hotaru is rarely seen without her swarm of glowing fireflies. She uses them to send coded, blinking messages to her friends at night.',
  },
  {
    id: 'nami-tide', name: 'Nami', title: 'The Tidecaller', element: 'tide', rarity: 'rare',
    encounterType: 'hidden', biome: 'stardustShore', personality: 'Playful and rhythmic',
    greetDialogue: 'Splash! Did I get you? The waves told me you were coming!',
    befriendDialogue: "Let's ride the currents together! Next stop, the horizon!",
    loreSnippet: 'Nami conducts the tides of the Stardust Shore like a symphony. She uses a conch shell baton to direct the flow of the glowing water.',
  },
  {
    id: 'hoshi-star', name: 'Hoshi', title: 'The Fallen Star', element: 'celestial', rarity: 'celestial',
    encounterType: 'hidden', biome: 'crystalHollow', personality: 'Lost but determined',
    greetDialogue: "Oof! That was quite a fall... Wait, where am I?",
    befriendDialogue: "You'll help me find my way? Thank you, shining friend!",
    loreSnippet: "Hoshi tumbled out of the night sky while trying to catch a comet. She's currently exploring the ground, finding it surprisingly cozy.",
  },
];

export const byID = (id: string) => ROSTER.find((c) => c.id === id);
export const forBiome = (b: Biome) => ROSTER.filter((c) => c.biome === b);
export const wildGrass = (b: Biome) => ROSTER.filter((c) => c.biome === b && c.encounterType === 'wildGrass');
export const hidden = (b: Biome) => ROSTER.filter((c) => c.biome === b && c.encounterType === 'hidden');

// Guardians of the four basements; befriending all four unseals the Starfall Sanctum.
export const BASEMENT_GUARDIANS = ['koko-barrel', 'nami-tide', 'akane-crimson', 'tsuki-moon'];
