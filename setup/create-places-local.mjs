// ============================================================
// places コレクションをローカルAppwriteに作成するスクリプト
//   - setup/appwrite.json の "places" 定義をそのまま使います
//   - APIキーは setup/.env.local の APPWRITE_API_KEY から読みます
//     （このファイルはGit管理外。キーはチャットや共有先に貼らないこと）
//   実行: node setup/create-places-local.mjs
// ============================================================
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// --- 設定の読み込み（.env.local → 環境変数の順で探す） ---
function loadEnvLocal() {
  const p = join(here, '.env.local');
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}
const env = { ...loadEnvLocal(), ...process.env };

const ENDPOINT = (env.APPWRITE_ENDPOINT || 'http://localhost/v1').replace(/\/$/, '');
const PROJECT = env.APPWRITE_PROJECT_ID || 'driver-meshi';
const DATABASE = env.APPWRITE_DATABASE_ID || 'main';
const API_KEY = env.APPWRITE_API_KEY;

if (!API_KEY) {
  console.error('\n❌ APIキーが見つかりません。');
  console.error('   setup/.env.local に次の1行を書いてください：');
  console.error('   APPWRITE_API_KEY=（コンソールで発行したAPIキー）\n');
  process.exit(1);
}

// --- 共通リクエスト ---
async function req(method, path, body) {
  const res = await fetch(ENDPOINT + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': PROJECT,
      'X-Appwrite-Key': API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- places 定義を appwrite.json から取得 ---
const config = JSON.parse(readFileSync(join(here, 'appwrite.json'), 'utf8'));
const places = config.collections.find((c) => c.$id === 'places');
if (!places) { console.error('appwrite.json に places がありません'); process.exit(1); }

// permissions 文字列 'read("any")' を ["read", "any"] 形式へは変換不要（APIはそのまま受け取る）
const main = async () => {
  console.log(`接続先: ${ENDPOINT}  プロジェクト: ${PROJECT}  DB: ${DATABASE}\n`);

  // 1) コレクション作成
  console.log('① コレクション places を作成中...');
  let r = await req('POST', `/databases/${DATABASE}/collections`, {
    collectionId: places.$id,
    name: places.name,
    permissions: places.permissions,
    documentSecurity: places.documentSecurity,
    enabled: places.enabled,
  });
  if (r.ok) {
    console.log('   → 作成しました');
  } else if (r.status === 409) {
    console.log('   → すでに存在します（スキップ）');
  } else {
    console.error('   ✗ 失敗:', r.status, r.data?.message || r.data);
    process.exit(1);
  }

  // 2) 属性作成（型ごとにエンドポイントが違う）
  console.log('② 項目（属性）を作成中...');
  for (const a of places.attributes) {
    const base = `/databases/${DATABASE}/collections/${places.$id}/attributes`;
    let path, payload;
    const common = { key: a.key, required: a.required, array: !!a.array };
    if (!a.required && a.default !== undefined && a.default !== null) common.default = a.default;
    if (a.type === 'string') {
      path = `${base}/string`; payload = { ...common, size: a.size };
    } else if (a.type === 'integer') {
      path = `${base}/integer`; payload = { ...common, min: a.min, max: a.max };
    } else if (a.type === 'double') {
      path = `${base}/float`; payload = { ...common, min: a.min, max: a.max };
    } else if (a.type === 'boolean') {
      path = `${base}/boolean`; payload = { ...common };
    } else {
      console.warn(`   ? 未対応の型 ${a.type}（${a.key}）スキップ`); continue;
    }
    const rr = await req('POST', path, payload);
    if (rr.ok) console.log(`   ・${a.key} (${a.type}) 追加`);
    else if (rr.status === 409) console.log(`   ・${a.key} すでに存在（スキップ）`);
    else { console.error(`   ✗ ${a.key} 失敗:`, rr.status, rr.data?.message || rr.data); }
    await sleep(400); // 連続作成の負荷を避ける
  }

  // 3) 属性が available になるまで待機（インデックス作成の前提）
  console.log('③ 項目の準備完了を待っています...');
  const needed = places.attributes.map((a) => a.key);
  for (let i = 0; i < 30; i++) {
    const list = await req('GET', `/databases/${DATABASE}/collections/${places.$id}/attributes`);
    const attrs = list.data?.attributes || [];
    const ready = attrs.filter((x) => x.status === 'available').map((x) => x.key);
    if (needed.every((k) => ready.includes(k))) { console.log('   → 全項目 準備OK'); break; }
    await sleep(1000);
  }

  // 4) インデックス作成
  console.log('④ インデックスを作成中...');
  for (const idx of places.indexes || []) {
    const rr = await req('POST', `/databases/${DATABASE}/collections/${places.$id}/indexes`, {
      key: idx.key, type: idx.type, attributes: idx.attributes, orders: idx.orders || [],
    });
    if (rr.ok) console.log(`   ・${idx.key} (${idx.type}) 追加`);
    else if (rr.status === 409) console.log(`   ・${idx.key} すでに存在（スキップ）`);
    else console.error(`   ✗ ${idx.key} 失敗:`, rr.status, rr.data?.message || rr.data);
    await sleep(400);
  }

  console.log('\n✅ 完了しました。Appwriteコンソールの Databases → places を確認してください。');
};

main().catch((e) => { console.error('予期しないエラー:', e); process.exit(1); });
