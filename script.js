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
  menu.setAttribute('aria-expanded', String(isOpen));
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => nav.classList.remove('is-open')));

/* ── split-flap hero board ── */
(function flap() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pool = 'ABCDEFGHIJKLMNOPRSTUVWXYZŁÓŚŻŹĆŃAEIOUY123456789';
  document.querySelectorAll('.flap-row').forEach(row => {
    const target = row.dataset.text || row.textContent;
    row.setAttribute('aria-label', target);
    row.textContent = '';
    [...target].forEach(char => {
      const cell = document.createElement('span');
      cell.className = 'flap-cell';
      cell.textContent = char;
      row.append(cell);
    });
    if (reduced) return;
    const cells = [...row.children];
    cells.forEach((cell, i) => {
      const final = target[i];
      let ticks = 0;
      const total = 8 + i * 3;
      const timer = setInterval(() => {
        cell.textContent = pool[Math.floor(Math.random() * pool.length)];
        if (++ticks >= total) {
          clearInterval(timer);
          cell.textContent = final;
        }
      }, 55);
    });
  });
})();

/* ── quiet scroll reveals ── */
(function reveal() {
  const nodes = document.querySelectorAll('.reveal');
  if (!nodes.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
  }, { threshold: 0.2 });
  nodes.forEach(node => observer.observe(node));
})();
