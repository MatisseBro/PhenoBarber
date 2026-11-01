\set ON_ERROR_STOP on

begin;

create function pg_temp.assert_true(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if condition is not true then
    raise exception 'ASSERTION FAILED: %', message;
  end if;
end;
$$;

-- Objects, types, RLS and privileges expected after migrations 003 and 004.
select pg_temp.assert_true(
  exists (select 1 from pg_extension where extname = 'btree_gist'),
  'btree_gist extension is missing'
);

select pg_temp.assert_true(
  (select data_type = 'date' from information_schema.columns
   where table_schema = 'public' and table_name = 'rdv_bookings' and column_name = 'date'),
  'rdv_bookings.date is not a date'
);
select pg_temp.assert_true(
  (select data_type = 'date' from information_schema.columns
   where table_schema = 'public' and table_name = 'reservations' and column_name = 'date_debut'),
  'reservations.date_debut is not a date'
);
select pg_temp.assert_true(
  (select data_type = 'date' from information_schema.columns
   where table_schema = 'public' and table_name = 'schedule_closures' and column_name = 'date'),
  'schedule_closures.date is not a date'
);
select pg_temp.assert_true(
  (select count(*) = 2 from information_schema.columns
   where table_schema = 'public' and table_name = 'rdv_bookings'
     and column_name in ('slot_start_minutes', 'slot_end_minutes')
     and is_generated = 'ALWAYS'),
  'generated slot minute columns are missing'
);

select pg_temp.assert_true(
  (select count(*) = 5 from pg_constraint
   where conrelid = 'public.rdv_bookings'::regclass
     and conname in (
       'rdv_bookings_no_overlap',
       'rdv_bookings_duration_valid',
       'rdv_bookings_slot_valid',
       'rdv_bookings_pkey',
       'rdv_bookings_categorie_check'
     )),
  'one or more rdv_bookings constraints are missing'
);
select pg_temp.assert_true(
  (select contype = 'x' from pg_constraint
   where conrelid = 'public.rdv_bookings'::regclass
     and conname = 'rdv_bookings_no_overlap'),
  'rdv_bookings_no_overlap is not an exclusion constraint'
);

select pg_temp.assert_true(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.client_tokens'::regclass, 'public.api_rate_limits'::regclass)),
  'RLS is not enabled on both private tables'
);
select pg_temp.assert_true(
  not has_table_privilege('anon', 'public.client_tokens', 'SELECT')
  and not has_table_privilege('authenticated', 'public.client_tokens', 'SELECT')
  and not has_table_privilege('anon', 'public.api_rate_limits', 'SELECT')
  and not has_table_privilege('authenticated', 'public.api_rate_limits', 'SELECT'),
  'browser roles have a table privilege on private state'
);

select pg_temp.assert_true(
  not has_function_privilege('public', 'public.issue_client_token(text,text,timestamp with time zone)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.issue_client_token(text,text,timestamp with time zone)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.issue_client_token(text,text,timestamp with time zone)', 'EXECUTE'),
  'issue_client_token grants are incorrect'
);
select pg_temp.assert_true(
  not has_function_privilege('anon', 'public.consume_client_token(text)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.consume_client_token(text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.upsert_client_activity(text,text,text,text,text,boolean)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.upsert_client_activity(text,text,text,text,text,boolean)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.search_clients_admin(text,text,text,integer,integer)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.search_clients_admin(text,text,text,integer,integer)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.check_rate_limit(text,integer,integer)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.check_rate_limit(text,integer,integer)', 'EXECUTE'),
  'one or more RPC grants are incorrect'
);
select pg_temp.assert_true(
  (select bool_and(prosecdef and proconfig @> array['search_path=public, pg_temp'])
   from pg_proc
   where oid in (
     'public.issue_client_token(text,text,timestamp with time zone)'::regprocedure,
     'public.consume_client_token(text)'::regprocedure,
     'public.upsert_client_activity(text,text,text,text,text,boolean)'::regprocedure,
     'public.search_clients_admin(text,text,text,integer,integer)'::regprocedure,
     'public.check_rate_limit(text,integer,integer)'::regprocedure
   )),
  'an RPC is not SECURITY DEFINER with the pinned search_path'
);

-- Client token lifecycle: input validation, replacement and one-time consumption.
do $$
begin
  begin
    perform public.issue_client_token('token@example.test', 'short', now() + interval '10 minutes');
    raise exception 'expected invalid token hash rejection';
  exception when raise_exception then
    if sqlerrm = 'expected invalid token hash rejection' then raise; end if;
  end;
  begin
    perform public.issue_client_token('token@example.test', repeat('a', 64), now() + interval '2 hours');
    raise exception 'expected excessive expiry rejection';
  exception when raise_exception then
    if sqlerrm = 'expected excessive expiry rejection' then raise; end if;
  end;
end;
$$;

set local role service_role;
select public.issue_client_token('token@example.test', repeat('a', 64), now() + interval '10 minutes');
select public.issue_client_token('token@example.test', repeat('b', 64), now() + interval '15 minutes');
reset role;

select pg_temp.assert_true(
  (select count(*) = 1 and min(token_hash) = repeat('b', 64)
   from public.client_tokens where email = 'token@example.test'),
  'issuing a replacement token did not keep one current token'
);

set local role service_role;
create temporary table consumed_token_result as
  select * from public.consume_client_token(repeat('b', 64));
create temporary table consumed_token_again as
  select * from public.consume_client_token(repeat('b', 64));
reset role;

select pg_temp.assert_true(
  (select count(*) = 1 and min(email) = 'token@example.test' from consumed_token_result)
  and (select count(*) = 0 from consumed_token_again),
  'client token was not consumed exactly once'
);

-- Atomic client upsert and conflict protection.
set local role service_role;
select public.upsert_client_activity(
  'Integration Client', 'activity@example.test', '06 12 34 56 78', '+33612345678', 'rdv', true
);
select public.upsert_client_activity(
  'Integration Client Updated', 'activity-new@example.test', '+33 6 12 34 56 78', '+33612345678', 'location', false
);
select public.upsert_client_activity(
  'Conflict A', 'conflict-a@example.test', '0600000001', '+33600000001', 'rdv', false
);
select public.upsert_client_activity(
  'Conflict B', 'conflict-b@example.test', '0600000002', '+33600000002', 'rdv', false
);
reset role;

select pg_temp.assert_true(
  (select count(*) = 1
     and min(email) = 'activity-new@example.test'
     and min(rdv_count) = 1
     and min(location_count) = 1
     and not bool_or(marketing_consent)
   from public.clients where telephone_normalized = '+33612345678'),
  'upsert_client_activity did not merge and count activities correctly'
);

do $$
begin
  begin
    perform public.upsert_client_activity(
      'Conflict', 'conflict-a@example.test', '0600000002', '+33600000002', 'rdv', false
    );
    raise exception 'expected cross-identity conflict rejection';
  exception when raise_exception then
    if sqlerrm = 'expected cross-identity conflict rejection' then raise; end if;
  end;
  begin
    perform public.upsert_client_activity(
      'Invalid Activity', 'invalid@example.test', '0600000003', '+33600000003', 'other', false
    );
    raise exception 'expected invalid activity rejection';
  exception when raise_exception then
    if sqlerrm = 'expected invalid activity rejection' then raise; end if;
  end;
end;
$$;

-- Admin search returns the total even when the requested page is empty.
create temporary table empty_client_page as
  select * from public.search_clients_admin('', 'all', 'recent', 999999, 30);
select pg_temp.assert_true(
  (select count(*) = 1 and bool_and(id is null) and min(total_count) >= 3 from empty_client_page),
  'search_clients_admin lost total_count on an empty page'
);
select pg_temp.assert_true(
  (select count(*) = 1 from public.search_clients_admin('activity-new@example.test', 'all', 'name', 0, 30)
   where id is not null and total_count = 1),
  'search_clients_admin exact filtering is incorrect'
);

-- Distributed rate limiting: valid sequence, invalid input and window reset.
set local role service_role;
select pg_temp.assert_true(public.check_rate_limit(repeat('c', 64), 2, 60), 'first request was rejected');
select pg_temp.assert_true(public.check_rate_limit(repeat('c', 64), 2, 60), 'second request was rejected');
select pg_temp.assert_true(not public.check_rate_limit(repeat('c', 64), 2, 60), 'third request was accepted');
select pg_temp.assert_true(not public.check_rate_limit('invalid', 2, 60), 'invalid rate-limit key was accepted');
reset role;
select pg_temp.assert_true(
  (select request_count = 3 from public.api_rate_limits where key = repeat('c', 64))
  and not exists (select 1 from public.api_rate_limits where key = 'invalid'),
  'rate-limit persistence is incorrect'
);
update public.api_rate_limits
set window_started_at = now() - interval '61 seconds'
where key = repeat('c', 64);
set local role service_role;
select pg_temp.assert_true(public.check_rate_limit(repeat('c', 64), 2, 60), 'expired rate-limit window did not reset');
reset role;
select pg_temp.assert_true(
  (select request_count = 1 from public.api_rate_limits where key = repeat('c', 64)),
  'reset rate-limit window did not restart at one'
);

-- Booking exclusion constraint: overlaps fail; adjacency, cancellation and other dates pass.
insert into public.rdv_bookings (
  id, nom, email, telephone, categorie, prestation, prestation_label,
  total_price, total_duration, date, slot, status
) values (
  'integration-base', 'Test Base', 'base@example.test', '0600000010',
  'homme', 'test', 'Test', 10, 60, date '2035-01-15', '10:00', 'confirmed'
);

do $$
begin
  begin
    insert into public.rdv_bookings (
      id, nom, email, telephone, categorie, prestation, prestation_label,
      total_price, total_duration, date, slot, status
    ) values (
      'integration-overlap', 'Test Overlap', 'overlap@example.test', '0600000011',
      'homme', 'test', 'Test', 10, 30, date '2035-01-15', '10:30', 'pending'
    );
    raise exception 'expected overlap rejection';
  exception when exclusion_violation then null;
  end;
end;
$$;

insert into public.rdv_bookings (
  id, nom, email, telephone, categorie, prestation, prestation_label,
  total_price, total_duration, date, slot, status
) values
  ('integration-adjacent', 'Test Adjacent', 'adjacent@example.test', '0600000012',
   'homme', 'test', 'Test', 10, 30, date '2035-01-15', '11:00', 'pending'),
  ('integration-cancelled', 'Test Cancelled', 'cancelled@example.test', '0600000013',
   'homme', 'test', 'Test', 10, 30, date '2035-01-15', '10:30', 'cancelled'),
  ('integration-other-day', 'Test Other Day', 'otherday@example.test', '0600000014',
   'homme', 'test', 'Test', 10, 30, date '2035-01-16', '10:30', 'pending');

do $$
begin
  begin
    insert into public.rdv_bookings (
      id, nom, email, telephone, categorie, prestation, prestation_label,
      total_price, total_duration, date, slot, status
    ) values (
      'integration-invalid-slot', 'Invalid Slot', 'slot@example.test', '0600000015',
      'homme', 'test', 'Test', 10, 30, date '2035-01-17', '25:00', 'pending'
    );
    raise exception 'expected invalid slot rejection';
  exception when check_violation then null;
  end;
  begin
    insert into public.rdv_bookings (
      id, nom, email, telephone, categorie, prestation, prestation_label,
      total_price, total_duration, date, slot, status
    ) values (
      'integration-invalid-duration', 'Invalid Duration', 'duration@example.test', '0600000016',
      'homme', 'test', 'Test', 10, 481, date '2035-01-17', '10:00', 'pending'
    );
    raise exception 'expected invalid duration rejection';
  exception when check_violation then null;
  end;
end;
$$;

select pg_temp.assert_true(
  (select slot_start_minutes = 600 and slot_end_minutes = 660
   from public.rdv_bookings where id = 'integration-base'),
  'generated booking minute bounds are incorrect'
);

rollback;

\echo 'SECURITY_HARDENING_INTEGRATION_OK'
