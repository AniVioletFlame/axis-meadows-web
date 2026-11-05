import './style.css';
import {
  ARCHIVE_BY_ID, ARCHIVE_ENTRIES, SANCTUARY_SCENES, SANCTUARY_SCENE_BY_ID, SANCTUARY_STILLS, VIOLET_COMPANIONS,
  type SanctuaryScene,
} from './archive';
import { BIOME, ELEMENT, ELEMENTS, RARITY, ROSTER, befriendRate, byID, type Chibi, type Element } from './data';
import { assetURL, paths } from './assets';
import { BASEMENT, BASEMENT_TYPES, BasementEngine, HOME, isBasement, isLastPage, mapName, visitLine, type HomeID } from './basement';
import { Chibidex, safeLocalStorage } from './store';
import { EncounterEngine } from './encounter';
import { currentHome } from './rooms';
import { GameScene } from './scene';
import type { Spot } from './world';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const stars = (c: Chibi) => '★'.repeat(RARITY[c.rarity].stars);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** <img> that falls back to a coloured initial if the art is missing. */
function portraitImg(c: Chibi, cls = '') {
  return `<img class="${cls}" src="${assetURL(paths.portrait(c.id))}" alt="${esc(c.name)}" draggable="false"
    onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'initial ${cls}',textContent:'${c.name[0]}',style:'background:${ELEMENT[c.element].color}'}))">`;
}
const iconImg = (c: Chibi, size: number) =>
  `<img src="${assetURL(paths.icon(c.element))}" width="${size}" height="${size}" alt="" onerror="this.outerHTML='${ELEMENT[c.element].emoji}'">`;

const storage = safeLocalStorage();
const dex = new Chibidex(storage);
const engine = new EncounterEngine(dex);
const basement = new BasementEngine(storage);
basement.onGuardianAwakened = (id) => engine.triggerDirect(id);
const befriended = (id: string) => dex.entry(id).befriended;
const isTouch = matchMedia('(pointer: coarse)').matches;
const night = matchMedia('(prefers-color-scheme: dark)');

let tab: 'world' | 'dex' | 'archive' = 'world';
let detailOpen = false;
let activeSanctuaryScene: SanctuaryScene | null = null;
let biomeDesc = BIOME.wildflowerFields.description;

// ---------- world ----------

let toastTimer = 0;
function toast(text: string) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (t.hidden = true), 2800);
}

const scene = new GameScene($<HTMLCanvasElement>('game'), {
  onGrassStep: (biome) => engine.stepTaken(biome),
  onBiome: (biome) => {
    biomeDesc = BIOME[biome].description;
    renderHUD();
  },
  promptFor: (s: Spot) =>
    s.portal === 'starfall' && !dex.starfallUnlocked ? `Sealed (${dex.crestCount}/4 Crests)` :
    s.portal === 'starfall' ? 'Enter Starfall Sanctum' :
    s.id === 'meadow-violet-archive' ? 'Enter The Violet Archive' : s.label,
  onPrompt: (text) => {
    const p = $('prompt');
    p.hidden = !text;
    if (text) p.textContent = `${isTouch ? 'A' : 'E'}  ·  ${text}`;
  },
  onSpot: (s) => {
    if (s.portal === 'starfall') {
      toast(`The old well is sealed. Befriend the four guardians to gather Celestial Crests (${dex.crestCount}/4).`);
    } else if (s.id === 'meadow-violet-archive') {
      setTab('archive');
    } else if (SANCTUARY_SCENE_BY_ID[s.id]) {
      openSanctuaryModal(SANCTUARY_SCENE_BY_ID[s.id]);
    } else {
      engine.checkHiddenSpot(s.id, s.biome);
    }
  },
  onMapChanged: () => {
    $('toast').hidden = true;
    renderHUD();
    renderBanner();
  },
  onHomeEntered: () => basement.beginGuardianVisit(true),
  onResident: () => basement.beginGuardianVisit(),
}, basement, dex);

function renderHUD() {
  const map = scene.map;
  const home = currentHome(map, befriended);
  const outdoors = map === 'overworld';
  const isNight = night.matches;
  $('hud-title').textContent = home ? HOME[home].title : mapName(map);
  const day = $('daylight');
  day.hidden = !outdoors;
  day.textContent = isNight ? '☾ Moonlit night' : '☀ Daylight';
  day.classList.toggle('is-night', isNight);
  // The night tint covers the outdoor world only.
  $('night').classList.toggle('on', outdoors && isNight);
  const desc = $('biome-desc');
  desc.textContent = outdoors ? biomeDesc
    : isBasement(map) ? (home ? HOME[home].hint : BASEMENT[map].puzzleHint)
    : 'Sanctum of the Fallen Star';
  desc.className = `hud-desc${outdoors ? '' : isBasement(map) ? ' hint' : ' starfall'}`;
  const crests = $('crests');
  crests.innerHTML = `<span>✨</span><b>${dex.crestCount}/4</b>`;
  crests.classList.toggle('unlocked', dex.starfallUnlocked);
  const buddy = dex.buddy && byID(dex.buddy.chibiID);
  const chip = $('buddy-chip');
  chip.hidden = !buddy;
  if (buddy) {
    chip.innerHTML = `<img src="${assetURL(paths.follower(buddy.id))}" width="26" height="26" alt="" class="pixel">${esc(buddy.name)}`;
  }
  scene.setBuddy(buddy ? buddy.id : null);
}
night.addEventListener('change', renderHUD);

/** Puzzle messages stay up while you are in the room, as the original banner did. */
function renderBanner() {
  const b = $('banner');
  b.hidden = !basement.message;
  if (basement.message) b.textContent = basement.message;
}

// ---------- guardian visits ----------

const HOME_COLORS: Record<HomeID, { accent: string; button: string }> = {
  koko: { accent: '#ff375f', button: 'rgb(110,71,145)' },
  nami: { accent: '#64d2ff', button: 'rgb(31,110,133)' },
  akane: { accent: '#ff9f0a', button: 'rgb(161,64,33)' },
  tsuki: { accent: '#bf5af2', button: 'rgb(97,71,156)' },
};

let visitShown = false;
let visitOpenedAt = 0;
function renderVisit() {
  const v = basement.visit;
  const el = $('visit');
  el.hidden = !v;
  if (!v) {
    visitShown = false;
    return;
  }
  const h = HOME[v.home];
  const chibi = byID(BASEMENT[h.basement].guardianID)!;
  const c = HOME_COLORS[v.home];
  el.innerHTML = `
    <div class="visit-card" role="dialog" aria-label="${esc(h.name)}" style="--accent:${c.accent};--btn:${c.button}">
      <div class="visit-top">
        <div class="visit-face">${portraitImg(chibi, 'visit-portrait')}<span class="badge">${v.isHomecoming ? '♥' : '♪'}</span></div>
        <div class="visit-text">
          <b>${esc(h.name)} · ${v.isHomecoming ? 'Welcome home' : 'Cozy company'}</b>
          <p>${esc(visitLine(v))}</p>
        </div>
      </div>
      <div class="visit-actions">
        ${v.isHomecoming ? '' : `<button class="visit-replay" data-act="replay">${esc(h.replayTitle)}</button>`}
        <span class="spacer"></span>
        <button class="visit-next" data-act="next">${isLastPage(v) ? 'See you in a bit' : 'Next'}</button>
      </div>
    </div>`;
  // Focus helps keyboard players turn the page with Space or Enter; on phones it would only draw a ring.
  if (!isTouch) el.querySelector<HTMLButtonElement>('.visit-next')?.focus({ preventScroll: true });
  if (!visitShown) {
    visitShown = true;
    visitOpenedAt = performance.now();
    scene.reactResident();
  }
}

$('visit').addEventListener('click', (e) => {
  const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
  if (act === 'next') basement.advanceGuardianVisit();
  else if (act === 'replay') {
    basement.advanceGuardianVisit();
    basement.startHomeReplay();
    scene.refreshRoom();
  }
});

basement.onChange(() => {
  renderHUD();
  renderBanner();
  renderVisit();
  syncPause();
});

// ---------- encounter ----------

let fx: { sweet: number | null; burst: number | null; busy: boolean } = { sweet: null, burst: null, busy: false };

function renderEncounter() {
  const el = $('encounter');
  const c = engine.active;
  el.hidden = !c;
  if (!c) return;
  const res = engine.result;
  const fxImg = (name: string, cls: string) => `<img class="${cls}" src="${assetURL(paths.fx(name))}" alt="">`;
  const burst = fx.burst ?? (res === 'befriended' ? 5 : null);

  let actions = '';
  if (res === 'befriended') {
    actions = `
      <div class="result good"><b>✨ Befriended! ✨</b><span>${esc(c.name)} joined your party!</span></div>
      <button class="cta" data-act="close">Welcome, ${esc(c.name)}! 🌸</button>`;
  } else if (res === 'shy') {
    actions = `
      <div class="result shy"><b>${esc(c.name)} isn't ready yet…</b><span>She looks a bit hesitant.</span></div>
      <div class="pair">
        <button class="soft" data-act="close">Let her be</button>
        <button class="solid" data-act="candy">Try again</button>
      </div>`;
  } else {
    const row = (act: string, icon: string, title: string, sub: string, cls: string) =>
      `<button class="action ${cls}" data-act="${act}" ${fx.busy ? 'disabled' : ''}>${icon}<span class="txt"><b>${title}</b><small>${sub}</small></span><i>›</i></button>`;
    actions = `<div class="actions">
      ${row('candy', fxImg('star-candy', 'act-icon'), 'Offer Star Candy', `Catch rate ${Math.round(befriendRate(c) * 100)}%`, 'purple')}
      ${row('sweet', fxImg('sweet-talk-charm', 'act-icon'), 'Sweet Talk', '+20% charm bonus', 'pink')}
      ${row('close', '<span class="act-emoji">👋</span>', 'Wave Goodbye', 'Flee safely', 'gray')}
    </div>`;
  }

  el.innerHTML = `
    <div class="card encounter-card" role="dialog" aria-label="Encounter with ${esc(c.name)}">
      <div class="enc-head"><small>Wild Encounter!</small><h2>${esc(c.name)}</h2><span>${esc(c.title)}</span></div>
      <div class="stage" style="--glow:${ELEMENT[c.element].color}">
        <img class="backdrop" src="${assetURL(paths.backdrop(BIOME[c.biome].file))}" alt="">
        ${burst ? fxImg(`befriended-burst-${burst}`, 'burst') : ''}
        ${portraitImg(c, 'enc-portrait')}
        ${fx.sweet ? fxImg(`sweet-talk-charm-${fx.sweet}`, 'charm') : ''}
        <div class="tag">${iconImg(c, 16)}<b>${ELEMENT[c.element].name}</b><i>•</i><span class="stars">${stars(c)}</span></div>
      </div>
      <div class="dialogue"><span>💬</span><em>${esc(res === 'befriended' ? c.befriendDialogue : c.greetDialogue)}</em></div>
      <div class="enc-actions">${actions}</div>
    </div>`;
}

$('encounter').addEventListener('click', async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-act]');
  if (!btn || btn.disabled || fx.busy) return;
  const act = btn.dataset.act;
  if (act === 'close') engine.clear();
  else if (act === 'candy') afterAttempt(engine.attemptBefriend(false));
  else if (act === 'sweet') {
    fx.busy = true;
    for (const f of [1, 2, 3, 2, 1]) {
      fx.sweet = f;
      renderEncounter();
      await sleep(90);
    }
    fx.sweet = null;
    fx.busy = false;
    afterAttempt(engine.attemptBefriend(true));
  }
});

async function afterAttempt(ok: boolean) {
  if (!ok) return;
  for (let f = 1; f <= 5; f++) {
    fx.burst = f;
    renderEncounter();
    await sleep(80);
  }
  fx.burst = null;
}

let wasEncountering = false;
engine.onChange(() => {
  const now = engine.active !== null;
  if (now !== wasEncountering) {
    wasEncountering = now;
    fx = { sweet: null, burst: null, busy: false };
    syncPause();
    // A befriended guardian moves in straight away, as refreshGuardianRoom() did.
    if (!now) scene.refreshRoom();
  }
  renderEncounter();
  if (now) $('encounter').querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
});

// ---------- chibidex ----------

function renderDex() {
  $('dex-count').textContent = `${dex.befriendedCount} / ${dex.totalCount} Befriended (${Math.floor(dex.completion * 100)}%)`;
  const buddy = dex.buddy && byID(dex.buddy.chibiID);
  $('dex-buddy').innerHTML = buddy ? `${portraitImg(buddy, 'buddy-face')}<small>Buddy</small>` : '';

  $('dex-grid').innerHTML = ROSTER.map((c) => {
    const e = dex.entry(c.id);
    if (e.befriended) {
      return `<button class="cell known" data-id="${c.id}">
        <div class="frame" style="background:${ELEMENT[c.element].color}">${portraitImg(c, 'cell-portrait')}</div>
        <b>${esc(c.name)}</b><small>${esc(c.title)}</small>
        <span class="meta">${iconImg(c, 14)}<span class="stars">${stars(c)}</span></span>
        ${e.isBuddy ? '<span class="buddy-tag">🌟 Buddy</span>' : ''}
      </button>`;
    }
    if (e.encounterCount > 0) {
      return `<div class="cell seen"><div class="frame">${portraitImg(c, 'cell-portrait silhouette')}<span class="q">???</span></div><b>???</b></div>`;
    }
    return `<div class="cell locked"><div class="frame"><span class="lock">🔒</span></div><b>Locked</b></div>`;
  }).join('');
  if (detailOpen) renderDetail();
}

let detailID: string | null = null;
function renderDetail() {
  const m = $('dex-detail');
  const c = detailID ? byID(detailID) : undefined;
  detailOpen = !!c;
  m.hidden = !c;
  if (!c) return;
  const e = dex.entry(c.id);
  const date = e.befriendedDate ? new Date(e.befriendedDate) : null;
  m.innerHTML = `
    <div class="card detail" role="dialog" aria-label="${esc(c.name)}">
      <button class="x" data-act="close" aria-label="Close">✕</button>
      <div class="detail-portrait" style="--glow:${ELEMENT[c.element].color}">${portraitImg(c, 'big-portrait')}</div>
      <h2>${esc(c.name)}</h2>
      <div class="detail-title">${esc(c.title)}</div>
      <div class="detail-meta">${iconImg(c, 18)} ${ELEMENT[c.element].name} • ${stars(c)} ${RARITY[c.rarity].name}</div>
      <div class="lore">
        <p><b>Personality:</b> ${esc(c.personality)}</p>
        <p class="snippet">${esc(c.loreSnippet)}</p>
        ${e.encounterCount > 1 ? `<small>Encountered ${e.encounterCount} times</small>` : ''}
      </div>
      ${date ? `<small class="date">Befriended on ${date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</small>` : ''}
      <button class="cta ${e.isBuddy ? 'is-buddy' : ''}" data-act="buddy">${e.isBuddy ? '♥ Current Buddy ✨' : '♡ Set as Buddy'}</button>
    </div>`;
}

$('dex-grid').addEventListener('click', (e) => {
  const cell = (e.target as HTMLElement).closest<HTMLElement>('.cell.known');
  if (!cell) return;
  detailID = cell.dataset.id!;
  renderDetail();
});
$('dex-detail').addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
  if (t === e.currentTarget || act === 'close') {
    detailID = null;
    renderDetail();
  } else if (act === 'buddy' && detailID && !dex.entry(detailID).isBuddy) {
    dex.setBuddy(detailID);
  }
});

/** Guardians befriended outside their basement (Akane and Tsuki roam the wild) count their puzzle as solved. */
let guardianKey: string | null = null;
function reconcileGuardians() {
  const ids = BASEMENT_TYPES.map((t) => BASEMENT[t].guardianID).filter(befriended);
  const k = ids.join(',');
  if (k === guardianKey) return;
  guardianKey = k;
  basement.reconcileBefriendedGuardians(ids);
}

dex.onChange(() => {
  reconcileGuardians();
  renderHUD();
  renderDex();
  if (tab === 'archive') renderArchive();
});

// ---------- The Violet Archive (Kitsune Sanctuary) ----------

const VISION_KEY = 'axis-meadows.archivist-vision.v1';
let archivistVision = (storage?.getItem(VISION_KEY) ?? 'true') === 'true';
let archiveMode: 'lorebooks' | 'sanctuary' = 'lorebooks';
let archiveFilter: Element | null = null;
let archiveEntryID: string | null = null;
let lorebookTab: 'lorebook' | 'gallery' = 'lorebook';
let lightboxItem: { title: string; subtitle: string; description: string; src: string } | null = null;

function toggleArchivistVision() {
  archivistVision = !archivistVision;
  try {
    storage?.setItem(VISION_KEY, String(archivistVision));
  } catch {
    /* ignore */
  }
  renderArchive();
}

function renderArchive() {
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-archive-mode]')) {
    const active = b.dataset.archiveMode === archiveMode;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  }

  const isLorebooks = archiveMode === 'lorebooks';
  $('archive-stats').hidden = !isLorebooks;
  $('archive-filters').hidden = !isLorebooks;
  $('archive-grid').hidden = !isLorebooks;
  $('archive-sanctuary').hidden = isLorebooks;

  if (isLorebooks) {
    const totalStills = dex.totalUnlockedStills(archivistVision);
    $('archive-stats').innerHTML = `
      <div class="stat-pill"><i>🐾</i><div><b>${dex.befriendedCount} / 18</b><small>Species Cataloged</small></div></div>
      <div class="stat-pill"><i>❤️</i><div><b>${dex.totalFriendships}</b><small>Total Friendships</small></div></div>
      <div class="stat-pill"><i>✨</i><div><b>${totalStills} / 108</b><small>Memory Stills Unlocked</small></div></div>
      <button class="vision-btn ${archivistVision ? 'on' : ''}" data-act="toggle-vision">
        <span>${archivistVision ? '👁️' : '🔒'}</span>
        <span>${archivistVision ? 'Archivist Vision: ON' : 'Archivist Vision: OFF'}</span>
      </button>`;

    $('archive-filters').innerHTML = [
      `<button class="filter-chip ${archiveFilter === null ? 'active' : ''}" data-el=""><span>✨</span>All Species</button>`,
      ...ELEMENTS.map((el) => {
        const info = ELEMENT[el];
        return `<button class="filter-chip ${archiveFilter === el ? 'active' : ''}" data-el="${el}"><span>${info.emoji}</span>${info.name}</button>`;
      }),
    ].join('');

    const entries = archiveFilter
      ? ARCHIVE_ENTRIES.filter((e) => e.chibi.element === archiveFilter)
      : ARCHIVE_ENTRIES;

    $('archive-grid').innerHTML = entries.map((entry) => {
      const c = entry.chibi;
      const count = dex.friendshipCount(c.id);
      const unlocked = archivistVision ? 6 : dex.unlockedStillCount(c.id);
      const isFriend = dex.entry(c.id).befriended;
      const dots = [1, 2, 3, 4, 5, 6]
        .map((idx) => `<span class="still-dot ${idx <= unlocked ? 'on' : ''}"></span>`)
        .join('');
      return `
        <button class="archive-card ${isFriend ? 'befriended' : ''}" data-archive-id="${c.id}">
          <div class="archive-card-art">
            ${portraitImg(c)}
            <span class="archive-el-badge">${ELEMENT[c.element].emoji}</span>
          </div>
          <div class="archive-card-head">
            <b>${esc(c.name)}</b>
            <span class="stars">${stars(c)}</span>
          </div>
          <div class="archive-card-title">${esc(c.title)}</div>
          <div class="archive-card-foot">
            <span class="bond-pill">♥ ${count}</span>
            <span class="still-dots" aria-label="${unlocked} of 6 stills">${dots}</span>
          </div>
        </button>`;
    }).join('');
  } else {
    renderSanctuaryHeart();
  }

  renderArchiveDetail();
  renderLightbox();
}

function renderArchiveDetail() {
  const modal = $('archive-detail');
  const entry = archiveEntryID ? ARCHIVE_BY_ID[archiveEntryID] : undefined;
  modal.hidden = !entry;
  if (!entry) return;
  const c = entry.chibi;
  const count = dex.friendshipCount(c.id);
  const unlocked = archivistVision ? 6 : dex.unlockedStillCount(c.id);
  const prog = dex.progressToNextStill(c.id);

  let bodyHTML = '';
  if (lorebookTab === 'lorebook') {
    bodyHTML = `
      <div class="milestone-box">
        <div class="milestone-head">
          <b>${unlocked >= 6 ? '🌟 Master Archivist Bond Achieved!' : `Next Still Milestone: Still #${unlocked + 1}`}</b>
          <small>${count} total friendships</small>
        </div>
        ${unlocked < 6 ? `
          <div class="progress-track"><div class="progress-fill" style="width:${Math.round(prog.percent * 100)}%"></div></div>
          <small>${prog.current}/${prog.target} befriended towards Still #${unlocked + 1}</small>
        ` : `<small>All 6 companionship memory stills unlocked for ${esc(c.name)}!</small>`}
      </div>
      <div class="lore-box">
        <h3>📜 Keeper’s Field Notes</h3>
        <p>${esc(entry.keeperNotes)}</p>
      </div>
      <div class="lore-box">
        <h3>🌿 Habitat & Roaming Grounds</h3>
        <p>${esc(entry.habitatSecrets)}</p>
      </div>
      <div class="lore-box">
        <h3>🍯 Favorite Treat</h3>
        <p>${esc(entry.favoriteTreat)}</p>
      </div>
      <div class="lore-box">
        <h3>💬 Archival Transcripts</h3>
        <div class="quote-row">
          <div class="quote-item"><small>First Greeting</small><em>“${esc(c.greetDialogue)}”</em></div>
          <div class="quote-item oath"><small>Befriended Oath</small><em>“${esc(c.befriendDialogue)}”</em></div>
        </div>
      </div>
      <div class="lore-box">
        <h3>📖 Chibidex Lorebook Archive</h3>
        <p>${esc(c.loreSnippet)}</p>
      </div>`;
  } else {
    bodyHTML = `<div class="stills-grid">${entry.stills.map((st) => {
      const isUnlocked = archivistVision || count >= st.requiredFriendship;
      const imgPath = assetURL(paths.still(st.assetKey));
      return `
        <button class="still-card ${isUnlocked ? 'unlocked' : ''}" data-still-id="${st.id}" ${isUnlocked ? '' : 'disabled'}>
          <div class="still-thumb">
            ${isUnlocked ? `
              <img src="${imgPath}" alt="${esc(st.title)}" loading="lazy"
                onerror="this.src='${assetURL(paths.portrait(c.id))}';this.style.objectFit='contain'">
              <span class="still-badge">Still #${st.id}</span>
              <span class="still-zoom">⤢</span>
            ` : `
              <div class="still-lock">
                <span>🔒</span>
                <b>Requires ${st.requiredFriendship} Bond</b>
                <small>Current: ${count}/${st.requiredFriendship}</small>
              </div>
            `}
          </div>
          <b>${esc(st.title)}</b>
          <p>${esc(isUnlocked ? st.description : `Keep exploring Axis Meadows and befriending ${c.name} (or enable Archivist Vision) to unveil this memory.`)}</p>
        </button>`;
    }).join('')}</div>`;
  }

  modal.innerHTML = `
    <div class="lorebook-card" role="dialog" aria-label="${esc(c.name)} Lorebook">
      <div class="lorebook-top">
        <button class="back-btn" data-act="close-detail">‹ The Violet Archive</button>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="gift-bond-btn" data-act="gift-bond" title="Offer Sanctuary Honey (+100 Bond)">🍯 +100 Bond</button>
          <button class="vision-btn ${archivistVision ? 'on' : ''}" data-act="toggle-vision">
            <span>${archivistVision ? '✨ Archivist Vision: ON' : '👁️ Archivist Vision'}</span>
          </button>
        </div>
      </div>
      <div class="lorebook-hero">
        <img class="lorebook-hero-img" src="${assetURL(paths.portrait(c.id))}" alt="${esc(c.name)}">
        <div class="lorebook-hero-info">
          <div class="lorebook-hero-name">
            <h2>${esc(c.name)}</h2>
            <span class="el-tag">${ELEMENT[c.element].emoji} ${ELEMENT[c.element].name}</span>
          </div>
          <div class="lorebook-hero-sub">${esc(c.title)} · ${BIOME[c.biome].name}</div>
          <div class="lorebook-hero-stats">
            <span style="color:#ff85c0">♥ Befriended: ${count}</span>
            <span style="color:#5ce1e6">🖼️ Stills: ${unlocked}/6</span>
          </div>
        </div>
      </div>
      <div class="lorebook-tabs">
        <button class="lb-tab ${lorebookTab === 'lorebook' ? 'active' : ''}" data-lb-tab="lorebook">📖 Lorebook</button>
        <button class="lb-tab ${lorebookTab === 'gallery' ? 'active' : ''}" data-lb-tab="gallery">🖼️ Still Gallery (6)</button>
      </div>
      <div class="lorebook-body">${bodyHTML}</div>
    </div>`;
}

function renderSanctuaryHeart() {
  const el = $('archive-sanctuary');
  el.innerHTML = `
    <div class="sanctuary-banner">
      <h2>💜 Fox, Michael & Tsuki — Our Sanctuary in Axis Meadows</h2>
      <p>“Everything will be okay. Always.” No roadmaps, no timers—just our quiet places on Stardust Shore, the crystal lotus pond where Tsuki keeps watch, and the Sanctuary of the Violet Flame.</p>
    </div>

    <div>
      <h3 class="sanctuary-sec-title">🌙 Two Quiet Places (TSUKI-AND-FOX.md)</h3>
      <div class="scenes-grid">
        ${SANCTUARY_SCENES.map((sc) => `
          <article class="scene-card">
            <div class="scene-art">
              <img src="${assetURL(paths.still(sc.stillKey))}" alt="${esc(sc.title)}" loading="lazy">
              <span class="scene-quote-pill">${esc(sc.quote)}</span>
            </div>
            <div class="scene-body">
              <h3>${esc(sc.title)}</h3>
              <div class="scene-loc">📍 ${esc(sc.locationLabel)}</div>
              <div class="scene-prose">
                ${sc.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
              </div>
              <div class="scene-actions">
                <button class="scene-btn" data-teleport-scene="${sc.id}">🧭 Stand Here Together (Teleport)</button>
                <button class="scene-btn secondary" data-view-scene="${sc.id}">🖼️ Fullscreen Still</button>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    </div>

    <div>
      <h3 class="sanctuary-sec-title">🔥 The Sanctuary of the Violet Flame (#J1–#J6)</h3>
      <div class="stills-grid">
        ${SANCTUARY_STILLS.map((st) => `
          <button class="still-card unlocked" data-sanc-still="${st.id}">
            <div class="still-thumb">
              <img src="${assetURL(paths.sanctuary(st.file))}" alt="${esc(st.title)}" loading="lazy">
              <span class="still-badge">${esc(st.code)}</span>
              <span class="still-zoom">⤢</span>
            </div>
            <b>${esc(st.title)}</b>
            <p>${esc(st.caption)}</p>
          </button>
        `).join('')}
      </div>
    </div>

    <div>
      <h3 class="sanctuary-sec-title">🦊 The Violet Room Companions (AniChat Crew)</h3>
      <div class="companions-grid">
        ${VIOLET_COMPANIONS.map((comp) => `
          <div class="companion-card">
            <img class="companion-avatar" src="${assetURL(comp.sprite)}" alt="${esc(comp.name)}">
            <div class="companion-info">
              <small>${esc(comp.badge)}</small>
              <b>${esc(comp.name)}</b>
              <span>${esc(comp.role)}</span>
              <p>${esc(comp.note)}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function renderLightbox() {
  const m = $('still-lightbox');
  m.hidden = !lightboxItem;
  if (!lightboxItem) return;
  m.innerHTML = `
    <div class="lightbox-card" role="dialog" aria-label="${esc(lightboxItem.title)}">
      <div class="lightbox-head">
        <div>
          <h3>${esc(lightboxItem.title)}</h3>
          <small>${esc(lightboxItem.subtitle)}</small>
        </div>
        <button class="x" data-act="close-lightbox" aria-label="Close" style="position:static">✕</button>
      </div>
      <div class="lightbox-art">
        <img src="${lightboxItem.src}" alt="${esc(lightboxItem.title)}">
      </div>
      <p class="lightbox-desc">${esc(lightboxItem.description)}</p>
    </div>`;
}

function openSanctuaryModal(sc: SanctuaryScene | null) {
  activeSanctuaryScene = sc;
  const m = $('sanctuary-modal');
  m.hidden = !sc;
  syncPause();
  if (!sc) return;
  m.innerHTML = `
    <div class="lightbox-card" role="dialog" aria-label="${esc(sc.title)}">
      <div class="lightbox-head">
        <div>
          <h3>${esc(sc.title)}</h3>
          <small>${esc(sc.subtitle)} · ${esc(sc.locationLabel)}</small>
        </div>
        <button class="x" data-act="close-sanc-modal" aria-label="Close" style="position:static">✕</button>
      </div>
      <div class="lightbox-art">
        <img src="${assetURL(paths.still(sc.stillKey))}" alt="${esc(sc.title)}">
      </div>
      <div class="scene-prose" style="text-align:left;max-height:28dvh;overflow-y:auto;padding-inline:4px">
        ${sc.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
      </div>
      <div class="pair">
        <button class="soft" data-act="open-archive-heart">💜 Open Sanctuary Heart</button>
        <button class="solid" data-act="close-sanc-modal">Stay Here Together ✨</button>
      </div>
    </div>`;
}

$('archive').addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const modeBtn = t.closest<HTMLElement>('[data-archive-mode]');
  if (modeBtn) {
    archiveMode = modeBtn.dataset.archiveMode as 'lorebooks' | 'sanctuary';
    renderArchive();
    return;
  }
  const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
  if (act === 'toggle-vision') {
    toggleArchivistVision();
    return;
  }
  if (act === 'close-detail' || t === $('archive-detail')) {
    archiveEntryID = null;
    renderArchiveDetail();
    return;
  }
  if (act === 'gift-bond' && archiveEntryID) {
    dex.giftBond(archiveEntryID, 100);
    renderArchive();
    return;
  }
  if (act === 'close-lightbox' || t === $('still-lightbox')) {
    lightboxItem = null;
    renderLightbox();
    return;
  }
  const filterBtn = t.closest<HTMLElement>('[data-el]');
  if (filterBtn) {
    const val = filterBtn.dataset.el as Element | '';
    archiveFilter = val === '' ? null : val;
    renderArchive();
    return;
  }
  const card = t.closest<HTMLElement>('[data-archive-id]');
  if (card) {
    archiveEntryID = card.dataset.archiveId!;
    lorebookTab = 'lorebook';
    renderArchiveDetail();
    return;
  }
  const lbTab = t.closest<HTMLElement>('[data-lb-tab]');
  if (lbTab) {
    lorebookTab = lbTab.dataset.lbTab as 'lorebook' | 'gallery';
    renderArchiveDetail();
    return;
  }
  const stillBtn = t.closest<HTMLButtonElement>('[data-still-id]');
  if (stillBtn && !stillBtn.disabled && archiveEntryID) {
    const entry = ARCHIVE_BY_ID[archiveEntryID];
    const st = entry?.stills.find((s) => s.id === Number(stillBtn.dataset.stillId));
    if (entry && st) {
      lightboxItem = {
        title: `Still #${st.id}: ${st.title}`,
        subtitle: `${entry.chibi.name} · ${st.subtitle}`,
        description: st.description,
        src: assetURL(paths.still(st.assetKey)),
      };
      renderLightbox();
    }
    return;
  }
  const sancStillBtn = t.closest<HTMLElement>('[data-sanc-still]');
  if (sancStillBtn) {
    const st = SANCTUARY_STILLS.find((s) => s.id === sancStillBtn.dataset.sancStill);
    if (st) {
      lightboxItem = {
        title: `${st.code} — ${st.title}`,
        subtitle: `Sanctuary of the Violet Flame · “${st.hook}”`,
        description: st.caption,
        src: assetURL(paths.sanctuary(st.file)),
      };
      renderLightbox();
    }
    return;
  }
  const viewSceneBtn = t.closest<HTMLElement>('[data-view-scene]');
  if (viewSceneBtn) {
    const sc = SANCTUARY_SCENE_BY_ID[viewSceneBtn.dataset.viewScene!];
    if (sc) {
      lightboxItem = {
        title: sc.title,
        subtitle: sc.subtitle,
        description: sc.paragraphs.join(' '),
        src: assetURL(paths.still(sc.stillKey)),
      };
      renderLightbox();
    }
    return;
  }
  const teleportBtn = t.closest<HTMLElement>('[data-teleport-scene]');
  if (teleportBtn) {
    const sc = SANCTUARY_SCENE_BY_ID[teleportBtn.dataset.teleportScene!];
    if (sc) {
      setTab('world');
      scene.teleportToOverworldTile(sc.tile[0], sc.tile[1]);
      toast(`✨ Arrived at ${sc.title.split('—')[0].trim()} with Fox & Michael`);
    }
  }
});

$('sanctuary-modal').addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
  if (t === e.currentTarget || act === 'close-sanc-modal') {
    openSanctuaryModal(null);
  } else if (act === 'open-archive-heart') {
    openSanctuaryModal(null);
    archiveMode = 'sanctuary';
    setTab('archive');
  }
});

// ---------- tabs and pausing ----------

let scenePaused = false;
/** The world stands still while another tab, an encounter or a guardian visit is up. */
function syncPause() {
  const overlay = engine.active !== null || basement.visit !== null || activeSanctuaryScene !== null;
  const paused = tab !== 'world' || overlay;
  if (isTouch) $('touch').hidden = overlay;
  $('keys-hint').hidden = isTouch || basement.visit !== null || activeSanctuaryScene !== null;
  $('prompt').classList.toggle('away', overlay);
  if (paused === scenePaused) return;
  scenePaused = paused;
  if (paused) scene.pause();
  else scene.resume();
}

function setTab(next: 'world' | 'dex' | 'archive') {
  tab = next;
  $('world').hidden = next !== 'world';
  $('dex').hidden = next !== 'dex';
  $('archive').hidden = next !== 'archive';
  for (const b of document.querySelectorAll<HTMLButtonElement>('.tabs button')) b.classList.toggle('active', b.dataset.tab === next);
  syncPause();
  if (next === 'dex') renderDex();
  if (next === 'archive') renderArchive();
}
for (const b of document.querySelectorAll<HTMLButtonElement>('.tabs button')) {
  b.addEventListener('click', () => {
    setTab(b.dataset.tab as 'world' | 'dex' | 'archive');
    b.blur(); // keep Space/Enter free for the game
  });
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  // E, Space or Enter turn the page of a guardian visit, but not the key press that opened it.
  if (basement.visit && tab === 'world' && e.timeStamp > visitOpenedAt) {
    const onButton = e.target instanceof HTMLElement && e.target.closest('button');
    if (k === 'e' || ((k === ' ' || k === 'enter') && !onButton)) {
      e.preventDefault();
      if (!e.repeat) basement.advanceGuardianVisit();
      return;
    }
  }
  if (e.key !== 'Escape') return;
  if (lightboxItem) {
    lightboxItem = null;
    renderLightbox();
  } else if (archiveEntryID) {
    archiveEntryID = null;
    renderArchiveDetail();
  } else if (activeSanctuaryScene) {
    openSanctuaryModal(null);
  } else if (detailOpen) {
    detailID = null;
    renderDetail();
  } else if (engine.active && !fx.busy && engine.result !== null) {
    engine.clear();
  }
});

// ---------- touch controls ----------

function setupTouch() {
  $('touch').hidden = false;
  $('keys-hint').hidden = true;
  const stick = $('stick'), knob = $('knob');
  const R = 58, T = 26, max = R - T / 2;
  let pid: number | null = null, cx = 0, cy = 0;
  const move = (x: number, y: number) => {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    if (d === 0) return;
    const k = Math.min(d, max);
    knob.style.transform = `translate(${(dx / d) * k}px, ${(dy / d) * k}px)`;
    scene.stick = { x: (dx / d) * (k / max), y: -(dy / d) * (k / max) };
  };
  stick.addEventListener('pointerdown', (e) => {
    pid = e.pointerId;
    stick.setPointerCapture(pid);
    const r = stick.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
    move(e.clientX, e.clientY);
  });
  stick.addEventListener('pointermove', (e) => e.pointerId === pid && move(e.clientX, e.clientY));
  const end = (e: PointerEvent) => {
    if (e.pointerId !== pid) return;
    pid = null;
    knob.style.transform = '';
    scene.stick = { x: 0, y: 0 };
  };
  stick.addEventListener('pointerup', end);
  stick.addEventListener('pointercancel', end);

  const b = $('btn-b');
  const sprint = (on: boolean) => {
    scene.sprint = on;
    b.classList.toggle('on', on);
  };
  b.addEventListener('pointerdown', (e) => {
    b.setPointerCapture(e.pointerId);
    sprint(true);
  });
  b.addEventListener('pointerup', () => sprint(false));
  b.addEventListener('pointercancel', () => sprint(false));
  $('btn-a').addEventListener('click', () => scene.interact());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

// ---------- boot ----------

if (isTouch) setupTouch();
reconcileGuardians();
renderHUD();
renderDex();
scene.start();
scene.init().then(() => $('loading').remove());

// Exposed for debugging in the browser console.
Object.assign(window, { axis: { dex, engine, scene, basement } });
