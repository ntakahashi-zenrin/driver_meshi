#!/usr/bin/env bash
# DATA_MODEL.md に沿って Appwrite のデータベース・コレクション・ストレージを作成する。
# 使い方: プロジェクト直下で  bash setup/create_schema.sh
set -u

# --- .env 読み込み ---
ENV_FILE="$(dirname "$0")/../.env"
set -a; . "$ENV_FILE"; set +a

EP="$APPWRITE_ENDPOINT"
H_PROJ="X-Appwrite-Project: $APPWRITE_PROJECT_ID"
H_KEY="X-Appwrite-Key: $APPWRITE_API_KEY"
H_JSON="Content-Type: application/json"
DB="$APPWRITE_DATABASE_ID"

# 共通: API呼び出し（成功/既存はOK表示、その他はエラー本文を表示）
api() {  # $1=METHOD $2=PATH $3=BODY
  local method="$1" path="$2" body="${3:-}"
  local out code
  out=$(curl -s -w $'\n%{http_code}' -X "$method" "$EP$path" \
        -H "$H_PROJ" -H "$H_KEY" -H "$H_JSON" ${body:+--data-binary "$body"})
  code=$(printf '%s' "$out" | tail -n1)
  if [ "$code" = "201" ] || [ "$code" = "200" ] || [ "$code" = "202" ]; then
    # 202 = 受付（属性・索引は非同期作成のため202を返す）＝成功
    echo "  OK ($code)"
  elif [ "$code" = "409" ]; then
    echo "  既に存在 ($code) — スキップ"
  else
    echo "  ⚠️ 失敗 ($code): $(printf '%s' "$out" | sed '$d' | grep -oE '"message":"[^"]*"' | head -1)"
  fi
}

str()  { echo "  - 文字列 $2"; api POST "/databases/$DB/collections/$1/attributes/string"   "{\"key\":\"$2\",\"size\":$3,\"required\":$4}"; }
strA() { echo "  - 文字列(配列) $2"; api POST "/databases/$DB/collections/$1/attributes/string" "{\"key\":\"$2\",\"size\":$3,\"required\":false,\"array\":true}"; }
intg() { echo "  - 数値 $2"; api POST "/databases/$DB/collections/$1/attributes/integer"  "{\"key\":\"$2\",\"required\":$3}"; }
booln(){ echo "  - 真偽 $2"; api POST "/databases/$DB/collections/$1/attributes/boolean"  "{\"key\":\"$2\",\"required\":$3}"; }
dt()   { echo "  - 日時 $2"; api POST "/databases/$DB/collections/$1/attributes/datetime" "{\"key\":\"$2\",\"required\":false}"; }
idx()  { echo "  - 索引 $2 ($3)"; api POST "/databases/$DB/collections/$1/indexes" "{\"key\":\"$2\",\"type\":\"$3\",\"attributes\":$4,\"orders\":$5}"; }

coll() { # $1=id $2=name  (read=any, create=users, documentSecurityで所有者が編集/削除)
  echo "[コレクション] $1"
  api POST "/databases/$DB/collections" \
    "{\"collectionId\":\"$1\",\"name\":\"$2\",\"permissions\":[\"read(\\\"any\\\")\",\"create(\\\"users\\\")\"],\"documentSecurity\":true}"
}

echo "==================================================="
echo " データベース作成"
echo "==================================================="
api POST "/databases" "{\"databaseId\":\"$DB\",\"name\":\"Main\"}"

# ---------------- drivers ----------------
coll drivers drivers
str  drivers user_id   64 true
str  drivers nickname  100 true
str  drivers avatar_id 512 false
str  drivers cover_id  512 false
str  drivers body_type 50 false
str  drivers run_style 50 false
str  drivers area      50 false
intg drivers years     false
str  drivers bio       500 false
strA drivers fav_genres 50
strA drivers fav_places 50
strA drivers priorities 50
strA drivers badges     50

# ---------------- meal_posts ----------------
coll meal_posts meal_posts
str   meal_posts driver_id 64 true
str   meal_posts image_id  512 false
str   meal_posts dish      150 true
str   meal_posts shop      150 false
intg  meal_posts price     false
str   meal_posts location  150 false
booln meal_posts oogata_ok false
strA  meal_posts amenities 50
strA  meal_posts genres    50
str   meal_posts comment   1000 false
dt    meal_posts created_at

# ---------------- gallery_posts ----------------
coll gallery_posts gallery_posts
str  gallery_posts driver_id 64 true
str  gallery_posts image_id  512 false
str  gallery_posts caption   1000 false
dt   gallery_posts created_at

# ---------------- follows ----------------
coll follows follows
str  follows follower_id 64 true
str  follows followee_id 64 true
dt   follows created_at

# ---------------- likes ----------------
coll likes likes
str  likes user_id     64 true
str  likes target_type 20 true
str  likes target_id   64 true
dt   likes created_at

# ---------------- favorites（お気に入り保存） ----------------
coll favorites favorites
str  favorites user_id     64 true
str  favorites target_type 20 true
str  favorites target_id   64 true
dt   favorites created_at

echo ""
echo "属性の処理完了を待機中（15秒）..."
sleep 15

echo ""
echo "==================================================="
echo " 索引（インデックス）作成"
echo "==================================================="
idx drivers       idx_user_id     unique '["user_id"]'                          '["ASC"]'
idx meal_posts    idx_driver      key    '["driver_id"]'                        '["ASC"]'
idx meal_posts    idx_created     key    '["created_at"]'                       '["DESC"]'
idx gallery_posts idx_driver      key    '["driver_id"]'                        '["ASC"]'
idx gallery_posts idx_created     key    '["created_at"]'                       '["DESC"]'
idx follows       idx_follower    key    '["follower_id"]'                      '["ASC"]'
idx follows       idx_followee    key    '["followee_id"]'                      '["ASC"]'
idx follows       idx_pair        unique '["follower_id","followee_id"]'        '["ASC","ASC"]'
idx likes         idx_target      key    '["target_type","target_id"]'          '["ASC","ASC"]'
idx likes         idx_like_unique unique '["user_id","target_type","target_id"]' '["ASC","ASC","ASC"]'
idx favorites     idx_fav_user    key    '["user_id"]'                          '["ASC"]'
idx favorites     idx_fav_unique  unique '["user_id","target_id"]'              '["ASC","ASC"]'

echo ""
echo "==================================================="
echo " ストレージ（画像保存バケット）作成"
echo "==================================================="
echo "[バケット] $APPWRITE_BUCKET_ID"
api POST "/storage/buckets" \
  "{\"bucketId\":\"$APPWRITE_BUCKET_ID\",\"name\":\"media\",\"permissions\":[\"read(\\\"any\\\")\",\"create(\\\"users\\\")\"],\"fileSecurity\":true,\"maximumFileSize\":10000000,\"allowedFileExtensions\":[\"jpg\",\"jpeg\",\"png\",\"webp\",\"gif\"]}"

echo ""
echo "完了。"
