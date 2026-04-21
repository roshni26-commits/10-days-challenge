# Day 4 - Golden Todo (Productionized Next.js + Supabase)

A production-focused upgrade of the Golden Todo app built in the 10 Days Challenge (Day 4).

This day expands the Day 3 app with app-router structure cleanup, metadata routes, reusable UI components, and better deployment/readiness defaults.

## Tech Stack

- Next.js 16 (App Router + Turbopack)
- React 19
- TypeScript
- Supabase (`@supabase/supabase-js`)
- Tailwind CSS + shadcn/ui components

## Day 4 Implementations

### 1) App Router + Project Structure Setup

- Added production-oriented Next.js app structure in `app/`
- Added `app/layout.tsx` with global providers
- Added global styles in `app/globals.css` and `styles/globals.css`
- Added reusable utility setup in `lib/utils.ts`

### 2) Supabase Authentication + User Task Isolation

- Email/password auth flow retained and integrated with Day 4 UI
- User session handling maintained through Supabase auth state
- Task access remains user-scoped through `user_id` and RLS-safe flow

### 3) Task Management Features (CRUD + UX)

- Task create/read/update/delete behavior integrated in Day 4 app flow
- Search, priority and due-date handling maintained
- Status toggling and edit/delete interactions included
- Export-ready task architecture preserved from earlier day work

### 4) API + SEO/Discovery Routes

- Added API handler at `app/api/route.ts`
- Added `app/robots.ts` for crawl rules
- Added `app/sitemap.ts` for sitemap generation
- Added `app/not-found.tsx` for proper missing-route UX

### 5) Design System Integration (shadcn/ui)

- Added `components/ui/*` based component library
- Added shared theme provider in `components/theme-provider.tsx`
- Added hooks for toast/mobile behavior in `hooks/` and `components/ui/`
- Improved consistency and scalability of UI building blocks

### 6) Project Configuration + Assets

- Added Next.js config (`next.config.mjs`) and TypeScript config (`tsconfig.json`)
- Added PostCSS and component config files
- Added app/public icons and placeholder assets
- Included schema reference in `supabase-tasks-schema.sql`

## Project Structure

- `app/page.tsx` -> Main app logic (auth + user-scoped task UI + dashboard)
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
- per-user insert/select/update/delete policies
- `updated_at` trigger function for automatic timestamp updates

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

## Day 4 Outcome

By the end of Day 4, the app is more production-ready with stronger app structure, metadata routes (`robots` + `sitemap`), reusable UI primitives, and a cleaner foundation for deployment while preserving secure user-scoped Supabase task management.
