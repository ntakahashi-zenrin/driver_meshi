/**
 * meal_posts / gallery_posts / places / comments コレクションに hidden（ブール）フィールドを追加するスクリプト。
 * hidden=true にした投稿はタイムライン・検索・場所検索から非表示になるが、
 * 投稿者本人のプロフィール画面では引き続き表示される（shadow ban 仕様）。
 * comments の hidden はすべてのユーザーに対して非表示（投稿者本人も含む）。
 *
 * 実行（プロジェクト直下から）:
 *   node --env-file=.env setup/add_hidden_field.mjs
 */

const EP  = process.env.APPWRITE_ENDPOINT;
const PID = process.env.APPWRITE_PROJECT_ID;
const KEY = process.env.APPWRITE_API_KEY;
const DB  = process.env.APPWRITE_DATABASE_ID || 'main';

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

const COLLECTIONS = ['meal_posts', 'gallery_posts', 'places', 'comments'];

async function main() {
  for (const col of COLLECTIONS) {
    console.log(`\n=== ${col} ===`);

    // 現在の属性一覧を確認
    const info = await api('GET', `/databases/${DB}/collections/${col}`);
    const existingKeys = new Set(info.attributes.map(a => a.key));
    const existingIndexes = new Set((info.indexes || []).map(i => i.key));

    // hidden 属性
    if (existingKeys.has('hidden')) {
      console.log('  スキップ（既存）: hidden 属性');
    } else {
      process.stdout.write('  追加中: hidden 属性 ... ');
      try {
        await api('POST', `/databases/${DB}/collections/${col}/attributes/boolean`, {
          key: 'hidden',
          required: false,
          default: false,
        });
        console.log('完了');
      } catch (e) {
        console.log('エラー:', e.message);
      }
    }

    // hidden 用インデックス（クエリに必要）
    const idxKey = 'idx_hidden';
    if (existingIndexes.has(idxKey)) {
      console.log(`  スキップ（既存）: インデックス ${idxKey}`);
    } else {
      process.stdout.write(`  追加中: インデックス ${idxKey} ... `);
      try {
        await api('POST', `/databases/${DB}/collections/${col}/indexes`, {
          key: idxKey,
          type: 'key',
          attributes: ['hidden'],
          orders: ['ASC'],
        });
        console.log('完了');
      } catch (e) {
        console.log('エラー:', e.message);
      }
    }
  }

  console.log('\n完了しました。');
  console.log('Appwrite が属性・インデックスを構築するまで 30〜60 秒かかります。');
  console.log('その後 http://localhost:5173 でタイムラインを確認してください。');
  console.log('\n非表示にしたいドキュメントは Appwrite コンソールで hidden を true に設定してください。');
  console.log('http://localhost → Databases → main → (コレクション) → ドキュメントを選択 → hidden: true');
}

main().catch(console.error);
