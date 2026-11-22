-- SIGELAB · Gestión de espacios · Schema
-- Runs on Supabase (auth schema provided) and on local PostgreSQL (tests stub auth).

create type public.user_role as enum ('student', 'professor', 'admin');
create type public.request_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.reservation_type as enum ('class_recovery', 'exam', 'cultural_event', 'other');

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

-- Role is read from app_metadata (only settable server-side), never user_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
begin
  begin
    v_role := coalesce(new.raw_app_meta_data ->> 'role', 'student')::public.user_role;
  exception when invalid_text_representation then
    v_role := 'student';
  end;
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    v_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- -------------------------------------------------------------------- labs
create table public.labs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  building text not null,
  floor text not null,
  room text not null,
  capacity integer not null check (capacity > 0),
  -- NULL = "Sin información registrada"
  computers_count integer check (computers_count is null or computers_count >= 0),
  has_projector boolean,
  software text[],
  extra_equipment text[],
  created_at timestamptz not null default now()
);

create table public.time_slots (
  id smallint primary key,
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

insert into public.time_slots (id, start_time, end_time) values
  (1, '07:00', '09:00'), (2, '09:00', '11:00'), (3, '11:00', '13:00'),
  (4, '13:00', '15:00'), (5, '15:00', '17:00'), (6, '17:00', '19:00'),
  (7, '19:00', '21:00');

-- Fixed weekly classes (weekday: 1 = Monday ... 7 = Sunday, ISO)
create table public.class_schedules (
  lab_id uuid not null references public.labs (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  slot_id smallint not null references public.time_slots (id),
  subject text,
  primary key (lab_id, weekday, slot_id)
);

create table public.lab_unavailability (
  lab_id uuid not null references public.labs (id) on delete cascade,
  date date not null,
  slot_id smallint not null references public.time_slots (id),
  reason text,
  primary key (lab_id, date, slot_id)
);

-- ------------------------------------------------------------ requests
create sequence public.reservation_request_seq start 1;

create table public.reservation_requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  requester_id uuid not null references public.profiles (id),
  lab_id uuid not null references public.labs (id),
  date date not null,
  slot_id smallint not null references public.time_slots (id),
  reservation_type public.reservation_type not null,
  attendees integer not null check (attendees > 0),
  reason text not null check (length(btrim(reason)) > 0),
  status public.request_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'rejected' or length(btrim(coalesce(rejection_reason, ''))) > 0)
);

-- Concurrency guard: at most ONE approved request per lab/date/slot.
create unique index reservation_requests_one_approved_per_slot
  on public.reservation_requests (lab_id, date, slot_id)
  where status = 'approved';

create index reservation_requests_requester_idx on public.reservation_requests (requester_id, created_at desc);
create index reservation_requests_slot_idx on public.reservation_requests (lab_id, date, slot_id);
create index reservation_requests_status_idx on public.reservation_requests (status);

create table public.request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.reservation_requests (id) on delete cascade,
  from_status public.request_status,
  to_status public.request_status not null,
  reason text,
  changed_by uuid references public.profiles (id),
  changed_at timestamptz not null default now()
);
create index request_status_history_request_idx on public.request_status_history (request_id, changed_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  request_id uuid references public.reservation_requests (id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
