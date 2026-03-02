/**
 * main.js — Bar Nocturne
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ===================================
     1. ヘッダー スクロール変化
     =================================== */
  const header = document.querySelector('header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // 初期化
  }

  /* ===================================
     2. ハンバーガーメニュー
     =================================== */
  const burger = document.querySelector('.burger');
  const navLinks = document.querySelector('.nav-links');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });
    // ナビリンクをクリックで閉じる
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ===================================
     3. フェードインアニメーション（静的要素）
     =================================== */
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    fadeEls.forEach(el => observer.observe(el));
  }

  /* ===================================
     4. タブ切り替え（メニューページ）
     =================================== */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(target)?.classList.add('active');
    });
  });

  /* ===================================
     5. 年齢確認モーダル
     =================================== */
  const ageGate = document.getElementById('age-gate');
  if (ageGate) {
    if (!sessionStorage.getItem('age-confirmed')) {
      ageGate.classList.remove('hidden');
    } else {
      ageGate.classList.add('hidden');
    }

    document.getElementById('age-yes')?.addEventListener('click', () => {
      sessionStorage.setItem('age-confirmed', '1');
      ageGate.style.opacity = '0';
      ageGate.style.transition = 'opacity 0.5s ease';
      setTimeout(() => ageGate.classList.add('hidden'), 500);
    });

    document.getElementById('age-no')?.addEventListener('click', () => {
      window.location.href = 'https://www.google.com/search?q=%E3%83%8E%E3%83%B3%E3%82%A2%E3%83%AB%E3%82%B3%E3%83%BC%E3%83%AB%E3%83%89%E3%83%AA%E3%83%B3%E3%82%AF';
    });
  }

  /* ===================================
     6. CMS データ読み込み
     =================================== */
  if (window.CMSLoader) {
    // 全ページ共通: settings.json を展開
    CMSLoader.loadSettings();

    // トップページ
    if (document.getElementById('hero')) {
      CMSLoader.loadMenuPickup();
      CMSLoader.loadGallery();
      CMSLoader.loadNews();
    }
    // メニューページ
    if (document.getElementById('drink-grid') || document.getElementById('food-grid')) {
      CMSLoader.loadFullMenu();
    }
    // Aboutページ（ギャラリーをgallery.jsonから読む）
    if (document.getElementById('gallery-about')) {
      CMSLoader.loadGallery();
    }
  }

  /* ===================================
     7. スムーズスクロール（ページ内リンク）
     =================================== */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = header ? header.offsetHeight + 20 : 80;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      }
    });
  });

});
