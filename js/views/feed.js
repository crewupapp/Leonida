import { esc, reveal, tilt } from '../ui.js';
import { articleCard, skeletonGrid, empty, footer, promo } from '../components.js';
import { state, listArticles, bookmarkIds, category } from '../api.js';

export async function feed(root, { path, params, query }) {
  const mode = path.startsWith('c/') ? 'cat' : path === 'favoris' ? 'fav' : 'search';
  const q = query.get('q') || '';
  const c = mode === 'cat' ? category(params[0]) : null;
  const title = mode === 'cat' ? `${c?.emoji || ''} ${c?.name || 'Rubrique'}` : mode === 'fav' ? '🔖 Mes favoris' : '🔎 Recherche';

  root.innerHTML = `
    <h1 class="section-title comic" style="margin-top:26px">${esc(title.toUpperCase())}</h1>
    ${mode === 'search' ? `<form id="sf" class="field" role="search" style="margin-bottom:18px">
      <label for="sq" class="sr-only">Rechercher</label>
      <input id="sq" name="q" type="search" placeholder="Cheat codes, Lucia, version PC…" value="${esc(q)}" autocomplete="off" autofocus>
    </form>` : ''}
    <div id="res">${skeletonGrid(3)}</div>
    ${promo()}
    ${footer()}`;

  const res = root.querySelector('#res');
  const show = (list, emptyTitle, emptyText, cta = '') => {
    res.innerHTML = list.length
      ? `<div class="grid">${list.map((a, i) => articleCard(a, i)).join('')}</div>`
      : empty(emptyTitle, emptyText, cta);
    reveal(res);
    tilt(res);
  };

  if (mode === 'cat') {
    show(await listArticles({ category: params[0] }), 'Rien dans cette rubrique', 'Les prochaines news arrivent très vite.');
  } else if (mode === 'fav') {
    if (!state.user) { show([], 'Connecte-toi', 'Tes articles enregistrés apparaîtront ici.', '<a class="btn" href="#/connexion?next=favoris">Se connecter</a>'); return; }
    const ids = await bookmarkIds();
    show(ids.length ? await listArticles({ ids }) : [], 'Aucun favori', 'Touche « Enregistrer » sur un article pour le retrouver ici.', '<a class="btn" href="#/">Voir les news</a>');
  } else {
    let timer;
    const run = async (text) => {
      if (!text.trim()) { show(await listArticles({ limit: 12 }), '', ''); return; }
      show(await listArticles({ search: text, limit: 30 }), 'Aucun résultat', `Rien trouvé pour « ${text} ». Essaie un autre mot.`);
    };
    const input = root.querySelector('#sq');
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        history.replaceState(null, '', '#/recherche' + (input.value ? '?q=' + encodeURIComponent(input.value) : ''));
        run(input.value);
      }, 300);
    });
    root.querySelector('#sf').addEventListener('submit', (e) => { e.preventDefault(); run(input.value); });
    await run(q);
    return () => clearTimeout(timer);
  }
}
