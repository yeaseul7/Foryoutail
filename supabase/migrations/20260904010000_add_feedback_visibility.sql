alter table public.feedback
  add column if not exists is_public boolean not null default false;

create index if not exists feedback_public_created_at_idx
  on public.feedback (is_public, created_at desc);
