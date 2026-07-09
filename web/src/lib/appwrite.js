// Appwrite との接続と、画面から使うデータ操作をまとめたファイル。
import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from 'appwrite';

// 既定は同一オリジン + /v1（Viteプロキシ経由）。クロスオリジンによるセッション不安定を防ぐ。
// .env.local で VITE_APPWRITE_ENDPOINT を指定すればそちらを優先（本番URL等）。
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT
  || (typeof window !== 'undefined' ? window.location.origin + '/v1' : 'http://localhost/v1');
const PROJECT = import.meta.env.VITE_APPWRITE_PROJECT_ID;
export const DB = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const BUCKET = import.meta.env.VITE_APPWRITE_BUCKET_ID;

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT);
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID, Query, Permission, Role };

// 通知の重複送信防止キャッシュ（モジュールレベル）
// キー: recipientId:type:actorId:targetId → 最終送信時刻(ms)
const _notifCache = new Map();
const NOTIF_COOLDOWN_MS = 30_000; // 30秒以内の同一通知はスキップ

// 画像参照を表示用URLに変換する。
// http で始まれば外部URL（サンプルの仮画像）、それ以外はストレージのファイルIDとして扱う。
export function imageUrl(ref) {
  if (!ref) return '';
  if (typeof ref === 'string' && ref.startsWith('http')) return ref;
  return storage.getFileView(BUCKET, ref).toString();
}

// --- 認証 ---
export async function getCurrentUser() {
  try {
    return await account.get();
  } catch {
    // 無効・期限切れのセッションが残っていると「ログイン済みのつもりで実は無効」
    // という状態になり、保存などが失敗する。残骸を破棄してクリーンなログアウト状態にする。
    try { localStorage.removeItem('cookieFallback'); } catch { /* noop */ }
    return null;
  }
}

export async function login(email, password) {
  return account.createEmailPasswordSession(email, password);
}

export async function logout() {
  try {
    await account.deleteSession('current');
  } catch {
    /* セッションが無くてもOK */
  }
}

// パスワードリセット：再設定メールを送る
export async function createRecovery(email, redirectUrl) {
  return account.createRecovery(email, redirectUrl);
}

// パスワードリセット：メールのリンクから新パスワードを確定する
export async function updateRecovery(userId, secret, newPassword) {
  return account.updateRecovery(userId, secret, newPassword);
}

// 新規登録：アカウント作成 → ログイン → ドライバープロフィール作成
export async function register(email, password, profile) {
  const user = await account.create(ID.unique(), email, password, profile.nickname);
  await login(email, password);
  await createDriverProfile(user.$id, profile);
  return user;
}

// --- ドライバープロフィール ---
export async function createDriverProfile(userId, profile) {
  const ownerPerms = [
    Permission.read(Role.any()),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
  return databases.createDocument(DB, 'drivers', userId, {
    user_id: userId,
    nickname: profile.nickname,
    body_type: profile.body_type || '',
    run_style: profile.run_style || '',
    area: profile.area || '',
    years: profile.years ? Number(profile.years) : null,
    bio: profile.bio || '',
    fav_genres: [],
    fav_places: [],
    priorities: [],
    badges: [],
  }, ownerPerms);
}

export async function getDriver(userId) {
  try {
    return await databases.getDocument(DB, 'drivers', userId);
  } catch {
    return null;
  }
}

// 複数の user_id からドライバー情報をまとめて取得し、{user_id: driver} の辞書にする
export async function getDriversMap(userIds) {
  const map = {};
  const uniq = [...new Set(userIds)].filter(Boolean);
  if (uniq.length === 0) return map;
  const res = await databases.listDocuments(DB, 'drivers', [
    Query.equal('user_id', uniq),
    Query.limit(100),
  ]);
  for (const d of res.documents) map[d.user_id] = d;
  return map;
}

// --- 飯タイムライン（カーソルページネーション対応） ---
// cursor: 前回の最後の投稿$id。null なら先頭から取得。
export async function listMealTimeline(cursor = null) {
  const PAGE_SIZE = 20;
  const queries = [
    Query.notEqual('hidden', true),
    Query.orderDesc('created_at'),
    Query.limit(PAGE_SIZE),
  ];
  if (cursor) queries.push(Query.cursorAfter(cursor));
  const res = await databases.listDocuments(DB, 'meal_posts', queries);
  const posts = res.documents;
  const driversMap = await getDriversMap(posts.map((p) => p.driver_id));
  return {
    posts,
    driversMap,
    hasMore: posts.length === PAGE_SIZE,
    lastId: posts[posts.length - 1]?.$id ?? null,
  };
}

// --- 飯投稿の作成（写真は最大3枚。あればストレージへアップロード） ---
// files は File オブジェクトの配列（空でも可）。最大3枚まで処理する。
export async function createMealPost(userId, data, files = []) {
  const perms = [
    Permission.read(Role.any()),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
  const uploadFile = async (f) => {
    if (!f) return '';
    const up = await storage.createFile(BUCKET, ID.unique(), f, perms);
    return up.$id;
  };
  const [imageId, imageId2, imageId3] = await Promise.all([
    uploadFile(files[0] || null),
    uploadFile(files[1] || null),
    uploadFile(files[2] || null),
  ]);
  return databases.createDocument(DB, 'meal_posts', ID.unique(), {
    driver_id: userId,
    image_id: imageId,
    image_id_2: imageId2,
    image_id_3: imageId3,
    dish: data.dish,
    shop: data.shop || '',
    price: data.price ? Number(data.price) : null,
    location: data.location || '',
    place_id: data.place_id || '',
    lat: data.lat != null ? Number(data.lat) : null,
    lng: data.lng != null ? Number(data.lng) : null,
    oogata_ok: !!data.oogata_ok,
    amenities: data.amenities || [],
    genres: data.genres || [],
    comment: data.comment || '',
    created_at: new Date().toISOString(),
  }, perms);
}

export async function createGalleryPost(userId, caption, file) {
  const perms = [
    Permission.read(Role.any()),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
  const up = await storage.createFile(BUCKET, ID.unique(), file, perms);
  return databases.createDocument(DB, 'gallery_posts', ID.unique(), {
    driver_id: userId,
    image_id: up.$id,
    caption: caption.trim(),
    created_at: new Date().toISOString(),
  }, perms);
}

// --- 通知 ---
export async function createNotification(recipientId, type, actorId, targetId = '', targetType = '') {
  // サンプルデータのドライバー（taka/yakei/yu等）は本物のAppwriteアカウントではないためスキップ
  if (!recipientId || recipientId === actorId || recipientId.length < 15) return;

  // 30秒クールダウン（連打による高頻度DB書き込みを防ぐ第一層）
  const cacheKey = `${recipientId}:${type}:${actorId}:${targetId || ''}`;
  const lastSent = _notifCache.get(cacheKey);
  if (lastSent && Date.now() - lastSent < NOTIF_COOLDOWN_MS) return;
  _notifCache.set(cacheKey, Date.now());

  try {
    // 同一の（送信者×種類×対象）の通知が既に存在する場合はスキップ
    // 「削除して新規作成」にすると re-like/re-follow を繰り返すだけで
    // 毎回「たった今」通知を送り付けられるため、最初の1件のみ通知する。
    const existing = await databases.listDocuments(DB, 'notifications', [
      Query.equal('user_id', recipientId),
      Query.limit(100),
    ]).catch(() => ({ documents: [] }));
    const alreadyNotified = existing.documents.some(n =>
      n.type === type &&
      n.actor_id === actorId &&
      n.target_id === (targetId || '')
    );
    if (alreadyNotified) return;

    // Appwriteの制約: 作成者は自分以外のユーザーIDをPermissionに指定できない。
    // Role.users()（ログイン済み全員）にしてコレクション権限+クエリで本人のみ表示する。
    await databases.createDocument(DB, 'notifications', ID.unique(), {
      user_id: recipientId,
      type,
      actor_id: actorId,
      target_id: targetId || '',
      target_type: targetType || '',
      read: false,
      created_at: new Date().toISOString(),
    }, [
      Permission.read(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]);
  } catch (e) {
    // 作成失敗時はキャッシュを取り消して次回リトライを許可
    _notifCache.delete(cacheKey);
    console.error('[createNotification error]', e?.message, { recipientId, type, actorId });
  }
}

export async function getNotifications(userId) {
  const res = await databases.listDocuments(DB, 'notifications', [
    Query.equal('user_id', userId),
    Query.orderDesc('$createdAt'),
    Query.limit(50),
  ]);
  const items = res.documents;
  if (items.length === 0) return { items: [], driversMap: {}, postsMap: {} };
  const actorIds = [...new Set(items.map((n) => n.actor_id).filter(Boolean))];
  const driversMap = await getDriversMap(actorIds);
  const postIds = [...new Set(
    items.filter((n) => n.target_id && n.target_type === 'meal_post').map((n) => n.target_id)
  )];
  let postsMap = {};
  if (postIds.length > 0) {
    const pr = await databases.listDocuments(DB, 'meal_posts', [
      Query.equal('$id', postIds), Query.limit(100),
    ]).catch(() => ({ documents: [] }));
    for (const p of pr.documents) postsMap[p.$id] = p;
  }
  return { items, driversMap, postsMap };
}

export async function markNotificationRead(notifId) {
  return databases.updateDocument(DB, 'notifications', notifId, { read: true });
}

export async function markAllNotificationsRead(userId) {
  const res = await databases.listDocuments(DB, 'notifications', [
    Query.equal('user_id', userId),
    Query.limit(100),
  ]).catch(() => ({ documents: [] }));
  const unread = res.documents.filter((d) => !d.read);
  if (unread.length === 0) return 0;
  await Promise.all(
    unread.map((doc) =>
      databases.updateDocument(DB, 'notifications', doc.$id, { read: true }).catch(() => {})
    )
  );
  return unread.length;
}

export async function getUnreadNotificationCount(userId) {
  try {
    const res = await databases.listDocuments(DB, 'notifications', [
      Query.equal('user_id', userId),
      Query.limit(100),
    ]);
    return res.documents.filter((d) => !d.read).length;
  } catch { return 0; }
}

// --- フォロー（段階3） ---
// ログイン中ユーザーがフォローしている相手の user_id 一覧
export async function getFollowingIds(followerId) {
  const res = await databases.listDocuments(DB, 'follows', [
    Query.equal('follower_id', followerId),
    Query.limit(500),
  ]);
  return res.documents.map((d) => d.followee_id);
}

async function findFollow(followerId, followeeId) {
  const res = await databases.listDocuments(DB, 'follows', [
    Query.equal('follower_id', followerId),
    Query.equal('followee_id', followeeId),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

export async function follow(followerId, followeeId) {
  // すでにフォロー済みなら何もしない（連打・二重フォロー防止）
  const existing = await findFollow(followerId, followeeId);
  if (existing) return existing;
  const doc = await databases.createDocument(DB, 'follows', ID.unique(), {
    follower_id: followerId,
    followee_id: followeeId,
    created_at: new Date().toISOString(),
  }, [Permission.read(Role.any()), Permission.delete(Role.user(followerId))]);
  createNotification(followeeId, 'follow', followerId).catch(() => {});
  return doc;
}

export async function unfollow(followerId, followeeId) {
  const doc = await findFollow(followerId, followeeId);
  if (doc) await databases.deleteDocument(DB, 'follows', doc.$id);
}

export async function getFollowerCount(driverId) {
  const res = await databases.listDocuments(DB, 'follows', [
    Query.equal('followee_id', driverId),
    Query.limit(1),
  ]);
  return res.total;
}

// --- プロフィール画面用のまとめ取得（段階3） ---
// viewerId: 現在ログイン中のユーザーID。driverId と同じ場合は自分のプロフィール = hidden も表示。
// viewerId が異なる（他人閲覧）か未指定の場合は hidden=true を除外する。
export async function getProfileData(driverId, viewerId) {
  const isOwner = viewerId && viewerId === driverId;
  const hiddenFilter = isOwner ? [] : [Query.notEqual('hidden', true)];
  const [driver, postsRes, galleriesRes, followers] = await Promise.all([
    getDriver(driverId),
    databases.listDocuments(DB, 'meal_posts', [
      Query.equal('driver_id', driverId), ...hiddenFilter, Query.orderDesc('created_at'), Query.limit(50),
    ]),
    databases.listDocuments(DB, 'gallery_posts', [
      Query.equal('driver_id', driverId), ...hiddenFilter, Query.orderDesc('created_at'), Query.limit(50),
    ]),
    getFollowerCount(driverId),
  ]);
  return { driver, posts: postsRes.documents, galleries: galleriesRes.documents, followers };
}

// --- いいね（段階4） ---
// 指定した投稿IDたちへの「いいね」を一括取得（1クエリ）
export async function getLikesFor(targetIds) {
  const ids = [...new Set(targetIds)].filter(Boolean);
  if (ids.length === 0) return [];
  const res = await databases.listDocuments(DB, 'likes', [
    Query.equal('target_id', ids),
    Query.limit(2000),
  ]);
  return res.documents;
}

// お気に入り一覧 = 自分がハート（いいね）した飯投稿。保存日時の新しい順。
export async function getLikedPostsData(userId) {
  const likeRes = await databases.listDocuments(DB, 'likes', [
    Query.equal('user_id', userId),
    Query.equal('target_type', 'meal_post'),
    Query.orderDesc('created_at'),
    Query.limit(200),
  ]);
  const likes = likeRes.documents;
  if (likes.length === 0) return { items: [], driversMap: {} };
  const postsRes = await databases.listDocuments(DB, 'meal_posts', [
    Query.equal('$id', likes.map((l) => l.target_id)), Query.limit(200),
  ]);
  const visiblePosts = postsRes.documents.filter((p) => !p.hidden);
  const postMap = {};
  for (const p of visiblePosts) postMap[p.$id] = p;
  const driversMap = await getDriversMap(visiblePosts.map((p) => p.driver_id));
  const items = likes.filter((l) => postMap[l.target_id]).map((l) => ({ post: postMap[l.target_id], savedAt: l.created_at }));
  return { items, driversMap };
}

export async function getLikedGalleriesData(userId) {
  const likeRes = await databases.listDocuments(DB, 'likes', [
    Query.equal('user_id', userId),
    Query.equal('target_type', 'gallery_post'),
    Query.orderDesc('created_at'),
    Query.limit(200),
  ]);
  const likes = likeRes.documents;
  if (likes.length === 0) return { items: [], driversMap: {} };
  const galRes = await databases.listDocuments(DB, 'gallery_posts', [
    Query.equal('$id', likes.map((l) => l.target_id)), Query.limit(200),
  ]);
  const visibleGals = galRes.documents.filter((g) => !g.hidden);
  const galMap = {};
  for (const g of visibleGals) galMap[g.$id] = g;
  const driversMap = await getDriversMap(visibleGals.map((g) => g.driver_id));
  const items = likes.filter((l) => galMap[l.target_id]).map((l) => ({ gallery: galMap[l.target_id], savedAt: l.created_at }));
  return { items, driversMap };
}

export async function likeTarget(userId, targetType, targetId, ownerId) {
  // すでにいいね済みなら何もしない（連打・二重いいね防止）
  const existing = await databases.listDocuments(DB, 'likes', [
    Query.equal('user_id', userId),
    Query.equal('target_id', targetId),
    Query.limit(1),
  ]).catch(() => ({ documents: [] }));
  if (existing.documents.length > 0) return existing.documents[0];
  const doc = await databases.createDocument(DB, 'likes', ID.unique(), {
    user_id: userId, target_type: targetType, target_id: targetId,
    created_at: new Date().toISOString(),
  }, [Permission.read(Role.any()), Permission.delete(Role.user(userId))]);
  if (ownerId) createNotification(ownerId, 'like', userId, targetId, targetType).catch(() => {});
  return doc;
}

export async function unlikeTarget(userId, targetId) {
  const res = await databases.listDocuments(DB, 'likes', [
    Query.equal('user_id', userId),
    Query.equal('target_id', targetId),
    Query.limit(1),
  ]);
  if (res.documents[0]) await databases.deleteDocument(DB, 'likes', res.documents[0].$id);
}

// --- コメント ---
export async function addComment(postId, driverId, text, postOwnerId, targetType = 'meal_post') {
  const doc = await databases.createDocument(DB, 'comments', ID.unique(), {
    post_id: postId, driver_id: driverId, text,
    created_at: new Date().toISOString(),
  }, [Permission.read(Role.any()), Permission.delete(Role.user(driverId))]);
  if (postOwnerId) createNotification(postOwnerId, 'comment', driverId, postId, targetType).catch(() => {});
  return doc;
}

export async function getComments(postId) {
  const res = await databases.listDocuments(DB, 'comments', [
    Query.equal('post_id', postId),
    Query.notEqual('hidden', true),
    Query.orderAsc('$createdAt'),
    Query.limit(100),
  ]);
  const driverIds = [...new Set(res.documents.map((c) => c.driver_id).filter(Boolean))];
  const driversMap = driverIds.length > 0 ? await getDriversMap(driverIds) : {};
  return { comments: res.documents, driversMap };
}

export async function deleteComment(commentId) {
  return databases.deleteDocument(DB, 'comments', commentId);
}

export async function getCommentCounts(postIds) {
  if (!postIds || postIds.length === 0) return {};
  const res = await databases.listDocuments(DB, 'comments', [
    Query.equal('post_id', postIds),
    Query.notEqual('hidden', true),
    Query.limit(500),
  ]).catch(() => ({ documents: [] }));
  const counts = {};
  for (const c of res.documents) {
    counts[c.post_id] = (counts[c.post_id] || 0) + 1;
  }
  return counts;
}

// --- フォロー中タイムライン（段階4・企画書セクション21） ---
// フォロー中ドライバーの「飯投稿＋ギャラリー更新＋バッジ獲得」を時系列で混在表示
export async function getFollowingFeed(userId) {
  const followeeIds = await getFollowingIds(userId);
  if (followeeIds.length === 0) return { items: [], driversMap: {} };
  const [mealsRes, galleriesRes, driversMap] = await Promise.all([
    databases.listDocuments(DB, 'meal_posts', [
      Query.equal('driver_id', followeeIds), Query.notEqual('hidden', true), Query.orderDesc('created_at'), Query.limit(50),
    ]),
    databases.listDocuments(DB, 'gallery_posts', [
      Query.equal('driver_id', followeeIds), Query.notEqual('hidden', true), Query.orderDesc('created_at'), Query.limit(50),
    ]),
    getDriversMap(followeeIds),
  ]);
  const items = [];
  for (const m of mealsRes.documents) items.push({ kind: 'meal', time: m.created_at, doc: m });
  for (const g of galleriesRes.documents) items.push({ kind: 'gallery', time: g.created_at, doc: g });
  // バッジ獲得は簡易表現（drivers.badges を活動として見せる）：1ドライバーにつき最新バッジ1件
  for (const id of followeeIds) {
    const d = driversMap[id];
    if (d?.badges?.length) {
      items.push({ kind: 'badge', time: d.$updatedAt, doc: d, badge: d.badges[d.badges.length - 1] });
    }
  }
  items.sort((a, b) => (a.time < b.time ? 1 : -1));
  return { items, driversMap };
}

// --- ドライバープロフィール更新 ---
export async function updateDriverProfile(userId, data) {
  const update = {
    nickname: data.nickname,
    bio: data.bio || '',
    body_type: data.body_type || '',
    run_style: data.run_style || '',
    area: data.area || '',
    years: data.years != null && data.years !== '' ? Number(data.years) : null,
  };
  if (data.avatar_id !== undefined) update.avatar_id = data.avatar_id;
  if (data.cover_id !== undefined) update.cover_id = data.cover_id;
  return databases.updateDocument(DB, 'drivers', userId, update);
}

// --- お気に入り（保存）（Figma修正後） ---
export async function getMyFavoriteIds(userId) {
  const res = await databases.listDocuments(DB, 'favorites', [
    Query.equal('user_id', userId), Query.limit(500),
  ]);
  return res.documents.map((d) => d.target_id);
}

export async function addFavorite(userId, targetId) {
  return databases.createDocument(DB, 'favorites', ID.unique(), {
    user_id: userId, target_type: 'meal_post', target_id: targetId,
    created_at: new Date().toISOString(),
  }, [Permission.read(Role.user(userId)), Permission.delete(Role.user(userId))]);
}

export async function removeFavorite(userId, targetId) {
  const res = await databases.listDocuments(DB, 'favorites', [
    Query.equal('user_id', userId), Query.equal('target_id', targetId), Query.limit(1),
  ]);
  if (res.documents[0]) await databases.deleteDocument(DB, 'favorites', res.documents[0].$id);
}

// お気に入り一覧画面用：保存した飯投稿を保存日時の新しい順で
export async function getFavoritesData(userId) {
  const favRes = await databases.listDocuments(DB, 'favorites', [
    Query.equal('user_id', userId), Query.orderDesc('created_at'), Query.limit(200),
  ]);
  const favs = favRes.documents;
  if (favs.length === 0) return { items: [], driversMap: {} };
  const postsRes = await databases.listDocuments(DB, 'meal_posts', [
    Query.equal('$id', favs.map((f) => f.target_id)), Query.limit(200),
  ]);
  const visiblePosts = postsRes.documents.filter((p) => !p.hidden);
  const postMap = {};
  for (const p of visiblePosts) postMap[p.$id] = p;
  const driversMap = await getDriversMap(visiblePosts.map((p) => p.driver_id));
  const items = favs.filter((f) => postMap[f.target_id]).map((f) => ({ post: postMap[f.target_id], savedAt: f.created_at }));
  return { items, driversMap };
}

// --- フォローリスト ---
export async function getFollowListData(userId) {
  const followeeIds = await getFollowingIds(userId);
  if (followeeIds.length === 0) return { drivers: [], postCounts: {} };
  const [driversMap, postsRes] = await Promise.all([
    getDriversMap(followeeIds),
    databases.listDocuments(DB, 'meal_posts', [
      Query.equal('driver_id', followeeIds),
      Query.limit(500),
    ]).catch(() => ({ documents: [] })),
  ]);
  const postCounts = {};
  for (const p of postsRes.documents) {
    postCounts[p.driver_id] = (postCounts[p.driver_id] || 0) + 1;
  }
  const drivers = followeeIds.map((id) => driversMap[id]).filter(Boolean);
  return { drivers, postCounts };
}

// --- 検索 ---
export async function searchMealPosts(term) {
  const t = term.trim();
  if (!t) return { posts: [], driversMap: {} };
  const tLow = t.toLowerCase();

  // 全投稿を取得してクライアント側でフィルタリング
  // （Appwrite v1.9 は配列属性のインデックスが非対応のため）
  const allRes = await databases.listDocuments(DB, 'meal_posts', [
    Query.notEqual('hidden', true),
    Query.orderDesc('created_at'), Query.limit(500),
  ]).catch(() => ({ documents: [] }));

  const matched = allRes.documents.filter((p) =>
    p.dish?.toLowerCase().includes(tLow) ||
    p.shop?.toLowerCase().includes(tLow) ||
    p.location?.toLowerCase().includes(tLow) ||
    p.genres?.some((g) => g.toLowerCase().includes(tLow)) ||
    (t === '大型車OK' && p.oogata_ok)
  );

  const driversMap = await getDriversMap(matched.map((p) => p.driver_id));
  return { posts: matched, driversMap };
}

export async function searchDrivers(term) {
  try {
    const r = await databases.listDocuments(DB, 'drivers', [Query.search('nickname', term.trim()), Query.limit(10)]);
    return r.documents;
  } catch { return []; }
}

// --- 店舗マスター（places） ---
export async function searchPlaces(text) {
  if (!text || text.trim().length < 1) return [];
  try {
    const r = await databases.listDocuments(DB, 'places', [
      Query.search('name', text.trim()),
      Query.notEqual('hidden', true),
      Query.limit(5),
    ]);
    return r.documents;
  } catch { return []; }
}

// --- 投稿削除 ---
export async function deleteMealPost(postId, imageIds = []) {
  for (const id of imageIds) {
    if (id) await storage.deleteFile(BUCKET, id).catch(() => {});
  }
  return databases.deleteDocument(DB, 'meal_posts', postId);
}

export async function deleteGalleryPost(galleryId, imageId) {
  if (imageId) await storage.deleteFile(BUCKET, imageId).catch(() => {});
  return databases.deleteDocument(DB, 'gallery_posts', galleryId);
}

export async function createPlace(userId, data) {
  return databases.createDocument(DB, 'places', ID.unique(), {
    name: data.name,
    address: data.address || '',
    pref_code: data.pref_code != null ? Number(data.pref_code) : 13,
    lat: Number(data.lat),
    lng: Number(data.lng),
    category: data.category || '店舗',
    hours_text: '',
    phone: '',
    midnight_open: false,
    early_open: false,
    oogata_ok: false,
    open_24h: false,
    truck_parking: '',
    shower: false,
    wifi: false,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, [
    Permission.read(Role.any()),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]);
}
