-- Applied to the live project on 2026-09-29.
-- Teachers may choose a shared subject but only moderators can add one.
begin;
drop policy if exists subjects_create on public.subjects;
create policy subjects_create on public.subjects for insert to authenticated
with check (creator_id = (select auth.uid()) and private.actor_role() = 'moderator');
commit;
