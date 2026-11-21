import { esc, sheet, toast, confetti, icons, reveal } from '../ui.js';
import { leonidaMap } from '../art.js';
import { footer, priceLabel } from '../components.js';
import { state, mapData, setFound, contentStats, frError } from '../api.js';

export function pinsHTML(markers, cats, found = new Set()) {
  return markers.map((m, i) => {
    const c = cats.find((x) => x.slug === m.category) || { color: '#ff2e88', emoji: '📍' };
    return `<div class="pin-wrap" style="left:${m.x}%;top:${m.y}%">
      <button class="pin${found.has(m.id) ? ' found' : ''}" data-id="${m.id}" style="--c:${esc(c.color)};--i:${i}" aria-label="${esc(m.title)}">${c.emoji}<span class="pulse"></span></button>
    </div>`;
  }).join('');
}

export async function mapView(root) {
  root.innerHTML = `
    <h1 class="section-title comic cyan" style="margin-top:26px">CARTE DE LEONIDA <span class="tag">ILLUSTRÉE</span></h1>
    <p class="muted" style="margin:-6px 0 8px;font-weight:600">Pince ou utilise + / − pour zoomer, glisse pour te déplacer, touche un repère pour les détails. Positions approximatives.</p>
    <div class="chips" id="mchips"></div>
    <div class="map-shell" id="shell">
      <div class="map-stage" id="stage">${leonidaMap()}<div class="pins" id="pins"></div></div>
      <div class="map-tools">
        <button class="icon-btn" id="zin" aria-label="Zoomer">${icons.plus}</button>
        <button class="icon-btn" id="zout" aria-label="Dézoomer">${icons.minus}</button>
        <button class="icon-btn" id="zreset" aria-label="Recentrer">${icons.target}</button>
      </div>
    </div>
    <div id="mstatus"></div>
    ${footer()}`;

  const shell = root.querySelector('#shell');
  const stage = root.querySelector('#stage');
  const pinsBox = root.querySelector('#pins');

  // ----- Zoom & déplacement -----
  let s = 1, tx = 0, ty = 0, suppress = false;
  const apply = () => {
    stage.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    stage.style.setProperty('--inv', (1 / Math.sqrt(s)).toFixed(3));
    shell.style.touchAction = s > 1.01 ? 'none' : 'pan-y';
  };
  const clamp = () => {
    const W = shell.clientWidth, H = shell.clientHeight;
    tx = Math.min(0, Math.max(W - W * s, tx));
    ty = Math.min(0, Math.max(H - H * s, ty));
  };
  const zoomAt = (f, cx = shell.clientWidth / 2, cy = shell.clientHeight / 2) => {
    const ns = Math.min(4, Math.max(1, s * f));
    const k = ns / s;
    tx = cx - (cx - tx) * k;
    ty = cy - (cy - ty) * k;
    s = ns;
    clamp();
    stage.style.transition = 'transform .25s ease-out';
    apply();
    setTimeout(() => { stage.style.transition = ''; }, 260);
  };
  apply();
  const pts = new Map();
  let start = null;
  const onDown = (e) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    start = { tx, ty, s, moved: false, pts: new Map(pts) };
  };
  const onMove = (e) => {
    if (!pts.has(e.pointerId) || !start) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = shell.getBoundingClientRect();
    if (pts.size === 1 && start.pts.size === 1) {
      const p0 = [...start.pts.values()][0], p = [...pts.values()][0];
      const dx = p.x - p0.x, dy = p.y - p0.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) start.moved = true;
      if (s > 1.01) { tx = start.tx + dx; ty = start.ty + dy; clamp(); apply(); }
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const [a0, b0] = start.pts.size === 2 ? [...start.pts.values()] : [a, b];
      if (start.pts.size !== 2) { start = { tx, ty, s, moved: true, pts: new Map(pts) }; return; }
      const d0 = Math.hypot(a0.x - b0.x, a0.y - b0.y), d = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2 - r.left, cy = (a.y + b.y) / 2 - r.top;
      const ns = Math.min(4, Math.max(1, start.s * (d / d0)));
      const k = ns / start.s;
      tx = cx - (cx - start.tx) * k; ty = cy - (cy - start.ty) * k; s = ns;
      start.moved = true;
      clamp(); apply();
    }
  };
  const onUp = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (start?.moved) { suppress = true; setTimeout(() => { suppress = false; }, 60); }
    start = pts.size ? { tx, ty, s, moved: true, pts: new Map(pts) } : null;
  };
  const onWheel = (e) => {
    e.preventDefault();
    const r = shell.getBoundingClientRect();
    zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - r.left, e.clientY - r.top);
  };
  shell.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  shell.addEventListener('wheel', onWheel, { passive: false });
  shell.addEventListener('dblclick', (e) => { const r = shell.getBoundingClientRect(); zoomAt(1.8, e.clientX - r.left, e.clientY - r.top); });
  root.querySelector('#zin').addEventListener('click', () => zoomAt(1.4));
  root.querySelector('#zout').addEventListener('click', () => zoomAt(1 / 1.4));
  root.querySelector('#zreset').addEventListener('click', () => { s = 1; tx = 0; ty = 0; stage.style.transition = 'transform .35s ease'; apply(); });
  const onResize = () => { clamp(); apply(); };
  window.addEventListener('resize', onResize);
  ['pointerdown', 'dblclick', 'wheel'].forEach((ev) => root.querySelector('.map-tools').addEventListener(ev, (e) => e.stopPropagation()));

  // ----- Données -----
  const [{ cats, markers, found }, st] = await Promise.all([mapData(), contentStats().catch(() => null)]);
  let filter = '';
  const chips = root.querySelector('#mchips');
  chips.innerHTML = `<button class="chip on" data-c="">🌴 Tout</button>` +
    cats.map((c) => `<button class="chip" data-c="${esc(c.slug)}" style="--c:${esc(c.color)}">${c.emoji} ${esc(c.name)}</button>`).join('');
  const paintPins = () => {
    const list = markers.filter((m) => !filter || m.category === filter);
    pinsBox.innerHTML = pinsHTML(list, cats, found);
  };
  const paintStatus = () => {
    const box = root.querySelector('#mstatus');
    if (state.vip) {
      const n = markers.filter((m) => found.has(m.id)).length;
      const pct = markers.length ? Math.round((n / markers.length) * 100) : 0;
      box.innerHTML = `<div class="map-progress"><span>🏆 ${n}/${markers.length} repérés</span><div class="pbar"><i style="width:0" data-w="${pct}"></i></div><span>${pct}%</span></div>`;
      requestAnimationFrame(() => { const i = box.querySelector(".pbar i"); if (i) i.style.width = i.dataset.w + '%'; });
    } else {
      const hidden = st?.secret_markers || 0;
      box.innerHTML = `<div class="panel dark reveal" style="margin-top:18px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <div style="font-size:44px">🔐</div>
        <div style="flex:1;min-width:200px"><h3 style="margin:0 0 4px">${hidden} lieu${hidden > 1 ? 'x' : ''} secret${hidden > 1 ? 's' : ''} caché${hidden > 1 ? 's' : ''} sur cette carte</h3>
        <p class="muted" style="margin:0">Débloque les easter eggs, les lieux exclusifs et le suivi de ta progression avec VICE+.</p></div>
        <a class="btn gold shine" href="#/vip">💎 ${esc(priceLabel())}/mois</a></div>`;
      reveal(box);
    }
  };
  paintPins();
  paintStatus();
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    filter = b.dataset.c;
    chips.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
    paintPins();
  });

  pinsBox.addEventListener('click', (e) => {
    const pin = e.target.closest('.pin');
    if (!pin || suppress) return;
    const m = markers.find((x) => x.id === pin.dataset.id);
    const c = cats.find((x) => x.slug === m.category) || { name: 'Lieu', color: '#ff2e88', emoji: '📍' };
    pinsBox.querySelectorAll('.pin.sel').forEach((p) => p.classList.remove('sel'));
    pin.classList.add('sel');
    const isFound = found.has(m.id);
    const { el, close } = sheet(`
      <span class="sticker" style="position:static;display:inline-block;--c:${esc(c.color)}">${c.emoji} ${esc(c.name)}</span>
      ${m.is_premium ? '<span class="lock-badge open" style="position:static;display:inline-block;margin-left:6px">💎 VICE+</span>' : ''}
      <h3 style="margin-top:12px">${esc(m.title)}</h3>
      ${m.region ? `<div style="font-weight:800;color:#7b2ff7;margin-bottom:8px">📍 ${esc(m.region)}</div>` : ''}
      <p style="line-height:1.6;font-size:16px">${esc(m.description)}</p>
      ${state.vip
        ? `<button class="btn ${isFound ? 'cream' : ''} block" id="fbtn">${isFound ? '↩️ Retirer de mes trouvailles' : '✔ Je l’ai trouvé !'}</button>`
        : `<a class="btn gold block" href="#/vip">💎 Suivre ma progression avec VICE+</a>`}`);
    el.querySelector('#fbtn')?.addEventListener('click', async (ev) => {
      try {
        const on = !found.has(m.id);
        await setFound(m.id, on);
        on ? found.add(m.id) : found.delete(m.id);
        if (on) { confetti(ev.clientX, ev.clientY, 40); toast('Bien joué, repère validé !', 'ok'); }
        close();
        paintPins();
        paintStatus();
      } catch (err) { toast(frError(err), 'err'); }
    });
  });

  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    window.removeEventListener('resize', onResize);
  };
}
