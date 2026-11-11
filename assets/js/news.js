(() => {
  function initArchive() {
    const grid = document.querySelector('[data-news-grid]');
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll('[data-news-card]'));
    const filters = Array.from(document.querySelectorAll('[data-news-filter]'));
    const search = document.querySelector('[data-news-search]');
    const count = document.querySelector('[data-news-count]');
    const empty = document.querySelector('[data-news-empty]');
    let active = 'all';
    let query = '';

    const apply = () => {
      let visible = 0;
      cards.forEach((card) => {
        const okCategory = active === 'all' || card.dataset.category === active;
        const okQuery = !query || (card.dataset.search || '').toLowerCase().includes(query);
        const show = okCategory && okQuery;
        card.hidden = !show;
        if (show) visible += 1;
      });
      if (count) count.textContent = String(visible);
      if (empty) empty.hidden = visible !== 0;
      filters.forEach((button) => {
        const on = button.dataset.newsFilter === active;
        button.classList.toggle('is-active', on);
        button.setAttribute('aria-pressed', String(on));
      });
    };

    filters.forEach((button) => {
      button.addEventListener('click', () => {
        active = button.dataset.newsFilter || 'all';
        apply();
      });
    });
    if (search) {
      search.addEventListener('input', () => {
        query = search.value.trim().toLowerCase();
        apply();
      });
    }
    const reset = document.querySelector('[data-news-reset]');
    if (reset) {
      reset.addEventListener('click', () => {
        active = 'all';
        query = '';
        if (search) search.value = '';
        apply();
      });
    }
    apply();
  }

  function initProgress() {
    const bar = document.querySelector('[data-reading-bar]');
    const article = document.querySelector('.article-section');
    if (!bar || !article) return;
    const update = () => {
      const start = article.offsetTop - 120;
      const end = article.offsetTop + article.offsetHeight - window.innerHeight;
      const ratio = (window.scrollY - start) / Math.max(end - start, 1);
      bar.style.width = `${Math.min(Math.max(ratio, 0), 1) * 100}%`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  document.addEventListener('DOMContentLoaded', () => {
    try {
      initArchive();
    } catch (error) {
      console.error(error);
    }
    try {
      initProgress();
    } catch (error) {
      console.error(error);
    }
  });
})();
