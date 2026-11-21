import { esc, toast, busy, md, slugify, readingMinutes, fmtDate, confetti, reveal } from '../ui.js';
import { cover, COVER_STYLES, COVER_LABELS, leonidaMap } from '../art.js';
import { pinsHTML } from './map.js';
import * as api from '../api.js';

const { state, admin } = api;
const TABS = [['', '📊 Tableau de bord'], ['articles', '📰 Articles'], ['carte', '🗺️ Carte'], ['quiz', '🧠 Quiz'], ['sondages', '🗳️ Sondages'], ['reglages', '⚙️ Réglages']];

const toLocalInput = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

export async function adminView(root, { params, go }) {
  if (!state.user) { go('connexion?next=admin'); return; }
  if (!state.staff) {
    root.innerHTML = `<div class="empty panel" style="margin-top:26px"><h3>🔒 Espace réservé à l'équipe</h3><p class="muted">Ton compte n'a pas les droits d'administration.</p><a class="btn" href="#/">Retour</a></div>`;
    return;
  }
  const sub = params[0] || '';
  const [section, id] = sub.split('/');
  const active = section === 'article' ? 'articles' : section;
  root.innerHTML = `
    <h1 class="section-title comic gold" style="margin-top:26px">ESPACE ADMIN</h1>
    <nav class="admin-tabs">${TABS.map(([k, l]) => `<a href="#/admin${k ? '/' + k : ''}" class="${active === k ? 'on' : ''}">${l}</a>`).join('')}</nav>
    <div id="adm"></div>`;
  const box = root.querySelector('#adm');
  if (section === 'article') return editor(box, id === 'new' ? null : id, go);
  const fn = { '': dashboard, articles, carte, quiz, sondages, reglages }[section] || dashboard;
  return fn(box, go);
}

// ---------- Tableau de bord ----------
async function dashboard(box) {
  const s = await admin.stats();
  const tiles = [['👥', s.members, 'membres'], ['💎', s.vip, 'abonnés VICE+'], ['📰', s.articles, 'articles publiés'], ['📝', s.drafts, 'brouillons'], ['👀', s.views, 'vues'], ['📍', s.markers, 'repères'], ['🧠', s.questions, 'questions'], ['🗳️', s.votes, 'votes']];
  box.innerHTML = `
    <div class="stats">${tiles.map(([e, n, l], i) => `<div class="stat reveal" style="--i:${i}"><div style="font-size:26px">${e}</div><div class="n" data-count="${n}">0</div><div class="l">${l}</div></div>`).join('')}</div>
    <div class="row" style="margin-top:22px;gap:12px">
      <a class="btn" href="#/admin/article/new">✍️ Écrire un article</a>
      <a class="btn cyan" href="#/admin/carte">📍 Ajouter un repère</a>
      <a class="btn violet" href="#/admin/quiz">🧠 Ajouter une question</a>
    </div>
    <div class="panel" style="margin-top:22px"><h3>💡 Astuces</h3>
      <p style="margin:0;line-height:1.6">Un article <b>VICE+</b> n'affiche que son chapeau aux non-abonnés. Mets une date « gratuit le » pour l'ouvrir à tous plus tard. Coche <b>À la une</b> pour l'afficher en grand sur l'accueil et <b>Breaking</b> pour le macaron rouge. Les liens YouTube collés seuls sur une ligne deviennent des vidéos.</p></div>`;
  reveal(box);
}

// ---------- Liste des articles ----------
async function articles(box) {
  const list = await admin.articles();
  box.innerHTML = `
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:14px">
      <input class="field" id="flt" placeholder="Filtrer…" style="max-width:320px;padding:11px 14px;border:3px solid #1a0b2e;border-radius:14px;margin:0">
      <a class="btn" href="#/admin/article/new" style="flex:0 0 auto">✍️ Nouvel article</a>
    </div>
    <div class="panel" style="overflow-x:auto"><table class="table"><thead><tr><th>Titre</th><th>Statut</th><th>Date</th><th>Vues</th><th></th></tr></thead><tbody>
      ${list.map((a) => `<tr data-t="${esc((a.title + ' ' + a.slug).toLowerCase())}">
        <td><b>${esc(a.title)}</b><br><span class="muted" style="font-size:12px">${esc(api.category(a.category)?.name || '—')}${a.is_premium ? ' · <span class="badge vip">VICE+</span>' : ''}${a.is_featured ? ' · ⭐ Une' : ''}${a.is_breaking ? ' · 🚨' : ''}</span></td>
        <td><span class="badge ${a.status === 'published' ? 'pub' : 'draft'}">${a.status === 'published' ? 'Publié' : 'Brouillon'}</span></td>
        <td style="white-space:nowrap">${fmtDate(a.published_at || a.updated_at)}</td>
        <td>${a.views}</td>
        <td><div class="actions"><a class="btn cream small" href="#/a/${esc(a.slug)}">Voir</a><a class="btn cyan small" href="#/admin/article/${a.id}">Modifier</a></div></td>
      </tr>`).join('')}
    </tbody></table>${list.length ? '' : '<p class="muted">Aucun article.</p>'}</div>`;
  box.querySelector('#flt').addEventListener('input', (e) => {
    const v = e.target.value.toLowerCase();
    box.querySelectorAll('tbody tr').forEach((tr) => { tr.style.display = tr.dataset.t.includes(v) ? '' : 'none'; });
  });
}

// ---------- Éditeur d'article ----------
async function editor(box, id, go) {
  const a = id ? await admin.article(id) : {
    title: '', slug: '', excerpt: '', category: state.categories[0]?.slug || null, cover_url: null, cover_style: 'sunset',
    is_premium: false, free_at: null, is_featured: false, is_breaking: false, status: 'draft', published_at: null, tags: [], body: '',
  };
  if (!a) { box.innerHTML = '<div class="panel">Article introuvable.</div>'; return; }
  let slugTouched = !!id;
  let coverMode = a.cover_url ? 'image' : 'art';

  box.innerHTML = `
    <form id="ef" class="panel">
      <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:10px">
        <h3 style="margin:0">${id ? '✏️ Modifier l\'article' : '✍️ Nouvel article'}</h3>
        ${id ? `<a class="btn cream small" href="#/a/${esc(a.slug)}" style="flex:0 0 auto">👀 Voir</a>` : ''}
      </div>
      <div class="field"><label for="t">Titre</label><input id="t" required maxlength="160" value="${esc(a.title)}" placeholder="Un titre qui donne envie de cliquer"></div>
      <div class="row">
        <div class="field"><label for="sl">Lien (slug)</label><input id="sl" required value="${esc(a.slug)}" pattern="[a-z0-9]+(-[a-z0-9]+)*"><span class="hint">#/a/<b id="slp">${esc(a.slug)}</b></span></div>
        <div class="field"><label for="cat">Rubrique</label><select id="cat">${state.categories.map((c) => `<option value="${esc(c.slug)}" ${c.slug === a.category ? 'selected' : ''}>${c.emoji} ${esc(c.name)}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label for="ex">Chapeau (visible par tous)</label><textarea id="ex" maxlength="260" style="min-height:80px">${esc(a.excerpt)}</textarea><span class="hint" id="exn"></span></div>

      <div class="field"><label>Couverture</label>
        <div class="tabs" style="background:#efe4ff;border-color:#1a0b2e;margin-bottom:10px">
          <button type="button" data-m="art" style="color:#1a0b2e">🎨 Illustration</button><button type="button" data-m="image" style="color:#1a0b2e">🖼️ Image</button>
        </div>
        <div id="cv-art" class="style-grid">${COVER_STYLES.map((s) => `<button type="button" data-s="${s}" class="${a.cover_style === s ? 'on' : ''}">${cover(s, 'admin')}<span>${COVER_LABELS[s]}</span></button>`).join('')}</div>
        <div id="cv-img">
          <div class="row" style="align-items:flex-end">
            <div class="field" style="margin:0"><label for="cu">Adresse de l'image</label><input id="cu" type="url" value="${esc(a.cover_url || '')}" placeholder="https://…"></div>
            <label class="btn cyan" style="flex:0 0 auto">⬆️ Envoyer<input type="file" id="cf" accept="image/png,image/jpeg,image/webp,image/gif" hidden></label>
          </div>
          <span class="hint">5 Mo max. Utilise uniquement des images dont tu as les droits.</span>
          <img id="cimg" style="margin-top:10px;border:3px solid #1a0b2e;border-radius:14px;max-height:220px;${a.cover_url ? '' : 'display:none'}" src="${esc(a.cover_url || '')}" alt="">
        </div>
      </div>

      <div class="field"><label for="b">Texte de l'article</label>
        <div class="editor-toolbar">
          <button type="button" data-ins="## ">Titre</button><button type="button" data-wrap="**">Gras</button><button type="button" data-wrap="*">Italique</button>
          <button type="button" data-ins="- ">Liste</button><button type="button" data-ins="1. ">Liste 1-2-3</button><button type="button" data-ins="> ">Citation</button>
          <button type="button" data-link="1">Lien</button><button type="button" data-ins="https://www.youtube.com/watch?v=">YouTube</button><button type="button" data-ins="---">Séparateur</button>
          <button type="button" id="pv" style="margin-left:auto;background:#ffd23f">👁️ Aperçu</button>
        </div>
        <textarea id="b" style="min-height:340px;font-family:ui-monospace,Menlo,monospace;font-size:15px">${esc(a.body)}</textarea>
        <div id="prev" class="prose preview-box" style="display:none"></div>
        <span class="hint" id="bn"></span>
      </div>

      <div class="row">
        <div>
          <label class="switch"><input type="checkbox" id="pr" ${a.is_premium ? 'checked' : ''}> 💎 Réservé VICE+</label>
          <div class="field" id="fa-wrap" style="margin-top:6px;${a.is_premium ? '' : 'display:none'}"><label for="fa">Gratuit pour tous à partir du (optionnel)</label><input id="fa" type="datetime-local" value="${toLocalInput(a.free_at)}"></div>
          <label class="switch"><input type="checkbox" id="fe" ${a.is_featured ? 'checked' : ''}> ⭐ À la une</label>
          <label class="switch"><input type="checkbox" id="br" ${a.is_breaking ? 'checked' : ''}> 🚨 Breaking news</label>
        </div>
        <div>
          <div class="field"><label for="st">Statut</label><select id="st"><option value="draft" ${a.status === 'draft' ? 'selected' : ''}>📝 Brouillon</option><option value="published" ${a.status === 'published' ? 'selected' : ''}>✅ Publié</option></select></div>
          <div class="field"><label for="pa">Date de publication</label><input id="pa" type="datetime-local" value="${toLocalInput(a.published_at)}"><span class="hint">Vide = maintenant. Une date future programme l'article.</span></div>
          <div class="field"><label for="tg">Mots-clés (séparés par des virgules)</label><input id="tg" value="${esc((a.tags || []).join(', '))}"></div>
        </div>
      </div>
      <div class="row" style="margin-top:8px">
        <button class="btn" type="submit">💾 Enregistrer</button>
        ${id ? '<button class="btn danger" type="button" id="del" style="flex:0 0 auto">🗑️ Supprimer</button>' : ''}
      </div>
    </form>`;

  const f = box.querySelector('#ef');
  const $ = (s) => f.querySelector(s);
  const setMode = (m) => {
    coverMode = m;
    f.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
    $('#cv-art').style.display = m === 'art' ? '' : 'none';
    $('#cv-img').style.display = m === 'image' ? '' : 'none';
  };
  setMode(coverMode);
  f.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.m)));
  let style = a.cover_style;
  $('#cv-art').addEventListener('click', (e) => {
    const b = e.target.closest('[data-s]');
    if (!b) return;
    style = b.dataset.s;
    $('#cv-art').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  });
  $('#t').addEventListener('input', () => { if (!slugTouched) { $('#sl').value = slugify($('#t').value); $('#slp').textContent = $('#sl').value; } });
  $('#sl').addEventListener('input', () => { slugTouched = true; $('#sl').value = slugify($('#sl').value); $('#slp').textContent = $('#sl').value; });
  const counts = () => {
    $('#exn').textContent = `${$('#ex').value.length}/260 caractères`;
    $('#bn').textContent = `${$('#b').value.split(/\s+/).filter(Boolean).length} mots · ≈ ${readingMinutes($('#b').value)} min de lecture`;
  };
  ['#ex', '#b'].forEach((s) => $(s).addEventListener('input', counts));
  counts();
  $('#pr').addEventListener('change', () => { $('#fa-wrap').style.display = $('#pr').checked ? '' : 'none'; });
  $('#cu').addEventListener('input', () => { const i = $('#cimg'); i.src = $('#cu').value; i.style.display = $('#cu').value ? '' : 'none'; });
  $('#cf').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Image trop lourde (5 Mo max)', 'err'); return; }
    try {
      toast('Envoi de l\'image…');
      const url = await admin.uploadCover(file, $('#sl').value || 'cover');
      $('#cu').value = url;
      $('#cimg').src = url;
      $('#cimg').style.display = '';
      toast('Image envoyée', 'ok');
    } catch (err) { toast(api.frError(err), 'err'); }
  });
  const ta = $('#b');
  const insertAt = (before, after = '') => {
    const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
    const sel = v.slice(s, en);
    ta.value = v.slice(0, s) + before + sel + after + v.slice(en);
    ta.focus();
    ta.selectionStart = s + before.length;
    ta.selectionEnd = s + before.length + sel.length;
    counts();
  };
  f.querySelector('.editor-toolbar').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.id === 'pv') return;
    if (b.dataset.wrap) insertAt(b.dataset.wrap, b.dataset.wrap);
    else if (b.dataset.link) { const u = prompt('Adresse du lien (https://…)'); if (u) insertAt('[', `](${u})`); }
    else {
      const s = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
      ta.selectionStart = ta.selectionEnd = lineStart;
      insertAt(b.dataset.ins.startsWith('http') || b.dataset.ins === '---' ? '\n' + b.dataset.ins + (b.dataset.ins === '---' ? '\n' : '') : b.dataset.ins);
    }
  });
  let previewing = false;
  $('#pv').addEventListener('click', () => {
    previewing = !previewing;
    $('#prev').innerHTML = md(ta.value);
    $('#prev').style.display = previewing ? '' : 'none';
    ta.style.display = previewing ? 'none' : '';
    $('#pv').textContent = previewing ? '✏️ Éditer' : '👁️ Aperçu';
  });

  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#t').value.trim();
    const slug = slugify($('#sl').value || title);
    if (!title) return toast('Ajoute un titre', 'err');
    if (!slug) return toast('Le lien (slug) est vide', 'err');
    const status = $('#st').value;
    const row = {
      id: id || undefined, title, slug, category: $('#cat').value || null, excerpt: $('#ex').value.trim(),
      cover_style: style, cover_url: coverMode === 'image' && $('#cu').value.trim() ? $('#cu').value.trim() : null,
      is_premium: $('#pr').checked, free_at: $('#pr').checked ? fromLocalInput($('#fa').value) : null,
      is_featured: $('#fe').checked, is_breaking: $('#br').checked, status,
      published_at: fromLocalInput($('#pa').value) || (status === 'published' ? (a.published_at || new Date().toISOString()) : null),
      reading_minutes: Math.min(120, readingMinutes(ta.value)),
      tags: $('#tg').value.split(',').map((x) => slugify(x)).filter(Boolean).slice(0, 10),
    };
    busy(e.submitter || f.querySelector('[type=submit]'), async () => {
      try {
        const newId = await admin.saveArticle(row, ta.value);
        if (status === 'published' && a.status !== 'published') confetti();
        toast(status === 'published' ? 'Article publié 🚀' : 'Brouillon enregistré', 'ok');
        if (!id) go(`admin/article/${newId}`);
        else { a.status = status; a.slug = slug; }
      } catch (err) { toast(api.frError(err), 'err'); }
    });
  });
  $('#del')?.addEventListener('click', async () => {
    if (!confirm('Supprimer définitivement cet article ? Cette action est irréversible.')) return;
    try { await admin.deleteArticle(id); toast('Article supprimé', 'ok'); go('admin/articles'); }
    catch (err) { toast(api.frError(err), 'err'); }
  });
}

// ---------- Carte ----------
async function carte(box) {
  const { cats, markers } = await api.mapData();
  let edit = null;
  const draw = () => {
    box.innerHTML = `
      <div class="row admin-map" style="align-items:flex-start;gap:18px">
        <div style="flex:1.2;min-width:280px">
          <div class="map-shell" id="am" style="aspect-ratio:1"><div class="map-stage">${leonidaMap()}<div class="pins">${pinsHTML(markers, cats)}</div></div><div class="ghost-pin" id="gp" style="display:none"></div></div>
          <p class="muted" style="font-weight:700">Clique sur la carte pour placer le repère, ou sur un repère pour le modifier.</p>
        </div>
        <form id="mf" class="panel" style="flex:1;min-width:280px">
          <h3>${edit?.id ? '✏️ Modifier le repère' : '📍 Nouveau repère'}</h3>
          <div class="field"><label for="mt">Nom</label><input id="mt" required value="${esc(edit?.title || '')}"></div>
          <div class="field"><label for="md">Description</label><textarea id="md" style="min-height:90px">${esc(edit?.description || '')}</textarea></div>
          <div class="row">
            <div class="field"><label for="mc">Type</label><select id="mc">${cats.map((c) => `<option value="${c.slug}" ${edit?.category === c.slug ? 'selected' : ''}>${c.emoji} ${esc(c.name)}</option>`).join('')}</select></div>
            <div class="field"><label for="mr">Région</label><input id="mr" value="${esc(edit?.region || '')}" list="regions"><datalist id="regions">${['Vice City', 'Leonida Keys', 'Grassrivers', 'Port Gellhorn', 'Ambrosia', 'Mount Kalaga'].map((r) => `<option value="${r}">`).join('')}</datalist></div>
          </div>
          <div class="row"><div class="field"><label for="mx">X (%)</label><input id="mx" type="number" min="0" max="100" step="0.1" required value="${edit?.x ?? ''}"></div><div class="field"><label for="my">Y (%)</label><input id="my" type="number" min="0" max="100" step="0.1" required value="${edit?.y ?? ''}"></div></div>
          <label class="switch"><input type="checkbox" id="mp" ${edit ? (edit.is_premium ? 'checked' : '') : 'checked'}> 💎 Réservé VICE+</label>
          <div class="row" style="margin-top:12px"><button class="btn">💾 Enregistrer</button>${edit?.id ? '<button type="button" class="btn danger" id="mdel" style="flex:0 0 auto">🗑️</button><button type="button" class="btn cream" id="mnew" style="flex:0 0 auto">＋ Nouveau</button>' : ''}</div>
        </form>
      </div>`;
    const shell = box.querySelector('#am');
    const gp = box.querySelector('#gp');
    const place = (x, y) => { gp.style.display = ''; gp.style.left = x + '%'; gp.style.top = y + '%'; box.querySelector('#mx').value = x; box.querySelector('#my').value = y; };
    if (edit?.x != null) place(edit.x, edit.y);
    shell.addEventListener('click', (e) => {
      const pin = e.target.closest('.pin');
      if (pin) { edit = { ...markers.find((m) => m.id === pin.dataset.id) }; draw(); return; }
      const r = shell.getBoundingClientRect();
      place(+(((e.clientX - r.left) / r.width) * 100).toFixed(1), +(((e.clientY - r.top) / r.height) * 100).toFixed(1));
    });
    box.querySelector('#mf').addEventListener('submit', (e) => {
      e.preventDefault();
      const m = {
        id: edit?.id, title: box.querySelector('#mt').value.trim(), description: box.querySelector('#md').value.trim(),
        category: box.querySelector('#mc').value, region: box.querySelector('#mr').value.trim() || null,
        x: Number(box.querySelector('#mx').value), y: Number(box.querySelector('#my').value), is_premium: box.querySelector('#mp').checked,
      };
      if (!m.title || Number.isNaN(m.x) || Number.isNaN(m.y) || box.querySelector('#mx').value === '') { toast('Nom et position obligatoires', 'err'); return; }
      busy(e.submitter, async () => {
        try { await admin.saveMarker(m); toast('Repère enregistré', 'ok'); carte(box); }
        catch (err) { toast(api.frError(err), 'err'); }
      });
    });
    box.querySelector('#mdel')?.addEventListener('click', async () => {
      if (!confirm('Supprimer ce repère ?')) return;
      try { await admin.deleteMarker(edit.id); toast('Repère supprimé', 'ok'); carte(box); } catch (err) { toast(api.frError(err), 'err'); }
    });
    box.querySelector('#mnew')?.addEventListener('click', () => { edit = null; draw(); });
  };
  draw();
}

// ---------- Quiz ----------
async function quiz(box) {
  const list = await admin.questions();
  let edit = null;
  const draw = () => {
    const q = edit || { question: '', choices: ['', '', '', ''], correct_index: 0, explanation: '', is_premium: false, is_active: true, sort: (list.at(-1)?.sort || 0) + 1 };
    const ch = [...q.choices, '', '', '', ''].slice(0, 4);
    box.innerHTML = `
      <form id="qf" class="panel">
        <h3>${edit ? '✏️ Modifier la question' : '🧠 Nouvelle question'}</h3>
        <div class="field"><label for="qq">Question</label><input id="qq" required value="${esc(q.question)}"></div>
        <div class="row">${ch.map((c, i) => `<div class="field"><label class="switch" style="margin:0"><input type="radio" name="ok" value="${i}" ${q.correct_index === i ? 'checked' : ''}> Réponse ${'ABCD'[i]} ${i < 2 ? '' : '(optionnelle)'}</label><input data-c="${i}" value="${esc(c)}" ${i < 2 ? 'required' : ''}></div>`).join('')}</div>
        <span class="hint">Coche la bonne réponse.</span>
        <div class="field" style="margin-top:10px"><label for="qe">Explication affichée après la réponse</label><input id="qe" value="${esc(q.explanation)}"></div>
        <div class="row"><label class="switch"><input type="checkbox" id="qp" ${q.is_premium ? 'checked' : ''}> 💎 Question VICE+</label><label class="switch"><input type="checkbox" id="qa" ${q.is_active ? 'checked' : ''}> ✅ Active</label><div class="field" style="margin:0;max-width:120px"><label for="qs">Ordre</label><input id="qs" type="number" value="${q.sort}"></div></div>
        <div class="row" style="margin-top:10px"><button class="btn">💾 Enregistrer</button>${edit ? '<button type="button" class="btn cream" id="qn" style="flex:0 0 auto">Annuler</button>' : ''}</div>
      </form>
      <div class="panel" style="margin-top:18px;overflow-x:auto"><table class="table"><thead><tr><th>#</th><th>Question</th><th>Bonne réponse</th><th>Accès</th><th></th></tr></thead><tbody>
        ${list.map((x) => `<tr><td>${x.sort}</td><td>${esc(x.question)}${x.is_active ? '' : ' <span class="badge draft">inactive</span>'}</td><td>${esc(x.choices[x.correct_index] || '')}</td><td>${x.is_premium ? '<span class="badge vip">VICE+</span>' : '<span class="badge">Gratuit</span>'}</td>
          <td><div class="actions"><button class="btn cyan small" data-e="${x.id}">Modifier</button><button class="btn danger small" data-d="${x.id}">🗑️</button></div></td></tr>`).join('')}
      </tbody></table></div>`;
    box.querySelector('#qf').addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = [...box.querySelectorAll('[data-c]')].map((i) => i.value.trim());
      const okRaw = Number(box.querySelector('input[name=ok]:checked')?.value ?? 0);
      if (!raw[okRaw]) { toast('La bonne réponse cochée est vide', 'err'); return; }
      const keep = raw.map((v, i) => [v, i]).filter(([v]) => v);
      if (keep.length < 2) { toast('Il faut au moins 2 réponses', 'err'); return; }
      const row = {
        id: edit?.id, question: box.querySelector('#qq').value.trim(), choices: keep.map(([v]) => v),
        correct_index: keep.findIndex(([, i]) => i === okRaw), explanation: box.querySelector('#qe').value.trim(),
        is_premium: box.querySelector('#qp').checked, is_active: box.querySelector('#qa').checked, sort: Number(box.querySelector('#qs').value) || 0,
      };
      busy(e.submitter, async () => {
        try { await admin.saveQuestion(row); toast('Question enregistrée', 'ok'); quiz(box); } catch (err) { toast(api.frError(err), 'err'); }
      });
    });
    box.querySelector('#qn')?.addEventListener('click', () => { edit = null; draw(); });
    box.querySelectorAll('[data-e]').forEach((b) => b.addEventListener('click', () => { edit = list.find((x) => x.id === b.dataset.e); draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
    box.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Supprimer cette question ?')) return;
      try { await admin.deleteQuestion(b.dataset.d); toast('Question supprimée', 'ok'); quiz(box); } catch (err) { toast(api.frError(err), 'err'); }
    }));
  };
  draw();
}

// ---------- Sondages ----------
async function sondages(box) {
  const list = await admin.polls();
  box.innerHTML = `
    <form id="pf" class="panel">
      <h3>🗳️ Nouveau sondage</h3>
      <div class="field"><label for="pq">Question</label><input id="pq" required></div>
      <div class="field"><label for="po">Réponses (une par ligne, 2 à 6)</label><textarea id="po" style="min-height:110px" placeholder="Lucia&#10;Jason"></textarea></div>
      <label class="switch"><input type="checkbox" id="pp"> 💎 Réservé VICE+</label>
      <button class="btn" style="margin-top:10px">➕ Créer</button>
    </form>
    <div class="panel" style="margin-top:18px;overflow-x:auto"><table class="table"><thead><tr><th>Question</th><th>Réponses</th><th>Actif</th><th></th></tr></thead><tbody>
      ${list.map((p) => `<tr><td><b>${esc(p.question)}</b>${p.is_premium ? ' <span class="badge vip">VICE+</span>' : ''}</td><td style="font-size:13px">${p.options.map(esc).join(' · ')}</td>
        <td><label class="switch"><input type="checkbox" data-t="${p.id}" ${p.is_active ? 'checked' : ''}></label></td>
        <td><div class="actions"><button class="btn danger small" data-d="${p.id}">🗑️</button></div></td></tr>`).join('')}
    </tbody></table></div>`;
  box.querySelector('#pf').addEventListener('submit', (e) => {
    e.preventDefault();
    const options = box.querySelector('#po').value.split('\n').map((x) => x.trim()).filter(Boolean);
    if (options.length < 2 || options.length > 6) { toast('Entre 2 et 6 réponses', 'err'); return; }
    busy(e.submitter, async () => {
      try { await admin.savePoll({ question: box.querySelector('#pq').value.trim(), options, is_premium: box.querySelector('#pp').checked, is_active: true }); toast('Sondage créé', 'ok'); sondages(box); }
      catch (err) { toast(api.frError(err), 'err'); }
    });
  });
  box.querySelectorAll('[data-t]').forEach((c) => c.addEventListener('change', async () => {
    try { await admin.savePoll({ id: c.dataset.t, is_active: c.checked }); toast(c.checked ? 'Sondage activé' : 'Sondage masqué', 'ok'); }
    catch (err) { c.checked = !c.checked; toast(api.frError(err), 'err'); }
  }));
  box.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Supprimer ce sondage et ses votes ?')) return;
    try { await admin.deletePoll(b.dataset.d); toast('Sondage supprimé', 'ok'); sondages(box); } catch (err) { toast(api.frError(err), 'err'); }
  }));
}

// ---------- Réglages ----------
async function reglages(box) {
  if (!state.admin) { box.innerHTML = '<div class="panel">Seuls les administrateurs peuvent modifier les réglages.</div>'; return; }
  const S = state.settings;
  const pm = S.price_monthly || { amount: 299, currency: 'eur', label: '2,99 €' };
  const py = S.price_yearly || { amount: 2499, currency: 'eur', label: '24,99 €' };
  const stats = (Array.isArray(S.stats) && S.stats.length ? S.stats : [
    { value: 99, suffix: '', label: 'sur Metacritic' }, { value: 32.5, dec: 1, suffix: ' M', label: 'précommandes' },
    { value: 3.79, dec: 2, suffix: ' Md$', label: 'le 1er jour' }, { value: 8, suffix: '', label: 'nominations GOTY' },
  ]);
  const so = S.socials || {};
  const L = S.legal || {};
  const eur = (c) => (c / 100).toFixed(2).replace('.', ',');
  box.innerHTML = `
    <form id="sf">
      <div class="panel"><h3>📣 Bandeau « Flash »</h3><div class="field"><label for="tk">Une info par ligne</label><textarea id="tk">${esc((S.ticker || []).join('\n'))}</textarea></div></div>
      <div class="panel" style="margin-top:18px"><h3>💶 Prix VICE+</h3>
        <div class="row"><div class="field"><label for="pm">Mensuel (€)</label><input id="pm" type="number" step="0.01" min="0.5" value="${eur(pm.amount).replace(',', '.')}"></div><div class="field"><label for="py">Annuel (€)</label><input id="py" type="number" step="0.01" min="0.5" value="${eur(py.amount).replace(',', '.')}"></div></div>
        <span class="hint">Ces prix sont affichés dans l'appli ET utilisés pour le paiement Stripe. Les abonnés existants gardent leur prix.</span></div>
      <div class="panel" style="margin-top:18px"><h3>🔢 Chiffres de l'accueil</h3>
        ${stats.map((s, i) => `<div class="row" data-st="${i}"><div class="field"><label>Valeur</label><input data-k="value" type="number" step="any" value="${s.value}"></div><div class="field"><label>Suffixe</label><input data-k="suffix" value="${esc(s.suffix || '')}"></div><div class="field"><label>Libellé</label><input data-k="label" value="${esc(s.label)}"></div><div class="field" style="max-width:100px"><label>Décimales</label><input data-k="dec" type="number" min="0" max="3" value="${s.dec || 0}"></div></div>`).join('')}</div>
      <div class="panel" style="margin-top:18px"><h3>📱 Réseaux sociaux</h3><div class="row"><div class="field"><label for="tt">Lien TikTok</label><input id="tt" type="url" value="${esc(so.tiktok || '')}" placeholder="https://www.tiktok.com/@…"></div><div class="field"><label for="ig">Lien Instagram</label><input id="ig" type="url" value="${esc(so.instagram || '')}" placeholder="https://www.instagram.com/…"></div></div></div>
      <div class="panel" style="margin-top:18px"><h3>⚖️ Informations légales (obligatoires pour vendre)</h3>
        <div class="field"><label for="lo">Éditeur : nom ou raison sociale, statut, adresse, SIRET</label><textarea id="lo" style="min-height:80px">${esc(L.owner || '')}</textarea></div>
        <div class="row"><div class="field"><label for="le">E-mail de contact</label><input id="le" type="email" value="${esc(L.email || '')}"></div><div class="field"><label for="lm">Médiateur de la consommation</label><input id="lm" value="${esc(L.mediator || '')}"></div></div></div>
      <button class="btn" style="margin-top:18px">💾 Enregistrer les réglages</button>
    </form>`;
  box.querySelector('#sf').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (s) => box.querySelector(s).value.trim();
    const cents = (v) => Math.round(parseFloat(String(v).replace(',', '.')) * 100);
    const m = cents(q('#pm')), y = cents(q('#py'));
    if (!(m >= 50) || !(y >= 50)) { toast('Prix invalide (minimum 0,50 €)', 'err'); return; }
    const newStats = [...box.querySelectorAll('[data-st]')].map((row) => {
      const g = (k) => row.querySelector(`[data-k=${k}]`).value;
      return { value: Number(g('value')) || 0, suffix: g('suffix'), label: g('label'), dec: Number(g('dec')) || 0 };
    });
    busy(e.submitter, async () => {
      try {
        await admin.saveSetting('ticker', q('#tk').split('\n').map((x) => x.trim()).filter(Boolean));
        await admin.saveSetting('price_monthly', { amount: m, currency: 'eur', label: `${eur(m)} €` });
        await admin.saveSetting('price_yearly', { amount: y, currency: 'eur', label: `${eur(y)} €` });
        await admin.saveSetting('stats', newStats);
        await admin.saveSetting('socials', { tiktok: q('#tt'), instagram: q('#ig') });
        await admin.saveSetting('legal', { owner: q('#lo'), email: q('#le'), mediator: q('#lm') });
        toast('Réglages enregistrés', 'ok');
      } catch (err) { toast(api.frError(err), 'err'); }
    });
  });
}
