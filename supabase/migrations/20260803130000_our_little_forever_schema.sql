create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  role text not null check (role in ('aldane', 'santana')),
  avatar_key text not null check (avatar_key in ('aldane', 'santana')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_role_key on public.profiles(role);
create index if not exists profiles_avatar_key_idx on public.profiles(avatar_key);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  message_type text not null default 'text' check (message_type in ('text', 'letter', 'system')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_created_at_idx on public.messages(created_at desc);
create index if not exists messages_sender_created_at_idx on public.messages(sender_id, created_at desc);

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 140),
  body text not null check (char_length(body) between 1 and 20000),
  author_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  is_published boolean not null default false,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists letters_recipient_published_idx on public.letters(recipient_id, is_published, created_at desc);
create index if not exists letters_author_created_idx on public.letters(author_id, created_at desc);

create table if not exists public.relationship_moments (
  id uuid primary key default gen_random_uuid(),
  moment_type text not null check (moment_type in ('girlfriend_question')),
  initiated_by uuid not null references public.profiles(id) on delete restrict,
  response text check (response in ('yes')),
  responded_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists relationship_moments_created_at_idx on public.relationship_moments(created_at desc);
create index if not exists relationship_moments_response_idx on public.relationship_moments(response, responded_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists letters_set_updated_at on public.letters;
create trigger letters_set_updated_at
before update on public.letters
for each row execute function public.set_updated_at();

create or replace function public.is_private_member(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role in ('aldane', 'santana')
  );
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and role in ('aldane', 'santana')
  limit 1;
$$;

alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.letters enable row level security;
alter table public.relationship_moments enable row level security;

drop policy if exists "Private members can read the two profiles" on public.profiles;
create policy "Private members can read the two profiles"
on public.profiles
for select
to authenticated
using (public.is_private_member() and public.is_private_member(id));

drop policy if exists "Private members can update only their own profile" on public.profiles;
create policy "Private members can update only their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid() and public.is_private_member())
with check (
  id = auth.uid()
  and public.is_private_member()
  and role = public.current_profile_role()
);

drop policy if exists "Private members can read messages" on public.messages;
create policy "Private members can read messages"
on public.messages
for select
to authenticated
using (public.is_private_member());

drop policy if exists "Private members can send their own messages" on public.messages;
create policy "Private members can send their own messages"
on public.messages
for insert
to authenticated
with check (
  public.is_private_member()
  and sender_id = auth.uid()
  and char_length(btrim(content)) between 1 and 2000
);

drop policy if exists "Private members can mark messages read" on public.messages;
create policy "Private members can mark messages read"
on public.messages
for update
to authenticated
using (public.is_private_member())
with check (public.is_private_member());

drop policy if exists "Private members can read published or direct letters" on public.letters;
create policy "Private members can read published or direct letters"
on public.letters
for select
to authenticated
using (
  public.is_private_member()
  and (
    is_published
    or author_id = auth.uid()
    or recipient_id = auth.uid()
  )
);

drop policy if exists "Private members can write letters as themselves" on public.letters;
create policy "Private members can write letters as themselves"
on public.letters
for insert
to authenticated
with check (public.is_private_member() and author_id = auth.uid());

drop policy if exists "Private members can update their own letters" on public.letters;
create policy "Private members can update their own letters"
on public.letters
for update
to authenticated
using (public.is_private_member() and author_id = auth.uid())
with check (public.is_private_member() and author_id = auth.uid());

drop policy if exists "Private members can read relationship moments" on public.relationship_moments;
create policy "Private members can read relationship moments"
on public.relationship_moments
for select
to authenticated
using (public.is_private_member());

drop policy if exists "Private members can save accepted relationship moments" on public.relationship_moments;
create policy "Private members can save accepted relationship moments"
on public.relationship_moments
for insert
to authenticated
with check (
  public.is_private_member()
  and response = 'yes'
  and responded_by = auth.uid()
  and responded_at is not null
  and exists (
    select 1
    from public.profiles initiator
    where initiator.id = initiated_by
      and initiator.role = 'aldane'
  )
);

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.relationship_moments;
exception
  when duplicate_object then null;
end $$;
