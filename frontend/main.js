// Huquqchi landing — progressive enhancement only; the page works without JS.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero: blur-in word by word.
  let delay = 0.12;
  document.querySelectorAll('[data-words]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      span.style.animationDelay = `${delay}s`;
      span.setAttribute('aria-hidden', 'true');
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      delay += 0.07;
    });
  });

  // Nav: shadow once scrolled; mobile menu.
  const nav = document.getElementById('nav');
  const menuBtn = document.getElementById('menuBtn');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Menyuni yopish' : 'Menyuni ochish');
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  document.querySelectorAll('#mobileMenu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Scroll reveal.
  const revealEls = document.querySelectorAll('.rv');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  }

  // Roles (#rollar): accessible tabs with arrow-key support.
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).classList.toggle('active', on);
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (step) {
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      }
    });
  });

  // AI pipeline stages (mirrors the app's real stage labels).
  const rows = [...document.querySelectorAll('#stages .stage-row')];
  if (rows.length) {
    if (reduce) {
      rows.forEach((r) => r.classList.add('on'));
    } else {
      let n = 0;
      setInterval(() => {
        n = (n + 1) % (rows.length + 2);
        rows.forEach((r, i) => r.classList.toggle('on', i < n));
      }, 900);
    }
  }

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
