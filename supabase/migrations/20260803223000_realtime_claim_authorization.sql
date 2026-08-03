drop policy if exists "Private members can receive private realtime events" on realtime.messages;
create policy "Private members can receive private realtime events"
on realtime.messages
for select
to authenticated
using (
  ((current_setting('request.jwt.claims', true))::jsonb -> 'app_metadata' ->> 'our_little_forever_role') in ('aldane', 'santana')
);

drop policy if exists "Private members can send private realtime events" on realtime.messages;
create policy "Private members can send private realtime events"
on realtime.messages
for insert
to authenticated
with check (
  ((current_setting('request.jwt.claims', true))::jsonb -> 'app_metadata' ->> 'our_little_forever_role') in ('aldane', 'santana')
);
