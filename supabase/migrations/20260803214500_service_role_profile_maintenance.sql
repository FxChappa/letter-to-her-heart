create or replace function public.protect_private_profile_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.display_name is distinct from old.display_name
    or new.role is distinct from old.role
    or new.avatar_key is distinct from old.avatar_key
    or new.created_at is distinct from old.created_at then
    raise exception 'Private identity fields cannot be changed from the client';
  end if;

  if old.controls_tutorial_complete and not new.controls_tutorial_complete then
    raise exception 'Tutorial completion cannot be cleared from the client';
  end if;

  if old.new_chapter_completed_at is not null
    and new.new_chapter_completed_at is distinct from old.new_chapter_completed_at then
    raise exception 'New chapter completion cannot be cleared or changed';
  end if;

  if new.new_chapter_completed_at is distinct from old.new_chapter_completed_at
    and old.role <> 'santana' then
    raise exception 'Only Santana can complete the new chapter';
  end if;

  return new;
end;
$$;
