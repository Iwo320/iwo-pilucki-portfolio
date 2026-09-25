const uploadForm = document.querySelector('.upload-form');
const status = document.querySelector('.status');
const photoList = document.querySelector('.photo-list');
const logout = document.querySelector('.logout');

function renderPhotos(photos) {
  photoList.replaceChildren();
  if (!photos.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No uploaded photos yet.';
    photoList.append(empty);
    return;
  }
  photos.forEach(photo => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    const image = new Image();
    image.src = photo.url;
    image.alt = photo.description || `${photo.category} photograph`;
    image.loading = 'lazy';
    const label = document.createElement('span');
    label.className = 'photo-category';
    label.textContent = photo.category;
    const caption = document.createElement('p');
    caption.className = 'photo-description';
    caption.textContent = photo.description || 'No description yet.';
    const edit = document.createElement('div');
    edit.className = 'photo-edit';
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 500;
    input.value = photo.description || '';
    input.placeholder = 'Add a description...';
    input.setAttribute('aria-label', `Description for ${photo.category} photograph`);
    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = 'Save';
    save.addEventListener('click', async () => {
      save.disabled = true;
      try {
        const response = await fetch(`/api/photos/${photo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: input.value })
        });
        if (!response.ok) throw new Error('save failed');
        const updated = await response.json();
        photo.description = updated.description;
        caption.textContent = updated.description || 'No description yet.';
        image.alt = updated.description || `${photo.category} photograph`;
        save.textContent = 'Saved ✓';
        setTimeout(() => { save.textContent = 'Save'; }, 1500);
      } catch {
        save.textContent = 'Retry';
      } finally {
        save.disabled = false;
      }
    });
    edit.append(input, save);
    card.append(image, label, caption, edit);
    photoList.append(card);
  });
}

async function loadPhotos() {
  const response = await fetch('/api/photos');
  renderPhotos(response.ok ? await response.json() : []);
}

uploadForm.addEventListener('submit', async event => {
  event.preventDefault();
  status.textContent = 'Uploading photos...';
  const response = await fetch('/api/photos', { method: 'POST', body: new FormData(uploadForm) });
  if (!response.ok) {
    status.textContent = 'Upload failed. Please try again.';
    return;
  }
  uploadForm.reset();
  status.textContent = 'Photos uploaded to the collection.';
  loadPhotos();
});

logout.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.assign('index.html');
});

fetch('/api/session').then(response => response.json()).then(session => {
  if (!session.isAdmin) window.location.replace('index.html');
  else loadPhotos();
}).catch(() => window.location.replace('index.html'));
