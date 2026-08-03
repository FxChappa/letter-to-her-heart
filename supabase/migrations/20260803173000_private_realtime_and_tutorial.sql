alter table public.profiles
add column if not exists controls_tutorial_complete boolean not null default false;

create or replace function public.enforce_message_read_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id
    or new.sender_id is distinct from old.sender_id
    or new.content is distinct from old.content
    or new.message_type is distinct from old.message_type
    or new.created_at is distinct from old.created_at then
    raise exception 'Only message read state can be updated';
  end if;

  if new.read_at is null or (old.read_at is not null and new.read_at is distinct from old.read_at) then
    raise exception 'Message read state cannot be cleared or changed';
  end if;

  return new;
end;
$$;

drop trigger if exists messages_enforce_read_update on public.messages;
create trigger messages_enforce_read_update
before update on public.messages
for each row execute function public.enforce_message_read_update();

drop policy if exists "Private members can mark messages read" on public.messages;
create policy "Private members can mark received messages read"
on public.messages
for update
to authenticated
using (
  public.is_private_member()
  and sender_id <> auth.uid()
)
with check (
  public.is_private_member()
  and sender_id <> auth.uid()
);

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
      (select realtime.topic()) in ('our-little-forever:date', 'our-little-forever:voice')
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
      (select realtime.topic()) in ('our-little-forever:date', 'our-little-forever:voice')
      and realtime.messages.extension = 'broadcast'
    )
  )
);
