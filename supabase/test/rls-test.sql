-- Behaviour tests for schema.sql. Run as: psql -U authenticator -f rls-test.sql (after setup as postgres).
\set ON_ERROR_STOP 1
\set stu  '''11111111-1111-1111-1111-111111111111'''
\set stu2 '''22222222-2222-2222-2222-222222222222'''
\set co   '''33333333-3333-3333-3333-333333333333'''
\set adm  '''44444444-4444-4444-4444-444444444444'''
create or replace function pg_temp.expect_error(sql text, pattern text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then
    if sqlerrm !~* pattern then raise exception 'wrong error for %: %', sql, sqlerrm; end if;
    raise notice 'ok (blocked): %', left(sqlerrm, 90); return;
  end;
  raise exception 'expected failure but succeeded: %', sql;
end $$;
create or replace function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin if not coalesce(ok,false) then raise exception 'FAILED: %', label; end if; raise notice 'ok: %', label; end $$;

-- ---------- student ----------
set role authenticated; select set_config('request.jwt.claim.sub', :stu, false), set_config('request.jwt.claim.role','authenticated',false);
update profiles set role = 'admin', is_meow_pool_top50 = true, full_name = 'Aye Student', open_to_offers = false where id = :stu;
select pg_temp.check((select role = 'student' and not is_meow_pool_top50 and full_name = 'Aye Student' from profiles where id = :stu), 'student cannot self-promote or join pool');
select pg_temp.check((select count(*) = 1 from profiles), 'student sees only own profile');
select pg_temp.expect_error($$insert into companies (owner_id, name) values ('11111111-1111-1111-1111-111111111111','Fake Co')$$, 'company accounts');
select pg_temp.expect_error($$select * from browse_open_students()$$, 'Only company');
select pg_temp.expect_error($$select * from hm_run_ghosting_check(5)$$, 'Admins only');
select pg_temp.expect_error($$insert into video_pitches (student_id, storage_path, duration_seconds) values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222/x.webm', 30)$$, 'video_path_owner|row-level');
insert into video_pitches (id, student_id, storage_path, duration_seconds) values ('55555555-5555-5555-5555-555555555555', :stu, '11111111-1111-1111-1111-111111111111/pitch.webm', 58);
select pg_temp.expect_error($$insert into video_pitches (student_id, storage_path, duration_seconds) values ('11111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111/long.webm', 90)$$, 'duration');
insert into storage.objects (bucket_id, name) values ('pitch-videos', '11111111-1111-1111-1111-111111111111/pitch.webm');
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name) values ('pitch-videos', '22222222-2222-2222-2222-222222222222/evil.webm')$$, 'row-level');
update profiles set pitch_video_id = '55555555-5555-5555-5555-555555555555' where id = :stu;

-- ---------- company ----------
select set_config('request.jwt.claim.sub', :co, false);
insert into companies (id, owner_id, name, response_rate, company_health) values ('66666666-6666-6666-6666-666666666666', :co, 'Siam Pixel Studio', 5, 'red');
select pg_temp.check((select response_rate = 100 and company_health = 'green' from companies where id = '66666666-6666-6666-6666-666666666666'), 'owner cannot fake health/response rate');
update companies set response_rate = 1, name = 'Siam Pixel Studio Co.' where id = '66666666-6666-6666-6666-666666666666';
select pg_temp.check((select response_rate = 100 and name like '%Co.' from companies), 'owner edits name only');
insert into jobs (id, company_id, title, status) values ('77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', 'Junior Designer', 'draft');
select pg_temp.expect_error($$update jobs set status = 'published' where id = '77777777-7777-7777-7777-777777777777'$$, 'Hiding Treats');
select pg_temp.expect_error($$insert into jobs (company_id, title, status, salary_min) values ('66666666-6666-6666-6666-666666666666', 'No max', 'published', 20000)$$, 'Hiding Treats');
update jobs set salary_min = 25000, salary_max = 32000, bts_station = 'Ari', status = 'published' where id = '77777777-7777-7777-7777-777777777777';
select pg_temp.check((select published_at is not null from jobs where id = '77777777-7777-7777-7777-777777777777'), 'publish with salary works');
select pg_temp.check((select count(*) = 0 from browse_open_students()), 'no open students yet');
select pg_temp.expect_error($$insert into offers (company_id, student_id, title, salary_min, salary_max) values ('66666666-6666-6666-6666-666666666666','11111111-1111-1111-1111-111111111111','Designer',20000,30000)$$, 'not open to offers');
select pg_temp.check(not hm_can_view_pitch('11111111-1111-1111-1111-111111111111/pitch.webm'), 'company cannot view pitch of closed student');
select pg_temp.check((select count(*) = 0 from storage.objects), 'company cannot list closed student video');

-- ---------- anonymous ----------
set role anon; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claim.role','anon',false);
select pg_temp.check((select count(*) = 1 from jobs), 'anon sees published job');
select pg_temp.check((select count(*) = 0 from profiles), 'anon sees no profiles');
update jobs set title = 'hacked';
select pg_temp.check((select title <> 'hacked' from jobs), 'anon cannot edit jobs');
select pg_temp.check(not hm_is_privileged(), 'anon is not privileged');

-- ---------- student applies, opens to offers ----------
set role authenticated; select set_config('request.jwt.claim.sub', :stu, false), set_config('request.jwt.claim.role','authenticated',false);
insert into applications (id, job_id, student_id, status, ghosting_last_reply_at) values ('88888888-8888-8888-8888-888888888888','77777777-7777-7777-7777-777777777777', :stu, 'offer', now());
select pg_temp.check((select status = 'applied' and ghosting_last_reply_at is null from applications), 'student cannot pre-set status');
select pg_temp.expect_error($$update applications set status = 'shortlisted'$$, 'only withdraw');
update profiles set open_to_offers = true, skills = '{Figma,Canva}', meow_score = 81 where id = :stu;

-- ---------- company replies & sends offer ----------
select set_config('request.jwt.claim.sub', :co, false);
update applications set status = 'viewed', cover_note = 'tampered' where id = '88888888-8888-8888-8888-888888888888';
select pg_temp.check((select ghosting_last_reply_at is not null and cover_note is null from applications), 'company reply stamps ghosting_last_reply_at');
select pg_temp.check((select count(*) = 2 from application_events), 'timeline events logged');
select pg_temp.check((select full_name = 'Aye Student' from profiles where id = :stu), 'company reads applicant profile');
select pg_temp.check((select count(*) = 1 from browse_open_students(null, 'figma')), 'company finds open student by skill');
select pg_temp.check(hm_can_view_pitch('11111111-1111-1111-1111-111111111111/pitch.webm'), 'company can view pitch now');
insert into offers (id, company_id, student_id, title, salary_min, salary_max, status) values ('99999999-9999-9999-9999-999999999999','66666666-6666-6666-6666-666666666666', :stu, 'UX Designer', 28000, 35000, 'accepted');
select pg_temp.check((select status = 'pending' from offers), 'company cannot pre-accept offer');
select pg_temp.expect_error($$update offers set status = 'accepted'$$, 'Not allowed');
select pg_temp.check((select count(*) = 0 from get_meow_pool()), 'pool empty');

-- ---------- student answers offer ----------
select set_config('request.jwt.claim.sub', :stu, false);
update offers set status = 'accepted', salary_max = 99999 where id = '99999999-9999-9999-9999-999999999999';
select pg_temp.check((select status = 'accepted' and salary_max = 35000 and responded_at is not null from offers), 'student accepts; salary unchanged');
select pg_temp.expect_error($$update offers set status = 'declined'$$, 'already answered');

-- ---------- other student ----------
select set_config('request.jwt.claim.sub', :stu2, false);
select pg_temp.check((select count(*) = 0 from offers) and (select count(*) = 0 from applications), 'other student sees nothing');
select pg_temp.check(not hm_can_view_pitch('11111111-1111-1111-1111-111111111111/pitch.webm'), 'other student cannot view pitch');

-- ---------- admin: Meow Pool ----------
select set_config('request.jwt.claim.sub', :adm, false);
update profiles set is_meow_pool_top50 = true where id = :stu;
select pg_temp.check((select count(*) = 1 from meow_pool), 'admin toggle adds pool row');
select pg_temp.check((select meow_pool_month is not null from profiles where id = :stu), 'pool month stamped');

select set_config('request.jwt.claim.sub', :co, false);
select pg_temp.check((select not unlocked and student_id is null and pitch_path is null and display_name = 'Aye •' from get_meow_pool()), 'unpaid company sees teaser');
select pg_temp.check((select count(*) = 0 from meow_pool_access), 'no access yet');

reset role;
