const loginPanel = document.querySelector('#login-panel');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#login-form');
const uploadForm = document.querySelector('#upload-form');
const loginMessage = document.querySelector('#login-message');
const uploadMessage = document.querySelector('#upload-message');
const photoInput = document.querySelector('#photo');
const preview = document.querySelector('#preview');
const photoList = document.querySelector('#photo-list');
const photoCount = document.querySelector('.photo-count');
const publishButton = document.querySelector('.publish-button');
let previewUrl;

function showDashboard(authenticated) {
  loginPanel.hidden = authenticated;
  dashboard.hidden = !authenticated;
  if (authenticated) loadPhotos();
}

function setMessage(element, message, success = false) {
  element.textContent = message;
  element.classList.toggle('success', success);
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed.');
  return result;
}

async function loadPhotos() {
  try {
    const photos = await request('/api/photos');
    photoCount.textContent = `${photos.length} ${photos.length === 1 ? 'frame' : 'frames'}`;
    if (!photos.length) {
      photoList.innerHTML = '<p class="empty-library">No photographs published yet.</p>';
      return;
    }
    photoList.replaceChildren(...photos.map((photo) => {
      const item = document.createElement('article');
      item.className = 'photo-item';
      const image = document.createElement('img');
      image.src = photo.url;
      image.alt = '';
      const details = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = photo.title;
      const meta = document.createElement('span');
      meta.textContent = [photo.category, photo.year].filter(Boolean).join(' / ');
      details.append(title, meta);
      const remove = document.createElement('button');
      remove.className = 'delete-photo';
      remove.type = 'button';
      remove.setAttribute('aria-label', `Delete ${photo.title}`);
      remove.textContent = '×';
      remove.addEventListener('click', () => deletePhoto(photo));
      item.append(image, details, remove);
      return item;
    }));
  } catch (error) {
    if (error.message === 'Authentication required.') showDashboard(false);
  }
}

async function deletePhoto(photo) {
  if (!window.confirm(`Delete “${photo.title}”? This cannot be undone.`)) return;
  try {
    await request(`/api/admin/photos/${photo.id}`, { method: 'DELETE' });
    await loadPhotos();
  } catch (error) {
    setMessage(uploadMessage, error.message);
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(loginMessage, '');
  const values = Object.fromEntries(new FormData(loginForm));
  try {
    await request('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    loginForm.reset();
    showDashboard(true);
  } catch (error) {
    setMessage(loginMessage, error.message);
  }
});

photoInput.addEventListener('change', () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  const [file] = photoInput.files;
  if (!file) {
    preview.hidden = true;
    return;
  }
  previewUrl = URL.createObjectURL(file);
  preview.src = previewUrl;
  preview.hidden = false;
});

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  publishButton.disabled = true;
  setMessage(uploadMessage, 'Uploading…');
  try {
    await request('/api/admin/photos', { method: 'POST', body: new FormData(uploadForm) });
    uploadForm.reset();
    preview.hidden = true;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMessage(uploadMessage, 'Photograph published.', true);
    await loadPhotos();
  } catch (error) {
    setMessage(uploadMessage, error.message);
  } finally {
    publishButton.disabled = false;
  }
});

document.querySelector('#logout-button').addEventListener('click', async () => {
  await request('/api/admin/logout', { method: 'POST' });
  showDashboard(false);
});

request('/api/admin/session').then(() => showDashboard(true)).catch(() => showDashboard(false));
