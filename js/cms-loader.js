/**
 * cms-loader.js — Bar Nocturne
 * Decap CMS (_data/) のJSONを fetch して DOM に描画するユーティリティ
 */

const CMS = {
  /** JSONファイルを fetch して返す（失敗時は null） */
  async load(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`fetch failed: ${path}`);
      return await res.json();
    } catch (e) {
      console.warn('[CMS]', e.message);
      return null;
    }
  },

  /** ディレクトリ内の JSON 一覧を取得（manifest.json が必要）
   *  Netlify では公開パスを直接指定するため、manifest配列で管理 */
  async loadAll(files) {
    const results = await Promise.all(files.map(f => this.load(f)));
    return results.filter(Boolean);
  },

  /** 価格フォーマット */
  formatPrice(price) {
    return `¥${Number(price).toLocaleString()}`;
  },

  /** カテゴリラベル */
  categoryLabel(cat) {
    const map = {
      cocktail: 'Original Cocktail',
      whiskey: 'Whiskey',
      wine: 'Wine',
      soft: 'Soft Drink',
      starter: 'Starter',
      main: 'Main',
      dessert: 'Dessert',
      cheese: 'Cheese',
    };
    return map[cat] || cat;
  },

  /** ニュースカテゴリラベル */
  newsCategoryLabel(cat) {
    const map = {
      info: 'お知らせ',
      event: 'イベント',
      menu: 'メニュー',
      close: '臨時休業',
    };
    return map[cat] || cat;
  },

  /** 日付フォーマット (YYYY-MM-DD → YYYY.MM.DD) */
  formatDate(str) {
    if (!str) return '';
    return String(str).replace(/-/g, '.');
  },
};

/* ===================================
   HERO: settings.json からキャッチ・サブを読む
   =================================== */
async function loadHeroContent() {
  const settings = await CMS.load('/_data/settings.json');
  if (!settings) return;

  const taglineEl = document.querySelector('[data-cms="hero-tagline"]');
  const taglineEnEl = document.querySelector('[data-cms="hero-tagline-en"]');
  const titleEnEl = document.querySelector('[data-cms="hero-title-en"]');
  const nameEnEl = document.querySelector('[data-cms="hero-name-en"]');

  if (taglineEl) taglineEl.textContent = settings.tagline || '';
  if (taglineEnEl) taglineEnEl.textContent = settings.tagline_en || '';
  if (titleEnEl) titleEnEl.textContent = settings.name || '';
  if (nameEnEl) nameEnEl.textContent = settings.name_en || '';
}

/* ===================================
   MENU PICKUP: featured=true のカクテル・フードをトップに表示
   =================================== */
const COCKTAIL_FILES = [
  '/_data/cocktails/01-midnight-negroni.json',
  '/_data/cocktails/02-nocturne-sour.json',
  '/_data/cocktails/03-amber-old-fashioned.json',
  '/_data/cocktails/04-whiskey-highball.json',
];
const FOOD_FILES = [
  '/_data/food/01-foie-gras-sauteed.json',
  '/_data/food/02-wagyu-steak.json',
  '/_data/food/03-cheese-selection.json',
];

function createMenuCard(item) {
  const div = document.createElement('div');
  div.className = 'menu-card fade-in';
  div.innerHTML = `
    <div class="menu-card__image">
      <img src="${item.image || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80'}"
           alt="${item.name_en || item.name}" loading="lazy">
    </div>
    <div class="menu-card__body">
      <p class="menu-card__category">${CMS.categoryLabel(item.category)}</p>
      <h3 class="menu-card__name">${item.name_en || item.name}</h3>
      <p class="menu-card__name-jp">${item.name}</p>
      <p class="menu-card__desc">${item.description || ''}</p>
      <p class="menu-card__price">${CMS.formatPrice(item.price)}</p>
    </div>
  `;
  return div;
}

async function loadMenuPickup() {
  const container = document.getElementById('menu-pickup-grid');
  if (!container) return;

  const [cocktails, foods] = await Promise.all([
    CMS.loadAll(COCKTAIL_FILES),
    CMS.loadAll(FOOD_FILES),
  ]);

  const featured = [
    ...cocktails.filter(c => c.featured).sort((a,b) => a.order - b.order),
    ...foods.filter(f => f.featured).sort((a,b) => a.order - b.order),
  ].slice(0, 5);

  if (featured.length === 0) return;
  container.innerHTML = '';
  featured.forEach(item => {
    container.appendChild(createMenuCard(item));
  });

  // フェードイン再適用
  initFadeIn(container.querySelectorAll('.fade-in'));
}

/* ===================================
   GALLERY
   =================================== */
async function loadGallery() {
  const container = document.getElementById('gallery-grid');
  if (!container) return;

  const data = await CMS.load('/_data/gallery.json');
  if (!data || !data.images) return;

  container.innerHTML = '';
  data.images.forEach(img => {
    const div = document.createElement('div');
    div.className = 'gallery__item';
    div.innerHTML = `<img src="${img.src}" alt="${img.alt || ''}" loading="lazy">`;
    container.appendChild(div);
  });
}

/* ===================================
   NEWS
   =================================== */
const NEWS_FILES = [
  '/_data/news/2026-02-20-menu.json',
  '/_data/news/2026-02-15-event.json',
  '/_data/news/2026-02-01-open.json',
];

async function loadNews() {
  const container = document.getElementById('news-list');
  if (!container) return;

  const items = await CMS.loadAll(NEWS_FILES);
  if (items.length === 0) return;

  // 日付降順
  items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  container.innerHTML = '';
  items.slice(0, 3).forEach(item => {
    const li = document.createElement('div');
    li.className = 'news__item fade-in';
    li.innerHTML = `
      <span class="news__date">${CMS.formatDate(item.date)}</span>
      <span class="news__cat">${CMS.newsCategoryLabel(item.category)}</span>
      <span class="news__title">${item.title}</span>
    `;
    container.appendChild(li);
  });

  initFadeIn(container.querySelectorAll('.fade-in'));
}

/* ===================================
   MENU PAGE: 全メニュー読み込み
   =================================== */
async function loadFullMenu() {
  const drinkGrid = document.getElementById('drink-grid');
  const foodGrid = document.getElementById('food-grid');
  if (!drinkGrid && !foodGrid) return;

  const [cocktails, foods] = await Promise.all([
    CMS.loadAll(COCKTAIL_FILES),
    CMS.loadAll(FOOD_FILES),
  ]);

  if (drinkGrid) {
    const sorted = cocktails.sort((a,b) => a.order - b.order);
    drinkGrid.innerHTML = '';
    sorted.forEach(item => drinkGrid.appendChild(createMenuCard(item)));
    initFadeIn(drinkGrid.querySelectorAll('.fade-in'));
  }

  if (foodGrid) {
    const sorted = foods.sort((a,b) => a.order - b.order);
    foodGrid.innerHTML = '';
    sorted.forEach(item => foodGrid.appendChild(createMenuCard(item)));
    initFadeIn(foodGrid.querySelectorAll('.fade-in'));
  }
}

/* ===================================
   IntersectionObserver helper
   =================================== */
function initFadeIn(elements) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  elements.forEach(el => obs.observe(el));
}

/* ===================================
   エクスポート
   =================================== */
window.CMSLoader = {
  loadHeroContent,
  loadMenuPickup,
  loadGallery,
  loadNews,
  loadFullMenu,
  initFadeIn,
};
