-- Keep syllabus headings ready while the moderator chooses what appears globally.
update public.subjects set available=false where creator_id is null and name not in ('Mathematics','Physical Science');
