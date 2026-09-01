-- Auth에 없는 레거시 사용자의 게시글은 익명으로 보존한다.
update public.posts as posts
set author_id = null
where author_id is not null
  and not exists (
    select 1 from auth.users as auth_user
    where auth_user.id::text = posts.author_id
  );

update public.shelters as shelters
set author_id = null
where author_id is not null
  and not exists (
    select 1 from auth.users as auth_user
    where auth_user.id::text = shelters.author_id
  );

-- FK가 없는 사용량 데이터도 Auth 사용자만 남긴다.
delete from public.ai_search_usage as usage
where not exists (
  select 1 from auth.users as auth_user
  where auth_user.id::text = usage.user_id
);

-- 나머지 사용자 종속 데이터는 기존 ON DELETE CASCADE 규칙으로 함께 삭제된다.
delete from public.users as profile
where not exists (
  select 1 from auth.users as auth_user
  where auth_user.id::text = profile.id
);

do $$
begin
  if exists (
    select 1 from public.users
    where id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ) then
    raise exception 'users.id에 UUID가 아닌 값이 남아 있습니다.';
  end if;
end;
$$;

alter table public.animal_likes drop constraint animal_likes_user_id_fkey;
alter table public.comments drop constraint comments_author_id_fkey;
alter table public.notifications drop constraint notifications_actor_id_fkey;
alter table public.notifications drop constraint notifications_receiver_id_fkey;
alter table public.post_likes drop constraint post_likes_user_id_fkey;
alter table public.posts drop constraint posts_author_id_fkey;
alter table public.shelter_favorites drop constraint shelter_favorites_user_id_fkey;
alter table public.shelters drop constraint shelters_author_id_fkey;

drop policy if exists "insert own ai_search_usage" on public.ai_search_usage;
drop policy if exists "select own ai_search_usage" on public.ai_search_usage;
drop policy if exists "update own ai_search_usage" on public.ai_search_usage;
drop policy if exists animal_likes_delete_own on public.animal_likes;
drop policy if exists animal_likes_insert_own on public.animal_likes;
drop policy if exists animal_likes_select_public on public.animal_likes;
drop policy if exists comments_delete_owner on public.comments;
drop policy if exists comments_insert_authenticated on public.comments;
drop policy if exists comments_select_public on public.comments;
drop policy if exists comments_update_owner on public.comments;
drop policy if exists posts_delete_owner on public.posts;
drop policy if exists posts_insert_authenticated on public.posts;
drop policy if exists posts_select_public on public.posts;
drop policy if exists posts_update_owner on public.posts;
drop policy if exists "delete own shelter favorites" on public.shelter_favorites;
drop policy if exists "insert own shelter favorites" on public.shelter_favorites;
drop policy if exists "select own shelter favorites" on public.shelter_favorites;
drop policy if exists "FullAdmins have full access to shelterdetail" on public.shelterdetail;

alter table public.users
  alter column id type uuid using id::uuid,
  drop column firebase_uid;

alter table public.posts alter column author_id type uuid using author_id::uuid;
alter table public.post_likes alter column user_id type uuid using user_id::uuid;
alter table public.shelters alter column author_id type uuid using author_id::uuid;
alter table public.shelter_favorites alter column user_id type uuid using user_id::uuid;
alter table public.comments alter column author_id type uuid using author_id::uuid;
alter table public.animal_likes alter column user_id type uuid using user_id::uuid;
alter table public.notifications alter column receiver_id type uuid using receiver_id::uuid;
alter table public.notifications alter column actor_id type uuid using actor_id::uuid;
alter table public.ai_search_usage alter column user_id type uuid using user_id::uuid;

alter table public.users
  add constraint users_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;

alter table public.posts
  add constraint posts_author_id_fkey
  foreign key (author_id) references public.users(id) on delete set null;

alter table public.post_likes
  add constraint post_likes_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.shelters
  add constraint shelters_author_id_fkey
  foreign key (author_id) references public.users(id) on delete set null;

alter table public.shelter_favorites
  add constraint shelter_favorites_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.comments
  add constraint comments_author_id_fkey
  foreign key (author_id) references public.users(id) on delete cascade;

alter table public.animal_likes
  add constraint animal_likes_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.notifications
  add constraint notifications_receiver_id_fkey
  foreign key (receiver_id) references public.users(id) on delete cascade,
  add constraint notifications_actor_id_fkey
  foreign key (actor_id) references public.users(id) on delete cascade;

alter table public.ai_search_usage
  add constraint ai_search_usage_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

create policy "insert own ai_search_usage"
on public.ai_search_usage for insert to authenticated
with check (user_id = auth.uid());

create policy "select own ai_search_usage"
on public.ai_search_usage for select to authenticated
using (user_id = auth.uid());

create policy "update own ai_search_usage"
on public.ai_search_usage for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy animal_likes_delete_own
on public.animal_likes for delete to authenticated
using (auth.uid() = user_id);

create policy animal_likes_insert_own
on public.animal_likes for insert to authenticated
with check (auth.uid() = user_id);

create policy animal_likes_select_public
on public.animal_likes for select to public
using (true);

create policy comments_delete_owner
on public.comments for delete to authenticated
using (auth.uid() = author_id);

create policy comments_insert_authenticated
on public.comments for insert to authenticated
with check (auth.uid() = author_id);

create policy comments_select_public
on public.comments for select to public
using (true);

create policy comments_update_owner
on public.comments for update to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy posts_delete_owner
on public.posts for delete to authenticated
using (auth.uid() = author_id);

create policy posts_insert_authenticated
on public.posts for insert to authenticated
with check (auth.uid() = author_id);

create policy posts_select_public
on public.posts for select to public
using (true);

create policy posts_update_owner
on public.posts for update to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "delete own shelter favorites"
on public.shelter_favorites for delete to authenticated
using (user_id = auth.uid());

create policy "insert own shelter favorites"
on public.shelter_favorites for insert to authenticated
with check (user_id = auth.uid());

create policy "select own shelter favorites"
on public.shelter_favorites for select to authenticated
using (user_id = auth.uid());

create policy "FullAdmins have full access to shelterdetail"
on public.shelterdetail for all to authenticated
using (
  exists (
    select 1 from public.users
    where users.id = auth.uid() and users.fulladmin = true
  )
)
with check (
  exists (
    select 1 from public.users
    where users.id = auth.uid() and users.fulladmin = true
  )
);
