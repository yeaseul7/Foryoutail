grant usage on schema public to anon, authenticated;

revoke insert, update, delete, truncate
  on table public.comments
  from anon;

revoke truncate
  on table public.comments
  from authenticated;

grant select
  on table public.comments
  to anon;

grant select, insert, update
  on table public.comments
  to authenticated;

alter table public.comments enable row level security;

drop policy if exists comments_select_public on public.comments;
create policy comments_select_public
on public.comments for select
to anon, authenticated
using (true);

drop policy if exists comments_insert_authenticated on public.comments;
create policy comments_insert_authenticated
on public.comments for insert
to authenticated
with check (author_id = (select auth.uid()));

drop policy if exists comments_update_owner on public.comments;
create policy comments_update_owner
on public.comments for update
to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));
