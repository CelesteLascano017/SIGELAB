-- SIGELAB · Keep profiles.role in sync with auth.users.raw_app_meta_data.role
-- GoTrue's admin API creates the user first and sets app_metadata afterwards (INSERT then UPDATE),
-- so the AFTER INSERT trigger alone leaves everyone as 'student'.
-- app_metadata can only be written server-side (service role / Auth admin API), never by the user,
-- so this keeps role assignment out of the client's reach.

create or replace function public.sync_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
begin
  begin
    v_role := (new.raw_app_meta_data ->> 'role')::public.user_role;
  exception when invalid_text_representation then
    return new; -- unknown role value: ignore, never escalate
  end;
  if v_role is not null then
    update public.profiles set role = v_role where id = new.id and role is distinct from v_role;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_profile_role() from public, anon, authenticated;

create trigger on_auth_user_role_changed
  after update of raw_app_meta_data on auth.users
  for each row
  when (old.raw_app_meta_data is distinct from new.raw_app_meta_data)
  execute function public.sync_profile_role();

-- One-time backfill for users created before this migration (only valid role values; additive, no deletes)
update public.profiles p
   set role = (u.raw_app_meta_data ->> 'role')::public.user_role
  from auth.users u
 where u.id = p.id
   and u.raw_app_meta_data ->> 'role' in ('student', 'professor', 'admin')
   and p.role is distinct from (u.raw_app_meta_data ->> 'role')::public.user_role;
