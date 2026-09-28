-- Retain the existing access model while caching per-request identity lookups.
begin;
create index room_materials_owner on public.room_materials(owner_id);
create index moderation_log_actor on public.moderation_log(actor_id);

alter policy profiles_read on public.profiles to authenticated using (id=(select auth.uid()) or (select private.actor_role())='moderator' or private.teaches_student(id));
alter policy profiles_rename on public.profiles to authenticated using (id=(select auth.uid()) and (select private.actor_role()) is not null) with check (id=(select auth.uid()));
alter policy progress_private on public.study_progress to authenticated using (user_id=(select auth.uid()) and (select private.actor_role()) is not null);
alter policy rooms_read on public.study_rooms to authenticated using ((owner_id=(select auth.uid()) and (select private.actor_role())='teacher') or private.can_read_room(id));
alter policy rooms_create on public.study_rooms to authenticated with check ((select private.actor_role())='teacher' and owner_id=(select auth.uid()) and not archived);
alter policy rooms_update on public.study_rooms to authenticated using (private.owns_room(id)) with check (private.owns_room(id));
alter policy members_read on public.room_members to authenticated using ((user_id=(select auth.uid()) and (select private.actor_role())='student') or private.owns_room(room_id) or (select private.actor_role())='moderator');
alter policy materials_read on public.room_materials to authenticated using ((select private.actor_role())='moderator' or (private.can_read_room(room_id) and (not hidden or private.owns_room(room_id))));
alter policy materials_create on public.room_materials to authenticated with check (private.owns_room(room_id) and owner_id=(select auth.uid()) and not hidden and exists(select 1 from public.study_rooms where id=room_id and not archived));
alter policy materials_update on public.room_materials to authenticated using (owner_id=(select auth.uid()) and private.owns_room(room_id)) with check (owner_id=(select auth.uid()) and private.owns_room(room_id));
alter policy log_moderator on public.moderation_log to authenticated using ((select private.actor_role())='moderator');

-- These RPCs intentionally implement narrow operations that direct table grants forbid.
-- Each checks the caller identity, active role/ownership, or both; anonymous execution is revoked.
comment on function public.save_study_progress(jsonb) is 'Intentional authenticated RPC: saves only the active caller own progress.';
comment on function public.request_room_access(text) is 'Intentional authenticated RPC: an active student can request, but cannot approve, membership.';
comment on function public.review_room_member(uuid,uuid,boolean) is 'Intentional authenticated RPC: only the active owning teacher can decide class admission.';
comment on function public.leave_room(uuid) is 'Intentional authenticated RPC: deletes only the caller own membership.';
comment on function public.class_progress(uuid) is 'Intentional authenticated RPC: only the active owning teacher receives aggregate counts, never notes.';
comment on function public.moderate_account(uuid,text) is 'Intentional authenticated RPC: only an active moderator can manage non-moderator accounts; audited.';
comment on function public.moderate_material(uuid,boolean) is 'Intentional authenticated RPC: only an active moderator can hide or restore class materials; audited.';
commit;
