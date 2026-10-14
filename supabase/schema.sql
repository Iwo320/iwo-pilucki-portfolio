create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('landscape', 'cities', 'details', 'atmosphere', 'aviation')),
  description text not null default '',
  url text not null unique,
  created_at timestamptz not null default now()
);

alter table public.photos enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into public.photos (category, description, url)
values
  ('aviation', '', 'https://iwopilucki.pl/photos-to-add/Aviation/IMG_9719.JPG'),
  ('aviation', '', 'https://iwopilucki.pl/photos-to-add/Aviation/IMG_9727.JPG'),
  ('cities', '', 'https://iwopilucki.pl/photos-to-add/City/IMG_9236.JPG'),
  ('landscape', '', 'https://iwopilucki.pl/photos-to-add/Landscape/IMG_9681.JPG')
on conflict (url) do nothing;
