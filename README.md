# OpenRace

Lightweight, open-source race timing for grassroots mountain bike events. Two volunteers, two phones, zero special equipment.

## What is OpenRace?

OpenRace lets race organizers time enduro, downhill, and cross-country mountain bike races using nothing but smartphones. Volunteers open a link on their phone, tap a button when each rider starts or finishes, and results appear automatically.

**Key features:**

- **No equipment needed** — just phones with a browser
- **No volunteer accounts** — share a QR code or link, they start timing immediately
- **Offline-first** — times are captured locally and sync when connectivity returns
- **Instant results** — public results page with category filtering and stage splits
- **Multi-stage support** — enduro races with any number of stages
- **CSV rider import** — paste a spreadsheet of riders and go

## Race Types

| Type | Description |
|------|-------------|
| **Enduro** | Multiple timed stages, lowest combined time wins |
| **Downhill (DH)** | Single timed stage, fastest run wins |
| **Cross-Country (XC)** | Single stage, mass start, first to finish wins |

## How It Works

1. **Organizer** creates a race, adds stages and riders
2. **Organizer** shares QR-coded timer links with volunteers (one for start, one for finish per stage)
3. **Volunteers** open the link on their phone — no login required
4. **Volunteers** tap the big button each time a rider starts or finishes
5. **Times sync** to the server and results update automatically
6. **Spectators** view live results via a public share link

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, React 19, TypeScript)
- [Supabase](https://supabase.com/) (Postgres, Auth, Row Level Security)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via [idb](https://github.com/jakearchibald/idb) (offline storage)
- [Zod 4](https://zod.dev/) (validation)
- [Vitest](https://vitest.dev/) (testing)
- PWA-ready (installable on mobile)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com/) project

### 1. Clone and install

```bash
git clone https://github.com/JeffBrines/OpenRace.git
cd OpenRace
pnpm install
```

### 2. Set up Supabase

Create a Supabase project (or use an existing one). OpenRace uses a dedicated `openrace` schema so it won't conflict with other tables.

**Apply the database migrations** in order:

```bash
# Using the Supabase CLI
supabase db push
```

Or apply the SQL files manually from `supabase/migrations/` (001 through 007) via the Supabase SQL Editor.

**Expose the schema:** In your Supabase Dashboard, go to **Project Settings > API > Exposed schemas** and add `openrace` to the list.

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── (auth)/                     # Login & signup
│   ├── dashboard/                  # Organizer dashboard (auth-protected)
│   │   ├── page.tsx                # Race list
│   │   ├── create/                 # Race setup wizard (4 steps)
│   │   └── [raceId]/               # Race day dashboard
│   ├── time/[token]/               # Volunteer timing screen (no auth)
│   └── r/[shareCode]/              # Public results
│       └── [riderId]/              # Individual rider result
├── components/
│   ├── auth/                       # Auth form
│   ├── race/                       # Race cards, wizard steps, dashboard
│   ├── timing/                     # Timing screen UI
│   └── dashboard/                  # Sign out button
├── hooks/
│   ├── use-timing.ts               # Timing state & actions
│   └── use-connection.ts           # Online/offline monitor
└── lib/
    ├── db/                         # Supabase database operations
    ├── offline/                    # IndexedDB schema, operations, sync queue
    ├── timing/                     # Timing capture logic
    ├── supabase/                   # Supabase client setup
    ├── validators/                 # Zod schemas
    └── utils/                      # Device ID, tokens, time formatting, CSV import
```

## Database Schema

OpenRace uses a dedicated `openrace` Postgres schema with Row Level Security:

- **races** — race metadata, owned by organizer
- **stages** — timed stages within a race, with unique start/finish tokens
- **riders** — participants with name, bib, category, gender
- **time_records** — timestamped start/finish events, linked to stage and optionally to rider
- **stage_results** (view) — computed elapsed times per rider per stage
- **race_results** (view) — aggregated results with overall and category rankings

### Security Model

| Role | Access |
|------|--------|
| **Organizer** (authenticated) | Full CRUD on own races, stages, riders, time records |
| **Volunteer** (anonymous) | INSERT time records for active races only |
| **Public** (anonymous) | READ races, stages, riders, results for active/complete races |

No service role key is needed — everything works through the anon key with RLS.

## Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch
```

Tests cover: time formatting, token generation, CSV import, IndexedDB operations, sync queue, and timing capture logic.

## Offline Support

The volunteer timing screen works without internet:

1. Times are captured instantly to **IndexedDB** on the device
2. A **sync queue** flushes pending records to Supabase every 5 seconds when online
3. The **connection monitor** shows online/offline status in the UI
4. UUID-based deduplication prevents duplicate records on retry

Volunteers never lose a time — even if they're in a cell dead zone on the side of a mountain.

## Contributing

Contributions are welcome! This project is built for the grassroots racing community.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes with tests
4. Submit a pull request

## License

MIT

## Acknowledgments

Built for the mountain bike community by riders who got tired of expensive timing systems and terrible UX.
