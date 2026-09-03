alter table public.comment_likes enable row level security;

grant select, insert, delete on table public.comment_likes to authenticated;

drop policy if exists "members read own comment likes" on public.comment_likes;
create policy "members read own comment likes"
on public.comment_likes for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "members insert own comment likes" on public.comment_likes;
create policy "members insert own comment likes"
on public.comment_likes for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "members delete own comment likes" on public.comment_likes;
create policy "members delete own comment likes"
on public.comment_likes for delete to authenticated
using (user_id = (select auth.uid()));

create unique index if not exists comment_likes_comment_user_unique_idx
  on public.comment_likes (comment_id, user_id);
