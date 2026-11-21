// Composants partagés entre les écrans.
import { esc, timeAgo, fmtDate, fmtNum, icons } from './ui.js';
import { cover, flamingo, logoBadge } from './art.js';
import { state, category, isLocked } from './api.js';

export function media(a) {
  return a.cover_url
    ? `<img src="${esc(a.cover_url)}" alt="" loading="lazy" decoding="async">`
    : cover(a.cover_style, a.slug);
}

export function articleCard(a, i = 0, { excerpt = true } = {}) {
  const c = category(a.category);
  const locked = isLocked(a);
  return `<a class="card tilt reveal" style="--i:${i % 6}" href="#/a/${esc(a.slug)}">
    <div class="cover">${media(a)}
      ${c ? `<span class="sticker" style="--c:${esc(c.color)}">${c.emoji} ${esc(c.name)}</span>` : ''}
      ${locked ? `<span class="lock-badge${state.vip ? ' open' : ''}">${state.vip ? '🔓' : '🔒'} VICE+</span>` : ''}
      ${a.is_breaking ? '<span class="breaking">BREAKING</span>' : ''}
    </div>
    <div class="body">
      <h3>${esc(a.title)}</h3>
      ${excerpt ? `<p>${esc(a.excerpt)}</p>` : ''}
      <div class="meta"><span>${timeAgo(a.published_at)}</span><span>· ${a.reading_minutes} min</span>${a.views ? `<span>· 👀 ${fmtNum(a.views)}</span>` : ''}</div>
    </div>
  </a>`;
}

export function skeletonGrid(n = 6) {
  return `<div class="grid">${Array.from({ length: n }, () => '<div class="skeleton" style="height:300px"></div>').join('')}</div>`;
}

export function mascot(pose = 'wave') {
  return `<div class="mascot"><svg viewBox="-10 -10 150 220">${flamingo('bob', pose)}</svg></div>`;
}

export function empty(title, text, cta = '') {
  return `<div class="empty panel reveal">${mascot()}<h3>${esc(title)}</h3><p class="muted">${esc(text)}</p>${cta}</div>`;
}

export function priceLabel(plan = 'monthly') {
  const v = state.settings[plan === 'yearly' ? 'price_yearly' : 'price_monthly'];
  return v?.label || (plan === 'yearly' ? '24,99 €' : '2,99 €');
}

export function promo() {
  if (state.vip) return '';
  return `<section class="promo reveal">
    <div>
      <h3 class="comic gold">PASSE VICE+</h3>
      <p>Secrets, guides exclusifs, carte complète de Leonida et quiz bonus. Dès ${esc(priceLabel())}/mois, sans engagement.</p>
      <div style="margin-top:14px"><a class="btn gold shine" href="#/vip">💎 Je débloque tout</a></div>
    </div>
    ${mascot('wave')}
  </section>`;
}

export function vipGate({ title = 'Réservé VICE+', text = '', freeAt = null, next = '' } = {}) {
  const loginLink = state.user ? '' : `<a class="btn ghost small" href="#/connexion?next=${encodeURIComponent(next)}">J'ai déjà un compte</a>`;
  return `<div class="gate">
    <div class="lock">🔒</div>
    <h3 class="comic gold">${esc(title)}</h3>
    ${text ? `<p>${esc(text)}</p>` : ''}
    <ul>
      <li>Tous les secrets, guides et analyses exclusives</li>
      <li>La carte complète de Leonida + ton suivi de progression</li>
      <li>Les questions bonus du quiz et le classement</li>
      <li>Sans engagement, résiliable en 2 clics</li>
    </ul>
    <div class="row" style="justify-content:center;gap:10px">
      <a class="btn gold shine" href="#/vip">💎 Passer VICE+ · ${esc(priceLabel())}/mois</a>
      ${loginLink}
    </div>
    ${freeAt ? `<div class="free-soon">🎁 Cet article devient gratuit pour tous le ${fmtDate(freeAt)}.</div>` : ''}
  </div>`;
}

export function footer() {
  const s = state.settings.socials || {};
  const links = [
    s.tiktok ? `<a class="icon-btn" href="${esc(s.tiktok)}" target="_blank" rel="noopener" aria-label="TikTok">${icons.tiktok}</a>` : '',
    s.instagram ? `<a class="icon-btn" href="${esc(s.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icons.insta}</a>` : '',
  ].join('');
  return `<footer class="footer">
    <div style="display:flex;justify-content:center;margin-bottom:8px">${logoBadge(52)}</div>
    <b>VICE CITY NEWS</b> · GTA 6 | ACTUS | SECRETS | GAMEPLAY
    ${links ? `<div class="socials">${links}</div>` : ''}
    <div>Application de fans non officielle, sans lien avec Rockstar Games ni Take-Two Interactive.<br>
    « Grand Theft Auto » et « GTA » sont des marques de Take-Two Interactive.</div>
    <div style="margin-top:8px"><a href="#/mentions">Mentions légales, CGV & confidentialité</a></div>
  </footer>`;
}
