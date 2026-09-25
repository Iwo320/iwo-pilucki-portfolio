# Iwo Piłucki — Photography Portfolio

Bilingual photography portfolio and private image-management panel for aviation, landscape, and city photography.

## Run locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set a unique admin password and session secret.
3. Start the server: `npm start`
4. Open `http://localhost:3000` or the admin panel at `http://localhost:3000/admin`.

The admin panel publishes image files to `uploads/` and stores their metadata in `data/photos.json`. Both are excluded from Git so private photographs are not pushed with the source.

## Photo drop folders

Drop photographs that are ready to be added to the site into `photos-to-add/Aviation`, `photos-to-add/Landscape`, or `photos-to-add/City`. These incoming image files are excluded from Git.

## Configuration

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, and optionally `PORT` in `.env`. Use a strong, unique password and a randomly generated session secret for deployments. Set `NODE_ENV=production` when serving over HTTPS so session cookies use the `Secure` flag.
