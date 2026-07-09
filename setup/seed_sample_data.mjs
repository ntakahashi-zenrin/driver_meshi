// プロトタイプの3人とその飯投稿・ギャラリー投稿をサンプル投入する。
// 使い方: プロジェクト直下で  node setup/seed_sample_data.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- .env 読み込み ---
const env = {};
for (const line of readFileSync(join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim();
}
const EP = env.APPWRITE_ENDPOINT;
const DB = env.APPWRITE_DATABASE_ID;
const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': env.APPWRITE_PROJECT_ID,
  'X-Appwrite-Key': env.APPWRITE_API_KEY,
};

// 投稿日時（新しい順に見えるよう少しずつずらす）
const now = Date.now();
const hoursAgo = (h) => new Date(now - h * 3600 * 1000).toISOString();

async function upsertDoc(collection, docId, data) {
  // 既存なら一旦消してから作り直す（再実行できるように）
  await fetch(`${EP}/databases/${DB}/collections/${collection}/documents/${docId}`, {
    method: 'DELETE', headers,
  }).catch(() => {});
  const res = await fetch(`${EP}/databases/${DB}/collections/${collection}/documents`, {
    method: 'POST', headers,
    body: JSON.stringify({ documentId: docId, data, permissions: ['read("any")'] }),
  });
  const status = res.status;
  const body = await res.json().catch(() => ({}));
  const ok = status === 201;
  console.log(`  ${ok ? 'OK' : '⚠️ ' + status} ${collection}/${docId}${ok ? '' : ' : ' + (body.message || '')}`);
  return ok;
}

// ---------------- drivers ----------------
const drivers = [
  {
    id: 'taka', user_id: 'taka', nickname: '関西便のタカ',
    avatar_id: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop',
    cover_id: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=440&h=192&fit=crop',
    body_type: '大型ウイング', run_style: '長距離', area: '関東〜関西', years: 12,
    bio: '大型車OKの食堂と深夜ラーメンを中心に投稿しています。',
    fav_genres: ['デカ盛り', 'ラーメン', '定食'],
    fav_places: ['SA・PA', '幹線道路沿い'],
    priorities: ['大型車OK', '深夜営業'],
    badges: ['デカ盛りハンター', 'SA・PAマスター', '大型車OK発掘隊', '深夜飯職人'],
  },
  {
    id: 'yu', user_id: 'yu', nickname: '地場めしユウ',
    avatar_id: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop',
    cover_id: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=440&h=192&fit=crop',
    body_type: '4t冷凍車', run_style: '地場配送', area: '関東地場', years: 7,
    bio: '関東の地場便。朝定食と地元の食堂めしが好きです。',
    fav_genres: ['朝定食', '定食', '地元飯'],
    fav_places: ['幹線道路沿い', '地元の食堂'],
    priorities: ['駐車場広め', '早朝OK'],
    badges: ['朝飯マスター', '地元飯案内人'],
  },
  {
    id: 'yakei', user_id: 'yakei', nickname: '夜景トレーラー',
    avatar_id: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop',
    cover_id: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=440&h=192&fit=crop',
    body_type: 'トレーラー', run_style: '長距離', area: '港・湾岸エリア', years: 15,
    bio: '港・湾岸を走るトレーラー乗務員。深夜飯と夜景を投稿します。',
    fav_genres: ['ラーメン', '深夜飯'],
    fav_places: ['港・工場地帯', 'SA・PA'],
    priorities: ['深夜営業', '大型車OK'],
    badges: ['夜景ドライバー', '深夜飯職人', 'ラーメン運行者'],
  },
];

// ---------------- meal_posts ----------------
const meals = [
  {
    id: 'meal_taka_1', driver_id: 'taka',
    image_id: 'https://images.unsplash.com/photo-1582281298055-e25b84a30b0b?w=440&h=319&fit=crop',
    dish: 'デカ盛り唐揚げ定食', shop: '海老名SA 下り', price: 1280, location: '神奈川県海老名市',
    oogata_ok: true, amenities: ['大型車OK', '駐車場広め', '深夜営業'],
    genres: ['長距離', 'デカ盛り', '深夜飯'], comment: '大型駐車場あり、深夜でも助かる一杯。',
    created_at: hoursAgo(2),
  },
  {
    id: 'meal_yu_1', driver_id: 'yu',
    image_id: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=440&h=319&fit=crop',
    dish: '朝定食セット', shop: '食堂まつり', price: 780, location: '埼玉県川口市',
    oogata_ok: false, amenities: ['駐車場広め', '早朝OK'],
    genres: ['朝定食', '地元飯'], comment: '早朝から開いていて助かる、安定の朝定食。',
    created_at: hoursAgo(8),
  },
  {
    id: 'meal_yakei_1', driver_id: 'yakei',
    image_id: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=440&h=319&fit=crop',
    dish: '特製味噌ラーメン', shop: '湾岸ラーメン 夜王', price: 950, location: '東京都江東区',
    oogata_ok: true, amenities: ['大型車OK', '深夜営業'],
    genres: ['ラーメン', '深夜飯'], comment: '深夜の湾岸で食べる濃厚味噌。沁みる。',
    created_at: hoursAgo(4),
  },
];

// ---------------- gallery_posts ----------------
const galleries = [
  {
    id: 'gal_taka_1', driver_id: 'taka',
    image_id: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=408&h=221&fit=crop',
    caption: '朝焼けの荷下ろし前。今日も一日よろしくお願いします。', created_at: hoursAgo(12),
  },
  {
    id: 'gal_yakei_1', driver_id: 'yakei',
    image_id: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=408&h=221&fit=crop',
    caption: '深夜2時の湾岸線。今日も安全運転で行きます。', created_at: hoursAgo(5),
  },
];

console.log('=== drivers ===');
for (const d of drivers) {
  const { id, ...data } = d;
  await upsertDoc('drivers', id, data);
}
console.log('=== meal_posts ===');
for (const m of meals) {
  const { id, ...data } = m;
  await upsertDoc('meal_posts', id, data);
}
console.log('=== gallery_posts ===');
for (const g of galleries) {
  const { id, ...data } = g;
  await upsertDoc('gallery_posts', id, data);
}
console.log('完了。');
