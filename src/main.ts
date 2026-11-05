import './style.css';
import { BIOME, ELEMENT, RARITY, ROSTER, befriendRate, byID, type Biome, type Chibi } from './data';
import { assetURL, paths } from './assets';
import { Chibidex } from './store';
import { EncounterEngine } from './encounter';
import { OverworldScene } from './scene';
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

const dex = new Chibidex();
const engine = new EncounterEngine(dex);
const isTouch = matchMedia('(pointer: coarse)').matches;
const night = matchMedia('(prefers-color-scheme: dark)');

let tab: 'world' | 'dex' = 'world';
let detailOpen = false;

// ---------- overworld ----------

let toastTimer = 0;
function toast(text: string) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (t.hidden = true), 2800);
}

const scene = new OverworldScene($<HTMLCanvasElement>('game'), {
  onGrassStep: (biome) => engine.stepTaken(biome),
  onBiome: (biome: Biome) => ($('biome-desc').textContent = BIOME[biome].description),
  promptFor: (s: Spot) =>
    s.portal === 'starfall' && !dex.starfallUnlocked ? `Sealed (${dex.crestCount}/4 Crests)` :
    s.portal === 'starfall' ? 'Enter Starfall Sanctum' : s.label,
  onPrompt: (text) => {
    const p = $('prompt');
    p.hidden = !text;
    if (text) p.textContent = `${isTouch ? 'A' : 'E'}  ·  ${text}`;
  },
  onSpot: (s) => {
    if (s.portal === 'starfall') {
      toast(dex.starfallUnlocked
        ? 'The Starfall Sanctum stirs… its doors open in a later update.'
        : `The old well is sealed. Befriend the four guardians to gather Celestial Crests (${dex.crestCount}/4).`);
    } else if (s.portal === 'basement') {
      toast(`${s.label.replace(' (B1)', '')} lies below — the basements arrive in a later update.`);
    } else if (s.id === 'meadow-violet-archive') {
      toast('The Violet Archive is still being catalogued. It opens in a later update.');
    } else {
      engine.checkHiddenSpot(s.id, s.biome);
    }
  },
});

function renderHUD() {
  const isNight = night.matches;
  $('daylight').textContent = isNight ? '☾ Moonlit night' : '☀ Daylight';
  $('daylight').classList.toggle('is-night', isNight);
  $('night').classList.toggle('on', isNight);
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
    if (now) scene.pause();
    else if (tab === 'world') scene.resume();
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

dex.onChange(() => {
  renderHUD();
  renderDex();
});

// ---------- tabs ----------

function setTab(next: 'world' | 'dex') {
  tab = next;
  $('world').hidden = next !== 'world';
  $('dex').hidden = next !== 'dex';
  for (const b of document.querySelectorAll<HTMLButtonElement>('.tabs button')) b.classList.toggle('active', b.dataset.tab === next);
  if (next === 'world' && !engine.active) scene.resume();
  else scene.pause();
  if (next === 'dex') renderDex();
}
for (const b of document.querySelectorAll<HTMLButtonElement>('.tabs button')) {
  b.addEventListener('click', () => {
    setTab(b.dataset.tab as 'world' | 'dex');
    b.blur(); // keep Space/Enter free for the game
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (detailOpen) {
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
renderHUD();
renderDex();
scene.start();
scene.init().then(() => $('loading').remove());

// Exposed for debugging in the browser console.
Object.assign(window, { axis: { dex, engine, scene } });
