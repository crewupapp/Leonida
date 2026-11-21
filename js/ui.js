// Outils d'interface : DOM, animations, markdown, formats.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function comicLetters(text) {
  let i = 0;
  return [...text].map((ch) => (ch === ' ' ? ' ' : `<span class="l" style="--i:${i++}">${esc(ch)}</span>`)).join('');
}

export function slugify(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export function fmtDate(d, withTime = false) {
  if (!d) return '';
  const x = new Date(d);
  let s = `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
  if (withTime) s += ` à ${String(x.getHours()).padStart(2, '0')} h ${String(x.getMinutes()).padStart(2, '0')}`;
  return s;
}
export function timeAgo(d) {
  if (!d) return '';
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return 'hier';
  if (s < 604800) return `il y a ${Math.floor(s / 86400)} jours`;
  return fmtDate(d);
}
export const fmtNum = (n) => new Intl.NumberFormat('fr-FR', { notation: n >= 10000 ? 'compact' : 'standard' }).format(n || 0);

// ---------- Markdown simple et sûr ----------
function inline(s) {
  let t = esc(s);
  t = t.replace(/!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)/g, (_, a, u) => `<img src="${u}" alt="${a}" loading="lazy">`);
  t = t.replace(/\[([^\]]+)\]\(((?:https?:\/\/|#\/)[^)\s]+)\)/g, (_, a, u) => `<a href="${u}"${u.startsWith('#') ? '' : ' target="_blank" rel="noopener"'}>${a}</a>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1<em>$2</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  return t;
}
export function md(src = '') {
  const lines = String(src).replace(/\r/g, '').split('\n');
  const out = [];
  let para = [], list = null, quote = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.t}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.t}>`); list = null; } };
  const flushQuote = () => { if (quote.length) { out.push(`<blockquote>${md(quote.join('\n'))}</blockquote>`); quote = []; } };
  const flush = () => { flushPara(); flushList(); flushQuote(); };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^>\s?/.test(line)) { flushPara(); flushList(); quote.push(line.replace(/^>\s?/, '')); continue; }
    if (quote.length) flushQuote();
    if (!line.trim()) { flushPara(); flushList(); continue; }
    let m;
    if ((m = line.match(/^(#{2,3})\s+(.*)$/))) { flush(); const n = m[1].length; out.push(`<h${n}>${inline(m[2])}</h${n}>`); continue; }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { flush(); out.push('<hr>'); continue; }
    if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) { flushPara(); if (!list || list.t !== 'ul') { flushList(); list = { t: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { flushPara(); if (!list || list.t !== 'ol') { flushList(); list = { t: 'ol', items: [] }; } list.items.push(m[1]); continue; }
    const yt = line.trim().match(/^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})\S*$/);
    if (yt) { flush(); out.push(`<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" allowfullscreen loading="lazy" title="Vidéo YouTube"></iframe></div>`); continue; }
    flushList();
    para.push(line.trim());
  }
  flush();
  return out.join('\n');
}
export const readingMinutes = (text = '') => Math.max(1, Math.round(String(text).split(/\s+/).length / 200));

// ---------- Toasts ----------
export function toast(msg, type = '', ms = 3200) {
  const box = $('.toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>${type === 'ok' ? '✅' : type === 'err' ? '⚠️' : type === 'vip' ? '💎' : '📣'}</span><span>${esc(msg)}</span>`;
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms);
}

// ---------- Confettis ----------
const CONF_COLORS = ['#ff2e88', '#00e5ff', '#ffd23f', '#7b2ff7', '#2ee59d', '#ff8a3d'];
export function confetti(x = innerWidth / 2, y = innerHeight / 3, n = 70) {
  if (reduceMotion()) return;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('i');
    el.className = 'confetti';
    el.style.background = CONF_COLORS[i % CONF_COLORS.length];
    if (i % 3 === 0) el.style.borderRadius = '50%';
    document.body.appendChild(el);
    const a = Math.random() * Math.PI * 2;
    const v = 120 + Math.random() * 360;
    const dx = Math.cos(a) * v, dy = Math.sin(a) * v - 200;
    el.animate([
      { transform: `translate(${x}px, ${y}px) rotate(0) scale(1)`, opacity: 1 },
      { transform: `translate(${x + dx}px, ${y + dy}px) rotate(${Math.random() * 720}deg) scale(1)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${x + dx * 1.2}px, ${y + dy + 520}px) rotate(${Math.random() * 1080}deg) scale(.6)`, opacity: 0 },
    ], { duration: 1600 + Math.random() * 900, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => el.remove();
  }
}

// ---------- Compteurs animés ----------
export function countUp(root = document) {
  $$('[data-count]', root).forEach((el) => {
    const to = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || '0', 10);
    const suf = el.dataset.suffix || '';
    if (reduceMotion()) { el.textContent = to.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; return; }
    const t0 = performance.now(), dur = 1400;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * e).toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// ---------- Apparition au scroll + animations visibles uniquement ----------
let revealObs, liveObs;
export function reveal(root = document) {
  if (!revealObs) {
    revealObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          revealObs.unobserve(e.target);
          if (e.target.querySelector('[data-count]')) countUp(e.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });
  }
  if (!liveObs) {
    liveObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('paused', !e.isIntersecting));
    }, { rootMargin: '80px' });
  }
  $$('.reveal:not(.in)', root).forEach((el) => revealObs.observe(el));
  $$('.cover-art, .hero-scene', root).forEach((el) => liveObs.observe(el));
}

// ---------- Effet 3D sur les cartes ----------
export function tilt(root = document) {
  if (reduceMotion() || matchMedia('(hover: none)').matches) return;
  $$('.tilt', root).forEach((card) => {
    card.addEventListener('pointermove', (ev) => {
      const r = card.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translate(-3px,-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

// ---------- Feuille du bas ----------
export function sheet(html) {
  const back = document.createElement('div');
  back.className = 'sheet-backdrop';
  const el = document.createElement('div');
  el.className = 'sheet';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<div class="grab"></div>${html}`;
  document.body.append(back, el);
  requestAnimationFrame(() => { back.classList.add('in'); el.classList.add('in'); });
  const close = () => {
    back.classList.remove('in'); el.classList.remove('in');
    setTimeout(() => { back.remove(); el.remove(); }, 450);
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  back.addEventListener('click', close);
  let y0 = null;
  el.addEventListener('touchstart', (e) => { if (el.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchmove', (e) => { if (y0 !== null && e.touches[0].clientY - y0 > 90) { y0 = null; close(); } }, { passive: true });
  return { el, close };
}

// ---------- Bouton occupé ----------
export async function busy(btn, fn) {
  if (!btn) return fn();
  const html = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span>';
  try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = html; }
}

// ---------- Icônes ----------
const ic = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const icons = {
  home: ic('<path d="M3 11 12 3l9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
  vault: ic('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="4"/><path d="M12 8v1M12 15v1M8 12h1M15 12h1"/>'),
  map: ic('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
  game: ic('<path d="M6 8h12a4 4 0 0 1 4 4l-1 5a2.5 2.5 0 0 1-4.4 1L15 16H9l-1.6 2A2.5 2.5 0 0 1 3 17l-1-5a4 4 0 0 1 4-4z"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r=".6" fill="currentColor"/><circle cx="18" cy="13.5" r=".6" fill="currentColor"/>'),
  user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  search: ic('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  bookmark: ic('<path d="M6 3h12v18l-6-4-6 4z"/>'),
  share: ic('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>'),
  back: ic('<path d="M15 18 9 12l6-6"/>'),
  plus: ic('<path d="M12 5v14M5 12h14"/>'),
  minus: ic('<path d="M5 12h14"/>'),
  target: ic('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'),
  tiktok: ic('<path d="M14 3v11a4 4 0 1 1-4-4"/><path d="M14 3c.5 3 2.5 5 5 5"/>'),
  insta: ic('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>'),
};
