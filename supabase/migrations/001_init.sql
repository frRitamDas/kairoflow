-- Kairo schema: transcript history with per-user row level security.
create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_text text not null default '',
  final_text text not null default '',
  language text not null default 'en',
  source text not null default 'browser',
  polished boolean not null default false,
  duration_ms integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists transcripts_user_created_idx
  on public.transcripts (user_id, created_at desc);

alter table public.transcripts enable row level security;

drop policy if exists "Users read own transcripts" on public.transcripts;
create policy "Users read own transcripts"
  on public.transcripts for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own transcripts" on public.transcripts;
create policy "Users insert own transcripts"
  on public.transcripts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own transcripts" on public.transcripts;
create policy "Users delete own transcripts"
  on public.transcripts for delete
  using (auth.uid() = user_id);
