const series = {
  Aviation: {
    title: ['Mach &', 'silence'],
    hero: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=2400&q=92',
    description: { en: 'Aircraft become sculpture when speed, light and engineering meet.', pl: 'Samoloty stają się rzeźbą, gdy spotykają się prędkość, światło i inżynieria.' },
    intro: { en: 'A study of machines designed to leave the ground.', pl: 'Studium maszyn zaprojektowanych, by oderwać się od ziemi.' },
    next: 'Landscape'
  },
  Landscape: {
    title: ['Where roads', 'disappear'],
    hero: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2400&q=92',
    description: { en: 'Remote landscapes stripped down to weather, texture and distance.', pl: 'Odległe krajobrazy sprowadzone do pogody, faktury i dystansu.' },
    intro: { en: 'Places where scale silences everything else.', pl: 'Miejsca, w których skala wycisza wszystko inne.' },
    next: 'City'
  },
  City: {
    title: ['', 'Cities'],
    hero: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2400&q=92',
    description: { en: 'The restless architecture and accidental poetry of life after sunset.', pl: 'Niespokojna architektura i przypadkowa poezja życia po zmroku.' },
    intro: { en: 'Human constellations drawn in concrete and light.', pl: 'Ludzkie konstelacje zapisane w betonie i świetle.' },
    next: 'Aviation'
  }
};

const copy = {
  en: { explore: 'Explore photographs', empty: 'This series is being prepared.<br>New frames will land here soon.', next: 'Next series', photographs: 'photographs', photograph: 'photograph' },
  pl: { explore: 'Zobacz fotografie', empty: 'Ta seria jest w przygotowaniu.<br>Nowe kadry pojawią się tutaj wkrótce.', next: 'Następna seria', photographs: 'fotografii', photograph: 'fotografia' }
};

const requestedCategory = new URLSearchParams(window.location.search).get('category');
const category = Object.hasOwn(series, requestedCategory) ? requestedCategory : 'Aviation';
const current = series[category];
const languageButton = document.querySelector('.language-toggle');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let photos = [];
document.body.classList.add('js-enhanced');

function renderLanguage(language) {
  document.documentElement.lang = language;
  document.querySelector('.hero-description').textContent = current.description[language];
  document.querySelector('.gallery-intro').textContent = current.intro[language];
  document.querySelectorAll('[data-copy]').forEach((element) => { element.innerHTML = copy[language][element.dataset.copy]; });
  document.querySelector('.photo-total').textContent = `${photos.length} ${photos.length === 1 ? copy[language].photograph : copy[language].photographs}`;
  languageButton.querySelectorAll('span').forEach((item) => item.classList.toggle('is-active', item.textContent.toLowerCase() === language));
  localStorage.setItem('portfolio-language', language);
}

function configureSeries() {
  document.body.dataset.category = category;
  document.title = `${category} | Iwo Piłucki`;
  document.querySelector('.hero-image').style.backgroundImage = `url("${current.hero}")`;
  document.querySelector('.hero-image').setAttribute('aria-label', `${category} photography by Iwo Piłucki`);
  document.querySelector('.series-hero h1').innerHTML = `<span class="outline">${current.title[0]}</span><span>${current.title[1]}</span>`;
  document.querySelector('.gallery-label').textContent = `${category} archive`;
  document.querySelectorAll('.series-nav a').forEach((link) => link.classList.toggle('is-active', link.dataset.category === category));
  const nextLink = document.querySelector('.next-series a');
  nextLink.href = `/series.html?category=${current.next}`;
  nextLink.querySelector('span').textContent = current.next;
}

async function loadPhotos() {
  try {
    const response = await fetch('/api/photos');
    if (!response.ok) throw new Error('Could not load photographs.');
    photos = (await response.json()).filter((photo) => photo.category === category && !photo.homeOnly);
  } catch {
    photos = [];
  }

  const gallery = document.querySelector('.series-gallery');
  const emptyState = document.querySelector('.empty-state');
  gallery.replaceChildren(...photos.map((photo) => {
    const figure = document.createElement('figure');
    figure.className = 'photo-card';
    const image = document.createElement('img');
    image.src = photo.url;
    image.alt = photo.alt;
    image.loading = 'lazy';
    const caption = document.createElement('figcaption');
    const title = document.createElement('span');
    title.textContent = photo.title;
    const meta = document.createElement('span');
    meta.textContent = [photo.location, photo.year].filter(Boolean).join(' / ');
    caption.append(title, meta);
    figure.append(image, caption);
    if (!reduceMotion) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          figure.classList.add('is-visible');
          observer.disconnect();
        }
      }, { threshold: .12 });
      observer.observe(figure);
    } else {
      figure.classList.add('is-visible');
    }
    return figure;
  }));
  emptyState.hidden = photos.length > 0;
  gallery.hidden = photos.length === 0;
  renderLanguage(document.documentElement.lang);
}

languageButton.addEventListener('click', () => renderLanguage(document.documentElement.lang === 'en' ? 'pl' : 'en'));
document.querySelectorAll('.series-nav a, .next-series a').forEach((link) => link.addEventListener('click', (event) => {
  if (reduceMotion || event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  document.body.classList.add('is-leaving');
  window.setTimeout(() => { window.location.href = link.href; }, 620);
}));
document.querySelector('#year').textContent = new Date().getFullYear();
configureSeries();
document.documentElement.lang = localStorage.getItem('portfolio-language') === 'pl' ? 'pl' : 'en';
loadPhotos();
