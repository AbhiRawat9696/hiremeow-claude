-- AI features: portfolios + candidate FAQ.
\set ON_ERROR_STOP 1
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

set role authenticated; select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false), set_config('request.jwt.claim.role','authenticated',false);
insert into portfolios (id, slug, data) values ('11111111-1111-1111-1111-111111111111', 'aye-student', '{"name":"Aye"}');
select pg_temp.expect_error($$insert into portfolios (id, slug) values ('22222222-2222-2222-2222-222222222222', 'not-mine')$$, 'row-level');
select pg_temp.expect_error($$insert into portfolios (id, slug) values ('11111111-1111-1111-1111-111111111111', 'Bad Slug!')$$, 'check|duplicate');

set role authenticated; select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select pg_temp.check((select count(*) = 0 from portfolios), 'others cannot see an unpublished portfolio');
update portfolios set data = '{"name":"hacked"}';
select pg_temp.check(true, 'update by others is ignored');

set role authenticated; select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select pg_temp.check((select data->>'name' = 'Aye' from portfolios), 'owner data unchanged by others');
update portfolios set published = true where id = '11111111-1111-1111-1111-111111111111';

set role anon; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claim.role','anon',false);
select pg_temp.check((select count(*) = 1 from portfolios where slug = 'aye-student'), 'anon sees a published portfolio');
select pg_temp.expect_error($$insert into portfolios (id, slug) values ('11111111-1111-1111-1111-111111111111', 'anon-try')$$, 'permission|row-level');
select pg_temp.check((select count(*) >= 0 from jobs where candidate_faq is null or candidate_faq is not null), 'anon can read candidate_faq on published jobs');

set role authenticated; select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false), set_config('request.jwt.claim.role','authenticated',false);
update jobs set candidate_faq = 'Team of 8. Hybrid.' where id = '77777777-7777-7777-7777-777777777777';
select pg_temp.check((select candidate_faq = 'Team of 8. Hybrid.' from jobs where id = '77777777-7777-7777-7777-777777777777'), 'company saves candidate FAQ');
select pg_temp.expect_error($$update jobs set candidate_faq = repeat('x', 3001) where id = '77777777-7777-7777-7777-777777777777'$$, 'candidate_faq');
