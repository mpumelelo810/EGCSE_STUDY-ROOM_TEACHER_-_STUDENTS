-- Applied to the live project on 2026-09-29.
begin;
create table public.teacher_subjects (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references public.profiles(id),
 name text not null check (char_length(trim(name)) between 2 and 100 and name=trim(name)),
 syllabus_url text not null default '' check (syllabus_url='' or (syllabus_url ~ '^https://' and char_length(syllabus_url)<=2000)),
 created_at timestamptz not null default now(),
 unique(owner_id,name), unique(id,owner_id)
);
create index teacher_subjects_owner on public.teacher_subjects(owner_id);
alter table public.teacher_subjects enable row level security;
revoke all on public.teacher_subjects from anon,authenticated;
grant select on public.teacher_subjects to authenticated;
grant insert(name,syllabus_url) on public.teacher_subjects to authenticated;
create policy teacher_subjects_read on public.teacher_subjects for select to authenticated
 using (owner_id=(select auth.uid()) and private.actor_role()='teacher');
create policy teacher_subjects_create on public.teacher_subjects for insert to authenticated
 with check (owner_id=(select auth.uid()) and private.actor_role()='teacher');
alter table public.study_rooms drop constraint study_rooms_subject_fkey;
alter table public.study_rooms add column teacher_subject_id uuid;
alter table public.study_rooms add column syllabus_url text not null default ''
 check (syllabus_url='' or (syllabus_url ~ '^https://' and char_length(syllabus_url)<=2000));
alter table public.study_rooms add constraint rooms_teacher_subject_owner
 foreign key (teacher_subject_id,owner_id) references public.teacher_subjects(id,owner_id);
create index study_rooms_teacher_subject on public.study_rooms(teacher_subject_id);
grant insert(teacher_subject_id,syllabus_url) on public.study_rooms to authenticated;
drop policy rooms_create on public.study_rooms;
create policy rooms_create on public.study_rooms for insert to authenticated
 with check (private.actor_role()='teacher' and owner_id=(select auth.uid()) and not archived
 and ((teacher_subject_id is null and exists(select 1 from public.subjects s where s.name=subject))
 or (teacher_subject_id is not null and exists(select 1 from public.teacher_subjects t
 where t.id=teacher_subject_id and t.owner_id=(select auth.uid()) and t.name=subject))));
commit;
