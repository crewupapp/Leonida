// Accès aux données Supabase + état de session.
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_JS } from './config.js';

export let sb = null;
export const state = {
  ready: false, session: null, user: null, profile: null, roles: [], sub: null,
  vip: false, staff: false, admin: false, settings: {}, categories: [],
};
const listeners = new Set();
export const onState = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = (why) => listeners.forEach((fn) => { try { fn(state, why); } catch (e) { console.error(e); } });

const FR_ERRORS = [
  [/invalid login credentials/i, 'E-mail ou mot de passe incorrect.'],
  [/email not confirmed/i, 'Confirme ton adresse e-mail avant de te connecter (pense à vérifier les spams).'],
  [/already registered|already been registered/i, 'Un compte existe déjà avec cet e-mail.'],
  [/password should be at least/i, 'Le mot de passe doit faire au moins 6 caractères.'],
  [/rate limit|too many/i, "Trop de tentatives : réessaie dans quelques minutes."],
  [/unable to validate email|invalid email|email address .* is invalid/i, "Cette adresse e-mail n'est pas valide."],
  [/same.*password/i, "Le nouveau mot de passe doit être différent de l'ancien."],
  [/duplicate key.*username|profiles_username_key/i, 'Ce pseudo est déjà pris.'],
  [/username_format/i, 'Pseudo : 3 à 24 caractères (lettres, chiffres, . _ -).'],
  [/duplicate key.*slug|articles_slug_key/i, 'Un article utilise déjà ce lien (slug).'],
  [/failed to fetch|network/i, 'Connexion impossible. Vérifie ton réseau.'],
];
export function frError(e) {
  const msg = e?.message || String(e || '');
  for (const [re, fr] of FR_ERRORS) if (re.test(msg)) return fr;
  return msg || 'Une erreur est survenue.';
}
const must = ({ data, error }) => { if (error) throw error; return data; };

// ---------- Démarrage ----------
export async function init() {
  const mod = await import(SUPABASE_JS);
  sb = mod.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  const [{ data }, settings, categories] = await Promise.all([
    sb.auth.getSession(),
    loadSettings().catch(() => ({})),
    loadCategories().catch(() => []),
  ]);
  state.settings = settings;
  state.categories = categories;
  await applySession(data.session);
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') setTimeout(() => { location.hash = '#/nouveau-mot-de-passe'; }, 0);
    const changed = (session?.user?.id || null) !== (state.user?.id || null);
    state.session = session;
    if (changed || event === 'USER_UPDATED') setTimeout(() => applySession(session), 0);
  });
  state.ready = true;
  emit('ready');
}

async function applySession(session) {
  state.session = session;
  state.user = session?.user ?? null;
  if (!state.user) {
    Object.assign(state, { profile: null, roles: [], sub: null, vip: false, staff: false, admin: false });
    emit('auth');
    return;
  }
  const uid = state.user.id;
  const [profile, roles, sub] = await Promise.all([
    sb.from('profiles').select('id,username,avatar,created_at').eq('id', uid).maybeSingle().then(must).catch(() => null),
    sb.from('user_roles').select('role').eq('user_id', uid).then(must).catch(() => []),
    sb.from('subscriptions').select('status,plan,current_period_end,cancel_at_period_end,stripe_customer_id,last_synced_at').eq('user_id', uid).maybeSingle().then(must).catch(() => null),
  ]);
  state.profile = profile;
  state.roles = (roles || []).map((r) => r.role);
  state.sub = sub;
  computeAccess();
  emit('auth');
  if (sub?.stripe_customer_id && (!sub.last_synced_at || Date.now() - new Date(sub.last_synced_at) > 6 * 3600e3)) {
    syncSubscription().catch(() => {});
  }
}

function computeAccess() {
  state.staff = state.roles.includes('admin') || state.roles.includes('editor');
  state.admin = state.roles.includes('admin');
  const s = state.sub;
  const paid = !!s && ['active', 'trialing'].includes(s.status) && (!s.current_period_end || new Date(s.current_period_end) > new Date());
  state.vip = paid || state.staff;
}

export async function refreshSub() {
  if (!state.user) return null;
  state.sub = await sb.from('subscriptions').select('status,plan,current_period_end,cancel_at_period_end,stripe_customer_id,last_synced_at').eq('user_id', state.user.id).maybeSingle().then(must);
  computeAccess();
  emit('sub');
  return state.sub;
}

// ---------- Réglages / catégories ----------
export async function loadSettings() {
  const rows = must(await sb.from('app_settings').select('key,value'));
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
export async function loadCategories() {
  return must(await sb.from('categories').select('slug,name,color,emoji,sort').order('sort'));
}
export const category = (slug) => state.categories.find((c) => c.slug === slug);

// ---------- Auth ----------
const here = () => location.origin + location.pathname;
export async function signUp(email, password, username) {
  return must(await sb.auth.signUp({ email, password, options: { data: { username }, emailRedirectTo: here() } }));
}
export async function signIn(email, password) {
  return must(await sb.auth.signInWithPassword({ email, password }));
}
export async function signOut() { await sb.auth.signOut(); }
export async function resetPassword(email) {
  return must(await sb.auth.resetPasswordForEmail(email, { redirectTo: here() }));
}
export async function updatePassword(password) {
  return must(await sb.auth.updateUser({ password }));
}
export async function updateProfile(patch) {
  const data = must(await sb.from('profiles').update(patch).eq('id', state.user.id).select('id,username,avatar,created_at').single());
  state.profile = data;
  emit('profile');
  return data;
}

// ---------- Articles ----------
const ART = 'id,slug,title,excerpt,category,cover_url,cover_style,is_premium,free_at,is_featured,is_breaking,published_at,reading_minutes,tags,views';
export const isLocked = (a) => a.is_premium && !(a.free_at && new Date(a.free_at) <= new Date());

export async function listArticles({ category: cat, premium, limit = 40, search, ids, exclude } = {}) {
  let q = sb.from('articles').select(ART).eq('status', 'published').lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false }).limit(limit);
  if (cat) q = q.eq('category', cat);
  if (premium != null) q = q.eq('is_premium', premium);
  if (ids) q = q.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  if (exclude) q = q.neq('id', exclude);
  if (search) {
    const s = search.replace(/[,()%*\\]/g, ' ').trim();
    if (s) q = q.or(`title.ilike.%${s}%,excerpt.ilike.%${s}%`);
  }
  return must(await q);
}
export async function getArticle(slug) {
  const a = must(await sb.from('articles').select(ART + ',status').eq('slug', slug).maybeSingle());
  if (!a) return null;
  const b = must(await sb.from('article_bodies').select('body').eq('article_id', a.id).maybeSingle());
  return { ...a, body: b ? b.body : null };
}
export async function incrementView(id) {
  const k = 'vcn-viewed';
  const seen = JSON.parse(sessionStorage.getItem(k) || '[]');
  if (seen.includes(id)) return;
  seen.push(id);
  sessionStorage.setItem(k, JSON.stringify(seen.slice(-200)));
  await sb.rpc('increment_view', { p_article: id });
}

// ---------- Favoris ----------
export async function bookmarkIds() {
  if (!state.user) return [];
  return must(await sb.from('bookmarks').select('article_id')).map((r) => r.article_id);
}
export async function setBookmark(articleId, on) {
  if (on) must(await sb.from('bookmarks').insert({ user_id: state.user.id, article_id: articleId }));
  else must(await sb.from('bookmarks').delete().eq('user_id', state.user.id).eq('article_id', articleId));
}

// ---------- Carte ----------
export async function mapData() {
  const [cats, markers, progress] = await Promise.all([
    sb.from('map_categories').select('slug,name,color,emoji,sort').order('sort').then(must),
    sb.from('map_markers').select('id,title,description,category,x,y,region,is_premium').order('created_at').then(must),
    state.user ? sb.from('marker_progress').select('marker_id').then(must) : Promise.resolve([]),
  ]);
  return { cats, markers, found: new Set(progress.map((p) => p.marker_id)) };
}
export async function setFound(markerId, on) {
  if (on) must(await sb.from('marker_progress').insert({ user_id: state.user.id, marker_id: markerId }));
  else must(await sb.from('marker_progress').delete().eq('user_id', state.user.id).eq('marker_id', markerId));
}

// ---------- Quiz ----------
export async function quizQuestions() {
  return must(await sb.from('quiz_questions').select('id,question,choices,is_premium,sort').eq('is_active', true).order('sort'));
}
export async function answerQuiz(questionId, choice) {
  return must(await sb.rpc('answer_quiz', { p_question: questionId, p_choice: choice }));
}
export async function myAnswers() {
  if (!state.user) return [];
  return must(await sb.from('quiz_answers').select('question_id,is_correct'));
}
export async function leaderboard() { return must(await sb.rpc('quiz_leaderboard')); }
export async function contentStats() { return must(await sb.rpc('content_stats')); }

// ---------- Sondages ----------
export async function polls() {
  const [list, results, mine] = await Promise.all([
    sb.from('polls').select('id,question,options,is_premium,is_active,created_at').eq('is_active', true).order('created_at').then(must),
    sb.rpc('poll_results').then(must),
    state.user ? sb.from('poll_votes').select('poll_id,option_index').then(must) : Promise.resolve([]),
  ]);
  const counts = {};
  results.forEach((r) => { (counts[r.poll_id] ||= {})[r.option_index] = Number(r.votes); });
  const my = Object.fromEntries(mine.map((v) => [v.poll_id, v.option_index]));
  return list.map((p) => ({ ...p, counts: counts[p.id] || {}, mine: my[p.id] }));
}
export async function vote(pollId, optionIndex) {
  must(await sb.from('poll_votes').insert({ poll_id: pollId, user_id: state.user.id, option_index: optionIndex }));
}

// ---------- Paiement (fonctions serveur) ----------
export async function billing(action, extra = {}) {
  const { data, error } = await sb.functions.invoke('billing', { body: { action, returnUrl: here(), ...extra } });
  if (error) {
    let payload = null;
    try { payload = await error.context.json(); } catch { /* ignore */ }
    const e = new Error(payload?.message || payload?.error || error.message);
    e.code = payload?.error;
    throw e;
  }
  return data;
}
export async function syncSubscription() {
  await billing('sync');
  return refreshSub();
}

// ---------- Administration ----------
export const admin = {
  stats: async () => must(await sb.rpc('admin_stats')),
  articles: async () => must(await sb.from('articles').select(ART + ',status,updated_at').order('updated_at', { ascending: false }).limit(300)),
  article: async (id) => {
    const a = must(await sb.from('articles').select(ART + ',status').eq('id', id).maybeSingle());
    if (!a) return null;
    const b = must(await sb.from('article_bodies').select('body').eq('article_id', id).maybeSingle());
    return { ...a, body: b?.body || '' };
  },
  saveArticle: async (a, body) => {
    let id = a.id;
    const row = { ...a };
    delete row.id;
    if (id) must(await sb.from('articles').update(row).eq('id', id));
    else id = must(await sb.from('articles').insert(row).select('id').single()).id;
    must(await sb.from('article_bodies').upsert({ article_id: id, body }, { onConflict: 'article_id' }));
    return id;
  },
  deleteArticle: async (id) => must(await sb.from('articles').delete().eq('id', id)),
  uploadCover: async (file, slug) => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${Date.now()}-${slug || 'cover'}.${ext}`;
    must(await sb.storage.from('covers').upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type }));
    return sb.storage.from('covers').getPublicUrl(path).data.publicUrl;
  },
  saveMarker: async (m) => {
    const row = { ...m };
    delete row.id;
    if (m.id) must(await sb.from('map_markers').update(row).eq('id', m.id));
    else must(await sb.from('map_markers').insert(row));
  },
  deleteMarker: async (id) => must(await sb.from('map_markers').delete().eq('id', id)),
  questions: async () => must(await sb.rpc('admin_quiz_questions')),
  saveQuestion: async (q) => {
    const row = { ...q };
    delete row.id;
    if (q.id) must(await sb.from('quiz_questions').update(row).eq('id', q.id));
    else must(await sb.from('quiz_questions').insert(row));
  },
  deleteQuestion: async (id) => must(await sb.from('quiz_questions').delete().eq('id', id)),
  polls: async () => must(await sb.from('polls').select('id,question,options,is_premium,is_active,created_at').order('created_at', { ascending: false })),
  savePoll: async (p) => {
    const row = { ...p };
    delete row.id;
    if (p.id) must(await sb.from('polls').update(row).eq('id', p.id));
    else must(await sb.from('polls').insert(row));
  },
  deletePoll: async (id) => must(await sb.from('polls').delete().eq('id', id)),
  saveSetting: async (key, value) => {
    must(await sb.from('app_settings').upsert({ key, value, is_public: true, updated_at: new Date().toISOString() }, { onConflict: 'key' }));
    state.settings[key] = value;
    emit('settings');
  },
};
