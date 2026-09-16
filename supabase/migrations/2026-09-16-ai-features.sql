-- HireMeow AI features (16 Sep 2026). Safe to re-run.
-- 1) Recruiter FAQ that powers the public candidate chatbot on each job.
alter table public.jobs add column if not exists candidate_faq text;
do $$ begin
  alter table public.jobs add constraint jobs_candidate_faq_len check (candidate_faq is null or char_length(candidate_faq) <= 3000);
exception when duplicate_object then null; end $$;

-- 2) Public portfolio pages generated from a resume.
create table if not exists public.portfolios (
  id          uuid primary key references public.profiles(id) on delete cascade,
  slug        text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  data        jsonb not null default '{}'::jsonb check (pg_column_size(data) < 60000),
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.portfolios enable row level security;
drop trigger if exists hm_touch_portfolio on public.portfolios;
create trigger hm_touch_portfolio before update on public.portfolios
  for each row execute function public.hm_touch_updated_at();
drop policy if exists "portfolios: public read published" on public.portfolios;
create policy "portfolios: public read published" on public.portfolios for select using (published or id = auth.uid() or public.hm_is_admin());
drop policy if exists "portfolios: insert own" on public.portfolios;
create policy "portfolios: insert own" on public.portfolios for insert with check (id = auth.uid());
drop policy if exists "portfolios: update own" on public.portfolios;
create policy "portfolios: update own" on public.portfolios for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "portfolios: delete own" on public.portfolios;
create policy "portfolios: delete own" on public.portfolios for delete using (id = auth.uid() or public.hm_is_admin());
grant select on public.portfolios to anon, authenticated;
grant insert, update, delete on public.portfolios to authenticated;
