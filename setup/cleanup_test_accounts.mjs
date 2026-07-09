// テスト用アカウントとそのデータ（フォロー・いいね・プロフィール）を一括削除する。
// 本人アカウント(KEEP_EMAIL)とサンプル3人(taka/yu/yakei)は残す。
// 使い方: node setup/cleanup_test_accounts.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));

const KEEP_EMAIL = 'n_takahashi@zenrin-datacom.net'; // 本人アカウントは残す
const KEEP_DRIVERS = ['taka', 'yu', 'yakei'];

const env = {};
for (const line of readFileSync(join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim();
}
const EP = env.APPWRITE_ENDPOINT, DB = env.APPWRITE_DATABASE_ID;
const H = { 'Content-Type': 'application/json', 'X-Appwrite-Project': env.APPWRITE_PROJECT_ID, 'X-Appwrite-Key': env.APPWRITE_API_KEY };
const q = (o) => encodeURIComponent(JSON.stringify(o));
const getJSON = async (u) => (await fetch(u, { headers: H })).json();
const del = async (u) => (await fetch(u, { method: 'DELETE', headers: H })).status;

const users = await getJSON(`${EP}/users?queries[]=${q({ method: 'limit', values: [200] })}`);
const testUsers = (users.users || []).filter((u) => u.email !== KEEP_EMAIL);
console.log('削除対象ユーザー:', testUsers.map((u) => u.email).join(', ') || '(なし)');

for (const u of testUsers) {
  const id = u.$id;
  // フォロー記録（follower_id = この人）
  const fl = await getJSON(`${EP}/databases/${DB}/collections/follows/documents?queries[]=${q({ method: 'equal', attribute: 'follower_id', values: [id] })}`);
  for (const f of fl.documents || []) await del(`${EP}/databases/${DB}/collections/follows/documents/${f.$id}`);
  // いいね（user_id = この人）
  const lk = await getJSON(`${EP}/databases/${DB}/collections/likes/documents?queries[]=${q({ method: 'equal', attribute: 'user_id', values: [id] })}`);
  for (const l of lk.documents || []) await del(`${EP}/databases/${DB}/collections/likes/documents/${l.$id}`);
  // お気に入り（user_id = この人）
  const fav = await getJSON(`${EP}/databases/${DB}/collections/favorites/documents?queries[]=${q({ method: 'equal', attribute: 'user_id', values: [id] })}`);
  for (const f of fav.documents || []) await del(`${EP}/databases/${DB}/collections/favorites/documents/${f.$id}`);
  // ドライバープロフィール（サンプル以外）
  if (!KEEP_DRIVERS.includes(id)) await del(`${EP}/databases/${DB}/collections/drivers/documents/${id}`).catch(() => {});
  // 飯投稿（この人が投稿したもの）
  const mp = await getJSON(`${EP}/databases/${DB}/collections/meal_posts/documents?queries[]=${q({ method: 'equal', attribute: 'driver_id', values: [id] })}`);
  for (const m of mp.documents || []) await del(`${EP}/databases/${DB}/collections/meal_posts/documents/${m.$id}`);
  // アカウント本体
  console.log('  削除:', u.email, '(', await del(`${EP}/users/${id}`), ')');
}
console.log('完了。');
