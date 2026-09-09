-- 0001_schema.sql
-- Run first. Every table enables RLS in this same file so the two cannot drift.
-- Policies live in 0003_rls.sql; until that runs, RLS denies everything.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums mirror the TypeScript unions in src/types/index.ts
-- ---------------------------------------------------------------------------
create type public.user_role          as enum ('ADMIN', 'TRAINER', 'APPROVER');
create type public.certificate_status as enum ('DRAFT', 'PENDING_APPROVAL', 'VALID', 'REJECTED', 'REVOKED');
create type public.approval_status    as enum ('PENDING', 'APPROVED', 'REJECTED');
create type public.training_status    as enum ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');
create type public.import_status      as enum ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');
create type public.template_status    as enum ('ACTIVE', 'INACTIVE');
create type public.row_validation     as enum ('VALID', 'INVALID');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: application data for an auth.users row.
-- Roles live HERE. Supabase Auth stores identity only.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  email                 text not null,
  name                  text not null,
  role                  public.user_role not null default 'TRAINER',
  signature_image       text,
  signature_uploaded_at timestamptz,
  created_at            timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Reads role/name from the dashboard "User Metadata" field,
-- e.g. {"role":"ADMIN","name":"Maya Admin"}
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'TRAINER')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- SECURITY DEFINER so RLS policies can read profiles without recursing into
-- the profiles policies themselves.
create or replace function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN');
$$;

-- ---------------------------------------------------------------------------
-- certificate_templates
-- ---------------------------------------------------------------------------
create table public.certificate_templates (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text not null default '',
  preview_image text,
  layout        jsonb,
  design        text not null default 'classic',
  status        public.template_status not null default 'ACTIVE',
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.certificate_templates enable row level security;

create trigger certificate_templates_updated_at
  before update on public.certificate_templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- training_programs
-- uuid[] rather than junction tables keeps RLS to `auth.uid() = any(...)`
-- ---------------------------------------------------------------------------
create table public.training_programs (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  description             text not null default '',
  training_code           text not null unique,
  organization            text not null default '',
  start_date              date,
  end_date                date,
  duration                text not null default '',
  location                text not null default '',
  training_type           text not null default '',
  trainer_ids             uuid[] not null default '{}',
  approver_ids            uuid[] not null default '{}',
  certificate_template_id uuid references public.certificate_templates (id) on delete set null,
  status                  public.training_status not null default 'DRAFT',
  created_by              uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now()
);
alter table public.training_programs enable row level security;

create index training_programs_trainer_ids_idx  on public.training_programs using gin (trainer_ids);
create index training_programs_approver_ids_idx on public.training_programs using gin (approver_ids);

-- ---------------------------------------------------------------------------
-- trainees
-- ---------------------------------------------------------------------------
create table public.trainees (
  id                  uuid primary key default gen_random_uuid(),
  training_program_id uuid not null references public.training_programs (id) on delete cascade,
  recipient_name      text not null,
  email               text not null default '',
  employee_id         text,
  department          text,
  training_code       text not null default '',
  dynamic_data        jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);
alter table public.trainees enable row level security;

create index trainees_program_idx on public.trainees (training_program_id);

-- ---------------------------------------------------------------------------
-- import_batches
-- ---------------------------------------------------------------------------
create table public.import_batches (
  id                  uuid primary key default gen_random_uuid(),
  training_program_id uuid not null references public.training_programs (id) on delete cascade,
  template_id         uuid references public.certificate_templates (id) on delete set null,
  file_name           text not null default '',
  total_rows          integer not null default 0,
  valid_rows          integer not null default 0,
  invalid_rows        integer not null default 0,
  status              public.import_status not null default 'DRAFT',
  uploaded_by         uuid references public.profiles (id) on delete set null,
  submitted_at        timestamptz,
  reviewed_by         uuid references public.profiles (id) on delete set null,
  reviewed_at         timestamptz,
  rejection_reason    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
alter table public.import_batches enable row level security;

create trigger import_batches_updated_at
  before update on public.import_batches
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- pending_import_trainees
-- `position` is an SQL keyword, so the column is job_position; the client maps it.
-- ---------------------------------------------------------------------------
create table public.pending_import_trainees (
  id                  uuid primary key default gen_random_uuid(),
  import_batch_id     uuid not null references public.import_batches (id) on delete cascade,
  training_program_id uuid not null references public.training_programs (id) on delete cascade,
  recipient_name      text not null,
  email               text not null default '',
  employee_id         text,
  training_code       text not null default '',
  department          text,
  job_position        text,
  completion_date     text,
  validation_status   public.row_validation not null default 'VALID',
  validation_errors   text[] not null default '{}',
  dynamic_data        jsonb not null default '{}'::jsonb
);
alter table public.pending_import_trainees enable row level security;

create index pending_import_trainees_batch_idx on public.pending_import_trainees (import_batch_id);

-- ---------------------------------------------------------------------------
-- certificates
-- id is a real uuid now; certificate_number and short_id stay unique columns
-- so /certificates/:id keeps resolving by either.
-- ---------------------------------------------------------------------------
create table public.certificates (
  id                      uuid primary key default gen_random_uuid(),
  certificate_number      text not null unique,
  short_id                text not null unique,
  verification_token      uuid not null unique default gen_random_uuid(),
  verification_url        text,
  encrypted_qr_url        text,
  encrypted_qr_token      text,
  encrypted_qr_at         timestamptz,
  recipient_name          text not null,
  certificate_title       text not null default 'Certificate of Completion',
  course_name             text not null default '',
  issue_date              date,
  organization            text not null default '',
  certificate_type        text not null default 'completion',
  email                   text not null default '',
  status                  public.certificate_status not null default 'PENDING_APPROVAL',
  certificate_template_id uuid references public.certificate_templates (id) on delete set null,
  signature_user_id       uuid references public.profiles (id) on delete set null,
  signature_image         text,
  signer_name             text,
  signer_title            text,
  dynamic_data            jsonb not null default '{}'::jsonb,
  training_program_id     uuid references public.training_programs (id) on delete set null,
  trainee_id              uuid references public.trainees (id) on delete set null,
  trainer_ids             uuid[] not null default '{}',
  approver_ids            uuid[] not null default '{}',
  created_at              timestamptz not null default now()
);
alter table public.certificates enable row level security;

-- Enforces one certificate per trainee in the database instead of in JS.
create unique index certificates_trainee_unique
  on public.certificates (trainee_id)
  where trainee_id is not null;

create index certificates_program_idx      on public.certificates (training_program_id);
create index certificates_approver_ids_idx on public.certificates using gin (approver_ids);

-- ---------------------------------------------------------------------------
-- certificate_approvals
-- ---------------------------------------------------------------------------
create table public.certificate_approvals (
  id               uuid primary key default gen_random_uuid(),
  certificate_id   uuid not null references public.certificates (id) on delete cascade,
  approver_id      uuid not null references public.profiles (id) on delete cascade,
  status           public.approval_status not null default 'PENDING',
  rejection_reason text,
  approved_at      timestamptz,
  rejected_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (certificate_id, approver_id)
);
alter table public.certificate_approvals enable row level security;

create trigger certificate_approvals_updated_at
  before update on public.certificate_approvals
  for each row execute function public.set_updated_at();

create index certificate_approvals_approver_idx on public.certificate_approvals (approver_id, status);

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   text not null,
  created_at  timestamptz not null default now()
);
alter table public.audit_logs enable row level security;

create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- certificate_counters backs CERT-YYYY-NNNNNN and resets each year
-- ---------------------------------------------------------------------------
create table public.certificate_counters (
  year       integer primary key,
  last_value integer not null default 0
);
alter table public.certificate_counters enable row level security;
