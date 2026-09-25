const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
require('dotenv').config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const root = __dirname;
const uploadsDirectory = path.join(root, 'uploads');
const photosFile = path.join(root, 'data', 'photos.json');
const sessions = new Map();
const loginAttempts = new Map();
const sessionLifetime = 1000 * 60 * 60 * 12;

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
  throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD and SESSION_SECRET must be configured.');
}

fs.mkdirSync(uploadsDirectory, { recursive: true });
fs.mkdirSync(path.dirname(photosFile), { recursive: true });
if (!fs.existsSync(photosFile)) fs.writeFileSync(photosFile, '[]\n');

const allowedTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif']
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDirectory,
    filename: (_request, file, callback) => callback(null, `${crypto.randomUUID()}${allowedTypes.get(file.mimetype)}`)
  }),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => callback(null, allowedTypes.has(file.mimetype))
});

app.disable('x-powered-by');
app.use((request, response, next) => {
  response.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  next();
});
app.use(express.json({ limit: '20kb' }));
app.use('/uploads', express.static(uploadsDirectory, { fallthrough: false, maxAge: '7d' }));

function readPhotos() {
  return JSON.parse(fs.readFileSync(photosFile, 'utf8'));
}

function writePhotos(photos) {
  const temporaryFile = `${photosFile}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(photos, null, 2)}\n`);
  fs.renameSync(temporaryFile, photosFile);
}

function safeEqual(value, expected) {
  const actualBuffer = Buffer.from(String(value));
  const expectedBuffer = Buffer.from(String(expected));
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function getCookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((cookie) => {
    const separator = cookie.indexOf('=');
    return [cookie.slice(0, separator).trim(), decodeURIComponent(cookie.slice(separator + 1))];
  }));
}

function getSession(request) {
  const token = getCookies(request).portfolio_session;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { token, ...session };
}

function requireAdmin(request, response, next) {
  if (!getSession(request)) return response.status(401).json({ error: 'Authentication required.' });
  next();
}

app.get('/api/photos', (_request, response) => response.json(readPhotos()));

app.get('/api/admin/session', (request, response) => {
  const session = getSession(request);
  response.status(session ? 200 : 401).json({ authenticated: Boolean(session) });
});

app.post('/api/admin/login', (request, response) => {
  const key = request.ip;
  const attempt = loginAttempts.get(key) || { count: 0, blockedUntil: 0 };
  if (attempt.blockedUntil > Date.now()) return response.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });

  const emailValid = safeEqual(request.body.email || '', process.env.ADMIN_EMAIL);
  const passwordValid = safeEqual(request.body.password || '', process.env.ADMIN_PASSWORD);
  if (!emailValid || !passwordValid) {
    attempt.count += 1;
    if (attempt.count >= 5) {
      attempt.count = 0;
      attempt.blockedUntil = Date.now() + 15 * 60 * 1000;
    }
    loginAttempts.set(key, attempt);
    return response.status(401).json({ error: 'Incorrect email or password.' });
  }

  loginAttempts.delete(key);
  const token = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(crypto.randomBytes(32)).digest('hex');
  sessions.set(token, { expiresAt: Date.now() + sessionLifetime });
  response.setHeader('Set-Cookie', `portfolio_session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${sessionLifetime / 1000}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  response.json({ authenticated: true });
});

app.post('/api/admin/logout', requireAdmin, (request, response) => {
  const session = getSession(request);
  sessions.delete(session.token);
  response.setHeader('Set-Cookie', 'portfolio_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0');
  response.status(204).end();
});

app.post('/api/admin/photos', requireAdmin, upload.single('photo'), (request, response) => {
  if (!request.file) return response.status(400).json({ error: 'Choose a JPG, PNG, WebP or AVIF image.' });

  const title = String(request.body.title || '').trim().slice(0, 100);
  const alt = String(request.body.alt || '').trim().slice(0, 180);
  const category = String(request.body.category || '').trim().slice(0, 40);
  const location = String(request.body.location || '').trim().slice(0, 80);
  const year = String(request.body.year || '').trim().slice(0, 4);

  if (!title || !alt || !['Aviation', 'Landscape', 'City'].includes(category)) {
    fs.unlinkSync(request.file.path);
    return response.status(400).json({ error: 'Title, description and category are required.' });
  }

  const photos = readPhotos();
  const photo = {
    id: crypto.randomUUID(),
    title,
    alt,
    category,
    location,
    year: /^\d{4}$/.test(year) ? year : '',
    url: `/uploads/${request.file.filename}`,
    filename: request.file.filename,
    createdAt: new Date().toISOString()
  };
  photos.unshift(photo);
  writePhotos(photos);
  response.status(201).json(photo);
});

app.delete('/api/admin/photos/:id', requireAdmin, (request, response) => {
  const photos = readPhotos();
  const photo = photos.find((item) => item.id === request.params.id);
  if (!photo) return response.status(404).json({ error: 'Photo not found.' });
  writePhotos(photos.filter((item) => item.id !== photo.id));
  const imagePath = path.join(uploadsDirectory, path.basename(photo.filename));
  if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  response.status(204).end();
});

app.get('/admin', (_request, response) => response.sendFile(path.join(root, 'admin.html')));
app.use(express.static(root, { extensions: ['html'], index: 'index.html' }));

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) return response.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 15 MB.' : error.message });
  console.error(error);
  response.status(500).json({ error: 'Unexpected server error.' });
});

setInterval(() => {
  for (const [token, session] of sessions) if (session.expiresAt < Date.now()) sessions.delete(token);
}, 60 * 60 * 1000).unref();

app.listen(port, () => console.log(`Portfolio running at http://localhost:${port}`));
