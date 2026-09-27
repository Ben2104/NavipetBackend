-- Profile avatars are stored in the private avatars bucket. The profiles table
-- stores only the object path, never the image bytes.
alter table public.profiles
  add column if not exists avatar_path text not null default 'defaults/avatar.webp';

alter table public.profiles
  alter column avatar_path set default 'defaults/avatar.webp';

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do update set public = false;

drop policy if exists "Avatar files are publicly readable" on storage.objects;

drop policy if exists "Users can upload their avatar files" on storage.objects;
create policy "Users can upload their avatar files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and name like (select auth.uid())::text || '/%'
);

drop policy if exists "Users can update their avatar files" on storage.objects;
create policy "Users can update their avatar files"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and name like (select auth.uid())::text || '/%'
)
with check (
  bucket_id = 'avatars'
  and name like (select auth.uid())::text || '/%'
);

drop policy if exists "Users can delete their avatar files" on storage.objects;
create policy "Users can delete their avatar files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and name like (select auth.uid())::text || '/%'
);
