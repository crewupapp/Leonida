import { esc, reveal, tilt, confetti } from '../ui.js';
import { articleCard, skeletonGrid, footer, priceLabel } from '../components.js';
import { state, listArticles, contentStats } from '../api.js';

export async function secrets(root) {
  root.innerHTML = `
    <section class="vault-head">
      <div class="vault ${state.vip ? 'open' : ''}" id="vault"><div class="wheel"></div></div>
      <h1 class="comic gold" style="font-size:clamp(38px,8vw,64px);margin:10px 0 6px">LE COFFRE VICE+</h1>
      <p style="font-weight:600;max-width:560px;margin:0 auto">${state.vip
        ? 'Bienvenue dans le coffre ! Tous les secrets, guides et analyses exclusives sont à toi.'
        : 'Secrets, guides et analyses que tu ne trouveras pas ailleurs. Jette un œil, puis ouvre le coffre.'}</p>
    </section>
    <div class="stats" id="cstats"></div>
    ${state.vip ? '' : `<div style="text-align:center;margin:22px 0 4px"><a class="btn gold shine" href="#/vip">💎 Ouvrir le coffre · ${esc(priceLabel())}/mois</a></div>`}
    <h2 class="section-title comic cyan">LES EXCLUS <span class="tag">${state.vip ? 'DÉBLOQUÉ' : 'VICE+'}</span></h2>
    <div id="list">${skeletonGrid(3)}</div>
    <h2 class="section-title comic">ET AUSSI</h2>
    <div class="grid">
      <a class="card tilt reveal" href="#/carte"><div class="body"><h3>🗺️ La carte de Leonida</h3><p>Régions, lieux et easter eggs avec ton suivi de progression.</p></div></a>
      <a class="card tilt reveal" href="#/jeux"><div class="body"><h3>🧠 Le quiz GTA 6</h3><p>Questions bonus et classement des meilleurs fans.</p></div></a>
      <a class="card tilt reveal" href="#/c/secrets"><div class="body"><h3>🔍 Rubrique Secrets</h3><p>Toutes les astuces, codes et clins d'œil au même endroit.</p></div></a>
    </div>
    ${footer()}`;

  if (state.vip) setTimeout(() => { const v = root.querySelector('#vault'); if (v) { const r = v.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, 40); } }, 700);

  const [list, st] = await Promise.all([listArticles({ premium: true }), contentStats().catch(() => null)]);
  if (st) {
    const items = [
      [st.premium_articles, 'articles exclusifs'],
      [st.secret_markers, 'lieux secrets sur la carte'],
      [st.premium_questions, 'questions bonus'],
      [list.filter((a) => a.category === 'secrets').length, 'guides secrets'],
    ];
    root.querySelector('#cstats').innerHTML = items.map(([n, l], i) => `<div class="stat reveal" style="--i:${i};--r:${[-2, 1.5, -1, 2][i]}deg"><div class="n" data-count="${n}">0</div><div class="l">${l}</div></div>`).join('');
  }
  const box = root.querySelector('#list');
  box.innerHTML = list.length
    ? `<div class="grid">${list.map((a, i) => articleCard(a, i)).join('')}</div>`
    : '<div class="panel empty"><h3>Le coffre se remplit…</h3><p class="muted">Les premiers secrets arrivent très vite.</p></div>';
  reveal(root);
  tilt(root);
}
