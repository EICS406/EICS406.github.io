(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initHeader() {
    const header = document.querySelector('[data-header]');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initNav() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-nav]');
    if (!toggle || !nav) return;
    const desktop = window.matchMedia('(min-width: 861px)');
    const setOpen = (open, restoreFocus = false) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
      document.body.classList.toggle('nav-open', open);
      if (!open && restoreFocus && nav.contains(document.activeElement) && toggle.getClientRects().length) {
        toggle.focus();
      }
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false, true);
    });
    const onDesktop = (event) => {
      if (event.matches) setOpen(false);
    };
    if (desktop.addEventListener) desktop.addEventListener('change', onDesktop);
    else desktop.addListener(onDesktop);
  }

  function initStars() {
    if (reduce) return;
    document.querySelectorAll('[data-stars]').forEach((host) => {
      if (host.childElementCount) return;
      const count = Number(host.dataset.stars) || 90;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < count; i += 1) {
        const star = document.createElement('i');
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = star.style.height = `${Math.random() < 0.85 ? 1 : 2}px`;
        star.style.opacity = String(0.2 + Math.random() * 0.6);
        star.style.animationDelay = `${Math.random() * 6}s`;
        frag.appendChild(star);
      }
      host.appendChild(frag);
    });
  }

  function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    items.forEach((el) => observer.observe(el));
  }

  function initLightbox() {
    const triggers = Array.from(document.querySelectorAll('[data-lightbox]'));
    if (!triggers.length) return;
    const dialog = document.createElement('div');
    dialog.className = 'lightbox';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', '证书预览');
    dialog.innerHTML = `
      <button class="lightbox__close" type="button" aria-label="关闭">×</button>
      <button class="lightbox__prev" type="button" aria-label="上一张">‹</button>
      <figure class="lightbox__figure">
        <img class="lightbox__img" alt="">
        <figcaption class="lightbox__cap"></figcaption>
      </figure>
      <button class="lightbox__next" type="button" aria-label="下一张">›</button>`;
    document.body.appendChild(dialog);
    const image = dialog.querySelector('.lightbox__img');
    const caption = dialog.querySelector('.lightbox__cap');
    let index = 0;
    let lastFocus = null;

    const setInert = (on) => {
      Array.from(document.body.children).forEach((el) => {
        if (el === dialog || el.tagName === 'SCRIPT') return;
        if (on) el.setAttribute('inert', '');
        else el.removeAttribute('inert');
      });
    };

    const show = (nextIndex) => {
      index = (nextIndex + triggers.length) % triggers.length;
      const trigger = triggers[index];
      const thumb = trigger.querySelector('img');
      image.src = trigger.dataset.full || (thumb ? thumb.src : '');
      image.alt = trigger.dataset.caption || trigger.getAttribute('aria-label') || '获奖证书';
      caption.textContent = trigger.dataset.caption || '';
      document.body.classList.add('lightbox-open');
      setInert(true);
      dialog.classList.add('is-open');
      dialog.querySelector('.lightbox__close').focus();
    };

    const close = () => {
      dialog.classList.remove('is-open');
      document.body.classList.remove('lightbox-open');
      setInert(false);
      image.removeAttribute('src');
      if (lastFocus) lastFocus.focus();
    };

    triggers.forEach((trigger, triggerIndex) => {
      trigger.addEventListener('click', () => {
        lastFocus = trigger;
        show(triggerIndex);
      });
    });
    dialog.querySelector('.lightbox__close').addEventListener('click', close);
    dialog.querySelector('.lightbox__prev').addEventListener('click', () => show(index - 1));
    dialog.querySelector('.lightbox__next').addEventListener('click', () => show(index + 1));
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const buttons = Array.from(dialog.querySelectorAll('button:not([disabled])'));
      if (!buttons.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (!dialog.classList.contains('is-open')) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') show(index - 1);
      if (event.key === 'ArrowRight') show(index + 1);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    [initHeader, initNav, initStars, initReveal, initLightbox].forEach((init) => {
      try {
        init();
      } catch (error) {
        console.error(error);
        document.documentElement.classList.remove('js');
      }
    });
  });
})();
