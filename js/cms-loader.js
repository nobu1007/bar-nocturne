/**
 * cms-loader.js — Bar Nocturne v2
 * Decap CMS (_data/) の JSON を fetch して DOM に描画するユーティリティ。
 * settings.json の全フィールドを data-cms 属性経由で各ページに展開する。
 */

const CMS = {
  /** JSON ファイルを fetch して返す（失敗時は null） */
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

  /** ファイルパス配列を並列 fetch して返す */
  async loadAll(files) {
    const results = await Promise.all(files.map(f => this.load(f)));
    return results.filter(Boolean);
  },

  /** data-cms 属性を持つ全要素のテキストをセット */
  setText(attr, value) {
    document.querySelectorAll(`[data-cms="${attr}"]`).forEach(el => {
      el.textContent = value || '';
    });
  },

  /** data-cms-src 属性を持つ img / iframe の src をセット */
  setSrc(attr, value) {
    document.querySelectorAll(`[data-cms-src="${attr}"]`).forEach(el => {
      if (value) el.src = value;
    });
  },

  /** data-cms-href 属性を持つ a 要素の href をセット */
  setHref(attr, value, prefix = '') {
    document.querySelectorAll(`[data-cms-href="${attr}"]`).forEach(el => {
      if (value) el.href = prefix + value;
    });
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
   動的ファイル検出（index.json 経由）
   Netlify ビルド時に generate-index.js が生成した
   index.json を読んでファイル名一覧を取得する。
   =================================== */
async function loadCollectionFiles(dir) {
  const index = await CMS.load(`/_data/${dir}/index.json`);
  if (!index || !Array.isArray(index.files)) return [];
  return index.files.map(f => `/_data/${dir}/${f}`);
}

/* ===================================
   SETTINGS: 全ページ共通のテキスト・画像展開
   settings.json の全フィールドを data-cms 属性要素に適用する。
   =================================== */
async function loadSettings() {
  const s = await CMS.load('/_data/settings.json');
  if (!s) return;

  // --- 基本テキスト ---
  CMS.setText('settings.tagline',     s.tagline);
  CMS.setText('settings.tagline_en',  s.tagline_en);
  CMS.setText('settings.name',        s.name);
  CMS.setText('settings.name_en',     s.name_en);
  CMS.setText('settings.address',     s.address);
  CMS.setText('settings.tel',         s.tel);
  CMS.setText('settings.closed',      s.closed);
  CMS.setText('settings.footer_desc', s.footer_desc);
  CMS.setText('settings.access_note', s.access_note);

  // --- 電話番号リンク（tel:プレフィックス付き）---
  CMS.setHref('settings.tel', s.tel, 'tel:');

  // --- SNS リンク ---
  CMS.setHref('settings.instagram', s.instagram);
  CMS.setHref('settings.twitter',   s.twitter);

  // --- 画像 src ---
  CMS.setSrc('settings.hero_image',      s.hero_image);
  CMS.setSrc('settings.concept_image',   s.concept_image);
  CMS.setSrc('settings.party_image',     s.party_image);
  CMS.setSrc('settings.bartender_image', s.bartender_image);

  // --- Google Maps iframe src ---
  CMS.setSrc('settings.maps_embed_url', s.maps_embed_url);

  // --- バーテンダー情報 ---
  CMS.setText('settings.bartender_role',     s.bartender_role);
  CMS.setText('settings.bartender_name',     s.bartender_name);
  CMS.setText('settings.bartender_name_en',  s.bartender_name_en);
  CMS.setText('settings.bartender_bio_short', s.bartender_bio_short);

  // バーテンダー経歴（複数段落）
  const bioContainer = document.querySelector('[data-cms-list="settings.bartender_bio"]');
  if (bioContainer && Array.isArray(s.bartender_bio)) {
    bioContainer.innerHTML = s.bartender_bio
      .map(para => `<p>${para}</p>`).join('');
  }

  // --- コンセプト本文（複数段落）---
  const conceptContainer = document.querySelector('[data-cms-list="settings.concept_body"]');
  if (conceptContainer && Array.isArray(s.concept_body)) {
    conceptContainer.innerHTML = s.concept_body
      .map(para => `<p>${para}</p>`).join('');
  }

  // --- Philosophy（JS で生成）---
  const philoContainer = document.querySelector('[data-cms-list="settings.philosophy"]');
  if (philoContainer && Array.isArray(s.philosophy)) {
    philoContainer.innerHTML = s.philosophy.map(item => `
      <div class="philosophy__item fade-in">
        <p class="philosophy__num">${item.num}</p>
        <div>
          <h3 class="philosophy__title">${item.title}</h3>
          <p class="philosophy__text">${item.text}</p>
        </div>
      </div>
    `).join('');
    initFadeIn(philoContainer.querySelectorAll('.fade-in'));
  }

  // --- 営業時間（テーブル行）---
  const hoursContainer = document.querySelector('[data-cms-list="settings.hours"]');
  if (hoursContainer && Array.isArray(s.hours)) {
    hoursContainer.innerHTML = s.hours.map(h => `
      <tr>
        <td>${h.day}</td>
        <td>${h.time}</td>
      </tr>
    `).join('');
  }

  // --- 貸切テキスト ---
  CMS.setText('settings.party_text', s.party_text);

  // --- 貸切 特徴リスト ---
  const featuresContainer = document.querySelector('[data-cms-list="settings.party_features"]');
  if (featuresContainer && Array.isArray(s.party_features)) {
    featuresContainer.innerHTML = s.party_features
      .map(f => `<li class="party__feature">${f}</li>`).join('');
  }

  // --- アクセス方法 ---
  const accessContainer = document.querySelector('[data-cms-list="settings.access_directions"]');
  if (accessContainer && Array.isArray(s.access_directions)) {
    accessContainer.innerHTML = s.access_directions.map(d => `
      <div class="access__direction-item">
        <p class="access__direction-station">${d.station}</p>
        <p class="access__direction-desc">${d.description}</p>
      </div>
    `).join('');
  }

  // --- meta title / description（ページ別）---
  const page = document.body.dataset.page;
  if (page && s.meta && s.meta[page]) {
    if (s.meta[page].title)       document.title = s.meta[page].title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && s.meta[page].description) {
      metaDesc.content = s.meta[page].description;
    }
  }
}

/* ===================================
   メニューカード生成
   =================================== */
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

/* ===================================
   MENU PICKUP: featured=true のカクテル・フードをトップに表示
   =================================== */
async function loadMenuPickup() {
  const container = document.getElementById('menu-pickup-grid');
  if (!container) return;

  const [cocktailFiles, foodFiles] = await Promise.all([
    loadCollectionFiles('cocktails'),
    loadCollectionFiles('food'),
  ]);

  const [cocktails, foods] = await Promise.all([
    CMS.loadAll(cocktailFiles),
    CMS.loadAll(foodFiles),
  ]);

  const featured = [
    ...cocktails.filter(c => c.featured).sort((a, b) => a.order - b.order),
    ...foods.filter(f => f.featured).sort((a, b) => a.order - b.order),
  ].slice(0, 5);

  if (featured.length === 0) return;
  container.innerHTML = '';
  featured.forEach(item => container.appendChild(createMenuCard(item)));
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
async function loadNews() {
  const container = document.getElementById('news-list');
  if (!container) return;

  const newsFiles = await loadCollectionFiles('news');
  const items = await CMS.loadAll(newsFiles);
  if (items.length === 0) return;

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
  const foodGrid  = document.getElementById('food-grid');
  if (!drinkGrid && !foodGrid) return;

  const [cocktailFiles, foodFiles] = await Promise.all([
    loadCollectionFiles('cocktails'),
    loadCollectionFiles('food'),
  ]);

  const [cocktails, foods] = await Promise.all([
    CMS.loadAll(cocktailFiles),
    CMS.loadAll(foodFiles),
  ]);

  if (drinkGrid) {
    const sorted = cocktails.sort((a, b) => a.order - b.order);
    drinkGrid.innerHTML = '';
    sorted.forEach(item => drinkGrid.appendChild(createMenuCard(item)));
    initFadeIn(drinkGrid.querySelectorAll('.fade-in'));
  }

  if (foodGrid) {
    const sorted = foods.sort((a, b) => a.order - b.order);
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
  loadSettings,
  loadMenuPickup,
  loadGallery,
  loadNews,
  loadFullMenu,
  initFadeIn,
};
