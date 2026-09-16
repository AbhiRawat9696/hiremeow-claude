-- =====================================================================
-- HireMeow · Supabase schema
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run: every object uses IF NOT EXISTS / OR REPLACE.
-- Then run supabase/seed.sql for BTS/MRT stations (and optional demo data).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  role                  text not null default 'student' check (role in ('student','company','admin')),
  full_name             text check (char_length(full_name) <= 120),
  headline              text check (char_length(headline) <= 160),
  nationality           text,
  university            text,
  field_of_study        text,
  grad_year             int check (grad_year between 1980 and 2100),
  languages             text,
  visa_type             text,
  visa_expiry           date,
  career_goal           text check (char_length(career_goal) <= 300),
  preferred_industries  text[] not null default '{}',
  skills                text[] not null default '{}',
  home_bts_station      text,
  home_mrt_station      text,
  open_to_offers        boolean not null default false,
  desired_salary_min    int check (desired_salary_min >= 0),
  meow_score            int check (meow_score between 0 and 100),
  dna_type              text,
  badges                jsonb not null default '[]'::jsonb,
  pitch_video_id        uuid,
  is_meow_pool_top50    boolean not null default false,
  meow_pool_month       date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists public.companies (
  id                      uuid primary key default gen_random_uuid(),
  owner_id                uuid not null references public.profiles(id) on delete cascade,
  name                    text not null check (char_length(name) between 2 and 120),
  industry                text,
  website                 text check (website is null or website ~* '^https?://'),
  description             text check (char_length(description) <= 2000),
  contact_email           text,
  address                 text,
  bts_station             text,
  mrt_station             text,
  lat                     double precision check (lat between -90 and 90),
  lng                     double precision check (lng between -180 and 180),
  sponsors_visa           boolean not null default false,
  boi_promoted            boolean not null default false,
  company_health          text not null default 'green' check (company_health in ('green','yellow','red')),
  health_note             text,
  health_checked_at       timestamptz,
  health_locked           boolean not null default false,
  response_rate           numeric(5,2) not null default 100 check (response_rate between 0 and 100),
  avg_reply_days          numeric(6,2),
  intern_conversion_rate  numeric(5,2) check (intern_conversion_rate between 0 and 100),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists companies_owner_idx on public.companies(owner_id);

create table if not exists public.jobs (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  title            text not null check (char_length(title) between 2 and 140),
  description      text check (char_length(description) <= 6000),
  employment_type  text not null default 'full_time' check (employment_type in ('full_time','part_time','internship','contract')),
  location         text,
  bts_station      text,
  mrt_station      text,
  lat              double precision check (lat between -90 and 90),
  lng              double precision check (lng between -180 and 180),
  remote_ok        boolean not null default false,
  salary_min       int check (salary_min > 0),
  salary_max       int check (salary_max > 0),
  currency         text not null default 'THB',
  status           text not null default 'draft' check (status in ('draft','published','closed')),
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint jobs_salary_order check (salary_min is null or salary_max is null or salary_max >= salary_min),
  -- Salary Transparency Wall: no salary range, no publishing.
  constraint jobs_salary_required_to_publish check (status <> 'published' or (salary_min is not null and salary_max is not null))
);
create index if not exists jobs_company_idx on public.jobs(company_id);
create index if not exists jobs_status_idx on public.jobs(status);

create table if not exists public.video_pitches (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.profiles(id) on delete cascade,
  storage_path      text not null unique,
  duration_seconds  int not null check (duration_seconds between 1 and 65),
  question          text,
  mime_type         text,
  created_at        timestamptz not null default now(),
  constraint video_path_owner check (split_part(storage_path, '/', 1) = student_id::text)
);
create index if not exists video_pitches_student_idx on public.video_pitches(student_id);

do $$ begin
  alter table public.profiles
    add constraint profiles_pitch_video_fk foreign key (pitch_video_id)
    references public.video_pitches(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.applications (
  id                      uuid primary key default gen_random_uuid(),
  job_id                  uuid not null references public.jobs(id) on delete cascade,
  student_id              uuid not null references public.profiles(id) on delete cascade,
  status                  text not null default 'applied'
                          check (status in ('applied','viewed','shortlisted','interview','offer','rejected','withdrawn')),
  cover_note              text check (char_length(cover_note) <= 1500),
  video_pitch_id          uuid references public.video_pitches(id) on delete set null,
  ghosting_last_reply_at  timestamptz,   -- last time the company acted on this application
  nudged_at               timestamptz,   -- last automatic reminder
  nudge_count             int not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (job_id, student_id)
);
create index if not exists applications_student_idx on public.applications(student_id);
create index if not exists applications_job_idx on public.applications(job_id);

create table if not exists public.application_events (
  id              bigint generated always as identity primary key,
  application_id  uuid not null references public.applications(id) on delete cascade,
  status          text not null,
  actor_id        uuid,
  created_at      timestamptz not null default now()
);
create index if not exists application_events_app_idx on public.application_events(application_id);

-- Reverse Hiring
create table if not exists public.offers (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  job_id        uuid references public.jobs(id) on delete set null,
  title         text not null check (char_length(title) between 2 and 140),
  salary_min    int not null check (salary_min > 0),
  salary_max    int not null check (salary_max > 0),
  message       text check (char_length(message) <= 1500),
  status        text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  constraint offers_salary_order check (salary_max >= salary_min)
);
create index if not exists offers_student_idx on public.offers(student_id);
create index if not exists offers_company_idx on public.offers(company_id);

-- Meow Pool
create table if not exists public.meow_pool (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  month       date not null,
  rank        int check (rank between 1 and 50),
  note        text,
  created_at  timestamptz not null default now(),
  unique (student_id, month)
);

create table if not exists public.meow_pool_access (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies(id) on delete cascade,
  month              date not null,
  stripe_session_id  text unique,
  amount_thb         int,
  paid_at            timestamptz not null default now(),
  unique (company_id, month)
);

-- Ghosting Protection mock mailer
create table if not exists public.email_outbox (
  id          bigint generated always as identity primary key,
  to_email    text,
  subject     text not null,
  body        text not null,
  kind        text not null,
  related_id  uuid,
  status      text not null default 'mock_sent',
  created_at  timestamptz not null default now()
);

-- Layoff Radar
create table if not exists public.company_news (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  headline      text not null,
  url           text,
  source        text,
  sentiment     text not null check (sentiment in ('positive','neutral','negative')),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (company_id, headline)
);

-- BTS / MRT stations (seeded by seed.sql)
create table if not exists public.transit_stations (
  id               text primary key,
  system           text not null check (system in ('BTS','MRT')),
  line             text not null,
  name             text not null,
  seq              int not null,
  interchange_key  text,
  lat              double precision,
  lng              double precision,
  unique (line, seq)
);

-- ---------------------------------------------------------------------
-- 2. Helper functions
-- ---------------------------------------------------------------------

create or replace function public.hm_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.hm_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- True for the service role and the SQL editor (no signed-in user).
-- True for the service role key and the Supabase SQL editor; never for app users.
create or replace function public.hm_is_privileged() returns boolean
language sql stable as $$
  select coalesce(auth.role(), '') = 'service_role' or session_user in ('postgres', 'supabase_admin')
$$;

create or replace function public.hm_owns_company(p_company uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.companies where id = p_company and owner_id = auth.uid())
$$;

create or replace function public.hm_month(p_at timestamptz default now()) returns date
language sql immutable as $$ select (date_trunc('month', p_at at time zone 'Asia/Bangkok'))::date $$;

create or replace function public.hm_has_pool_access(p_month date default null) returns boolean
language sql stable security definer set search_path = public as $$
  select public.hm_is_admin() or exists (
    select 1 from public.meow_pool_access a
    join public.companies c on c.id = a.company_id
    where c.owner_id = auth.uid() and a.month = coalesce(p_month, public.hm_month())
  )
$$;

create or replace function public.hm_can_view_pitch(p_path text) returns boolean
language sql stable security definer set search_path = public as $$
  with s as (select nullif(split_part(p_path, '/', 1), '')::uuid as student_id)
  select
    (select student_id from s) = auth.uid()
    or public.hm_is_admin()
    or (public.hm_role() = 'company' and (
         exists (select 1 from s join public.profiles p on p.id = s.student_id where p.open_to_offers)
      or exists (select 1 from s join public.applications a on a.student_id = s.student_id
                 join public.jobs j on j.id = a.job_id
                 join public.companies c on c.id = j.company_id
                 where c.owner_id = auth.uid())
      or exists (select 1 from s join public.meow_pool m on m.student_id = s.student_id
                 where m.month = public.hm_month() and public.hm_has_pool_access(m.month))
    ))
$$;

create or replace function public.hm_touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

-- ---------------------------------------------------------------------
-- 3. Triggers (business rules)
-- ---------------------------------------------------------------------

-- New auth user → profile. Role comes from sign-up metadata (student|company only).
create or replace function public.hm_handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    case when new.raw_user_meta_data->>'role' = 'company' then 'company' else 'student' end
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists hm_on_auth_user_created on auth.users;
create trigger hm_on_auth_user_created after insert on auth.users
  for each row execute function public.hm_handle_new_user();

-- Users cannot make themselves admin or put themselves in the Meow Pool.
create or replace function public.hm_guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not (public.hm_is_privileged() or public.hm_is_admin()) then
    if new.role is distinct from old.role and (old.role = 'admin' or new.role not in ('student','company')) then
      new.role := old.role;
    end if;
    new.is_meow_pool_top50 := old.is_meow_pool_top50;
    new.meow_pool_month := old.meow_pool_month;
  end if;
  if new.pitch_video_id is not null and not exists (
    select 1 from public.video_pitches v where v.id = new.pitch_video_id and v.student_id = new.id) then
    raise exception 'That pitch video does not belong to this profile';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists hm_guard_profile on public.profiles;
create trigger hm_guard_profile before update on public.profiles
  for each row execute function public.hm_guard_profile();

-- Meow Pool membership follows the admin toggle (max 50 per month).
create or replace function public.hm_sync_meow_pool() returns trigger
language plpgsql security definer set search_path = public as $$
declare m date := public.hm_month();
begin
  if new.is_meow_pool_top50 and not coalesce(old.is_meow_pool_top50, false) then
    if (select count(*) from public.meow_pool where month = m) >= 50 then
      raise exception 'Meow Pool already has 50 students for %', to_char(m, 'Mon YYYY');
    end if;
    insert into public.meow_pool (student_id, month) values (new.id, m) on conflict do nothing;
    update public.profiles set meow_pool_month = m where id = new.id;
  elsif not new.is_meow_pool_top50 and coalesce(old.is_meow_pool_top50, false) then
    delete from public.meow_pool where student_id = new.id and month = m;
  end if;
  return null;
end $$;
drop trigger if exists hm_sync_meow_pool on public.profiles;
create trigger hm_sync_meow_pool after update of is_meow_pool_top50 on public.profiles
  for each row execute function public.hm_sync_meow_pool();

-- Owners cannot edit health / response-rate fields.
create or replace function public.hm_guard_company() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not (public.hm_is_privileged() or public.hm_is_admin()) then
    if tg_op = 'INSERT' then
      if public.hm_role() is distinct from 'company' then
        raise exception 'Only company accounts can create a company';
      end if;
      new.company_health := 'green'; new.health_note := null; new.health_locked := false;
      new.response_rate := 100; new.avg_reply_days := null; new.intern_conversion_rate := null;
    else
      new.owner_id := old.owner_id;
      new.company_health := old.company_health; new.health_note := old.health_note;
      new.health_checked_at := old.health_checked_at; new.health_locked := old.health_locked;
      new.response_rate := old.response_rate; new.avg_reply_days := old.avg_reply_days;
      new.intern_conversion_rate := old.intern_conversion_rate;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists hm_guard_company on public.companies;
create trigger hm_guard_company before insert or update on public.companies
  for each row execute function public.hm_guard_company();

-- Jobs: publish timestamp + friendly Salary Wall error.
create or replace function public.hm_guard_job() returns trigger
language plpgsql as $$
begin
  if new.status = 'published' and (new.salary_min is null or new.salary_max is null) then
    raise exception 'Hiding Treats 🐟: add a salary range before publishing this job'
      using errcode = 'check_violation';
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists hm_guard_job on public.jobs;
create trigger hm_guard_job before insert or update on public.jobs
  for each row execute function public.hm_guard_job();

-- Applications: who may change what, reply tracking, timeline events.
create or replace function public.hm_guard_application() returns trigger
language plpgsql security definer set search_path = public as $$
declare is_student boolean; is_company boolean;
begin
  if tg_op = 'INSERT' then
    if not public.hm_is_privileged() then
      if new.student_id <> auth.uid() then raise exception 'You can only apply as yourself'; end if;
      if not exists (select 1 from public.jobs where id = new.job_id and status = 'published') then
        raise exception 'This job is not open for applications';
      end if;
      new.status := 'applied';
      new.ghosting_last_reply_at := null; new.nudged_at := null; new.nudge_count := 0;
    end if;
    return new;
  end if;

  is_student := old.student_id = auth.uid();
  is_company := exists (select 1 from public.jobs j join public.companies c on c.id = j.company_id
                        where j.id = old.job_id and c.owner_id = auth.uid());
  if not (public.hm_is_privileged() or public.hm_is_admin()) then
    new.job_id := old.job_id; new.student_id := old.student_id;
    new.nudged_at := old.nudged_at; new.nudge_count := old.nudge_count;
    new.ghosting_last_reply_at := old.ghosting_last_reply_at;
    if is_student and not is_company then
      if new.status is distinct from old.status and new.status <> 'withdrawn' then
        raise exception 'Students can only withdraw an application';
      end if;
    elsif is_company then
      new.cover_note := old.cover_note; new.video_pitch_id := old.video_pitch_id;
      if new.status = 'withdrawn' and old.status <> 'withdrawn' then
        raise exception 'Only the student can withdraw';
      end if;
    else
      raise exception 'Not allowed';
    end if;
  end if;
  if new.status is distinct from old.status and (is_company or (public.hm_is_admin() and not is_student)) then
    new.ghosting_last_reply_at := now();
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists hm_guard_application on public.applications;
create trigger hm_guard_application before insert or update on public.applications
  for each row execute function public.hm_guard_application();

create or replace function public.hm_log_application_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.application_events (application_id, status, actor_id)
    values (new.id, new.status, auth.uid());
  end if;
  return null;
end $$;
drop trigger if exists hm_log_application_event on public.applications;
create trigger hm_log_application_event after insert or update of status on public.applications
  for each row execute function public.hm_log_application_event();

-- Offers: companies can only offer to students who are open to offers.
create or replace function public.hm_guard_offer() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.hm_is_privileged() or public.hm_is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    if not public.hm_owns_company(new.company_id) then raise exception 'Not your company'; end if;
    if not exists (select 1 from public.profiles where id = new.student_id and open_to_offers and role = 'student') then
      raise exception 'This student is not open to offers right now';
    end if;
    if new.job_id is not null and not exists (select 1 from public.jobs where id = new.job_id and company_id = new.company_id) then
      raise exception 'That job belongs to another company';
    end if;
    new.status := 'pending'; new.responded_at := null;
    return new;
  end if;
  new.company_id := old.company_id; new.student_id := old.student_id; new.job_id := old.job_id;
  new.title := old.title; new.salary_min := old.salary_min; new.salary_max := old.salary_max; new.message := old.message;
  if new.status is distinct from old.status then
    if old.status <> 'pending' then raise exception 'This offer was already answered'; end if;
    if old.student_id = auth.uid() and new.status in ('accepted','declined') then
      new.responded_at := now();
    elsif public.hm_owns_company(old.company_id) and new.status = 'withdrawn' then
      null;
    else
      raise exception 'Not allowed to set this offer to %', new.status;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists hm_guard_offer on public.offers;
create trigger hm_guard_offer before insert or update on public.offers
  for each row execute function public.hm_guard_offer();

-- ---------------------------------------------------------------------
-- 4. RPCs used by the app
-- ---------------------------------------------------------------------

-- Reverse Hiring: companies browse students who switched on "Open to offers".
create or replace function public.browse_open_students(p_industry text default null, p_search text default null)
returns table (
  id uuid, full_name text, headline text, nationality text, university text, field_of_study text,
  grad_year int, languages text, skills text[], preferred_industries text[], home_bts_station text,
  home_mrt_station text, desired_salary_min int, meow_score int, dna_type text, badges jsonb,
  pitch_path text, pitch_seconds int
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if coalesce(public.hm_role(), '') not in ('company','admin') then
    raise exception 'Only company accounts can browse students';
  end if;
  return query
    select p.id, p.full_name, p.headline, p.nationality, p.university, p.field_of_study, p.grad_year,
           p.languages, p.skills, p.preferred_industries, p.home_bts_station, p.home_mrt_station,
           p.desired_salary_min, p.meow_score, p.dna_type, p.badges, v.storage_path, v.duration_seconds
    from public.profiles p
    left join public.video_pitches v on v.id = p.pitch_video_id
    where p.role = 'student' and p.open_to_offers
      and (p_industry is null or p_industry = any (p.preferred_industries))
      and (p_search is null or concat_ws(' ', p.full_name, p.headline, p.field_of_study, p.university, array_to_string(p.skills, ' ')) ilike '%' || p_search || '%')
    order by p.meow_score desc nulls last, p.updated_at desc
    limit 200;
end $$;

-- Meow Pool: full cards for paying companies/admins, teaser otherwise.
create or replace function public.get_meow_pool(p_month date default null)
returns table (
  student_id uuid, display_name text, university text, field_of_study text, nationality text,
  meow_score int, dna_type text, badge_count int, pitch_path text, unlocked boolean, month date
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare m date := coalesce(p_month, public.hm_month()); ok boolean := public.hm_has_pool_access(coalesce(p_month, public.hm_month()));
begin
  if auth.uid() is null then raise exception 'Sign in to view the Meow Pool'; end if;
  return query
    select case when ok then p.id end,
           case when ok then p.full_name else split_part(coalesce(p.full_name, 'Student'), ' ', 1) || ' •' end,
           p.university, p.field_of_study, p.nationality, p.meow_score, p.dna_type,
           jsonb_array_length(p.badges), case when ok then v.storage_path end, ok, m
    from public.meow_pool mp
    join public.profiles p on p.id = mp.student_id
    left join public.video_pitches v on v.id = p.pitch_video_id
    where mp.month = m
    order by mp.rank nulls last, p.meow_score desc nulls last;
end $$;

create or replace function public.hm_recompute_response_rates(p_days int default 5)
returns void language sql security definer set search_path = public as $$
  update public.companies c set
    response_rate = coalesce(s.rate, 100),
    avg_reply_days = s.avg_days
  from (
    select j.company_id,
      round(100.0 * count(*) filter (where a.ghosting_last_reply_at is not null
             and a.ghosting_last_reply_at <= a.created_at + make_interval(days => p_days))
            / nullif(count(*) filter (where a.created_at < now() - make_interval(days => p_days)
                                        or a.ghosting_last_reply_at is not null), 0), 2) as rate,
      round(avg(extract(epoch from (a.ghosting_last_reply_at - a.created_at)) / 86400)
            filter (where a.ghosting_last_reply_at is not null)::numeric, 2) as avg_days
    from public.applications a join public.jobs j on j.id = a.job_id
    where a.status <> 'withdrawn'
    group by j.company_id
  ) s
  where s.company_id = c.id
$$;

-- Ghosting Protection: nudge companies silent for p_days, log mock emails, refresh response rates.
create or replace function public.hm_run_ghosting_check(p_days int default 5)
returns table (application_id uuid, company_id uuid, to_email text, job_title text, student_name text, days_waiting int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not (public.hm_is_privileged() or public.hm_is_admin()) then
    raise exception 'Admins only';
  end if;
  return query
  with due as (
    select a.id, c.id as cid, coalesce(c.contact_email, u.email) as email, j.title, coalesce(p.full_name, 'A student') as sname,
           (extract(epoch from now() - coalesce(a.ghosting_last_reply_at, a.created_at)) / 86400)::int as waited
    from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    join public.profiles p on p.id = a.student_id
    left join auth.users u on u.id = c.owner_id
    where a.status in ('applied','viewed','shortlisted','interview')
      and coalesce(a.ghosting_last_reply_at, a.created_at) < now() - make_interval(days => p_days)
      and (a.nudged_at is null or a.nudged_at < now() - make_interval(days => p_days))
  ), mailed as (
    insert into public.email_outbox (to_email, subject, body, kind, related_id)
    select d.email,
           'Meow reminder: ' || d.sname || ' is waiting on "' || d.title || '"',
           d.sname || ' applied ' || d.waited || ' days ago and hasn''t heard back. Update the application status on HireMeow — companies that go quiet get a lower response rate on their profile.',
           'ghosting_nudge', d.id
    from due d
    returning related_id
  ), bumped as (
    update public.applications a set nudged_at = now(), nudge_count = a.nudge_count + 1
    from mailed m where a.id = m.related_id
    returning a.id
  )
  select d.id, d.cid, d.email, d.title, d.sname, d.waited from due d join bumped b on b.id = d.id;
  perform public.hm_recompute_response_rates(p_days);
end $$;

-- ---------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.companies           enable row level security;
alter table public.jobs                enable row level security;
alter table public.applications        enable row level security;
alter table public.application_events  enable row level security;
alter table public.offers              enable row level security;
alter table public.video_pitches       enable row level security;
alter table public.meow_pool           enable row level security;
alter table public.meow_pool_access    enable row level security;
alter table public.email_outbox        enable row level security;
alter table public.company_news        enable row level security;
alter table public.transit_stations    enable row level security;

-- profiles
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select using (id = auth.uid() or public.hm_is_admin());
drop policy if exists "profiles: companies read applicants and offer recipients" on public.profiles;
create policy "profiles: companies read applicants and offer recipients" on public.profiles for select using (
  exists (select 1 from public.applications a join public.jobs j on j.id = a.job_id
          join public.companies c on c.id = j.company_id
          where a.student_id = profiles.id and c.owner_id = auth.uid())
  or exists (select 1 from public.offers o join public.companies c on c.id = o.company_id
             where o.student_id = profiles.id and c.owner_id = auth.uid())
);
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles for insert with check (id = auth.uid() and role in ('student','company'));
drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: update own or admin" on public.profiles for update using (id = auth.uid() or public.hm_is_admin());

-- companies (public directory)
drop policy if exists "companies: public read" on public.companies;
create policy "companies: public read" on public.companies for select using (true);
drop policy if exists "companies: owner insert" on public.companies;
create policy "companies: owner insert" on public.companies for insert with check (owner_id = auth.uid());
drop policy if exists "companies: owner or admin update" on public.companies;
create policy "companies: owner or admin update" on public.companies for update using (owner_id = auth.uid() or public.hm_is_admin());
drop policy if exists "companies: owner or admin delete" on public.companies;
create policy "companies: owner or admin delete" on public.companies for delete using (owner_id = auth.uid() or public.hm_is_admin());

-- jobs
drop policy if exists "jobs: read published or own" on public.jobs;
create policy "jobs: read published or own" on public.jobs for select using (
  status = 'published' or public.hm_owns_company(company_id) or public.hm_is_admin());
drop policy if exists "jobs: owner insert" on public.jobs;
create policy "jobs: owner insert" on public.jobs for insert with check (public.hm_owns_company(company_id));
drop policy if exists "jobs: owner update" on public.jobs;
create policy "jobs: owner update" on public.jobs for update using (public.hm_owns_company(company_id) or public.hm_is_admin())
  with check (public.hm_owns_company(company_id) or public.hm_is_admin());
drop policy if exists "jobs: owner delete" on public.jobs;
create policy "jobs: owner delete" on public.jobs for delete using (public.hm_owns_company(company_id) or public.hm_is_admin());

-- applications
drop policy if exists "applications: read" on public.applications;
create policy "applications: read" on public.applications for select using (
  student_id = auth.uid() or public.hm_is_admin()
  or exists (select 1 from public.jobs j where j.id = job_id and public.hm_owns_company(j.company_id)));
drop policy if exists "applications: student insert" on public.applications;
create policy "applications: student insert" on public.applications for insert with check (student_id = auth.uid());
drop policy if exists "applications: update" on public.applications;
create policy "applications: update" on public.applications for update using (
  student_id = auth.uid() or public.hm_is_admin()
  or exists (select 1 from public.jobs j where j.id = job_id and public.hm_owns_company(j.company_id)));

drop policy if exists "application_events: read" on public.application_events;
create policy "application_events: read" on public.application_events for select using (
  exists (select 1 from public.applications a where a.id = application_id));  -- inherits applications RLS

-- offers
drop policy if exists "offers: read" on public.offers;
create policy "offers: read" on public.offers for select using (
  student_id = auth.uid() or public.hm_owns_company(company_id) or public.hm_is_admin());
drop policy if exists "offers: company insert" on public.offers;
create policy "offers: company insert" on public.offers for insert with check (public.hm_owns_company(company_id));
drop policy if exists "offers: update" on public.offers;
create policy "offers: update" on public.offers for update using (
  student_id = auth.uid() or public.hm_owns_company(company_id) or public.hm_is_admin());

-- video pitches
drop policy if exists "video_pitches: read" on public.video_pitches;
create policy "video_pitches: read" on public.video_pitches for select using (public.hm_can_view_pitch(storage_path));
drop policy if exists "video_pitches: insert own" on public.video_pitches;
create policy "video_pitches: insert own" on public.video_pitches for insert with check (student_id = auth.uid());
drop policy if exists "video_pitches: delete own" on public.video_pitches;
create policy "video_pitches: delete own" on public.video_pitches for delete using (student_id = auth.uid() or public.hm_is_admin());

-- meow pool (companies use get_meow_pool())
drop policy if exists "meow_pool: admin" on public.meow_pool;
create policy "meow_pool: admin" on public.meow_pool for all using (public.hm_is_admin()) with check (public.hm_is_admin());
drop policy if exists "meow_pool: own row" on public.meow_pool;
create policy "meow_pool: own row" on public.meow_pool for select using (student_id = auth.uid());
drop policy if exists "meow_pool_access: read own" on public.meow_pool_access;
create policy "meow_pool_access: read own" on public.meow_pool_access for select using (
  public.hm_owns_company(company_id) or public.hm_is_admin());

-- outbox, news, stations
drop policy if exists "email_outbox: admin read" on public.email_outbox;
create policy "email_outbox: admin read" on public.email_outbox for select using (public.hm_is_admin());
drop policy if exists "company_news: public read" on public.company_news;
create policy "company_news: public read" on public.company_news for select using (true);
drop policy if exists "company_news: admin write" on public.company_news;
create policy "company_news: admin write" on public.company_news for all using (public.hm_is_admin()) with check (public.hm_is_admin());
drop policy if exists "transit_stations: public read" on public.transit_stations;
create policy "transit_stations: public read" on public.transit_stations for select using (true);

-- Function access
revoke execute on function public.hm_run_ghosting_check(int) from public, anon;
revoke execute on function public.hm_recompute_response_rates(int) from public, anon, authenticated;
grant execute on function public.hm_run_ghosting_check(int) to authenticated, service_role;
grant execute on function public.hm_recompute_response_rates(int) to service_role;

-- ---------------------------------------------------------------------
-- 6. Storage: private bucket for 60-second pitch videos
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pitch-videos', 'pitch-videos', false, 52428800, array['video/webm','video/mp4','video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "pitch-videos: upload own folder" on storage.objects;
create policy "pitch-videos: upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'pitch-videos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "pitch-videos: read allowed" on storage.objects;
create policy "pitch-videos: read allowed" on storage.objects for select to authenticated
  using (bucket_id = 'pitch-videos' and public.hm_can_view_pitch(name));
drop policy if exists "pitch-videos: delete own" on storage.objects;
create policy "pitch-videos: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'pitch-videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 7. Make yourself admin (edit the email, then run this line separately)
-- ---------------------------------------------------------------------
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');

-- ---------------------------------------------------------------------
-- AI features (also in supabase/migrations/2026-09-16-ai-features.sql)
-- ---------------------------------------------------------------------
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
