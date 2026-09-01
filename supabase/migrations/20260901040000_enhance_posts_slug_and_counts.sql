-- status/visibility 없이 게시물 URL과 집계 기능만 mynameis 구조에 맞춘다.

alter table public.posts
  add column if not exists slug varchar(140),
  add column if not exists comment_count integer,
  add column if not exists share_count integer;

-- 기존 게시물은 제목 기반 slug에 UUID 일부를 붙여 중복을 방지한다.
update public.posts
set slug = left(
  trim(both '-' from regexp_replace(lower(trim(title)), '[^[:alnum:]]+', '-', 'g'))
  || '-'
  || left(id::text, 8),
  140
)
where slug is null or trim(slug) = '';

update public.posts
set
  view_count = coalesce(view_count, 0),
  likes_count = coalesce(likes_count, 0),
  comment_count = coalesce(comment_count, 0),
  share_count = coalesce(share_count, 0);

alter table public.posts
  alter column slug set not null,
  alter column view_count set default 0,
  alter column view_count set not null,
  alter column likes_count set default 0,
  alter column likes_count set not null,
  alter column comment_count set default 0,
  alter column comment_count set not null,
  alter column share_count set default 0,
  alter column share_count set not null;

create unique index if not exists posts_slug_uq
  on public.posts (slug);

alter table public.posts drop constraint if exists posts_view_count_check;
alter table public.posts drop constraint if exists posts_likes_count_check;
alter table public.posts drop constraint if exists posts_comment_count_check;
alter table public.posts drop constraint if exists posts_share_count_check;

alter table public.posts
  add constraint posts_view_count_check check (view_count >= 0),
  add constraint posts_likes_count_check check (likes_count >= 0),
  add constraint posts_comment_count_check check (comment_count >= 0),
  add constraint posts_share_count_check check (share_count >= 0);

-- 새 글의 slug가 누락되면 제목과 UUID로 자동 생성한다.
create or replace function public.set_post_slug()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  slug_base text;
begin
  if new.slug is null or trim(new.slug) = '' then
    slug_base := trim(
      both '-'
      from regexp_replace(lower(trim(new.title)), '[^[:alnum:]]+', '-', 'g')
    );
    if slug_base = '' then
      slug_base := 'post';
    end if;
    new.slug := left(slug_base || '-' || left(new.id::text, 8), 140);
  end if;
  return new;
end;
$$;

drop trigger if exists set_post_slug_trigger on public.posts;
create trigger set_post_slug_trigger
before insert or update of title, slug on public.posts
for each row execute function public.set_post_slug();

-- 기존 실제 좋아요/댓글 수로 캐시된 집계 값을 보정한다.
update public.posts as post
set likes_count = (
  select count(*)::integer
  from public.post_likes as post_like
  where post_like.post_id = post.id
);

update public.posts as post
set comment_count = (
  select count(*)::integer
  from public.comments as comment
  where comment.post_id = post.id
);

create or replace function public.sync_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set likes_count = (
    select count(*)::integer
    from public.post_likes
    where post_id = coalesce(new.post_id, old.post_id)
  )
  where id = coalesce(new.post_id, old.post_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_post_like_count_trigger on public.post_likes;
create trigger sync_post_like_count_trigger
after insert or delete on public.post_likes
for each row execute function public.sync_post_like_count();

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
      where post_id = old.post_id
    )
    where id = old.post_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    update public.posts
    set comment_count = (
      select count(*)::integer
      from public.comments
      where post_id = new.post_id
    )
    where id = new.post_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_post_comment_count_trigger on public.comments;
create trigger sync_post_comment_count_trigger
after insert or update of post_id or delete on public.comments
for each row execute function public.sync_post_comment_count();

-- 조회/공유 수는 read-modify-write 경쟁 없이 DB에서 원자적으로 증가시킨다.
create or replace function public.increment_post_view_count(target_post_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.posts
  set view_count = view_count + 1
  where id = target_post_id
  returning view_count into updated_count;

  if updated_count is null then
    raise exception 'post not found';
  end if;
  return updated_count;
end;
$$;

create or replace function public.increment_post_share_count(target_post_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.posts
  set share_count = share_count + 1
  where id = target_post_id
  returning share_count into updated_count;

  if updated_count is null then
    raise exception 'post not found';
  end if;
  return updated_count;
end;
$$;

revoke all on function public.increment_post_view_count(uuid)
  from public, anon, authenticated;
revoke all on function public.increment_post_share_count(uuid)
  from public, anon, authenticated;
grant execute on function public.increment_post_view_count(uuid) to service_role;
grant execute on function public.increment_post_share_count(uuid) to service_role;
