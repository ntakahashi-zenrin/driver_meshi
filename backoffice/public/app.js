// ============================================================
// 店舗マスター管理バックオフィス フロント（依存なしの素のJS）
//   地図は ZENRIN Maps API JavaScript API（OAuth）を
//   公式の正準テンプレート（ZMALoader.setOnLoad + ZDC）に沿って利用。
// ============================================================

// ---- API ヘルパー ----
function getToken() { return localStorage.getItem('bo_token') || ''; }
function setToken(t) { if (t) localStorage.setItem('bo_token', t); }
function clearToken() { localStorage.removeItem('bo_token'); }

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const tok = getToken();
  if (tok) headers['Authorization'] = 'Bearer ' + tok;
  const res = await fetch(path, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...opts,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    // セッション切れ：トークンを破棄してログイン画面へ戻す
    clearToken();
    closePickerAndForm();
    show('login');
    $('login-error').textContent = 'ログインの有効期限が切れました。もう一度ログインしてください。';
    throw new Error('ログインが必要です');
  }
  if (!res.ok) throw new Error(data.error || `エラー (${res.status})`);
  return data;
}

function closePickerAndForm() {
  const p = document.getElementById('picker-modal'); if (p) p.hidden = true;
  const f = document.getElementById('form-modal'); if (f) f.hidden = true;
}

const $ = (id) => document.getElementById(id);

// ---- 画面切り替え ----
function show(view) {
  $('login-view').hidden = view !== 'login';
  $('main-view').hidden = view !== 'main';
}

// ---- ログイン ----
$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('login-error').textContent = '';
  try {
    const r = await api('/api/login', { method: 'POST', body: JSON.stringify({ password: $('login-password').value }) });
    setToken(r.token);
    $('login-password').value = '';
    await enterApp();
  } catch (err) {
    $('login-error').textContent = err.message;
  }
});

$('btn-logout').addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' }).catch(() => {});
  clearToken();
  show('login');
});

async function enterApp() {
  show('main');
  await loadPlaces();
}

// ---- 一覧表示 ----
const CAT = { '道の駅': '道の駅', 'トラックステーション': 'TS', 'SA・PA': 'SA・PA', '店舗': '店舗' };

async function loadPlaces() {
  const tbody = $('places-tbody');
  tbody.innerHTML = '';
  try {
    const { total, documents } = await api('/api/places');
    $('list-info').textContent = `登録店舗：${total} 件`;
    if (!documents.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="muted">まだ店舗が登録されていません。「＋ 店舗を追加」から登録してください。</td></tr>';
      return;
    }
    for (const d of documents) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${esc(d.name)}${d.code ? `<br><span class="muted">${esc(d.code)}</span>` : ''}</td>
        <td>${esc(d.category || '')}</td>
        <td>${esc(d.address || '')}</td>
        <td class="muted">${num(d.lat)}<br>${num(d.lng)}</td>
        <td>${d.oogata_ok ? '<span class="badge">大型車OK</span>' : ''}</td>
        <td><div class="row-actions">
          <button class="ghost" data-edit="${d.$id}">編集</button>
          <button class="ghost" data-del="${d.$id}">削除</button>
        </div></td>`;
      tbody.appendChild(tr);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="error">${esc(err.message)}</td></tr>`;
  }
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = (v) => (v == null ? '—' : Number(v).toFixed(4));

// ジオコーディング結果から最も詳細な住所階層を選ぶ（TBN>GIK>AZC>OAZ>SHK>TOD）
const LEVEL_RANK = { TBN: 6, GIK: 5, AZC: 4, OAZ: 3, SHK: 2, TOD: 1 };
function pickMostDetailed(items) {
  if (!items || !items.length) return null;
  return items.slice().sort((a, b) => (LEVEL_RANK[b.level] || 0) - (LEVEL_RANK[a.level] || 0))[0];
}

// 一覧の編集・削除（イベント委譲）
$('places-tbody').addEventListener('click', async (e) => {
  const editId = e.target.getAttribute('data-edit');
  const delId = e.target.getAttribute('data-del');
  if (editId) {
    const { documents } = await api('/api/places');
    const doc = documents.find((d) => d.$id === editId);
    if (doc) openForm(doc);
  } else if (delId) {
    if (confirm('この店舗を削除しますか？')) {
      await api(`/api/places/${delId}`, { method: 'DELETE' }).catch((err) => alert(err.message));
      await loadPlaces();
    }
  }
});

// ============================================================
// 店舗フォーム
// ============================================================
const BOOL_FIELDS = ['oogata_ok', 'midnight_open', 'early_open', 'open_24h', 'shower', 'wifi'];
const TEXT_FIELDS = ['name', 'category', 'phone', 'hours_text', 'truck_parking'];

$('btn-new').addEventListener('click', () => openForm(null));
document.querySelectorAll('[data-close-form]').forEach((b) => b.addEventListener('click', closeForm));

function openForm(doc) {
  $('form-error').textContent = '';
  $('form-title').textContent = doc ? '店舗を編集' : '店舗を追加';
  $('f-id').value = doc?.$id || '';
  TEXT_FIELDS.forEach((k) => { $(`f-${k}`).value = doc?.[k] ?? ''; });
  BOOL_FIELDS.forEach((k) => { $(`f-${k}`).checked = !!doc?.[k]; });
  // 場所
  setFormLocation({
    address: doc?.address || '',
    lat: doc?.lat ?? null,
    lng: doc?.lng ?? null,
    pref_code: doc?.pref_code ?? null,
  });
  $('form-modal').hidden = false;
}
function closeForm() { $('form-modal').hidden = true; }

function setFormLocation(loc) {
  $('f-address').value = loc.address || '';
  $('f-lat').value = loc.lat ?? '';
  $('f-lng').value = loc.lng ?? '';
  $('f-pref_code').value = loc.pref_code ?? '';
  const has = loc.lat != null && loc.lng != null && loc.lat !== '';
  $('location-empty').hidden = has;
  $('location-set').hidden = !has;
  if (has) {
    $('loc-addr').textContent = loc.address || '(住所未取得)';
    $('loc-coord').textContent = `緯度 ${num(loc.lat)} ／ 経度 ${num(loc.lng)}` + (loc.pref_code ? `　都道府県コード ${loc.pref_code}` : '');
  }
}

$('place-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('form-error').textContent = '';
  const body = {};
  TEXT_FIELDS.forEach((k) => { body[k] = $(`f-${k}`).value; });
  BOOL_FIELDS.forEach((k) => { body[k] = $(`f-${k}`).checked; });
  body.address = $('f-address').value;
  body.lat = $('f-lat').value;
  body.lng = $('f-lng').value;
  body.pref_code = $('f-pref_code').value;

  const id = $('f-id').value;
  try {
    if (id) await api(`/api/places/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    else await api('/api/places', { method: 'POST', body: JSON.stringify(body) });
    closeForm();
    await loadPlaces();
  } catch (err) {
    $('form-error').textContent = err.message;
  }
});

// ============================================================
// 地図ピッカー（ZENRIN 静止画地図をサーバー経由で表示）
//   ブラウザはZENRINと直接通信せず、自サーバーの /api/staticmap から
//   地図画像を取得して表示する（CORS・プロキシ問題を回避）。
//   中心＝選択地点。地図クリックでその位置を中心に移動。
// ============================================================
let pick = { address: '', lat: null, lng: null, pref_code: null };
let zoom = 15;
let curObjUrl = null;
const DEFAULT_LATLNG = { lat: 35.681406, lng: 139.767132 }; // 東京駅（初期中心）
const TILE = 256;

function mapStatus(msg) { $('picker-error').textContent = msg; if (msg) console.log('[map] ' + msg); }

// Webメルカトルのピクセル⇔緯度経度変換（ズームz、タイル256基準）
const lngToX = (lng, z) => (lng + 180) / 360 * TILE * Math.pow(2, z);
const latToY = (lat, z) => { const s = Math.sin(lat * Math.PI / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TILE * Math.pow(2, z); };
const xToLng = (x, z) => x / (TILE * Math.pow(2, z)) * 360 - 180;
const yToLat = (y, z) => { const n = Math.PI - 2 * Math.PI * y / (TILE * Math.pow(2, z)); return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); };

document.querySelectorAll('[data-close-picker]').forEach((b) => b.addEventListener('click', () => { $('picker-modal').hidden = true; }));

$('btn-pick').addEventListener('click', () => {
  mapStatus('');
  $('picker-modal').hidden = false;
  const fLat = parseFloat($('f-lat').value), fLng = parseFloat($('f-lng').value);
  const start = (!isNaN(fLat) && !isNaN(fLng)) ? { lat: fLat, lng: fLng } : DEFAULT_LATLNG;
  pick = {
    address: $('f-address').value || '',
    lat: start.lat, lng: start.lng,
    pref_code: $('f-pref_code').value ? parseInt($('f-pref_code').value, 10) : null,
  };
  zoom = 15;
  updatePickDisplay();
  renderMap();
});

// 地図画像を取得して表示（pick.lat/lng を中心に）
async function renderMap() {
  const wrap = $('map-wrap');
  const W = Math.round(wrap.clientWidth) || 600, H = Math.round(wrap.clientHeight) || 380;
  try {
    const res = await fetch(`/api/staticmap?lng=${pick.lng}&lat=${pick.lat}&zoom=${zoom}&w=${W}&h=${H}`, {
      headers: getToken() ? { 'Authorization': 'Bearer ' + getToken() } : {},
      cache: 'no-store',
    });
    if (res.status === 401) { clearToken(); closePickerAndForm(); show('login'); return; }
    if (!res.ok) { mapStatus('⚠ 地図取得エラー: ' + (await res.text())); return; }
    const blob = await res.blob();
    if (curObjUrl) URL.revokeObjectURL(curObjUrl);
    curObjUrl = URL.createObjectURL(blob);
    $('map-img').src = curObjUrl;
    mapStatus('');
  } catch (err) {
    mapStatus('⚠ 地図取得に失敗しました: ' + err.message);
  }
}

// 地図クリック → クリック地点を新しい中心に
$('map-img').addEventListener('click', (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const dx = (e.clientX - rect.left) - rect.width / 2;
  const dy = (e.clientY - rect.top) - rect.height / 2;
  const cx = lngToX(pick.lng, zoom) + dx;
  const cy = latToY(pick.lat, zoom) + dy;
  pick.lng = +xToLng(cx, zoom).toFixed(6);
  pick.lat = +yToLat(cy, zoom).toFixed(6);
  updatePickDisplay();
  renderMap();
  reverseGeocode();
});

// ズーム
$('btn-zoom-in').addEventListener('click', () => { zoom = Math.min(20, zoom + 1); renderMap(); });
$('btn-zoom-out').addEventListener('click', () => { zoom = Math.max(5, zoom - 1); renderMap(); });

// 中心点の住所を逆引きして表示に反映
async function reverseGeocode() {
  try {
    const { items } = await api(`/api/geocode?lng=${pick.lng}&lat=${pick.lat}`);
    const best = pickMostDetailed(items);
    if (best) { pick.address = best.address; pick.pref_code = best.pref_code; }
  } catch { /* 住所が取れなくても座標は有効 */ }
  updatePickDisplay();
}

// 住所検索（フォワードジオコーディング）
$('btn-search').addEventListener('click', searchAddress);
$('pick-address').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchAddress(); } });

async function searchAddress() {
  const word = $('pick-address').value.trim();
  if (!word) return;
  mapStatus('');
  try {
    const { hit, items } = await api(`/api/geocode?word=${encodeURIComponent(word)}`);
    if (!hit || !items.length) {
      mapStatus('該当する住所が見つかりませんでした。地図をクリックして指定してください。');
      return;
    }
    const top = items[0]; // ヒットした最上位（番地まで出なければ出た階層まで）
    pick.address = top.address;
    pick.pref_code = top.pref_code;
    pick.lat = top.lat;
    pick.lng = top.lng;
    zoom = 16;
    updatePickDisplay();
    renderMap();
  } catch (err) {
    mapStatus(err.message);
  }
}

function updatePickDisplay() {
  $('pick-addr').textContent = pick.address || '(住所未取得)';
  $('pick-coord').textContent = `緯度 ${num(pick.lat)} ／ 経度 ${num(pick.lng)}` + (pick.pref_code ? `　都道府県コード ${pick.pref_code}` : '');
}

// 「この地点で登録する」→ フォームへ反映して閉じる
$('btn-confirm-loc').addEventListener('click', () => {
  if (pick.lat == null || pick.lng == null) { $('picker-error').textContent = '地点が未確定です。'; return; }
  setFormLocation({ address: pick.address, lat: pick.lat, lng: pick.lng, pref_code: pick.pref_code });
  $('picker-modal').hidden = true;
});

// ============================================================
// 起動時：ログイン状態を確認
// ============================================================
(async function init() {
  try {
    const { loggedIn } = await api('/api/me');
    if (loggedIn) await enterApp();
    else show('login');
  } catch {
    show('login');
  }
})();
