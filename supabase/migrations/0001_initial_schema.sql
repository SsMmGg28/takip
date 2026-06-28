-- Özel ders takip sistemi: temel şema
-- Roller: teacher (öğretmen/admin), student (öğrenci), parent (veli)

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('teacher', 'student', 'parent')),
  username text not null unique,
  full_name text not null,
  phone text,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.student_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  grade_level smallint,
  notes text
);

create table public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  assigned_date date not null default current_date,
  due_date date,
  status text not null default 'assigned' check (status in ('assigned', 'completed', 'overdue')),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_resource_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  book_title text not null,
  progress_note text,
  status text not null default 'in_progress' check (status in ('not_started', 'in_progress', 'completed')),
  updated_by uuid not null references public.profiles (id),
  updated_at timestamptz not null default now()
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles (id) on delete cascade,
  type text not null check (type in ('lesson', 'homework_deadline', 'reminder')),
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.study_schedule_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  activity_label text not null,
  updated_by uuid not null references public.profiles (id),
  updated_at timestamptz not null default now()
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  exam_name text not null,
  exam_date date not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.exam_subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  subject_name text not null,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  blank_count integer not null default 0
);

create table public.exam_topics (
  id uuid primary key default gen_random_uuid(),
  exam_subject_id uuid not null references public.exam_subjects (id) on delete cascade,
  topic_name text not null,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  blank_count integer not null default 0
);

create index on public.homework (student_id);
create index on public.student_resource_progress (student_id);
create index on public.calendar_events (student_id);
create index on public.study_schedule_entries (student_id);
create index on public.exams (student_id);
create index on public.exam_subjects (exam_id);
create index on public.exam_topics (exam_subject_id);
create index on public.parent_student_links (parent_id);
create index on public.parent_student_links (student_id);

create function public.trigger_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.homework
  for each row execute function public.trigger_set_updated_at();

create trigger set_updated_at before update on public.student_resource_progress
  for each row execute function public.trigger_set_updated_at();

create trigger set_updated_at before update on public.study_schedule_entries
  for each row execute function public.trigger_set_updated_at();
