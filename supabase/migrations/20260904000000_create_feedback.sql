create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null default 'suggestion',
  content text not null,
  contact_email text,
  status text not null default 'received',
  created_at timestamptz not null default now(),
  constraint feedback_category_check check (category in ('suggestion', 'bug', 'other')),
  constraint feedback_content_length_check check (char_length(content) between 10 and 2000),
  constraint feedback_status_check check (status in ('received', 'reviewing', 'completed'))
);

alter table public.feedback enable row level security;

comment on table public.feedback is '서비스 건의 및 오류 제보';
