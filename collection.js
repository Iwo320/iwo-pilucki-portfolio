const category = new URLSearchParams(location.search).get('category');
const labels = { landscape: 'Landscape', cities: 'Cities', details: 'Details', atmosphere: 'Atmosphere', aviation: 'Aviation' };
const title = labels[category] || 'Collection';
document.title = `${title} — Iwo Piłucki`;
document.querySelector('h1').textContent = title;

const lightbox = document.querySelector('.lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxCaption = lightbox.querySelector('figcaption');
let collection = [];
let currentIndex = 0;

function showPhoto(index) {
  currentIndex = (index + collection.length) % collection.length;
  const photo = collection[currentIndex];
  lightboxImage.src = photo.url;
  lightboxImage.alt = photo.description || `${title} photograph`;
  lightboxCaption.textContent = photo.description || `${title} — ${currentIndex + 1} / ${collection.length}`;
}

function openLightbox(index) {
  showPhoto(index);
  lightbox.showModal();
}

document.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
document.querySelector('.lightbox-prev').addEventListener('click', event => { event.stopPropagation(); showPhoto(currentIndex - 1); });
document.querySelector('.lightbox-next').addEventListener('click', event => { event.stopPropagation(); showPhoto(currentIndex + 1); });
lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
document.addEventListener('keydown', event => {
  if (!lightbox.open) return;
  if (event.key === 'ArrowRight') showPhoto(currentIndex + 1);
  if (event.key === 'ArrowLeft') showPhoto(currentIndex - 1);
});

fetch('/api/photos').then(response => response.ok ? response.json() : []).then(photos => {
  collection = photos.filter(photo => photo.category === category);
  document.querySelector('.count').textContent = `${collection.length} ${collection.length === 1 ? 'photograph' : 'photographs'}`;
  const grid = document.querySelector('.collection-grid');
  collection.forEach((photo, index) => {
    const card = document.createElement('figure');
    card.className = 'photo';
    const image = new Image();
    image.src = photo.url;
    image.alt = photo.description || `${title} photograph`;
    image.loading = 'lazy';
    const caption = document.createElement('figcaption');
    caption.textContent = photo.description || '';
    card.append(image, caption);
    card.addEventListener('click', () => openLightbox(index));
    grid.append(card);
  });
  document.querySelector('.empty').hidden = collection.length > 0;
}).catch(() => {
  document.querySelector('.count').textContent = '0 photographs';
  document.querySelector('.empty').hidden = false;
});
