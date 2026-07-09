# トラックドライバー飯 SNS — 新サーバー構築手順書

このファイルを読みながら上から順に作業してください。  
**所要時間の目安：30〜45分**（Dockerのダウンロードが済んでいれば）

---

## 前提条件の確認

- Docker Desktop（またはDocker Engine）が起動していること
- サーバーに接続してコマンドが実行できること
- ブラウザでサーバーの `http://サーバーIPアドレス` が開ける環境であること

---

## STEP 1：Appwrite を起動する

サーバー上で作業用フォルダを作り、Appwriteを起動します。

```bash
# 作業フォルダを作る（名前はなんでもよい）
mkdir driver-meshi-server
cd driver-meshi-server

# Appwriteをインストール（Dockerが起動している状態で実行）
docker run -it --rm \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
  --entrypoint="install" \
  appwrite/appwrite:1.9.0
```

> **Windowsサーバーの場合：** `$(pwd)` の代わりに `${PWD}` を使ってください。  
> PowerShell: `${PWD}/appwrite:/usr/src/code/appwrite:rw`

インストール中にいくつか質問が出ます。以下を参考に回答してください：

| 質問 | 入力内容 |
|------|---------|
| HTTP port | `80`（そのままEnter） |
| HTTPS port | `443`（そのままEnter） |
| サーバーのホスト名(hostname) | サーバーのIPアドレス or ドメイン名 |
| 暗号化キー(_APP_OPENSSL_KEY_V1) | ランダムな文字列32文字以上（例: パスワード生成ツールで生成） |
| Executor Secret | ランダムな文字列32文字以上（上と別の値） |

> ⚠️ 暗号化キーはどこかにメモしておいてください。後で必要になる場合があります。  
> ⚠️ GitやSlackなど他人の目に触れる場所には絶対に貼らないでください。

インストール完了後、ブラウザで `http://サーバーのIPアドレス` を開くとAppwriteの画面が表示されます。  
（初回起動は2〜3分かかることがあります。表示されなければ少し待ってからリロードしてください）

---

## STEP 2：管理者アカウントとプロジェクトを作る

ブラウザで Appwrite コンソール（`http://サーバーのIPアドレス`）を開きます。

1. **「Create account」**で管理者アカウントを作成する  
   （メールアドレスとパスワードを設定。以後このアカウントでログイン）

2. **「Create project」**をクリック

3. 以下のように入力する：

   | 項目 | 入力値 |
   |------|-------|
   | Project name | トラックドライバー飯 |
   | **Project ID** | **`driver-meshi`** ← この通りに入力してください |

   > Project ID を `driver-meshi` にすることで、フロントエンドの設定変更が不要になります。

4. 「Create」をクリック → プロジェクトのダッシュボードが開けばOK

---

## STEP 3：Appwrite CLI をインストールする

CLIを使うと、コレクション（データの入れ物）の設定をコマンド1つで自動作成できます。  
**作業はサーバーではなく、CLIを動かせる手元のPCで行います。**

### Node.js がインストールされているPCの場合

```bash
npm install -g appwrite-cli
```

### その他の方法

公式インストーラーを使う場合：  
https://appwrite.io/docs/tooling/command-line/installation

インストール後、バージョン確認：
```bash
appwrite --version
```
`5.x.x` または `4.x.x` が表示されればOK。

---

## STEP 4：CLIをサーバーに接続する

```bash
appwrite client \
  --endpoint http://サーバーのIPアドレス/v1 \
  --projectId driver-meshi
```

> `http://サーバーのIPアドレス/v1` の部分は実際のIPアドレスに書き換えてください。  
> 例: `--endpoint http://192.168.1.100/v1`

次に、コンソールで作った管理者アカウントでログインします：

```bash
appwrite login
```

メールアドレスとパスワードを聞かれるので入力してください。

---

## STEP 5：コレクションとストレージを自動作成する

このリポジトリの `setup/` フォルダにある `appwrite.json` を使って、  
データベースのテーブル（コレクション）と画像保管庫（ストレージ）を一括作成します。

```bash
# setup/ フォルダに移動（リポジトリのルートから）
cd setup

# データベースを作成
appwrite databases create \
  --databaseId main \
  --name main

# コレクション（テーブル）を一括デプロイ
appwrite deploy collection --all

# ストレージバケット（画像保管庫）を一括デプロイ
appwrite deploy bucket --all
```

エラーなく完了したら、Appwriteコンソールの「Databases」を開いてコレクションが8種類（drivers・meal_posts・gallery_posts・follows・likes・comments・notifications・places）作成されていることを確認してください。

> `places`（場所マスター）は、飯投稿で「地図で場所を選ぶ」と1件ずつ溜まっていく店舗・スポットの台帳です。
> 重複の整理や項目の補完は、当面この **Appwriteコンソールの「Databases」→「places」** 画面で管理者が直接行います。

---

## STEP 6：環境変数ファイルを作る

プロジェクトのルートフォルダ（`web/` や `setup/` と同じ階層）に `.env.example` というファイルが入っています。  
これをコピーして `.env` という名前で保存し、IPアドレスを書き換えてください：

```
VITE_APPWRITE_ENDPOINT=http://サーバーのIPアドレス/v1  ← ここだけ書き換える
VITE_APPWRITE_PROJECT_ID=driver-meshi
VITE_APPWRITE_DATABASE_ID=main
VITE_APPWRITE_BUCKET_ID=media
```

例：`VITE_APPWRITE_ENDPOINT=http://192.168.1.100/v1`

---

## STEP 7：Appwriteにフロントエンドのアドレスを登録する

AppwriteはセキュリティのためWebアプリがどこから接続してくるかをあらかじめ登録する必要があります。

1. Appwriteコンソール（`http://サーバーのIPアドレス`）を開く
2. 左メニューの **「Overview」** をクリック
3. 下の方にある **「Platforms」** セクションの **「Add platform」** をクリック
4. **「Web App」** を選ぶ
5. 以下のように入力して「Next」→「Skip optional steps」で完了：

   | 項目 | 入力値 |
   |------|-------|
   | Name | driver-meshi-web（なんでもよい） |
   | Hostname | サーバーのIPアドレス（例: `192.168.1.100`） |

---

## STEP 8：フロントエンドをDockerで起動する

プロジェクトのルートフォルダで以下を実行します：

```bash
docker compose up -d
```

これだけでフロントエンドがDockerコンテナとして起動します。  
起動後、ブラウザで `http://サーバーのIPアドレス:5173` を開いてください。  
新規ユーザー登録ができること、投稿できることを確認してください。

> 停止するときは `docker compose down` を実行してください。

---

## トラブルシューティング

### 「コレクションが既に存在する」エラーが出た場合
一度デプロイしようとして途中で止まった場合など。  
Appwriteコンソールから該当のコレクションを手動で削除してから再実行してください。

### ブラウザから `http://サーバーのIPアドレス` が開けない場合
- サーバーのファイアウォールでポート80・5173が開放されているか確認してください
- Dockerが起動しているか `docker ps` で確認してください

### CLIのloginでエラーになる場合
AppwriteコンソールのURLと、`appwrite client --endpoint` に指定したURLが一致しているか確認してください。`/v1` を忘れずに。

### `docker compose up` でエラーになる場合
`.env` ファイルがプロジェクトのルートフォルダ（`docker-compose.yml` と同じ場所）にあるか確認してください。  
`.env.example` をコピーして `.env` という名前にしていない場合、読み込まれません。

### ログインできるのに投稿や写真のアップロードが失敗する場合
STEP 7 の「Platforms」登録が抜けている可能性があります。  
Appwriteコンソールの「Overview」→「Platforms」でフロントエンドのアドレスが登録されているか確認してください。

---

## 完了後のメモ（チームに共有してください）

| 項目 | 値 |
|------|---|
| Appwrite コンソール | `http://サーバーのIPアドレス` |
| アプリURL | `http://サーバーのIPアドレス:5173` |
| Project ID | `driver-meshi` |
| Database ID | `main` |
| Bucket ID | `media` |
