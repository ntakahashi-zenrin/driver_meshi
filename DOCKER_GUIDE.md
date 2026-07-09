# Docker 環境ガイド（ドライバー飯SNS ローカル開発用）

このドキュメントは、すでに構築済みの Docker 環境を**他のメンバーが引き継いで使う**ための手順です。

---

## 構成概要

| コンテナ名 | 役割 | アクセス先 |
|---|---|---|
| Appwrite（複数） | バックエンド（DB・認証・ストレージ） | http://localhost |
| appwrite-mailhog | ローカル用メール受信サーバー（開発専用） | http://localhost:8025 |
| appwrite-traefik | リバースプロキシ（ポート80/443） | — |
| appwrite-mariadb | データベース（MariaDB） | — |
| appwrite-redis | キャッシュ（Redis） | — |

フロントエンド（React/Vite）は Docker の外で動かします。

---

## 前提

- **Docker Desktop が起動していること**（必須）
- **Node.js がインストール済みであること**（フロントエンド用）
- フォルダの場所：`C:\Users\n_takahashi\claude-code\driver_meshi`（または共有を受けたパス）

---

## 起動手順

### 1. Docker Desktop を起動する

タスクバーのクジラアイコンが「Running」になっていることを確認してください。

### 2. Appwrite（バックエンド）を起動する

PowerShell またはターミナルで以下を実行します。

```powershell
docker compose -f appwrite\docker-compose.yml up -d
```

起動完了まで **1〜3分** かかります。

確認方法：ブラウザで http://localhost を開き、Appwrite のログイン画面が出ればOKです。

### 3. フロントエンド（Webアプリ）を起動する

別のターミナルで以下を実行します。

```powershell
cd web
npm run dev
```

起動後、ブラウザで http://localhost:5173 を開くとアプリが表示されます。

---

## 停止手順

### フロントエンドの停止

`npm run dev` を実行しているターミナルで `Ctrl + C` を押す。

### Appwrite（バックエンド）の停止

```powershell
docker compose -f appwrite\docker-compose.yml stop
```

> ⚠️ `docker compose down -v` は**データがすべて消えます**。絶対に使わないでください。
> 停止するときは必ず `stop` を使ってください。

---

## 主なアクセス先

| 用途 | URL |
|---|---|
| アプリ本体 | http://localhost:5173 |
| Appwrite 管理コンソール | http://localhost |
| テスト用メール受信（Mailhog） | http://localhost:8025 |

---

## メール送信について（開発環境の注意点）

この環境では、メール送信に **Mailhog**（ダミーSMTPサーバー）を使っています。

- **実際のメールアドレスには届きません**
- 送信されたメールはすべて http://localhost:8025 で確認できます
- パスワードリセットのメールもここに届きます

本番環境に移行する際は、実際のSMTPサービス（Gmail など）に切り替えが必要です。

---

## ログイン情報

Appwrite 管理コンソール（http://localhost）のアカウントは、
環境構築時に設定した管理者アカウントを使ってください。

アプリのテスト用ユーザーは、http://localhost:5173 の「新規登録」から作成できます。

---

## トラブル対応

### アプリが表示されない（localhost:5173）

→ `npm run dev` が実行中か確認してください。

### Appwriteの管理画面が開かない（localhost）

→ Docker Desktop が起動しているか確認後、以下で再起動してください。

```powershell
docker compose -f appwrite\docker-compose.yml restart
```

### メールが届かない（パスワードリセット等）

→ http://localhost:8025（Mailhog）を確認してください。実際のメールボックスではなくここに届きます。

---

## 環境の設定ファイル

| ファイル | 内容 |
|---|---|
| `appwrite\.env` | Appwrite の秘密情報（SMTPパスワード等）。Git管理外 |
| `web\.env.local` | フロントエンドの接続情報。Git管理外 |
| `appwrite\docker-compose.yml` | Docker 構成定義 |

> ⚠️ `.env` ファイルは Git にコミットしないでください（`.gitignore` 設定済み）。
> 共有が必要な場合は、別途安全な方法（パスワードマネージャー等）で渡してください。
