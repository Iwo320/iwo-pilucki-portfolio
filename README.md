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
