\set ON_ERROR_STOP 1
create or replace function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin if not coalesce(ok,false) then raise exception 'FAILED: %', label; end if; raise notice 'ok: %', label; end $$;
-- service role (Stripe webhook / cron)
set role service_role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claim.role','service_role',false);
update companies set contact_email = 'hr@siampixel.test';
insert into meow_pool_access (company_id, month, stripe_session_id, amount_thb) values ('66666666-6666-6666-6666-666666666666', hm_month(), 'cs_test_1', 3000);
update applications set created_at = now() - interval '12 days', ghosting_last_reply_at = null;
insert into applications (job_id, student_id) values ('77777777-7777-7777-7777-777777777777','22222222-2222-2222-2222-222222222222');
update applications set created_at = now() - interval '8 days' where student_id = '22222222-2222-2222-2222-222222222222';
select pg_temp.check((select count(*) = 2 from hm_run_ghosting_check(5)), 'ghosting check nudges 2 silent applications');
select pg_temp.check((select count(*) = 2 from email_outbox where kind = 'ghosting_nudge' and to_email = 'hr@siampixel.test'), 'mock emails queued to company');
select pg_temp.check((select count(*) = 0 from hm_run_ghosting_check(5)), 'no double nudge within 5 days');
select pg_temp.check((select response_rate = 0 from companies), 'response rate drops to 0% when ghosting');
reset role;
set role authenticated; select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false), set_config('request.jwt.claim.role','authenticated',false);
select pg_temp.check((select unlocked and student_id is not null and pitch_path is not null from get_meow_pool()), 'paid company sees full pool card');
update applications set status = 'interview' where student_id = '22222222-2222-2222-2222-222222222222';
reset role;
set role service_role; select set_config('request.jwt.claim.role','service_role',false), set_config('request.jwt.claim.sub', '', false);
select hm_recompute_response_rates(5);
select pg_temp.check((select response_rate = 0 from companies), 'late reply (after 5 days) does not count as on-time');
reset role;
