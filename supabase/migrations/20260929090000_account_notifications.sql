-- Account decision notices; applied to production on 2026-09-29.
begin;
create table public.account_notifications (
 id bigint generated always as identity primary key,
 user_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null check (kind in ('teacher_approved','teacher_declined','account_suspended','account_restored')),
 message text not null,
 created_at timestamptz not null default now(),
 read_at timestamptz
);
create index account_notifications_user_unread on public.account_notifications(user_id, created_at desc) where read_at is null;
alter table public.account_notifications enable row level security;
revoke all on public.account_notifications from anon, authenticated;
grant select on public.account_notifications to authenticated;
grant update(read_at) on public.account_notifications to authenticated;
create policy account_notifications_read on public.account_notifications for select to authenticated using (user_id = (select auth.uid()));
create policy account_notifications_acknowledge on public.account_notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create or replace function public.moderate_account(target uuid, decision text) returns void language plpgsql security definer set search_path = '' as $$
declare p public.profiles; notice_kind text; notice_message text;
begin
 if private.actor_role() is distinct from 'moderator' then raise exception 'Moderator access required' using errcode='42501'; end if;
 select * into p from public.profiles where id=target for update;
 if p.id is null or p.role='moderator' or target=auth.uid() then raise exception 'This account must be managed by the project owner'; end if;
 if decision='approve_teacher' and p.requested_role='teacher' and p.status='pending' then
  update public.profiles set role='teacher',status='active' where id=target;
  notice_kind := 'teacher_approved'; notice_message := 'Your teacher access has been approved. You can now open your teaching classes.';
 elsif decision='decline_teacher' and p.requested_role='teacher' and p.status='pending' then
  update public.profiles set role='student',requested_role='student',status='active' where id=target;
  notice_kind := 'teacher_declined'; notice_message := 'Your teacher request was not approved. You can continue with a student account.';
 elsif decision='suspend' and p.status='active' then
  update public.profiles set status='suspended' where id=target;
  notice_kind := 'account_suspended'; notice_message := 'Your account has been suspended. Contact the study room moderator for help.';
 elsif decision='restore' and p.status='suspended' then
  update public.profiles set status='active' where id=target;
  notice_kind := 'account_restored'; notice_message := 'Your account access has been restored. You can use the study room again.';
 else raise exception 'Invalid account decision'; end if;
 insert into public.moderation_log(actor_id,action,target_id) values(auth.uid(),decision,target);
 insert into public.account_notifications(user_id,kind,message) values(target,notice_kind,notice_message);
end; $$;
commit;
