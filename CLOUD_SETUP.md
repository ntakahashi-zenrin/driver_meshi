# クラウド環境セットアップガイド（VPS / Linux）

このガイドは、AWS・GCP・Azure などの **Linux VPS（Ubuntu 22.04 推奨）** に
ドライバー飯SNSのAppwrite環境を構築するための手順書です。

---

## 渡すファイル一覧

以下のファイル・フォルダをまとめて渡してください。

```
driver_meshi/
├── appwrite/
│   ├── docker-compose.yml       ✅ 渡す（Mailhog を削除してから渡す ※後述）
│   └── .env.example             ✅ 渡す（テンプレート。実際の .env は渡さない）
├── backoffice/                  ✅ 渡す（店舗マスター管理バックオフィス）
│   ├── server.mjs
│   ├── package.json
│   ├── package-lock.json
│   ├── public/
│   │   ├── index.html
│   │   ├── app.js
│   │   └── style.css
│   └── .env.example             ✅ 渡す（テンプレート。.env は渡さない）
├── setup/
│   ├── appwrite.json            ✅ 渡す（DBコレクションのスキーマ定義）
│   ├── create-places-local.mjs  ✅ 渡す（店舗コレクション作成スクリプト）
│   ├── add_meal_posts_fields.mjs ✅ 渡す（飯投稿コレクションフィールド追加）
│   ├── add_hidden_field.mjs     ✅ 渡す（非表示フィールド追加）
│   ├── seed_sample_data.mjs     ✅ 渡す（サンプルデータ投入）
│   └── .env.example             ✅ 渡す（テンプレート。.env.local は渡さない）
├── web/
│   ├── src/                     ✅ 渡す
│   ├── public/                  ✅ 渡す
│   ├── package.json             ✅ 渡す
│   ├── package-lock.json        ✅ 渡す
│   ├── vite.config.js           ✅ 渡す
│   ├── index.html               ✅ 渡す
│   ├── Dockerfile               ✅ 渡す（Dockerでwebを動かす場合に使用）
│   └── .env.example             ✅ 渡す（テンプレート。.env.local は渡さない）
├── docker-compose.yml           ✅ 渡す（webフロントをDockerで動かす場合に使用）
├── .env.example                 ✅ 渡す（上記docker-compose用テンプレート）
├── DATA_MODEL.md                ✅ 渡す
├── truck_driver_meshi_kikakusho.md  ✅ 渡す
└── CLOUD_SETUP.md               ✅ このファイル

渡してはいけないもの（秘密情報・不要データ）：
├── appwrite/.env                ❌ 渡さない（秘密情報が含まれる）
├── appwrite/appwrite/           ❌ 渡さない（ローカルのデータ）
├── backoffice/.env              ❌ 渡さない（ZENRINキー・APIキーが含まれる）
├── setup/.env.local             ❌ 渡さない（APIキーが含まれる）
├── web/.env.local               ❌ 渡さない（接続情報が含まれる）
├── .env                         ❌ 渡さない（接続情報が含まれる）
└── web/node_modules/            ❌ 渡さない（自動生成される）
```

> **秘密情報の共有について：** `.env` の内容（DBパスワード、OpenSSLキー等）を渡す必要がある場合は、メール・チャットには貼らず、パスワードマネージャーや対面で共有してください。

---

## docker-compose.yml から Mailhog を削除する

ローカル開発用の **Mailhog**（ダミーSMTP）は本番環境には不要です。
渡す前に、`appwrite/docker-compose.yml` の末尾にある以下の部分を削除してください。

```yaml
# ↓ この mailhog セクション全体を削除する
  mailhog:
    image: mailhog/mailhog:v1.0.1
    container_name: appwrite-mailhog
    restart: unless-stopped
    networks:
      - appwrite
    ports:
      - 8025:8025
```

---

## セットアップ手順（受け取り側の作業）

### 前提条件

- Ubuntu 22.04 LTS（推奨）
- RAM 4GB 以上
- ポート 80 / 443 が開いていること（セキュリティグループ・ファイアウォールで許可）
- （任意）独自ドメインとDNS設定

### ステップ1：Docker のインストール

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
# 一度ログアウト→ログインし直して反映させる
```

確認：
```bash
docker --version
docker compose version
```

### ステップ2：Node.js のインストール（フロントエンド用）

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # v20.x.x が表示されればOK
```

### ステップ3：ファイルを配置する

受け取ったファイルをサーバーにアップロードし、任意のフォルダに置きます。

```bash
# 例: ホームディレクトリに配置
mkdir -p ~/driver_meshi
# （ファイルをここにアップロードする）
cd ~/driver_meshi
```

### ステップ4：Appwrite の .env を作成する

```bash
cp appwrite/.env.example appwrite/.env
nano appwrite/.env  # または vi で編集
```

**最低限変更が必要な項目：**

| 変数名 | 変更内容 |
|---|---|
| `_APP_OPENSSL_KEY_V1` | `openssl rand -hex 32` の出力に変更 |
| `_APP_DOMAIN` | サーバーのドメインまたはIPアドレス |
| `_APP_DOMAIN_TARGET` | 同上 |
| `_APP_DOMAIN_TARGET_A` | サーバーのパブリックIPアドレス |
| `_APP_DB_PASS` | 強固なパスワードに変更 |
| `_APP_DB_ROOT_PASS` | 強固なパスワードに変更 |
| `_APP_EXECUTOR_SECRET` | `openssl rand -hex 32` の出力に変更 |
| `_APP_SMTP_HOST` など | 実際のSMTP情報（Gmail等）を設定 |

ランダム文字列の生成：
```bash
openssl rand -hex 32
```

### ステップ5：Appwrite を起動する

```bash
cd ~/driver_meshi
docker compose -f appwrite/docker-compose.yml up -d
```

起動完了まで **2〜5分** かかります。

確認：
```bash
docker compose -f appwrite/docker-compose.yml ps
# すべてのコンテナが "running" または "healthy" になればOK
```

ブラウザで `http://サーバーIP` を開き、Appwriteのコンソール画面が出ればOKです。

### ステップ6：Appwrite コンソールで初期設定

1. `http://サーバーIP` を開く
2. 管理者アカウントを作成
3. 新しいプロジェクトを作成（プロジェクトIDを `driver-meshi` に設定）
4. 左メニュー → **Databases** → データベース `main` を作成
5. 左メニュー → **Storage** → バケット `media` を作成
6. `DATA_MODEL.md` の仕様に従ってコレクション（テーブル）を作成

### ステップ7：DB コレクション（テーブル）をスクリプトで作成する

Appwriteのコレクション（DB構造）はスクリプトで自動作成できます。

#### 7-1. Node.js がインストール済みであることを確認

```bash
node --version  # v18 以上であればOK
```

#### 7-2. セットアップ用の接続情報ファイルを作成

```bash
cp setup/.env.example setup/.env.local
nano setup/.env.local
```

入力する内容：

| 項目 | 値 |
|---|---|
| `APPWRITE_ENDPOINT` | `http://サーバーIP/v1` |
| `APPWRITE_PROJECT_ID` | `driver-meshi`（コンソールで確認） |
| `APPWRITE_API_KEY` | Appwriteコンソールで発行したAPIキー（下記参照） |

**APIキーの発行方法：**
1. Appwriteコンソール（`http://サーバーIP`）にログイン
2. プロジェクト → 左メニュー「Overview」→「API Keys」→「Create API key」
3. 名前を適当に入力（例：setup-key）
4. 権限：`databases.read` / `databases.write` / `collections.read` / `collections.write` / `attributes.read` / `attributes.write` / `indexes.read` / `indexes.write` を選択
5. 発行されたキーを `APPWRITE_API_KEY` に貼り付け

#### 7-3. スクリプトを順番に実行

```bash
cd ~/driver_meshi

# 1. 店舗データ（places）コレクションを作成
node setup/create-places-local.mjs

# 2. 飯投稿コレクションにフィールドを追加
node --env-file=.env setup/add_meal_posts_fields.mjs

# 3. 非表示フィールド（hidden）を追加
node --env-file=.env setup/add_hidden_field.mjs
```

> ※ コマンドの `--env-file=.env` は `appwrite/.env` ではなく、プロジェクト直下の `.env` を指します。別途 `cp appwrite/.env .env` でコピーするか、環境変数を直接セットしてください。

スクリプトが「完了しました」と表示されれば成功です。

#### 7-4. （任意）サンプルデータを投入する

動作確認用のサンプル投稿・ユーザーを入れたい場合：

```bash
node --env-file=.env setup/seed_sample_data.mjs
```

### ステップ9：フロントエンドの .env.local を作成する

```bash
cp web/.env.example web/.env.local
nano web/.env.local
```

`VITE_APPWRITE_ENDPOINT` に実際のサーバーURL、`VITE_APPWRITE_PROJECT_ID` にコンソールで確認したIDを入力します。

### ステップ10：フロントエンドを起動する

開発用サーバーとして起動する場合：

```bash
cd ~/driver_meshi/web
npm install
npm run dev -- --host 0.0.0.0
```

起動後、`http://サーバーIP:5173` でアクセスできます。
※ セキュリティグループ/ファイアウォールでポート `5173` も開ける必要があります。

### ステップ11：バックオフィス（店舗マスター管理）を起動する

バックオフィスは店舗データの追加・編集・管理用ツールです。
ZENRIN Maps API を使って地図上で店舗位置を確認・登録できます。

#### 11-1. 接続情報ファイルを作成

```bash
cp backoffice/.env.example backoffice/.env
nano backoffice/.env
```

入力する項目：

| 項目 | 内容 |
|---|---|
| `ADMIN_PASSWORD` | 管理画面ログイン用パスワード（自由に設定） |
| `ZENRIN_CLIENT_ID` | ZENRIN Maps API の client_id |
| `ZENRIN_CLIENT_SECRET` | ZENRIN Maps API の client_secret |
| `ZENRIN_API_KEY` | ZENRIN Maps API のAPIキー |
| `APPWRITE_API_KEY` | Appwrite の APIキー（ステップ7と同じもので可） |

クラウド環境では以下も追記してください：
```
APPWRITE_ENDPOINT=http://サーバーIP/v1
```

#### 11-2. 起動

```bash
cd ~/driver_meshi/backoffice
npm install
npm start
```

起動後、`http://サーバーIP:8787` でアクセスできます。
※ セキュリティグループ/ファイアウォールでポート `8787` を開けてください。
  （外部公開せず、社内や VPN 越しのアクセスに限定することを推奨します）

---

## 起動・停止コマンド一覧

```bash
# 起動
docker compose -f appwrite/docker-compose.yml up -d

# 停止（データは保持）
docker compose -f appwrite/docker-compose.yml stop

# ログ確認
docker compose -f appwrite/docker-compose.yml logs -f appwrite

# ⚠️ 絶対に使わない（全データが消える）
# docker compose -f appwrite/docker-compose.yml down -v
```

---

## アクセス先

| 用途 | URL |
|---|---|
| アプリ本体 | http://サーバーIP:5173 |
| Appwrite 管理コンソール | http://サーバーIP |

---

## よくある問題

### Appwriteが起動しない

→ ポート80が他のプロセスで使われていないか確認：
```bash
sudo ss -tlnp | grep :80
```

### フロントからAppwriteに接続できない

→ `web/.env.local` の `VITE_APPWRITE_ENDPOINT` が正しいか確認してください。
プロキシ（vite.config.js）はローカル用設定のため、クラウドでは `VITE_APPWRITE_ENDPOINT` を明示的に指定する必要があります。

### メールが届かない

→ `appwrite/.env` のSMTP設定を確認。Gmailの場合はアプリパスワードが必要です。
