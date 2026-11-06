(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  const motions = () => root.classList.contains('m-ready') && !reduced.matches;
  const topHeight = () => parseFloat(getComputedStyle(root).getPropertyValue('--top-h')) || 112;

  setupMenu();
  initChrome();
  initMap();

  if (!root.classList.contains('m-on') || reduced.matches) {
    root.classList.remove('m-on');
    return;
  }

  const text = (node, value) => {
    node.setAttribute('aria-label', value);
    node.textContent = '';
    value.split(/\s+/).forEach((word, i, all) => {
      const mask = document.createElement('span');
      mask.className = 'w'; mask.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.className = 'wi'; inner.style.setProperty('--word-i', i);
      inner.textContent = word; mask.append(inner); node.append(mask);
      if (i < all.length - 1) node.append(document.createTextNode(' '));
    });
  };
  document.querySelectorAll('[data-words]').forEach((heading) => text(heading, heading.textContent.trim()));
  document.querySelectorAll('[data-group]').forEach((group) => [...group.children].forEach((item, i) => item.style.setProperty('--i', i)));
  document.querySelectorAll('[data-words]:not([data-rv])').forEach((heading) => heading.setAttribute('data-rv', ''));

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
      if (entry.target.matches('[data-curtain]')) {
        setTimeout(() => {
          entry.target.style.clipPath = 'none';
          const image = entry.target.querySelector('img');
          if (image) image.style.scale = 'none';
        }, 1460);
      }
    }
  }, { threshold: .03, rootMargin: '0px 0px -2% 0px' });
  const sweep = () => {
    if (!motions()) return;
    document.querySelectorAll('[data-rv], [data-group]').forEach((item) => {
      if (item.classList.contains('in')) observer.unobserve(item);
      else {
        if (item.getBoundingClientRect().top < innerHeight + 3) item.classList.add('in');
        else observer.observe(item);
      }
    });
  };
  root.classList.add('m-ready');
  sweep();
  let scrollFrame = 0;
  const update = () => {
    scrollFrame = 0;
    sweep();
    updateProgress();
    updateFinalPanel();
    updateLight();
    updateDrift();

  };
  const schedule = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(update); };
  ['scroll', 'load', 'hashchange', 'beforeprint'].forEach((name) => addEventListener(name, schedule, { passive: true }));
  addEventListener('resize', () => { schedule(); });
  reduced.addEventListener('change', () => {
    if (reduced.matches) { root.classList.remove('m-on', 'm-ready'); }
  });

  initChars();
  initPointer();
  update();

  function initChrome() {
    const chrome = document.querySelector('.site-chrome');
    if (!chrome) return;
    const resize = () => {
      const size = Math.ceil(chrome.getBoundingClientRect().height);
      root.style.setProperty('--top-h', `${size}px`);
      const spacer = document.querySelector('.chrome-spacer');
      if (spacer) spacer.style.height = `${size}px`;
    };
    resize();
    new ResizeObserver(resize).observe(chrome);
  }

  function setupMenu() {
    const details = document.querySelector('.menu-disclosure');
    if (!details) return;
    const toggle = details.querySelector('summary');
    const nav = details.querySelector('nav');
    nav.id ||= 'mobile-menu';
    toggle.setAttribute('aria-controls', nav.id);
    toggle.setAttribute('aria-expanded', String(details.open));
    details.addEventListener('toggle', () => toggle.setAttribute('aria-expanded', String(details.open)));
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { details.open = false; }));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && details.open) { details.open = false; toggle.focus(); }
    });
    document.addEventListener('click', event => {
      if (details.open && !details.contains(event.target)) details.close();
    });
  }

  function initMap() {
    document.querySelectorAll('[data-map]').forEach((frame) => {
      const button = frame.querySelector('[data-map-button]');
      button.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = frame.dataset.mapSrc;
        iframe.title = 'Hair Brigada на карте';
        iframe.loading = 'lazy';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        frame.replaceChildren(iframe);
      }, { once: true });
    });
  }

  function initChars() {
    const chars = 'HBRIGADA0123456789';
    document.querySelectorAll('.hero-copy .eyebrow, .hero-brow, .hero-services .small-label, .about-copy h2, .section-heading .small-label').forEach((caption) => {
      if (!caption.closest('.grid-page')) return;
      const value = caption.textContent;
      const span = document.createElement('span');
      span.className = 'noise-source'; span.textContent = value;
      const noise = document.createElement('span');
      noise.className = 'noise-twin'; noise.setAttribute('aria-hidden', 'true');
      noise.textContent = [...value].map((c) => c === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)]).join('');
      caption.classList.add('caption-assemble');
      caption.replaceChildren(span, noise);
      setTimeout(() => {
        caption.classList.add('assembled');
        noise.remove();
      }, Math.min(850, 120 + value.length * 20));
    });
  }

  function initPointer() {
    if (!finePointer.matches) return;
    let spotFrame = 0, x = 0, y = 0;
    addEventListener('pointermove', (event) => {
      x = event.clientX; y = event.clientY;
      if (!spotFrame) spotFrame = requestAnimationFrame(() => {
        spotFrame = 0;
        const spot = document.querySelector('.light-spot');
        if (spot) spot.style.transform = `translate3d(${x}px,${y}px,0)`;
      });
    }, { passive: true });
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      const base = document.body.classList.contains('grid-page') ? -2.5 : 3;
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.rotate = `${base + ((event.clientX - rect.left) / rect.width - .5) * 1.6}deg`;
      });
      card.addEventListener('pointerleave', () => card.style.removeProperty('rotate'));
    });
  }

  function updateProgress() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    root.style.setProperty('--progress', Math.max(0, Math.min(1, scrollY / max)));
  }

  function updateLight() {
    const item = document.querySelector('[data-light]');
    if (item) {
      if (innerWidth >= 900 || reduced.matches) item.style.removeProperty('opacity');
      else {
        const r = item.getBoundingClientRect();
        const value = Math.max(0, Math.min(1, (innerHeight - r.top) / (r.height + innerHeight * .35)));
        item.style.opacity = String(.25 + .75 * value);
      }
    }
    const motto = document.querySelector('[data-motto]');
    if (motto) {
      const visible = Math.max(0, Math.min(1, (innerHeight - motto.getBoundingClientRect().top) / innerHeight));
      motto.style.setProperty('--motto-opacity', .25 + .75 * visible);
    }
  }

  function updateFinalPanel() {
    const panel = document.querySelector('.contact-info');
    if (!panel) return;
    const value = Math.max(0, Math.min(1, (innerHeight * .4 - panel.getBoundingClientRect().top) / (innerHeight * .25)));
    panel.style.setProperty('--fx', `${(1 - value) * 48}px`);
  }

  function updateDrift() {
    if (!document.body.classList.contains('grid-page') || innerWidth < 900 || reduced.matches) return;
    if (CSS.supports('animation-timeline: view()')) return;
    document.querySelectorAll('.drift-photo').forEach((photo) => {
      const r = photo.getBoundingClientRect();
      photo.style.translate = `0 ${Math.max(-24, Math.min(24, (r.top + r.height / 2 - innerHeight / 2) / innerHeight * 24))}px`;
    });
  }
})();
