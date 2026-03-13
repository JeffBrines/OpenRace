# OpenRace — Design Specification

## Overview

OpenRace is a lightweight, open-source web application for clock-based race timing at grassroots mountain bike events. It replaces clunky existing tools (e.g., Webscorer) with a dead-simple, mobile-first PWA that volunteers can use with zero training.

**Primary use cases:** Enduro (multi-stage time trial), Downhill (single-stage time trial), XC (mass start).

**Core value proposition:** Two volunteers with phones can time an entire race stage. No special equipment, no accounts for volunteers, no reliable internet required.

## Race Types

| Type | Stages | Start Method | Winner Determined By |
|------|--------|-------------|---------------------|
| Enduro | N (typically 3-6) | Individual start per stage | Lowest cumulative stage time |
| Downhill (DH) | 1 | Individual start | Lowest single stage time |
| XC / Mass Start | 1 | All riders start together | First across finish line (lowest elapsed) |

The race type is selected during race creation and drives the setup wizard behavior:
- **Enduro** → multi-stage setup, add N stages
- **DH** → single stage auto-created
- **XC** → single stage auto-created + "Start All" mass start button

## Tech Stack

- **Frontend:** React + Next.js, Progressive Web App (PWA)
- **Backend:** Supabase (Postgres, Auth, Realtime, Edge Functions)
- **Offline:** Service Worker + IndexedDB sync queue
- **Deployment:** Vercel (frontend), Supabase (backend)

### Why This Stack

- **PWA over native:** Volunteers open a link — no app store friction. "Add to Home Screen" for app-like experience.
- **Supabase over CouchDB:** Single backend for auth, database, and realtime. Conflict risk is structurally low (each volunteer writes to one stage+role).
- **IndexedDB sync queue over PouchDB:** Lightweight — we're queuing simple timestamped events, not complex documents. Custom queue is simpler to maintain for an open-source project.

## Data Model

### Race

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| name | string | e.g., "Purgatory Enduro 2026" |
| date | date | Race date |
| type | enum | `enduro`, `dh`, `xc` |
| location | string | Optional |
| organizer_id | uuid → User | Race creator |
| categories | json array | e.g., `["Expert Men", "Expert Women", "Sport Men", "Sport Women"]` |
| rider_id_mode | enum | `name_only`, `bib_only`, `both` |
| status | enum | `draft`, `active`, `complete` |
| share_code | string | Short code for public results URL (e.g., `PURG26`) |

### Stage

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| race_id | uuid → Race | Parent race |
| name | string | e.g., "Stage 1: Ridgeline" |
| order | integer | Stage sequence |
| distance | float | Optional, miles |
| elevation | float | Optional, feet of descent |
| start_token | string | Unique token for start volunteer link |
| finish_token | string | Unique token for finish volunteer link |

Volunteer links are constructed as: `openrace.app/time/{start_token}` and `openrace.app/time/{finish_token}`. No authentication required.

### Rider

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| race_id | uuid → Race | Parent race |
| name | string | Required — serves as primary identifier for grassroots races |
| bib | string | Optional — some races use names only |
| category | string | Must match one of race.categories |
| age | integer | Optional |
| gender | enum | `male`, `female`, `non_binary` |

### TimeRecord

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Generated on device at capture time |
| stage_id | uuid → Stage | Which stage |
| rider_id | uuid → Rider | **Nullable** — allows "stamp now, assign later" |
| timestamp | bigint | Millisecond-precision capture time |
| type | enum | `start`, `finish` |
| device_id | string | Random UUID generated on first load, persisted in localStorage |
| synced | boolean | Whether record has been persisted to Supabase |
| created_at | timestamp | Server-side insertion time |

**Key design decision:** `rider_id` is nullable. This decouples time capture from rider identification. A volunteer taps FINISH → timestamp is recorded immediately → they assign a rider afterward. For rapid finishes, they keep tapping and batch-assign later.

### StageResult (computed/view)

| Field | Type | Notes |
|-------|------|-------|
| rider_id | uuid → Rider | |
| stage_id | uuid → Stage | |
| start_time | bigint | From matched start TimeRecord |
| finish_time | bigint | From matched finish TimeRecord |
| elapsed_ms | bigint | finish_time - start_time |
| status | enum | `ok`, `dns` (did not start), `dnf` (did not finish) |

Computed by pairing start and finish TimeRecords for the same rider + stage.

### RaceResult (computed/view)

| Field | Type | Notes |
|-------|------|-------|
| rider_id | uuid → Rider | |
| race_id | uuid → Race | |
| total_time_ms | bigint | Sum of all StageResult.elapsed_ms |
| stage_results | json | Array of per-stage elapsed times |
| category_rank | integer | Rank within rider's category |
| overall_rank | integer | Rank across all categories |

## User Roles & Authentication

| Role | Needs Account? | Capabilities |
|------|---------------|-------------|
| Organizer | Yes (Supabase Auth) | Create/manage races, stages, riders. Publish results. View sync status. |
| Volunteer | No | Open a stage timing link. Capture start/finish times. Assign riders to times. |
| Spectator/Rider | No | View public results page. Share individual results. |

**Only organizers need accounts.** Volunteer links are unauthenticated — anyone with the link can time. This is intentional for grassroots simplicity. Links contain unique tokens (high-entropy, 24+ character random strings) that scope the volunteer to a specific stage + role. Timing endpoints should be rate-limited to prevent abuse.

## Core Screens

### 1. Race Setup Wizard (Organizer)

Four-step wizard:

1. **Race Info** — name, date, type (enduro/DH/XC), categories (add/remove chips), rider identification mode (names only / bibs / both)
2. **Stages** — add stages with name, optional distance/elevation. DH/XC auto-create a single stage. Stages are reorderable.
3. **Riders** — add riders manually (name, bib, category, gender) or paste CSV. Support day-of registration (organizer adds on the fly).
4. **Share** — generated volunteer links per stage (start + finish) with copy buttons. Public results URL with QR code. QR codes for volunteer links too.

### 2. Volunteer Timing Screen

Accessed via unauthenticated link. Two modes:

**Normal Mode (default):**
- Large FINISH (red) or START (green) button dominates the screen
- One tap → timestamp captured to ms precision → rider identification prompt appears
- Text field for bib or name entry + quick-pick buttons showing registered riders not yet timed on this stage
- Recent captures shown at bottom with assignment status

**Rapid Mode (toggle):**
- FINISH/START button takes up even more screen area
- Each tap captures a timestamp — no identification prompt
- Unassigned timestamps stack as amber cards below the button
- Volunteer taps each card to assign a rider when the rush is over
- Normal/Rapid toggle at bottom of screen

**UX priorities:**
- Button must work with gloves/cold hands — large touch target, no confirmation dialogs
- Timestamp capture happens on tap — zero delay
- Quick-pick suggestions reduce typing
- Works identically online or offline

**Start Timer specifics:**
- Same UI pattern as finish but green
- For XC races: includes a "Start All" button that timestamps every registered rider simultaneously

### 3. Organizer Dashboard (Race Day)

- Overview of all stages and their sync status
- Which volunteers are connected, which stages have pending unsynced data
- Ability to add riders on the fly (day-of registration)
- Manual time entry / correction capability
- Mark riders as DNS/DNF per stage
- Publish/unpublish results toggle

### 4. Public Results Page

Accessed via `openrace.app/r/{share_code}`. No login required.

**Overall standings view:**
- Category filter tabs (All, Expert Men, Expert Women, etc.) — horizontally scrollable on mobile
- Results grid: rank, rider name (+ bib if applicable), per-stage split times, total time
- Fastest stage split highlighted in green per category
- DNF/DNS riders shown at bottom, grayed out
- Gold/silver/bronze styling for top 3

**Individual rider view (tap a row):**
- Stage-by-stage breakdown cards with stage name, distance, elevation
- Elapsed time per stage with category rank per stage
- Total time prominently displayed
- "Share My Result" button → unique shareable URL per rider

**Results status:**
- "RESULTS FINAL" badge when organizer publishes
- Optional live-updating during race via Supabase Realtime (nice-to-have)

## Offline Sync Architecture

### Principle: Local-First Always

Every TimeRecord is written to IndexedDB before any network call. The app behaves identically whether online or offline.

### Flow

1. **Capture:** Volunteer taps button → TimeRecord created with UUID → written to IndexedDB → marked `synced: false`
2. **Online:** Sync queue picks up unsynced records → sends to Supabase → marks `synced: true` in IndexedDB
3. **Offline:** Sync queue attempts send → fails → records stay in IndexedDB with `synced: false` → queue retries on connectivity change
4. **Reconnect:** Browser fires `online` event → sync queue flushes all pending records → Supabase upserts by UUID (deduplication)

### Deduplication

Each TimeRecord gets a UUID generated on the device at creation time. The Supabase table uses this UUID as the primary key with an upsert strategy. If the same record is sent multiple times (e.g., retry after network timeout), no duplicates are created.

### Clock Considerations

Start and finish timestamps for a rider on a stage come from two different devices (two different volunteers' phones). The elapsed time is `finish_timestamp - start_timestamp`.

Since we're computing time intervals (not comparing absolute moments across devices), minor clock drift between devices doesn't materially affect results. A phone clock off by a few seconds shifts both the "absolute" start and finish times, but the interval between them (which is what we measure) remains correct — because each device's clock is internally consistent.

For races where sub-second accuracy is critical, an optional clock-offset calibration step can be added: both volunteers tap a "sync" button simultaneously, and the system records the offset between their device clocks.

**Invariant:** Each stage's start and finish must each be timed by a single device for the duration of that stage. Token-scoped links naturally enforce this — one device opens one link. If a volunteer swaps phones mid-stage, clock drift between the two devices would corrupt elapsed times for riders who straddled the swap.

### Service Worker

The Service Worker caches the entire app shell (HTML, CSS, JS). Even if the volunteer's browser restarts or they have no signal at all, the app loads from cache. TimeRecord data persists in IndexedDB across browser restarts.

### Volunteer Status Indicator

A persistent status bar shows connection state:
- **Green dot** — "Online" / "All times synced"
- **Amber dot** — "Offline" / "X times saved locally, will sync when back online"
- **Blue dot** — "Syncing..." / "Uploading X records"

## Edge Cases

### Rapid Finishes
Two or more riders cross within seconds. Volunteer switches to Rapid Mode → taps FINISH for each crossing → timestamps captured in sequence → assigns riders afterward from the stacked amber cards.

### Missed Time Capture
Volunteer misses a tap. Organizer can manually enter a time from the dashboard with a note. Manual entries are flagged in results.

### Wrong Rider Assignment
Volunteer assigns wrong rider to a time. Editable from the timing screen — tap a recent capture to reassign. Organizer can also correct from the dashboard.

### DNS / DNF
- **DNS (Did Not Start):** Rider has no start TimeRecord for a stage. Organizer marks as DNS.
- **DNF (Did Not Finish):** Rider has a start but no finish TimeRecord. Organizer marks as DNF.
- Any DNS/DNF on any stage results in overall DNF for enduro. Rider appears at bottom of results.

### Duplicate Time Captures
Volunteer accidentally double-taps. Two TimeRecords created with timestamps ~100ms apart. The system should surface these to the organizer as potential duplicates for resolution. A simple heuristic: two unassigned captures from the same device within 500ms are flagged.

### Day-of Registration
New rider shows up on race day. Organizer adds them from the dashboard. Rider list updates flow to volunteer devices via Supabase Realtime subscription (when online) or are fetched on next successful sync (when offline — the sync flush also pulls the latest rider list).

### Device Battery / Browser Crash
IndexedDB persists across browser restarts. Service Worker caches the app. Volunteer reopens the browser → app loads from cache → all previously captured times are still in IndexedDB → sync resumes.

## Non-Goals (v1)

- GPS tracking or live rider location
- Payment processing / registration fees
- Automatic bib scanning (camera/NFC)
- Multi-day stage races (each day is a separate race)
- Team classifications
- Penalties / time adjustments beyond manual correction
- Native mobile apps
- Age group categories (v1 is skill + gender only)

## Future Considerations (v2+)

- Live results updating via Supabase Realtime
- Age group categories
- Recurring race series with cumulative standings
- Rider self-registration via public link
- Photo integration (finish line photos matched to times)
- Export to CSV/PDF
- Integration with external timing hardware (if demand warrants)
