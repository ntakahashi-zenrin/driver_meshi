import { useEffect, useState, useRef } from 'react';
import {
  getCurrentUser, getDriver, login, logout, register,
  listMealTimeline, createMealPost, createGalleryPost, imageUrl,
  getFollowingIds, follow, unfollow, getProfileData,
  getLikesFor, likeTarget, unlikeTarget, getFollowingFeed, getLikedPostsData, getLikedGalleriesData,
  updateDriverProfile, searchMealPosts, searchDrivers, getFollowListData,
  getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationCount,
  addComment, getComments, deleteComment, getCommentCounts,
  searchPlaces, createPlace,
  deleteMealPost, deleteGalleryPost,
  createRecovery, updateRecovery,
  storage, ID, Permission, Role, BUCKET,
} from './lib/appwrite';
import { BODY_TYPES, RUN_STYLES, AREAS, AMENITIES, GENRES } from './lib/options';

/* ---------------- アイコン ---------------- */
const Svg = ({ d, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>{d}</svg>
);
const IcSearch    = () => <Svg d={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>}/>;
const IcBell      = () => <Svg d={<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>}/>;
const IcPin       = () => <Svg d={<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></>}/>;
const IcCheck     = () => <Svg strokeWidth="2.5" d={<path d="M20 6 9 17l-5-5"/>}/>;
const IcComment   = () => <Svg d={<path d="M21 11.5a8.5 8.5 0 0 1-12 7.7L3 21l1.8-6A8.5 8.5 0 1 1 21 11.5"/>}/>;
const IcHome      = () => <Svg d={<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></>}/>;
const IcUser      = () => <Svg d={<><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></>}/>;
const IcPlus      = () => <Svg strokeWidth="2.5" d={<path d="M12 5v14M5 12h14"/>}/>;
const IcPhoto     = () => <Svg strokeWidth="1.5" d={<><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>}/>;
const IcBadge     = () => <Svg d={<><circle cx="12" cy="8" r="6"/><path d="M8.2 13.5 7 22l5-3 5 3-1.2-8.5"/></>}/>;
const IcBack      = () => <Svg d={<path d="m15 18-6-6 6-6"/>}/>;
const IcClose     = () => <Svg d={<path d="M18 6 6 18M6 6l12 12"/>}/>;
const IcHeart     = () => <Svg d={<path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z"/>}/>;
const IcGear      = () => <Svg d={<><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></>}/>;
const IcShare     = () => <Svg d={<><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></>}/>;
const IcChevL     = () => <Svg strokeWidth="2.5" d={<path d="m15 18-6-6 6-6"/>}/>;
const IcChevR     = () => <Svg strokeWidth="2.5" d={<path d="m9 18 6-6-6-6"/>}/>;
const IcMoreV     = () => <Svg d={<><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></>}/>;
const IcTrash     = () => <Svg d={<><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>}/>;
const IcLink      = () => <Svg d={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>}/>;
const IcMoreH     = () => <Svg d={<><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/></>}/>;

/* ---------------- ユーティリティ ---------------- */
function driverMeta(d) {
  if (!d) return '';
  return [d.body_type, d.area].filter(Boolean).join(' | ');
}
function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'たった今';
  if (m < 60) return m + '分前';
  const h = Math.floor(m / 60);
  if (h < 24) return h + '時間前';
  return Math.floor(h / 24) + '日前';
}
function postImages(post) {
  const imgs = [];
  if (post.image_id)   imgs.push(imageUrl(post.image_id));
  if (post.image_id_2) imgs.push(imageUrl(post.image_id_2));
  if (post.image_id_3) imgs.push(imageUrl(post.image_id_3));
  return imgs;
}

/* ---------------- 画像カルーセル ---------------- */
function ImageCarousel({ images, onTap }) {
  const [cur, setCur] = useState(0);
  if (!images || images.length === 0) return null;
  if (images.length === 1) {
    return <img className="food-img" src={images[0]} alt="" onClick={onTap} style={{ cursor: onTap ? 'pointer' : 'default' }} />;
  }
  return (
    <div className="img-carousel" onClick={onTap} style={{ cursor: onTap ? 'pointer' : 'default' }}>
      <img className="food-img" src={images[cur]} alt="" />
      {cur > 0 && (
        <button className="carousel-btn prev" onClick={(e) => { e.stopPropagation(); setCur(i => i - 1); }}><IcChevL /></button>
      )}
      {cur < images.length - 1 && (
        <button className="carousel-btn next" onClick={(e) => { e.stopPropagation(); setCur(i => i + 1); }}><IcChevR /></button>
      )}
      <div className="carousel-dots">
        {images.map((_, i) => (
          <button key={i} className={'carousel-dot' + (i === cur ? ' active' : '')} onClick={(e) => { e.stopPropagation(); setCur(i); }} />
        ))}
      </div>
      <div className="carousel-count">{cur + 1} / {images.length}</div>
    </div>
  );
}

/* ---------------- いいねボタン ---------------- */
function LikeButton({ targetType, targetId, likeCounts, myLikes, onToggleLike, ownerId }) {
  const [busy, setBusy] = useState(false);
  const liked = myLikes.includes(targetId);
  const count = likeCounts[targetId] || 0;
  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try { await onToggleLike(targetType, targetId, ownerId); }
    finally { setBusy(false); }
  };
  return (
    <button onClick={handleClick} disabled={busy} style={busy ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
      <span className={liked ? 'liked' : ''}>
        <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
          <path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z" />
        </svg>
      </span>
      <span>{count}</span>
    </button>
  );
}

/* ---------------- フォローボタン ---------------- */
function FollowButton({ targetId, currentUserId, following, onToggle, variant }) {
  const [busy, setBusy] = useState(false);
  if (currentUserId && targetId === currentUserId) return null;
  const isF = following.includes(targetId);
  const cls = (variant === 'profile' ? 'prof-followbtn' : 'follow-btn') + (isF ? ' following' : '');
  const handleClick = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try { await onToggle(targetId); }
    finally { setBusy(false); }
  };
  return (
    <button className={cls} onClick={handleClick} disabled={busy} style={busy ? { opacity: 0.6, pointerEvents: 'none' } : {}}>
      {busy ? '…' : (isF ? 'フォロー中' : (variant === 'profile' ? 'フォローする' : 'フォロー'))}
    </button>
  );
}

/* ---------------- 飯の本文（カード／フィード共通） ---------------- */
function MealBody({ post, likeCounts, myLikes, onToggleLike, commentCounts, onTap, onOpenDetail }) {
  const commentCount = commentCounts?.[post.$id] || 0;
  return (
    <div className="card-body">
      <div className="dish" onClick={onTap} style={{ cursor: onTap ? 'pointer' : 'default' }}>{post.dish}</div>
      {post.shop && <div className="shop">{post.shop}</div>}
      <div className="price-row">
        {post.price != null && <span className="price">{Number(post.price).toLocaleString()}円</span>}
        {post.location && <span className="loc"><IcPin />{post.location}</span>}
      </div>
      {post.oogata_ok && <span className="ok-badge"><IcCheck />大型車OK</span>}
      {post.genres?.length > 0 && (
        <div className="tags">{post.genres.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
      )}
      {post.comment && <div className="shop" style={{ marginTop: 12 }}>{post.comment}</div>}
      <div className="react">
        <LikeButton targetType="meal_post" targetId={post.$id} likeCounts={likeCounts} myLikes={myLikes} onToggleLike={onToggleLike} ownerId={post.driver_id} />
        <button onClick={onOpenDetail}><IcComment /><span>{commentCount}</span></button>
      </div>
    </div>
  );
}

/* ---------------- 投稿カード（飯タイムライン） ---------------- */
function PostCard({ post, driver, showAuthor = true, onOpenProfile, onTap, currentUserId, following, onToggleFollow, likeCounts, myLikes, onToggleLike, commentCounts }) {
  const imgs = postImages(post);
  return (
    <article className="card">
      {showAuthor && (
        <div className="card-head">
          <div className="author" onClick={() => onOpenProfile(post.driver_id)}>
            {driver?.avatar_id ? <img className="avatar" src={imageUrl(driver.avatar_id)} alt="" /> : <div className="avatar" />}
            <div>
              <div className="name">{driver?.nickname || 'ドライバー'}</div>
              <div className="meta">{driverMeta(driver)}</div>
            </div>
          </div>
          <FollowButton targetId={post.driver_id} currentUserId={currentUserId} following={following} onToggle={onToggleFollow} />
        </div>
      )}
      <ImageCarousel images={imgs} onTap={() => onTap?.(post)} />
      <MealBody post={post} likeCounts={likeCounts} myLikes={myLikes} onToggleLike={onToggleLike} commentCounts={commentCounts} onTap={() => onTap?.(post)} onOpenDetail={() => onTap?.(post)} />
    </article>
  );
}

/* ---------------- 飯タイムライン ---------------- */
function Timeline({ data, loading, onTap, ...cardProps }) {
  if (loading) return <div className="center-msg"><div className="spinner" />読み込み中...</div>;
  if (!data || data.posts.length === 0) {
    return (
      <div className="center-msg">
        <div className="big-emoji">🍚</div>
        <div className="ttl">まだドライバー飯がありません</div>
        <div className="sub">下の「＋」から最初の飯を投稿してみましょう。</div>
      </div>
    );
  }
  return <div>{data.posts.map((p) => <PostCard key={p.$id} post={p} driver={data.driversMap[p.driver_id]} onTap={onTap} {...cardProps} />)}</div>;
}

/* ---------------- フォロー中フィードアイテム ---------------- */
function FeedItem({ item, driver, onOpenProfile, onTap, onTapGallery, likeCounts, myLikes, onToggleLike, commentCounts, showToast }) {
  const pillKind = item.kind === 'meal' ? ' pill-meal' : item.kind === 'badge' ? ' pill-badge' : '';
  const head = (label, icon) => (
    <>
      <div className="feed-label"><span className={'pill' + pillKind}>{icon}{label}</span><span className="time">{relativeTime(item.time)}</span></div>
      <div className="card-head">
        <div className="author" onClick={() => onOpenProfile(driver?.user_id)}>
          {driver?.avatar_id ? <img className="avatar" src={imageUrl(driver.avatar_id)} alt="" /> : <div className="avatar" />}
          <div><div className="name">{driver?.nickname || 'ドライバー'}</div><div className="meta">{driverMeta(driver)}</div></div>
        </div>
      </div>
    </>
  );
  if (item.kind === 'meal') {
    const imgs = postImages(item.doc);
    return (
      <article className="card">
        {head('ドライバー飯')}
        <ImageCarousel images={imgs} onTap={() => onTap?.(item.doc)} />
        <MealBody post={item.doc} likeCounts={likeCounts} myLikes={myLikes} onToggleLike={onToggleLike} commentCounts={commentCounts} onTap={() => onTap?.(item.doc)} onOpenDetail={() => onTap?.(item.doc)} />
      </article>
    );
  }
  if (item.kind === 'gallery') {
    return (
      <article className="card">
        {head('ギャラリー更新', <IcPhoto />)}
        {item.doc.image_id && (
          <img
            className="gallery-img"
            src={imageUrl(item.doc.image_id)}
            alt=""
            onClick={() => onTapGallery?.(item.doc, driver)}
            style={{ cursor: onTapGallery ? 'pointer' : 'default' }}
          />
        )}
        {item.doc.caption && <div className="gallery-cap" style={{ borderBottom: 'none' }}>{item.doc.caption}</div>}
        <div className="card-body" style={{ paddingTop: 10 }}>
          <div className="react">
            <LikeButton targetType="gallery_post" targetId={item.doc.$id} likeCounts={likeCounts} myLikes={myLikes} onToggleLike={onToggleLike} ownerId={driver?.user_id} />
            <button onClick={() => onTapGallery?.(item.doc, driver)}><IcComment /><span>0</span></button>
          </div>
        </div>
      </article>
    );
  }
  return (
    <article className="card">
      {head('バッジ獲得', <IcBadge />)}
      <div className="badge-block">
        <span className="badge-ic"><IcBadge /></span>
        <div><div className="small">バッジを獲得しました</div><div className="big">{item.badge}</div></div>
      </div>
    </article>
  );
}

function FollowingFeed({ user, data, loading, onOpenProfile, onTap, onTapGallery, likeCounts, myLikes, onToggleLike, commentCounts, showToast }) {
  if (!user) {
    return (
      <div className="center-msg">
        <div className="big-emoji">🔑</div>
        <div className="ttl">ログインするとフォロー中の更新が見られます</div>
        <div className="sub">気になるドライバーをフォローすると、ここに流れます。</div>
      </div>
    );
  }
  if (loading) return <div className="center-msg"><div className="spinner" />読み込み中...</div>;
  if (!data || data.items.length === 0) {
    return (
      <div className="center-msg">
        <div className="big-emoji">🚚</div>
        <div className="ttl">まだ誰もフォローしていません</div>
        <div className="sub">ホームのドライバー飯から気になるドライバーをフォローすると、<br />ドライバー飯に加えてギャラリー更新やバッジ獲得もここに流れます。</div>
      </div>
    );
  }
  return (
    <div>
      {data.items.map((it, i) => (
        <FeedItem key={it.kind + (it.doc.$id || '') + i} item={it} driver={data.driversMap[it.doc.driver_id || it.doc.user_id]}
          onOpenProfile={onOpenProfile} onTap={onTap} onTapGallery={onTapGallery} likeCounts={likeCounts} myLikes={myLikes} onToggleLike={onToggleLike} commentCounts={commentCounts} showToast={showToast} />
      ))}
    </div>
  );
}

/* ---------------- お気に入り一覧 ---------------- */
function FavCard({ item, driver, onRemove, onOpenProfile, likeCounts }) {
  const p = item.post;
  return (
    <div className="fav-card">
      <div className="fav-inner">
        {p.image_id
          ? <img className="fav-thumb" src={imageUrl(p.image_id)} alt={p.dish} />
          : <div className="fav-thumb fav-thumb-empty" />}
        <div className="fav-info">
          <div className="fav-head">
            <div className="fav-title-wrap">
              <div className="fav-dish">{p.dish}</div>
              {p.shop && <div className="fav-shop">{p.shop}</div>}
            </div>
            <button className="fav-remove" onClick={onRemove} title="お気に入りから外す"><IcClose /></button>
          </div>
          <div className="fav-sub">{[p.price != null ? Number(p.price).toLocaleString() + '円' : '', p.location].filter(Boolean).join(' ・ ')}</div>
          {p.oogata_ok && <span className="ok-badge fav-ok"><IcCheck />大型車OK</span>}
        </div>
      </div>
      <div className="fav-footer">
        <div className="fav-author" onClick={() => onOpenProfile(p.driver_id)}>
          {driver?.avatar_id && <img src={imageUrl(driver.avatar_id)} alt="" />}
          <span>{driver?.nickname || 'ドライバー'}</span>
          <span className="fav-save-time">・{relativeTime(item.savedAt)}に保存</span>
        </div>
        <div className="fav-stats">
          <span>
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: 13, height: 13, color: '#F4661E' }}>
              <path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z" />
            </svg>
            {likeCounts?.[p.$id] || 0}
          </span>
          <span><IcComment />0</span>
        </div>
      </div>
    </div>
  );
}

/* ---- ギャラリーお気に入りカード ---- */
function GalleryFavCard({ item, driver, onRemove, onOpenProfile, likeCounts, onTap }) {
  const g = item.gallery;
  return (
    <div className="fav-gallery-card" onClick={onTap} style={{ cursor: onTap ? 'pointer' : 'default' }}>
      <div className="fav-gallery-img-wrap">
        {g.image_id
          ? <img className="fav-gallery-img" src={imageUrl(g.image_id)} alt="" />
          : <div className="fav-gallery-img fav-gallery-img-empty">📷</div>}
        <div className="fav-gallery-badge"><IcPhoto />ギャラリー</div>
        <button className="fav-gallery-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }} title="保存解除"><IcClose /></button>
      </div>
      {g.caption && <div className="fav-gallery-caption">{g.caption}</div>}
      <div className="fav-footer">
        <div className="fav-author" onClick={(e) => { e.stopPropagation(); onOpenProfile(g.driver_id); }}>
          {driver?.avatar_id && <img src={imageUrl(driver.avatar_id)} alt="" />}
          <span>{driver?.nickname || 'ドライバー'}</span>
          <span className="fav-save-time">・{relativeTime(item.savedAt)}に保存</span>
        </div>
        <div className="fav-stats">
          <span>
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: 13, height: 13, color: '#F4661E' }}>
              <path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z" />
            </svg>
            {likeCounts?.[g.$id] || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

function Favorites({ data, galleryData, loading, onToggleFavorite, onToggleGalleryFavorite, onOpenProfile, likeCounts, onTapGallery }) {
  const [tab, setTab] = useState('food');
  const [filter, setFilter] = useState('すべて');

  if (loading) return <div className="center-msg"><div className="spinner" />読み込み中...</div>;

  const foodItems = data?.items || [];
  const galleryItems = galleryData?.items || [];

  const genres = [...new Set(foodItems.flatMap((it) => it.post.genres || []))];
  const filteredFood = filter === 'すべて' ? foodItems : foodItems.filter((it) => (it.post.genres || []).includes(filter));

  const isEmpty = tab === 'food' ? filteredFood.length === 0 : galleryItems.length === 0;

  return (
    <div>
      {/* タブバー */}
      <div className="fav-tabs">
        <button className={'fav-tab' + (tab === 'food' ? ' active' : '')} onClick={() => setTab('food')}>
          <IcHeart />ドライバー飯
        </button>
        <button className={'fav-tab fav-tab-gallery' + (tab === 'gallery' ? ' active-gallery' : '')} onClick={() => setTab('gallery')}>
          <IcPhoto />ギャラリー
        </button>
      </div>

      {tab === 'food' && (
        <>
          <div className="fav-count">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: 16, height: 16, color: '#F4661E' }}>
              <path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z" />
            </svg>
            {foodItems.length}件
          </div>
          {genres.length > 0 && (
            <div className="filters">
              <button className={'chip' + (filter === 'すべて' ? ' active' : '')} onClick={() => setFilter('すべて')}>すべて</button>
              {genres.map((g) => <button key={g} className={'chip' + (filter === g ? ' active' : '')} onClick={() => setFilter(g)}>{g}</button>)}
            </div>
          )}
          {isEmpty ? (
            <div className="center-msg" style={{ paddingTop: 48 }}>
              <div className="big-emoji">❤️</div>
              <div className="ttl">まだお気に入りがありません</div>
              <div className="sub">気になるドライバー飯のハート（♥）を押すと、ここに保存されます。</div>
            </div>
          ) : (
            <div className="fav-list">
              {filteredFood.map((it) => (
                <FavCard key={it.post.$id} item={it} driver={data.driversMap[it.post.driver_id]}
                  onRemove={() => onToggleFavorite(it.post.$id)} onOpenProfile={onOpenProfile} likeCounts={likeCounts} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'gallery' && (
        <>
          <div className="fav-count" style={{ color: '#2563eb' }}>
            <IcPhoto style={{ width: 16, height: 16 }} />
            {galleryItems.length}件
          </div>
          {isEmpty ? (
            <div className="center-msg" style={{ paddingTop: 48 }}>
              <div className="big-emoji">🖼️</div>
              <div className="ttl">保存したギャラリーはありません</div>
              <div className="sub">ギャラリー詳細から保存ボタンで追加できます。</div>
            </div>
          ) : (
            <div className="fav-list">
              {galleryItems.map((it) => (
                <GalleryFavCard key={it.gallery.$id} item={it} driver={galleryData.driversMap[it.gallery.driver_id]}
                  onRemove={() => onToggleGalleryFavorite(it.gallery.$id)}
                  onOpenProfile={onOpenProfile} likeCounts={likeCounts}
                  onTap={onTapGallery ? () => onTapGallery(it.gallery, galleryData.driversMap[it.gallery.driver_id]) : undefined} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- 投稿詳細 ---------------- */
function PostDetail({ post, driver, user, myDriver, following, onToggleFollow, likeCounts, myLikes, onToggleLike, onBack, showToast, onOpenProfile, onCommentCountChange, onDeleted }) {
  const [commentText, setCommentText] = useState('');
  const [commentData, setCommentData] = useState(null);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwn = user?.$id === post.driver_id;
  const imgs = postImages(post);

  useEffect(() => {
    getComments(post.$id)
      .then(setCommentData)
      .catch(() => setCommentData({ comments: [], driversMap: {} }));
  }, [post.$id]);

  const handleSend = async () => {
    if (!user) { showToast('コメントするにはログインが必要です'); return; }
    const text = commentText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const doc = await addComment(post.$id, user.$id, text, post.driver_id);
      const newComment = { ...doc, driver_id: user.$id };
      setCommentData((prev) => ({
        comments: [...(prev?.comments || []), newComment],
        driversMap: { ...(prev?.driversMap || {}), [user.$id]: myDriver },
      }));
      setCommentText('');
      onCommentCountChange?.(post.$id, 1);
    } catch (e) { showToast('送信できませんでした: ' + (e?.message || '')); }
    finally { setSending(false); }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      setCommentData((prev) => ({ ...prev, comments: prev.comments.filter((c) => c.$id !== commentId) }));
      onCommentCountChange?.(post.$id, -1);
    } catch (e) { showToast('削除できませんでした'); }
  };

  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      await deleteMealPost(post.$id, [post.image_id, post.image_id_2, post.image_id_3]);
      onDeleted?.();
    } catch (e) {
      showToast('削除できませんでした: ' + (e?.message || ''));
      setDeleting(false);
    }
  };

  const shareTitle = `${post.dish}${post.shop ? ` - ${post.shop}` : ''}`;
  const shareUrl = `${window.location.origin}/?post=${post.$id}`;
  const handleShare = (method) => {
    setShowShareSheet(false);
    if (method === 'copy') {
      navigator.clipboard?.writeText(shareUrl)
        .then(() => showToast('リンクをコピーしました'))
        .catch(() => showToast('コピーできませんでした'));
    } else if (method === 'line') {
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(shareTitle + '\n' + shareUrl)}`, '_blank');
    } else if (method === 'x') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (method === 'other') {
      if (navigator.share) { navigator.share({ title: shareTitle, url: shareUrl }).catch(() => {}); }
      else { showToast('お使いのブラウザでは共有未対応です'); }
    }
  };

  const comments = commentData?.comments || [];
  const driversMap = commentData?.driversMap || {};

  return (
    <div className="screen">
      <div className="hdr">
        <div className="back-row" style={{ justifyContent: 'space-between' }}>
          <button className="icon-btn" onClick={onBack}><IcBack /></button>
          <div className="hdr-title" style={{ fontSize: 17 }}>投稿詳細</div>
          {isOwn
            ? <button className="icon-btn" style={{ background: showMenu ? '#f3f4f6' : undefined, borderRadius: 8 }} onClick={() => setShowMenu(true)}><IcMoreV /></button>
            : <div style={{ width: 36 }} />}
        </div>
      </div>

      <ImageCarousel images={imgs} />

      <div className="pd-author">
        <div className="author" onClick={() => onOpenProfile(post.driver_id)}>
          {driver?.avatar_id ? <img className="avatar" src={imageUrl(driver.avatar_id)} alt="" /> : <div className="avatar" />}
          <div>
            <div className="name">{driver?.nickname || 'ドライバー'}</div>
            <div className="meta">{driverMeta(driver)}</div>
          </div>
        </div>
        <FollowButton targetId={post.driver_id} currentUserId={user?.$id} following={following} onToggle={onToggleFollow} />
      </div>

      <div className="pd-body">
        <div className="dish">{post.dish}</div>
        {post.shop && <div className="shop">{post.shop}</div>}
        <div className="price-row">
          {post.price != null && <span className="price">{Number(post.price).toLocaleString()}円</span>}
          {post.location && <span className="loc"><IcPin />{post.location}</span>}
        </div>
        {post.oogata_ok && <span className="ok-badge" style={{ marginTop: 12 }}><IcCheck />大型車OK</span>}
        {post.comment && <div className="pd-comment">{post.comment}</div>}
        {post.genres?.length > 0 && (
          <div className="tags" style={{ marginTop: 12 }}>{post.genres.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
        )}
        <div className="pd-time">{relativeTime(post.created_at)}</div>
      </div>

      <div className="pd-actions">
        <LikeButton targetType="meal_post" targetId={post.$id} likeCounts={likeCounts} myLikes={myLikes} onToggleLike={onToggleLike} ownerId={post.driver_id} />
        <button><IcComment /><span>{comments.length}件</span></button>
        <button className="pd-share-btn" onClick={() => setShowShareSheet(true)}><IcShare /></button>
      </div>

      <div className="pd-comments">
        <div className="pd-comments-title">コメント <span className="pd-comment-count">{comments.length}件</span></div>
        {commentData === null ? (
          <div className="center-msg" style={{ padding: '24px 0' }}><div className="spinner" /></div>
        ) : comments.length === 0 ? (
          <div className="pd-empty-comments">
            <IcComment />
            <p>まだコメントはありません</p>
            <p className="pd-comment-hint">最初のコメントを書いてみよう</p>
          </div>
        ) : (
          <div className="pd-comment-list">
            {comments.map((c) => {
              const d = driversMap[c.driver_id];
              const isMine = user && c.driver_id === user.$id;
              return (
                <div key={c.$id} className="pd-comment-row">
                  <div className="pd-comment-avatar" onClick={() => onOpenProfile(c.driver_id)} style={{ cursor: 'pointer' }}>
                    {d?.avatar_id ? <img src={imageUrl(d.avatar_id)} alt="" /> : <div className="pd-comment-avatar-ph">{(d?.nickname || '?')[0]}</div>}
                  </div>
                  <div className="pd-comment-body">
                    <span className="pd-comment-name" onClick={() => onOpenProfile(c.driver_id)} style={{ cursor: 'pointer' }}>{d?.nickname || 'ドライバー'}</span>
                    <span className="pd-comment-time">{relativeTime(c.created_at)}</span>
                    <div className="pd-comment-text">{c.text}</div>
                  </div>
                  {isMine && (
                    <button className="pd-comment-del" onClick={() => handleCommentDelete(c.$id)} title="削除">×</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pd-input-bar">
        {myDriver?.avatar_id
          ? <img className="pd-my-avatar" src={imageUrl(myDriver.avatar_id)} alt="" />
          : <div className="pd-my-avatar" />}
        <div className="pd-input-wrap">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={user ? 'コメントを入力...' : 'ログインするとコメントできます'}
            className="pd-input"
            disabled={!user}
          />
          {commentText.trim().length > 0 && (
            <button className="pd-send" onClick={handleSend} disabled={sending}>{sending ? '…' : '送信'}</button>
          )}
        </div>
      </div>

      {/* ⋮ ドロップダウンメニュー */}
      {showMenu && (
        <>
          <div className="detail-bg" onClick={() => setShowMenu(false)} />
          <div className="detail-menu">
            <button className="detail-menu-item danger" onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}>
              <IcTrash /><span>削除する</span>
            </button>
          </div>
        </>
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="detail-dialog-bg" onClick={() => { if (!deleting) setShowDeleteConfirm(false); }}>
          <div className="delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-body">
              <div className="delete-icon-wrap"><IcTrash /></div>
              <p className="delete-dialog-title">この投稿を削除しますか？</p>
              <p className="delete-dialog-sub">削除すると元に戻せません。<br />いいね・コメントもすべて削除されます。</p>
            </div>
            <div className="delete-dialog-btns">
              <button disabled={deleting} onClick={() => setShowDeleteConfirm(false)}>キャンセル</button>
              <button className="danger" disabled={deleting} onClick={handleDeletePost}>{deleting ? '削除中…' : '削除する'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 共有ボトムシート */}
      {showShareSheet && (
        <>
          <div className="detail-sheet-bg" onClick={() => setShowShareSheet(false)} />
          <div className="share-sheet">
            <div className="share-sheet-handle" />
            <div className="share-sheet-preview">
              {imgs[0] && <img className="share-thumb" src={imageUrl(imgs[0])} alt="" />}
              <div>
                <p className="share-sheet-title">{post.dish}</p>
                <p className="share-sheet-sub">{post.shop || post.location || ''}</p>
              </div>
            </div>
            <div className="share-icons">
              <button className="share-icon-btn" onClick={() => handleShare('line')}>
                <div className="share-icon-circle" style={{ background: '#06c755' }}>
                  <svg width="28" height="28" viewBox="0 0 36 36" fill="none"><path d="M18 3C10.268 3 4 8.477 4 15.2c0 3.994 2.178 7.537 5.572 9.904L8.4 30l5.454-2.865C15.195 27.37 16.58 27.6 18 27.6c7.732 0 14-5.477 14-12.4S25.732 3 18 3z" fill="white"/></svg>
                </div>
                <span>LINE</span>
              </button>
              <button className="share-icon-btn" onClick={() => handleShare('x')}>
                <div className="share-icon-circle" style={{ background: '#000' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </div>
                <span>X（旧Twitter）</span>
              </button>
              <button className="share-icon-btn" onClick={() => handleShare('copy')}>
                <div className="share-icon-circle" style={{ background: '#f3f4f6', color: '#6b7280' }}><IcLink /></div>
                <span>リンクをコピー</span>
              </button>
              <button className="share-icon-btn" onClick={() => handleShare('other')}>
                <div className="share-icon-circle" style={{ background: '#f3f4f6', color: '#6b7280' }}><IcMoreH /></div>
                <span>その他</span>
              </button>
            </div>
            <button className="share-cancel" onClick={() => setShowShareSheet(false)}>キャンセル</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- ドライバープロフィール（自分 / 他人共通） ---------------- */
/* ---------------- ギャラリー詳細 ---------------- */
function GalleryDetail({ gallery, driver, user, myDriver, following, onToggleFollow, likeCounts, myLikes, onToggleLike, onBack, onOpenProfile, showToast, onDeleted }) {
  const [commentText, setCommentText] = useState('');
  const [commentData, setCommentData] = useState(null);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwn = user?.$id === gallery?.driver_id;

  useEffect(() => {
    if (!gallery) return;
    getComments(gallery.$id)
      .then(setCommentData)
      .catch(() => setCommentData({ comments: [], driversMap: {} }));
  }, [gallery?.$id]);

  const handleSend = async () => {
    if (!user) { showToast?.('コメントするにはログインが必要です'); return; }
    const text = commentText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const doc = await addComment(gallery.$id, user.$id, text, gallery.driver_id, 'gallery_post');
      setCommentData((prev) => ({
        comments: [...(prev?.comments || []), { ...doc, driver_id: user.$id }],
        driversMap: { ...(prev?.driversMap || {}), [user.$id]: myDriver },
      }));
      setCommentText('');
    } catch (e) { showToast?.('送信できませんでした: ' + (e?.message || '')); }
    finally { setSending(false); }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      setCommentData((prev) => ({ ...prev, comments: prev.comments.filter((c) => c.$id !== commentId) }));
    } catch (e) { showToast?.('削除できませんでした'); }
  };

  const handleDeleteGallery = async () => {
    setDeleting(true);
    try {
      await deleteGalleryPost(gallery.$id, gallery.image_id);
      onDeleted?.();
    } catch (e) {
      showToast?.('削除できませんでした: ' + (e?.message || ''));
      setDeleting(false);
    }
  };

  const shareTitle = gallery?.caption?.slice(0, 60) || 'ギャラリー投稿';
  const shareUrl = `${window.location.origin}/?gallery=${gallery?.$id}`;
  const handleShare = (method) => {
    setShowShareSheet(false);
    if (method === 'copy') {
      navigator.clipboard?.writeText(shareUrl)
        .then(() => showToast?.('リンクをコピーしました'))
        .catch(() => showToast?.('コピーできませんでした'));
    } else if (method === 'line') {
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(shareTitle + '\n' + shareUrl)}`, '_blank');
    } else if (method === 'x') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (method === 'other') {
      if (navigator.share) { navigator.share({ title: shareTitle, url: shareUrl }).catch(() => {}); }
      else { showToast?.('お使いのブラウザでは共有未対応です'); }
    }
  };

  if (!gallery) return null;
  const comments = commentData?.comments || [];
  const driversMap = commentData?.driversMap || {};

  return (
    <div className="screen">
      <div className="hdr">
        <div className="back-row" style={{ justifyContent: 'space-between' }}>
          <button className="icon-btn" onClick={onBack}><IcBack /></button>
          <div className="hdr-title" style={{ fontSize: 17 }}>ギャラリー</div>
          {isOwn
            ? <button className="icon-btn" style={{ background: showMenu ? '#f3f4f6' : undefined, borderRadius: 8 }} onClick={() => setShowMenu(true)}><IcMoreV /></button>
            : <div style={{ width: 36 }} />}
        </div>
      </div>

      {gallery.image_id
        ? <img className="food-img" src={imageUrl(gallery.image_id)} alt="" />
        : <div className="food-img" style={{ background: 'var(--tag-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📷</div>}

      <div className="pd-author">
        <div className="author" onClick={() => driver && onOpenProfile?.(driver.user_id)} style={{ cursor: driver ? 'pointer' : 'default' }}>
          {driver?.avatar_id
            ? <img className="avatar" src={imageUrl(driver.avatar_id)} alt="" />
            : <div className="avatar">{driver?.nickname?.[0] || '?'}</div>}
          <div>
            <div className="name">{driver?.nickname || 'ドライバー'}</div>
            <div className="meta">{driverMeta(driver)}</div>
          </div>
        </div>
        <FollowButton targetId={gallery.driver_id} currentUserId={user?.$id} following={following} onToggle={onToggleFollow} />
      </div>

      <div className="pd-body">
        {gallery.caption && <div className="pd-comment">{gallery.caption}</div>}
        <div className="pd-time">{relativeTime(gallery.created_at || gallery.$createdAt)}</div>
      </div>

      <div className="pd-actions">
        <LikeButton targetType="gallery_post" targetId={gallery.$id} likeCounts={likeCounts} myLikes={myLikes} onToggleLike={onToggleLike} ownerId={gallery.driver_id} />
        <button><IcComment /><span>{comments.length}件</span></button>
        <button className="pd-share-btn" onClick={() => setShowShareSheet(true)}><IcShare /></button>
      </div>

      <div className="pd-comments">
        <div className="pd-comments-title">コメント <span className="pd-comment-count">{comments.length}件</span></div>
        {commentData === null ? (
          <div className="center-msg" style={{ padding: '24px 0' }}><div className="spinner" /></div>
        ) : comments.length === 0 ? (
          <div className="pd-empty-comments">
            <IcComment />
            <p>まだコメントはありません</p>
            <p className="pd-comment-hint">最初のコメントを書いてみよう</p>
          </div>
        ) : (
          <div className="pd-comment-list">
            {comments.map((c) => {
              const d = driversMap[c.driver_id];
              const isMine = user && c.driver_id === user.$id;
              return (
                <div key={c.$id} className="pd-comment-row">
                  <div className="pd-comment-avatar" onClick={() => onOpenProfile?.(c.driver_id)} style={{ cursor: 'pointer' }}>
                    {d?.avatar_id ? <img src={imageUrl(d.avatar_id)} alt="" /> : <div className="pd-comment-avatar-ph">{(d?.nickname || '?')[0]}</div>}
                  </div>
                  <div className="pd-comment-body">
                    <span className="pd-comment-name" onClick={() => onOpenProfile?.(c.driver_id)} style={{ cursor: 'pointer' }}>{d?.nickname || 'ドライバー'}</span>
                    <span className="pd-comment-time">{relativeTime(c.created_at)}</span>
                    <div className="pd-comment-text">{c.text}</div>
                  </div>
                  {isMine && (
                    <button className="pd-comment-del" onClick={() => handleCommentDelete(c.$id)} title="削除">×</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pd-input-bar">
        {myDriver?.avatar_id
          ? <img className="pd-my-avatar" src={imageUrl(myDriver.avatar_id)} alt="" />
          : <div className="pd-my-avatar" />}
        <div className="pd-input-wrap">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={user ? 'コメントを入力...' : 'ログインするとコメントできます'}
            className="pd-input"
            disabled={!user}
          />
          {commentText.trim().length > 0 && (
            <button className="pd-send" onClick={handleSend} disabled={sending}>{sending ? '…' : '送信'}</button>
          )}
        </div>
      </div>

      {/* ⋮ ドロップダウンメニュー */}
      {showMenu && (
        <>
          <div className="detail-bg" onClick={() => setShowMenu(false)} />
          <div className="detail-menu">
            <button className="detail-menu-item danger" onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}>
              <IcTrash /><span>削除する</span>
            </button>
          </div>
        </>
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="detail-dialog-bg" onClick={() => { if (!deleting) setShowDeleteConfirm(false); }}>
          <div className="delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-body">
              <div className="delete-icon-wrap"><IcTrash /></div>
              <p className="delete-dialog-title">この投稿を削除しますか？</p>
              <p className="delete-dialog-sub">削除すると元に戻せません。<br />いいね・コメントもすべて削除されます。</p>
            </div>
            <div className="delete-dialog-btns">
              <button disabled={deleting} onClick={() => setShowDeleteConfirm(false)}>キャンセル</button>
              <button className="danger" disabled={deleting} onClick={handleDeleteGallery}>{deleting ? '削除中…' : '削除する'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 共有ボトムシート */}
      {showShareSheet && (
        <>
          <div className="detail-sheet-bg" onClick={() => setShowShareSheet(false)} />
          <div className="share-sheet">
            <div className="share-sheet-handle" />
            <div className="share-sheet-preview">
              {gallery.image_id && <img className="share-thumb" src={imageUrl(gallery.image_id)} alt="" />}
              <div>
                <p className="share-sheet-title">ギャラリー投稿</p>
                <p className="share-sheet-sub">{driver?.nickname || 'ドライバー'}</p>
              </div>
            </div>
            <div className="share-icons">
              <button className="share-icon-btn" onClick={() => handleShare('line')}>
                <div className="share-icon-circle" style={{ background: '#06c755' }}>
                  <svg width="28" height="28" viewBox="0 0 36 36" fill="none"><path d="M18 3C10.268 3 4 8.477 4 15.2c0 3.994 2.178 7.537 5.572 9.904L8.4 30l5.454-2.865C15.195 27.37 16.58 27.6 18 27.6c7.732 0 14-5.477 14-12.4S25.732 3 18 3z" fill="white"/></svg>
                </div>
                <span>LINE</span>
              </button>
              <button className="share-icon-btn" onClick={() => handleShare('x')}>
                <div className="share-icon-circle" style={{ background: '#000' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </div>
                <span>X（旧Twitter）</span>
              </button>
              <button className="share-icon-btn" onClick={() => handleShare('copy')}>
                <div className="share-icon-circle" style={{ background: '#f3f4f6', color: '#6b7280' }}><IcLink /></div>
                <span>リンクをコピー</span>
              </button>
              <button className="share-icon-btn" onClick={() => handleShare('other')}>
                <div className="share-icon-circle" style={{ background: '#f3f4f6', color: '#6b7280' }}><IcMoreH /></div>
                <span>その他</span>
              </button>
            </div>
            <button className="share-cancel" onClick={() => setShowShareSheet(false)}>キャンセル</button>
          </div>
        </>
      )}
    </div>
  );
}

function Profile({ data, loading, isOwn, onEdit, currentUserId, following, onToggleFollow, likeCounts, myLikes, onToggleLike, showToast, onTapPost, onTapGallery }) {
  const [tab, setTab] = useState(0);
  if (loading || !data) return <div className="center-msg"><div className="spinner" />読み込み中...</div>;
  const d = data.driver;
  if (!d) return <div className="center-msg"><div className="ttl">プロフィールが見つかりません</div></div>;

  const info = [];
  if (d.body_type)  info.push('車種：' + d.body_type);
  if (d.run_style)  info.push('運行スタイル：' + d.run_style);
  if (d.area)       info.push('走行エリア：' + d.area);
  if (d.years != null) info.push('ドライバー歴：' + d.years + '年');
  const taste = [];
  if (d.fav_genres?.length)  taste.push('好きな飯：' + d.fav_genres.join('、'));
  if (d.fav_places?.length)  taste.push('よく投稿する場所：' + d.fav_places.join('、'));
  if (d.priorities?.length)  taste.push('重視するポイント：' + d.priorities.join('、'));

  return (
    <div>
      {d.cover_id ? <img className="cover" src={imageUrl(d.cover_id)} alt="" /> : <div className="cover placeholder" />}
      <div className="prof-top">
        {d.avatar_id ? <img className="prof-avatar" src={imageUrl(d.avatar_id)} alt="" /> : <div className="prof-avatar">{(d.nickname || '?').charAt(0)}</div>}
        {isOwn
          ? <button className="prof-edit-btn" onClick={onEdit}>編集する</button>
          : <FollowButton targetId={d.user_id} currentUserId={currentUserId} following={following} onToggle={onToggleFollow} variant="profile" />}
        <div className="prof-name">{d.nickname}</div>
        <div className="prof-stats">
          <span>投稿 <b>{data.posts.length}</b></span>
          <span>フォロワー <b>{data.followers}</b></span>
          <span>いいね <b>{data.posts.reduce((s, p) => s + (likeCounts[p.$id] || 0), 0)}</b></span>
        </div>
        <div className="prof-role">{[driverMeta(d), d.years != null ? 'ドライバー歴' + d.years + '年' : ''].filter(Boolean).join(' | ')}</div>
        {d.bio && <div className="prof-bio">{d.bio}</div>}
        <div className="prof-tags">{[...(d.fav_genres || []), ...(d.priorities || [])].map((t) => <span className="tag" key={t}>{t}</span>)}</div>
      </div>
      <div className="ptabs">
        {['プロフィール', 'ドライバー飯', 'ギャラリー'].map((t, i) => (
          <button key={t} className={'ptab' + (tab === i ? ' active' : '')} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>
      {tab === 0 && (
        <div>
          <div className="info-card"><h3>ドライバー情報</h3><p>{info.length ? info.map((x, i) => <span key={i}>{x}<br /></span>) : '未設定'}</p></div>
          <div className="info-card"><h3>飯の好み</h3><p>{taste.length ? taste.map((x, i) => <span key={i}>{x}<br /></span>) : '未設定'}</p></div>
          <div className="info-card"><h3>実績・バッジ</h3>
            {d.badges?.length
              ? <div className="badge-grid">{d.badges.map((b) => <span className="badge-chip" key={b}><IcBadge />{b}</span>)}</div>
              : <p>まだバッジがありません。投稿を続けると増えていきます。</p>}
          </div>
        </div>
      )}
      {tab === 1 && (
        data.posts.length
          ? <div className="photo-grid">{data.posts.map((p) => (
              <div key={p.$id} className="grid-item" onClick={() => onTapPost?.(p)} style={{ cursor: onTapPost ? 'pointer' : 'default' }}>
                {p.image_id ? <img src={imageUrl(p.image_id)} alt={p.dish} /> : <div className="grid-noimg"><span>{p.dish}</span></div>}
              </div>
            ))}</div>
          : <div className="center-msg">まだドライバー飯がありません</div>
      )}
      {tab === 2 && (
        data.galleries.length
          ? <div className="photo-grid">{data.galleries.map((g) => (
              <div key={g.$id} className="grid-item" onClick={() => onTapGallery?.(g)} style={{ cursor: onTapGallery ? 'pointer' : 'default' }}>
                {g.image_id ? <img src={imageUrl(g.image_id)} alt="" /> : <div className="grid-noimg"><span>📷</span></div>}
              </div>
            ))}</div>
          : <div className="center-msg">まだギャラリー投稿がありません</div>
      )}
    </div>
  );
}

/* ---------------- フォローリスト ---------------- */
function FollowList({ userId, following, onToggleFollow, onOpenProfile, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await getFollowListData(userId);
        setData(d);
      } catch { showToast('取得に失敗しました'); }
      finally { setLoading(false); }
    })();
  }, [userId]);

  if (loading) return <div className="center-msg"><div className="spinner" />読み込み中...</div>;
  if (!data || data.drivers.length === 0) {
    return (
      <div className="center-msg">
        <div className="big-emoji">🚚</div>
        <div className="ttl">まだ誰もフォローしていません</div>
        <div className="sub">気になるドライバーをフォローするとここに表示されます</div>
      </div>
    );
  }

  return (
    <div>
      {data.drivers.map((d) => (
        <div key={d.user_id} className="fl-row" onClick={() => onOpenProfile(d.user_id)}>
          {d.avatar_id
            ? <img className="fl-avatar" src={imageUrl(d.avatar_id)} alt="" />
            : <div className="fl-avatar">{(d.nickname || '?').charAt(0)}</div>}
          <div className="fl-info">
            <div className="fl-name">{d.nickname}</div>
            <div className="fl-meta">{driverMeta(d)}</div>
            <div className="fl-posts">投稿 {data.postCounts[d.user_id] || 0}件</div>
          </div>
          <FollowButton targetId={d.user_id} currentUserId={userId} following={following} onToggle={onToggleFollow} />
        </div>
      ))}
    </div>
  );
}

/* ---------------- アカウント情報 ---------------- */
function AccountInfo({ user, driver, onViewProfile, onProfileEdit, onOpenFollowList, onLogout, showToast }) {
  const initial = (driver?.nickname || user.name || user.email || '?').charAt(0);
  const menuSections = [
    {
      title: 'アカウント',
      items: [
        { label: 'プロフィール編集', action: onProfileEdit },
        { label: 'フォローリスト', action: onOpenFollowList },
        { label: 'アカウント設定', action: () => showToast('設定は今後実装します') },
        { label: 'プライバシー設定', action: () => showToast('設定は今後実装します') },
      ],
    },
    {
      title: 'サポート',
      items: [
        { label: 'よくある質問（FAQ）', action: () => showToast('FAQ準備中です') },
        { label: '利用規約', action: () => showToast('準備中です') },
        { label: 'プライバシーポリシー', action: () => showToast('準備中です') },
      ],
    },
  ];
  const hasCover = !!driver?.cover_id;
  const cardStyle = hasCover ? {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${imageUrl(driver.cover_id)})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  return (
    <div>
      <div className={'ai-card' + (hasCover ? ' ai-card-photo' : '')} style={cardStyle}>
        {driver?.avatar_id
          ? <img className="ai-avatar ai-avatar-img" src={imageUrl(driver.avatar_id)} alt="" />
          : <div className="ai-avatar">{initial}</div>}
        <div className="ai-name">{driver?.nickname || user.name || '名称未設定'}</div>
        <div className="ai-email">{user.email}</div>
        {driver && <div className="ai-role">{[driver.body_type, driver.area, driver.run_style].filter(Boolean).join(' ｜ ')}</div>}
        <div className="ai-btns">
          <button className="ai-view-btn" onClick={onViewProfile}>自分のプロフィールを見る →</button>
          <button className="ai-logout-sm" onClick={onLogout}>ログアウト</button>
        </div>
      </div>
      <div className="ai-sections">
        {menuSections.map((section) => (
          <div key={section.title}>
            <div className="ai-section-label">{section.title}</div>
            <div className="ai-menu">
              {section.items.map((item, i, arr) => (
                <button key={item.label} className={'ai-menu-item' + (i < arr.length - 1 ? ' bd' : '')} onClick={item.action}>
                  <span>{item.label}</span><span className="ai-chev">›</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <button className="ai-logout-full" onClick={onLogout}>ログアウト</button>
      </div>
    </div>
  );
}

/* ---------------- プロフィール編集 ---------------- */
function ProfileEdit({ user, driver, onClose, onSaved, showToast }) {
  const [nickname, setNickname] = useState(driver?.nickname || '');
  const [bio, setBio] = useState(driver?.bio || '');
  const [bodyType, setBodyType] = useState(driver?.body_type || BODY_TYPES[0]);
  const [runStyle, setRunStyle] = useState(driver?.run_style || RUN_STYLES[0]);
  const [area, setArea] = useState(driver?.area || AREAS[0]);
  const [years, setYears] = useState(driver?.years != null ? String(driver.years) : '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(driver?.avatar_id ? imageUrl(driver.avatar_id) : '');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(driver?.cover_id ? imageUrl(driver.cover_id) : '');
  const [busy, setBusy] = useState(false);
  const avatarRef = useRef(null);
  const coverRef = useRef(null);

  const pickPhoto = (e, setFile, setPreview) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
    e.target.value = '';
  };

  const save = async () => {
    if (!nickname.trim()) { showToast('ニックネームを入力してください'); return; }
    setBusy(true);
    try {
      let avatarId = driver?.avatar_id || '';
      let coverId = driver?.cover_id || '';
      if (avatarFile) {
        const up = await storage.createFile(BUCKET, ID.unique(), avatarFile, [Permission.read(Role.any()), Permission.update(Role.user(user.$id)), Permission.delete(Role.user(user.$id))]);
        avatarId = up.$id;
      }
      if (coverFile) {
        const up = await storage.createFile(BUCKET, ID.unique(), coverFile, [Permission.read(Role.any()), Permission.update(Role.user(user.$id)), Permission.delete(Role.user(user.$id))]);
        coverId = up.$id;
      }
      await updateDriverProfile(user.$id, { nickname: nickname.trim(), bio, body_type: bodyType, run_style: runStyle, area, years: years !== '' ? Number(years) : null, avatar_id: avatarId, cover_id: coverId });
      showToast('プロフィールを保存しました');
      onSaved();
    } catch (e) { showToast('保存に失敗しました: ' + (e?.message || '')); }
    finally { setBusy(false); }
  };

  return (
    <div className="profile-edit">
      <div className="hdr pe-hdr-row">
        <button className="icon-btn" onClick={onClose}><IcClose /></button>
        <div style={{ fontSize: 17, fontWeight: 700 }}>プロフィール編集</div>
        <button className="pe-save-btn" onClick={save} disabled={busy}>{busy ? '保存中...' : '保存'}</button>
      </div>
      <div className="pe-photo-area">
        <div className="pe-cover" onClick={() => coverRef.current?.click()}>
          {coverPreview ? <img src={coverPreview} alt="" /> : <div className="pe-cover-placeholder" />}
          <div className="pe-cover-overlay"><IcPhoto /><span>背景写真を変更</span></div>
        </div>
        <div className="pe-avatar-wrap" onClick={() => avatarRef.current?.click()}>
          {avatarPreview ? <img className="pe-avatar-img" src={avatarPreview} alt="" /> : <div className="pe-avatar-placeholder">{(nickname || '?').charAt(0)}</div>}
          <div className="pe-avatar-overlay"><IcPhoto /></div>
        </div>
      </div>
      <input ref={avatarRef} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e, setAvatarFile, setAvatarPreview)} />
      <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e, setCoverFile, setCoverPreview)} />
      <p className="pe-hint">📸 自分のトラックや走行シーンをセットして、かっこよく見せよう</p>
      <div className="pe-form-section">
        <div className="field"><label>ニックネーム</label><input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="例：関西便のタカ" /></div>
        <div className="field"><label>自己紹介</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="例：大型車OKの食堂と深夜ラーメンを中心に投稿しています。" rows={3} /></div>
      </div>
      <div className="pe-form-section">
        <p className="pe-section-title">ドライバー情報</p>
        <div className="field"><label>車種・ボディタイプ</label><select value={bodyType} onChange={(e) => setBodyType(e.target.value)}>{BODY_TYPES.map((b) => <option key={b}>{b}</option>)}</select></div>
        <div className="field"><label>運行スタイル</label><select value={runStyle} onChange={(e) => setRunStyle(e.target.value)}>{RUN_STYLES.map((r) => <option key={r}>{r}</option>)}</select></div>
        <div className="field"><label>主な走行エリア</label><select value={area} onChange={(e) => setArea(e.target.value)}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></div>
        <div className="field"><label>ドライバー歴（年）</label><input value={years} onChange={(e) => setYears(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="例：12" /></div>
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

// バックオフィスサーバー（ZENRIN API中継）のベースURL
const BACKOFFICE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKOFFICE_URL) || 'http://localhost:8787';

// Webメルカトル投影（地図クリック時の座標変換）
const _T = 256;
const _lngToX = (l, z) => (l + 180) / 360 * _T * Math.pow(2, z);
const _latToY = (l, z) => { const s = Math.sin(l * Math.PI / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * _T * Math.pow(2, z); };
const _xToLng = (x, z) => x / (_T * Math.pow(2, z)) * 360 - 180;
const _yToLat = (y, z) => { const n = Math.PI - 2 * Math.PI * y / (_T * Math.pow(2, z)); return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); };
const _LVL = { TBN: 6, GIK: 5, AZC: 4, OAZ: 3, SHK: 2, TOD: 1 };

/* ---------------- 新店舗登録モーダル ---------------- */
function NewStoreModal({ initialName, userId, onConfirm, onCancel, showToast }) {
  const [name, setName] = useState(initialName || '');
  const [category, setCategory] = useState('店舗');
  const [searchWord, setSearchWord] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [prefCode, setPrefCode] = useState(null);
  const [zoom, setZoom] = useState(15);
  const [mapSrc, setMapSrc] = useState('');
  const [mapMsg, setMapMsg] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const mapWrapRef = useRef(null);
  const objUrlRef = useRef(null);

  useEffect(() => {
    if (lat != null && lng != null) loadMap(lat, lng, zoom);
  }, [lat, lng, zoom]);

  async function loadMap(clat, clng, z) {
    const wrap = mapWrapRef.current;
    const W = wrap ? (wrap.clientWidth || 360) : 360;
    try {
      const res = await fetch(`${BACKOFFICE_URL}/api/pub/staticmap?lng=${clng}&lat=${clat}&zoom=${z}&w=${W}&h=240`);
      if (!res.ok) { setMapMsg('地図取得に失敗しました（バックオフィスが起動中か確認してください）'); return; }
      const blob = await res.blob();
      if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
      objUrlRef.current = URL.createObjectURL(blob);
      setMapSrc(objUrlRef.current);
      setMapMsg('');
    } catch { setMapMsg('地図取得に失敗しました。バックオフィス（port:8787）が起動しているか確認してください。'); }
  }

  async function doGeocode() {
    if (!searchWord.trim()) return;
    setGeocoding(true); setMapMsg('');
    try {
      const res = await fetch(`${BACKOFFICE_URL}/api/pub/geocode?word=${encodeURIComponent(searchWord)}`);
      const data = await res.json();
      if (!res.ok || !data.hit || !data.items?.length) { setMapMsg('住所が見つかりませんでした。別の住所を試してください。'); return; }
      const top = data.items[0];
      setAddress(top.address); setLat(top.lat); setLng(top.lng); setPrefCode(top.pref_code); setZoom(16);
    } catch { setMapMsg('検索に失敗しました。バックオフィス（port:8787）が起動しているか確認してください。'); }
    finally { setGeocoding(false); }
  }

  async function handleMapClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - rect.left) - rect.width / 2;
    const dy = (e.clientY - rect.top) - rect.height / 2;
    const newLng = parseFloat(_xToLng(_lngToX(lng, zoom) + dx, zoom).toFixed(6));
    const newLat = parseFloat(_yToLat(_latToY(lat, zoom) + dy, zoom).toFixed(6));
    setLat(newLat); setLng(newLng);
    try {
      const res = await fetch(`${BACKOFFICE_URL}/api/pub/geocode?lng=${newLng}&lat=${newLat}`);
      const data = await res.json();
      if (data.items?.length) {
        const best = data.items.slice().sort((a, b) => (_LVL[b.level] || 0) - (_LVL[a.level] || 0))[0];
        setAddress(best.address); setPrefCode(best.pref_code);
      }
    } catch {}
  }

  async function handleSave() {
    if (!name.trim()) { showToast('店名を入力してください'); return; }
    if (lat == null || lng == null) { showToast('住所を入力して「検索」を押し、地点を確認してください'); return; }
    setSaving(true);
    try {
      const place = await createPlace(userId, { name: name.trim(), category, address: address || searchWord, lat, lng, pref_code: prefCode || 13 });
      onConfirm(place);
    } catch (e) { showToast('登録に失敗しました: ' + (e?.message || '')); }
    finally { setSaving(false); }
  }

  return (
    <div className="compose ns-screen">
      <div className="field"><label>店名 *</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：食堂まつり" /></div>
      <div className="field">
        <label>カテゴリ *</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {['店舗', '道の駅', 'トラックステーション', 'SA・PA'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label>住所で場所を確認</label>
        <div className="ns-geocode-row">
          <input value={searchWord} onChange={(e) => setSearchWord(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doGeocode(); } }}
            placeholder="例：埼玉県川口市..." />
          <button type="button" className="ns-search-btn" onClick={doGeocode} disabled={geocoding}>{geocoding ? '…' : '検索'}</button>
        </div>
      </div>
      <div className="ns-map-wrap" ref={mapWrapRef}>
        {mapSrc
          ? <>
              <img src={mapSrc} alt="地図" draggable="false" onClick={handleMapClick} className="ns-map-img" />
              <div className="ns-center-pin">🍚</div>
              <div className="ns-zoom">
                <button type="button" onClick={() => setZoom((z) => Math.min(20, z + 1))}>＋</button>
                <button type="button" onClick={() => setZoom((z) => Math.max(5, z - 1))}>−</button>
              </div>
            </>
          : <div className="ns-map-ph">{lat == null ? '住所を入力して「検索」を押すと地図が表示されます' : '読み込み中...'}</div>}
      </div>
      {mapMsg && <p style={{ margin: '8px 16px', fontSize: 13, color: '#dc2626' }}>{mapMsg}</p>}
      {lat != null && (
        <div className="ns-coord">
          <div className="ns-coord-addr">{address || '(住所未取得)'}</div>
          <div className="ns-coord-ll">緯度 {lat.toFixed(4)} ／ 経度 {lng.toFixed(4)}</div>
        </div>
      )}
      <div style={{ padding: '0 16px 16px' }}>
        <button className="submit" onClick={handleSave} disabled={saving || lat == null} style={{ marginTop: 16 }}>
          {saving ? '登録中...' : 'この場所で登録して投稿に戻る'}
        </button>
        <p className="compose-note">電話番号・営業時間などの詳細はバックオフィスで後から追加できます。</p>
      </div>
    </div>
  );
}

/* ---------------- ギャラリー投稿 ---------------- */
function GalleryCompose({ user, onPosted, showToast, goHome }) {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
    e.target.value = '';
  };

  const submit = async () => {
    if (!file) { showToast('写真を追加してください'); return; }
    if (!caption.trim()) { showToast('キャプションを入力してください'); return; }
    setBusy(true);
    try {
      await createGalleryPost(user.$id, caption, file);
      showToast('投稿しました'); onPosted(); goHome();
    } catch (e) { showToast('投稿に失敗しました: ' + (e?.message || '')); }
    finally { setBusy(false); }
  };

  return (
    <div className="compose">
      <div
        className={'gallery-photo-slot' + (preview ? ' has-img' : '')}
        onClick={() => !preview && fileRef.current?.click()}
      >
        {preview
          ? <>
              <img src={preview} alt="" />
              <button className="photo-slot-remove" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(''); }}>×</button>
            </>
          : <><IcPhoto /><span>写真を追加（必須）</span></>}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
      </div>
      <p className="compose-note" style={{ marginTop: 8 }}>風景・トラック・仕事の一コマをシェア</p>
      <div className="field">
        <label>キャプション *</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="深夜2時の湾岸線。今日も安全運転で。"
          rows={4}
        />
      </div>
      <button className="submit" onClick={submit} disabled={busy}>{busy ? '投稿中...' : '投稿する'}</button>
    </div>
  );
}

/* ---------------- 店舗選択画面 ---------------- */
function ShopSearchScreen({ initialName, userId, onSelect, onCancel, showToast }) {
  const [query, setQuery] = useState(initialName || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showNewStore, setShowNewStore] = useState(false);
  const timer = useRef(null);

  useEffect(() => { if (query.trim()) doSearch(query); }, []);

  const doSearch = async (val) => {
    setSearching(true);
    const res = await searchPlaces(val.trim());
    setResults(res);
    setSearching(false);
  };

  const handleChange = (val) => {
    setQuery(val);
    clearTimeout(timer.current);
    if (!val.trim()) { setResults([]); setSearching(false); return; }
    timer.current = setTimeout(() => doSearch(val), 300);
  };

  if (showNewStore) {
    return (
      <>
        <div className="hdr">
          <div className="back-row">
            <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setShowNewStore(false)}><IcBack /></button>
            <div className="hdr-title">新しい店を登録</div>
          </div>
        </div>
        <NewStoreModal
          initialName={query}
          userId={userId}
          onConfirm={(place) => onSelect(place)}
          onCancel={() => setShowNewStore(false)}
          showToast={showToast}
        />
      </>
    );
  }

  return (
    <>
      <div className="hdr">
        <div className="back-row">
          <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={onCancel}><IcBack /></button>
          <div className="hdr-title">店舗を選択</div>
        </div>
      </div>
      <div className="shop-search-wrap">
        <div className="shop-search-bar">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="店名を入力して検索..."
            autoFocus
          />
          {query && <button className="shop-search-clear" onClick={() => { setQuery(''); setResults([]); }}>×</button>}
        </div>
        <div className="shop-search-list">
          {searching && <p className="shop-search-status">検索中...</p>}
          {!searching && results.map((p) => (
            <div key={p.$id} className="sug-item" onClick={() => onSelect(p)}>
              <div className="sug-name"><IcPin />{p.name}</div>
              <div className="sug-addr">{p.address}</div>
            </div>
          ))}
          {!searching && results.length === 0 && query.trim() && (
            <p className="shop-search-empty">「{query}」の店舗は見つかりませんでした</p>
          )}
          {!query.trim() && <p className="shop-search-hint">店名を入力すると候補が表示されます</p>}
        </div>
        <div className="shop-search-footer">
          <button className="new-store-btn" onClick={() => setShowNewStore(true)}>＋ 新しい店として登録</button>
        </div>
      </div>
    </>
  );
}

/* ---------------- 飯を投稿（3枚対応・店舗DB連携） ---------------- */
function Compose({ user, onPosted, showToast, goHome }) {
  const [dish, setDish] = useState('');
  const [shop, setShop] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [oogata, setOogata] = useState(false);
  const [amenities, setAmenities] = useState([]);
  const [genres, setGenres] = useState([]);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState([null, null, null]);
  const [previews, setPreviews] = useState(['', '', '']);
  const [busy, setBusy] = useState(false);
  // 店舗DB連携
  const [placeId, setPlaceId] = useState('');
  const [placeLat, setPlaceLat] = useState(null);
  const [placeLng, setPlaceLng] = useState(null);
  const [showShopSearch, setShowShopSearch] = useState(false);
  const refs = [useRef(null), useRef(null), useRef(null)];
  const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const pickFile = (idx, e) => {
    const f = e.target.files?.[0];
    if (f) {
      const nf = [...files]; nf[idx] = f; setFiles(nf);
      const np = [...previews]; np[idx] = URL.createObjectURL(f); setPreviews(np);
    }
    e.target.value = '';
  };
  const removeFile = (idx) => {
    const nf = [...files]; nf[idx] = null; setFiles(nf);
    const np = [...previews]; np[idx] = ''; setPreviews(np);
  };

  const clearPlace = () => { setShop(''); setLocation(''); setPlaceId(''); setPlaceLat(null); setPlaceLng(null); };

  const selectPlace = (place) => {
    setShop(place.name);
    setLocation(place.address || '');
    setPlaceId(place.$id);
    setPlaceLat(place.lat ?? null);
    setPlaceLng(place.lng ?? null);
    setShowShopSearch(false);
  };

  const submit = async () => {
    if (!files[0]) { showToast('写真を1枚以上追加してください'); return; }
    if (!dish.trim()) { showToast('メニュー名を入力してください'); return; }
    if (!placeId) { showToast('店名を選択または新規登録してください'); return; }
    if (!comment.trim()) { showToast('ひとことを入力してください'); return; }
    setBusy(true);
    try {
      await createMealPost(user.$id, {
        dish: dish.trim(), shop, price, location,
        place_id: placeId || '', lat: placeLat, lng: placeLng,
        oogata_ok: oogata, amenities, genres, comment,
      }, files.filter(Boolean));
      showToast('投稿しました'); onPosted(); goHome();
    } catch (e) { console.error('createMealPost error:', e, JSON.stringify(e)); showToast('投稿に失敗しました: ' + (e?.message || '')); }
    finally { setBusy(false); }
  };

  if (showShopSearch) {
    return (
      <ShopSearchScreen
        initialName={shop}
        userId={user.$id}
        onSelect={selectPlace}
        onCancel={() => setShowShopSearch(false)}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="compose">
      <div className="photo-slots">
        {[0, 1, 2].map((idx) => {
          const unlocked = idx === 0 || (idx === 1 && previews[0]) || (idx === 2 && previews[1]);
          return (
            <div
              key={idx}
              className={'photo-slot' + (previews[idx] ? ' has-img' : '')}
              style={{ visibility: unlocked ? 'visible' : 'hidden' }}
              onClick={() => unlocked && !previews[idx] && refs[idx].current?.click()}
            >
              {previews[idx]
                ? <>
                    <img src={previews[idx]} alt="" />
                    <button className="photo-slot-remove" onClick={(e) => { e.stopPropagation(); removeFile(idx); }}>×</button>
                  </>
                : <><IcPhoto /><span>{idx === 0 ? '写真を追加' : '追加'}</span></>}
              <input ref={refs[idx]} type="file" accept="image/*" hidden onChange={(e) => pickFile(idx, e)} />
            </div>
          );
        })}
      </div>
      <p className="compose-note" style={{ marginTop: 8 }}>写真は必須です（最大3枚）</p>
      <div className="field"><label>メニュー名 *</label><input value={dish} onChange={(e) => setDish(e.target.value)} placeholder="例：デカ盛り唐揚げ定食" /></div>

      {/* 店名 - 必須・DB連携のみ */}
      <div className="field">
        <label>店名 *</label>
        {placeId ? (
          <div className="place-selected">
            <IcPin /><span className="place-selected-name">{shop}</span>
            <button type="button" className="place-badge-x" onClick={clearPlace}>×</button>
          </div>
        ) : (
          <button type="button" className="shop-select-btn" onClick={() => setShowShopSearch(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            店舗を検索して選択...
          </button>
        )}
      </div>

      {/* 住所 - 店舗選択時のみ表示（読み取り専用） */}
      {placeId && location && (
        <div className="field">
          <label>住所</label>
          <div className="location-display"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>{location}</div>
        </div>
      )}

      <div className="field"><label>金額（円）</label><input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="例：1280" /></div>
      <div className="field"><label>この店のポイント（タップで選択）</label>
        <div className="select-tags">{AMENITIES.map((a) => <button key={a} type="button" className={'opt' + (amenities.includes(a) ? ' on' : '')} onClick={() => { toggle(amenities, setAmenities, a); if (a === '大型車OK') setOogata(!amenities.includes(a)); }}>{a}</button>)}</div></div>
      <div className="field"><label>飯ジャンル（タップで選択）</label>
        <div className="select-tags">{GENRES.map((g) => <button key={g} type="button" className={'opt' + (genres.includes(g) ? ' on' : '')} onClick={() => toggle(genres, setGenres, g)}>{g}</button>)}</div></div>
      <div className="field"><label>ひとこと *</label><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="大型駐車場あり、深夜でも助かる一杯。" /></div>
      <button className="submit" onClick={submit} disabled={busy}>{busy ? '投稿中...' : '投稿する'}</button>
      <p className="compose-note">入力は選択式中心。誰でもそれらしい投稿が作れます。</p>
    </div>
  );
}

/* ---------------- 検索ワードのハイライト ---------------- */
function highlightText(text, term) {
  if (!term || !text) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="search-highlight">{text.slice(idx, idx + term.length)}</span>
      {text.slice(idx + term.length)}
    </>
  );
}

/* ---------------- 検索結果コンパクトカード ---------------- */
function SearchResultCard({ post, driver, query, onTap, likeCounts, onOpenProfile }) {
  const imgs = postImages(post);
  const thumb = imgs[0] || null;
  return (
    <div className="sr-card" onClick={() => onTap?.(post)}>
      <div className="sr-card-inner">
        {thumb
          ? <img className="sr-thumb" src={thumb} alt="" />
          : <div className="sr-thumb sr-thumb-empty" />}
        <div className="sr-info">
          <div className="sr-author" onClick={(e) => { e.stopPropagation(); onOpenProfile(post.driver_id); }}>
            {driver?.avatar_id
              ? <img className="sr-avatar" src={imageUrl(driver.avatar_id)} alt="" />
              : <div className="sr-avatar" />}
            <span className="sr-author-name">{driver?.nickname || 'ドライバー'}：</span>
          </div>
          <div className="sr-dish">{highlightText(post.dish, query)}</div>
          {post.shop && <div className="sr-shop">{post.shop}</div>}
          <div className="sr-price-row">
            {post.price != null && <span className="sr-price">{Number(post.price).toLocaleString()}円</span>}
            {post.location && <span className="sr-loc"><IcPin />{post.location}</span>}
          </div>
          {post.oogata_ok && (
            <span className="ok-badge" style={{ marginTop: 6, fontSize: 11, padding: '3px 8px' }}>
              <IcCheck />大型車OK
            </span>
          )}
        </div>
      </div>
      <div className="sr-footer">
        <div className="sr-tags">
          {(post.genres || []).map((g) => <span className="tag" key={g}>{g}</span>)}
        </div>
        <div className="sr-counts">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
              <path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z" />
            </svg>
            {likeCounts?.[post.$id] || 0}
          </span>
          <span><IcComment />0</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 検索画面 ---------------- */
const POPULAR_KEYWORDS = ['デカ盛り', 'ラーメン', 'SA・PA', '深夜飯', '大型車OK', '朝定食', '定食', '長距離'];
/* ---------------- 通知画面 ---------------- */
function NotificationScreen({ data, loading, onOpenProfile, onOpenPost, onMarkRead }) {
  if (loading) return <div className="center-msg"><div className="spinner" />読み込み中...</div>;

  const items = data?.items || [];
  if (items.length === 0) {
    return (
      <div className="center-msg">
        <div className="big-emoji">🔔</div>
        <div className="ttl">通知はまだありません</div>
        <div className="sub">フォローやいいねがあるとここに届きます</div>
      </div>
    );
  }

  const unread = items.filter((n) => !n.read);
  const past   = items.filter((n) => n.read);

  const notifText = (n) => {
    const name = data.driversMap[n.actor_id]?.nickname || 'ドライバー';
    if (n.type === 'follow') return `${name}があなたをフォローしました`;
    if (n.type === 'like')   return `${name}があなたのドライバー飯にいいねしました`;
    if (n.type === 'comment') return `${name}がコメントしました`;
    return `${name}からの通知`;
  };

  const TypeIcon = ({ type }) => {
    const cls = 'notif-type-icon ' + (type === 'follow' ? 'notif-type-follow' : type === 'like' ? 'notif-type-like' : 'notif-type-comment');
    const ic = type === 'follow' ? <IcUser /> : type === 'like' ? <IcHeart /> : <IcComment />;
    return <div className={cls}>{ic}</div>;
  };

  const NotifRow = ({ n }) => {
    const actor = data.driversMap[n.actor_id];
    const post  = n.target_id ? data.postsMap?.[n.target_id] : null;
    const thumb = post?.image_id ? imageUrl(post.image_id) : null;
    return (
      <div className={'notif-row' + (n.read ? '' : ' notif-unread')}
        onClick={() => {
          if (!n.read) onMarkRead?.(n.$id);
          if ((n.type === 'like' || n.type === 'comment') && post) {
            onOpenPost?.(post);
          } else if (actor) {
            onOpenProfile?.(n.actor_id);
          }
        }}>
        <div className="notif-avatar-wrap">
          {actor?.avatar_id
            ? <img className="notif-avatar" src={imageUrl(actor.avatar_id)} alt="" />
            : <div className="notif-avatar notif-avatar-ph">{actor?.nickname?.[0] || '?'}</div>}
          <TypeIcon type={n.type} />
        </div>
        <div className="notif-body">
          <div className="notif-text">{notifText(n)}</div>
          <div className="notif-time">{relativeTime(n.created_at)}</div>
        </div>
        {thumb && <img className="notif-thumb" src={thumb} alt="" />}
        {!n.read && <div className="notif-dot" />}
      </div>
    );
  };

  return (
    <div>
      {unread.length > 0 && (
        <>
          <div className="notif-section">新着 <span className="notif-count">{unread.length}</span></div>
          {unread.map((n) => <NotifRow key={n.$id} n={n} />)}
        </>
      )}
      {past.length > 0 && (
        <>
          <div className="notif-section">過去の通知</div>
          {past.map((n) => <NotifRow key={n.$id} n={n} />)}
        </>
      )}
    </div>
  );
}

const SEARCH_TABS = ['すべて', 'ユーザー', '投稿'];

function SearchScreen({ onOpenProfile, onTap, currentUserId, following, onToggleFollow, likeCounts, myLikes, onToggleLike, showToast }) {
  const [query, setQuery] = useState('');
  const [searchTab, setSearchTab] = useState('すべて');
  const [results, setResults] = useState(null);
  const [foundDrivers, setFoundDrivers] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  const doSearch = async (term) => {
    if (!term.trim()) { setResults(null); setFoundDrivers([]); return; }
    setSearching(true);
    try {
      const [postData, driverList] = await Promise.all([
        searchMealPosts(term),
        searchDrivers(term),
      ]);
      setResults(postData);
      setFoundDrivers(driverList);
    } catch { showToast('検索に失敗しました'); }
    finally { setSearching(false); }
  };

  const handleInput = (val) => {
    setQuery(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(val), 400);
  };

  const handleChip = (keyword) => {
    setQuery(keyword);
    doSearch(keyword);
  };

  const clear = () => { setQuery(''); setResults(null); setFoundDrivers([]); setSearchTab('すべて'); };

  const showDrivers = searchTab === 'すべて' || searchTab === 'ユーザー';
  const showPosts   = searchTab === 'すべて' || searchTab === '投稿';
  const hasResults  = results && (results.posts.length > 0 || foundDrivers.length > 0);

  return (
    <div className="screen">
      <div className="hdr">
        <div className="search-bar-wrap">
          <IcSearch />
          <input
            className="search-input"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="ユーザー名・料理・場所で検索"
            autoFocus
          />
          {query && <button className="search-clear" onClick={clear}><IcClose /></button>}
        </div>
        {query && !searching && hasResults && (
          <div className="search-tabs">
            {SEARCH_TABS.map((t) => (
              <button key={t} className={'search-tab' + (searchTab === t ? ' active' : '')} onClick={() => setSearchTab(t)}>{t}</button>
            ))}
          </div>
        )}
      </div>

      {!query && (
        <div className="search-home">
          <div className="search-section-label">よく検索されるキーワード</div>
          <div className="search-chips">
            {POPULAR_KEYWORDS.map((k) => (
              <button key={k} className="search-chip" onClick={() => handleChip(k)}>{k}</button>
            ))}
          </div>
        </div>
      )}

      {query && searching && <div className="center-msg"><div className="spinner" />検索中...</div>}

      {query && !searching && results && (
        <div>
          {hasResults && (
            <div className="sr-result-title">「{highlightText(query, query)}」の検索結果</div>
          )}

          {showDrivers && foundDrivers.length > 0 && (
            <div>
              {searchTab === 'すべて' && (
                <div className="sr-section-label">ユーザー</div>
              )}
              {foundDrivers.map((d) => (
                <div key={d.$id} className="search-driver-row" onClick={() => onOpenProfile(d.user_id)}>
                  {d.avatar_id ? <img className="avatar" src={imageUrl(d.avatar_id)} alt="" /> : <div className="avatar" />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="name">{highlightText(d.nickname, query)}</div>
                    <div className="meta">{driverMeta(d)}</div>
                  </div>
                  <FollowButton targetId={d.user_id} currentUserId={currentUserId} following={following} onToggle={onToggleFollow} />
                </div>
              ))}
            </div>
          )}

          {showPosts && results.posts.length > 0 && (
            <div>
              {searchTab === 'すべて' && (
                <div className="sr-section-label">投稿</div>
              )}
              <div className="sr-list">
                {results.posts.map((p) => (
                  <SearchResultCard
                    key={p.$id}
                    post={p}
                    driver={results.driversMap[p.driver_id]}
                    query={query}
                    onTap={onTap}
                    likeCounts={likeCounts}
                    onOpenProfile={onOpenProfile}
                  />
                ))}
              </div>
            </div>
          )}

          {results.posts.length === 0 && foundDrivers.length === 0 && (
            <div className="center-msg">
              <div className="big-emoji">🔍</div>
              <div className="ttl">「{query}」の結果が見つかりませんでした</div>
              <div className="sub">別のキーワードで検索してみてください</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- パスワード再設定（メールリンクから） ---------------- */
function PasswordResetScreen({ userId, secret, onDone, showToast }) {
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr('');
    if (password.length < 8) { setErr('パスワードは8文字以上で入力してください'); return; }
    if (password !== password2) { setErr('パスワードが一致しません'); return; }
    setBusy(true);
    try {
      await updateRecovery(userId, secret, password);
      setDone(true);
    } catch {
      setErr('再設定に失敗しました。リンクの有効期限が切れている可能性があります。');
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="screen">
        <div className="auth">
          <div className="auth-reset-done-icon">✅</div>
          <h2>パスワードを変更しました</h2>
          <p className="lead">新しいパスワードでログインしてください。</p>
          <button className="submit" onClick={onDone}>ログイン画面へ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="hdr">
        <div className="back-row">
          <div className="hdr-title">パスワードの再設定</div>
        </div>
      </div>
      <div className="auth">
        <h2>新しいパスワードを設定</h2>
        <p className="lead">8文字以上のパスワードを入力してください。</p>
        <div className="field"><label>新しいパスワード</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8文字以上" /></div>
        <div className="field"><label>パスワード（確認）</label><input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="もう一度入力" /></div>
        {err && <div className="err">{err}</div>}
        <button className="submit" onClick={submit} disabled={busy}>{busy ? '処理中...' : 'パスワードを変更する'}</button>
      </div>
    </div>
  );
}

/* ---------------- ログイン / 新規登録 ---------------- */
function AuthScreen({ onAuthed, showToast }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [bodyType, setBodyType] = useState(BODY_TYPES[0]);
  const [runStyle, setRunStyle] = useState(RUN_STYLES[0]);
  const [area, setArea] = useState(AREAS[0]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const submit = async () => {
    setErr('');
    if (!email.trim() || !password) { setErr('メールとパスワードを入力してください'); return; }
    if (mode === 'register' && !nickname.trim()) { setErr('ニックネームを入力してください'); return; }
    setBusy(true);
    try {
      if (mode === 'login') await login(email.trim(), password);
      else await register(email.trim(), password, { nickname: nickname.trim(), body_type: bodyType, run_style: runStyle, area });
      showToast(mode === 'login' ? 'ログインしました' : '登録しました');
      await onAuthed();
    } catch (e) { setErr(e?.message || 'うまくいきませんでした'); }
    finally { setBusy(false); }
  };

  const sendReset = async () => {
    setErr('');
    if (!email.trim()) { setErr('メールアドレスを入力してください'); return; }
    setBusy(true);
    try {
      await createRecovery(email.trim(), window.location.origin);
      setForgotSent(true);
    } catch (e) { setErr(e?.message || '送信できませんでした'); }
    finally { setBusy(false); }
  };

  const goLogin = () => { setMode('login'); setErr(''); setForgotSent(false); };

  if (mode === 'forgot') {
    return (
      <div className="auth">
        <div className="auth-forgot-icon">🔑</div>
        <h2>パスワードをお忘れですか？</h2>
        {!forgotSent ? (
          <>
            <p className="lead">登録したメールアドレスを入力してください。パスワード再設定のリンクをお送りします。</p>
            <div className="field"><label>メールアドレス</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
            {err && <div className="err">{err}</div>}
            <button className="submit" onClick={sendReset} disabled={busy}>{busy ? '送信中...' : '再設定メールを送る'}</button>
            <div className="switch"><button onClick={goLogin}>ログインに戻る</button></div>
          </>
        ) : (
          <div className="auth-sent">
            <div className="auth-sent-icon">📩</div>
            <p className="auth-sent-title">メールを送信しました</p>
            <p className="auth-sent-msg"><strong>{email}</strong> にパスワード再設定リンクをお送りしました。メールをご確認ください。</p>
            <button className="submit" onClick={goLogin}>ログインに戻る</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth">
      <h2>{mode === 'login' ? 'ログイン' : '新規登録'}</h2>
      <p className="lead">{mode === 'login' ? 'メールとパスワードでログインしてください。' : 'ドライバーとして登録します。入力は最小限、あとは選ぶだけ。'}</p>
      <div className="field"><label>メールアドレス</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
      <div className="field"><label>パスワード（8文字以上）</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" /></div>
      {mode === 'register' && (
        <>
          <div className="field"><label>ニックネーム</label><input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="例：関西便のタカ" /></div>
          <div className="field"><label>車種・ボディタイプ</label><select value={bodyType} onChange={(e) => setBodyType(e.target.value)}>{BODY_TYPES.map((b) => <option key={b}>{b}</option>)}</select></div>
          <div className="field"><label>運行スタイル</label><select value={runStyle} onChange={(e) => setRunStyle(e.target.value)}>{RUN_STYLES.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div className="field"><label>主な走行エリア</label><select value={area} onChange={(e) => setArea(e.target.value)}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></div>
        </>
      )}
      {err && <div className="err">{err}</div>}
      <button className="submit" onClick={submit} disabled={busy}>{busy ? '処理中...' : (mode === 'login' ? 'ログイン' : '登録する')}</button>
      <div className="switch">
        {mode === 'login' ? 'アカウントがない方は ' : 'すでにアカウントをお持ちの方は '}
        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>{mode === 'login' ? '新規登録' : 'ログイン'}</button>
      </div>
      {mode === 'login' && (
        <div className="switch" style={{ marginTop: 8 }}>
          <button onClick={() => { setMode('forgot'); setErr(''); }}>パスワードをお忘れの方</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- アプリ本体 ---------------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [driver, setDriver] = useState(null);
  const [screen, setScreen] = useState('home');
  const [activeTab, setActiveTab] = useState('おすすめ');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [timelineCursor, setTimelineCursor] = useState(null);
  const sentinelRef = useRef(null);
  const [following, setFollowing] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [followData, setFollowData] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [likeCounts, setLikeCounts] = useState({});
  const [myLikes, setMyLikes] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [favData, setFavData] = useState(null);
  const [favGalleryData, setFavGalleryData] = useState(null);
  const [favLoading, setFavLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [selectedGalleryDriver, setSelectedGalleryDriver] = useState(null);
  const [prevScreen, setPrevScreen] = useState('home');
  const [notifData, setNotifData] = useState(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recoveryParams, setRecoveryParams] = useState(null);
  const localReadIds = useRef(new Set());
  const toastTimer = useRef(null);
  const followInProgress = useRef(new Set());
  const likeInProgress = useRef(new Set());

  const showToast = (msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2200);
  };

  const loadLikes = async (targetIds, uid) => {
    try {
      const docs = await getLikesFor(targetIds);
      const counts = {}; const mine = [];
      for (const l of docs) {
        counts[l.target_id] = (counts[l.target_id] || 0) + 1;
        if (uid && l.user_id === uid) mine.push(l.target_id);
      }
      setLikeCounts((prev) => ({ ...prev, ...counts }));
      setMyLikes((prev) => [...new Set([...prev, ...mine])]);
    } catch { /* noop */ }
  };

  const refreshAuth = async () => {
    const u = await getCurrentUser();
    setUser(u);
    if (u) {
      const d = await getDriver(u.$id);
      setDriver(d);
      setFollowing(await getFollowingIds(u.$id));
      getUnreadNotificationCount(u.$id).then(setUnreadCount).catch(() => {});
    } else { setDriver(null); setFollowing([]); setUnreadCount(0); }
    return u;
  };

  const loadTimeline = async (uid) => {
    setLoading(true);
    setHasMore(false);
    setTimelineCursor(null);
    try {
      const d = await listMealTimeline();
      setData(d);
      setHasMore(d.hasMore);
      setTimelineCursor(d.lastId);
      const postIds = d.posts.map((p) => p.$id);
      await Promise.all([
        loadLikes(postIds, uid),
        getCommentCounts(postIds).then((c) => setCommentCounts((prev) => ({ ...prev, ...c }))).catch(() => {}),
      ]);
    } catch (e) { showToast('読み込みに失敗: ' + (e?.message || '')); }
    finally { setLoading(false); }
  };

  const loadMoreTimeline = async () => {
    if (loadingMore || !hasMore || !timelineCursor) return;
    setLoadingMore(true);
    try {
      const more = await listMealTimeline(timelineCursor);
      setData((prev) => {
        if (!prev) return more;
        const existingIds = new Set(prev.posts.map((p) => p.$id));
        const newPosts = more.posts.filter((p) => !existingIds.has(p.$id));
        return { posts: [...prev.posts, ...newPosts], driversMap: { ...prev.driversMap, ...more.driversMap } };
      });
      setHasMore(more.hasMore);
      setTimelineCursor(more.lastId);
      if (more.posts.length > 0) {
        const ids = more.posts.map((p) => p.$id);
        await loadLikes(ids, user?.$id);
        getCommentCounts(ids).then((c) => setCommentCounts((prev) => ({ ...prev, ...c }))).catch(() => {});
      }
    } catch { showToast('追加読み込みに失敗しました'); }
    finally { setLoadingMore(false); }
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreTimeline(); },
      { rootMargin: '300px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, timelineCursor]);

  useEffect(() => {
    // パスワードリセットのメールリンクから来た場合（?userId=xxx&secret=yyy）を検出
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const secret = params.get('secret');
    if (userId && secret) {
      setRecoveryParams({ userId, secret });
      window.history.replaceState({}, '', window.location.pathname);
    }
    (async () => { const u = await refreshAuth(); await loadTimeline(u?.$id); })();
  }, []);

  const loadProfile = async (driverUserId, uid) => {
    setProfileLoading(true);
    try {
      const pd = await getProfileData(driverUserId, uid);
      setProfileData(pd);
      await loadLikes(pd.posts.map((p) => p.$id), uid);
    } catch (e) { showToast('プロフィール取得に失敗: ' + (e?.message || '')); }
    finally { setProfileLoading(false); }
  };

  const openProfile = (driverUserId) => {
    setProfileData(null);
    setScreen('profile');
    loadProfile(driverUserId, user?.$id);
  };

  const openMyPage = () => {
    if (!user) { setScreen('account'); return; }
    setScreen('mypage');
    setProfileData(null);
    loadProfile(user.$id, user.$id);
  };

  const handleProfileSaved = async () => {
    const u = await refreshAuth();
    setScreen('mypage');
    if (u) loadProfile(u.$id, u.$id);
  };

  const loadFollowing = async (uid) => {
    setFollowLoading(true);
    try {
      const fd = await getFollowingFeed(uid);
      setFollowData(fd);
      const ids = fd.items.filter((it) => it.kind !== 'badge').map((it) => it.doc.$id);
      await loadLikes(ids, uid);
    } catch (e) { showToast('取得に失敗: ' + (e?.message || '')); }
    finally { setFollowLoading(false); }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'フォロー中' && !followData && user) loadFollowing(user.$id);
  };

  const loadNotifications = async (uid) => {
    setNotifLoading(true);
    try {
      const nd = await getNotifications(uid);
      // ローカルで既読済みの通知は再フェッチ後も既読状態を維持する
      nd.items = nd.items.map((n) =>
        localReadIds.current.has(n.$id) ? { ...n, read: true } : n
      );
      setNotifData(nd);
    } catch (e) { showToast('通知エラー: ' + (e?.message || String(e))); }
    finally { setNotifLoading(false); }
  };

  const openNotifications = () => {
    setScreen('notifications');
    if (user) loadNotifications(user.$id);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    const count = await markAllNotificationsRead(user.$id).catch(() => 0);
    if (count > 0) {
      setUnreadCount(0);
      setNotifData((d) => {
        if (!d) return d;
        d.items.forEach((n) => localReadIds.current.add(n.$id));
        return { ...d, items: d.items.map((n) => ({ ...n, read: true })) };
      });
    }
  };

  const loadFavorites = async (uid) => {
    setFavLoading(true);
    try {
      const [fd, gd] = await Promise.all([
        getLikedPostsData(uid),
        getLikedGalleriesData(uid).catch(() => ({ items: [], driversMap: {} })),
      ]);
      setFavData(fd);
      setFavGalleryData(gd);
      const galleryIds = gd.items.map((it) => it.gallery.$id);
      await loadLikes([...fd.items.map((it) => it.post.$id), ...galleryIds], uid);
    } catch (e) { showToast('取得に失敗: ' + (e?.message || '')); }
    finally { setFavLoading(false); }
  };

  const openFavorites = () => {
    if (!user) { setScreen('account'); return; }
    setScreen('favorites');
    loadFavorites(user.$id);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null); setDriver(null); setFollowing([]); setMyLikes([]);
    showToast('ログアウトしました'); setScreen('home');
  };

  const toggleFollow = async (targetId) => {
    if (!user) { showToast('フォローするにはログインが必要です'); setScreen('account'); return; }
    if (targetId === user.$id) { showToast('自分はフォローできません'); return; }
    if (followInProgress.current.has(targetId)) return;
    followInProgress.current.add(targetId);
    const was = following.includes(targetId);
    try {
      if (was) { await unfollow(user.$id, targetId); setFollowing((f) => f.filter((x) => x !== targetId)); showToast('フォローを解除しました'); }
      else { await follow(user.$id, targetId); setFollowing((f) => [...f, targetId]); showToast('フォローしました'); }
      if ((screen === 'profile' || screen === 'post-detail') && profileData?.driver?.user_id === targetId) {
        setProfileData((pd) => pd ? { ...pd, followers: pd.followers + (was ? -1 : 1) } : pd);
      }
    } catch (e) { showToast('うまくいきませんでした: ' + (e?.message || '')); }
    finally { followInProgress.current.delete(targetId); }
  };

  const toggleLike = async (targetType, targetId, ownerId) => {
    if (!user) { showToast('お気に入りにはログインが必要です'); setScreen('account'); return; }
    if (likeInProgress.current.has(targetId)) return;
    likeInProgress.current.add(targetId);
    const liked = myLikes.includes(targetId);
    setMyLikes((s) => liked ? s.filter((x) => x !== targetId) : [...s, targetId]);
    setLikeCounts((c) => ({ ...c, [targetId]: (c[targetId] || 0) + (liked ? -1 : 1) }));
    try {
      if (liked) await unlikeTarget(user.$id, targetId);
      else await likeTarget(user.$id, targetType, targetId, ownerId);
      showToast(liked ? 'お気に入りから外しました' : 'お気に入りに保存しました');
      if (screen === 'favorites') loadFavorites(user.$id);
    } catch (e) {
      setMyLikes((s) => liked ? [...s, targetId] : s.filter((x) => x !== targetId));
      setLikeCounts((c) => ({ ...c, [targetId]: (c[targetId] || 0) + (liked ? 1 : -1) }));
      showToast('うまくいきませんでした: ' + (e?.message || ''));
    } finally {
      likeInProgress.current.delete(targetId);
    }
  };

  const openPostDetail = (post) => {
    const d = data?.driversMap?.[post.driver_id] || followData?.driversMap?.[post.driver_id] || null;
    setPrevScreen(screen);
    setSelectedPost(post);
    setSelectedDriver(d);
    setScreen('post-detail');
  };

  const filterData = (fn) => data ? { posts: data.posts.filter(fn), driversMap: data.driversMap } : null;

  const cardProps = {
    onOpenProfile: openProfile, currentUserId: user?.$id, following, onToggleFollow: toggleFollow,
    likeCounts, myLikes, onToggleLike: toggleLike, commentCounts,
  };

  const isMyPageArea = ['mypage', 'account-info', 'profile-edit', 'follow-list'].includes(screen);

  return (
    <div className="phone">

      {/* ホーム（5つの独立タブ） */}
      {screen === 'home' && (
        <div className="screen">
          <div className="hdr">
            <div className="hdr-row">
              <div className="hdr-title" style={{ color: 'var(--orange)' }}>トラックドライバー飯</div>
              <button className="icon-btn" onClick={openNotifications}>
                <IcBell />
                {unreadCount > 0 && <span className="dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
            </div>
            <div className="home-tabs">
              {['おすすめ', 'フォロー中'].map((t) => (
                <button key={t} className={'home-tab' + (activeTab === t ? ' active' : '')} onClick={() => handleTabChange(t)}>{t}</button>
              ))}
              {['SA・PA', 'デカ盛り', '大型車OK'].map((t) => (
                <button key={t} className={'home-tab' + (activeTab === t ? ' active' : '')} onClick={() => handleTabChange(t)}>{t}</button>
              ))}
            </div>
          </div>
          {activeTab === 'おすすめ' && (
            <>
              <Timeline data={data} loading={loading} onTap={openPostDetail} {...cardProps} />
              {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
              {loadingMore && <div className="loading-more"><span className="loading-spinner" />読み込み中…</div>}
              {!hasMore && data?.posts?.length > 0 && <div className="timeline-end">— 全件表示済み —</div>}
            </>
          )}
          {activeTab === 'フォロー中' && <FollowingFeed user={user} data={followData} loading={followLoading} onTap={openPostDetail}
              onTapGallery={(g, d) => { setPrevScreen(screen); setSelectedGallery(g); setSelectedGalleryDriver(d || null); setScreen('gallery-detail'); }}
              onOpenProfile={openProfile} likeCounts={likeCounts} myLikes={myLikes} onToggleLike={toggleLike} commentCounts={commentCounts} showToast={showToast} />}
          {activeTab === 'SA・PA'   && <Timeline data={filterData((p) => p.genres?.includes('SA・PA飯'))} loading={loading} onTap={openPostDetail} {...cardProps} />}
          {activeTab === 'デカ盛り' && <Timeline data={filterData((p) => p.genres?.includes('デカ盛り'))} loading={loading} onTap={openPostDetail} {...cardProps} />}
          {activeTab === '大型車OK' && <Timeline data={filterData((p) => p.oogata_ok === true)} loading={loading} onTap={openPostDetail} {...cardProps} />}
        </div>
      )}

      {/* 投稿詳細 */}
      {screen === 'post-detail' && selectedPost && (
        <PostDetail
          post={selectedPost}
          driver={selectedDriver}
          user={user}
          myDriver={driver}
          following={following}
          onToggleFollow={toggleFollow}
          likeCounts={likeCounts}
          myLikes={myLikes}
          onToggleLike={toggleLike}
          onBack={() => setScreen(prevScreen || 'home')}
          showToast={showToast}
          onOpenProfile={openProfile}
          onCommentCountChange={(postId, delta) =>
            setCommentCounts((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 0) + delta) }))
          }
          onDeleted={() => {
            const id = selectedPost.$id;
            setData(prev => prev ? { ...prev, posts: prev.posts.filter(p => p.$id !== id) } : prev);
            setFavData(prev => prev ? { ...prev, items: prev.items.filter(i => i.post.$id !== id) } : prev);
            setScreen(prevScreen || 'home');
            setSelectedPost(null);
            showToast('投稿を削除しました');
          }}
        />
      )}

      {/* ギャラリー詳細 */}
      {screen === 'gallery-detail' && selectedGallery && (
        <GalleryDetail
          gallery={selectedGallery}
          driver={selectedGalleryDriver}
          user={user}
          myDriver={driver}
          following={following}
          onToggleFollow={toggleFollow}
          likeCounts={likeCounts}
          myLikes={myLikes}
          onToggleLike={toggleLike}
          onBack={() => setScreen(prevScreen || 'home')}
          onOpenProfile={openProfile}
          showToast={showToast}
          onDeleted={() => {
            const id = selectedGallery.$id;
            setFavGalleryData(prev => prev ? { ...prev, items: prev.items.filter(i => i.gallery.$id !== id) } : prev);
            setScreen(prevScreen || 'home');
            setSelectedGallery(null);
            showToast('投稿を削除しました');
          }}
        />
      )}

      {screen === 'profile' && (
        <div className="screen">
          <div className="hdr">
            <div className="back-row">
              <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setScreen('home')}><IcBack /></button>
              <div className="hdr-title">プロフィール</div>
            </div>
          </div>
          <Profile data={profileData} loading={profileLoading} isOwn={false} {...cardProps}
            onTapPost={(post) => { setPrevScreen(screen); setSelectedPost(post); setSelectedDriver(profileData?.driver || null); setScreen('post-detail'); }}
            onTapGallery={(g) => { setPrevScreen(screen); setSelectedGallery(g); setSelectedGalleryDriver(profileData?.driver || null); setScreen('gallery-detail'); }} />
        </div>
      )}

      {screen === 'mypage' && user && (
        <div className="screen">
          <div className="hdr">
            <div className="back-row" style={{ justifyContent: 'space-between' }}>
              <div className="hdr-title" style={{ fontSize: 19 }}>マイページ</div>
              <button className="icon-btn" onClick={() => setScreen('account-info')}><IcGear /></button>
            </div>
          </div>
          <Profile data={profileData} loading={profileLoading} isOwn={true} onEdit={() => setScreen('profile-edit')} {...cardProps}
            onTapPost={(post) => { setPrevScreen(screen); setSelectedPost(post); setSelectedDriver(profileData?.driver || null); setScreen('post-detail'); }}
            onTapGallery={(g) => { setPrevScreen(screen); setSelectedGallery(g); setSelectedGalleryDriver(profileData?.driver || null); setScreen('gallery-detail'); }} />
        </div>
      )}

      {screen === 'account-info' && user && (
        <div className="screen">
          <div className="hdr">
            <div className="back-row">
              <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setScreen('mypage')}><IcBack /></button>
              <div className="hdr-title">アカウント情報</div>
            </div>
          </div>
          <AccountInfo user={user} driver={driver} onViewProfile={() => setScreen('mypage')} onProfileEdit={() => setScreen('profile-edit')} onOpenFollowList={() => setScreen('follow-list')} onLogout={handleLogout} showToast={showToast} />
        </div>
      )}

      {screen === 'profile-edit' && user && (
        <div className="screen">
          <ProfileEdit user={user} driver={driver} onClose={() => setScreen('mypage')} onSaved={handleProfileSaved} showToast={showToast} />
        </div>
      )}

      {screen === 'follow-list' && user && (
        <div className="screen">
          <div className="hdr">
            <div className="back-row" style={{ justifyContent: 'space-between' }}>
              <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setScreen('account-info')}><IcBack /></button>
              <div className="hdr-title">フォローリスト</div>
              <div className="fl-count">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {following.length}人
              </div>
            </div>
          </div>
          <FollowList
            userId={user.$id}
            following={following}
            onToggleFollow={toggleFollow}
            onOpenProfile={openProfile}
            showToast={showToast}
          />
        </div>
      )}

      {screen === 'post' && (
        <div className="screen">
          <div className="hdr">
            <div className="back-row">
              <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setScreen('home')}><IcClose /></button>
              <div className="hdr-title">飯を投稿</div>
            </div>
          </div>
          <Compose user={user} showToast={showToast} onPosted={() => loadTimeline(user?.$id)} goHome={() => setScreen('home')} />
        </div>
      )}

      {screen === 'gallery-post' && (
        <div className="screen">
          <div className="hdr">
            <div className="back-row">
              <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setScreen('home')}><IcClose /></button>
              <div className="hdr-title">ギャラリーに投稿</div>
            </div>
          </div>
          <GalleryCompose user={user} showToast={showToast} onPosted={() => loadTimeline(user?.$id)} goHome={() => setScreen('home')} />
        </div>
      )}

      {screen === 'search' && (
        <SearchScreen
          onOpenProfile={openProfile}
          onTap={openPostDetail}
          currentUserId={user?.$id}
          following={following}
          onToggleFollow={toggleFollow}
          likeCounts={likeCounts}
          myLikes={myLikes}
          onToggleLike={toggleLike}
          showToast={showToast}
        />
      )}

      {recoveryParams && (
        <div className="screen" style={{ zIndex: 200 }}>
          <PasswordResetScreen
            userId={recoveryParams.userId}
            secret={recoveryParams.secret}
            showToast={showToast}
            onDone={() => { setRecoveryParams(null); setScreen('account'); }}
          />
        </div>
      )}

      {screen === 'account' && !recoveryParams && (
        <div className="screen">
          <div className="hdr">
            <div className="back-row">
              <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setScreen('home')}><IcBack /></button>
              <div className="hdr-title">ログイン</div>
            </div>
          </div>
          <AuthScreen showToast={showToast} onAuthed={async () => {
            const u = await refreshAuth();
            await loadTimeline(u?.$id);
            setScreen('home');
          }} />
        </div>
      )}

      {screen === 'notifications' && (
        <div className="screen">
          <div className="hdr">
            <div className="back-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="hdr-title">通知</div>
              <button className="notif-markall-btn" onClick={handleMarkAllRead}>すべて既読にする</button>
            </div>
          </div>
          {user
            ? <NotificationScreen data={notifData} loading={notifLoading} onOpenProfile={openProfile}
                onOpenPost={(post) => {
                  const d = data?.driversMap?.[post.driver_id]
                    || followData?.driversMap?.[post.driver_id]
                    || notifData?.driversMap?.[post.driver_id]
                    || null;
                  setPrevScreen('notifications');
                  setSelectedPost(post);
                  setSelectedDriver(d);
                  setScreen('post-detail');
                }}
                onMarkRead={(notifId) => {
                  localReadIds.current.add(notifId);
                  markNotificationRead(notifId).catch(() => {});
                  setNotifData((d) => d ? {
                    ...d,
                    items: d.items.map((n) => n.$id === notifId ? { ...n, read: true } : n),
                  } : d);
                  setUnreadCount((c) => Math.max(0, c - 1));
                }} />
            : <div className="center-msg"><div className="big-emoji">🔑</div><div className="ttl">ログインすると通知が届きます</div></div>}
        </div>
      )}

      {screen === 'favorites' && (
        <div className="screen">
          <div className="hdr">
            <div className="back-row">
              <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setScreen('home')}><IcBack /></button>
              <div className="hdr-title">お気に入り</div>
            </div>
          </div>
          <Favorites
            data={favData}
            galleryData={favGalleryData}
            loading={favLoading}
            onToggleFavorite={(postId) => toggleLike('meal_post', postId)}
            onToggleGalleryFavorite={(galId) => toggleLike('gallery_post', galId)}
            onOpenProfile={openProfile}
            likeCounts={likeCounts}
            onTapGallery={(g, d) => { setPrevScreen('favorites'); setSelectedGallery(g); setSelectedGalleryDriver(d || null); setScreen('gallery-detail'); }}
          />
        </div>
      )}

      <div className="nav">
        <button className={'nav-btn' + (screen === 'home' ? ' active' : '')} onClick={() => setScreen('home')}><IcHome />ホーム</button>
        <button className={'nav-btn' + (screen === 'search' ? ' active' : '')} onClick={() => setScreen('search')}><IcSearch />検索</button>
        <button className="nav-btn nav-post" onClick={() => { if (!user) { setScreen('account'); return; } setShowPostOptions(true); }}>
          <span className="circle"><IcPlus /></span>
        </button>
        <button className={'nav-btn' + (screen === 'favorites' ? ' active' : '')} onClick={openFavorites}>
          <svg viewBox="0 0 24 24" fill={screen === 'favorites' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}>
            <path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z" />
          </svg>
          お気に入り
        </button>
        <button className={'nav-btn' + (isMyPageArea ? ' active' : '')} onClick={openMyPage}><IcUser />マイページ</button>
      </div>

      {showPostOptions && (
        <>
          <div className="overlay" onClick={() => setShowPostOptions(false)} />
          <div className="post-options">
            <p className="post-options-title">何を投稿しますか？</p>
            <button className="post-opt-btn meal" onClick={() => { setShowPostOptions(false); setScreen('post'); }}>
              <span className="opt-circle orange">🍴</span>
              <div><div className="opt-label">ドライバー飯を投稿</div><div className="opt-sub">食べた飯の写真・店情報をシェア</div></div>
            </button>
            <button className="post-opt-btn" onClick={() => { setShowPostOptions(false); setScreen('gallery-post'); }}>
              <span className="opt-circle gray">🚛</span>
              <div><div className="opt-label">ギャラリーに投稿</div><div className="opt-sub">風景・トラック・仕事の一コマをシェア</div></div>
            </button>
            <button className="post-opt-cancel" onClick={() => setShowPostOptions(false)}>キャンセル</button>
          </div>
        </>
      )}

      <div className={'toast' + (toastMsg ? ' show' : '')}>{toastMsg}</div>
    </div>
  );
}
