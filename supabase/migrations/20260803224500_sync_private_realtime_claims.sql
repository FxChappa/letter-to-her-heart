create or replace function public.sync_private_realtime_claim()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('our_little_forever_role', new.role)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists profiles_sync_private_realtime_claim on public.profiles;
create trigger profiles_sync_private_realtime_claim
after insert or update of role on public.profiles
for each row execute function public.sync_private_realtime_claim();

revoke all on function public.sync_private_realtime_claim() from public, anon, authenticated;

update auth.users as private_user
set raw_app_meta_data = coalesce(private_user.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('our_little_forever_role', profile.role)
from public.profiles as profile
where private_user.id = profile.id
  and profile.role in ('aldane', 'santana');
