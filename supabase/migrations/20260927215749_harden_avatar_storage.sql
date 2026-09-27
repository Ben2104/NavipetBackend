-- The avatars bucket is written only by the backend (service role), which
-- enforces size and image-type checks. Client-facing write policies would let
-- the Flutter app, which ships the anon key, bypass those checks, so drop them.
drop policy if exists "Users can upload their avatar files" on storage.objects;
drop policy if exists "Users can update their avatar files" on storage.objects;
drop policy if exists "Users can delete their avatar files" on storage.objects;

-- Defence in depth: Storage itself rejects oversized or non-image objects.
update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';

-- An earlier out-of-band change defaulted avatar_path to a PNG that was never
-- uploaded; point those rows at the default that exists.
alter table public.profiles
  alter column avatar_path set default 'defaults/avatar.webp';

update public.profiles
set avatar_path = 'defaults/avatar.webp'
where avatar_path = 'defaults/avatar.png';
