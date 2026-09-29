-- Applied to the existing project on 2026-09-29. Preserve current users and classes.
begin;
-- Subject names are shared; lesson content belongs to a teacher's class.
create table public.subjects (
 name text primary key check (char_length(trim(name)) between 2 and 100 and name = trim(name)),
 creator_id uuid references public.profiles(id) on delete set null default auth.uid(),
 created_at timestamptz not null default now()
);
insert into public.subjects(name,creator_id) values ('Mathematics',null),('Physical Science',null),('Both subjects',null);
alter table public.subjects enable row level security;
revoke all on public.subjects from anon,authenticated;
grant select,insert(name,creator_id) on public.subjects to authenticated;
create policy subjects_read on public.subjects for select to authenticated using (private.actor_role() in ('student','teacher','moderator'));
create policy subjects_create on public.subjects for insert to authenticated with check (creator_id=(select auth.uid()) and private.actor_role() in ('teacher','moderator'));
alter table public.study_rooms drop constraint study_rooms_subject_check;
alter table public.study_rooms add constraint study_rooms_subject_fkey foreign key (subject) references public.subjects(name);

-- Moderators manage people and subject names, not lessons, materials or class membership.
create or replace function private.can_read_room(rid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select private.owns_room(rid) or (
 private.actor_role() = 'student' and exists(select 1 from public.room_members m join public.study_rooms r on r.id=m.room_id
 join public.profiles p on p.id=r.owner_id where r.id=rid and m.user_id=auth.uid() and m.status='active'
 and not r.archived and p.role='teacher' and p.status='active'));
$$;
drop policy if exists members_read on public.room_members;
create policy members_read on public.room_members for select to authenticated using ((user_id=(select auth.uid()) and private.actor_role()='student') or private.owns_room(room_id));
drop policy if exists materials_read on public.room_materials;
create policy materials_read on public.room_materials for select to authenticated using (private.can_read_room(room_id) and (not hidden or private.owns_room(room_id)));
revoke execute on function public.moderate_material(uuid,boolean) from authenticated;

create table public.class_lessons (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references public.study_rooms(id) on delete cascade,
 owner_id uuid not null default auth.uid() references public.profiles(id),
 title text not null check (char_length(trim(title)) between 2 and 180),
 overview text not null default '' check (char_length(overview)<=10000),
 steps text not null default '' check (char_length(steps)<=12000),
 worked_example text not null default '' check (char_length(worked_example)<=12000),
 practice_question text not null default '' check (char_length(practice_question)<=3000),
 practice_answer text not null default '' check (char_length(practice_answer)<=6000),
 resource_url text not null default '' check (resource_url='' or (resource_url ~ '^https://' and char_length(resource_url)<=2000)),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index class_lessons_room_created on public.class_lessons(room_id,created_at desc);
alter table public.class_lessons enable row level security;
revoke all on public.class_lessons from anon,authenticated;
grant select on public.class_lessons to authenticated;
grant insert(room_id,title,overview,steps,worked_example,practice_question,practice_answer,resource_url) on public.class_lessons to authenticated;
grant update(title,overview,steps,worked_example,practice_question,practice_answer,resource_url,updated_at) on public.class_lessons to authenticated;
grant delete on public.class_lessons to authenticated;
create policy class_lessons_read on public.class_lessons for select to authenticated using (private.can_read_room(room_id));
create policy class_lessons_create on public.class_lessons for insert to authenticated with check (private.owns_room(room_id) and owner_id=(select auth.uid()) and exists(select 1 from public.study_rooms where id=room_id and not archived));
create policy class_lessons_edit on public.class_lessons for update to authenticated using (owner_id=(select auth.uid()) and private.owns_room(room_id)) with check (owner_id=(select auth.uid()) and private.owns_room(room_id));
create policy class_lessons_delete on public.class_lessons for delete to authenticated using (owner_id=(select auth.uid()) and private.owns_room(room_id));

create table public.study_groups (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references public.study_rooms(id) on delete cascade,
 creator_id uuid not null references public.profiles(id),
 title text not null check (char_length(trim(title)) between 2 and 100),
 join_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
 created_at timestamptz not null default now()
);
create index study_groups_room on public.study_groups(room_id);
create table public.study_group_members (
 group_id uuid not null references public.study_groups(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(group_id,user_id)
);
create index study_group_members_user on public.study_group_members(user_id);
create table public.study_group_posts (
 id bigint generated always as identity primary key,
 group_id uuid not null references public.study_groups(id) on delete cascade,
 author_id uuid not null default auth.uid() references public.profiles(id),
 body text not null check (char_length(trim(body)) between 1 and 5000),
 created_at timestamptz not null default now()
);
create index study_group_posts_group on public.study_group_posts(group_id,created_at);
create function private.can_join_study_group(rid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select private.actor_role()='student' and exists(select 1 from public.room_members m where m.room_id=rid and m.user_id=auth.uid() and m.status='active')
 and exists(select 1 from public.study_rooms r join public.profiles p on p.id=r.owner_id where r.id=rid and not r.archived and p.role='teacher' and p.status='active');
$$;
create function private.is_study_group_member(gid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.study_group_members m join public.study_groups g on g.id=m.group_id where m.group_id=gid and m.user_id=auth.uid() and private.can_join_study_group(g.room_id));
$$;
revoke all on function private.can_join_study_group(uuid),private.is_study_group_member(uuid) from public,anon,authenticated;
grant execute on function private.can_join_study_group(uuid),private.is_study_group_member(uuid) to authenticated;
alter table public.study_groups enable row level security;
alter table public.study_group_members enable row level security;
alter table public.study_group_posts enable row level security;
revoke all on public.study_groups,public.study_group_members,public.study_group_posts from anon,authenticated;
grant select on public.study_groups,public.study_group_members,public.study_group_posts to authenticated;
grant insert(group_id,body) on public.study_group_posts to authenticated;
create policy study_groups_read on public.study_groups for select to authenticated using (private.is_study_group_member(id));
create policy study_group_members_read on public.study_group_members for select to authenticated using (private.is_study_group_member(group_id));
create policy study_group_posts_read on public.study_group_posts for select to authenticated using (private.is_study_group_member(group_id));
create policy study_group_posts_create on public.study_group_posts for insert to authenticated with check (author_id=(select auth.uid()) and private.is_study_group_member(group_id));
create function public.create_study_group(rid uuid,group_title text) returns text language plpgsql security definer set search_path = '' as $$
declare gid uuid; code text;
begin
 if private.can_join_study_group(rid) is not true then raise exception 'Join this class before creating a group' using errcode='42501'; end if;
 insert into public.study_groups(room_id,creator_id,title) values(rid,auth.uid(),trim(group_title)) returning id,join_code into gid,code;
 insert into public.study_group_members(group_id,user_id) values(gid,auth.uid());
 return code;
end; $$;
create function public.join_study_group(code text) returns void language plpgsql security definer set search_path = '' as $$
declare g public.study_groups;
begin
 select * into g from public.study_groups where join_code=upper(trim(code));
 if g.id is null or private.can_join_study_group(g.room_id) is not true then raise exception 'Check the group code and your class membership' using errcode='42501'; end if;
 insert into public.study_group_members(group_id,user_id) values(g.id,auth.uid()) on conflict do nothing;
end; $$;
create function public.group_discussion(gid uuid) returns table(id bigint,author_id uuid,display_name text,body text,created_at timestamptz) language plpgsql stable security definer set search_path = '' as $$
begin
 if private.is_study_group_member(gid) is not true then raise exception 'Group membership required' using errcode='42501'; end if;
 return query select post.id,post.author_id,p.display_name,post.body,post.created_at from public.study_group_posts post join public.profiles p on p.id=post.author_id where post.group_id=gid order by post.created_at desc limit 100;
end; $$;
revoke all on function public.create_study_group(uuid,text),public.join_study_group(text),public.group_discussion(uuid) from public,anon,authenticated;
grant execute on function public.create_study_group(uuid,text),public.join_study_group(text),public.group_discussion(uuid) to authenticated;
grant delete on public.room_materials to authenticated;
create policy materials_delete on public.room_materials for delete to authenticated using (owner_id=(select auth.uid()) and private.owns_room(room_id));
commit;
