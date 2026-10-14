const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
require('dotenv').config();

const app = express();
const port = Number(process.env.PORT || 3000);
const adminEmail = (process.env.ADMIN_EMAIL || 'iwopilucki@icloud.com').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || 'change-me-in-env';
const sessionSecret = process.env.SESSION_SECRET || 'replace-this-session-secret-before-production';
const categories = new Set(['landscape', 'cities', 'details', 'atmosphere', 'aviation']);
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');
const stagingDir = path.join(__dirname, 'photos-to-add');
const photoDataPath = path.join(dataDir, 'photos.json');
const supportedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const categoryAliases = {
  landscape: 'landscape',
  city: 'cities',
  cities: 'cities',
  detail: 'details',
  details: 'details',
  atmosphere: 'atmosphere',
  aviation: 'aviation'
};

fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(photoDataPath)) fs.writeFileSync(photoDataPath, '[]\n');

function readPhotos() {
  return JSON.parse(fs.readFileSync(photoDataPath, 'utf8'));
}

function writePhotos(photos) {
  fs.writeFileSync(photoDataPath, `${JSON.stringify(photos, null, 2)}\n`);
}

function normalizeCategory(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z]+/g, '');
}

function importStagedPhotos() {
  if (!fs.existsSync(stagingDir)) return;

  const photos = readPhotos();
  const existingSources = new Set(photos.filter(photo => photo.source).map(photo => photo.source));
  const imported = [];

  function visitDirectory(directoryPath) {
    if (!fs.existsSync(directoryPath)) return;

    for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
      const fullPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        visitDirectory(fullPath);
        continue;
      }

      if (!entry.isFile() || entry.name.startsWith('.')) continue;

      const extension = path.extname(entry.name).toLowerCase();
      if (!supportedImageExtensions.has(extension)) continue;

      const rawCategory = normalizeCategory(path.basename(path.dirname(fullPath)));
      const category = categoryAliases[rawCategory] || null;
      if (!category) continue;

      const source = path.relative(__dirname, fullPath).replace(/\\/g, '/');
      if (existingSources.has(source)) continue;

      const fileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
      const targetPath = path.join(uploadsDir, fileName);
      fs.copyFileSync(fullPath, targetPath);

      imported.push({
        id: crypto.randomUUID(),
        category,
        description: '',
        source,
        url: `/uploads/${fileName}`,
        createdAt: new Date().toISOString()
      });
      existingSources.add(source);
    }
  }

  visitDirectory(stagingDir);

  if (imported.length) {
    writePhotos([...imported, ...photos]);
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_request, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    }
  }),
  limits: { fileSize: 15 * 1024 * 1024, files: 12 },
  fileFilter: (_request, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype))
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

app.get('/api/photos', (_request, response) => response.json(readPhotos()));
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

app.post('/api/logout', requireAdmin, (request, response) => {
  request.session.destroy(() => response.status(204).end());
});

app.post('/api/photos', requireAdmin, upload.array('photos', 12), (request, response) => {
  if (!categories.has(request.body.category)) return response.status(400).json({ error: 'Invalid category.' });
  if (!request.files?.length) return response.status(400).json({ error: 'Choose at least one image.' });

  const photos = readPhotos();
  const description = String(request.body.description || '').trim().slice(0, 500);
  const created = request.files.map(file => ({
    id: crypto.randomUUID(),
    category: request.body.category,
    description,
    source: 'upload',
    url: `/uploads/${file.filename}`,
    createdAt: new Date().toISOString()
  }));
  writePhotos([...created, ...photos]);
  response.status(201).json(created);
});

app.patch('/api/photos/:id', requireAdmin, (request, response) => {
  const description = String(request.body.description || '').trim().slice(0, 500);
  const photos = readPhotos();
  const photo = photos.find(item => item.id === request.params.id);
  if (!photo) return response.status(404).json({ error: 'Photo not found.' });
  photo.description = description;
  writePhotos(photos);
  response.json(photo);
});

app.use('/uploads', express.static(uploadsDir));
app.use(express.static(__dirname));

importStagedPhotos();

app.listen(port, () => console.log(`Portfolio running at http://localhost:${port}`));
