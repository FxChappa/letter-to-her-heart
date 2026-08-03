drop policy if exists "Private members can receive private realtime events" on realtime.messages;
create policy "Private members can receive private realtime events"
on realtime.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where public.profiles.id = (select auth.uid())
      and public.profiles.role in ('aldane', 'santana')
  )
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
  exists (
    select 1
    from public.profiles
    where public.profiles.id = (select auth.uid())
      and public.profiles.role in ('aldane', 'santana')
  )
  and (
    ((select realtime.topic()) = 'our-little-forever:home' and realtime.messages.extension = 'presence')
    or (
      (select realtime.topic()) in ('our-little-forever:date', 'our-little-forever:voice', 'our-little-forever:couple')
      and realtime.messages.extension = 'broadcast'
    )
  )
);
