# OpenRace Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight PWA for clock-based race timing at grassroots mountain bike events (enduro, DH, XC).

**Architecture:** Next.js 14 App Router PWA with Supabase backend (Postgres, Auth, Realtime). Local-first timing via IndexedDB sync queue. Unauthenticated volunteer links via token-scoped URLs.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Supabase (Auth + Postgres + Realtime), Zod, next-pwa, idb (IndexedDB wrapper)

**Spec:** `docs/superpowers/specs/2026-03-13-openrace-design.md`

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout, Supabase provider, PWA meta
│   ├── page.tsx                      # Landing / marketing page
│   ├── (auth)/
│   │   ├── login/page.tsx            # Organizer login
│   │   └── signup/page.tsx           # Organizer signup
│   ├── dashboard/
│   │   ├── layout.tsx                # Auth-protected layout
│   │   ├── page.tsx                  # Race list (organizer home)
│   │   ├── create/page.tsx           # Race setup wizard
│   │   └── [raceId]/
│   │       ├── page.tsx              # Race day dashboard
│   │       ├── edit/page.tsx         # Edit race details
│   │       └── riders/page.tsx       # Manage riders
│   ├── time/
│   │   └── [token]/page.tsx          # Volunteer timing screen (unauthenticated)
│   └── r/
│       ├── [shareCode]/page.tsx      # Public results - overall standings
│       └── [shareCode]/[riderId]/page.tsx  # Individual rider result
├── components/
│   ├── ui/                           # Reusable UI primitives (Button, Input, etc.)
│   ├── auth/
│   │   └── auth-form.tsx             # Login/signup form
│   ├── race/
│   │   ├── race-card.tsx             # Race card for dashboard list
│   │   ├── wizard/
│   │   │   ├── race-info-step.tsx    # Step 1: name, date, type, categories
│   │   │   ├── stages-step.tsx       # Step 2: add/edit stages
│   │   │   ├── riders-step.tsx       # Step 3: add/import riders
│   │   │   └── share-step.tsx        # Step 4: volunteer links + QR codes
│   │   └── dashboard/
│   │       ├── stage-status.tsx      # Stage sync status card
│   │       ├── rider-manager.tsx     # Day-of rider add/edit
│   │       └── time-corrections.tsx  # Manual time entry/correction
│   ├── timing/
│   │   ├── timing-screen.tsx         # Main timing screen container
│   │   ├── capture-button.tsx        # The big FINISH/START button
│   │   ├── rider-assign.tsx          # Rider assignment prompt + quick-picks
│   │   ├── rapid-mode.tsx            # Rapid mode unassigned time cards
│   │   ├── recent-captures.tsx       # Recent captures list
│   │   └── connection-status.tsx     # Online/offline/syncing indicator
│   └── results/
│       ├── standings-table.tsx       # Overall standings grid
│       ├── category-tabs.tsx         # Category filter tabs
│       ├── rider-detail.tsx          # Individual rider breakdown
│       └── results-header.tsx        # Race name, date, status badge
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   ├── server.ts                 # Server-side Supabase client
│   │   ├── middleware.ts             # Auth middleware for protected routes
│   │   └── types.ts                  # Generated database types
│   ├── db/
│   │   ├── races.ts                  # Race CRUD operations
│   │   ├── stages.ts                 # Stage CRUD operations
│   │   ├── riders.ts                 # Rider CRUD operations
│   │   ├── time-records.ts           # TimeRecord operations
│   │   └── results.ts               # Result computation queries
│   ├── sync/
│   │   ├── indexed-db.ts             # IndexedDB schema + operations
│   │   ├── sync-queue.ts             # Offline sync queue logic
│   │   └── connection-monitor.ts     # Online/offline detection
│   ├── timing/
│   │   └── capture.ts               # Timestamp capture logic
│   ├── utils/
│   │   ├── device-id.ts             # Device UUID generation/persistence
│   │   ├── tokens.ts                # High-entropy token generation
│   │   ├── time-format.ts           # Time display formatting (ms → 4:23.1)
│   │   └── csv-import.ts            # CSV rider import parser
│   └── validators/
│       ├── race.ts                   # Race Zod schemas
│       ├── rider.ts                  # Rider Zod schemas
│       └── time-record.ts           # TimeRecord Zod schemas
├── hooks/
│   ├── use-supabase.ts              # Supabase client hook
│   ├── use-timing.ts                # Timing capture + local storage hook
│   ├── use-sync.ts                  # Sync queue hook
│   ├── use-riders.ts                # Rider list with realtime updates
│   └── use-connection-status.ts     # Online/offline status hook
└── middleware.ts                     # Next.js middleware (auth redirect)

supabase/
├── migrations/
│   ├── 001_create_races.sql
│   ├── 002_create_stages.sql
│   ├── 003_create_riders.sql
│   ├── 004_create_time_records.sql
│   ├── 005_create_results_views.sql
│   └── 006_row_level_security.sql
└── seed.sql                          # Dev seed data

public/
├── manifest.json                     # PWA manifest
├── sw.js                             # Service worker (generated by next-pwa)
└── icons/                            # PWA icons
```

---

## Chunk 1: Project Setup + Database + Auth

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Create Next.js app with TypeScript + Tailwind**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

- [ ] **Step 2: Install dependencies**

```bash
pnpm add @supabase/supabase-js @supabase/ssr zod idb qrcode.react
pnpm add -D supabase @types/node vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2b: Create vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`

- [ ] **Step 2c: Create `.env.example`**

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 3: Create `.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: initialize Next.js project with dependencies"
```

### Task 2: Supabase Database Schema

**Files:**
- Create: `supabase/migrations/001_create_races.sql`
- Create: `supabase/migrations/002_create_stages.sql`
- Create: `supabase/migrations/003_create_riders.sql`
- Create: `supabase/migrations/004_create_time_records.sql`
- Create: `supabase/migrations/005_create_results_views.sql`
- Create: `supabase/migrations/006_row_level_security.sql`

- [ ] **Step 1: Write races table migration**

```sql
-- 001_create_races.sql
create type race_type as enum ('enduro', 'dh', 'xc');
create type race_status as enum ('draft', 'active', 'complete');
create type rider_id_mode as enum ('name_only', 'bib_only', 'both');

create table races (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  type race_type not null,
  location text,
  organizer_id uuid not null references auth.users(id) on delete cascade,
  categories jsonb not null default '[]'::jsonb,
  rider_id_mode rider_id_mode not null default 'both',
  status race_status not null default 'draft',
  share_code text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_races_organizer on races(organizer_id);
create index idx_races_share_code on races(share_code);
```

- [ ] **Step 2: Write stages table migration**

```sql
-- 002_create_stages.sql
create table stages (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references races(id) on delete cascade,
  name text not null,
  "order" integer not null,
  distance real,
  elevation real,
  start_token text unique not null,
  finish_token text unique not null,
  created_at timestamptz not null default now()
);

create index idx_stages_race on stages(race_id);
-- Note: unique indexes on start_token/finish_token are implicit from the UNIQUE column constraint
```

- [ ] **Step 3: Write riders table migration**

```sql
-- 003_create_riders.sql
create type gender_type as enum ('male', 'female', 'non_binary');

create table riders (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references races(id) on delete cascade,
  name text not null,
  bib text,
  category text not null,
  age integer,
  gender gender_type not null,
  created_at timestamptz not null default now()
);

create index idx_riders_race on riders(race_id);
```

- [ ] **Step 4: Write time_records table migration**

Note: The spec's `synced` field is IndexedDB-only (not in Postgres). Records in Supabase are by definition synced.

```sql
-- 004_create_time_records.sql
create type time_record_type as enum ('start', 'finish');

create table time_records (
  id uuid primary key,
  stage_id uuid not null references stages(id) on delete cascade,
  rider_id uuid references riders(id) on delete set null,
  timestamp bigint not null,
  type time_record_type not null,
  device_id text not null,
  created_at timestamptz not null default now()
);

create index idx_time_records_stage on time_records(stage_id);
create index idx_time_records_rider on time_records(rider_id);
create index idx_time_records_stage_type on time_records(stage_id, type);
```

- [ ] **Step 5: Write results views migration**

```sql
-- 005_create_results_views.sql
-- Use DISTINCT ON to handle duplicate time records per rider+stage+type
-- (e.g., corrections). Takes the most recent record by created_at.
create or replace view stage_results as
with deduped_starts as (
  select distinct on (rider_id, stage_id)
    id, rider_id, stage_id, timestamp
  from time_records
  where type = 'start' and rider_id is not null
  order by rider_id, stage_id, created_at desc
),
deduped_finishes as (
  select distinct on (rider_id, stage_id)
    id, rider_id, stage_id, timestamp
  from time_records
  where type = 'finish' and rider_id is not null
  order by rider_id, stage_id, created_at desc
)
select
  r.id as rider_id,
  s.id as stage_id,
  s.race_id,
  ds.timestamp as start_time,
  df.timestamp as finish_time,
  case
    when ds.id is null then 'dns'
    when df.id is null then 'dnf'
    else 'ok'
  end as status,
  case
    when ds.id is not null and df.id is not null
    then df.timestamp - ds.timestamp
    else null
  end as elapsed_ms
from riders r
join stages s on s.race_id = r.race_id
left join deduped_starts ds on ds.rider_id = r.id and ds.stage_id = s.id
left join deduped_finishes df on df.rider_id = r.id and df.stage_id = s.id;

create or replace view race_results as
with totals as (
  select
    sr.rider_id,
    sr.race_id,
    case
      when bool_or(sr.status != 'ok') then null
      else sum(sr.elapsed_ms)
    end as total_time_ms,
    jsonb_agg(
      jsonb_build_object(
        'stage_id', sr.stage_id,
        'elapsed_ms', sr.elapsed_ms,
        'status', sr.status
      ) order by s."order", s.id
    ) as stage_results,
    bool_or(sr.status != 'ok') as has_dnf
  from stage_results sr
  join stages s on s.id = sr.stage_id
  group by sr.rider_id, sr.race_id
)
select
  t.*,
  rd.category,
  row_number() over (
    order by t.has_dnf asc, t.total_time_ms asc nulls last
  ) as overall_rank,
  row_number() over (
    partition by rd.category
    order by t.has_dnf asc, t.total_time_ms asc nulls last
  ) as category_rank
from totals t
join riders rd on rd.id = t.rider_id;
```

- [ ] **Step 6: Write RLS policies migration**

```sql
-- 006_row_level_security.sql
alter table races enable row level security;
alter table stages enable row level security;
alter table riders enable row level security;
alter table time_records enable row level security;

-- Races: organizers manage their own, anyone can read active/complete
create policy "Organizers manage own races" on races
  for all using (auth.uid() = organizer_id);

create policy "Public reads active/complete races" on races
  for select using (status in ('active', 'complete'));

-- Stages: inherit race access
create policy "Organizers manage stages via race" on stages
  for all using (
    exists (select 1 from races where races.id = stages.race_id and races.organizer_id = auth.uid())
  );

create policy "Public reads stages of active races" on stages
  for select using (
    exists (select 1 from races where races.id = stages.race_id and status in ('active', 'complete'))
  );

-- Riders: inherit race access
create policy "Organizers manage riders via race" on riders
  for all using (
    exists (select 1 from races where races.id = riders.race_id and races.organizer_id = auth.uid())
  );

create policy "Public reads riders of active races" on riders
  for select using (
    exists (select 1 from races where races.id = riders.race_id and status in ('active', 'complete'))
  );

-- Time records: anyone can insert (volunteers), organizers manage, public reads active
create policy "Anyone inserts time records for active races" on time_records
  for insert with check (
    exists (
      select 1 from stages s
      join races r on r.id = s.race_id
      where s.id = stage_id and r.status = 'active'
    )
  );

create policy "Organizers manage time records" on time_records
  for all using (
    exists (
      select 1 from stages s
      join races r on r.id = s.race_id
      where s.id = stage_id and r.organizer_id = auth.uid()
    )
  );

create policy "Public reads time records of active races" on time_records
  for select using (
    exists (
      select 1 from stages s
      join races r on r.id = s.race_id
      where s.id = stage_id and r.status in ('active', 'complete')
    )
  );
```

- [ ] **Step 7: Apply migrations**

```bash
supabase db push
```

- [ ] **Step 8: Generate TypeScript types**

```bash
pnpm supabase gen types typescript --project-id your-project-id > src/lib/supabase/types.ts
```

- [ ] **Step 9: Commit**

```bash
git add supabase/ src/lib/supabase/types.ts && git commit -m "feat: add database schema with RLS policies"
```

### Task 3: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Write browser Supabase client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Write server Supabase client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Write auth middleware**

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

- [ ] **Step 4: Write Next.js middleware**

```typescript
// src/middleware.ts
import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts && git commit -m "feat: add Supabase client setup and auth middleware"
```

### Task 4: Auth Pages

**Files:**
- Create: `src/components/auth/auth-form.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/(auth)/auth/callback/route.ts`

- [ ] **Step 1: Write auth form component**

Client component (`'use client'`). Props: `mode: 'login' | 'signup'`. Controlled form with email + password fields. Uses `createClient()` from `@/lib/supabase/client`. On submit:
- Login: `supabase.auth.signInWithPassword({ email, password })` → redirect to `/dashboard` via `router.push`
- Signup: `supabase.auth.signUp({ email, password, options: { emailRedirectTo: '/auth/callback' } })` → show "Check your email" message
- Error: display error message inline below form (e.g., "Invalid credentials")
- Loading: disable submit button, show spinner

- [ ] **Step 2: Write login page**

Server component that renders `<AuthForm mode="login" />`.

- [ ] **Step 3: Write signup page**

Server component that renders `<AuthForm mode="signup" />`.

- [ ] **Step 4: Write auth callback route**

```typescript
// src/app/(auth)/auth/callback/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/ src/app/\(auth\)/ && git commit -m "feat: add auth pages (login, signup, callback)"
```

### Task 5: Zod Validators

**Files:**
- Create: `src/lib/validators/race.ts`
- Create: `src/lib/validators/rider.ts`
- Create: `src/lib/validators/time-record.ts`

- [ ] **Step 1: Write race validators**

```typescript
// src/lib/validators/race.ts
import { z } from 'zod'

export const raceTypeSchema = z.enum(['enduro', 'dh', 'xc'])
export const raceStatusSchema = z.enum(['draft', 'active', 'complete'])
export const riderIdModeSchema = z.enum(['name_only', 'bib_only', 'both'])

export const createRaceSchema = z.object({
  name: z.string().min(1).max(200),
  date: z.string().date(),
  type: raceTypeSchema,
  location: z.string().max(500).optional(),
  categories: z.array(z.string().min(1)).min(1),
  rider_id_mode: riderIdModeSchema,
})

export const createStageSchema = z.object({
  name: z.string().min(1).max(200),
  order: z.number().int().min(0),
  distance: z.number().positive().optional(),
  elevation: z.number().positive().optional(),
})

export type CreateRaceInput = z.infer<typeof createRaceSchema>
export type CreateStageInput = z.infer<typeof createStageSchema>
```

- [ ] **Step 2: Write rider validators**

```typescript
// src/lib/validators/rider.ts
import { z } from 'zod'

export const genderSchema = z.enum(['male', 'female', 'non_binary'])

export const createRiderSchema = z.object({
  name: z.string().min(1).max(200),
  bib: z.string().max(20).optional(),
  category: z.string().min(1),
  age: z.number().int().min(0).max(150).optional(),
  gender: genderSchema,
})

export type CreateRiderInput = z.infer<typeof createRiderSchema>
```

- [ ] **Step 3: Write time record validators**

```typescript
// src/lib/validators/time-record.ts
import { z } from 'zod'

export const timeRecordTypeSchema = z.enum(['start', 'finish'])

export const createTimeRecordSchema = z.object({
  id: z.string().uuid(),
  stage_id: z.string().uuid(),
  rider_id: z.string().uuid().nullable(),
  timestamp: z.number().int().positive(),
  type: timeRecordTypeSchema,
  device_id: z.string().uuid(),
})

export const assignRiderSchema = z.object({
  time_record_id: z.string().uuid(),
  rider_id: z.string().uuid(),
})

export type CreateTimeRecordInput = z.infer<typeof createTimeRecordSchema>
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/validators/ && git commit -m "feat: add Zod validation schemas"
```

### Task 6: Utility Functions

**Files:**
- Create: `src/lib/utils/device-id.ts`
- Create: `src/lib/utils/tokens.ts`
- Create: `src/lib/utils/time-format.ts`
- Test: `src/lib/utils/__tests__/time-format.test.ts`
- Test: `src/lib/utils/__tests__/tokens.test.ts`

- [ ] **Step 1: Write device-id utility**

```typescript
// src/lib/utils/device-id.ts
const DEVICE_ID_KEY = 'openrace_device_id'

export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getDeviceId must be called in browser')
  }

  const existing = localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing

  const id = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_KEY, id)
  return id
}
```

- [ ] **Step 2: Write token generation utility**

```typescript
// src/lib/utils/tokens.ts
export function generateToken(length = 24): string {
  const array = new Uint8Array(Math.ceil(length * 3 / 4))
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

export function generateShareCode(raceName: string): string {
  const prefix = raceName
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase()
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `${prefix}${suffix}`
}
```

- [ ] **Step 3: Write time formatting utility**

```typescript
// src/lib/utils/time-format.ts
export function formatElapsedMs(ms: number): string {
  if (ms < 0) return '--:--'

  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) {
    return `${seconds.toFixed(1)}s`
  }

  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`
}

export function formatTimestamp(ms: number): string {
  const date = new Date(ms)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const secs = date.getSeconds().toString().padStart(2, '0')
  const millis = date.getMilliseconds().toString().padStart(3, '0')
  return `${hours}:${minutes}:${secs}.${millis}`
}
```

- [ ] **Step 4: Write tests for time-format**

```typescript
// src/lib/utils/__tests__/time-format.test.ts
import { formatElapsedMs, formatTimestamp } from '../time-format'

describe('formatElapsedMs', () => {
  it('formats sub-minute times', () => {
    expect(formatElapsedMs(23100)).toBe('23.1s')
  })

  it('formats multi-minute times', () => {
    expect(formatElapsedMs(263100)).toBe('4:23.1')
  })

  it('pads seconds under 10', () => {
    expect(formatElapsedMs(605200)).toBe('10:05.2')
  })

  it('handles negative values', () => {
    expect(formatElapsedMs(-1)).toBe('--:--')
  })
})
```

- [ ] **Step 5: Write tests for tokens**

```typescript
// src/lib/utils/__tests__/tokens.test.ts
import { generateToken, generateShareCode } from '../tokens'

describe('generateToken', () => {
  it('generates tokens of specified length', () => {
    expect(generateToken(24)).toHaveLength(24)
  })

  it('generates unique tokens', () => {
    const a = generateToken()
    const b = generateToken()
    expect(a).not.toBe(b)
  })

  it('only contains hex characters', () => {
    expect(generateToken(24)).toMatch(/^[0-9a-f]{24}$/)
  })
})

describe('generateShareCode', () => {
  it('creates code from race name', () => {
    const code = generateShareCode('Purgatory Enduro 2026')
    expect(code).toMatch(/^PURG[A-Z0-9]{3}$/)
  })
})
```

- [ ] **Step 6: Run tests**

```bash
pnpm test src/lib/utils/__tests__/
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/utils/ && git commit -m "feat: add utility functions (device-id, tokens, time-format)"
```

### Task 7: Database Operations Layer

**Files:**
- Create: `src/lib/db/races.ts`
- Create: `src/lib/db/stages.ts`
- Create: `src/lib/db/riders.ts`
- Create: `src/lib/db/time-records.ts`
- Create: `src/lib/db/results.ts`

- [ ] **Step 1: Write race DB operations**

All functions accept a Supabase client as first parameter, return typed data.

```typescript
// src/lib/db/races.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { CreateRaceInput } from '@/lib/validators/race'

type Race = Database['public']['Tables']['races']['Row']

export async function createRace(
  supabase: SupabaseClient<Database>,
  input: CreateRaceInput,
  organizerId: string
): Promise<Race> // generates share_code via generateShareCode(), inserts, returns

export async function getRacesByOrganizer(
  supabase: SupabaseClient<Database>,
  organizerId: string
): Promise<Race[]> // ordered by date desc

export async function getRaceByShareCode(
  supabase: SupabaseClient<Database>,
  shareCode: string
): Promise<Race | null>

export async function getRaceById(
  supabase: SupabaseClient<Database>,
  raceId: string
): Promise<Race | null>

export async function updateRaceStatus(
  supabase: SupabaseClient<Database>,
  raceId: string,
  status: 'draft' | 'active' | 'complete'
): Promise<Race>
```

- [ ] **Step 2: Write stage DB operations**

```typescript
// src/lib/db/stages.ts
type Stage = Database['public']['Tables']['stages']['Row']

export async function createStage(
  supabase: SupabaseClient<Database>,
  raceId: string,
  input: CreateStageInput
): Promise<Stage> // generates start_token + finish_token via generateToken()

export async function getStagesByRace(
  supabase: SupabaseClient<Database>,
  raceId: string
): Promise<Stage[]> // ordered by "order"

export async function getStageByToken(
  supabase: SupabaseClient<Database>,
  token: string
): Promise<{ stage: Stage; role: 'start' | 'finish'; race: Race } | null>
// checks both start_token and finish_token columns

export async function reorderStages(
  supabase: SupabaseClient<Database>,
  stageIds: string[] // new order
): Promise<void>
```

- [ ] **Step 3: Write rider DB operations**

```typescript
// src/lib/db/riders.ts
type Rider = Database['public']['Tables']['riders']['Row']

export async function createRider(
  supabase: SupabaseClient<Database>,
  raceId: string,
  input: CreateRiderInput
): Promise<Rider>

export async function createRidersBatch(
  supabase: SupabaseClient<Database>,
  raceId: string,
  inputs: CreateRiderInput[]
): Promise<Rider[]>

export async function getRidersByRace(
  supabase: SupabaseClient<Database>,
  raceId: string
): Promise<Rider[]>

export async function updateRider(
  supabase: SupabaseClient<Database>,
  riderId: string,
  input: Partial<CreateRiderInput>
): Promise<Rider>

export async function deleteRider(
  supabase: SupabaseClient<Database>,
  riderId: string
): Promise<void>
```

- [ ] **Step 4: Write time record DB operations**

```typescript
// src/lib/db/time-records.ts
type TimeRecord = Database['public']['Tables']['time_records']['Row']

export async function upsertTimeRecord(
  supabase: SupabaseClient<Database>,
  input: CreateTimeRecordInput
): Promise<TimeRecord> // upserts by id (UUID), deduplicates retries

export async function assignRider(
  supabase: SupabaseClient<Database>,
  timeRecordId: string,
  riderId: string
): Promise<TimeRecord>

export async function getTimeRecordsByStage(
  supabase: SupabaseClient<Database>,
  stageId: string,
  type?: 'start' | 'finish'
): Promise<TimeRecord[]>

export async function getUnassignedByStage(
  supabase: SupabaseClient<Database>,
  stageId: string
): Promise<TimeRecord[]> // where rider_id is null
```

- [ ] **Step 5: Write results DB operations**

```typescript
// src/lib/db/results.ts
interface StageResultRow {
  rider_id: string; stage_id: string; race_id: string
  start_time: number | null; finish_time: number | null
  elapsed_ms: number | null; status: 'ok' | 'dns' | 'dnf'
}

interface RaceResultRow {
  rider_id: string; race_id: string; category: string
  total_time_ms: number | null; stage_results: object[]
  has_dnf: boolean; overall_rank: number; category_rank: number
  rider_name: string; rider_bib: string | null
}

interface FastestSplits {
  [category: string]: { [stageId: string]: number } // fastest elapsed_ms per category+stage
}

export async function getStageResults(
  supabase: SupabaseClient<Database>,
  stageId: string
): Promise<StageResultRow[]>

export async function getRaceResults(
  supabase: SupabaseClient<Database>,
  raceId: string
): Promise<{ results: RaceResultRow[]; fastestSplits: FastestSplits }>
// Queries race_results view (which includes ranking via window functions)
// Computes fastestSplits by iterating stage_results and finding min elapsed_ms per category+stage

export async function getRiderResult(
  supabase: SupabaseClient<Database>,
  raceId: string,
  riderId: string
): Promise<{ result: RaceResultRow; stageDetails: StageResultRow[] } | null>
// Returns the rider's overall result plus per-stage breakdown with category rank per stage
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/ && git commit -m "feat: add database operation functions"
```

---

## Chunk 2: Race Setup Wizard (Organizer)

### Task 8: Dashboard Layout + Race List

**Files:**
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/race/race-card.tsx`

- [ ] **Step 1: Write dashboard layout**

Auth-protected layout. Fetches user server-side. Top nav with "OpenRace" logo, user email, sign out button. Main content area.

- [ ] **Step 2: Write race card component**

Displays race name, date, type badge, status badge, rider count. Links to race dashboard.

- [ ] **Step 3: Write dashboard page**

Server component. Fetches organizer's races via `getRacesByOrganizer`. Renders grid of `RaceCard` components. "Create Race" button links to `/dashboard/create`. Empty state for new users.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/ src/components/race/race-card.tsx && git commit -m "feat: add organizer dashboard with race list"
```

### Task 9: Race Setup Wizard — Step 1 (Race Info)

**Files:**
- Create: `src/app/dashboard/create/page.tsx`
- Create: `src/components/race/wizard/race-info-step.tsx`

- [ ] **Step 1: Write wizard page with step state**

Client component. Manages wizard state (current step 1-4, accumulated form data). Renders the appropriate step component.

- [ ] **Step 2: Write race info step**

Form fields: name (text), date (date picker), type (3 toggle buttons: Enduro/DH/XC), categories (chip input — add/remove), rider ID mode (3 toggle buttons: Names Only/Bibs/Both). Validates with `createRaceSchema`. "Next" button advances to step 2.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/create/ src/components/race/wizard/ && git commit -m "feat: add race setup wizard step 1 (race info)"
```

### Task 10: Race Setup Wizard — Step 2 (Stages)

**Files:**
- Create: `src/components/race/wizard/stages-step.tsx`

- [ ] **Step 1: Write stages step**

For enduro: list of stages with name, optional distance/elevation. Add/remove/reorder stages. For DH/XC: single stage auto-created, just name + optional details. Validates with `createStageSchema`. "Next" button.

- [ ] **Step 2: Commit**

```bash
git add src/components/race/wizard/stages-step.tsx && git commit -m "feat: add race setup wizard step 2 (stages)"
```

### Task 11: Race Setup Wizard — Step 3 (Riders)

**Files:**
- Create: `src/components/race/wizard/riders-step.tsx`
- Create: `src/lib/utils/csv-import.ts`
- Test: `src/lib/utils/__tests__/csv-import.test.ts`

- [ ] **Step 1: Write CSV import tests first (TDD: RED)**

```typescript
// src/lib/utils/__tests__/csv-import.test.ts
import { parseRiderCsv } from '../csv-import'

describe('parseRiderCsv', () => {
  it('parses valid CSV with all fields', () => {
    const csv = 'name,bib,category,gender,age\nJeff,12,Expert Men,male,35'
    const result = parseRiderCsv(csv)
    expect(result.riders).toHaveLength(1)
    expect(result.riders[0]).toEqual({
      name: 'Jeff', bib: '12', category: 'Expert Men', gender: 'male', age: 35
    })
    expect(result.errors).toHaveLength(0)
  })

  it('handles missing optional fields', () => {
    const csv = 'name,category,gender\nBob,Sport Men,male'
    const result = parseRiderCsv(csv)
    expect(result.riders[0].bib).toBeUndefined()
    expect(result.riders[0].age).toBeUndefined()
  })

  it('returns errors for invalid rows', () => {
    const csv = 'name,category,gender\n,,\nJeff,Expert Men,male'
    const result = parseRiderCsv(csv)
    expect(result.riders).toHaveLength(1)
    expect(result.errors).toHaveLength(1)
  })

  it('detects headers and trims whitespace', () => {
    const csv = '  name , category , gender \n Jeff , Sport Men , male '
    const result = parseRiderCsv(csv)
    expect(result.riders[0].name).toBe('Jeff')
  })

  it('skips empty rows', () => {
    const csv = 'name,category,gender\nJeff,Expert Men,male\n\n\nBob,Sport Men,male'
    const result = parseRiderCsv(csv)
    expect(result.riders).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail (TDD: RED)**

```bash
pnpm test src/lib/utils/__tests__/csv-import.test.ts
```
Expected: FAIL — `parseRiderCsv` not defined

- [ ] **Step 3: Write CSV import parser (TDD: GREEN)**

Parses CSV text into rider objects. Expects columns: name, bib (optional), category, gender, age (optional). Handles header detection, trimming, empty rows. Returns `{ riders: CreateRiderInput[], errors: string[] }`.

- [ ] **Step 4: Run tests to verify they pass (TDD: GREEN)**

```bash
pnpm test src/lib/utils/__tests__/csv-import.test.ts
```
Expected: PASS

- [ ] **Step 4: Write riders step component**

Two modes: manual entry (form per rider with name, bib, category dropdown from race categories, gender, age) and CSV paste (textarea + parse button). Rider list displayed as editable table. Category dropdown options come from step 1 data. "Next" button.

- [ ] **Step 5: Commit**

```bash
git add src/components/race/wizard/riders-step.tsx src/lib/utils/csv-import.ts src/lib/utils/__tests__/csv-import.test.ts && git commit -m "feat: add race setup wizard step 3 (riders + CSV import)"
```

### Task 12: Race Setup Wizard — Step 4 (Share) + Submit

**Files:**
- Create: `src/components/race/wizard/share-step.tsx`
- Create: `src/app/dashboard/create/actions.ts`

- [ ] **Step 1: Write server action for race creation**

```typescript
// src/app/dashboard/create/actions.ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createRace } from '@/lib/db/races'
import { createStage } from '@/lib/db/stages'
import { createRidersBatch } from '@/lib/db/riders'
import { createRaceSchema, createStageSchema } from '@/lib/validators/race'
import { createRiderSchema } from '@/lib/validators/rider'

export async function createRaceAction(formData: {
  race: CreateRaceInput
  stages: CreateStageInput[]
  riders: CreateRiderInput[]
}) // validates all inputs → creates race → creates stages → creates riders → returns race with stages
```

- [ ] **Step 2: Write share step component**

On reaching step 4, the wizard calls `createRaceAction` with all accumulated data. On success, displays: volunteer links per stage (start + finish) with copy buttons, public results URL, QR codes for all links (using `qrcode.react`). "Go to Dashboard" button.

- [ ] **Step 3: Verify wizard works end-to-end**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/race/wizard/share-step.tsx src/app/dashboard/create/actions.ts && git commit -m "feat: add race setup wizard step 4 (share links + QR codes)"
```

### Task 13: Race Day Dashboard

**Files:**
- Create: `src/app/dashboard/[raceId]/page.tsx`
- Create: `src/components/race/dashboard/stage-status.tsx`
- Create: `src/components/race/dashboard/rider-manager.tsx`
- Create: `src/components/race/dashboard/time-corrections.tsx`

- [ ] **Step 1: Write race dashboard page**

Server component. Fetches race + stages + riders + time records. Shows: race name/status header with publish toggle, stage status cards, rider management panel, time corrections panel. Links to share step for volunteer URLs.

- [ ] **Step 2: Write stage status component**

Per-stage card showing: stage name, number of start/finish times captured, number of unassigned times, sync status indicator. Copy buttons for volunteer links.

- [ ] **Step 3: Write rider manager component**

Client component. Add rider form (day-of registration). Rider list with edit/delete. Mark riders DNS/DNF per stage via dropdown.

- [ ] **Step 4: Write time corrections component**

Client component. Manual time entry form (select stage, rider, type, enter timestamp). List of all time records for a stage with ability to reassign rider or delete. Flags potential duplicates (same device, <500ms apart).

- [ ] **Step 5: Write dashboard server actions**

```typescript
// src/app/dashboard/[raceId]/actions.ts
'use server'

export async function updateRaceStatusAction(raceId: string, status: 'draft' | 'active' | 'complete'): Promise<void>
// Updates race status. 'active' makes volunteer links functional. 'complete' finalizes results.

export async function addRiderAction(raceId: string, input: CreateRiderInput): Promise<Rider>
// Day-of registration

export async function updateTimeRecordAction(timeRecordId: string, updates: { rider_id?: string }): Promise<void>
// Reassign rider on a time record

export async function createManualTimeRecordAction(input: CreateTimeRecordInput): Promise<void>
// Manual time entry by organizer
```

- [ ] **Step 6: Verify build**

```bash
pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/\[raceId\]/ src/components/race/dashboard/ && git commit -m "feat: add race day dashboard with stage status, rider management, time corrections"
```

---

## Chunk 3: Volunteer Timing + Offline Sync

### Task 14: IndexedDB Schema + Operations

**Files:**
- Create: `src/lib/sync/indexed-db.ts`
- Test: `src/lib/sync/__tests__/indexed-db.test.ts`

- [ ] **Step 1: Write IndexedDB tests first (TDD: RED)**

Test: save and retrieve time records, mark synced, filter unsynced, update rider assignment, cache and retrieve riders.

- [ ] **Step 2: Run tests to verify they fail (TDD: RED)**

```bash
pnpm test src/lib/sync/__tests__/indexed-db.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write IndexedDB schema and operations (TDD: GREEN)**

Using `idb` library. Database `openrace` with object stores:
- `time_records` — keyed by UUID, indexed by `stage_id`, `synced`
- `riders_cache` — keyed by rider UUID, indexed by `race_id` (local cache of rider list)

Operations: `saveTimeRecord`, `getUnsyncedRecords`, `markSynced`, `getAllForStage`, `updateRiderId`, `cacheRiders`, `getCachedRiders`.

- [ ] **Step 4: Run tests to verify they pass (TDD: GREEN)**

```bash
pnpm test src/lib/sync/__tests__/indexed-db.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/sync/indexed-db.ts src/lib/sync/__tests__/ && git commit -m "feat: add IndexedDB schema and operations"
```

### Task 15: Sync Queue

**Files:**
- Create: `src/lib/sync/sync-queue.ts`
- Create: `src/lib/sync/connection-monitor.ts`
- Test: `src/lib/sync/__tests__/sync-queue.test.ts`

- [ ] **Step 1: Write connection monitor**

```typescript
// src/lib/sync/connection-monitor.ts
type ConnectionState = 'online' | 'offline' | 'syncing'
type Listener = (state: ConnectionState) => void

export function createConnectionMonitor() {
  let state: ConnectionState = navigator.onLine ? 'online' : 'offline'
  const listeners: Set<Listener> = new Set()

  function notify(newState: ConnectionState) {
    state = newState
    for (const listener of listeners) {
      listener(state)
    }
  }

  window.addEventListener('online', () => notify('online'))
  window.addEventListener('offline', () => notify('offline'))

  return {
    getState: () => state,
    setSyncing: () => notify('syncing'),
    setDone: () => notify(navigator.onLine ? 'online' : 'offline'),
    subscribe: (listener: Listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
```

- [ ] **Step 2: Write sync queue**

Manages flushing unsynced IndexedDB records to Supabase. On `online` event, pulls all unsynced records, batches them (max 50 records per upsert call), upserts to Supabase `time_records` table, marks as synced in IndexedDB. Also pulls latest rider list and caches it in IndexedDB. Exposes `pendingCount` and `flush()` method. Retries with exponential backoff on failure (initial: 1s, max: 30s, max retries: 5).

Note: Connection monitor uses mutable internal state — this is acceptable for an event-driven pub/sub pattern where immutability adds complexity without benefit.

- [ ] **Step 3: Write sync queue tests**

Test: queues records when offline, flushes on online, marks synced after successful push, retries on failure, deduplication via upsert.

- [ ] **Step 4: Run tests**

```bash
pnpm test src/lib/sync/__tests__/sync-queue.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/sync/ && git commit -m "feat: add sync queue with connection monitoring"
```

### Task 16: Timing Capture Logic

**Files:**
- Create: `src/lib/timing/capture.ts`
- Test: `src/lib/timing/__tests__/capture.test.ts`

- [ ] **Step 1: Write capture logic**

```typescript
// src/lib/timing/capture.ts
import { getDeviceId } from '@/lib/utils/device-id'
import type { CreateTimeRecordInput } from '@/lib/validators/time-record'

export function captureTimestamp(
  stageId: string,
  type: 'start' | 'finish'
): CreateTimeRecordInput {
  return {
    id: crypto.randomUUID(),
    stage_id: stageId,
    rider_id: null,
    timestamp: Date.now(),
    type,
    device_id: getDeviceId(),
  }
}
```

- [ ] **Step 2: Write tests**

Test: creates record with UUID, correct stage and type, null rider_id, timestamp is recent, device_id is consistent.

- [ ] **Step 3: Run tests**

```bash
pnpm test src/lib/timing/__tests__/capture.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/timing/ && git commit -m "feat: add timestamp capture logic"
```

### Task 17: Timing React Hooks

**Files:**
- Create: `src/hooks/use-timing.ts`
- Create: `src/hooks/use-sync.ts`
- Create: `src/hooks/use-connection-status.ts`
- Create: `src/hooks/use-riders.ts`

- [ ] **Step 1: Write use-timing hook**

Manages timing captures for a stage. `capture()` creates a TimeRecord, saves to IndexedDB, triggers sync. `assignRider(recordId, riderId)` updates the record. `records` returns all captures for this stage from IndexedDB. `unassignedCount` returns count of null rider_id records.

- [ ] **Step 2: Write use-sync hook**

Initializes sync queue and connection monitor. Exposes `pendingCount`, `connectionState`, `flush()`. Auto-flushes on online event.

- [ ] **Step 3: Write use-connection-status hook**

Simple hook wrapping the connection monitor. Returns `'online' | 'offline' | 'syncing'` and `pendingCount`.

- [ ] **Step 4: Write use-riders hook**

Fetches rider list from Supabase (when online) or IndexedDB cache (when offline). Subscribes to Supabase Realtime for rider inserts/updates on the race's rider table. Returns `riders`, `loading`, `getRiderById`.

- [ ] **Step 5: Write hook tests**

```typescript
// src/hooks/__tests__/use-timing.test.ts
// Test: capture() creates TimeRecord and saves to IndexedDB
// Test: assignRider() updates rider_id on record
// Test: unassignedCount reflects null rider_id records
// Test: records returns all captures for the stage

// src/hooks/__tests__/use-connection-status.test.ts
// Test: returns 'online' when navigator.onLine is true
// Test: returns 'offline' when navigator.onLine is false
// Test: returns pendingCount from sync queue
```

- [ ] **Step 6: Run hook tests**

```bash
pnpm test src/hooks/__tests__/
```

- [ ] **Step 7: Commit**

```bash
git add src/hooks/ && git commit -m "feat: add timing, sync, and rider hooks"
```

### Task 18: Volunteer Timing Screen

**Files:**
- Create: `src/app/time/[token]/page.tsx`
- Create: `src/components/timing/timing-screen.tsx`
- Create: `src/components/timing/capture-button.tsx`
- Create: `src/components/timing/rider-assign.tsx`
- Create: `src/components/timing/rapid-mode.tsx`
- Create: `src/components/timing/recent-captures.tsx`
- Create: `src/components/timing/connection-status.tsx`

- [ ] **Step 1: Write timing page (server component)**

Looks up stage by token via `getStageByToken` (defined in `src/lib/db/stages.ts`, Task 7 Step 2). Determines role (start/finish) from which token matched. Fetches race info for context. Passes stage, role, race, and riders to client `TimingScreen`. Returns 404 if token not found.

- [ ] **Step 2: Write capture button**

Giant button component. Red for finish, green for start. `onClick` calls `capture()` from use-timing hook. Renders full-width, tall touch target. Uses `touch-action: manipulation` CSS to prevent double-tap zoom. Optional haptic feedback via `navigator.vibrate`.

- [ ] **Step 3: Write rider assignment component**

Appears after a capture in normal mode. Text input for bib/name with auto-complete filtering against rider list. Quick-pick buttons for riders not yet assigned a time on this stage. "Skip" option to leave unassigned. Calls `assignRider()` on selection.

- [ ] **Step 4: Write rapid mode component**

Shows stacked amber cards for each unassigned TimeRecord. Each card shows timestamp. Tapping a card opens rider assignment for that record. Count badge shows unassigned total.

- [ ] **Step 5: Write recent captures component**

List of recent TimeRecords for this stage. Shows timestamp, assigned rider (or "unassigned" in amber), and sync status icon. Tapping an assigned capture allows reassignment.

- [ ] **Step 6: Write connection status component**

Renders the status bar: green/amber/blue dot with text. Uses `useConnectionStatus` hook. Shows pending count when offline.

- [ ] **Step 7: Write timing screen container**

Assembles all timing components. Manages normal/rapid mode toggle. Layout: status bar at top, capture button in center, assignment UI or rapid mode cards below, recent captures at bottom. Toggle at bottom of screen.

- [ ] **Step 8: Add XC mass start button**

When race type is `xc` and role is `start`: show a "Start All" button that creates a TimeRecord for every registered rider with the same timestamp. Confirmation dialog before firing ("Start all X riders?").

Note: This is the ONE exception to the "no confirmation dialogs" UX rule. Unlike a single-rider capture (where delay costs accuracy), mass start is a deliberate, planned action. An accidental tap would create dozens of records. The confirmation is warranted.

- [ ] **Step 9: Write timing screen integration tests**

```typescript
// src/components/timing/__tests__/timing-screen.test.tsx
// Test: renders capture button with correct color (red for finish, green for start)
// Test: tapping capture button creates a TimeRecord
// Test: normal mode shows rider assignment after capture
// Test: rapid mode stacks unassigned captures as amber cards
// Test: toggling between normal and rapid mode works
// Test: connection status bar reflects online/offline state
```

- [ ] **Step 10: Run tests**

```bash
pnpm test src/components/timing/__tests__/
```

- [ ] **Step 11: Verify build**

```bash
pnpm build
```

- [ ] **Step 12: Commit**

```bash
git add src/app/time/ src/components/timing/ && git commit -m "feat: add volunteer timing screen with normal and rapid modes"
```

---

## Chunk 4: Results Page + PWA

### Task 19: Results Data Layer

**Files:**
- Modify: `src/lib/db/results.ts` (extend with ranking logic)

- [ ] **Step 1: Write tests for results queries (TDD: RED)**

```typescript
// src/lib/db/__tests__/results.test.ts
// Test: getRaceResults returns results sorted by total_time_ms
// Test: DNF riders ranked last (overall_rank after all finishers)
// Test: category_rank partitions correctly by category
// Test: fastestSplits contains min elapsed_ms per category+stage
// Test: getRiderResult returns stage-by-stage breakdown with per-stage category rank
```

- [ ] **Step 2: Run tests to verify they fail (TDD: RED)**

```bash
pnpm test src/lib/db/__tests__/results.test.ts
```

- [ ] **Step 3: Extend results queries (TDD: GREEN)**

Ranking is now handled in the `race_results` view (via window functions added in Task 2). The `getRaceResults` function queries this view, joins rider data, and computes `fastestSplits` in application code by iterating stage_results to find min elapsed_ms per category+stage.

Also extend `getRiderResult` to include per-stage category rank (computed by querying stage_results view for all riders in the same category+stage and ranking).

Return types match the interfaces defined in Task 7 Step 5.

- [ ] **Step 4: Run tests to verify they pass (TDD: GREEN)**

```bash
pnpm test src/lib/db/__tests__/results.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/results.ts src/lib/db/__tests__/ && git commit -m "feat: extend results queries with ranking and fastest splits"
```

### Task 20: Public Results Page

**Files:**
- Create: `src/app/r/[shareCode]/page.tsx`
- Create: `src/components/results/results-header.tsx`
- Create: `src/components/results/category-tabs.tsx`
- Create: `src/components/results/standings-table.tsx`

- [ ] **Step 1: Write results header**

Race name, date, location, stage count. Status badge: "RESULTS FINAL" (green) or "LIVE" (blue, if race is active).

- [ ] **Step 2: Write category tabs**

Horizontally scrollable tab bar. "All Riders" + one tab per category from `race.categories`. Active tab is highlighted. Filters the standings table.

- [ ] **Step 3: Write standings table**

Grid layout. Columns: rank, rider (name + category + bib), one column per stage (elapsed time), total time. Top 3 get gold/silver/bronze rank styling. Fastest split per category highlighted green. DNF/DNS riders at bottom, grayed out, showing which stage failed. Rows are clickable → navigate to individual rider result.

- [ ] **Step 4: Write results page (server component)**

Fetches race by share_code, stages, and race results. Renders header, category tabs, standings table. Both `active` and `complete` races are viewable — `active` shows "LIVE" badge, `complete` shows "RESULTS FINAL" badge. Returns 404 only if share code not found or race status is `draft`.

- [ ] **Step 5: Commit**

```bash
git add src/app/r/ src/components/results/ && git commit -m "feat: add public results page with category filtering"
```

### Task 21: Individual Rider Result

**Files:**
- Create: `src/app/r/[shareCode]/[riderId]/page.tsx`
- Create: `src/components/results/rider-detail.tsx`

- [ ] **Step 1: Write rider detail component**

Rider name, category, bib, overall rank, category rank. Stage-by-stage breakdown cards: stage name, distance, elevation, elapsed time, category rank per stage. Fastest split in category highlighted green (consistent with standings table). Total time prominently displayed. "Share My Result" button copies the page URL.

- [ ] **Step 2: Write rider result page (server component)**

Fetches race by share_code, rider by ID, individual stage results via `getRiderResult(raceId, riderId)` (defined in Task 7/19). Renders rider detail. 404 if not found.

- [ ] **Step 3: Commit**

```bash
git add src/app/r/\[shareCode\]/\[riderId\]/ src/components/results/rider-detail.tsx && git commit -m "feat: add individual rider result page"
```

### Task 22: PWA Configuration

**Files:**
- Create: `public/manifest.json`
- Modify: `next.config.ts` (add next-pwa config)
- Modify: `src/app/layout.tsx` (add PWA meta tags)

- [ ] **Step 1: Install next-pwa**

```bash
pnpm add next-pwa
```

- [ ] **Step 2: Write PWA manifest**

```json
{
  "name": "OpenRace",
  "short_name": "OpenRace",
  "description": "Grassroots race timing made simple",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Configure next-pwa in next.config.ts**

Enable PWA with service worker generation. Configure runtime caching for Supabase API calls (NetworkFirst strategy) and static assets (CacheFirst). Ensure the timing page is cached for offline use.

- [ ] **Step 4: Add PWA meta tags to root layout**

Viewport meta, theme-color, apple-mobile-web-app-capable, link to manifest.

- [ ] **Step 5: Create placeholder PWA icons**

Create simple SVG icon (stopwatch/timer motif), then use it as a starting point. For now, create minimal PNG placeholders using an inline script or manually create solid-color squares with "OR" text:

```bash
# Using Node.js canvas or simply create minimal placeholder PNGs
# These will be replaced with proper branding later
mkdir -p public/icons
# Create simple colored squares as placeholders (192x192 and 512x512)
```

- [ ] **Step 6: Commit**

```bash
git add public/ next.config.ts src/app/layout.tsx && git commit -m "feat: add PWA configuration with offline support"
```

### Task 23: Landing Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write landing page**

Simple marketing page. Hero: "Race timing for the rest of us." Three feature cards: (1) No special equipment, (2) Works offline, (3) Results in seconds. CTA buttons: "Create a Race" → /signup, "View Demo Results" → example results page. Footer with GitHub link.

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx && git commit -m "feat: add landing page"
```

### Task 24: End-to-End Smoke Test

**Files:**
- Create: `e2e/race-flow.spec.ts`

- [ ] **Step 1: Install Playwright**

```bash
pnpm add -D @playwright/test && npx playwright install
```

- [ ] **Step 2: Create Playwright config**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:3000' },
  webServer: { command: 'pnpm dev', port: 3000, reuseExistingServer: true },
})
```

- [ ] **Step 3: Write E2E smoke test**

Full flow using `test.describe` blocks for clarity:
1. **Setup:** organizer signs up → creates enduro race with 2 stages and 3 riders
2. **Start timing:** volunteer opens stage 1 start link → taps START for each rider → assigns riders
3. **Finish timing:** volunteer opens stage 1 finish link → taps FINISH for each rider → assigns riders
4. **Repeat:** same for stage 2
5. **Publish:** organizer sets race status to complete
6. **Results:** public results page shows correct standings with accurate elapsed times (finish - start)

- [ ] **Step 4: Run E2E test**

```bash
npx playwright test e2e/race-flow.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add e2e/ playwright.config.ts && git commit -m "test: add E2E smoke test for full race flow"
```
