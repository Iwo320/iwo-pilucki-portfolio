const crypto = require('crypto');
const path = require('path');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
require('dotenv').config();

const app = express();
const port = Number(process.env.PORT || 3000);
const adminEmail = (process.env.ADMIN_EMAIL || 'iwopilucki@icloud.com').trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;
const sessionSecret = process.env.SESSION_SECRET;
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_BUCKET || 'photos';
const photoTable = 'photos';
const categories = new Set(['landscape', 'cities', 'details', 'atmosphere', 'aviation']);
const allowedOrigins = new Set([
  'https://iwopilucki.pl',
  'https://www.iwopilucki.pl',
  'http://localhost:3000',
  ...(process.env.PUBLIC_SITE_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean)
]);
const supportedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

if (!adminPassword || !sessionSecret || !supabaseUrl || !supabaseServiceKey) {
  throw new Error('ADMIN_PASSWORD, SESSION_SECRET, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY must be configured.');
}

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

function supabaseHeaders(extra = {}) {
  return {
    apikey: supabaseServiceKey,
    Authorization: `Bearer ${supabaseServiceKey}`,
    ...extra
  };
}

async function supabaseRequest(endpoint, options = {}) {
  const response = await fetch(`${supabaseUrl}${endpoint}`, {
    ...options,
    headers: supabaseHeaders(options.headers)
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function publicPhoto(row) {
  return {
    id: row.id,
    category: row.category,
    description: row.description || '',
    url: row.url,
    createdAt: row.created_at
  };
}

function storageObjectUrl(objectPath) {
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(storageBucket)}/${encodedPath}`;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 12 },
  fileFilter: (_request, file, callback) => {
    if (!supportedMimeTypes.has(file.mimetype)) {
      callback(Object.assign(new Error('Only JPEG, PNG, WebP, and GIF images are supported.'), { status: 400 }));
      return;
    }
    callback(null, true);
  }
});

app.use((request, response, next) => {
  const origin = request.get('Origin');
  if (origin && allowedOrigins.has(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
    response.set('Vary', 'Origin');
    response.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (request.method === 'OPTIONS') return response.sendStatus(origin && !allowedOrigins.has(origin) ? 403 : 204);
  next();
});

app.use(express.json());
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
}));

function requireAdmin(request, response, next) {
  if (!request.session.isAdmin) return response.status(401).json({ error: 'Authentication required.' });
  next();
}

app.get('/api/health', (_request, response) => response.json({ ok: true }));

app.get('/api/photos', async (_request, response, next) => {
  try {
    const rows = await supabaseRequest(`/rest/v1/${photoTable}?select=id,category,description,url,created_at&order=created_at.desc`);
    response.json(rows.map(publicPhoto));
  } catch (error) {
    next(error);
  }
});

app.get('/api/session', (request, response) => response.json({ isAdmin: Boolean(request.session.isAdmin) }));

app.post('/api/login', (request, response) => {
  const email = String(request.body.email || '').trim().toLowerCase();
  const password = String(request.body.password || '');
  if (email !== adminEmail || password !== adminPassword) {
    return response.status(401).json({ error: 'Incorrect email or password.' });
  }
  request.session.isAdmin = true;
  response.json({ ok: true });
});

app.post('/api/logout', requireAdmin, (request, response, next) => {
  request.session.destroy(error => {
    if (error) return next(error);
    response.clearCookie('connect.sid');
    response.status(204).end();
  });
});

app.post('/api/photos', requireAdmin, upload.array('photos', 12), async (request, response, next) => {
  if (!categories.has(request.body.category)) return response.status(400).json({ error: 'Invalid category.' });
  if (!request.files?.length) return response.status(400).json({ error: 'Choose at least one image.' });

  const description = String(request.body.description || '').trim().slice(0, 500);
  const uploadedPaths = [];

  try {
    const rows = [];
    for (const file of request.files) {
      const extension = path.extname(file.originalname).toLowerCase();
      const objectPath = `${crypto.randomUUID()}${extension}`;
      await supabaseRequest(`/storage/v1/object/${encodeURIComponent(storageBucket)}/${objectPath}`, {
        method: 'POST',
        headers: { 'Content-Type': file.mimetype, 'x-upsert': 'false' },
        body: file.buffer
      });
      uploadedPaths.push(objectPath);
      rows.push({
        category: request.body.category,
        description,
        url: storageObjectUrl(objectPath)
      });
    }

    const created = await supabaseRequest(`/rest/v1/${photoTable}?select=id,category,description,url,created_at`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(rows)
    });
    response.status(201).json(created.map(publicPhoto));
  } catch (error) {
    if (uploadedPaths.length) {
      try {
        await supabaseRequest(`/storage/v1/object/${encodeURIComponent(storageBucket)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefixes: uploadedPaths })
        });
      } catch (cleanupError) {
        console.error('Could not remove uploaded images after a failed gallery save.', cleanupError);
      }
    }
    next(error);
  }
});

app.patch('/api/photos/:id', requireAdmin, async (request, response, next) => {
  const description = String(request.body.description || '').trim().slice(0, 500);
  try {
    const rows = await supabaseRequest(`/rest/v1/${photoTable}?id=eq.${encodeURIComponent(request.params.id)}&select=id,category,description,url,created_at`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ description })
    });
    if (!rows.length) return response.status(404).json({ error: 'Photo not found.' });
    response.json(publicPhoto(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/photos/:id', requireAdmin, async (request, response, next) => {
  try {
    const rows = await supabaseRequest(`/rest/v1/${photoTable}?id=eq.${encodeURIComponent(request.params.id)}&select=id,url`, {
      method: 'DELETE',
      headers: { 'Prefer': 'return=representation' }
    });
    if (!rows.length) return response.status(404).json({ error: 'Photo not found.' });

    const marker = `/storage/v1/object/public/${encodeURIComponent(storageBucket)}/`;
    const url = rows[0].url || '';
    const markerIndex = url.indexOf(marker);
    if (markerIndex !== -1) {
      const objectPath = url.slice(markerIndex + marker.length).split('/').map(decodeURIComponent).join('/');
      try {
        await supabaseRequest(`/storage/v1/object/${encodeURIComponent(storageBucket)}/${objectPath}`, { method: 'DELETE' });
      } catch (cleanupError) {
        console.error('Could not remove the image from storage after deleting the photo row.', cleanupError);
      }
    }
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(__dirname));

app.use((error, _request, response, _next) => {
  console.error(error);
  if (error instanceof multer.MulterError || error.status === 400) {
    return response.status(400).json({ error: error.message });
  }
  response.status(500).json({ error: 'The request failed. Check the server configuration and try again.' });
});

app.listen(port, () => console.log(`Portfolio running at http://localhost:${port}`));
