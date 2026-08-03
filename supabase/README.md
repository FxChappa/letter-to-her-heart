# Our Little Forever Supabase Setup

This folder contains the local Supabase configuration and migrations for **Our Little Forever**.

The local Supabase project identifier is `our-little-forever`. Keep this directory linked to the existing project; never create a second project for this repository.

Run `npx supabase db push` only after confirming the linked project reference. The enhancement migration adds the saved controls-tutorial preference, private Realtime authorization for presence/date/voice channels, and a database guard that restricts message updates to read receipts.
