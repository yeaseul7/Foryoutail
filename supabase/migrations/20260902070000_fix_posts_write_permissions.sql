grant usage on schema public to anon, authenticated;

revoke insert, update, delete, truncate
  on table public.posts
  from anon;

revoke truncate
  on table public.posts
  from authenticated;

grant select
  on table public.posts
  to anon;

grant select, insert, update, delete
  on table public.posts
  to authenticated;

alter table public.posts enable row level security;

drop policy if exists posts_select_public on public.posts;
create policy posts_select_public
on public.posts for select
to anon, authenticated
using (true);

drop policy if exists posts_insert_authenticated on public.posts;
create policy posts_insert_authenticated
on public.posts for insert
to authenticated
with check (author_id = (select auth.uid()));

drop policy if exists posts_update_owner on public.posts;
create policy posts_update_owner
on public.posts for update
to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));

drop policy if exists posts_delete_owner on public.posts;
create policy posts_delete_owner
on public.posts for delete
to authenticated
using (author_id = (select auth.uid()));
