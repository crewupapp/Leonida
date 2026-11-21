// =====================================================================
// VICE CITY NEWS — illustrations cartoon originales (SVG animé)
// Tout est dessiné ici : aucun visuel officiel de Rockstar.
// =====================================================================
const INK = '#1a0b2e';
let uid = 0;
const nid = (p) => `${p}${++uid}`;
const rnd = (seed) => {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};
export const hash = (str = '') => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
};

// ---------- Éléments réutilisables ----------
function palm(x, y, h, lean = 1, scale = 1, cls = '') {
  const tx = x + lean * h * 0.28;
  const ty = y - h;
  const trunk = `M${x} ${y} Q${x + lean * h * 0.05} ${y - h * 0.55} ${tx} ${ty}`;
  const rings = [];
  for (let i = 1; i < 9; i++) {
    const t = i / 9;
    const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * (x + lean * h * 0.05) + t * t * tx;
    const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y - h * 0.55) + t * t * ty;
    rings.push(`<path d="M${px - 9 * scale} ${py} q${9 * scale} ${5 * scale} ${18 * scale} 0" stroke="${INK}" stroke-width="${2.5 * scale}" fill="none" stroke-linecap="round"/>`);
  }
  const leaf = (rot, len, col) =>
    `<path transform="rotate(${rot})" d="M0 0 C ${len * 0.35} ${-len * 0.35} ${len * 0.8} ${-len * 0.25} ${len} ${len * 0.12} C ${len * 0.72} ${-len * 0.02} ${len * 0.4} ${-len * 0.02} 0 0 Z" fill="${col}" stroke="${INK}" stroke-width="${3.5 * scale}" stroke-linejoin="round"/>`;
  const L = 95 * scale;
  return `<g class="palm ${cls}">
    <path d="${trunk}" stroke="${INK}" stroke-width="${24 * scale}" fill="none" stroke-linecap="round"/>
    <path d="${trunk}" stroke="#b5651d" stroke-width="${16 * scale}" fill="none" stroke-linecap="round"/>
    ${rings.join('')}
    <g class="fronds" style="transform-origin:${tx}px ${ty}px">
      <g transform="translate(${tx} ${ty})">
        ${leaf(-200, L * 0.95, '#159a5e')}${leaf(-160, L, '#1fbf75')}${leaf(-120, L * 0.8, '#159a5e')}
        ${leaf(-60, L * 0.8, '#1fbf75')}${leaf(-20, L, '#159a5e')}${leaf(20, L * 0.95, '#1fbf75')}
        <circle cx="${-6 * scale}" cy="${8 * scale}" r="${8 * scale}" fill="#7a3e12" stroke="${INK}" stroke-width="${3 * scale}"/>
        <circle cx="${8 * scale}" cy="${10 * scale}" r="${8 * scale}" fill="#8f4a17" stroke="${INK}" stroke-width="${3 * scale}"/>
      </g>
    </g>
  </g>`;
}

function cloud(x, y, s, cls, fill = '#ffc2e2') {
  return `<g class="cloud ${cls}" transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 40 C -4 18 22 8 36 18 C 42 -4 84 -6 92 16 C 108 6 132 16 128 38 C 142 40 142 58 126 60 L 8 60 C -8 60 -10 44 0 40 Z" fill="${fill}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M22 44 C 40 50 70 50 96 44" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7"/>
  </g>`;
}

export function car(color = '#ff2e88', cls = '') {
  return `<g class="vcar ${cls}">
    <g class="speed"><path d="M-70 30 H-20 M-90 46 H-25 M-60 60 H-15" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/></g>
    <path d="M6 52 Q8 32 34 30 L96 28 L114 10 L122 11 L108 30 L190 31 Q216 34 218 50 L218 60 Q218 70 206 70 L16 70 Q4 70 4 60 Z" fill="${color}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M30 46 H200" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>
    <path d="M118 12 L104 31" stroke="#9ff3ff" stroke-width="7" stroke-linecap="round"/>
    <circle cx="210" cy="45" r="6" fill="#ffe66d" stroke="${INK}" stroke-width="3"/>
    <rect x="2" y="40" width="9" height="9" rx="3" fill="#ff5a5f" stroke="${INK}" stroke-width="3"/>
    <g class="wheel" style="transform-origin:52px 70px"><circle cx="52" cy="70" r="18" fill="${INK}"/><circle cx="52" cy="70" r="8" fill="#fff3e0"/><path d="M52 56 V84 M38 70 H66" stroke="#fff3e0" stroke-width="3"/></g>
    <g class="wheel" style="transform-origin:172px 70px"><circle cx="172" cy="70" r="18" fill="${INK}"/><circle cx="172" cy="70" r="8" fill="#fff3e0"/><path d="M172 56 V84 M158 70 H186" stroke="#fff3e0" stroke-width="3"/></g>
  </g>`;
}

export function flamingo(cls = '', pose = 'stand') {
  const wing = pose === 'wave'
    ? `<path class="wing wave" d="M48 92 C 30 60 14 46 4 40 C 22 70 26 92 44 108 Z" fill="#ffd0e6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`
    : `<path class="wing" d="M40 96 C 52 84 80 86 90 104 C 74 102 58 110 40 96 Z" fill="#ffd0e6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  return `<g class="flamingo ${cls}">
    <path d="M58 128 L60 196 M66 128 L84 152 L62 160" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M58 128 L60 196 M66 128 L84 152 L62 160" stroke="#ff4f9a" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M50 196 H70" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M92 98 C 112 70 72 58 84 30" stroke="${INK}" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="M92 98 C 112 70 72 58 84 30" stroke="#ff7ab8" stroke-width="12" fill="none" stroke-linecap="round"/>
    <ellipse cx="62" cy="106" rx="44" ry="30" fill="#ff7ab8" stroke="${INK}" stroke-width="5"/>
    <path d="M20 98 C 10 92 6 104 18 112" fill="#ff7ab8" stroke="${INK}" stroke-width="4"/>
    ${wing}
    <circle cx="86" cy="28" r="17" fill="#ff7ab8" stroke="${INK}" stroke-width="5"/>
    <path d="M98 20 Q 124 22 118 46 Q 110 38 98 36 Z" fill="#fff3e0" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M114 36 Q 120 40 118 46 Q 112 42 110 38 Z" fill="${INK}"/>
    <rect x="72" y="18" width="30" height="13" rx="6" fill="#00e5ff" stroke="${INK}" stroke-width="4"/>
    <path d="M77 22 L83 22" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

// ---------- Logo ----------
export function logoBadge(size = 44) {
  const s = nid('lg'), m = nid('lm');
  return `<svg class="logo-badge" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
    <defs>
      <linearGradient id="${s}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe66d"/><stop offset=".55" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ff2e88"/></linearGradient>
      <mask id="${m}"><rect width="120" height="120" fill="#fff"/><g class="sun-stripes"><rect y="66" width="120" height="4" fill="#000"/><rect y="75" width="120" height="5" fill="#000"/><rect y="85" width="120" height="6" fill="#000"/></g></mask>
    </defs>
    <circle cx="60" cy="60" r="56" fill="#2a0b4f" stroke="${INK}" stroke-width="6"/>
    <circle cx="60" cy="60" r="49" fill="none" stroke="#00e5ff" stroke-width="4" class="logo-ring"/>
    <circle cx="60" cy="70" r="32" fill="url(#${s})" mask="url(#${m})"/>
    <path d="M24 92 H96" stroke="#ff2e88" stroke-width="4" stroke-linecap="round"/>
    <path d="M80 94 Q 82 70 74 52" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M74 52 c 8 -6 20 -4 24 4 c -8 -3 -16 -2 -24 -4 z M74 52 c -6 -8 -18 -8 -24 -2 c 8 0 16 0 24 2 z M74 52 c 2 -10 12 -16 20 -14 c -8 2 -14 8 -20 14 z" fill="#1fbf75" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  </svg>`;
}

// ---------- Scène d'accueil ----------
export function heroScene() {
  const sky = nid('sky'), sun = nid('sun'), sea = nid('sea'), mask = nid('mask'), dots = nid('dots'), sand = nid('sand');
  const r = rnd(42);
  let stars = '';
  for (let i = 0; i < 26; i++) {
    stars += `<circle class="twinkle" style="animation-delay:${(r() * 4).toFixed(2)}s" cx="${(r() * 1200).toFixed(0)}" cy="${(r() * 150 + 8).toFixed(0)}" r="${(r() * 2.2 + 1).toFixed(1)}" fill="#fff"/>`;
  }
  const building = (x, w, h, fill, extra = '') => {
    let wins = '';
    const cols = Math.max(1, Math.floor((w - 16) / 18));
    const rows = Math.max(1, Math.floor((h - 26) / 22));
    for (let c = 0; c < cols; c++) for (let rr = 0; rr < rows; rr++) {
      if (r() > 0.55) wins += `<rect class="win" style="animation-delay:${(r() * 6).toFixed(1)}s" x="${x + 10 + c * 18}" y="${360 - h + 16 + rr * 22}" width="9" height="11" rx="2" fill="#ffe66d"/>`;
    }
    return `<rect x="${x}" y="${360 - h}" width="${w}" height="${h}" fill="${fill}" stroke="${INK}" stroke-width="5"/>${wins}${extra}`;
  };
  const skyline =
    building(40, 70, 120, '#4b1580') +
    building(105, 90, 210, '#3a0f6b', `<path d="M118 150 H182 M126 140 H174 M136 128 H164 M150 128 V104" stroke="${INK}" stroke-width="5" fill="none"/><circle cx="150" cy="100" r="5" class="beacon" fill="#ff2e88" stroke="${INK}" stroke-width="2"/>`) +
    building(190, 64, 150, '#5a1a96') +
    building(250, 100, 170, '#3a0f6b', `<g class="neon"><rect x="262" y="205" width="76" height="30" rx="6" fill="#1a0b2e" stroke="#ff2e88" stroke-width="3"/><text x="300" y="228" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="22" fill="#ff7ab8" letter-spacing="2">NEWS</text></g>`) +
    building(345, 70, 105, '#4b1580') +
    building(790, 80, 130, '#4b1580') +
    building(865, 70, 230, '#3a0f6b', `<path d="M880 130 L900 100 L920 130" stroke="${INK}" stroke-width="5" fill="#5a1a96"/>`) +
    building(930, 110, 175, '#5a1a96', `<rect x="944" y="200" width="82" height="8" fill="#00e5ff" class="neon-bar"/><rect x="944" y="214" width="82" height="8" fill="#ff2e88" class="neon-bar" style="animation-delay:.6s"/>`) +
    building(1035, 70, 140, '#3a0f6b') +
    building(1100, 90, 100, '#4b1580');
  let waves = '';
  for (let i = 0; i < 6; i++) {
    const y = 382 + i * 22;
    waves += `<path class="wave" style="animation-duration:${3 + i * 0.6}s" d="M-40 ${y} q 30 -9 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0" stroke="#fff" stroke-opacity="${0.35 - i * 0.04}" stroke-width="3" fill="none"/>`;
  }
  let refl = '';
  [[200, 372], [150, 392], [110, 412], [70, 432]].forEach(([w, y], i) => {
    refl += `<rect class="shimmer" style="animation-delay:${i * 0.3}s" x="${600 - w / 2}" y="${y}" width="${w}" height="7" rx="4" fill="${i % 2 ? '#ff7ab8' : '#ffe66d'}" opacity=".85"/>`;
  });
  const birds = [0, 1, 2].map((i) => `<g class="bird" style="animation-delay:${i * -4}s;animation-duration:${16 + i * 3}s"><path class="flap" d="M0 ${90 + i * 34} q 12 -12 24 0 q 12 -12 24 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/></g>`).join('');
  return `<svg class="hero-scene" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b0838"/><stop offset=".32" stop-color="#5b1a9a"/><stop offset=".6" stop-color="#ff2e88"/><stop offset=".8" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ffd23f"/></linearGradient>
    <linearGradient id="${sun}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff07a"/><stop offset=".5" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ff2e88"/></linearGradient>
    <linearGradient id="${sea}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00b3c7"/><stop offset="1" stop-color="#3a0f6b"/></linearGradient>
    <linearGradient id="${sand}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd98a"/><stop offset="1" stop-color="#ffb35c"/></linearGradient>
    <pattern id="${dots}" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.6" fill="#fff" opacity=".13"/></pattern>
    <mask id="${mask}"><rect width="1200" height="520" fill="#fff"/><g class="sun-stripes">
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect y="${260 + i * 18}" width="1200" height="${3 + i * 1.6}" fill="#000"/>`).join('')}
    </g></mask>
  </defs>
  <rect width="1200" height="520" fill="url(#${sky})"/>
  <rect width="1200" height="520" fill="url(#${dots})"/>
  ${stars}
  <g class="sun-glow"><circle cx="600" cy="330" r="200" fill="#ff8a3d" opacity=".22"/></g>
  <circle class="sun-body" cx="600" cy="330" r="165" fill="url(#${sun})" mask="url(#${mask})" stroke="${INK}" stroke-width="6"/>
  ${cloud(-220, 70, 1.1, 'c1')}${cloud(-220, 150, 0.8, 'c2', '#ffd6ec')}${cloud(-220, 40, 0.6, 'c3', '#e7c6ff')}
  ${birds}
  <g class="skyline">${skyline}</g>
  <rect x="0" y="358" width="1200" height="162" fill="url(#${sea})" stroke="${INK}" stroke-width="5"/>
  ${refl}${waves}
  <path d="M-10 452 C 260 430 520 446 760 440 C 940 436 1080 444 1210 438 L1210 530 L-10 530 Z" fill="url(#${sand})" stroke="${INK}" stroke-width="6"/>
  <rect x="-10" y="474" width="1220" height="34" fill="#2a1240" stroke="${INK}" stroke-width="5"/>
  <path class="road-line" d="M-10 491 H1210" stroke="#ffd23f" stroke-width="5" stroke-dasharray="34 26"/>
  <g class="car-track"><g transform="translate(0 404)">${car('#ff2e88')}</g></g>
  ${palm(110, 486, 300, 1, 1.05, 'p1')}
  ${palm(1110, 488, 270, -1, 0.95, 'p2')}
  ${palm(1010, 480, 170, -0.6, 0.7, 'p3')}
  <g transform="translate(205 290) scale(.85)">${flamingo('bob', 'wave')}</g>
</svg>`;
}

// ---------- Couvertures d'articles ----------
const COVER_THEMES = {
  sunset: ['#ff2e88', '#ffd23f'], city: ['#1b0838', '#7b2ff7'], keys: ['#00b3c7', '#9ff3ff'],
  swamp: ['#0d7a4a', '#2ee59d'], cash: ['#0d7a4a', '#ffd23f'], trophy: ['#7b2ff7', '#ff2e88'],
  console: ['#00b3c7', '#7b2ff7'], alert: ['#ff5a5f', '#ffd23f'], secret: ['#3a0f6b', '#7b2ff7'],
  egg: ['#ff7ab8', '#ffd23f'], radio: ['#7b2ff7', '#00e5ff'], map: ['#00b3c7', '#ffd23f'],
  server: ['#1b0838', '#ff2e88'], pc: ['#3a0f6b', '#00e5ff'], crypto: ['#ff8a3d', '#ffd23f'],
  leak: ['#1b0838', '#ff5a5f'], car: ['#ff2e88', '#7b2ff7'], star: ['#ffd23f', '#ff8a3d'],
};
export const COVER_STYLES = Object.keys(COVER_THEMES);
export const COVER_LABELS = {
  sunset: 'Coucher de soleil', city: 'Ville la nuit', keys: 'Îles', swamp: 'Marais', cash: 'Argent',
  trophy: 'Trophée', console: 'Manette', alert: 'Alerte', secret: 'Top secret', egg: 'Easter egg',
  radio: 'Radio', map: 'Carte', server: 'Réseau', pc: 'PC', crypto: 'Crypto', leak: 'Fuite',
  car: 'Voiture', star: 'Nouveau',
};

const t = (w = 5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const T = t(5);
const OBJECTS = {
  cash: () => `
    <path class="pop" d="M-120 40 L-60 0 L-20 20 L60 -50" ${t(12)} fill="none"/><path d="M-120 40 L-60 0 L-20 20 L60 -50" stroke="#ff2e88" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M40 -60 L72 -58 L66 -28 Z" fill="#ff2e88" ${T}/>
    <g transform="rotate(-10)"><rect x="-80" y="-10" width="150" height="70" rx="10" fill="#2ee59d" ${T}/><rect x="-68" y="2" width="126" height="46" rx="6" fill="none" stroke="#0d7a4a" stroke-width="4"/><circle cx="-5" cy="25" r="18" fill="#c8ffe6" ${T}/><text x="-5" y="34" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="900" font-size="26" fill="#0d7a4a">$</text></g>
    <g transform="rotate(6) translate(8 30)"><rect x="-80" y="-10" width="150" height="70" rx="10" fill="#1fbf75" ${T}/><circle cx="-5" cy="25" r="18" fill="#c8ffe6" ${T}/><text x="-5" y="34" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="900" font-size="26" fill="#0d7a4a">$</text></g>
    <g class="spin-coin"><ellipse cx="96" cy="40" rx="22" ry="22" fill="#ffd23f" ${T}/><text x="96" y="49" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="900" font-size="24" fill="#b5651d">$</text></g>`,
  trophy: () => `
    <path d="M-46 -50 C -86 -50 -86 -4 -40 0" fill="none" stroke="${INK}" stroke-width="14"/><path d="M-46 -50 C -86 -50 -86 -4 -40 0" fill="none" stroke="#ffd23f" stroke-width="7"/>
    <path d="M46 -50 C 86 -50 86 -4 40 0" fill="none" stroke="${INK}" stroke-width="14"/><path d="M46 -50 C 86 -50 86 -4 40 0" fill="none" stroke="#ffd23f" stroke-width="7"/>
    <path d="M-56 -66 H56 Q56 18 0 30 Q-56 18 -56 -66 Z" fill="#ffd23f" ${T}/>
    <path d="M-36 -54 Q-34 0 -6 18" stroke="#fff6b0" stroke-width="7" fill="none" stroke-linecap="round"/>
    <rect x="-12" y="28" width="24" height="26" fill="#ffb800" ${T}/><rect x="-44" y="52" width="88" height="22" rx="5" fill="#7b2ff7" ${T}/>
    <text x="0" y="-12" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="44" fill="#ff2e88" stroke="${INK}" stroke-width="2">99</text>`,
  console: () => `
    <path d="M-88 -8 Q-88 -46 -52 -46 H52 Q88 -46 88 -8 L104 40 Q110 70 82 70 Q62 70 52 44 H-52 Q-62 70 -82 70 Q-110 70 -104 40 Z" fill="#7b2ff7" ${T}/>
    <path d="M-60 -36 H60" stroke="#b18cff" stroke-width="6" stroke-linecap="round"/>
    <path d="M-62 -12 V12 M-74 0 H-50" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><path d="M-62 -12 V12 M-74 0 H-50" stroke="#fff3e0" stroke-width="6" stroke-linecap="round"/>
    <circle cx="56" cy="-14" r="9" fill="#ff2e88" ${t(4)}/><circle cx="74" cy="2" r="9" fill="#ffd23f" ${t(4)}/><circle cx="38" cy="2" r="9" fill="#00e5ff" ${t(4)}/><circle cx="56" cy="18" r="9" fill="#2ee59d" ${t(4)}/>
    <circle cx="-24" cy="26" r="13" fill="${INK}"/><circle cx="24" cy="26" r="13" fill="${INK}"/><circle cx="-24" cy="23" r="7" fill="#5a1a96"/><circle cx="24" cy="23" r="7" fill="#5a1a96"/>`,
  alert: () => `
    <rect x="-62" y="-62" width="124" height="124" rx="10" fill="#00b3c7" ${T}/>
    <rect x="-40" y="-62" width="80" height="44" fill="#d9fbff" ${T}/><rect x="14" y="-54" width="16" height="28" fill="#00b3c7" ${t(3)}/>
    <rect x="-44" y="6" width="88" height="48" rx="4" fill="#fff3e0" ${T}/>
    <path d="M-8 -62 L4 -30 L-10 -6 L6 20 L-4 62" stroke="${INK}" stroke-width="6" fill="none"/>
    <g class="pop" transform="translate(64 -56)"><path d="M0 -34 L32 22 H-32 Z" fill="#ffd23f" ${T}/><text x="0" y="16" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="34" fill="${INK}">!</text></g>`,
  secret: () => `
    <path d="M-90 -50 H-30 L-18 -36 H90 V64 H-90 Z" fill="#ffb35c" ${T}/>
    <rect x="-74" y="-40" width="140" height="90" fill="#fff3e0" ${T} transform="rotate(-4)"/>
    <path d="M-90 -20 H90 V64 H-90 Z" fill="#ffd98a" ${T}/>
    <g transform="rotate(-12) translate(-4 20)"><rect x="-62" y="-16" width="124" height="34" rx="4" fill="none" stroke="#ff2e88" stroke-width="5"/><text x="0" y="10" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="25" fill="#ff2e88" letter-spacing="2">TOP SECRET</text></g>
    <g class="pop" transform="translate(70 -34)"><circle r="30" fill="#9ff3ff" fill-opacity=".6" ${t(7)}/><path d="M20 22 L48 52" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><path d="M-10 -12 Q-4 -20 6 -18" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/></g>`,
  egg: () => `
    <path d="M-80 46 Q0 86 80 46" stroke="${INK}" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M-80 46 Q0 86 80 46" stroke="#b5651d" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M0 -72 C 52 -72 64 0 60 22 C 56 52 30 66 0 66 C -30 66 -56 52 -60 22 C -64 0 -52 -72 0 -72 Z" fill="#fff3e0" ${T}/>
    <path d="M-58 8 L-40 -6 L-22 8 L-4 -6 L14 8 L32 -6 L50 8 L60 2" stroke="#ff2e88" stroke-width="9" fill="none" stroke-linejoin="round"/>
    <rect x="-40" y="-36" width="34" height="18" rx="7" fill="#00e5ff" ${t(4)}/><rect x="6" y="-36" width="34" height="18" rx="7" fill="#00e5ff" ${t(4)}/><path d="M-6 -28 H6" stroke="${INK}" stroke-width="4"/>
    <path d="M-16 30 Q0 42 16 30" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  radio: () => `
    <path d="M-50 -46 Q-50 -76 0 -76 Q50 -76 50 -46" stroke="${INK}" stroke-width="10" fill="none"/>
    <path d="M70 -46 L96 -92" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><circle cx="96" cy="-92" r="6" fill="#ffd23f" stroke="${INK}" stroke-width="3"/>
    <rect x="-100" y="-46" width="200" height="110" rx="16" fill="#ff2e88" ${T}/>
    <g class="beat" style="transform-origin:-56px 12px"><circle cx="-56" cy="12" r="34" fill="${INK}"/><circle cx="-56" cy="12" r="22" fill="#00e5ff" stroke="${INK}" stroke-width="4"/><circle cx="-56" cy="12" r="8" fill="${INK}"/></g>
    <g class="beat" style="transform-origin:56px 12px;animation-delay:.25s"><circle cx="56" cy="12" r="34" fill="${INK}"/><circle cx="56" cy="12" r="22" fill="#00e5ff" stroke="${INK}" stroke-width="4"/><circle cx="56" cy="12" r="8" fill="${INK}"/></g>
    <rect x="-18" y="-30" width="36" height="26" rx="4" fill="#fff3e0" ${t(4)}/>
    <g class="note n1"><path d="M110 -40 v-30 l18 -6 v30" stroke="${INK}" stroke-width="5" fill="none"/><circle cx="106" cy="-40" r="7" fill="${INK}"/><circle cx="124" cy="-46" r="7" fill="${INK}"/></g>
    <g class="note n2"><path d="M-120 -30 v-28" stroke="${INK}" stroke-width="5"/><circle cx="-125" cy="-30" r="7" fill="${INK}"/></g>`,
  map: () => `
    <path d="M-96 -50 L-34 -64 L30 -50 L96 -64 L96 56 L30 70 L-34 56 L-96 70 Z" fill="#fff3e0" ${T}/>
    <path d="M-34 -64 V56 M30 -50 V70" stroke="${INK}" stroke-width="5"/>
    <path d="M-34 -64 L30 -50 L30 70 L-34 56 Z" fill="#9ff3ff" ${T}/>
    <path d="M-78 40 C -50 0 -10 50 10 0 S 60 -10 70 -30" stroke="#ff2e88" stroke-width="6" fill="none" stroke-dasharray="4 12" stroke-linecap="round"/>
    <path d="M58 -40 L82 -16 M82 -40 L58 -16" stroke="#ff2e88" stroke-width="8" stroke-linecap="round"/>
    <g class="pin-bounce"><path d="M-60 -10 C -86 -10 -90 -46 -60 -64 C -30 -46 -34 -10 -60 -10 Z" transform="translate(0 -8)" fill="#ff2e88" ${T}/><circle cx="-60" cy="-48" r="9" fill="#fff"/></g>`,
  server: () => `
    <rect x="-90" y="0" width="180" height="56" rx="12" fill="#5a1a96" ${T}/>
    <circle class="blink" cx="-58" cy="28" r="7" fill="#2ee59d"/><circle class="blink" style="animation-delay:.4s" cx="-36" cy="28" r="7" fill="#ffd23f"/><circle class="blink" style="animation-delay:.8s" cx="-14" cy="28" r="7" fill="#ff5a5f"/>
    <path d="M-60 0 L-74 -40 M60 0 L74 -40" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <g class="wifi"><path d="M-44 -50 Q0 -90 44 -50" stroke="#00e5ff" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-26 -34 Q0 -58 26 -34" stroke="#00e5ff" stroke-width="9" fill="none" stroke-linecap="round"/></g>
    <g class="pop" transform="translate(70 -60)"><path d="M6 -40 L-20 6 H0 L-8 40 L24 -10 H4 Z" fill="#ffd23f" ${T}/></g>`,
  pc: () => `
    <rect x="-92" y="-66" width="184" height="116" rx="12" fill="#3a0f6b" ${T}/>
    <rect x="-78" y="-54" width="156" height="90" rx="6" fill="#00b3c7" ${t(4)}/>
    <path d="M-14 50 L-22 74 H22 L14 50" fill="#5a1a96" ${T}/><rect x="-46" y="70" width="92" height="12" rx="5" fill="#7b2ff7" ${T}/>
    <g class="flip"><path d="M-20 -40 H20 L-20 20 H20 Z" fill="#ffd23f" ${T}/></g>
    <text x="56" y="-8" font-family="Bangers, Impact, sans-serif" font-size="44" fill="#fff" stroke="${INK}" stroke-width="2">?</text>`,
  crypto: () => `
    <g class="spin-coin"><circle r="70" fill="#ffd23f" ${t(6)}/><circle r="54" fill="none" stroke="#ffb800" stroke-width="6" stroke-dasharray="8 8"/>
    <text y="26" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="78" fill="#ff8a3d" stroke="${INK}" stroke-width="3">D</text></g>
    <path d="M-18 -70 L-4 -30 L-22 -8 L-6 30" stroke="${INK}" stroke-width="5" fill="none"/>
    <g class="pop" transform="translate(78 -50)"><path d="M0 -30 L28 20 H-28 Z" fill="#ff5a5f" ${T}/><text x="0" y="14" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="30" fill="#fff">!</text></g>`,
  leak: () => `
    <rect x="-66" y="-14" width="132" height="96" rx="14" fill="#ff5a5f" ${T}/>
    <path class="shackle" d="M-40 -14 V-44 Q-40 -86 0 -86 Q40 -86 40 -44 V-30" stroke="${INK}" stroke-width="18" fill="none" stroke-linecap="round"/><path class="shackle" d="M-40 -14 V-44 Q-40 -86 0 -86 Q40 -86 40 -44 V-30" stroke="#cfd3ff" stroke-width="9" fill="none" stroke-linecap="round"/>
    <circle cy="22" r="13" fill="${INK}"/><path d="M0 26 V54" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
    <g class="drip"><path d="M-90 30 C -100 46 -80 46 -90 30" fill="#00e5ff" ${t(3)}/></g>
    <g class="drip" style="animation-delay:.7s"><path d="M92 0 C 82 16 102 16 92 0" fill="#00e5ff" ${t(3)}/></g>`,
  car: () => `<g transform="translate(-110 -40)">${car('#00e5ff')}</g>`,
  star: () => `
    <path class="spin-slow" d="M0 -90 L22 -34 L82 -40 L38 2 L64 58 L8 30 L-40 70 L-34 12 L-88 -12 L-30 -30 Z" fill="#ff2e88" ${T}/>
    <text y="16" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="46" fill="#fff" stroke="${INK}" stroke-width="2.5" transform="rotate(-8)">NEW !</text>`,
  sunset: () => ``,
  city: () => ``,
  keys: () => ``,
  swamp: () => ``,
};

function coverScenery(style, s) {
  if (style === 'sunset') {
    return `<circle cx="200" cy="170" r="86" fill="url(#${s}sun)" stroke="${INK}" stroke-width="5" mask="url(#${s}m)"/>
      <rect y="170" width="400" height="70" fill="#7b2ff7" stroke="${INK}" stroke-width="5"/>
      <path class="wave" d="M-20 196 q 20 -7 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none"/>
      <g transform="translate(0 0)">${palm(60, 250, 190, 1, 0.75, 'p1')}${palm(350, 250, 150, -1, 0.6, 'p2')}</g>`;
  }
  if (style === 'city') {
    let b = '';
    const r = rnd(7);
    let x = -10;
    while (x < 410) {
      const w = 36 + r() * 40, h = 60 + r() * 110;
      b += `<rect x="${x}" y="${240 - h}" width="${w}" height="${h}" fill="${r() > 0.5 ? '#3a0f6b' : '#4b1580'}" stroke="${INK}" stroke-width="4"/>`;
      for (let wy = 240 - h + 12; wy < 228; wy += 18) for (let wx = x + 8; wx < x + w - 10; wx += 14) if (r() > 0.6) b += `<rect class="win" style="animation-delay:${(r() * 5).toFixed(1)}s" x="${wx}" y="${wy}" width="7" height="9" rx="1.5" fill="#ffe66d"/>`;
      x += w + 2;
    }
    return `<circle cx="310" cy="56" r="26" fill="#fff3e0" stroke="${INK}" stroke-width="4"/>${b}
      <g class="neon"><rect x="120" y="120" width="120" height="34" rx="8" fill="${INK}" stroke="#00e5ff" stroke-width="3"/><text x="180" y="145" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="24" fill="#9ff3ff" letter-spacing="3">VICE</text></g>`;
  }
  if (style === 'keys') {
    return `<rect y="120" width="400" height="120" fill="#00b3c7" stroke="${INK}" stroke-width="5"/>
      <path class="wave" d="M-20 150 q 20 -7 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none"/>
      <ellipse cx="80" cy="170" rx="70" ry="18" fill="#ffd98a" stroke="${INK}" stroke-width="5"/><ellipse cx="320" cy="180" rx="80" ry="20" fill="#ffd98a" stroke="${INK}" stroke-width="5"/>
      <path d="M140 160 Q200 120 250 168" stroke="${INK}" stroke-width="12" fill="none"/><path d="M140 160 Q200 120 250 168" stroke="#fff3e0" stroke-width="6" fill="none"/>
      ${palm(80, 172, 110, 0.6, 0.5)}${palm(330, 182, 120, -0.6, 0.5)}
      <g class="boat"><path d="M150 214 H230 L216 230 H164 Z" fill="#ff2e88" stroke="${INK}" stroke-width="4"/><path d="M190 214 V176 L222 210 Z" fill="#fff3e0" stroke="${INK}" stroke-width="4"/></g>`;
  }
  if (style === 'swamp') {
    return `<rect y="150" width="400" height="90" fill="#0d7a4a" stroke="${INK}" stroke-width="5"/>
      <path class="wave" d="M-20 176 q 20 -7 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0" stroke="#9ff3c8" stroke-opacity=".6" stroke-width="3" fill="none"/>
      <g class="bob"><path d="M110 168 C 110 130 170 120 220 128 L300 140 C 316 142 316 160 300 162 L200 170 Z" fill="#2ee59d" stroke="${INK}" stroke-width="5"/>
      <path d="M220 160 L232 150 L244 160 L256 150 L268 160" stroke="#fff" stroke-width="4" fill="none"/>
      <circle cx="160" cy="132" r="14" fill="#fff" stroke="${INK}" stroke-width="4"/><circle cx="190" cy="126" r="14" fill="#fff" stroke="${INK}" stroke-width="4"/>
      <rect x="140" y="122" width="70" height="18" rx="8" fill="#ff2e88" stroke="${INK}" stroke-width="4"/></g>
      ${palm(40, 160, 120, 0.7, 0.55)}${palm(370, 160, 110, -0.7, 0.5)}`;
  }
  return '';
}

export function cover(style = 'sunset', seed = '', cls = '') {
  if (!COVER_THEMES[style]) style = 'sunset';
  const [a, b] = COVER_THEMES[style];
  const s = nid('cv');
  const r = rnd(hash(seed + style));
  let rays = '';
  for (let i = 0; i < 12; i++) {
    rays += `<path d="M0 0 L ${Math.cos((i * 30) * Math.PI / 180) * 420} ${Math.sin((i * 30) * Math.PI / 180) * 420} L ${Math.cos((i * 30 + 15) * Math.PI / 180) * 420} ${Math.sin((i * 30 + 15) * Math.PI / 180) * 420} Z" fill="#fff" opacity=".09"/>`;
  }
  let spark = '';
  for (let i = 0; i < 5; i++) {
    const x = 20 + r() * 360, y = 16 + r() * 120, z = 6 + r() * 8;
    spark += `<path class="sparkle" style="animation-delay:${(r() * 3).toFixed(2)}s;transform-origin:${x}px ${y}px" d="M${x} ${y - z} L${x + z * 0.3} ${y - z * 0.3} L${x + z} ${y} L${x + z * 0.3} ${y + z * 0.3} L${x} ${y + z} L${x - z * 0.3} ${y + z * 0.3} L${x - z} ${y} L${x - z * 0.3} ${y - z * 0.3} Z" fill="#fff"/>`;
  }
  const scenery = coverScenery(style, s);
  const obj = OBJECTS[style] ? OBJECTS[style]() : '';
  return `<svg class="cover-art ${cls}" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="${s}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
      <linearGradient id="${s}sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff07a"/><stop offset="1" stop-color="#ff2e88"/></linearGradient>
      <pattern id="${s}d" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.5" fill="#fff" opacity=".16"/></pattern>
      <mask id="${s}m"><rect width="400" height="240" fill="#fff"/><rect y="132" width="400" height="5" fill="#000"/><rect y="146" width="400" height="7" fill="#000"/><rect y="160" width="400" height="9" fill="#000"/></mask>
    </defs>
    <rect width="400" height="240" fill="url(#${s}g)"/>
    <g class="rays" style="transform-origin:200px 130px"><g transform="translate(200 130)">${rays}</g></g>
    <rect width="400" height="240" fill="url(#${s}d)"/>
    ${scenery}
    ${spark}
    ${obj ? `<g class="float"><g transform="translate(200 128)">${obj}</g></g>` : ''}
  </svg>`;
}

// ---------- Carte illustrée de Leonida ----------
export function leonidaMap() {
  const sea = nid('msea'), land = nid('mland'), dots = nid('mdots');
  const keys = [[748, 905, 34, 12], [700, 926, 30, 10], [650, 942, 28, 10], [598, 954, 30, 10], [544, 962, 26, 9], [494, 966, 22, 8], [452, 966, 18, 7]]
    .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ffd98a" stroke="${INK}" stroke-width="5"/>`).join('');
  let waves = '';
  for (let i = 0; i < 9; i++) {
    const x = 60 + (i * 137) % 880, y = 360 + (i * 211) % 600;
    if (x > 560 && x < 880 && y < 860) continue;
    waves += `<path class="map-wave" style="animation-delay:${i * 0.4}s" d="M${x} ${y} q 14 -8 28 0 t 28 0" stroke="#fff" stroke-opacity=".55" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
  return `<svg class="leonida-map" viewBox="0 0 1000 1000" aria-label="Carte illustrée de Leonida">
    <defs>
      <linearGradient id="${sea}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00b3c7"/><stop offset="1" stop-color="#3a0f6b"/></linearGradient>
      <linearGradient id="${land}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7be3a8"/><stop offset="1" stop-color="#2ee59d"/></linearGradient>
      <pattern id="${dots}" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.8" fill="#fff" opacity=".14"/></pattern>
    </defs>
    <rect width="1000" height="1000" fill="url(#${sea})"/>
    <rect width="1000" height="1000" fill="url(#${dots})"/>
    ${waves}
    <path d="M30 128 L740 112 C 760 112 770 126 774 150 C 790 260 820 380 860 520 C 892 630 900 720 878 790 C 860 846 816 880 772 872 C 730 864 708 822 680 790 C 644 748 622 700 606 640 C 588 572 574 500 556 430 C 546 392 532 350 512 322 C 488 290 450 278 404 274 C 330 268 250 286 180 284 C 120 282 70 270 30 262 Z" fill="url(#${land})" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M30 128 L740 112" stroke="#1a0b2e" stroke-width="3" stroke-dasharray="14 10" opacity=".4"/>
    <path d="M540 560 C 600 600 700 600 760 640 C 800 668 820 720 812 770 C 780 800 740 830 700 790 C 660 740 630 690 600 640 Z" fill="#0d7a4a" opacity=".35"/>
    <path d="M470 150 C 520 140 600 150 640 190 C 600 230 520 236 470 210 Z" fill="#159a5e" stroke="${INK}" stroke-width="4" opacity=".9"/>
    <path d="M500 196 L530 160 L560 196 Z M548 196 L580 150 L612 196 Z" fill="#fff3e0" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="700" cy="505" rx="48" ry="40" fill="#00b3c7" stroke="${INK}" stroke-width="5"/>
    <path class="map-wave" d="M680 505 q 10 -6 20 0 t 20 0" stroke="#fff" stroke-width="3" fill="none"/>
    <g class="map-city">
      <rect x="818" y="690" width="18" height="44" fill="#7b2ff7" stroke="${INK}" stroke-width="4"/><rect x="836" y="672" width="20" height="62" fill="#ff2e88" stroke="${INK}" stroke-width="4"/><rect x="856" y="700" width="16" height="34" fill="#3a0f6b" stroke="${INK}" stroke-width="4"/>
    </g>
    ${keys}
    <path d="M778 900 C 740 920 680 940 620 952 C 560 962 500 968 440 966" stroke="#fff3e0" stroke-width="4" stroke-dasharray="10 8" fill="none"/>
    <g class="compass" transform="translate(120 840)"><circle r="56" fill="#fff3e0" stroke="${INK}" stroke-width="5"/><path d="M0 -44 L12 0 L0 44 L-12 0 Z" fill="#ff2e88" stroke="${INK}" stroke-width="4"/><text y="-58" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="30" fill="#fff" stroke="${INK}" stroke-width="1.5">N</text></g>
    <g font-family="Bangers, Impact, sans-serif" font-size="30" fill="#fff" stroke="${INK}" stroke-width="7" paint-order="stroke" letter-spacing="1.5" text-anchor="middle">
      <text x="230" y="208">PORT GELLHORN</text>
      <text x="560" y="262">MOUNT KALAGA</text>
      <text x="660" y="420">AMBROSIA</text>
      <text x="690" y="660">GRASSRIVERS</text>
      <text x="760" y="850">VICE CITY</text>
      <text x="320" y="975">LEONIDA KEYS</text>
    </g>
    <text x="500" y="60" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="54" fill="#ffd23f" stroke="${INK}" stroke-width="9" paint-order="stroke" letter-spacing="4">LEONIDA</text>
  </svg>`;
}

export const AVATARS = { flamingo: '🦩', gator: '🐊', palm: '🌴', shades: '😎', star: '⭐', car: '🏎️' };
