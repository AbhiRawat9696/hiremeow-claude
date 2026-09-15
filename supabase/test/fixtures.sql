insert into auth.users (id,email,raw_user_meta_data) values
 ('11111111-1111-1111-1111-111111111111','aye@test','{"full_name":"Aye"}'),
 ('22222222-2222-2222-2222-222222222222','li@test','{}'),
 ('33333333-3333-3333-3333-333333333333','boss@siampixel.test','{"role":"company"}'),
 ('44444444-4444-4444-4444-444444444444','admin@test','{"role":"admin"}');
update public.profiles set role='admin' where id='44444444-4444-4444-4444-444444444444';
