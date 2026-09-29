-- Form 5 catalogue and topic headings verified against MTN Educare, 2024–2026.
begin;
alter table public.subjects add column syllabus_url text not null default '' check (syllabus_url='' or (syllabus_url ~ '^https://' and char_length(syllabus_url)<=2000));
delete from public.subjects where name='Both subjects';
insert into public.subjects(name,creator_id,syllabus_url) values
('Accounting',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%206896%20Syllabus%20-%20Accounting%202024-2026-1657608129.pdf'),
('Agriculture',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%206882%20Agriculture%20Syllabus%202024-2026-1657607348.pdf'),
('Biology',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%206884%20Syllabus%20-%20Biology%20%202024-2026-1657607367.pdf'),
('Business Studies',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%206897%20Business%20Studies%20Syllabus%202024-2026-1657608359.pdf'),
('Design and Technology',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%206902%20Syllabus%20-%20Design%20and%20Technology%202024%20-%202026-1657608411.pdf'),
('Economics',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%206899%20Economics%20%20%20Syllabus%20-%202024-2026-1657608390.pdf'),
('English Language',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%206873%20Syllabus%20-%20English%20Language%202024%20-%202026-1657607154.pdf'),
('Fashion and Fabrics',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%20Fashion%20and%20Fabrics%202024-2026%20Syllabus-1675679079.pdf'),
('Food and Nutrition',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%20Food%20and%20Nutrition%202024-2026%20Syllabus-1675679095.pdf'),
('Geography',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%206890%20Syllabus%20Geography%202024-2026-1657607489.pdf'),
('History',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%206891%20Syllabus%20History%202024%20-%202026-1657607583.pdf'),
('Literature in English',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%206875%20Syllabus%20-%20Literature%20in%20English%202024%20-%202026-1657607233.pdf'),
('Mathematics',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%206880%20Syllabus%20-%20Mathematics%202024%20-2026-1657607285.pdf'),
('Physical Science',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%206888%20Syllabus%20-%20Physical%20Science%202024-2026-1657607422.pdf'),
('Religious Education',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%20Religious%20Education%20Syllabus%202024-26-1675150671.pdf'),
('SiSwati First Language',null,'https://www.khanyisa.online/educare/syllabus/form5/EGCSE%202024-2026%20%20-%20First%20Language%20SiSwati%20Syllabus-1657289749.pdf'),
('SiSwati Second Language',null,'https://www.khanyisa.online/educare/syllabus/form5/2024%20-%202026%20SiSwati%20as%20A%20Second%20Language%20Syllabus-1657607089.pdf')
on conflict (name) do update set syllabus_url=excluded.syllabus_url;
create table public.subject_topics (
 id uuid primary key default gen_random_uuid(),
 subject_name text not null references public.subjects(name) on delete cascade,
 position integer not null check (position>0),
 title text not null check (char_length(trim(title)) between 2 and 180),
 unique(subject_name,position)
);
create index subject_topics_subject on public.subject_topics(subject_name);
alter table public.subject_topics enable row level security;
revoke all on public.subject_topics from anon,authenticated;
grant select on public.subject_topics to authenticated;
create policy subject_topics_read on public.subject_topics for select to authenticated using (private.actor_role() in ('teacher','student'));
insert into public.subject_topics(subject_name,position,title) values
('Accounting',1,'Purpose of Accounting'),
('Accounting',2,'Accounting principles and policies'),
('Accounting',3,'Accounting equation'),
('Accounting',4,'Source documents and subsidiary books'),
('Accounting',5,'Double entry'),
('Accounting',6,'Verification of accounting records'),
('Accounting',7,'Accounting procedures'),
('Accounting',8,'Financial statements'),
('Accounting',9,'Specialised accounts'),
('Accounting',10,'Interpretation of financial statements'),
('Agriculture',1,'General agriculture'),
('Agriculture',2,'Agricultural economics'),
('Agriculture',3,'Environmental issues'),
('Agriculture',4,'Crop husbandry'),
('Agriculture',5,'Livestock husbandry'),
('Agriculture',6,'Agricultural engineering'),
('Biology',1,'Characteristics and classification of living organisms'),
('Biology',2,'Organisation and maintenance of the organism'),
('Biology',3,'Development of the organism and continuity of life'),
('Biology',4,'Biodiversity and ecosystems'),
('Business Studies',1,'Understanding business activity'),
('Business Studies',2,'Types of business organisations'),
('Business Studies',3,'Marketing strategy'),
('Business Studies',4,'Human resource management'),
('Business Studies',5,'Operations management'),
('Business Studies',6,'Finance and accounting'),
('Business Studies',7,'External environment and its influence on business'),
('Design and Technology',1,'Design'),
('Design and Technology',2,'Making'),
('Design and Technology',3,'Communication'),
('Design and Technology',4,'Knowledge'),
('Design and Technology',5,'Practical applications'),
('Design and Technology',6,'Geometrical construction'),
('Design and Technology',7,'Communication skills'),
('Economics',1,'Basic economic problem'),
('Economics',2,'Allocation of resources'),
('Economics',3,'Individual as producer, consumer and borrower'),
('Economics',4,'Private firm as producer and employer'),
('Economics',5,'Role of government'),
('Economics',6,'Economic indicators'),
('Economics',7,'Developed and developing economies'),
('Economics',8,'International aspects'),
('English Language',1,'Reading'),
('English Language',2,'Writing'),
('English Language',3,'Listening'),
('English Language',4,'Speaking'),
('Fashion and Fabrics',1,'Sewing equipment and notions'),
('Fashion and Fabrics',2,'Fibres, yarns and fabrics'),
('Fashion and Fabrics',3,'Choice of clothing'),
('Fashion and Fabrics',4,'Care of clothing'),
('Fashion and Fabrics',5,'Wardrobe planning'),
('Fashion and Fabrics',6,'Patterns for garment making'),
('Fashion and Fabrics',7,'Decoration of garments'),
('Fashion and Fabrics',8,'Sewing processes'),
('Food and Nutrition',1,'Basic nutrition and concepts'),
('Food and Nutrition',2,'Diet and health'),
('Food and Nutrition',3,'Meal and menu planning'),
('Food and Nutrition',4,'Kitchen planning'),
('Food and Nutrition',5,'Kitchen equipment'),
('Food and Nutrition',6,'Kitchen hygiene and safety'),
('Food and Nutrition',7,'Principles of cooking food'),
('Food and Nutrition',8,'Food spoilage and preservation'),
('Food and Nutrition',9,'Food items'),
('Food and Nutrition',10,'Raising agents'),
('Food and Nutrition',11,'Flour mixtures'),
('Geography',1,'Map reading and information handling'),
('Geography',2,'The physical world'),
('Geography',3,'Economic development and resource management'),
('Geography',4,'Population and settlement'),
('History',1,'International relations, 1919 to 1989'),
('History',2,'Depth studies'),
('History',3,'The Kingdom of Eswatini, 1945 to 2015'),
('History',4,'Ending of minority rule in South Africa'),
('Literature in English',1,'Drama'),
('Literature in English',2,'Poetry'),
('Literature in English',3,'Prose'),
('Religious Education',1,'Life and ministry of Jesus in Luke'),
('Religious Education',2,'Acts of the Apostles'),
('SiSwati First Language',1,'Composition'),
('SiSwati First Language',2,'Reading and directed writing'),
('SiSwati First Language',3,'Grammar'),
('SiSwati First Language',4,'Poetry'),
('SiSwati First Language',5,'Short stories'),
('SiSwati First Language',6,'Drama'),
('SiSwati First Language',7,'Novel'),
('SiSwati First Language',8,'Culture'),
('SiSwati Second Language',1,'Reading'),
('SiSwati Second Language',2,'Writing'),
('SiSwati Second Language',3,'Listening'),
('SiSwati Second Language',4,'Speaking'),
('Mathematics',1,'Numbers, sequences & sets'),
('Mathematics',2,'Place value, estimation & accuracy'),
('Mathematics',3,'Operations with fractions & decimals'),
('Mathematics',4,'Percentages'),
('Mathematics',5,'Money & household finance'),
('Mathematics',6,'Ratio & proportion'),
('Mathematics',7,'Indices'),
('Mathematics',8,'Standard form'),
('Mathematics',9,'Shapes, angles & similarity'),
('Mathematics',10,'Geometrical constructions'),
('Mathematics',11,'Transformations'),
('Mathematics',12,'Measurement & mensuration'),
('Mathematics',13,'Trigonometry'),
('Mathematics',14,'Bearings'),
('Mathematics',15,'Graphs in practical situations'),
('Mathematics',16,'Vectors'),
('Mathematics',17,'Algebra & formulae'),
('Mathematics',18,'Coordinates, graphs & functions'),
('Mathematics',19,'Differentiation'),
('Mathematics',20,'Equations & inequalities'),
('Mathematics',21,'Matrices'),
('Mathematics',22,'Inequality regions & linear programming'),
('Mathematics',23,'Statistics'),
('Mathematics',24,'Probability'),
('Physical Science',1,'Measuring in chemistry'),
('Physical Science',2,'Particles & states of matter'),
('Physical Science',3,'Elements, compounds & mixtures'),
('Physical Science',4,'Separation & purity'),
('Physical Science',5,'Physical & chemical changes'),
('Physical Science',6,'The periodic table'),
('Physical Science',7,'Atoms, ions & bonding'),
('Physical Science',8,'Formulae, equations & moles'),
('Physical Science',9,'Reactions, energy & rates'),
('Physical Science',10,'Acids, bases & salts'),
('Physical Science',11,'Metals & reactivity'),
('Physical Science',12,'Electrolysis'),
('Physical Science',13,'Non-metals, air & water'),
('Physical Science',14,'Organic chemistry'),
('Physical Science',15,'Measurements, units & density'),
('Physical Science',16,'Motion'),
('Physical Science',17,'Mass, force & moments'),
('Physical Science',18,'Work, energy & power'),
('Physical Science',19,'Waves, light & sound'),
('Physical Science',20,'Thermal physics'),
('Physical Science',21,'Electrostatics'),
('Physical Science',22,'Current, voltage & resistance'),
('Physical Science',23,'Electric circuits'),
('Physical Science',24,'Practical electricity'),
('Physical Science',25,'Magnetism'),
('Physical Science',26,'Digital electronics'),
('Physical Science',27,'Electromagnetic effects'),
('Physical Science',28,'Atomic physics & radioactivity'),
('Physical Science',29,'LEDs & flat-screen monitors');
insert into public.teacher_subjects(owner_id,name,syllabus_url)
select distinct r.owner_id,r.subject,s.syllabus_url from public.study_rooms r
join public.subjects s on s.name=r.subject
on conflict(owner_id,name) do nothing;
drop policy teacher_subjects_create on public.teacher_subjects;
create policy teacher_subjects_create on public.teacher_subjects for insert to authenticated
with check (owner_id=(select auth.uid()) and private.actor_role()='teacher'
and exists(select 1 from public.subjects s where s.name=name and s.syllabus_url=syllabus_url));
alter table public.class_lessons add column topic_id uuid references public.subject_topics(id);
create index class_lessons_topic on public.class_lessons(topic_id);
grant insert(topic_id) on public.class_lessons to authenticated;
grant update(topic_id) on public.class_lessons to authenticated;
drop policy class_lessons_create on public.class_lessons;
create policy class_lessons_create on public.class_lessons for insert to authenticated
with check (private.owns_room(room_id) and owner_id=(select auth.uid())
and exists(select 1 from public.study_rooms r where r.id=room_id and not r.archived)
and (topic_id is null or exists(select 1 from public.subject_topics t join public.study_rooms r on r.id=room_id where t.id=topic_id and t.subject_name=r.subject)));
drop policy class_lessons_edit on public.class_lessons;
create policy class_lessons_edit on public.class_lessons for update to authenticated
using (owner_id=(select auth.uid()) and private.owns_room(room_id))
with check (owner_id=(select auth.uid()) and private.owns_room(room_id)
and (topic_id is null or exists(select 1 from public.subject_topics t join public.study_rooms r on r.id=room_id where t.id=topic_id and t.subject_name=r.subject)));
commit;
