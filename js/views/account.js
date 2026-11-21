import { esc, toast, confetti, busy, fmtDate, reveal, tilt } from '../ui.js';
import { AVATARS } from '../art.js';
import { footer, mascot, articleCard } from '../components.js';
import * as api from '../api.js';

const { state } = api;

// ---------- Connexion / inscription ----------
export async function authView(root, { query, go }) {
  const next = query.get('next') || 'moi';
  if (state.user) { go(next); return; }
  let tab = query.get('tab') === 'signup' ? 'signup' : 'login';

  const draw = (msg = '') => {
    root.innerHTML = `
      <div class="auth-wrap">
        ${mascot('wave')}
        <div class="panel">
          <div class="tabs" style="background:#efe4ff;border-color:#1a0b2e;margin-bottom:16px;display:flex">
            <button data-t="login" class="${tab === 'login' ? 'on' : ''}" style="flex:1;color:#1a0b2e">Connexion</button>
            <button data-t="signup" class="${tab === 'signup' ? 'on' : ''}" style="flex:1;color:#1a0b2e">Inscription</button>
          </div>
          <h1 class="comic" style="font-size:34px;margin:0 0 14px;text-align:center">${tab === 'login' ? 'CONTENT DE TE REVOIR' : 'REJOINS LE CREW'}</h1>
          ${msg}
          <form id="f" novalidate>
            ${tab === 'signup' ? `<div class="field"><label for="u">Pseudo</label><input id="u" name="u" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_.\\-]{3,24}" autocomplete="nickname" placeholder="ex : Lucia_Fan"><span class="hint">3 à 24 caractères : lettres, chiffres, . _ -</span></div>` : ''}
            <div class="field"><label for="e">E-mail</label><input id="e" name="e" type="email" required autocomplete="email" placeholder="toi@exemple.fr"></div>
            <div class="field"><label for="p">Mot de passe</label><input id="p" name="p" type="password" required minlength="8" autocomplete="${tab === 'login' ? 'current-password' : 'new-password'}" placeholder="${tab === 'login' ? '••••••••' : '8 caractères minimum'}"></div>
            <button class="btn block" type="submit">${tab === 'login' ? '🔑 Se connecter' : '🚀 Créer mon compte gratuit'}</button>
          </form>
          ${tab === 'login' ? '<button class="btn ghost small block" id="forgot" style="margin-top:10px;color:#1a0b2e;border-color:#1a0b2e">Mot de passe oublié ?</button>' : '<p class="muted" style="font-size:12px;margin:12px 0 0">En créant un compte, tu acceptes nos <a href="#/mentions" style="text-decoration:underline">conditions et notre politique de confidentialité</a>.</p>'}
        </div>
      </div>
      ${footer()}`;
    root.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.t; draw(); }));
    const f = root.querySelector('#f');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = f.e.value.trim(), pass = f.p.value;
      const btn = f.querySelector('button[type=submit]');
      if (!/^\S+@\S+\.\S+$/.test(email)) return showErr('Entre une adresse e-mail valide.');
      if (tab === 'signup') {
        const u = f.u.value.trim();
        if (!/^[A-Za-z0-9_.-]{3,24}$/.test(u)) return showErr('Pseudo : 3 à 24 caractères (lettres, chiffres, . _ -).');
        if (pass.length < 8) return showErr('Le mot de passe doit faire au moins 8 caractères.');
        return busy(btn, async () => {
          try {
            const data = await api.signUp(email, pass, u);
            if (data.session) { confetti(); toast('Bienvenue dans le crew !', 'ok'); go(next); }
            else draw(`<div class="form-msg ok">📩 Presque fini ! Clique sur le lien envoyé à <b>${esc(email)}</b> pour activer ton compte (pense aux spams), puis reviens te connecter.</div>`);
          } catch (err) { showErr(api.frError(err)); }
        });
      }
      return busy(btn, async () => {
        try { await api.signIn(email, pass); toast('Connecté !', 'ok'); go(next); }
        catch (err) { showErr(api.frError(err)); }
      });
    });
    root.querySelector('#forgot')?.addEventListener('click', (e) => {
      const email = f.e.value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) { showErr("Écris d'abord ton e-mail dans le champ ci-dessus."); f.e.focus(); return; }
      busy(e.currentTarget, async () => {
        try { await api.resetPassword(email); draw(`<div class="form-msg ok">📩 Si un compte existe pour <b>${esc(email)}</b>, tu vas recevoir un lien pour choisir un nouveau mot de passe.</div>`); }
        catch (err) { showErr(api.frError(err)); }
      });
    });
  };
  const showErr = (m) => {
    root.querySelector('.form-msg')?.remove();
    root.querySelector('#f').insertAdjacentHTML('beforebegin', `<div class="form-msg err">⚠️ ${esc(m)}</div>`);
  };
  draw();
}

// ---------- Nouveau mot de passe ----------
export async function newPassword(root, { go }) {
  root.innerHTML = `<div class="auth-wrap">${mascot('wave')}<div class="panel">
    <h1 class="comic" style="font-size:32px;margin:0 0 14px;text-align:center">NOUVEAU MOT DE PASSE</h1>
    ${state.user ? `<form id="f"><div class="field"><label for="p">Nouveau mot de passe</label><input id="p" type="password" minlength="8" required autocomplete="new-password"></div><button class="btn block">Enregistrer</button></form>`
      : '<p>Ce lien a expiré ou a déjà été utilisé. Redemande un lien depuis l\'écran de connexion.</p><a class="btn block" href="#/connexion">Connexion</a>'}
  </div></div>`;
  root.querySelector('#f')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = e.currentTarget.querySelector('#p').value;
    if (p.length < 8) { toast('8 caractères minimum', 'err'); return; }
    busy(e.currentTarget.querySelector('button'), async () => {
      try { await api.updatePassword(p); toast('Mot de passe mis à jour', 'ok'); go('moi'); }
      catch (err) { toast(api.frError(err), 'err'); }
    });
  });
}

// ---------- Profil ----------
export async function profile(root, ctx) {
  if (!state.user) return authView(root, { ...ctx, query: new URLSearchParams('next=moi') });
  const p = state.profile || {};
  const s = state.sub;
  root.innerHTML = `
    <section class="profile-head">
      <div class="avatar-big" id="av">${AVATARS[p.avatar] || '🦩'}</div>
      <h1 class="comic" style="font-size:40px;margin:6px 0">${esc(p.username || 'Joueur mystère')}</h1>
      <div>${state.vip ? `<span class="badge vip">💎 ${state.staff ? 'STAFF' : 'VICE+'}</span>` : '<span class="badge">Membre gratuit</span>'} <span class="muted" style="font-size:13px">· inscrit le ${fmtDate(p.created_at || state.user.created_at)}</span></div>
    </section>
    <div class="kpis" id="kpis"><div class="kpi"><b>…</b><span>bonnes réponses</span></div><div class="kpi"><b>…</b><span>lieux trouvés</span></div><div class="kpi"><b>…</b><span>favoris</span></div></div>
    ${state.vip ? '' : `<a class="promo" href="#/vip" style="display:block;margin:10px 0 0;padding:18px 20px"><h3 class="comic gold" style="font-size:30px">PASSE VICE+ 💎</h3><p>Débloque tous les secrets, la carte complète et le quiz bonus.</p></a>`}
    <div class="panel" style="margin-top:20px">
      <h3>🎭 Mon avatar & pseudo</h3>
      <div class="avatar-pick">${Object.entries(AVATARS).map(([k, e]) => `<button data-a="${k}" class="${p.avatar === k ? 'on' : ''}" aria-label="${k}">${e}</button>`).join('')}</div>
      <form id="uf" class="row" style="align-items:flex-end">
        <div class="field" style="margin:0"><label for="un">Pseudo</label><input id="un" value="${esc(p.username || '')}" maxlength="24" pattern="[A-Za-z0-9_.\\-]{3,24}" placeholder="Ton pseudo"></div>
        <button class="btn cyan" style="flex:0 0 auto">Enregistrer</button>
      </form>
    </div>
    <div class="panel" style="margin-top:20px">
      <h3>💎 Abonnement</h3>
      <p style="margin:0 0 12px">${state.staff ? 'Accès équipe : tout est débloqué.' : state.vip ? `VICE+ actif${s?.current_period_end ? (s.cancel_at_period_end ? ` jusqu'au ${fmtDate(s.current_period_end)}` : ` · renouvellement le ${fmtDate(s.current_period_end)}`) : ''}.` : 'Tu utilises la version gratuite.'}</p>
      <a class="btn ${state.vip ? 'cream' : 'gold'} small" href="#/vip">${state.vip ? 'Voir mon abonnement' : 'Découvrir VICE+'}</a>
    </div>
    <h2 class="section-title comic cyan">MES FAVORIS</h2>
    <div id="favs"></div>
    <div class="panel list-links" style="margin-top:20px">
      ${state.staff ? '<a href="#/admin">🛠️ Espace admin</a>' : ''}
      <a href="#/favoris">🔖 Tous mes favoris</a>
      <a href="#/mentions">📄 Mentions légales & CGV</a>
      <button id="logout" style="color:#ff2e88">🚪 Se déconnecter</button>
    </div>
    ${footer()}`;

  root.querySelectorAll('.avatar-pick button').forEach((b) => b.addEventListener('click', async () => {
    try {
      await api.updateProfile({ avatar: b.dataset.a });
      root.querySelectorAll('.avatar-pick button').forEach((x) => x.classList.toggle('on', x === b));
      const av = root.querySelector('#av');
      av.textContent = AVATARS[b.dataset.a];
      av.animate([{ transform: 'scale(.6) rotate(-30deg)' }, { transform: 'scale(1.15) rotate(10deg)' }, { transform: 'scale(1)' }], { duration: 600, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    } catch (e) { toast(api.frError(e), 'err'); }
  }));
  root.querySelector('#uf').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = root.querySelector('#un').value.trim();
    if (!/^[A-Za-z0-9_.-]{3,24}$/.test(v)) { toast('Pseudo : 3 à 24 caractères (lettres, chiffres, . _ -)', 'err'); return; }
    busy(e.currentTarget.querySelector('button'), async () => {
      try { await api.updateProfile({ username: v }); root.querySelector('h1').textContent = v; toast('Pseudo mis à jour', 'ok'); }
      catch (err) { toast(api.frError(err), 'err'); }
    });
  });
  root.querySelector('#logout').addEventListener('click', async () => { await api.signOut(); toast('À bientôt à Vice City 👋'); ctx.go(''); });

  const [answers, map, favIds] = await Promise.all([
    api.myAnswers().catch(() => []),
    api.mapData().catch(() => ({ found: new Set() })),
    api.bookmarkIds().catch(() => []),
  ]);
  const kp = root.querySelectorAll('.kpi b');
  kp[0].textContent = answers.filter((a) => a.is_correct).length;
  kp[1].textContent = map.found.size;
  kp[2].textContent = favIds.length;
  const favs = favIds.length ? await api.listArticles({ ids: favIds.slice(0, 6) }) : [];
  const box = root.querySelector('#favs');
  box.innerHTML = favs.length
    ? `<div class="grid">${favs.map((a, i) => articleCard(a, i, { excerpt: false })).join('')}</div>`
    : '<div class="panel"><p class="muted" style="margin:0">Touche « Enregistrer » sur un article pour le retrouver ici.</p></div>';
  reveal(box);
  tilt(box);
}
