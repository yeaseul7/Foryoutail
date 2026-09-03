-- 1. 댓글 좋아요 사용자 ID를 Auth 기반 UUID 프로필과 연결한다.
alter table public.comment_likes
  alter column user_id type uuid using user_id::uuid;

alter table public.comment_likes
  add constraint comment_likes_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

-- 2. 댓글과 이미지의 필수 관계를 보장한다.
alter table public.comments
  alter column post_id set not null,
  alter column author_id set not null;

alter table public.post_images
  alter column post_id set not null;

-- 3. posts.author_id는 회원 탈퇴 후 글 보존을 위해 nullable 및 SET NULL을 유지한다.

-- 4. 커뮤니티 데이터의 생성·수정 시간을 필수로 만든다.
update public.posts
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, created_at, now());

update public.comments
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, created_at, now());

update public.post_images set created_at = coalesce(created_at, now());
update public.post_likes set created_at = coalesce(created_at, now());
update public.comment_likes set created_at = coalesce(created_at, now());

alter table public.posts
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.comments
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.post_images
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.post_likes
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.comment_likes
  alter column created_at set default now(),
  alter column created_at set not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_posts_updated_at_trigger on public.posts;
create trigger set_posts_updated_at_trigger
before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists set_comments_updated_at_trigger on public.comments;
create trigger set_comments_updated_at_trigger
before update on public.comments
for each row execute function public.set_updated_at();

-- 5. 게시물 내 이미지 순서를 명시한다.
alter table public.post_images
  add column sort_order smallint;

with ranked_images as (
  select id,
         (row_number() over (
           partition by post_id
           order by created_at asc, id asc
         ) - 1)::smallint as position
  from public.post_images
)
update public.post_images as image
set sort_order = ranked.position
from ranked_images as ranked
where image.id = ranked.id;

alter table public.post_images
  alter column sort_order set default 0,
  alter column sort_order set not null,
  add constraint post_images_sort_order_check check (sort_order >= 0);

create index post_images_post_order_idx
  on public.post_images (post_id, sort_order, created_at);

-- 6, 7. 댓글 소프트 삭제와 댓글 좋아요 집계를 추가한다.
alter table public.comments
  add column deleted_at timestamptz,
  add column like_count integer not null default 0;

alter table public.comments
  add constraint comments_like_count_check check (like_count >= 0);

update public.comments as comment
set like_count = (
  select count(*)::integer
  from public.comment_likes as comment_like
  where comment_like.comment_id = comment.id
);

create or replace function public.sync_comment_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.comments
  set like_count = (
    select count(*)::integer
    from public.comment_likes
    where comment_id = coalesce(new.comment_id, old.comment_id)
  )
  where id = coalesce(new.comment_id, old.comment_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_comment_like_count_trigger
  on public.comment_likes;
create trigger sync_comment_like_count_trigger
after insert or delete on public.comment_likes
for each row execute function public.sync_comment_like_count();

create or replace function public.soft_delete_comment(target_comment_id uuid)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  update public.comments
  set content = '', deleted_at = now()
  where id = target_comment_id
    and author_id = auth.uid()
    and deleted_at is null;
  return found;
end;
$$;

revoke all on function public.soft_delete_comment(uuid) from public, anon;
grant execute on function public.soft_delete_comment(uuid) to authenticated;

-- 소프트 삭제된 댓글은 게시물의 활성 댓글 수에서 제외한다.
create or replace function public.sync_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('DELETE', 'UPDATE') then
    update public.posts
    set comment_count = (
      select count(*)::integer
      from public.comments
      where post_id = old.post_id and deleted_at is null
    )
    where id = old.post_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    update public.posts
    set comment_count = (
      select count(*)::integer
      from public.comments
      where post_id = new.post_id and deleted_at is null
    )
    where id = new.post_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_post_comment_count_trigger on public.comments;
create trigger sync_post_comment_count_trigger
after insert or update of post_id, deleted_at or delete on public.comments
for each row execute function public.sync_post_comment_count();

-- 8. 기존 본문은 자동 판별하고, 새 에디터 본문은 RICH_HTML을 기본으로 한다.
alter table public.posts
  add column content_format varchar(20);

update public.posts
set content_format = case
  when content ~* '<(p|div|figure|img|blockquote|ul|ol|li|h[1-6]|br)(\s|/?>)'
    then 'RICH_HTML'
  else 'PLAIN_TEXT'
end;

alter table public.posts
  alter column content_format set default 'RICH_HTML',
  alter column content_format set not null,
  add constraint posts_content_format_check
    check (content_format in ('PLAIN_TEXT', 'RICH_HTML'));
