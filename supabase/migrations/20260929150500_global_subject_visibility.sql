drop policy global_lessons_read on public.global_lessons;
create policy global_lessons_read on public.global_lessons for select to authenticated
using (private.actor_role()='moderator' or
 (published and private.actor_role() in ('teacher','student')
 and exists(select 1 from public.subject_topics t join public.subjects s on s.name=t.subject_name
 where t.id=topic_id and s.available)));
