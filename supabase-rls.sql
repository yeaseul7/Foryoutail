alter table public.posts enable row level security;

drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public"
on public.posts
for select
to public
using (true);

drop policy if exists "posts_insert_authenticated" on public.posts;
create policy "posts_insert_authenticated"
on public.posts
for insert
to authenticated
with check (auth.uid()::text = author_id);

drop policy if exists "posts_update_owner" on public.posts;
create policy "posts_update_owner"
on public.posts
for update
to authenticated
using (auth.uid()::text = author_id)
with check (auth.uid()::text = author_id);

drop policy if exists "posts_delete_owner" on public.posts;
create policy "posts_delete_owner"
on public.posts
for delete
to authenticated
using (auth.uid()::text = author_id);

alter table public.comments enable row level security;

drop policy if exists "comments_select_public" on public.comments;
create policy "comments_select_public"
on public.comments
for select
to public
using (true);

drop policy if exists "comments_insert_authenticated" on public.comments;
create policy "comments_insert_authenticated"
on public.comments
for insert
to authenticated
with check (auth.uid()::text = author_id);

drop policy if exists "comments_update_owner" on public.comments;
create policy "comments_update_owner"
on public.comments
for update
to authenticated
using (auth.uid()::text = author_id)
with check (auth.uid()::text = author_id);

drop policy if exists "comments_delete_owner" on public.comments;
create policy "comments_delete_owner"
on public.comments
for delete
to authenticated
using (auth.uid()::text = author_id);
