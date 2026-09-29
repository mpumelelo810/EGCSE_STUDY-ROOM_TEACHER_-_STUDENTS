begin;
alter table public.subjects add column available boolean not null default false;
update public.subjects set available=true where syllabus_url<>'';
grant insert(syllabus_url,available) on public.subjects to authenticated;
grant update(available,syllabus_url) on public.subjects to authenticated;
create policy subjects_moderator_update on public.subjects for update to authenticated
using (private.actor_role()='moderator') with check (private.actor_role()='moderator');
drop policy subject_topics_read on public.subject_topics;
create policy subject_topics_read on public.subject_topics for select to authenticated
using (private.actor_role() in ('moderator','teacher','student'));
grant insert(subject_name,position,title) on public.subject_topics to authenticated;
grant update(position,title) on public.subject_topics to authenticated;
grant delete on public.subject_topics to authenticated;
create policy subject_topics_create on public.subject_topics for insert to authenticated
with check (private.actor_role()='moderator');
create policy subject_topics_update on public.subject_topics for update to authenticated
using (private.actor_role()='moderator') with check (private.actor_role()='moderator');
create policy subject_topics_delete on public.subject_topics for delete to authenticated
using (private.actor_role()='moderator');
create table public.global_lessons (
 id uuid primary key default gen_random_uuid(),
 topic_id uuid not null unique references public.subject_topics(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 2 and 180),
 overview text not null default '' check (char_length(overview)<=10000),
 steps text not null default '' check (char_length(steps)<=12000),
 worked_example text not null default '' check (char_length(worked_example)<=12000),
 practice_question text not null default '' check (char_length(practice_question)<=3000),
 practice_answer text not null default '' check (char_length(practice_answer)<=6000),
 resource_url text not null default '' check (resource_url='' or (resource_url ~ '^https://' and char_length(resource_url)<=2000)),
 published boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.global_lessons enable row level security;
revoke all on public.global_lessons from anon,authenticated;
grant select,delete on public.global_lessons to authenticated;
grant insert(topic_id,title,overview,steps,worked_example,practice_question,practice_answer,resource_url,published) on public.global_lessons to authenticated;
grant update(title,overview,steps,worked_example,practice_question,practice_answer,resource_url,published,updated_at) on public.global_lessons to authenticated;
create policy global_lessons_read on public.global_lessons for select to authenticated
using (private.actor_role()='moderator' or (published and private.actor_role() in ('teacher','student')));
create policy global_lessons_create on public.global_lessons for insert to authenticated
with check (private.actor_role()='moderator');
create policy global_lessons_update on public.global_lessons for update to authenticated
using (private.actor_role()='moderator') with check (private.actor_role()='moderator');
create policy global_lessons_delete on public.global_lessons for delete to authenticated
using (private.actor_role()='moderator');
create index if not exists study_rooms_teacher_subject_owner on public.study_rooms(teacher_subject_id,owner_id);
commit;