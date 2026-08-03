alter table public.profiles
add column if not exists new_chapter_completed_at timestamptz;

create or replace function public.protect_private_profile_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
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

drop trigger if exists profiles_protect_private_fields on public.profiles;
create trigger profiles_protect_private_fields
before update on public.profiles
for each row execute function public.protect_private_profile_fields();

create or replace function public.enforce_letter_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() = old.author_id then
    return new;
  end if;

  if auth.uid() <> old.recipient_id
    or new.id is distinct from old.id
    or new.title is distinct from old.title
    or new.body is distinct from old.body
    or new.author_id is distinct from old.author_id
    or new.recipient_id is distinct from old.recipient_id
    or new.is_published is distinct from old.is_published
    or new.created_at is distinct from old.created_at
    or new.opened_at is null
    or old.opened_at is not null then
    raise exception 'Recipients can only mark an unopened letter as opened';
  end if;

  return new;
end;
$$;

drop trigger if exists letters_enforce_private_update on public.letters;
create trigger letters_enforce_private_update
before update on public.letters
for each row execute function public.enforce_letter_update();

drop policy if exists "Recipients can mark direct letters opened" on public.letters;
create policy "Recipients can mark direct letters opened"
on public.letters
for update
to authenticated
using (public.is_private_member() and recipient_id = auth.uid() and opened_at is null)
with check (public.is_private_member() and recipient_id = auth.uid() and opened_at is not null);

drop policy if exists "Private members can receive private realtime events" on realtime.messages;
create policy "Private members can receive private realtime events"
on realtime.messages
for select
to authenticated
using (
  public.is_private_member()
  and (
    ((select realtime.topic()) = 'our-little-forever:home' and realtime.messages.extension = 'presence')
    or (
      (select realtime.topic()) in ('our-little-forever:date', 'our-little-forever:voice', 'our-little-forever:couple')
      and realtime.messages.extension = 'broadcast'
    )
  )
);

drop policy if exists "Private members can send private realtime events" on realtime.messages;
create policy "Private members can send private realtime events"
on realtime.messages
for insert
to authenticated
with check (
  public.is_private_member()
  and (
    ((select realtime.topic()) = 'our-little-forever:home' and realtime.messages.extension = 'presence')
    or (
      (select realtime.topic()) in ('our-little-forever:date', 'our-little-forever:voice', 'our-little-forever:couple')
      and realtime.messages.extension = 'broadcast'
    )
  )
);
