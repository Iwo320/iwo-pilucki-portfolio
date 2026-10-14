# Iwo Piłucki — Photography Portfolio

Portfolio z publiczną galerią i prywatnym panelem administratora.

## Uruchomienie

1. Zainstaluj zależności: `npm install`
2. Uruchom aplikację: `npm start`
3. Otwórz `http://localhost:3000`

## Panel administratora

Kliknij `Client login` w nagłówku. Po zalogowaniu strona otworzy osobny panel `admin.html`. Wybierz kategorię i dodaj zdjęcia. Pliki są publikowane w `uploads/`, a dane galerii zapisywane w `data/photos.json`.

Na stronie głównej kliknięcie kolekcji otwiera pełną galerię w nowej zakładce. Nowe zdjęcia nie zmieniają okładek kolekcji.

Kategorie: Landscape, Cities, Details, Atmosphere, Aviation.

## Konfiguracja

Ustaw `PORT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` oraz `SESSION_SECRET` w `.env`. Skopiuj `.env.example`, jeśli plik nie istnieje.

## Wdrożenie na Render

Utwórz Blueprint w Render, wskazując to repozytorium i plik `render.yaml`, lub użyj [Deploy to Render](https://render.com/deploy?repo=https://github.com/Iwo320/iwo-pilucki-portfolio). Podczas konfiguracji ustaw `ADMIN_PASSWORD` jako poufną zmienną środowiskową w panelu Render — nie zapisuj hasła w repozytorium. `SESSION_SECRET` jest generowany automatycznie.

Po wdrożeniu aplikacja i panel logowania będą dostępne pod adresem `https://iwo-pilucki-portfolio.onrender.com`. Publiczna strona pozostaje na GitHub Pages, a jej przycisk logowania otworzy panel na Render. Domena `iwopilucki.pl` jest obecnie obsługiwana przez GitHub Pages; aby cała aplikacja działała pod tą domeną, trzeba przenieść domenę do usługi Render.
