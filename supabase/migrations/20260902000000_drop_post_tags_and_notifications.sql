-- 별도 태그 테이블의 값은 posts.tags에 합쳐 보존한다.
update public.posts as post
set tags = (
  select array_agg(tag order by tag)
  from (
    select distinct existing_tag as tag
    from unnest(coalesce(post.tags, '{}'::text[])) as existing_tag
    where trim(existing_tag) <> ''

    union

    select trim(post_tag.tag_name) as tag
    from public.post_tags as post_tag
    where post_tag.post_id = post.id
      and trim(post_tag.tag_name) <> ''
  ) as merged_tags
)
where exists (
  select 1
  from public.post_tags as post_tag
  where post_tag.post_id = post.id
);

drop table public.post_tags;
drop table public.notifications;
