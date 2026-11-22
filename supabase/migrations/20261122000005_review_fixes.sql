-- Additive review fixes: preserve full sequence, reject expired approvals, revoke stale roles.

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
  v_sequence text;
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

  v_sequence := nextval('public.reservation_request_seq')::text;
  insert into public.reservation_requests
    (code, requester_id, lab_id, date, slot_id, reservation_type, attendees, reason)
  values (
    'SOL-' || to_char(p_date, 'YYYY') || '-' || lpad(v_sequence, greatest(4, length(v_sequence)), '0'),
    auth.uid(), p_lab_id, p_date, p_slot_id, p_type, p_attendees, btrim(p_reason))
  returning * into v_row;

  perform public.log_status_change(v_row, null, null, auth.uid(),
    'Tu solicitud ' || v_row.code || ' fue registrada y está pendiente de revisión.');
  return v_row;
end;
$$;

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
  if v_row.date < public.today_local() then perform public.fail('PAST_DATE'); end if;

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

create or replace function public.sync_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_role public.user_role;
begin
  begin
    v_role := coalesce(new.raw_app_meta_data ->> 'role', 'student')::public.user_role;
  exception when invalid_text_representation then
    v_role := 'student';
  end;
  update public.profiles set role = v_role where id = new.id and role is distinct from v_role;
  return new;
end;
$$;
revoke all on function public.sync_profile_role() from public, anon, authenticated;

-- Reconcile stale privileges left behind by the previous trigger.
update public.profiles p set role = case
  when u.raw_app_meta_data ->> 'role' in ('student', 'professor', 'admin')
    then (u.raw_app_meta_data ->> 'role')::public.user_role
  else 'student'::public.user_role end
from auth.users u where u.id = p.id;
