-- SIGELAB · Transactional business operations (security definer, role checked in DB)

create or replace function public.today_local()
returns date
language sql
stable
as $$ select (now() at time zone 'America/Guayaquil')::date; $$;

-- Slot status for a lab/date/slot: free | requested | reserved | class | unavailable
create or replace function public.slot_status(p_lab uuid, p_date date, p_slot smallint)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (select 1 from public.class_schedules c
                 where c.lab_id = p_lab and c.weekday = extract(isodow from p_date)::smallint and c.slot_id = p_slot)
      then 'class'
    when exists (select 1 from public.lab_unavailability u
                 where u.lab_id = p_lab and u.date = p_date and u.slot_id = p_slot)
      then 'unavailable'
    when exists (select 1 from public.reservation_requests r
                 where r.lab_id = p_lab and r.date = p_date and r.slot_id = p_slot and r.status = 'approved')
      then 'reserved'
    when exists (select 1 from public.reservation_requests r
                 where r.lab_id = p_lab and r.date = p_date and r.slot_id = p_slot and r.status = 'pending')
      then 'requested'
    else 'free'
  end;
$$;

-- Availability grid for a date (visible to every authenticated user; exposes no request details)
create or replace function public.get_availability(p_date date)
returns table (lab_id uuid, slot_id smallint, status text, reserved_code text)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, t.id, public.slot_status(l.id, p_date, t.id),
         (select r.code from public.reservation_requests r
           where r.lab_id = l.id and r.date = p_date and r.slot_id = t.id and r.status = 'approved' limit 1)
  from public.labs l cross join public.time_slots t
  where auth.uid() is not null
  order by l.code, t.id;
$$;

-- Internal: insert history + notification
create or replace function public.log_status_change(
  p_request public.reservation_requests, p_from public.request_status, p_reason text, p_notify_user uuid, p_message text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.request_status_history (request_id, from_status, to_status, reason, changed_by)
  values (p_request.id, p_from, p_request.status, p_reason, auth.uid());
  if p_notify_user is not null then
    insert into public.notifications (user_id, request_id, message)
    values (p_notify_user, p_request.id, p_message);
  end if;
end;
$$;
revoke all on function public.log_status_change(public.reservation_requests, public.request_status, text, uuid, text) from public, anon, authenticated;

create or replace function public.fail(p_code text)
returns void
language plpgsql
as $$
begin
  raise exception '%', p_code using errcode = 'P0001';
end;
$$;

-- HU-03 · create request (professors only)
create or replace function public.create_reservation_request(
  p_lab_id uuid, p_date date, p_slot_id smallint,
  p_type public.reservation_type, p_attendees integer, p_reason text)
returns public.reservation_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lab public.labs;
  v_row public.reservation_requests;
  v_status text;
begin
  if auth.uid() is null then perform public.fail('NOT_AUTHENTICATED'); end if;
  if public.current_user_role() is distinct from 'professor' then perform public.fail('FORBIDDEN'); end if;

  if p_lab_id is null or p_date is null or p_slot_id is null or p_type is null
     or p_attendees is null or p_reason is null or length(btrim(p_reason)) = 0 then
    perform public.fail('MISSING_FIELDS');
  end if;

  select * into v_lab from public.labs where id = p_lab_id;
  if not found then perform public.fail('LAB_NOT_FOUND'); end if;
  if not exists (select 1 from public.time_slots where id = p_slot_id) then perform public.fail('INVALID_SLOT'); end if;
  if p_date < public.today_local() then perform public.fail('PAST_DATE'); end if;
  if p_attendees < 1 then perform public.fail('INVALID_ATTENDEES'); end if;
  if p_attendees > v_lab.capacity then perform public.fail('CAPACITY_EXCEEDED'); end if;

  v_status := public.slot_status(p_lab_id, p_date, p_slot_id);
  if v_status in ('class', 'unavailable', 'reserved') then perform public.fail('SLOT_UNAVAILABLE'); end if;

  insert into public.reservation_requests
    (code, requester_id, lab_id, date, slot_id, reservation_type, attendees, reason)
  values (
    'SOL-' || to_char(p_date, 'YYYY') || '-' || lpad(nextval('public.reservation_request_seq')::text, 4, '0'),
    auth.uid(), p_lab_id, p_date, p_slot_id, p_type, p_attendees, btrim(p_reason))
  returning * into v_row;

  perform public.log_status_change(v_row, null, null, auth.uid(),
    'Tu solicitud ' || v_row.code || ' fue registrada y está pendiente de revisión.');
  return v_row;
end;
$$;

-- HU-06 · approve (admin only, transactional, re-checks availability under row lock)
create or replace function public.approve_reservation_request(p_request_id uuid)
returns public.reservation_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.reservation_requests;
  v_status text;
begin
  if public.current_user_role() is distinct from 'admin' then perform public.fail('FORBIDDEN'); end if;

  select * into v_row from public.reservation_requests where id = p_request_id for update;
  if not found then perform public.fail('REQUEST_NOT_FOUND'); end if;
  if v_row.status <> 'pending' then perform public.fail('NOT_PENDING'); end if;

  -- Serialize approvals competing for the same slot
  perform pg_advisory_xact_lock(hashtextextended(v_row.lab_id::text || v_row.date::text || v_row.slot_id::text, 0));

  v_status := public.slot_status(v_row.lab_id, v_row.date, v_row.slot_id);
  if v_status in ('class', 'unavailable', 'reserved') then perform public.fail('CONFLICT'); end if;

  begin
    update public.reservation_requests
       set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), rejection_reason = null
     where id = p_request_id
    returning * into v_row;
  exception when unique_violation then
    perform public.fail('CONFLICT');
  end;

  perform public.log_status_change(v_row, 'pending', null, v_row.requester_id,
    'Tu solicitud ' || v_row.code || ' fue aprobada.');
  return v_row;
end;
$$;

-- HU-06 · reject (admin only, mandatory reason)
create or replace function public.reject_reservation_request(p_request_id uuid, p_reason text)
returns public.reservation_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.reservation_requests;
begin
  if public.current_user_role() is distinct from 'admin' then perform public.fail('FORBIDDEN'); end if;
  if p_reason is null or length(btrim(p_reason)) = 0 then perform public.fail('REASON_REQUIRED'); end if;

  select * into v_row from public.reservation_requests where id = p_request_id for update;
  if not found then perform public.fail('REQUEST_NOT_FOUND'); end if;
  if v_row.status <> 'pending' then perform public.fail('NOT_PENDING'); end if;

  update public.reservation_requests
     set status = 'rejected', rejection_reason = btrim(p_reason), reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_request_id
  returning * into v_row;

  perform public.log_status_change(v_row, 'pending', btrim(p_reason), v_row.requester_id,
    'Tu solicitud ' || v_row.code || ' fue rechazada.');
  return v_row;
end;
$$;

-- HU-05 · owner cancels own pending request
create or replace function public.cancel_reservation_request(p_request_id uuid)
returns public.reservation_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.reservation_requests;
  v_prev public.request_status;
begin
  select * into v_row from public.reservation_requests where id = p_request_id for update;
  if not found or v_row.requester_id <> auth.uid() then perform public.fail('FORBIDDEN'); end if;
  if v_row.status not in ('pending', 'approved') then perform public.fail('NOT_CANCELLABLE'); end if;

  v_prev := v_row.status;
  update public.reservation_requests set status = 'cancelled' where id = p_request_id returning * into v_row;
  perform public.log_status_change(v_row, v_prev, null, null, null);
  return v_row;
end;
$$;

-- HU-04 / HU-06 · admin list with conflict flags
-- has_conflict: another active (pending/approved) request shares lab/date/slot.
-- is_blocked: pending request whose slot is already approved for someone else.
create or replace function public.list_reservations_admin()
returns table (
  id uuid, code text, requester_id uuid, requester_name text, lab_id uuid, lab_name text, lab_code text,
  date date, slot_id smallint, reservation_type public.reservation_type, attendees integer, reason text,
  status public.request_status, created_at timestamptz, has_conflict boolean, is_blocked boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() is distinct from 'admin' then perform public.fail('FORBIDDEN'); end if;
  return query
  select r.id, r.code, r.requester_id, p.full_name, r.lab_id, l.name, l.code,
         r.date, r.slot_id, r.reservation_type, r.attendees, r.reason, r.status, r.created_at,
         (r.status in ('pending', 'approved') and exists (
            select 1 from public.reservation_requests o
            where o.id <> r.id and o.lab_id = r.lab_id and o.date = r.date and o.slot_id = r.slot_id
              and o.status in ('pending', 'approved'))),
         (r.status = 'pending' and (exists (
            select 1 from public.reservation_requests o
            where o.id <> r.id and o.lab_id = r.lab_id and o.date = r.date and o.slot_id = r.slot_id
              and o.status = 'approved')
          or public.slot_status(r.lab_id, r.date, r.slot_id) in ('class', 'unavailable')))
  from public.reservation_requests r
  join public.profiles p on p.id = r.requester_id
  join public.labs l on l.id = r.lab_id
  order by r.date, r.slot_id, r.created_at;
end;
$$;

-- Lock down function execution: only signed-in users (anon cannot call anything)
revoke all on function public.create_reservation_request(uuid, date, smallint, public.reservation_type, integer, text) from public, anon;
revoke all on function public.approve_reservation_request(uuid) from public, anon;
revoke all on function public.reject_reservation_request(uuid, text) from public, anon;
revoke all on function public.cancel_reservation_request(uuid) from public, anon;
revoke all on function public.list_reservations_admin() from public, anon;
revoke all on function public.get_availability(date) from public, anon;
revoke all on function public.slot_status(uuid, date, smallint) from public, anon;
grant execute on function public.create_reservation_request(uuid, date, smallint, public.reservation_type, integer, text) to authenticated;
grant execute on function public.approve_reservation_request(uuid) to authenticated;
grant execute on function public.reject_reservation_request(uuid, text) to authenticated;
grant execute on function public.cancel_reservation_request(uuid) to authenticated;
grant execute on function public.list_reservations_admin() to authenticated;
grant execute on function public.get_availability(date) to authenticated;
grant execute on function public.slot_status(uuid, date, smallint) to authenticated;
