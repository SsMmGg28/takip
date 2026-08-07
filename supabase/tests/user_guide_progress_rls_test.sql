begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'guide-user-1@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'guide-user-2@test.local');

insert into public.profiles (id, role, username, full_name, must_change_password)
values
  ('11111111-1111-4111-8111-111111111111', 'student', 'guide.user1', 'Guide User 1', false),
  ('22222222-2222-4222-8222-222222222222', 'parent', 'guide.user2', 'Guide User 2', false);

insert into public.user_guide_progress (user_id, guide_id, version, outcome)
values
  ('11111111-1111-4111-8111-111111111111', 'student-quick-start', 1, 'completed'),
  ('22222222-2222-4222-8222-222222222222', 'parent-quick-start', 1, 'skipped');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select results_eq(
  $$select guide_id from public.user_guide_progress order by guide_id$$,
  array['student-quick-start'::text],
  'kullanici yalniz kendi rehber kaydini okur'
);

select lives_ok(
  $$insert into public.user_guide_progress (user_id, guide_id, version, outcome)
    values ('11111111-1111-4111-8111-111111111111', 'student-homework', 1, 'completed')$$,
  'kullanici kendi rehber kaydini ekleyebilir'
);

select throws_like(
  $$insert into public.user_guide_progress (user_id, guide_id, version, outcome)
    values ('22222222-2222-4222-8222-222222222222', 'foreign-guide', 1, 'completed')$$,
  '%row-level security%',
  'kullanici baskasi adina rehber kaydi ekleyemez'
);

select results_eq(
  $$update public.user_guide_progress
    set outcome = 'completed'
    where user_id = '22222222-2222-4222-8222-222222222222'
    returning guide_id$$,
  $$select null::text where false$$,
  'kullanici baskasinin kaydini guncelleyemez'
);

select lives_ok(
  $$update public.user_guide_progress
    set outcome = 'skipped'
    where user_id = '11111111-1111-4111-8111-111111111111'
      and guide_id = 'student-quick-start'$$,
  'kullanici kendi kaydini guncelleyebilir'
);

reset role;
set local role anon;
set local request.jwt.claim.sub = '';

select throws_like(
  $$select * from public.user_guide_progress$$,
  '%permission denied%',
  'anon rolunun tabloya erisimi yoktur'
);

select * from finish();
rollback;
