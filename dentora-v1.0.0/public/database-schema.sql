-- Dentora database schema
-- Run this entire file in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'learner');
create type public.question_type as enum ('single_best_answer', 'multiple_select', 'true_false');
create type public.question_difficulty as enum ('foundation', 'standard', 'advanced');
create type public.question_status as enum ('draft', 'published', 'archived');
create type public.session_mode as enum ('practice', 'exam');
create type public.session_status as enum ('active', 'completed', 'abandoned');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.user_role not null default 'learner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(subject_id, slug)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  question_type public.question_type not null default 'single_best_answer',
  stem text not null,
  clinical_vignette text,
  explanation text not null,
  learning_point text,
  reference_text text,
  image_url text,
  subject_id uuid not null references public.subjects(id),
  topic_id uuid references public.topics(id),
  difficulty public.question_difficulty not null default 'standard',
  status public.question_status not null default 'draft',
  tags text[] not null default '{}',
  times_attempted integer not null default 0,
  times_correct integer not null default 0,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  option_text text not null,
  image_url text,
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  unique(question_id, label)
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Practice session',
  mode public.session_mode not null default 'practice',
  status public.session_status not null default 'active',
  question_count integer not null,
  current_position integer not null default 1,
  time_limit_minutes integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score numeric(5,4),
  settings jsonb not null default '{}'
);

create table public.session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  position integer not null,
  answered boolean not null default false,
  flagged boolean not null default false,
  unique(session_id, question_id),
  unique(session_id, position)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  selected_option_ids uuid[] not null default '{}',
  is_correct boolean not null,
  confidence smallint check (confidence between 1 and 5),
  time_seconds integer not null default 0 check (time_seconds >= 0),
  attempted_at timestamptz not null default now(),
  unique(session_id, question_id)
);

create table public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, question_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  note_text text not null,
  updated_at timestamptz not null default now(),
  unique(user_id, question_id)
);

create table public.review_state (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  correct_streak integer not null default 0,
  interval_days integer not null default 0,
  due_at timestamptz not null default now(),
  last_result boolean,
  updated_at timestamptz not null default now(),
  primary key(user_id, question_id)
);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id),
  filename text not null,
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  failed_rows integer not null default 0,
  errors jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index questions_status_subject_idx on public.questions(status, subject_id);
create index questions_topic_idx on public.questions(topic_id);
create index attempts_user_time_idx on public.attempts(user_id, attempted_at desc);
create index review_state_due_idx on public.review_state(user_id, due_at);
create index session_questions_session_position_idx on public.session_questions(session_id, position);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger questions_touch before update on public.questions for each row execute function public.touch_updated_at();
create trigger notes_touch before update on public.notes for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.study_sessions enable row level security;
alter table public.session_questions enable row level security;
alter table public.attempts enable row level security;
alter table public.bookmarks enable row level security;
alter table public.notes enable row level security;
alter table public.review_state enable row level security;
alter table public.import_jobs enable row level security;

create policy "profiles read own or admin" on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());
create policy "admins manage profiles" on public.profiles for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated read subjects" on public.subjects for select to authenticated using (is_active or public.is_admin());
create policy "admins manage subjects" on public.subjects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "authenticated read topics" on public.topics for select to authenticated using (is_active or public.is_admin());
create policy "admins manage topics" on public.topics for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admins manage questions" on public.questions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage options" on public.question_options for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "users manage own sessions" on public.study_sessions for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users read own session questions" on public.session_questions for select to authenticated
using (exists(select 1 from public.study_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "users update own session questions" on public.session_questions for update to authenticated
using (exists(select 1 from public.study_sessions s where s.id = session_id and s.user_id = auth.uid()));

create policy "users read own attempts" on public.attempts for select to authenticated using (user_id = auth.uid());
create policy "users manage own bookmarks" on public.bookmarks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage own notes" on public.notes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users read own review state" on public.review_state for select to authenticated using (user_id = auth.uid());
create policy "admins read imports" on public.import_jobs for select to authenticated using (public.is_admin());
create policy "admins create imports" on public.import_jobs for insert to authenticated with check (public.is_admin() and created_by = auth.uid());

-- Create a filtered practice or exam session. Learners never receive answer keys here.
create or replace function public.create_practice_session(
  p_mode public.session_mode default 'practice',
  p_question_count integer default 20,
  p_subject_id uuid default null,
  p_topic_id uuid default null,
  p_difficulty public.question_difficulty default null,
  p_include_status text default 'all',
  p_time_limit_minutes integer default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_session uuid;
  v_count integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_question_count < 1 or p_question_count > 200 then raise exception 'Question count must be between 1 and 200'; end if;

  insert into public.study_sessions(user_id, title, mode, question_count, time_limit_minutes, settings)
  values(v_user, case when p_mode='exam' then 'Mock exam' else 'Practice session' end, p_mode, p_question_count, p_time_limit_minutes,
    jsonb_build_object('subject_id', p_subject_id, 'topic_id', p_topic_id, 'difficulty', p_difficulty, 'include_status', p_include_status))
  returning id into v_session;

  with eligible as (
    select q.id
    from public.questions q
    where q.status = 'published'
      and (p_subject_id is null or q.subject_id = p_subject_id)
      and (p_topic_id is null or q.topic_id = p_topic_id)
      and (p_difficulty is null or q.difficulty = p_difficulty)
      and (
        p_include_status = 'all'
        or (p_include_status = 'unanswered' and not exists(select 1 from public.attempts a where a.user_id=v_user and a.question_id=q.id))
        or (p_include_status = 'incorrect' and exists(select 1 from public.attempts a where a.user_id=v_user and a.question_id=q.id and a.is_correct=false))
        or (p_include_status = 'bookmarked' and exists(select 1 from public.bookmarks b where b.user_id=v_user and b.question_id=q.id))
        or (p_include_status = 'due' and exists(select 1 from public.review_state r where r.user_id=v_user and r.question_id=q.id and r.due_at <= now()))
      )
    order by random()
    limit p_question_count
  )
  insert into public.session_questions(session_id, question_id, position)
  select v_session, id, row_number() over() from eligible;

  select count(*) into v_count from public.session_questions where session_id=v_session;
  if v_count = 0 then
    delete from public.study_sessions where id=v_session;
    raise exception 'No published questions match those filters';
  end if;
  update public.study_sessions set question_count=v_count where id=v_session;
  return v_session;
end; $$;

create or replace function public.get_session_payload(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_result jsonb;
begin
  if not exists(select 1 from public.study_sessions where id=p_session_id and user_id=v_user) then raise exception 'Session not found'; end if;
  select jsonb_build_object(
    'session', jsonb_build_object('id',s.id,'mode',s.mode,'title',s.title,'status',s.status,'time_limit_minutes',s.time_limit_minutes,'started_at',s.started_at,'current_position',s.current_position),
    'questions', coalesce((select jsonb_agg(jsonb_build_object(
      'id',q.id,'position',sq.position,'question_type',q.question_type,'stem',q.stem,'clinical_vignette',q.clinical_vignette,
      'image_url',q.image_url,'difficulty',q.difficulty,'subject_name',sub.name,'topic_name',t.name,'answered',sq.answered,'flagged',sq.flagged,
      'selected_option_ids',coalesce(a.selected_option_ids,'{}'::uuid[]),
      'options',(select jsonb_agg(jsonb_build_object('id',o.id,'label',o.label,'option_text',o.option_text,'image_url',o.image_url) order by o.sort_order,o.label) from public.question_options o where o.question_id=q.id)
    ) order by sq.position)
    from public.session_questions sq join public.questions q on q.id=sq.question_id
    join public.subjects sub on sub.id=q.subject_id left join public.topics t on t.id=q.topic_id
    left join public.attempts a on a.session_id=s.id and a.question_id=q.id
    where sq.session_id=s.id),'[]'::jsonb)
  ) into v_result from public.study_sessions s where s.id=p_session_id;
  return v_result;
end; $$;

create or replace function public.submit_session_answer(
  p_session_id uuid,
  p_question_id uuid,
  p_selected_option_ids uuid[],
  p_confidence smallint default null,
  p_time_seconds integer default 0
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); v_mode public.session_mode; v_status public.session_status;
  v_correct_ids uuid[]; v_selected uuid[]; v_is_correct boolean; v_streak integer; v_interval integer;
  v_explanation text; v_learning text; v_reference text; v_total integer; v_answered integer; v_correct integer;
begin
  select mode,status into v_mode,v_status from public.study_sessions where id=p_session_id and user_id=v_user;
  if not found or v_status <> 'active' then raise exception 'Active session not found'; end if;
  if not exists(select 1 from public.session_questions where session_id=p_session_id and question_id=p_question_id) then raise exception 'Question is not in this session'; end if;

  select coalesce(array_agg(id order by id),'{}'::uuid[]) into v_correct_ids from public.question_options where question_id=p_question_id and is_correct;
  select coalesce(array_agg(x order by x),'{}'::uuid[]) into v_selected from unnest(coalesce(p_selected_option_ids,'{}'::uuid[])) x;
  v_is_correct := v_selected = v_correct_ids;

  insert into public.attempts(user_id,session_id,question_id,selected_option_ids,is_correct,confidence,time_seconds)
  values(v_user,p_session_id,p_question_id,v_selected,v_is_correct,p_confidence,greatest(p_time_seconds,0))
  on conflict(session_id,question_id) do update set selected_option_ids=excluded.selected_option_ids,is_correct=excluded.is_correct,
    confidence=excluded.confidence,time_seconds=excluded.time_seconds,attempted_at=now();
  update public.session_questions set answered=true where session_id=p_session_id and question_id=p_question_id;

  select coalesce(correct_streak,0) into v_streak from public.review_state where user_id=v_user and question_id=p_question_id;
  v_streak := case when v_is_correct then v_streak+1 else 0 end;
  v_interval := case when not v_is_correct then 1 when v_streak=1 then 2 when v_streak=2 then 5 when v_streak=3 then 10 else least(60, v_streak*7) end;
  insert into public.review_state(user_id,question_id,correct_streak,interval_days,due_at,last_result)
  values(v_user,p_question_id,v_streak,v_interval,now()+make_interval(days=>v_interval),v_is_correct)
  on conflict(user_id,question_id) do update set correct_streak=excluded.correct_streak,interval_days=excluded.interval_days,due_at=excluded.due_at,last_result=excluded.last_result,updated_at=now();

  update public.questions set times_attempted=times_attempted+1,times_correct=times_correct+case when v_is_correct then 1 else 0 end where id=p_question_id;
  select explanation,learning_point,reference_text into v_explanation,v_learning,v_reference from public.questions where id=p_question_id;
  select question_count into v_total from public.study_sessions where id=p_session_id;
  select count(*),count(*) filter(where is_correct) into v_answered,v_correct from public.attempts where session_id=p_session_id;

  if v_mode='exam' then
    return jsonb_build_object('is_correct',null,'correct_option_ids','[]'::jsonb,'explanation',null,'learning_point',null,'reference_text',null,'accuracy',case when v_answered=0 then 0 else v_correct::numeric/v_answered end,'answered_count',v_answered,'total_count',v_total,'reveal',false);
  end if;
  return jsonb_build_object('is_correct',v_is_correct,'correct_option_ids',to_jsonb(v_correct_ids),'explanation',v_explanation,'learning_point',v_learning,'reference_text',v_reference,'accuracy',case when v_answered=0 then 0 else v_correct::numeric/v_answered end,'answered_count',v_answered,'total_count',v_total,'reveal',true);
end; $$;

create or replace function public.complete_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid:=auth.uid(); v_total integer; v_answered integer; v_correct integer; v_score numeric;
begin
  if not exists(select 1 from public.study_sessions where id=p_session_id and user_id=v_user) then raise exception 'Session not found'; end if;
  select question_count into v_total from public.study_sessions where id=p_session_id;
  select count(*),count(*) filter(where is_correct) into v_answered,v_correct from public.attempts where session_id=p_session_id;
  v_score := case when v_total=0 then 0 else v_correct::numeric/v_total end;
  update public.study_sessions set status='completed',completed_at=now(),score=v_score where id=p_session_id;
  return jsonb_build_object('total',v_total,'answered',v_answered,'correct',v_correct,'score',v_score);
end; $$;

create or replace function public.get_session_results(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid:=auth.uid(); v_result jsonb;
begin
  if not exists(select 1 from public.study_sessions where id=p_session_id and user_id=v_user and status='completed') then raise exception 'Completed session not found'; end if;
  select jsonb_build_object(
    'session',jsonb_build_object('id',s.id,'title',s.title,'mode',s.mode,'score',s.score,'question_count',s.question_count,'completed_at',s.completed_at),
    'questions',(select jsonb_agg(jsonb_build_object('id',q.id,'position',sq.position,'stem',q.stem,'explanation',q.explanation,'learning_point',q.learning_point,'reference_text',q.reference_text,'is_correct',a.is_correct,'selected_option_ids',a.selected_option_ids,'correct_option_ids',(select array_agg(o.id order by o.id) from public.question_options o where o.question_id=q.id and o.is_correct),'options',(select jsonb_agg(jsonb_build_object('id',o.id,'label',o.label,'option_text',o.option_text,'is_correct',o.is_correct) order by o.sort_order,o.label) from public.question_options o where o.question_id=q.id)) order by sq.position) from public.session_questions sq join public.questions q on q.id=sq.question_id left join public.attempts a on a.session_id=s.id and a.question_id=q.id where sq.session_id=s.id)
  ) into v_result from public.study_sessions s where s.id=p_session_id;
  return v_result;
end; $$;

create or replace function public.get_dashboard_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid:=auth.uid();
begin
  return jsonb_build_object(
    'attempted',(select count(*) from public.attempts where user_id=v_user),
    'correct',(select count(*) from public.attempts where user_id=v_user and is_correct),
    'accuracy',coalesce((select avg(case when is_correct then 1 else 0 end)::numeric from public.attempts where user_id=v_user),0),
    'bookmarks',(select count(*) from public.bookmarks where user_id=v_user),
    'due',(select count(*) from public.review_state where user_id=v_user and due_at<=now()),
    'sessions',(select count(*) from public.study_sessions where user_id=v_user and status='completed'),
    'recent',coalesce((select jsonb_agg(x order by x.day) from (select d::date as day,count(a.id) as attempted,count(a.id) filter(where a.is_correct) as correct from generate_series(current_date-6,current_date,'1 day') d left join public.attempts a on a.user_id=v_user and a.attempted_at::date=d::date group by d) x),'[]'::jsonb),
    'subjects',coalesce((select jsonb_agg(x order by x.attempted desc) from (select s.name,count(a.id) attempted,count(a.id) filter(where a.is_correct) correct from public.attempts a join public.questions q on q.id=a.question_id join public.subjects s on s.id=q.subject_id where a.user_id=v_user group by s.name limit 8) x),'[]'::jsonb)
  );
end; $$;

create or replace function public.toggle_bookmark(p_question_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_user uuid:=auth.uid();
begin
  if exists(select 1 from public.bookmarks where user_id=v_user and question_id=p_question_id) then delete from public.bookmarks where user_id=v_user and question_id=p_question_id; return false;
  else insert into public.bookmarks(user_id,question_id) values(v_user,p_question_id); return true; end if;
end; $$;

grant execute on function public.create_practice_session to authenticated;
grant execute on function public.get_session_payload to authenticated;
grant execute on function public.submit_session_answer to authenticated;
grant execute on function public.complete_session to authenticated;
grant execute on function public.get_session_results to authenticated;
grant execute on function public.get_dashboard_stats to authenticated;
grant execute on function public.toggle_bookmark to authenticated;

insert into public.subjects(name,slug,icon,sort_order) values
('Applied Dental Sciences','applied-dental-sciences','microscope',1),
('Human Disease','human-disease','heart-pulse',2),
('Restorative Dentistry','restorative-dentistry','wrench',3),
('Prosthodontics','prosthodontics','component',4),
('Periodontology','periodontology','waves',5),
('Endodontics','endodontics','git-branch',6),
('Oral Surgery','oral-surgery','scissors',7),
('Oral Medicine & Pathology','oral-medicine-pathology','scan',8),
('Paediatric Dentistry','paediatric-dentistry','baby',9),
('Orthodontics','orthodontics','move-horizontal',10),
('Dental Public Health','dental-public-health','users',11),
('Law, Ethics & Professionalism','law-ethics-professionalism','scale',12)
on conflict(slug) do nothing;

create or replace function public.get_saved_questions(p_kind text default 'bookmarked')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid:=auth.uid();
begin
  if p_kind='bookmarked' then
    return coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'stem',q.stem,'difficulty',q.difficulty,'subject_name',s.name,'topic_name',t.name,'saved_at',b.created_at) order by b.created_at desc) from public.bookmarks b join public.questions q on q.id=b.question_id join public.subjects s on s.id=q.subject_id left join public.topics t on t.id=q.topic_id where b.user_id=v_user),'[]'::jsonb);
  elsif p_kind='due' then
    return coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'stem',q.stem,'difficulty',q.difficulty,'subject_name',s.name,'topic_name',t.name,'due_at',r.due_at,'last_result',r.last_result) order by r.due_at) from public.review_state r join public.questions q on q.id=r.question_id join public.subjects s on s.id=q.subject_id left join public.topics t on t.id=q.topic_id where r.user_id=v_user and r.due_at<=now()),'[]'::jsonb);
  else raise exception 'Unknown library kind'; end if;
end; $$;
grant execute on function public.get_saved_questions to authenticated;

-- Administrator read access for learner progress and support.
create policy "admins read all sessions" on public.study_sessions for select to authenticated using (public.is_admin());
create policy "admins read all session questions" on public.session_questions for select to authenticated using (public.is_admin());
create policy "admins read all attempts" on public.attempts for select to authenticated using (public.is_admin());
create policy "admins read all bookmarks" on public.bookmarks for select to authenticated using (public.is_admin());
create policy "admins read all notes" on public.notes for select to authenticated using (public.is_admin());
create policy "admins read all review state" on public.review_state for select to authenticated using (public.is_admin());
