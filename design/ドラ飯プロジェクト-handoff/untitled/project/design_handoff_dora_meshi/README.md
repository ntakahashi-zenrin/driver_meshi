# Handoff: トラックドライバー飯（ドラ飯）全画面デザイン

## Overview

トラックドライバーが仕事中に出会った飯・SA/PA・地元グルメを投稿し、飯をきっかけにドライバー本人のプロフィールや仕事風景にも興味を持ってもらうSNSアプリ。

**コンセプト：走る、食べる、つながる。**

---

## About the Design Files

`ドラ飯_画面一覧.dc.html` は **デザインリファレンス（HTMLプロトタイプ）** です。  
このファイルをそのまま本番コードとして使うのではなく、**既存の React + Tailwind + Appwrite 環境（`src/` 以下）でこのデザインを再実装してください。**

元のFigma Make出力（`src/app/components/`）が実装の土台になります。このREADMEで記述する新規画面・変更点を既存コンポーネントに追加・修正してください。

---

## Fidelity

**High-fidelity（高忠実度）**：ピクセルレベルで色・タイポグラフィ・スペーシング・インタラクションが定義されています。既存コードベースのライブラリ・パターンを使って忠実に再現してください。

---

## Design Tokens

### Colors
| 用途 | 値 |
|------|-----|
| プライマリオレンジ | `#ff6b35` |
| オレンジソフト背景 | `#fff7ed`（orange-50） |
| オレンジボーダー | `#fed7aa`（orange-200） |
| グリーン（大型車OK） | `#16a34a` |
| グリーン背景 | `#f0fdf4`（green-50） |
| テキスト（メイン） | `#111827`（gray-900） |
| テキスト（サブ） | `#6b7280`（gray-500） |
| テキスト（ミュート） | `#9ca3af`（gray-400） |
| ボーダー | `#e5e7eb`（gray-200） |
| 背景（画面） | `#f9fafb`（gray-50） |
| 背景（カード） | `#ffffff` |
| いいね（赤） | `#ef4444`（red-400） |
| ギャラリーバッジ | `#2563eb`（blue-600） |

### Typography
- **フォント**: `-apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif`
- **見出し（画面タイトル）**: 18px / font-medium
- **アプリ名**: 21px / text-[#ff6b35]
- **投稿タイトル**: 18px / font-bold
- **本文**: 14–15px / font-normal
- **メタ情報**: 12–13px / text-gray-500
- **タグ・バッジ**: 11–12px / font-medium

### Spacing / Layout
- **カード内パディング**: 12–16px
- **画面パディング**: 16px
- **カード間マージン**: 8px（`mb-2`）
- **角丸（カード）**: 16px（`rounded-2xl`）
- **角丸（ボタン）**: 24px（`rounded-full`）、12px（`rounded-xl`）

### Shadows
- カード: `box-shadow: 0 2px 8px rgba(0,0,0,.06)`
- 投稿ボタン（＋）: `shadow-md`

---

## Screens / Views

各フレームの `画面ID · ComponentName` は `src/app/App.tsx` の `Screen` 型に対応します。

---

### 1. `login` · LoginScreen（ログインモード）

**目的**: メール・パスワードでのログイン

**レイアウト**:
- ヘッダー: 戻るボタン（左）＋「ログイン」タイトル
- コンテンツ: padding 20–24px
  - h2「ログイン」+ サブテキスト（オレンジ）
  - メールアドレス入力フィールド
  - パスワード入力フィールド（8文字以上）
  - 「ログイン」ボタン（#ff6b35、rounded-xl、full-width）
  - 「新規登録」リンク（テキストリンク、オレンジ）
  - 「パスワードをお忘れの方」リンク（追加、オレンジ）

**インタラクション**:
- フォーム送信 → `onLogin(user)` コールバック → `mypage` へ遷移
- 「新規登録」タップ → 同画面で register モードへ切り替え
- 「パスワードをお忘れの方」→ `forgot-password` 画面へ

---

### 2. `login (register)` · LoginScreen（新規登録モード）

**目的**: 新規ドライバー登録

**レイアウト**:
- ヘッダー: 戻るボタン＋「ログイン」タイトル（画面名はそのまま）
- h2「新規登録」＋「ドライバーとして登録します。入力は最小限、あとは選ぶだけ。」

**フィールド（すべて border-gray-300 rounded-lg）**:
- メールアドレス（type="email"）
- パスワード（type="password"、8文字以上）
- ニックネーム（placeholder: 例：関西便のタカ）
- 車種・ボディタイプ（select）: 大型ウイング / トレーラー / 4t冷凍車 / 中型平ボディ / 軽貨物 / その他
- 運行スタイル（select）: 長距離 / 地場配送 / 中距離 / ルート配送
- 主な走行エリア（select）: 関東〜関西 / 関東地場 / 東北 / 中部 / 関西 / 九州 / 港・湾岸エリア / 全国

**ボタン**: 「登録する」（#ff6b35、rounded-xl、full-width、16px font-bold）

---

### 3. `forgot-password` · ForgotPasswordScreen【NEW】

**目的**: パスワード再設定メールの送信

**レイアウト**:
- ヘッダー: 戻るボタン＋「ログイン」タイトル
- 中央アイコン: 🔒 ロック（w-20 h-20 bg-orange-50 rounded-full 内に lock アイコン、#ff6b35）
- h2「パスワードをお忘れですか？」（中央揃え）
- 説明文（中央揃え、text-gray-500）
- メールアドレス入力フィールド
- 「再設定メールを送る」ボタン（#ff6b35）
- 「ログインに戻る」リンク（#ff6b35）

**送信完了状態（同画面内で状態切り替え）**:
- グリーンの確認カード（bg-green-50 border-green-200 rounded-xl）
- ✅ メールチェックアイコン（bg-green-100 / text-green-600）
- 「メールを送信しました」+ 送信先メールアドレス表示
- 「ログインに戻る」リンク

**インタラクション**:
- 「再設定メールを送る」タップ → API呼び出し → 送信完了状態へ切り替え
- `forgot-password` は `login` からの遷移先として `App.tsx` の `Screen` 型に追加する

---

### 4. `feed` · FeedTimeline

**目的**: アプリのメイン画面。飯写真を大きく見せ、投稿者のドライバー情報を強調

**ヘッダー**:
- 左: 「トラックドライバー飯」（21px、#ff6b35）
- 右: 通知ベルアイコン（未読ドット：w-2 h-2 #ff6b35）

**フィルタータブ（横スクロール、border-b-2アクティブ表示）**:
`おすすめ` / `フォロー中` / `SA・PA` / `デカ盛り` / `大型車OK`
- アクティブ: `border-[#ff6b35] text-[#ff6b35]`
- 非アクティブ: `border-transparent text-gray-600`

**投稿カード構成**:
1. カードヘッダー: アバター（w-10 h-10 rounded-full）＋名前＋メタ（車種｜エリア）＋フォローボタン
2. 写真カルーセル（aspect-ratio: 4/3、複数枚対応、ドット＋枚数バッジ）
3. カードボディ: メニュー名 / 店名 / 価格＋場所 / 大型車OKバッジ / タグ / いいね・コメントボタン

**フォロー中タブ（mockFollowing）**:
- 投稿タイプラベル: 「ドライバー飯」（orange-50）/ 「ギャラリー更新」（blue-50）/ 「バッジ獲得」（yellow-50）
- ドライバー飯: 4/3写真＋店情報
- ギャラリー: 16/9写真＋キャプション → タップで `gallery-detail` へ遷移
- バッジ獲得: 黄色グラデーションカード

---

### 5. `post-detail` · PostDetailScreen

**目的**: 飯投稿の詳細表示とコメント

**レイアウト**:
- ヘッダー: 戻る（左）＋シェア（右）
- 写真カルーセル（4/3）
- 投稿者行: アバター＋名前＋フォローボタン
- 店情報: メニュー名（18px bold）/ 店名 / 価格＋場所 / 大型車OKバッジ / 本文コメント / タグ
- アクションバー: ❤️いいね（タップでトグル、fill時#ff6b35）＋💬コメント数
- コメント一覧（最初3件→「すべて見る」ボタン）
- 固定コメント入力バー（下部sticky）

---

### 6. `gallery-detail` · GalleryDetailScreen【NEW】

**目的**: ギャラリー投稿（風景・トラック・仕事風景）の詳細表示

**ヘッダー**:
- 左: 戻るボタン
- 中央: 「ギャラリー」バッジ（bg-blue-50 text-blue-600、image アイコン付き）
- 右: シェアボタン

**写真表示**: aspect-ratio 16/9（横長）、枚数バッジ付き

**投稿者行**: アバター＋名前（車種｜エリア）＋フォローボタン

**コンテンツ**:
- キャプションテキスト（14–16px、text-gray-800、leading-relaxed）
- 投稿日時（12px、gray-400）

**アクションバー**:
- ❤️ いいね（飯詳細と同様）
- 💬 コメント
- 🔖 **保存ボタン**（bookmark アイコン＋「保存」テキスト）← ギャラリー固有

**コメント・入力バー**: 飯詳細と同構造

**遷移元**:
- フォロー中タイムライン（ギャラリー更新カード）→ タップで `gallery-detail`
- ドライバープロフィール（ギャラリータブ）→ タップで `gallery-detail`

---

### 7. `search` · SearchScreen

**状態1（初期）**: 検索バー＋最近の検索履歴（localStorage）＋よく検索されるキーワード（タグチップ）

**状態2（結果表示）**: タブ（すべて/ユーザー/投稿）＋ハイライト付き結果一覧

---

### 8. `notifications` · NotificationScreen

**セクション**:
- 新着（未読、bg-orange-50/40 背景）
- 過去の通知（既読、白背景）

**通知タイプ**: follow（gray）/ like（orange）/ comment（orange）/ reply（green）  
バッジアイコンはアバター右下に絶対配置（w-5 h-5 border-2 border-white rounded-full）

---

### 9. `favorites` · FavoritesScreen【UPDATED: タブ追加】

**タブ構成（画面上部タブバー）**:
- `ドライバー飯` タブ（デフォルト）
- `ギャラリー` タブ

**ドライバー飯タブ**:
- タグフィルター（横スクロールチップ）
- コンパクトカード: サムネイル（w-24 h-24 rounded-xl）＋店名・メニュー・価格・場所・大型車OKバッジ
- フッター: 投稿者アバター＋名前＋保存日時＋いいね・コメント数＋保存解除（×ボタン）

**ギャラリータブ**:
- タグフィルターなし（ギャラリーにはタグ概念なし）
- カード: 16:9サムネイル（全幅）＋「ギャラリー」バッジ（blue-600、左上）＋保存解除ボタン（右上）
- フッター: キャプション（14px）＋投稿者アバター＋名前＋保存日時＋いいね・コメント数

**保存の仕組み**:
- 飯投稿とギャラリー投稿は別コレクションで管理推奨
- タブ切り替えで各コレクションを取得

---

### 10. `post` · PostScreen（ドライバー飯を投稿）

**フォーム**:
- 写真スロット（最大3枚、1枚目が表紙）
- メニュー名（必須）/ 店名 / 場所 / 金額
- 大型車OKトグル（スイッチUI）
- タグ選択（複数選択可）: デカ盛り / 深夜飯 / 朝定食 / 長距離 / 地元飯 / SA・PA / ラーメン / 定食 / 駐車場広め / 大型車OK

---

### 11. `gallery-post` · GalleryPostScreen（ギャラリー投稿）

**フォーム**:
- 写真スロット（最大3枚）
- コメント（textarea、3行）

---

### 12. `driver-profile` · DriverProfile（他者プロフィール）

**構成**:
- メインビジュアル（横長 h-48、gradient オーバーレイ）
- アバター（w-24 h-24 rounded-full border-4 border-white、-mt-8 で重ねる）
- ニックネーム / 投稿数・フォロワー・いいね統計 / 肩書き / 一言 / タグ（#ff6b35 orange-50）
- タブ: プロフィール / 飯投稿 / ギャラリー
- プロフィールタブ: ドライバー情報カード / 飯の好みカード / バッジカード / アクティビティタイムライン
- 飯投稿タブ: 3カラムグリッド（square）
- ギャラリータブ: 3カラムグリッド（square）

---

### 13. `mypage` · DriverProfile（自分のプロフィール）

`driver-profile` と同じコンポーネント（`isOwnProfile=true`）。差分:
- ヘッダー: 「マイページ」＋設定アイコン（右）
- フォローボタン → 「編集する」ボタン（border-gray-300）

---

### 14. `profile-edit` · ProfileEditScreen

- 背景写真エリア（h-44、カメラアイコンオーバーレイ）
- アバター写真（-bottom-12 left-4 に絶対配置）
- フォーム: ニックネーム / 自己紹介（textarea）/ 車種 / 運行スタイル / 走行エリア

---

### 15. `settings` · MyPageSettings

**2つの状態を実装してください**:

**状態A: 画像未設定**
- ユーザーカード（bg-orange-100 文字アバター＋名前・メール・役職）
- ボタン: 「自分のプロフィールを見る →」（border-orange-500）＋「ログアウト」

**状態B: 画像設定済み（要実装）**
- ユーザーカードが写真背景（background-image: cover photo + rgba(0,0,0,0.46) オーバーレイ）
- アバター写真（w-16 h-16 rounded-full、border-white）を中央表示
- 名前・メール・役職を白文字で表示
- ボタン: 「自分のプロフィールを見る →」（rgba(255,255,255,0.9)）＋「ログアウト」（rgba(255,255,255,0.7)）

**メニューセクション**（共通）:
- アカウント: プロフィール編集 / フォローリスト / アカウント設定 / プライバシー設定
- サポート: FAQ / 利用規約 / プライバシーポリシー
- ログアウト（full-width、赤・bg-red-50 border-red-200）

---

### 16. `following-list` · FollowingListScreen

- ヘッダー: 「フォロー中」＋人数バッジ（#ff6b35）
- ドライバー一覧: アバター（w-12）＋名前・車種・エリア・投稿数＋「フォロー中」ボタン（gray border）

---

### 17. オーバーレイ: `showPostOptions`（投稿種別選択ボトムシート）

**トリガー**: 下部ナビの ＋ ボタンタップ

**構成**:
- 暗幕（rgba(0,0,0,0.40)）
- ボトムシート（rounded-t-2xl、白）
  - タイトル「何を投稿しますか？」
  - 「ドライバー飯を投稿」（utensils アイコン、#ff6b35 サークル、bg-orange-50）→ `post` 画面へ
  - 「ギャラリーに投稿」（image アイコン、gray サークル、bg-gray-50）→ `gallery-post` 画面へ
  - 「キャンセル」（テキストボタン）

---

## Interactions & Behavior

### 画面遷移フロー
```
login ──────────────────→ mypage
      └── register mode
      └── forgot-password
            └── (メール送信完了状態)

feed ──→ post-detail（飯）
     ──→ gallery-detail（ギャラリー）【NEW】
     ──→ driver-profile
     ──→ notifications
     ──→ [+ボタン] showPostOptions overlay
               ├─→ post
               └─→ gallery-post

favorites（ドライバー飯タブ）【DEFAULT】
favorites（ギャラリータブ）【NEW TAB】
     → gallery-detail（タップで詳細）

mypage ──→ settings
             ├─→ profile-edit
             └─→ following-list
```

### いいねのトグル挙動
- タップでトグル（liked/unliked）
- liked状態: `fill-[#ff6b35] text-[#ff6b35]`
- カウント: liked時+1、unliked時-1

### 保存（お気に入り）
- 飯詳細: ハートボタンで保存 → favorites ドライバー飯タブに追加
- ギャラリー詳細: bookmarkボタンで保存 → favorites ギャラリータブに追加

### フォロートグル
- 「フォローする」（#ff6b35 bg）→ 「フォロー中」（white bg、orange border）

---

## State Management

### App.tsx に追加が必要な Screen 型
```typescript
type Screen = 
  | 'feed' | 'search' | 'post' | 'gallery-post' | 'favorites'
  | 'mypage' | 'login' | 'settings' | 'following-list'
  | 'post-detail' | 'gallery-detail'  // ← NEW
  | 'profile-edit' | 'driver-profile'
  | 'notifications' | 'forgot-password';  // ← NEW
```

### FavoritesScreen の状態追加
```typescript
type FavoritesTab = 'food' | 'gallery';  // NEW
const [activeTab, setActiveTab] = useState<FavoritesTab>('food');
```

### GalleryDetailScreen の状態
```typescript
const [liked, setLiked] = useState(false);
const [saved, setSaved] = useState(false);
const [likeCount, setLikeCount] = useState(89);
const [commentText, setCommentText] = useState('');
```

---

## New Components to Create

| コンポーネント | ファイルパス | 元ファイル参考 |
|----------------|-------------|----------------|
| `ForgotPasswordScreen` | `src/app/components/ForgotPasswordScreen.tsx` | `LoginScreen.tsx` ベース |
| `GalleryDetailScreen` | `src/app/components/GalleryDetailScreen.tsx` | `PostDetailScreen.tsx` ベース |

### GalleryDetailScreen との差分（PostDetailScreen比較）
- ❌ 店名・価格・場所 → なし
- ❌ 大型車OKバッジ → なし
- ✅ 写真: aspect-ratio 16/9（4/3ではなく横長）
- ✅ ヘッダー中央: 「ギャラリー」バッジ
- ✅ アクションバー: bookmark（保存）ボタンを追加
- ✅ キャプション: larger text（16px）、leading-relaxed

---

## Assets

| 素材 | 使用箇所 | 出典 |
|------|----------|------|
| 食事写真（mockデータ） | フィードカード・お気に入り | Unsplash（実装時は Appwrite Storage に差し替え） |
| 風景写真（mockデータ） | ギャラリー・プロフィールメインビジュアル | Unsplash（同上） |
| ドライバーアバター | 各所 | Unsplash（同上） |
| lucide-react | アイコン全般 | `npm i lucide-react`（既存） |

---

## Files in This Package

| ファイル | 説明 |
|----------|------|
| `ドラ飯_画面一覧.dc.html` | 全画面のHTMLプロトタイプ（デザインリファレンス） |
| `README.md` | このドキュメント |

---

## Notes for Developer

1. **元のFigma Make出力（`src/app/components/`）** が既存13画面の実装ベースです。新規2画面（`GalleryDetailScreen` / `ForgotPasswordScreen`）を追加し、`FavoritesScreen` にタブを追加してください。

2. **オレンジカラー**: Figma Make出力は `#ff6b35`、Claude Code実装側は `#F4661E` になっています。**`#ff6b35` に統一する**ことを推奨します。

3. **ギャラリーの保存**: ギャラリー投稿への「いいね」「コメント」「保存」機能はまだ未実装です。お気に入りタブの「ギャラリー」はFigma Makeの `FavoritesScreen.tsx` に `tab` 状態を追加して対応してください。

4. **Appwrite Storage**: モックデータのUnsplash URLは開発確認用です。本番は Appwrite Storage の URL に差し替えてください。

5. **POC段階**: 細部は変わる可能性があります。大きな構造変更は相談してから実装してください。
