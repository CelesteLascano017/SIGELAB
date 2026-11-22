-- SIGELAB · Row Level Security. All writes to requests go through security-definer RPCs.

alter table public.profiles enable row level security;
alter table public.labs enable row level security;
alter table public.time_slots enable row level security;
alter table public.class_schedules enable row level security;
alter table public.lab_unavailability enable row level security;
alter table public.reservation_requests enable row level security;
alter table public.request_status_history enable row level security;
alter table public.notifications enable row level security;

-- profiles: own row, admins see all. No update/insert/delete policies => role cannot be changed by clients.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin');

-- catalog tables: readable by any signed-in user, writable by admins only
create policy labs_select on public.labs for select to authenticated using (true);
create policy labs_admin_write on public.labs for all to authenticated
  using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy time_slots_select on public.time_slots for select to authenticated using (true);

create policy class_schedules_select on public.class_schedules for select to authenticated using (true);
create policy class_schedules_admin_write on public.class_schedules for all to authenticated
  using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy lab_unavailability_select on public.lab_unavailability for select to authenticated using (true);
create policy lab_unavailability_admin_write on public.lab_unavailability for all to authenticated
  using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

-- requests: owner or admin can read; nobody writes directly (RPCs only)
create policy requests_select on public.reservation_requests for select to authenticated
  using (requester_id = auth.uid() or public.current_user_role() = 'admin');

create policy history_select on public.request_status_history for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (select 1 from public.reservation_requests r
               where r.id = request_id and r.requester_id = auth.uid())
  );

create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Grants: least privilege
revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles, public.labs, public.time_slots, public.class_schedules,
  public.lab_unavailability, public.reservation_requests, public.request_status_history,
  public.notifications to authenticated;
grant insert, update, delete on public.labs, public.class_schedules, public.lab_unavailability to authenticated;
grant update (read) on public.notifications to authenticated;
