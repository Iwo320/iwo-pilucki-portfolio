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

Utwórz nowy Blueprint w Render, wskazując to repozytorium i plik `render.yaml`. Podczas konfiguracji ustaw `ADMIN_PASSWORD` jako poufną zmienną środowiskową w panelu Render — nie zapisuj hasła w repozytorium. `SESSION_SECRET` jest generowany automatycznie.

Po wdrożeniu zaloguj się na adresie Render usługi. Domena `iwopilucki.pl` jest obecnie obsługiwana przez GitHub Pages; aby używać panelu logowania pod tą domeną, trzeba przenieść domenę do usługi Render.
