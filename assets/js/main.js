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


  function initHero() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const fine = window.matchMedia('(pointer: fine)');
    let pointerX = 0;
    let pointerY = 0;
    let scrollProgress = 0;
    let varRaf = 0;

    const applyVars = () => {
      varRaf = 0;
      hero.style.setProperty('--gx', `${(pointerX * 8).toFixed(2)}px`);
      hero.style.setProperty('--gy', `${(pointerY * 6).toFixed(2)}px`);
      hero.style.setProperty('--gs', (1 + scrollProgress * 0.035).toFixed(4));
      hero.style.setProperty('--copyY', `${(-scrollProgress * 8).toFixed(2)}px`);
    };
    const scheduleVars = () => {
      if (!varRaf) varRaf = requestAnimationFrame(applyVars);
    };
    const onPointer = (event) => {
      if (!fine.matches) return;
      const rect = hero.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      scheduleVars();
    };
    const onPointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
      scheduleVars();
    };
    const onScroll = () => {
      const rect = hero.getBoundingClientRect();
      scrollProgress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      scheduleVars();
    };
    hero.addEventListener('pointermove', onPointer, { passive: true });
    hero.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const canvas = hero.querySelector('[data-hero-canvas]');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let stars = [];
    let raf = 0;
    let active = false;
    let last = 0;
    let shooting = null;
    let nextShoot = 0;

    const makeStars = () => {
      const rect = hero.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 640 ? 55 : width < 1000 ? 90 : 130;
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() < 0.87 ? 1 : 1.7,
        alpha: 0.12 + Math.random() * 0.42,
        speed: 0.25 + Math.random() * 0.75,
        phase: Math.random() * Math.PI * 2,
        tint: Math.random() < 0.07 ? 'gold' : Math.random() < 0.14 ? 'cyan' : 'white',
      }));
    };

    const draw = (time) => {
      if (!active) {
        raf = 0;
        return;
      }
      const dt = Math.min(32, time - (last || time));
      last = time;
      ctx.clearRect(0, 0, width, height);
      const ox = pointerX * 5;
      const oy = pointerY * 3;
      for (const star of stars) {
        star.y += star.speed * dt * 0.018;
        if (star.y > height + 2) {
          star.y = -2;
          star.x = Math.random() * width;
        }
        const twinkle = 0.7 + 0.3 * Math.sin(time * 0.001 + star.phase);
        const alpha = star.alpha * twinkle;
        const color = star.tint === 'gold'
          ? `rgba(232,180,90,${alpha})`
          : star.tint === 'cyan'
            ? `rgba(143,208,255,${alpha})`
            : `rgba(223,233,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x + ox, star.y + oy, star.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      if (!shooting && time > nextShoot) {
        const left = Math.random() > 0.5;
        shooting = {
          x: left ? -40 : width + 40,
          y: 30 + Math.random() * height * 0.45,
          vx: left ? 2.8 : -2.8,
          vy: 1.15,
          life: 1,
        };
        nextShoot = time + 9000 + Math.random() * 8000;
      }
      if (shooting) {
        shooting.x += shooting.vx * dt * 0.07;
        shooting.y += shooting.vy * dt * 0.07;
        shooting.life -= dt * 0.00045;
        const tailX = shooting.x - shooting.vx * 20;
        const tailY = shooting.y - shooting.vy * 20;
        const trail = ctx.createLinearGradient(shooting.x, shooting.y, tailX, tailY);
        trail.addColorStop(0, 'rgba(232,238,247,0)');
        trail.addColorStop(0.45, `rgba(223,233,255,${Math.max(0, shooting.life) * 0.8})`);
        trail.addColorStop(1, 'rgba(143,208,255,0)');
        ctx.strokeStyle = trail;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(shooting.x, shooting.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        if (shooting.life <= 0 || shooting.x < -120 || shooting.x > width + 120) shooting = null;
      }
      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (!active || raf) return;
      last = 0;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      active = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    makeStars();
    nextShoot = performance.now() + 4500;
    if ('ResizeObserver' in window) {
      new ResizeObserver(makeStars).observe(hero);
    } else {
      window.addEventListener('resize', makeStars);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        active = entries[0].isIntersecting && !document.hidden;
        if (active) start();
        else stop();
      }, { threshold: 0 }).observe(hero);
    } else {
      active = !document.hidden;
      start();
    }
    document.addEventListener('visibilitychange', () => {
      active = !document.hidden;
      if (active) start();
      else stop();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    [initHeader, initNav, initStars, initReveal, initLightbox, initHero].forEach((init) => {
      try {
        init();
      } catch (error) {
        console.error(error);
        document.documentElement.classList.remove('js');
      }
    });
  });
})();
