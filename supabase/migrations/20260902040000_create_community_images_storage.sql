insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-images',
  'community-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "members upload community images" on storage.objects;
create policy "members upload community images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'community-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "members update community images" on storage.objects;
create policy "members update community images" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'community-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'community-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "members delete community images" on storage.objects;
create policy "members delete community images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'community-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

alter table public.post_images enable row level security;

grant select on table public.post_images to anon, authenticated;
grant insert, update, delete on table public.post_images to authenticated;

drop policy if exists "public reads post images" on public.post_images;
create policy "public reads post images" on public.post_images
  for select to anon, authenticated
  using (true);

drop policy if exists "authors insert post images" on public.post_images;
create policy "authors insert post images" on public.post_images
  for insert to authenticated
  with check (
    exists (
      select 1 from public.posts
      where posts.id = post_images.post_id
        and posts.author_id = (select auth.uid())
    )
  );

drop policy if exists "authors update post images" on public.post_images;
create policy "authors update post images" on public.post_images
  for update to authenticated
  using (
    exists (
      select 1 from public.posts
      where posts.id = post_images.post_id
        and posts.author_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.posts
      where posts.id = post_images.post_id
        and posts.author_id = (select auth.uid())
    )
  );

drop policy if exists "authors delete post images" on public.post_images;
create policy "authors delete post images" on public.post_images
  for delete to authenticated
  using (
    exists (
      select 1 from public.posts
      where posts.id = post_images.post_id
        and posts.author_id = (select auth.uid())
    )
  );
