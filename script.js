const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const languageButton = document.querySelector('.language-toggle');
const header = document.querySelector('.site-header');
const hero = document.querySelector('.hero');
const heroPhoto = document.querySelector('.hero-photo');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.body.classList.add('js-enhanced');

const translations = {
  en: {
    visualStories: 'Visual stories', navProjects: 'Projects', navProfile: 'Profile', navContact: 'Contact', navLogin: 'Login',
    heroTitle: '<span>Iwo</span><span>Piłucki</span>',
    heroKicker: 'Photography of aviation,<br>landscapes and cities.', enterArchive: 'Discover the work',
    pointOfView: 'Point of view / 01', manifesto: 'I photograph the split second when scale becomes <em>emotion.</em>',
    based: 'Based in Europe<br>Working worldwide', bio: 'From aircraft cutting through cloud layers to cities glowing after dark, my work follows movement, geometry and the human urge to explore.',
    selectedStories: 'Selected stories / 02', projectsTitle: 'Three altitudes.<br><span>One point of view.</span>',
    viewSeries: 'View series', airDescription: 'Aircraft become sculpture when speed, light and engineering meet.',
    earthDescription: 'Remote landscapes stripped down to weather, texture and distance.', cityDescription: 'The restless architecture and accidental poetry of life after sunset.',
    nextDeparture: 'Next departure / 03',
    contactIntro: 'Want images like these<br>for your brand?', contactCta: 'Get in touch.',
    footerServices: 'Photography / Direction / Print', admin: 'Admin', backToTop: 'Back to top ↑', exploreSeries: 'Explore the series'
  },
  pl: {
    visualStories: 'Historie wizualne', navProjects: 'Projekty', navProfile: 'O mnie', navContact: 'Kontakt', navLogin: 'Logowanie',
    heroTitle: '<span>Iwo</span><span>Piłucki</span>',
    heroKicker: 'Fotografia lotnictwa,<br>krajobrazów i miast.', enterArchive: 'Zobacz fotografie',
    pointOfView: 'Punkt widzenia / 01', manifesto: 'Fotografuję tę krótką chwilę, gdy skala staje się <em>emocją.</em>',
    based: 'Mieszkam w Europie<br>Pracuję na całym świecie', bio: 'Od samolotów przecinających warstwy chmur po miasta świecące po zmroku. W mojej pracy podążam za ruchem, geometrią i ludzką potrzebą odkrywania.',
    selectedStories: 'Wybrane historie / 02', projectsTitle: 'Trzy światy.<br><span>Jedno spojrzenie.</span>',
    viewSeries: 'Zobacz serię', airDescription: 'Samoloty stają się rzeźbą, gdy spotykają się prędkość, światło i inżynieria.',
    earthDescription: 'Odległe krajobrazy sprowadzone do pogody, faktury i dystansu.', cityDescription: 'Niespokojna architektura i przypadkowa poezja życia po zmroku.',
    nextDeparture: 'Następny kierunek / 03',
    contactIntro: 'Chcesz takich kadrów<br>dla swojej marki?', contactCta: 'Odezwij się.',
    footerServices: 'Fotografia / Kreacja / Druk', admin: 'Panel', backToTop: 'Wróć na górę ↑', exploreSeries: 'Zobacz serię'
  }
};

function setLanguage(language) {
  const copy = translations[language];
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = copy[element.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-html]').forEach((element) => { element.innerHTML = copy[element.dataset.i18nHtml]; });
  languageButton?.querySelectorAll('span').forEach((item) => item.classList.toggle('is-active', item.textContent.toLowerCase() === language));
  localStorage.setItem('portfolio-language', language);
}

window.addEventListener('load', () => window.setTimeout(() => document.body.classList.add('is-loaded'), 250));

languageButton?.addEventListener('click', () => setLanguage(document.documentElement.lang === 'en' ? 'pl' : 'en'));

menuButton?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

document.querySelectorAll('.project').forEach((project) => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      project.classList.add('is-visible');
      observer.disconnect();
    }
  }, { threshold: .18 });
  observer.observe(project);
});

function updateScrollEffects() {
  header?.classList.toggle('is-scrolled', window.scrollY > hero.offsetHeight - 90);
}

window.addEventListener('scroll', updateScrollEffects, { passive: true });
window.addEventListener('resize', updateScrollEffects);
updateScrollEffects();

if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  hero?.addEventListener('pointermove', (event) => {
    const x = (event.clientX / window.innerWidth - .5) * -16;
    const y = (event.clientY / window.innerHeight - .5) * -12;
    heroPhoto.style.setProperty('--hero-x', `${x}px`);
    heroPhoto.style.setProperty('--hero-y', `${y}px`);
  });
  hero?.addEventListener('pointerleave', () => {
    heroPhoto.style.setProperty('--hero-x', '0px');
    heroPhoto.style.setProperty('--hero-y', '0px');
  });
}

document.querySelectorAll('.project-image, .project-title-link').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (reduceMotion || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    document.body.classList.add('is-leaving');
    window.setTimeout(() => { window.location.href = link.href; }, 620);
  });
});

async function loadHomeSelections() {
  try {
    const response = await fetch('/api/photos');
    if (!response.ok) return;
    const photos = (await response.json()).filter((photo) => photo.homeOnly);
    const byCategory = photos.reduce((groups, photo) => {
      (groups[photo.category] ||= []).push(photo);
      return groups;
    }, {});
    const featured = [
      ['Aviation', '.project-air .project-image img', 0],
      ['Landscape', '.project-earth .project-image img', 0],
      ['City', '.project-city .project-image img', 0],
      ['Aviation', '.contact-sheet img:first-child', 1],
      ['City', '.contact-sheet img:last-child', 1]
    ];
    featured.forEach(([category, selector, index]) => {
      const photo = byCategory[category]?.[index];
      const image = document.querySelector(selector);
      if (!photo || !image) return;
      image.src = photo.url;
      image.alt = photo.alt;
      image.classList.add('uploaded-photo');
      image.closest('.project-image')?.classList.add('is-landscape');
    });
  } catch { /* Keep the portfolio available if the optional photo API is offline. */ }
}

loadHomeSelections();

document.querySelector('#year').textContent = new Date().getFullYear();
setLanguage(localStorage.getItem('portfolio-language') === 'pl' ? 'pl' : 'en');
