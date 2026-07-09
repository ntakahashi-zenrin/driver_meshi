/**
 * meal_posts コレクションに不足している属性を追加するスクリプト。
 * place_id / lat / lng / image_id_2 / image_id_3 が存在しなければ作成する。
 *
 * 実行（プロジェクト直下から）:
 *   node --env-file=.env setup/add_meal_posts_fields.mjs
 */

const EP  = process.env.APPWRITE_ENDPOINT;    // http://localhost/v1
const PID = process.env.APPWRITE_PROJECT_ID;  // driver-meshi
const KEY = process.env.APPWRITE_API_KEY;
const DB  = process.env.APPWRITE_DATABASE_ID || 'main';
const COL = 'meal_posts';

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PID,
  'X-Appwrite-Key': KEY,
};

async function api(method, path, body) {
  const res = await fetch(`${EP}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${json.message || JSON.stringify(json)}`);
  return json;
}

// 追加すべき属性
const ATTRS = [
  {
    endpoint: `/databases/${DB}/collections/${COL}/attributes/string`,
    key: 'image_id_2',
    body: { key: 'image_id_2', size: 255, required: false, default: '' },
  },
  {
    endpoint: `/databases/${DB}/collections/${COL}/attributes/string`,
    key: 'image_id_3',
    body: { key: 'image_id_3', size: 255, required: false, default: '' },
  },
  {
    endpoint: `/databases/${DB}/collections/${COL}/attributes/string`,
    key: 'place_id',
    body: { key: 'place_id', size: 255, required: false, default: '' },
  },
  {
    endpoint: `/databases/${DB}/collections/${COL}/attributes/float`,
    key: 'lat',
    body: { key: 'lat', required: false, min: -90, max: 90 },
  },
  {
    endpoint: `/databases/${DB}/collections/${COL}/attributes/float`,
    key: 'lng',
    body: { key: 'lng', required: false, min: -180, max: 180 },
  },
];

async function main() {
  // 現在の属性一覧を取得
  const col = await api('GET', `/databases/${DB}/collections/${COL}`);
  const existingKeys = new Set(col.attributes.map(a => a.key));
  console.log('既存の属性:', [...existingKeys].join(', '));
  console.log();

  for (const attr of ATTRS) {
    if (existingKeys.has(attr.key)) {
      console.log(`スキップ（既存）: ${attr.key}`);
      continue;
    }
    process.stdout.write(`追加中: ${attr.key} ... `);
    try {
      await api('POST', attr.endpoint, attr.body);
      console.log('完了');
    } catch (e) {
      console.log('エラー:', e.message);
    }
  }

  console.log('\n完了しました。');
  console.log('Appwrite が属性を構築するまで 30 秒ほどかかります。');
  console.log('少し待ってから http://localhost:5173 で投稿を試してください。');
}

main().catch(console.error);
