import { esc, md, fmtDate, fmtNum, toast, confetti, icons, reveal, tilt } from '../ui.js';
import { articleCard, media, vipGate, empty, footer } from '../components.js';
import { state, getArticle, incrementView, listArticles, bookmarkIds, setBookmark, category, isLocked, frError } from '../api.js';

export async function article(root, { params }) {
  const slug = params[0];
  root.innerHTML = '<div class="article"><div class="skeleton" style="aspect-ratio:5/3;margin-top:16px;border-radius:26px"></div><div class="skeleton" style="height:60px;margin-top:20px"></div><div class="skeleton" style="height:320px;margin-top:20px"></div></div>';
  const a = await getArticle(slug);
  if (!a) {
    root.innerHTML = empty('Article introuvable', "Ce lien ne mène nulle part… comme une mission annulée.", '<a class="btn" href="#/">Retour à l\'accueil</a>');
    return;
  }
  incrementView(a.id).catch(() => {});
  const c = category(a.category);
  const locked = isLocked(a) && a.body === null;
  const marks = await bookmarkIds().catch(() => []);
  let saved = marks.includes(a.id);

  const ghost = Array.from({ length: 7 }, (_, i) => `<div class="line" style="width:${[96, 88, 92, 70, 94, 85, 60][i]}%"></div>`).join('');
  root.innerHTML = `
    <div class="read-progress" id="rp"></div>
    <article class="article">
      <a class="btn ghost small" href="#/" style="margin-top:14px">${icons.back.replace('<svg', '<svg width="18" height="18"')} Retour</a>
      <div class="article-cover">${media(a)}</div>
      <h1 class="comic">${esc(a.title)}</h1>
      <div class="meta">
        ${c ? `<a class="sticker" style="--c:${esc(c.color)}" href="#/c/${esc(c.slug)}">${c.emoji} ${esc(c.name)}</a>` : ''}
        ${a.is_premium ? '<span class="lock-badge" style="position:static">💎 VICE+</span>' : ''}
        <span>📅 ${fmtDate(a.published_at, true)}</span>
        <span>⏱️ ${a.reading_minutes} min</span>
        ${a.views ? `<span>👀 ${fmtNum(a.views)} vues</span>` : ''}
        ${a.status === 'draft' ? '<span class="badge draft">BROUILLON</span>' : ''}
      </div>
      <div class="tools">
        <button class="btn cream small" id="bm">${icons.bookmark.replace('<svg', '<svg width="18" height="18"')} <span>${saved ? 'Enregistré' : 'Enregistrer'}</span></button>
        <button class="btn cyan small" id="share">${icons.share.replace('<svg', '<svg width="18" height="18"')} Partager</button>
        ${state.staff ? `<a class="btn violet small" href="#/admin/article/${a.id}">✏️ Modifier</a>` : ''}
      </div>
      ${locked
        ? `<div class="paywall">
            <div class="prose"><p><strong>${esc(a.excerpt)}</strong></p><div class="ghost-text">${ghost}</div></div>
            ${vipGate({ title: 'Article exclusif VICE+', text: 'La suite est réservée aux membres VICE+.', freeAt: a.free_at && new Date(a.free_at) > new Date() ? a.free_at : null, next: 'a/' + a.slug })}
          </div>`
        : `<div class="prose">${md(a.body || a.excerpt)}</div>`}
      ${a.tags?.length ? `<div class="chips" style="margin-top:16px">${a.tags.map((t) => `<a class="chip" href="#/recherche?q=${encodeURIComponent(t)}">#${esc(t)}</a>`).join('')}</div>` : ''}
      <div id="related"></div>
    </article>
    ${footer()}`;

  root.querySelector('#bm').addEventListener('click', async (ev) => {
    const btn = ev.currentTarget;
    if (!state.user) { location.hash = '#/connexion?next=' + encodeURIComponent('a/' + a.slug); return; }
    try {
      saved = !saved;
      await setBookmark(a.id, saved);
      btn.querySelector('span').textContent = saved ? 'Enregistré' : 'Enregistrer';
      if (saved) { confetti(ev.clientX, ev.clientY, 24); toast('Ajouté à tes favoris', 'ok'); }
    } catch (e) { saved = !saved; toast(frError(e), 'err'); }
  });
  root.querySelector('#share').addEventListener('click', async () => {
    const url = location.origin + location.pathname + '#/a/' + a.slug;
    try {
      if (navigator.share) await navigator.share({ title: a.title, text: a.excerpt, url });
      else { await navigator.clipboard.writeText(url); toast('Lien copié !', 'ok'); }
    } catch { /* partage annulé */ }
  });

  const rp = root.querySelector('#rp');
  const onScroll = () => {
    const h = document.documentElement;
    const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    rp.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  listArticles({ category: a.category, limit: 4, exclude: a.id }).then((list) => {
    const box = root.querySelector('#related');
    if (!box || !list.length) return;
    box.innerHTML = `<h2 class="section-title comic cyan">À LIRE AUSSI</h2><div class="grid">${list.slice(0, 3).map((x, i) => articleCard(x, i, { excerpt: false })).join('')}</div>`;
    reveal(box);
    tilt(box);
  }).catch(() => {});

  return () => window.removeEventListener('scroll', onScroll);
}
