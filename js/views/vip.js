import { esc, toast, confetti, busy, fmtDate } from '../ui.js';
import { logoBadge } from '../art.js';
import { footer, priceLabel, mascot } from '../components.js';
import { state, billing, syncSubscription, contentStats, frError } from '../api.js';

const BENEFITS = [
  ['🔍', '#ffd23f', 'Tous les secrets', 'Easter eggs, astuces, cheat codes et guides exclusifs, mis à jour en continu.'],
  ['🗺️', '#00e5ff', 'La carte complète', 'Tous les lieux secrets de Leonida et le suivi de ta progression.'],
  ['⚡', '#ff7ab8', 'Les exclus en premier', 'Nos articles VICE+ avant tout le monde, souvent des jours avant.'],
  ['🧠', '#2ee59d', 'Quiz bonus + classement', 'Toutes les questions du quiz et ta place parmi les meilleurs fans.'],
  ['📊', '#ff8a3d', 'Les analyses', 'Version PC, mode online, ventes : on décrypte ce qui arrive.'],
  ['💎', '#b18cff', 'Badge VICE+', 'Ton badge brille sur ton profil et dans le classement.'],
];

export async function vip(root) {
  let plan = 'monthly';
  const s = state.sub;
  const paid = state.vip && !state.staff;

  const statusBlock = () => {
    if (state.staff && !(s && ['active', 'trialing'].includes(s.status))) {
      return `<div class="panel" style="text-align:center;max-width:520px;margin:0 auto"><h3>🛠️ Accès équipe</h3><p>Ton compte staff débloque tout le contenu VICE+ automatiquement.</p></div>`;
    }
    const end = s?.current_period_end ? fmtDate(s.current_period_end) : null;
    return `<div class="panel" style="text-align:center;max-width:520px;margin:0 auto">
      <h3 style="font-size:24px">💎 Tu es membre VICE+</h3>
      <p>Formule ${s?.plan === 'year' ? 'annuelle' : 'mensuelle'}${end ? (s.cancel_at_period_end ? ` · se termine le <b>${end}</b>` : ` · renouvellement le <b>${end}</b>`) : ''}.</p>
      <div class="row" style="justify-content:center;gap:10px">
        <a class="btn" href="#/secrets">🔓 Ouvrir le coffre</a>
        <button class="btn cream" id="portal">⚙️ Gérer mon abonnement</button>
      </div>
    </div>`;
  };

  root.innerHTML = `
    <section class="vip-hero">
      <div class="vip-card">
        <div class="chip-gold"></div>
        ${logoBadge(54)}
        <div class="vip-name comic gold">VICE+</div>
        <div class="vip-sub">MEMBRE</div>
      </div>
      <h1 class="comic" style="font-size:clamp(34px,7vw,56px);margin:0 0 8px">${state.vip ? 'MERCI D\'ÊTRE LÀ !' : 'DÉBLOQUE TOUT GTA 6'}</h1>
      <p style="font-weight:600;max-width:560px;margin:0 auto 18px">${state.vip ? 'Ton accès est actif. Profite de tous les contenus exclusifs.' : 'Le meilleur de VICE CITY NEWS, sans limite. Sans engagement : tu arrêtes quand tu veux.'}</p>
    </section>
    ${state.vip ? statusBlock() : `
    <section style="text-align:center">
      <div class="plan-toggle" id="pt">
        <span class="knob"></span><span class="save">−30 %</span>
        <button class="on" data-p="monthly">Mensuel</button><button data-p="yearly">Annuel</button>
      </div>
      <div class="price comic gold" id="price"></div>
      <p class="muted" id="priceNote" style="font-weight:700;margin:8px 0 18px"></p>
      <label class="consent"><input type="checkbox" id="consent"><span>Je veux accéder tout de suite au contenu VICE+ et je reconnais perdre mon droit de rétractation de 14 jours dès que l'accès commence (art. L221-28 du Code de la consommation). J'accepte les <a href="#/mentions" style="text-decoration:underline">CGV</a>.</span></label>
      <button class="btn gold shine" id="buy" style="font-size:19px;padding:16px 28px">💎 Je deviens VICE+</button>
      <p class="muted" style="font-size:13px;margin-top:10px">Paiement sécurisé par Stripe · carte bancaire, Apple Pay, Google Pay</p>
    </section>`}
    <h2 class="section-title comic cyan">CE QUE TU DÉBLOQUES</h2>
    <div class="panel"><div class="benefits">
      ${BENEFITS.map(([ico, c, t, d], i) => `<div class="benefit"><div class="ico" style="--c:${c};--i:${i}">${ico}</div><div><b>${t}</b><span>${d}</span></div></div>`).join('')}
    </div><div id="counts" class="muted" style="font-weight:800;text-align:center"></div></div>
    <h2 class="section-title comic">QUESTIONS FRÉQUENTES</h2>
    <div class="faq">
      <details><summary>Je peux arrêter quand je veux ?</summary><p>Oui. Tu résilies en deux clics depuis « Gérer mon abonnement » et tu gardes l'accès jusqu'à la fin de la période déjà payée.</p></details>
      <details><summary>Le paiement est-il sécurisé ?</summary><p>Le paiement passe par Stripe, un des leaders mondiaux du paiement en ligne. VICE CITY NEWS ne voit et ne stocke jamais ton numéro de carte.</p></details>
      <details><summary>C'est une appli officielle de Rockstar ?</summary><p>Non. VICE CITY NEWS est un média de fans indépendant, sans lien avec Rockstar Games ni Take-Two Interactive.</p></details>
      <details><summary>Je change de téléphone, je perds mon accès ?</summary><p>Non, ton accès est lié à ton compte. Connecte-toi sur n'importe quel appareil et tout est là.</p></details>
    </div>
    <div style="display:flex;justify-content:center;margin-top:20px">${mascot('wave')}</div>
    ${footer()}`;

  contentStats().then((st) => {
    const el = root.querySelector('#counts');
    if (el && st) el.textContent = `Déjà ${st.premium_articles} articles exclusifs, ${st.secret_markers} lieux secrets et ${st.premium_questions} questions bonus, et ça grandit chaque semaine.`;
  }).catch(() => {});

  root.querySelector('#portal')?.addEventListener('click', (e) => busy(e.currentTarget, async () => {
    try {
      const { url } = await billing('portal');
      location.href = url;
    } catch (err) { toast(err.code === 'payments_not_configured' ? 'La gestion en ligne arrive bientôt. Écris-nous pour toute demande.' : frError(err), 'err'); }
  }));

  if (state.vip) return;
  const pt = root.querySelector('#pt');
  const paint = () => {
    root.querySelector('#price').innerHTML = `${esc(priceLabel(plan))}<small> / ${plan === 'yearly' ? 'an' : 'mois'}</small>`;
    const m = state.settings.price_monthly?.amount, y = state.settings.price_yearly?.amount;
    root.querySelector('#priceNote').textContent = plan === 'yearly' && m && y
      ? `Soit ${(y / 12 / 100).toFixed(2).replace('.', ',')} € par mois : ${Math.round((1 - y / (m * 12)) * 100)} % d'économie`
      : 'Sans engagement, résiliable à tout moment';
    const save = pt.querySelector('.save');
    if (m && y) save.textContent = `−${Math.round((1 - y / (m * 12)) * 100)} %`;
  };
  paint();
  pt.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    plan = b.dataset.p;
    pt.classList.toggle('yearly', plan === 'yearly');
    pt.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    paint();
  });
  root.querySelector('#buy').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    if (!state.user) { toast('Crée ton compte gratuit pour continuer'); location.hash = '#/connexion?tab=signup&next=vip'; return; }
    if (!root.querySelector('#consent').checked) {
      const c = root.querySelector('.consent');
      c.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 300 });
      toast('Coche la case pour continuer', 'err');
      return;
    }
    busy(btn, async () => {
      try {
        const { url } = await billing('checkout', { plan });
        location.href = url;
      } catch (err) {
        if (err.code === 'payments_not_configured') toast("Le paiement en ligne n'est pas encore ouvert : il arrive très bientôt !", 'err', 5000);
        else if (err.code === 'already_subscribed') { await syncSubscription().catch(() => {}); confetti(); toast('Tu es déjà membre VICE+ 💎', 'vip'); }
        else toast(frError(err), 'err');
      }
    });
  });
}
