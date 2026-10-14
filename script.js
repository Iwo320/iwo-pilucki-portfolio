const language = document.querySelector('.language');
const menu = document.querySelector('.menu');
const nav = document.querySelector('.nav');

function setLanguage(locale) {
  document.documentElement.lang = locale;
  document.querySelectorAll('[data-en]').forEach(element => {
    element.innerHTML = element.dataset[locale];
  });
  language.textContent = locale === 'en' ? 'PL' : 'EN';
  language.setAttribute('aria-label', locale === 'en' ? 'Zmień język na polski' : 'Change language to English');
}

language.addEventListener('click', () => setLanguage(document.documentElement.lang === 'en' ? 'pl' : 'en'));
menu.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  menu.classList.toggle('is-open', isOpen);
  menu.setAttribute('aria-expanded', String(isOpen));
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menu.classList.remove('is-open');
  menu.setAttribute('aria-expanded', 'false');
}));

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── scroll reveals ── */
(function reveal() {
  const nodes = document.querySelectorAll('.reveal');
  if (!nodes.length) return;
  if (reducedMotion) {
    nodes.forEach(node => node.classList.add('in'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -4% 0px' });
  nodes.forEach(node => observer.observe(node));
})();

/* ── lazy image reveals ── */
(function revealLazyImages() {
  const images = document.querySelectorAll('img[loading="lazy"]');
  if (!images.length || reducedMotion || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('lazy-image-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '160px 0px' });

  images.forEach(image => {
    image.classList.add('lazy-image');
    observer.observe(image);
  });
})();

/* ── drag-to-scroll roll ── */
(function stripDrag() {
  const strip = document.getElementById('strip');
  if (!strip) return;
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  strip.addEventListener('pointerdown', event => {
    isDown = true;
    moved = false;
    startX = event.clientX;
    startScroll = strip.scrollLeft;
    strip.classList.add('is-dragging');
    strip.setPointerCapture(event.pointerId);
  });
  strip.addEventListener('pointermove', event => {
    if (!isDown) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 4) moved = true;
    strip.scrollLeft = startScroll - delta;
  });
  const end = event => {
    if (!isDown) return;
    isDown = false;
    strip.classList.remove('is-dragging');
    if (strip.hasPointerCapture?.(event.pointerId)) strip.releasePointerCapture(event.pointerId);
  };
  strip.addEventListener('pointerup', end);
  strip.addEventListener('pointercancel', end);
  strip.addEventListener('click', event => {
    if (moved) event.preventDefault();
  }, true);
})();
