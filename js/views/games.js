import { esc, toast, confetti, reveal } from '../ui.js';
import { footer, vipGate, mascot } from '../components.js';
import { state, quizQuestions, answerQuiz, myAnswers, leaderboard, contentStats, polls, frError } from '../api.js';
import { AVATARS } from '../art.js';
import { pollHTML, bindPolls } from './home.js';

const KEYS = ['A', 'B', 'C', 'D'];
const KCOL = ['#00e5ff', '#ff7ab8', '#ffd23f', '#2ee59d'];

export async function games(root, { query }) {
  let tab = query.get('tab') || 'quiz';
  root.innerHTML = `
    <h1 class="section-title comic" style="margin-top:26px">LA SALLE DE JEUX</h1>
    <div class="tabs" role="tablist">
      <button data-t="quiz">🧠 Quiz</button>
      <button data-t="classement">🏆 Classement</button>
      <button data-t="sondages">🗳️ Sondages</button>
    </div>
    <div id="pane"></div>
    ${footer()}`;
  const pane = root.querySelector('#pane');
  const tabs = root.querySelectorAll('.tabs button');
  const show = (t) => {
    tab = t;
    tabs.forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    history.replaceState(null, '', '#/jeux' + (t === 'quiz' ? '' : '?tab=' + t));
    ({ quiz, classement, sondages })[t](pane);
  };
  tabs.forEach((b) => b.addEventListener('click', () => show(b.dataset.t)));
  show(tab);
}

async function quiz(pane) {
  delete pane.dataset.lock;
  pane.innerHTML = '<div class="skeleton" style="height:360px;margin-top:14px;border-radius:26px"></div>';
  const [qs, st, mine] = await Promise.all([quizQuestions(), contentStats().catch(() => null), myAnswers().catch(() => [])]);
  const answered = new Map(mine.map((a) => [a.question_id, a.is_correct]));
  const lockedCount = state.vip ? 0 : (st?.premium_questions || 0);
  let i = 0;
  const res = [];

  const end = () => {
    const ok = res.filter(Boolean).length;
    const pct = qs.length ? ok / qs.length : 0;
    pane.innerHTML = `<div class="quiz-card"><div class="quiz-inner" style="text-align:center">
      ${mascot(pct >= 0.6 ? 'wave' : 'stand')}
      <div class="score-big comic ${pct >= 0.6 ? 'gold' : 'cyan'}">${ok}/${qs.length}</div>
      <h3 style="font-size:22px;margin:8px 0">${pct === 1 ? 'Score parfait, tu connais Leonida par cœur !' : pct >= 0.6 ? 'Bien joué, vrai fan de GTA 6 !' : 'Pas mal ! Lis les news et retente ta chance.'}</h3>
      <p class="muted">${state.user ? 'Tes bonnes réponses comptent pour le classement (la première réponse à chaque question).' : 'Connecte-toi pour entrer dans le classement.'}</p>
      <div class="row" style="justify-content:center;gap:10px;margin-top:14px">
        <button class="btn" id="again">🔁 Rejouer</button>
        ${state.user ? '<button class="btn cyan" id="lb">🏆 Voir le classement</button>' : '<a class="btn cyan" href="#/connexion?next=jeux">Se connecter</a>'}
      </div>
    </div></div>
    ${lockedCount ? `<div class="paywall" style="margin-top:26px">${vipGate({ title: `+${lockedCount} questions bonus`, text: 'Les membres VICE+ ont accès à toutes les questions et au classement complet.', next: 'jeux' })}</div>` : ''}`;
    if (pct >= 0.6) confetti();
    pane.querySelector('#again').addEventListener('click', () => quiz(pane));
    pane.querySelector('#lb')?.addEventListener('click', () => document.querySelector('.tabs button[data-t="classement"]').click());
  };

  const draw = () => {
    if (i >= qs.length) return end();
    const q = qs[i];
    const prev = answered.get(q.id);
    pane.innerHTML = `<div class="quiz-card"><div class="quiz-inner">
      <div class="quiz-top">
        <span>Question ${i + 1}/${qs.length}${q.is_premium ? ' <span class="badge vip">VICE+</span>' : ''}</span>
        <div class="dots">${qs.map((_, k) => `<i class="${k < i ? (res[k] ? 'ok' : 'ko') : k === i ? 'cur' : ''}"></i>`).join('')}</div>
      </div>
      <div class="quiz-q">${esc(q.question)}</div>
      <div class="choices">${q.choices.map((c, k) => `<button class="choice" data-k="${KEYS[k]}" data-i="${k}" style="--c:${KCOL[k]}">${esc(c)}</button>`).join('')}</div>
      ${prev !== undefined ? '<p class="muted" style="font-size:13px;font-weight:700;margin:12px 0 0">Déjà répondu : ta première réponse compte pour le classement.</p>' : ''}
      <div id="after"></div>
    </div></div>`;
    const btns = pane.querySelectorAll('.choice');
    btns.forEach((b) => b.addEventListener('click', async (ev) => {
      if (pane.dataset.lock) return;
      pane.dataset.lock = '1';
      const pick = Number(b.dataset.i);
      try {
        const r = await answerQuiz(q.id, pick);
        res[i] = r.correct;
        btns.forEach((x, k) => {
          if (k === r.correct_index) x.classList.add('good');
          else if (k === pick) x.classList.add('bad');
          else x.classList.add('dim');
        });
        if (r.correct) confetti(ev.clientX, ev.clientY, 34);
        if (prev === undefined && state.user) answered.set(q.id, r.correct);
        pane.querySelector('#after').innerHTML = `
          <div class="explain">${r.correct ? '✅ Bonne réponse !' : '❌ Raté !'} ${esc(r.explanation || '')}</div>
          <button class="btn block" id="next" style="margin-top:14px">${i + 1 < qs.length ? 'Question suivante →' : 'Voir mon score 🏁'}</button>`;
        pane.querySelector('#next').addEventListener('click', () => { delete pane.dataset.lock; i++; draw(); });
        pane.querySelector('#next').focus({ preventScroll: true });
      } catch (e) {
        delete pane.dataset.lock;
        toast(frError(e), 'err');
      }
    }));
  };
  if (!qs.length) { pane.innerHTML = '<div class="panel empty" style="margin-top:14px"><h3>Le quiz arrive bientôt</h3></div>'; return; }
  draw();
}

async function classement(pane) {
  pane.innerHTML = '<div class="skeleton" style="height:360px;margin-top:14px;border-radius:26px"></div>';
  const rows = await leaderboard();
  pane.innerHTML = `<div class="panel reveal" style="margin-top:14px">
    <h3>🏆 Top 20 des fans</h3>
    ${rows.length ? `<ol class="leader">${rows.map((r) => `<li><span style="font-size:24px">${AVATARS[r.avatar] || '🦩'}</span><span>${esc(r.username)}${r.vip ? ' <span class="badge vip">💎</span>' : ''}</span><span class="pts">${r.score}</span></li>`).join('')}</ol>`
      : '<p class="muted">Personne au classement pour l\'instant : sois le premier !</p>'}
    ${state.user ? '' : '<a class="btn" href="#/connexion?next=jeux" style="margin-top:12px">Se connecter pour participer</a>'}
  </div>`;
  reveal(pane);
}

async function sondages(pane) {
  pane.innerHTML = '<div class="skeleton" style="height:300px;margin-top:14px;border-radius:26px"></div>';
  const list = await polls();
  pane.innerHTML = list.length
    ? list.map((p) => `<div class="panel reveal" style="margin-top:16px">${p.is_premium && !state.vip ? `<div class="q" style="font-weight:800">${esc(p.question)}</div><p class="muted">Sondage réservé aux membres VICE+.</p><a class="btn gold small" href="#/vip">💎 Débloquer</a>` : pollHTML(p)}</div>`).join('')
    : '<div class="panel empty" style="margin-top:14px"><h3>Pas de sondage en cours</h3></div>';
  bindPolls(pane, () => sondages(pane));
  reveal(pane);
}
