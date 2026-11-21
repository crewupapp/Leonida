// =====================================================================
// VICE CITY NEWS — démarrage, coque de l'appli et navigation
// =====================================================================
import * as api from './api.js';
import { $, $$, esc, comicLetters, toast, confetti, reveal, tilt, reduceMotion, icons } from './ui.js';
import { logoBadge, AVATARS } from './art.js';
import { home } from './views/home.js';
import { article } from './views/article.js';
import { feed } from './views/feed.js';
import { secrets } from './views/secrets.js';
import { mapView } from './views/map.js';
import { games } from './views/games.js';
import { vip } from './views/vip.js';
import { profile, authView, newPassword } from './views/account.js';
import { legal } from './views/legal.js';
import { adminView } from './views/admin.js';

const ROUTES = [
  { re: /^$/, view: home, nav: 0 },
  { re: /^a\/([a-z0-9-]+)$/, view: article, nav: -1, live: true },
  { re: /^c\/([a-z0-9-]+)$/, view: feed, nav: 0 },
  { re: /^recherche$/, view: feed, nav: 0 },
  { re: /^favoris$/, view: feed, nav: 4, live: true },
  { re: /^secrets$/, view: secrets, nav: 1, live: true },
  { re: /^carte$/, view: mapView, nav: 2, live: true },
  { re: /^jeux$/, view: games, nav: 3, live: true },
  { re: /^vip$/, view: vip, nav: -1, live: true },
  { re: /^moi$/, view: profile, nav: 4, live: true },
  { re: /^connexion$/, view: authView, nav: 4, live: true },
  { re: /^nouveau-mot-de-passe$/, view: newPassword, nav: 4 },
  { re: /^mentions$/, view: legal, nav: -1 },
  { re: /^admin(?:\/(.*))?$/, view: adminView, nav: 4, live: true },
];

let cleanup = null;
let currentKey = null;
let firstRender = true;

function shell() {
  document.getElementById('app').innerHTML = `
    <header class="app-header">
      <div class="container bar">
        <a class="brand" href="#/" aria-label="Accueil VICE CITY NEWS">${logoBadge(46)}<span class="word"><b>VICE CITY</b><span>NEWS</span></span></a>
        <div class="header-actions">
          <a class="icon-btn" href="#/recherche" aria-label="Rechercher">${icons.search}</a>
          <a class="vip-pill" id="vipPill" href="#/vip">VICE+</a>
          <a class="avatar-mini" id="avatarBtn" href="#/moi" aria-label="Mon compte">👤</a>
        </div>
      </div>
    </header>
    <div class="ticker" id="ticker" aria-label="Flash info"><span class="label"><span class="dot"></span>FLASH</span><div class="track"></div></div>
    <main id="view" class="container" tabindex="-1"></main>
    <nav class="bottom-nav" id="nav" aria-label="Navigation principale">
      <span class="blob"></span>
      <a href="#/">${icons.home}<span>Accueil</span></a>
      <a href="#/secrets">${icons.vault}<span>Secrets</span></a>
      <a href="#/carte">${icons.map}<span>Carte</span></a>
      <a href="#/jeux">${icons.game}<span>Jeux</span></a>
      <a href="#/moi">${icons.user}<span>Moi</span></a>
    </nav>
    <div class="toasts" aria-live="polite"></div>
    <div class="wipe" aria-hidden="true"><i></i><i></i><i></i></div>`;
}

function renderTicker() {
  const items = Array.isArray(api.state.settings.ticker) && api.state.settings.ticker.length
    ? api.state.settings.ticker : ["L'actu GTA 6 en direct de Vice City"];
  const once = items.map((t) => `<span>${esc(t)}</span>`).join('');
  const track = $('#ticker .track');
  track.innerHTML = once + once;
  track.style.setProperty('--dur', `${Math.max(18, items.join(' ').length / 4)}s`);
}

function renderHeader() {
  const s = api.state;
  const pill = $('#vipPill');
  pill.classList.toggle('on', s.vip);
  pill.textContent = s.vip ? '💎 VICE+' : 'VICE+';
  const av = $('#avatarBtn');
  av.textContent = s.user ? (AVATARS[s.profile?.avatar] || '🦩') : '👤';
  av.setAttribute('aria-label', s.user ? 'Mon profil' : 'Se connecter');
}

function setNav(index) {
  const nav = $('#nav');
  const links = $$('a', nav);
  links.forEach((a, i) => a.classList.toggle('active', i === index));
  const blob = $('.blob', nav);
  if (index < 0) { blob.style.opacity = '0'; return; }
  blob.style.opacity = '1';
  blob.style.transform = `translateX(${index * 100}%)`;
  blob.style.background = ['#ff2e88', '#7b2ff7', '#00b3c7', '#ff8a3d', '#ff2e88'][index];
}

export function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  if (/^(access_token|error|type)=/.test(raw)) return { path: '', query: new URLSearchParams() };
  const [path, qs] = raw.split('?');
  return { path: decodeURIComponent(path || '').replace(/\/$/, ''), query: new URLSearchParams(qs || '') };
}

export function go(path) { location.hash = '#/' + path.replace(/^#?\/?/, ''); }

async function route({ force = false, silent = false } = {}) {
  const { path, query } = parseHash();
  const r = ROUTES.find((x) => x.re.test(path)) || ROUTES[0];
  const params = path.match(r.re)?.slice(1) || [];
  const key = path + '?' + query.toString();
  if (!force && key === currentKey) return;
  const samePath = currentKey && currentKey.split('?')[0] === path;
  currentKey = key;

  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  setNav(r.nav);
  const view = $('#view');

  if (!firstRender && !silent && !samePath && !reduceMotion()) {
    const w = $('.wipe');
    w.classList.remove('run'); void w.offsetWidth; w.classList.add('run');
    clearTimeout(route.wipeTimer);
    route.wipeTimer = setTimeout(() => w.classList.remove('run'), 760);
    await new Promise((res) => setTimeout(res, 300));
  }
  if (!silent && !samePath) window.scrollTo({ top: 0, behavior: 'instant' });
  firstRender = false;

  view.classList.remove('view-enter'); void view.offsetWidth;
  if (!silent) view.classList.add('view-enter');
  const ctx = { params, query, path, go, api, state: api.state, refresh: () => route({ force: true, silent: true }) };
  try {
    const res = await r.view(view, ctx);
    if (typeof res === 'function') cleanup = res;
  } catch (e) {
    console.error(e);
    view.innerHTML = `<div class="empty panel" style="margin-top:24px"><h3>Oups, la page n'a pas pu se charger</h3><p class="muted">${esc(api.frError(e))}</p><button class="btn" id="retry">Réessayer</button></div>`;
    $('#retry')?.addEventListener('click', () => route({ force: true }));
  }
  reveal(view);
  tilt(view);
  route.live = !!r.live;
  document.title = (view.querySelector('h1')?.textContent?.trim() ? view.querySelector('h1').textContent.trim() + ' · ' : '') + 'VICE CITY NEWS';
}

function splash() {
  if (sessionStorage.getItem('vcn-splash') || reduceMotion()) return () => {};
  sessionStorage.setItem('vcn-splash', '1');
  const el = document.createElement('div');
  el.className = 'splash';
  el.innerHTML = `<div class="inner">${logoBadge(130)}<div class="title comic">${comicLetters('VICE CITY NEWS')}</div><div class="sub">GTA 6 · ACTUS · SECRETS</div></div>`;
  document.body.appendChild(el);
  const t0 = Date.now();
  return () => setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 700); }, Math.max(0, 1700 - (Date.now() - t0)));
}

async function handleReturnFromCheckout() {
  const qs = new URLSearchParams(location.search);
  if (!qs.has('vip')) return;
  const ok = qs.get('vip') === 'ok';
  history.replaceState(null, '', location.pathname + '#/vip');
  if (ok && api.state.user) {
    toast('Paiement reçu ! Activation de ton accès VICE+…', 'vip');
    try {
      for (let i = 0; i < 5 && !api.state.vip; i++) {
        await api.syncSubscription();
        if (!api.state.vip) await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (e) { console.warn(e); }
    if (api.state.vip) { confetti(); toast('Bienvenue dans VICE+ 💎', 'vip', 4500); }
  }
}

async function boot() {
  shell();
  const done = splash();
  $('#view').innerHTML = '<div class="skeleton" style="height:380px;margin-top:16px;border-radius:28px"></div>';
  try {
    await api.init();
  } catch (e) {
    console.error(e);
    done();
    $('#view').innerHTML = `<div class="empty panel" style="margin-top:24px"><h3>Impossible de joindre le serveur</h3><p class="muted">Vérifie ta connexion Internet puis recharge la page.</p><button class="btn" onclick="location.reload()">Recharger</button></div>`;
    return;
  }
  renderTicker();
  renderHeader();
  let lastAccess = `${api.state.user?.id}|${api.state.vip}|${api.state.staff}`;
  api.onState((s, why) => {
    renderHeader();
    if (why === 'settings') renderTicker();
    const access = `${s.user?.id}|${s.vip}|${s.staff}`;
    if (access !== lastAccess) {
      lastAccess = access;
      if (route.live) route({ force: true, silent: true });
    }
  });
  window.addEventListener('hashchange', () => route());
  await route({ force: true });
  done();
  handleReturnFromCheckout();
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

boot();
