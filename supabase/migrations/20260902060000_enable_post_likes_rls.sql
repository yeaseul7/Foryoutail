alter table public.post_likes enable row level security;

grant select, insert, delete on table public.post_likes to authenticated;

drop policy if exists "members read own post likes" on public.post_likes;
create policy "members read own post likes"
on public.post_likes for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "members insert own post likes" on public.post_likes;
create policy "members insert own post likes"
on public.post_likes for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "members delete own post likes" on public.post_likes;
create policy "members delete own post likes"
on public.post_likes for delete to authenticated
using (user_id = (select auth.uid()));

create unique index if not exists post_likes_post_user_unique_idx
  on public.post_likes (post_id, user_id);
