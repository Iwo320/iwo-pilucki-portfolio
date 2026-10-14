# Iwo Piłucki — Photography Portfolio

Portfolio z publiczną galerią i prywatnym panelem administratora.

## Uruchomienie

1. Zainstaluj zależności: `npm install`
2. Uruchom aplikację: `npm start`
3. Otwórz `http://localhost:3000`

## Panel administratora

Na stronie głównej kliknięcie kolekcji otwiera pełną galerię w nowej zakładce. Nowe zdjęcia nie zmieniają okładek kolekcji.

Kategorie: Landscape, Cities, Details, Atmosphere, Aviation.

## Konfiguracja

Ustaw `PORT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `SUPABASE_URL` oraz `SUPABASE_SERVICE_ROLE_KEY` jako zmienne środowiskowe. Klucza service role i hasła nie wolno umieszczać w kodzie ani po stronie przeglądarki.

## Wdrożenie na Render

1. Utwórz darmowy projekt Supabase i otwórz SQL Editor.
2. Uruchom zawartość pliku [`supabase/schema.sql`](./supabase/schema.sql), aby utworzyć tabelę zdjęć, publiczny bucket i dodać aktualne zdjęcia.
3. Skopiuj Project URL oraz klucz `service_role` z ustawień API Supabase.
4. Utwórz Blueprint w Render z tego repozytorium przez [Deploy to Render](https://render.com/deploy?repo=https://github.com/Iwo320/iwo-pilucki-portfolio). Ustaw `ADMIN_PASSWORD`, `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` jako poufne zmienne środowiskowe. `SESSION_SECRET` jest generowany automatycznie.

Po wdrożeniu kliknij `Client login` na [iwopilucki.pl](https://iwopilucki.pl/), zaloguj się, a następnie dodawaj zdjęcia w panelu. Nowe zdjęcia trafią do Supabase Storage i pojawią się w galerii pobieranej z backendu. Strona portfolio pozostaje na GitHub Pages; backend i panel logowania działają na Render.
