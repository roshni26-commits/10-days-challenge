# Day 1 - Golden Todo (Supabase Auth + Tasks)

A modern Todo app built with Next.js and Supabase as part of the 10 Days Challenge (Day 1).

This project includes:
- Email/password authentication with Supabase
- Task CRUD operations connected to Supabase
- Search, edit, delete, and export task features
- Night mode UI
- Demo login flow

## Tech Stack

- Next.js 16 (Turbopack)
- React 19
- TypeScript
- Supabase (`@supabase/supabase-js`)
- Custom CSS (`app/todo.css`)

## Day 1 Implementations

### 1) Authentication (Supabase)

- Signup using email/password
- Login using email/password
- Logout via Supabase session
- Session restore on app load (`supabase.auth.getUser()`)
- Auth state listener (`onAuthStateChange`)
- Resend verification email support from login screen
- User metadata support (`username` stored in signup metadata)

### 2) Auth Error Handling Improvements

- Friendly messages for:
  - invalid credentials
  - email not confirmed
  - password too short
  - email rate limit
- Input normalization:
  - email -> trimmed + lowercase
  - password -> trimmed
- Validation to avoid username in email login field

### 3) Supabase Client Stability Fix

- Added singleton Supabase client in `lib/supabase.ts` to prevent duplicate GoTrue clients during HMR/dev refresh.
- Enabled auth options:
  - `persistSession`
  - `autoRefreshToken`
  - `detectSessionInUrl`

### 4) Task Management Features

- Create task with:
  - text
  - priority (low/medium/high)
  - due date
- Read tasks per logged-in user (`username` filter)
- Update task:
  - completion toggle
  - edit text/priority/due date
- Delete task
- Task search
- Export tasks as JSON
- Dashboard stats:
  - total tasks
  - completed tasks
  - progress percentage

### 5) UI/UX Enhancements

- Night mode with local persistence
- Notification toaster-style feedback
- Login / Signup / Dashboard page switching
- Demo mode with seeded demo tasks

### 6) Runtime/Tooling Fixes

- Handled extension-based MetaMask unhandled rejection noise to avoid runtime crash overlay in dev.
- Removed `pnpm-lock.yaml` so npm-only workflow does not trigger `pnpm is not recognized` lockfile patch errors.

## Project Structure

- `app/page.tsx` -> Main app logic (auth + task UI + dashboard)
- `app/layout.tsx` -> Root layout + analytics
- `lib/supabase.ts` -> Supabase client + auth helper functions
- `supabase-tasks-schema.sql` -> Tasks table + RLS + policies
- `.env` -> Supabase public URL and anon key

## Environment Variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Database Setup

Run the SQL from `supabase-tasks-schema.sql` in your Supabase SQL editor.

It creates:
- `public.tasks` table
- RLS enabled
- anon read/insert/update/delete policies

## Run Locally

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Authentication Notes

- If email confirmation is enabled in Supabase, new users must verify email before login.
- If confirmation mail is delayed:
  - use "Resend verification email" in login page
  - check Spam folder
  - verify Supabase Auth Email/SMTP settings

## Known Notes

- `supabase-tasks-schema.sql` currently allows broad anon policies (good for demo/learning).  
  For production, restrict policies by authenticated user ID.

## Day 1 Outcome

By the end of Day 1, the app is fully functional with Supabase-backed auth + task storage, improved error handling, and a polished Todo dashboard experience.
