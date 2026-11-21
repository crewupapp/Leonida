import { esc, comicLetters, reveal, tilt, toast, confetti } from '../ui.js';
import { heroScene } from '../art.js';
import { articleCard, skeletonGrid, promo, footer, media } from '../components.js';
import { state, listArticles, polls, vote, frError, category, isLocked } from '../api.js';

const DEFAULT_STATS = [
  { value: 99, suffix: '', label: 'sur Metacritic' },
  { value: 32.5, dec: 1, suffix: ' M', label: 'précommandes' },
  { value: 3.79, dec: 2, suffix: ' Md$', label: 'le 1er jour' },
  { value: 8, suffix: '', label: 'nominations GOTY' },
];

export function pollHTML(p) {
  const total = Object.values(p.counts).reduce((a, b) => a + b, 0);
  const voted = p.mine !== undefined;
  const colors = ['#00e5ff', '#ff7ab8', '#ffd23f', '#2ee59d', '#b18cff', '#ff8a3d'];
  return `<div class="poll" data-poll="${p.id}">
    <div class="q">${esc(p.question)}</div>
    ${p.options.map((o, i) => {
      const n = p.counts[i] || 0;
      const pct = total ? Math.round((n / total) * 100) : 0;
      return `<button class="poll-opt${p.mine === i ? ' mine' : ''}" data-i="${i}" style="--c:${colors[i % colors.length]}" ${voted ? 'aria-disabled="true"' : ''}>
        <i class="fill" data-w="${voted ? pct : 0}"></i>
        <span>${p.mine === i ? '✔ ' : ''}${esc(o)}</span>
        ${voted ? `<span class="pct">${pct}%</span>` : ''}
      </button>`;
    }).join('')}
    <div class="muted" style="font-size:13px;font-weight:700;margin-top:6px">${total} vote${total > 1 ? 's' : ''}${voted ? '' : state.user ? ' · touche une réponse pour voter' : ' · connecte-toi pour voter'}</div>
  </div>`;
}

export function bindPolls(root, onChange) {
  requestAnimationFrame(() => root.querySelectorAll('.poll-opt .fill').forEach((f) => { f.style.width = f.dataset.w + '%'; }));
  root.querySelectorAll('.poll').forEach((box) => {
    box.querySelectorAll('.poll-opt').forEach((btn) => btn.addEventListener('click', async (ev) => {
      if (btn.getAttribute('aria-disabled')) return;
      if (!state.user) { location.hash = '#/connexion?next=' + encodeURIComponent(location.hash.slice(2) || ''); return; }
      try {
        await vote(box.dataset.poll, Number(btn.dataset.i));
        confetti(ev.clientX, ev.clientY, 30);
        toast('A voté ! 🗳️', 'ok');
        onChange && onChange();
      } catch (e) { toast(frError(e), 'err'); }
    }));
  });
}

export async function home(root) {
  const stats = Array.isArray(state.settings.stats) && state.settings.stats.length ? state.settings.stats : DEFAULT_STATS;
  root.innerHTML = `
    <section class="hero">
      ${heroScene()}
      <span class="stamp">GTA 6 · DISPO !</span>
      <div class="hero-copy">
        <h1 class="comic">${comicLetters("L'ACTU GTA 6")}<br>${comicLetters('EN DIRECT')}</h1>
        <p>News, secrets, astuces et la carte de Leonida : tout GTA 6 en français, en un seul endroit.</p>
        <div class="ctas">
          <a class="btn" href="#une">🔥 Lire la une</a>
          ${state.vip ? '<a class="btn cyan" href="#/secrets">🔓 Mes secrets</a>' : '<a class="btn gold shine" href="#/vip">💎 Passer VICE+</a>'}
        </div>
      </div>
    </section>
    <div class="stats">
      ${stats.map((s, i) => `<div class="stat reveal" style="--i:${i};--r:${[-2, 1.5, -1, 2][i % 4]}deg"><div class="n" data-count="${Number(s.value) || 0}" data-dec="${s.dec || 0}" data-suffix="${esc(s.suffix || '')}">0</div><div class="l">${esc(s.label)}</div></div>`).join('')}
    </div>
    <div id="une" class="featured"></div>
    <h2 class="section-title comic cyan">LES NEWS <span class="tag">EN CONTINU</span></h2>
    <div class="chips" id="chips">
      <button class="chip on" data-c="">🌴 Tout</button>
      ${state.categories.map((c) => `<button class="chip" data-c="${esc(c.slug)}" style="--c:${esc(c.color)}">${c.emoji} ${esc(c.name)}</button>`).join('')}
    </div>
    <div id="feed">${skeletonGrid(6)}</div>
    <div id="pollZone"></div>
    ${promo()}
    ${footer()}`;

  root.querySelector('.ctas a[href="#une"]').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('une').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  const all = await listArticles({ limit: 60 });
  const featured = all.find((a) => a.is_featured) || all[0];
  if (featured) {
    const c = category(featured.category);
    root.querySelector('#une').innerHTML = `
      <h2 class="section-title comic">À LA UNE <span class="tag">🔥 HOT</span></h2>
      <a class="card tilt reveal" href="#/a/${esc(featured.slug)}">
        <div class="cover">${media(featured)}
          ${c ? `<span class="sticker" style="--c:${esc(c.color)}">${c.emoji} ${esc(c.name)}</span>` : ''}
          ${isLocked(featured) ? '<span class="lock-badge">🔒 VICE+</span>' : ''}
          ${featured.is_breaking ? '<span class="breaking">BREAKING</span>' : ''}
        </div>
        <div class="body"><h3>${esc(featured.title)}</h3><p>${esc(featured.excerpt)}</p>
          <span class="btn small" style="align-self:flex-start;margin-top:6px">Lire l'article →</span></div>
      </a>`;
  }
  const feedEl = root.querySelector('#feed');
  const paint = (cat) => {
    const list = all.filter((a) => a !== featured && (!cat || a.category === cat));
    feedEl.innerHTML = list.length
      ? `<div class="grid">${list.map((a, i) => articleCard(a, i)).join('')}</div>`
      : '<div class="panel empty"><h3>Rien ici pour le moment</h3><p class="muted">Les prochaines news arrivent très vite.</p></div>';
    reveal(feedEl);
    tilt(feedEl);
  };
  paint('');
  root.querySelector('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    root.querySelectorAll('#chips .chip').forEach((x) => x.classList.toggle('on', x === b));
    paint(b.dataset.c);
  });

  const loadPoll = async () => {
    try {
      const list = await polls();
      if (!list.length) return;
      const zone = root.querySelector('#pollZone');
      if (!zone) return;
      zone.innerHTML = `<h2 class="section-title comic">TON AVIS <span class="tag">SONDAGE</span></h2><div class="panel reveal in">${pollHTML(list[0])}<a class="btn cyan small" href="#/jeux?tab=sondages" style="margin-top:12px">Tous les sondages →</a></div>`;
      bindPolls(zone, loadPoll);
    } catch (e) { console.warn(e); }
  };
  loadPoll();
  reveal(root);
}
