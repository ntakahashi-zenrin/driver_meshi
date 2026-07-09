// ============================================================
// 店舗マスター管理バックオフィス サーバー（POC）
//   秘密情報（ZENRIN client_id/secret・APIキー・Appwrite APIキー）を持つのはここだけ。
//   起動: npm start （= node --env-file=.env server.mjs）
// ============================================================
import express from 'express';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ProxyAgent } from 'undici';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 企業プロキシ対応：HTTPS_PROXY があれば外部（ZENRIN）通信はプロキシ経由にする。
// Node の fetch は環境変数のプロキシを自動利用しないため、明示的に dispatcher を渡す。
// Appwrite は localhost なのでプロキシは使わない（直結）。
const PROXY_URL = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || '';
const proxyDispatcher = PROXY_URL ? new ProxyAgent(PROXY_URL) : undefined;
// 外部向け fetch（プロキシがあれば経由）
function extFetch(url, opts = {}) {
  return fetch(url, proxyDispatcher ? { ...opts, dispatcher: proxyDispatcher } : opts);
}

// --- 設定（.env から。未設定は検証環境・ローカルのデフォルト） ---
const CFG = {
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  SESSION_SECRET: process.env.SESSION_SECRET || ('dorameshi-' + (process.env.ADMIN_PASSWORD || 'x')),
  ZENRIN_CLIENT_ID: process.env.ZENRIN_CLIENT_ID,
  ZENRIN_CLIENT_SECRET: process.env.ZENRIN_CLIENT_SECRET,
  ZENRIN_API_KEY: process.env.ZENRIN_API_KEY,
  ZENRIN_AUTH_BASE: (process.env.ZENRIN_AUTH_BASE || 'https://test-auth.zmaps-api.com').replace(/\/$/, ''),
  ZENRIN_WEB_BASE: (process.env.ZENRIN_WEB_BASE || 'https://test-web.zmaps-api.com').replace(/\/$/, ''),
  ZENRIN_JS_DOMAIN: process.env.ZENRIN_JS_DOMAIN || 'test-js.zmaps-api.com',
  ZENRIN_MAPTYPE: process.env.ZENRIN_MAPTYPE || 'kP8KjZdn', // スタンダード地図デザイン
  APPWRITE_ENDPOINT: (process.env.APPWRITE_ENDPOINT || 'http://localhost/v1').replace(/\/$/, ''),
  APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID || 'driver-meshi',
  APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID || 'main',
  APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
  PORT: process.env.PORT || 8787,
};

// 起動前チェック（足りない秘密情報を分かりやすく知らせる）
const missing = ['ADMIN_PASSWORD', 'ZENRIN_CLIENT_ID', 'ZENRIN_CLIENT_SECRET', 'ZENRIN_API_KEY', 'APPWRITE_API_KEY']
  .filter((k) => !CFG[k]);
if (missing.length) {
  console.error('\n❌ .env に次の値が足りません: ' + missing.join(', '));
  console.error('   backoffice/.env.example を参考に backoffice/.env を作成してください。\n');
  process.exit(1);
}

const app = express();
app.use(express.json());

// API応答はキャッシュさせない（ログイン状態の取り違えを防ぐ）
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ------------------------------------------------------------
// 認証（管理者 admin のみ。Cookieに署名トークンを入れるステートレス方式）
// ------------------------------------------------------------
function sign(value) {
  const h = crypto.createHmac('sha256', CFG.SESSION_SECRET).update(value).digest('hex');
  return `${value}.${h}`;
}
function verify(signed) {
  if (!signed || !signed.includes('.')) return false;
  const idx = signed.lastIndexOf('.');
  const value = signed.slice(0, idx);
  return sign(value) === signed ? value : false;
}
function parseCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}
// 認証値の取得：Authorization ヘッダ（Bearer）優先、なければCookie。
// ブラウザによってはCookieが保存されない環境があるため、トークンをヘッダでも受け付ける。
function getAuthValue(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) {
    const v = verify(h.slice(7));
    if (v) return v;
  }
  return verify(parseCookie(req, 'session'));
}
function requireAuth(req, res, next) {
  if (getAuthValue(req) === 'admin') return next();
  res.status(401).json({ error: 'ログインが必要です' });
}

app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (password && password === CFG.ADMIN_PASSWORD) {
    const token = sign('admin');
    // Cookieも一応セットするが、ブラウザはヘッダのトークンを使う
    res.setHeader('Set-Cookie', `session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200`);
    return res.json({ ok: true, token });
  }
  res.status(401).json({ error: 'パスワードが違います' });
});

app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  res.json({ loggedIn: getAuthValue(req) === 'admin' });
});

// ------------------------------------------------------------
// ZENRIN OAuth2.0 トークン（client_credentials）— サーバーで取得＆キャッシュ
// 出典: zenrin_maps_api_web_usage.md「OAuth2.0認証 / トークン取得」
// ------------------------------------------------------------
let tokenCache = { token: null, exp: 0 };
async function getZenrinToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.exp > now + 60_000) return tokenCache.token;

  const cred = Buffer.from(`${CFG.ZENRIN_CLIENT_ID}:${CFG.ZENRIN_CLIENT_SECRET}`).toString('base64');
  const res = await extFetch(`${CFG.ZENRIN_AUTH_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${cred}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`ZENRINトークン取得失敗 (${res.status}): ${t}`);
  }
  const data = await res.json();
  tokenCache = { token: data.access_token, exp: now + (data.expires_in || 3600) * 1000 };
  return tokenCache.token;
}

// ブラウザの地図ローダー用にトークン＋APIキー＋JSドメインを返す（ログイン必須）
app.get('/api/zenrin-token', requireAuth, async (req, res) => {
  try {
    const token = await getZenrinToken();
    res.json({ token, apiKey: CFG.ZENRIN_API_KEY, jsDomain: CFG.ZENRIN_JS_DOMAIN });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

// 地図ローダー本体（maps_loader）を同一オリジンで中継する。
// ※ZENRIN公式の zma_loader.js はブラウザから maps_loader を独自ヘッダ付きで直接fetchするため
//   CORS でブロックされる。サーバーが代わりに取得して返すことで回避する（ZisAuth方式）。
app.get('/api/maps-loader', requireAuth, async (req, res) => {
  try {
    const token = await getZenrinToken();
    const r = await extFetch(`${CFG.ZENRIN_WEB_BASE}/maps_loader`, {
      headers: { 'x-api-key': CFG.ZENRIN_API_KEY, 'authorization': `Bearer ${token}` },
    });
    if (!r.ok) return res.status(502).type('text/plain').send(`maps_loader 取得失敗 (${r.status})`);
    const js = await r.text();
    res.type('application/javascript').send(js);
  } catch (e) {
    res.status(502).type('text/plain').send('maps_loader エラー: ' + String(e.message || e));
  }
});

// 静止画地図（PNG）をサーバー経由で返す。ブラウザはZENRINと直接通信しないためCORS不要。
// 出典: zenrin_maps_api_web_usage.md「マップ / 画像出力 /map/map」
app.get('/api/staticmap', requireAuth, async (req, res) => {
  try {
    const lng = Number(req.query.lng), lat = Number(req.query.lat);
    const zoom = Math.min(22, Math.max(3, Number(req.query.zoom) || 15));
    const w = Math.min(1280, Math.max(1, parseInt(req.query.w, 10) || 600));
    const h = Math.min(1280, Math.max(1, parseInt(req.query.h, 10) || 400));
    if (!isFinite(lng) || !isFinite(lat)) return res.status(400).json({ error: 'lng/lat が必要です' });
    const token = await getZenrinToken();
    const params = new URLSearchParams({
      center: `${lng},${lat}`, zoom: String(zoom), maptype: CFG.ZENRIN_MAPTYPE,
      width: String(w), height: String(h), centermark: 'false', copyrights: 'true',
    });
    const r = await extFetch(`${CFG.ZENRIN_WEB_BASE}/map/map?${params.toString()}`, {
      headers: { 'x-api-key': CFG.ZENRIN_API_KEY, 'authorization': `Bearer ${token}` },
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(502).type('application/json').send(t);
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.set('Cache-Control', 'no-store');
    res.type('image/png').send(buf);
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

// ------------------------------------------------------------
// ジオコーディング（住所→緯度経度／緯度経度→住所）— ZENRINへ中継
// 出典: zenrin_maps_api_web_usage.md「住所検索 /search/address」
//   forward : ?word=住所
//   reverse : ?lng=&lat=
//   レスポンス result.item[].position = [経度, 緯度]、address_code2 = 都道府県コード
// ------------------------------------------------------------
app.get('/api/geocode', requireAuth, async (req, res) => {
  try {
    const token = await getZenrinToken();
    const { word, lng, lat } = req.query;
    const params = new URLSearchParams({ word_match_type: '3', limit: '0,10', datum: 'JGD' });
    if (word) params.set('word', String(word));
    else if (lng && lat) params.set('position', `${lng},${lat}`); // 経度,緯度 の順
    else return res.status(400).json({ error: 'word か lng/lat が必要です' });

    const r = await extFetch(`${CFG.ZENRIN_WEB_BASE}/search/address?${params.toString()}`, {
      method: 'GET',
      headers: { 'x-api-key': CFG.ZENRIN_API_KEY, 'Authorization': `Bearer ${token}` },
    });
    const data = await r.json();
    if (data.status !== 'OK') return res.status(502).json({ error: 'ジオコーディング失敗', detail: data });

    const items = (data.result?.item || []).map((it) => ({
      address: it.address,
      lng: it.position?.[0] ?? null,
      lat: it.position?.[1] ?? null,
      pref_code: it.address_code2 ? parseInt(it.address_code2, 10) : null,
      level: it.address_level,
    })).filter((x) => x.lat != null && x.lng != null);

    res.json({ hit: data.result?.info?.hit ?? items.length, items });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

// ------------------------------------------------------------
// places（店舗マスター）CRUD — Appwrite REST へ中継（APIキーで実行）
// ------------------------------------------------------------
const AW_BASE = `${CFG.APPWRITE_ENDPOINT}/databases/${CFG.APPWRITE_DATABASE_ID}/collections/places/documents`;
function awHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': CFG.APPWRITE_PROJECT_ID,
    'X-Appwrite-Key': CFG.APPWRITE_API_KEY,
  };
}

// 入力フォームの値を places の項目だけに整える
function sanitize(body) {
  const bool = (v) => v === true || v === 'true' || v === 1 || v === '1';
  const str = (v) => (v == null ? '' : String(v));
  const out = {
    name: str(body.name),
    address: str(body.address),
    pref_code: body.pref_code === '' || body.pref_code == null ? null : parseInt(body.pref_code, 10),
    lat: body.lat === '' || body.lat == null ? null : Number(body.lat),
    lng: body.lng === '' || body.lng == null ? null : Number(body.lng),
    category: str(body.category),
    hours_text: str(body.hours_text),
    phone: str(body.phone),
    midnight_open: bool(body.midnight_open),
    early_open: bool(body.early_open),
    oogata_ok: bool(body.oogata_ok),
    open_24h: bool(body.open_24h),
    truck_parking: str(body.truck_parking),
    shower: bool(body.shower),
    wifi: bool(body.wifi),
  };
  return out;
}

app.get('/api/places', requireAuth, async (req, res) => {
  // Appwrite 1.9 のクエリはJSON形式（method/attributes/values）
  const queries = [
    JSON.stringify({ method: 'orderDesc', attributes: ['$createdAt'] }),
    JSON.stringify({ method: 'limit', values: [100] }),
  ];
  const qs = queries.map((q) => `queries[]=${encodeURIComponent(q)}`).join('&');
  const r = await fetch(`${AW_BASE}?${qs}`, { headers: awHeaders() });
  const data = await r.json();
  if (!r.ok) return res.status(r.status).json({ error: data?.message || ' 取得失敗' });
  res.json({ total: data.total, documents: data.documents });
});

app.post('/api/places', requireAuth, async (req, res) => {
  const data = sanitize(req.body);
  for (const k of ['name', 'address', 'category']) {
    if (!data[k]) return res.status(400).json({ error: `${k} は必須です` });
  }
  if (data.lat == null || data.lng == null) return res.status(400).json({ error: '緯度・経度が未設定です（地図で場所を選んでください）' });
  const now = new Date().toISOString();
  data.created_by = 'admin';
  data.created_at = now;
  data.updated_at = now;
  const r = await fetch(AW_BASE, {
    method: 'POST',
    headers: awHeaders(),
    body: JSON.stringify({ documentId: 'unique()', data }),
  });
  const out = await r.json();
  if (!r.ok) return res.status(r.status).json({ error: out?.message || '登録失敗' });
  res.json(out);
});

app.patch('/api/places/:id', requireAuth, async (req, res) => {
  const data = sanitize(req.body);
  data.updated_at = new Date().toISOString();
  delete data.created_by; // 作成者は変更しない
  const r = await fetch(`${AW_BASE}/${encodeURIComponent(req.params.id)}`, {
    method: 'PATCH',
    headers: awHeaders(),
    body: JSON.stringify({ data }),
  });
  const out = await r.json();
  if (!r.ok) return res.status(r.status).json({ error: out?.message || '更新失敗' });
  res.json(out);
});

app.delete('/api/places/:id', requireAuth, async (req, res) => {
  const r = await fetch(`${AW_BASE}/${encodeURIComponent(req.params.id)}`, { method: 'DELETE', headers: awHeaders() });
  if (!r.ok) {
    const out = await r.json().catch(() => ({}));
    return res.status(r.status).json({ error: out?.message || '削除失敗' });
  }
  res.json({ ok: true });
});

// ------------------------------------------------------------
// SNSフロントエンド（localhost:5173）向け公開API
//   Originヘッダを検証してSNSフロントのみ許可。
//   ZENRINの認証情報はサーバー側のみ。ブラウザには渡さない。
// ------------------------------------------------------------
const SNS_ORIGINS = new Set(['http://localhost:5173', 'http://localhost:5174']);

function pubCors(req, res, next) {
  const origin = req.headers.origin || '';
  if (!SNS_ORIGINS.has(origin)) return res.status(403).json({ error: 'Forbidden' });
  res.set({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
  });
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}
app.options('/api/pub/*', pubCors);

app.get('/api/pub/geocode', pubCors, async (req, res) => {
  try {
    const token = await getZenrinToken();
    const { word, lng, lat } = req.query;
    const params = new URLSearchParams({ word_match_type: '3', limit: '0,10', datum: 'JGD' });
    if (word) params.set('word', String(word));
    else if (lng && lat) params.set('position', `${lng},${lat}`);
    else return res.status(400).json({ error: 'word か lng/lat が必要です' });
    const r = await extFetch(`${CFG.ZENRIN_WEB_BASE}/search/address?${params.toString()}`, {
      headers: { 'x-api-key': CFG.ZENRIN_API_KEY, 'Authorization': `Bearer ${token}` },
    });
    const data = await r.json();
    if (data.status !== 'OK') return res.status(502).json({ error: 'ジオコーディング失敗', detail: data });
    const items = (data.result?.item || []).map((it) => ({
      address: it.address,
      lng: it.position?.[0] ?? null,
      lat: it.position?.[1] ?? null,
      pref_code: it.address_code2 ? parseInt(it.address_code2, 10) : null,
      level: it.address_level,
    })).filter((x) => x.lat != null && x.lng != null);
    res.json({ hit: data.result?.info?.hit ?? items.length, items });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

app.get('/api/pub/staticmap', pubCors, async (req, res) => {
  try {
    const lng = Number(req.query.lng), lat = Number(req.query.lat);
    const zoom = Math.min(22, Math.max(3, Number(req.query.zoom) || 15));
    const w = Math.min(800, Math.max(1, parseInt(req.query.w, 10) || 400));
    const h = Math.min(600, Math.max(1, parseInt(req.query.h, 10) || 300));
    if (!isFinite(lng) || !isFinite(lat)) return res.status(400).json({ error: 'lng/lat が必要です' });
    const token = await getZenrinToken();
    const params = new URLSearchParams({
      center: `${lng},${lat}`, zoom: String(zoom), maptype: CFG.ZENRIN_MAPTYPE,
      width: String(w), height: String(h), centermark: 'false', copyrights: 'true',
    });
    const r = await extFetch(`${CFG.ZENRIN_WEB_BASE}/map/map?${params.toString()}`, {
      headers: { 'x-api-key': CFG.ZENRIN_API_KEY, 'authorization': `Bearer ${token}` },
    });
    if (!r.ok) { const t = await r.text(); return res.status(502).type('application/json').send(t); }
    const buf = Buffer.from(await r.arrayBuffer());
    res.type('image/png').send(buf);
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
});

// 静的ファイル（管理画面）。POC中は常に最新を読ませるためキャッシュ無効。
app.use(express.static(join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => res.set('Cache-Control', 'no-store'),
}));

app.listen(CFG.PORT, () => {
  console.log(`\n✅ 店舗マスター管理バックオフィス起動`);
  console.log(`   → ブラウザで http://localhost:${CFG.PORT} を開いてください`);
  console.log(`   ZENRIN: ${CFG.ZENRIN_WEB_BASE} / Appwrite: ${CFG.APPWRITE_ENDPOINT}\n`);
});
