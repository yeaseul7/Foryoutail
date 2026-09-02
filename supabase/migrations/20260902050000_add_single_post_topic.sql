alter table public.posts
  add column if not exists topic varchar(20);

alter table public.posts
  drop constraint if exists posts_topic_check;

alter table public.posts
  add constraint posts_topic_check
  check (
    topic is null
    or (
      char_length(btrim(topic)) between 1 and 20
      and topic !~ '[#[:space:]]'
    )
  );

create index if not exists posts_topic_created_at_idx
  on public.posts (topic, created_at desc)
  where topic is not null;
