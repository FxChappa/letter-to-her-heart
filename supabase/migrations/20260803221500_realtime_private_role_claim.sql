drop policy if exists "Private members can receive private realtime events" on realtime.messages;
create policy "Private members can receive private realtime events"
on realtime.messages
for select
to authenticated
using (
  ((current_setting('request.jwt.claims', true))::jsonb -> 'app_metadata' ->> 'our_little_forever_role') in ('aldane', 'santana')
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
  ((current_setting('request.jwt.claims', true))::jsonb -> 'app_metadata' ->> 'our_little_forever_role') in ('aldane', 'santana')
  and (
    ((select realtime.topic()) = 'our-little-forever:home' and realtime.messages.extension = 'presence')
    or (
      (select realtime.topic()) in ('our-little-forever:date', 'our-little-forever:voice', 'our-little-forever:couple')
      and realtime.messages.extension = 'broadcast'
    )
  )
);
