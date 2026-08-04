# Our Little Forever

**A little space for Aldane and Santana**

Our Little Forever is a private, mobile-first digital home for Aldane and Santana. The original interactive love letters remain intact and now live inside the experience as part of their shared bookshelf.

The original writing, passphrase, heart effects, and ambient sound remain part of the experience. The current private entry flow is:

1. Branded welcome screen.
2. Private login.
3. Santana reads `A New Chapter` once on her first entry.
4. Device-specific movement introduction.
5. Shared home, letters, chat, voice, memories, and candlelit date.

The preserved original presentation is available through **Revisit the letters**. It still contains the first letter, the lifetime-of-nights passphrase, the second letter, and the transition into the private space. Aldane can preview `A New Chapter` from Settings without changing Santana's saved progress.

> Privacy: this GitHub repository currently contains personal writing. Make the repository private before sharing access or adding more private content.

## Local Setup

Node.js 20 or newer is required. This checkout has been verified with Node.js 24.

```bash
npm install
npm run dev
```

The app is built with React, TypeScript, Vite, Supabase, Three.js, React Three Fiber, Drei, and Zustand. Supabase CLI is installed as a development dependency.

## Environment Variables

The private local file belongs beside `package.json`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Copy the project URL and browser-safe publishable key from the existing Supabase project’s **Connect** dialog or **Project Settings → API**. Keep the variable names, remove placeholder text, use no quotation marks, and leave no spaces around `=`.

Never place real credentials in `.env.example`, README, source code, screenshots, or Git commits. `.env.local` and Supabase’s local link metadata are ignored by Git.

Optional local-only settings:

```env
VITE_ALLOW_DEMO_MODE=
VITE_WEBRTC_ICE_SERVERS_JSON=
```

Demo mode is automatic only during local development when Supabase is missing. Production demo mode requires the explicit value `true`.

## Existing Supabase Project

Do not create another Supabase project. Link this folder to the existing project reference, then verify the planned migrations:

```bash
npx supabase link --project-ref YOUR_EXISTING_PROJECT_REFERENCE
npx supabase db push --dry-run
```

Apply pending reviewed migrations without resetting the database:

```bash
npx supabase db push
```

The migrations create and protect:

- `profiles`
- `messages`
- `letters`
- `relationship_moments`
- private Realtime Presence and Broadcast authorization
- message read-receipt enforcement
- saved controls-tutorial preference
- saved first-entry completion for `A New Chapter`
- recipient-only letter read markers

Every private table has Row Level Security. Movement and live audio are not stored in the database.

Generated database types are stored in `src/lib/supabase/database.generated.types.ts`. Refresh them after schema changes:

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.generated.types.ts
```

## Create The Two Accounts

Public sign-up is disabled. In the existing Supabase dashboard:

1. Open **Authentication → Users**.
2. Select **Add user → Create new user**.
3. Create one private email/password account for Aldane.
4. Repeat for Santana.
5. Copy each user ID. Do not place either email or password in this repository.
6. Open **SQL Editor → New query**.
7. Replace the two placeholder IDs below and run the query.

```sql
insert into public.profiles (id, display_name, role, avatar_key)
values
  ('ALDANE_AUTH_USER_ID', 'Aldane', 'aldane', 'aldane'),
  ('SANTANA_AUTH_USER_ID', 'Santana', 'santana', 'santana')
on conflict (id) do update
set display_name = excluded.display_name,
    role = excluded.role,
    avatar_key = excluded.avatar_key;
```

Permissions come from the authenticated profile role, never a browser-supplied display name. Linking a profile also writes the approved role into the user's protected authentication metadata for private Realtime authorization. Ask that user to sign out and back in after changing a role so the browser receives a fresh session.

## Realtime And Voice

Supabase Presence shares whether each person is online. Position, rotation, room, activity, and seat identity use ephemeral private Broadcast messages throttled to about ten updates per second; remote avatars interpolate between updates. Sitting, standing, kissing, dancing, and giving flowers use synchronized private interaction state. Couple moments require the other person to accept before either avatar moves into the interaction, and the flower action is available only to Aldane. Wren is a lightweight local puppy NPC who roams the home and settles near the children during date and couple moments.

Chat uses database-backed Realtime updates. Date events and WebRTC signaling use authenticated private Broadcast channels. In the Supabase dashboard, open **Realtime → Settings** and disable **Allow public access** if you want the entire project to reject public Realtime channels. The app’s own channels are already private.

Voice is audio-only peer-to-peer WebRTC. Each person must tap **Join voice** before microphone permission is requested. Live audio is not recorded or sent through the database. The default public STUN server works on many networks, but some networks require a TURN provider:

```env
VITE_WEBRTC_ICE_SERVERS_JSON=[{"urls":"turn:example.com","username":"USER","credential":"PASSWORD"}]
```

Keep TURN credentials out of Git.

## Vercel

In the existing Vercel project:

1. Open **Settings → Environment Variables**.
2. Add `VITE_SUPABASE_URL`.
3. Add `VITE_SUPABASE_PUBLISHABLE_KEY` separately.
4. Apply both to **Production**, **Preview**, and **Development**.
5. Save and redeploy the latest deployment.

Do not rename the Vercel project or production URL as part of this code change.

## Add To iPad Home Screen

1. Open the deployed site in Safari.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Confirm the app name `Little Forever`.
5. Tap **Add**.

The manifest supports portrait and landscape, safe-area insets, a standalone display, and dedicated iOS/Android icons. The service worker uses a network-first app shell and does not cache Supabase requests or private realtime data.

## Quality Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Manual two-browser check:

1. Sign in as Aldane in one browser and Santana in another.
2. Confirm the movement tutorial adapts to desktop and touch controls.
3. Move both avatars and verify presence, activity, interpolation, and reconnect behavior.
4. Sit and stand from the sofa, living-room chair, and both dining chairs; confirm occupied seats cannot be reused.
5. Request a kiss and a dance in both directions; as Aldane, give Santana flowers. Test accept, **Not right now**, completion, and **End dance**.
6. Send multiline chat messages both ways and verify unread/read state and history after refresh.
7. Join voice from both browsers; test mute, leave, refresh, and denied microphone permission.
8. Switch between normal home, cozy evening, and date-night lighting and audio.
9. As Aldane, prepare the date, sit at the table, ask aloud, and select **Ask her now**.
10. As Santana, test **I want to talk to you first** and then the accepted response.
11. Refresh and confirm the accepted moment remains in memories.
12. Confirm Wren roams between the living and play areas, then settles near the children during couple moments and the date.
13. Test iPad portrait and landscape, including the joystick, camera drag, settings, drawers, and safe areas.

## External Names

Code, metadata, PWA labels, storage keys, channels, and local Supabase configuration use `Our Little Forever`, `Little Forever`, and `our-little-forever`.

These technical identifiers are intentionally unchanged:

- GitHub repository name
- Vercel project and production domain
- Supabase project reference
- database table names
- environment variable names

Rename external services manually only when you intend to change their URLs or integrations.

## Version 2

- Lightweight GLB avatar and furniture assets after iPad performance profiling.
- Richer long-form memory and letter authoring.
- A managed TURN service for more reliable voice across restrictive networks.
- More shared rooms after the first home remains stable under two-device testing.
- Optional synchronized ambient moments with properly licensed audio.
