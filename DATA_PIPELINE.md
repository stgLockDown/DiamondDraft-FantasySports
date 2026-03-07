# DiamondDraft Data Pipeline

> Complete documentation of the MLB data ingestion, processing, and delivery architecture powering the DiamondDraft fantasy baseball platform.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Data Flow Diagram](#data-flow-diagram)
- [Data Source: MLB Stats API](#data-source-mlb-stats-api)
- [Ingestion Layer](#ingestion-layer)
- [Storage Layer](#storage-layer)
- [Processing Layer: Scoring Engine](#processing-layer-scoring-engine)
- [Delivery Layer: API Endpoints](#delivery-layer-api-endpoints)
- [Scheduler & Sync Strategy](#scheduler--sync-strategy)
- [Stats Hub: Real-Time Intelligence](#stats-hub-real-time-intelligence)
- [Error Handling & Resilience](#error-handling--resilience)
- [Environment Configuration](#environment-configuration)

---

## Architecture Overview

DiamondDraft uses a multi-layer data pipeline that ingests live MLB data, processes it through a custom scoring engine, stores it in PostgreSQL, and delivers it through both a fantasy sports API and a standalone Stats Hub.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DiamondDraft Data Pipeline                       │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐
  │  MLB Stats   │────▶│  Ingestion Layer │────▶│   PostgreSQL (DB)    │
  │  API (Free)  │     │  (dataSync.ts)   │     │   via Prisma ORM     │
  │              │     │                  │     │                      │
  │ statsapi.    │     │ • syncAllPlayers │     │ • Player             │
  │  mlb.com     │     │ • syncSeasonStats│     │ • PlayerStat         │
  │              │     │ • syncBoxscores  │     │ • League / Team      │
  └──────────────┘     └──────────────────┘     └──────────┬───────────┘
        │                       ▲                          │
        │                       │                          │
        │              ┌────────┴─────────┐                │
        │              │   Scheduler      │                │
        │              │  (scheduler.ts)  │                │
        │              │                  │                │
        │              │ • Full: 6h       │                │
        │              │ • Stats: 30m     │                │
        │              │ • Boxscore: 15m  │                │
        │              └──────────────────┘                │
        │                                                  │
        │    ┌─────────────────────────────────────────────┘
        │    │
        ▼    ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │                        Delivery Layer                             │
  │                                                                   │
  │  ┌─────────────────────┐    ┌──────────────────────────────────┐ │
  │  │  Fantasy API         │    │  Stats Hub API (Public)          │ │
  │  │  (Authenticated)     │    │  (No Auth Required)              │ │
  │  │                      │    │                                  │ │
  │  │ • /api/leagues       │    │ • /api/stats/scoreboard          │ │
  │  │ • /api/teams         │    │ • /api/stats/standings           │ │
  │  │ • /api/players       │    │ • /api/stats/leaders             │ │
  │  │ • /api/draft         │    │ • /api/stats/player/:id          │ │
  │  │ • /api/live/scores   │    │ • /api/stats/teams               │ │
  │  │ • /api/sync (admin)  │    │ • /api/stats/game/:gamePk        │ │
  │  └─────────┬────────────┘    │ • /api/stats/schedule            │ │
  │            │                 │ • /api/stats/search              │ │
  │            │                 │ • /api/stats/compare             │ │
  │            │                 └──────────────┬───────────────────┘ │
  └────────────┼─────────────────────────────────┼───────────────────┘
               │                                 │
               ▼                                 ▼
  ┌──────────────────────┐    ┌──────────────────────────────────────┐
  │  Fantasy Frontend     │    │  Stats Hub Frontend                  │
  │  (React + Auth)       │    │  (React, Public Access)              │
  │                       │    │                                      │
  │ • Dashboard           │    │ • Live Scoreboard                    │
  │ • League Management   │    │ • Standings                          │
  │ • Draft Room          │    │ • Leaderboards                       │
  │ • Player Rankings     │    │ • Team Rosters & Stats               │
  │ • Scoring             │    │ • Player Profiles & Splits           │
  └───────────────────────┘    │ • Player Compare                     │
                               │ • Game Detail (Boxscores)            │
  ┌───────────────────────┐    │ • Schedule                           │
  │  Scoring Engine        │    └──────────────────────────────────────┘
  │  (scoring.ts)          │
  │                        │
  │ • 4 Scoring Presets    │
  │ • Real-time Calc       │
  │ • Bonus Categories     │
  │ • Roto Standings       │
  └────────────────────────┘
```

---

## Data Flow Diagram

```
                    ┌─────────────────────────────────────┐
                    │         statsapi.mlb.com             │
                    │         (Free, No Auth)              │
                    └──────────┬──────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌────────────┐   ┌──────────────┐  ┌──────────────┐
     │ /api/v1/   │   │ /api/v1/     │  │ /api/v1/     │
     │ sports/1/  │   │ people/      │  │ schedule     │
     │ players    │   │ {id}/stats   │  │ ?date=...    │
     │            │   │              │  │              │
     │ All active │   │ Season stats │  │ Daily games  │
     │ MLB players│   │ Game logs    │  │ Live feeds   │
     │ ~1400+     │   │ Splits       │  │ Boxscores    │
     └─────┬──────┘   └──────┬───────┘  └──────┬───────┘
           │                 │                  │
           ▼                 ▼                  ▼
     ┌─────────────────────────────────────────────────┐
     │              dataSync.ts                         │
     │                                                  │
     │  syncAllPlayers()     syncSeasonStats()          │
     │  ├─ Fetch all teams   ├─ Bulk hitting stats      │
     │  ├─ Fetch rosters     ├─ Bulk pitching stats     │
     │  ├─ Upsert players    └─ Upsert PlayerStat       │
     │  └─ Map positions                                │
     │                                                  │
     │  syncGameBoxscores()  fullSync()                 │
     │  ├─ Today's games     ├─ syncAllPlayers()        │
     │  ├─ Parse boxscores   ├─ syncSeasonStats()       │
     │  ├─ Calculate fantasy  └─ syncGameBoxscores()    │
     │  │  points per game                              │
     │  └─ Upsert PlayerStat                            │
     └──────────────────────┬──────────────────────────┘
                            │
                            ▼
     ┌─────────────────────────────────────────────────┐
     │              PostgreSQL (Railway)                 │
     │                                                  │
     │  ┌──────────┐  ┌────────────┐  ┌─────────────┐ │
     │  │  Player   │  │ PlayerStat │  │   League    │ │
     │  │          │  │            │  │   Team      │ │
     │  │ mlbId    │  │ playerId   │  │   Roster    │ │
     │  │ name     │  │ date       │  │   Draft     │ │
     │  │ team     │  │ season     │  │   Matchup   │ │
     │  │ position │  │ ab/h/hr/.. │  │   Trade     │ │
     │  │ stats    │  │ ip/so/era  │  │   Waiver    │ │
     │  │ headshot │  │ fantasy pts│  │             │ │
     │  └──────────┘  └────────────┘  └─────────────┘ │
     └─────────────────────────────────────────────────┘
```

---

## Data Source: MLB Stats API

DiamondDraft uses the **MLB Stats API** (`statsapi.mlb.com`), which is free and requires no authentication. This is the same data source that powers MLB.com.

### Base URL
```
https://statsapi.mlb.com/api/v1
```

### Endpoints Used

| Endpoint | Purpose | Sync Frequency |
|----------|---------|----------------|
| `/sports/1/players?season={year}` | All active MLB players (~1400+) | Every 6 hours |
| `/teams?sportId=1&season={year}` | All 30 MLB teams | Every 6 hours |
| `/teams/{id}/roster?season={year}` | Team rosters | Every 6 hours |
| `/people/{id}` | Individual player bio/info | On demand |
| `/people/{id}/stats?stats=season&group=hitting` | Season hitting stats | Every 30 min |
| `/people/{id}/stats?stats=season&group=pitching` | Season pitching stats | Every 30 min |
| `/people/{id}/stats?stats=gameLog` | Game-by-game log | On demand |
| `/people/{id}/stats?stats=vsPlayer,statSplits` | Splits (L/R, home/away) | On demand |
| `/schedule?date={date}&sportId=1&hydrate=...` | Daily schedule & scores | Every 15 min |
| `/game/{gamePk}/feed/live` | Live game feed (play-by-play) | Real-time |
| `/game/{gamePk}/boxscore` | Game boxscore | Every 15 min |
| `/standings?leagueId=103,104` | MLB standings | On demand |
| `/stats/leaders?leaderCategories={cat}` | Stat leaders | On demand |

### Data Characteristics

- **Latency**: ~5-15 second delay from real events
- **Rate Limits**: No official rate limit, but we throttle to be respectful
- **Availability**: 99.9%+ uptime, occasionally slow during high-traffic games
- **Data Format**: JSON responses
- **Coverage**: All 30 MLB teams, all active roster players, Spring Training through World Series

---

## Ingestion Layer

The ingestion layer is implemented in `backend/src/services/dataSync.ts` and handles all data fetching, transformation, and storage.

### `syncAllPlayers(season)`

Fetches and upserts all active MLB players into the database.

```
Flow:
1. GET /teams?sportId=1 → Get all 30 teams
2. For each team: GET /teams/{id}/roster → Get roster
3. For each player:
   a. Map MLB position codes to fantasy-eligible positions
   b. Upsert into Player table (keyed on mlbId)
   c. Store: name, team, position, eligiblePositions, headshotUrl, status

Result: ~1400+ players synced
Frequency: Every 6 hours
```

### `syncSeasonStats(season)`

Bulk-fetches season statistics for all players in the database.

```
Flow:
1. Query all Players from DB
2. For each player:
   a. GET /people/{id}/stats?stats=season&group=hitting
   b. GET /people/{id}/stats?stats=season&group=pitching
   c. Upsert denormalized stats on Player record
      (battingAvg, homeRuns, era, whip, etc.)
   d. Create/update PlayerStat record for the season

Result: Full season stats for all players
Frequency: Every 30 minutes (during game hours only)
```

### `syncGameBoxscores(date?)`

Fetches boxscores for all games on a given date and calculates fantasy points.

```
Flow:
1. GET /schedule?date={date}&hydrate=game(content(summary)),linescore,team
2. For each game with status "Final" or "In Progress":
   a. GET /game/{gamePk}/boxscore
   b. Parse batting stats for each player
   c. Parse pitching stats for each player
   d. Calculate fantasy points using scoring engine
   e. Upsert PlayerStat record per player per game

Result: Per-game stats with fantasy point calculations
Frequency: Every 15 minutes (during game hours only)
```

### `fullSync(season?)`

Orchestrates a complete data refresh.

```
Flow:
1. syncAllPlayers(season)  → Player roster data
2. syncSeasonStats(season) → Cumulative season stats
3. syncGameBoxscores()     → Today's game-level stats

Frequency: Every 6 hours, or triggered manually via admin API
```

---

## Storage Layer

### Database: PostgreSQL (hosted on Railway)

### ORM: Prisma v5

### Key Models

#### Player
```prisma
model Player {
  id                String   @id @default(uuid())
  mlbId             Int      @unique          // MLB Stats API ID
  firstName         String
  lastName          String
  fullName          String
  team              String?                   // Team abbreviation
  position          String                    // Primary position
  eligiblePositions String[] @default([])     // Fantasy-eligible positions
  status            String   @default("Active")
  headshotUrl       String?

  // Denormalized season stats (updated every 30 min)
  gamesPlayed       Int?
  atBats            Int?
  hits              Int?
  homeRuns          Int?
  rbi               Int?
  stolenBases       Int?
  battingAvg        Float?
  obp               Float?
  slg               Float?
  ops               Float?
  wins_stat         Int?
  losses_stat       Int?
  era               Float?
  whip              Float?
  strikeouts        Int?
  saves             Int?
  inningsPitched    Float?

  stats             PlayerStat[]
  rosterEntries     RosterEntry[]
}
```

#### PlayerStat
```prisma
model PlayerStat {
  id            String   @id @default(uuid())
  playerId      String
  date          DateTime
  season        Int
  gameId        String?                    // MLB gamePk

  // Hitting
  ab            Int      @default(0)
  runs          Int      @default(0)
  hits          Int      @default(0)
  doubles       Int      @default(0)
  triples       Int      @default(0)
  hr            Int      @default(0)
  rbi           Int      @default(0)
  sb            Int      @default(0)
  cs            Int      @default(0)
  bb            Int      @default(0)
  so            Int      @default(0)
  hbp           Int      @default(0)

  // Pitching
  ip            Float    @default(0)
  pitcherH      Int      @default(0)
  pitcherR      Int      @default(0)
  pitcherER     Int      @default(0)
  pitcherBB     Int      @default(0)
  pitcherSO     Int      @default(0)
  pitcherW      Int      @default(0)
  pitcherL      Int      @default(0)
  pitcherSV     Int      @default(0)
  pitcherBS     Int      @default(0)
  pitcherHLD    Int      @default(0)

  fantasyPoints Float    @default(0)       // Calculated by scoring engine

  player        Player   @relation(fields: [playerId], references: [id])
}
```

---

## Processing Layer: Scoring Engine

The scoring engine (`backend/src/utils/scoring.ts`) calculates fantasy points for each player's game performance. It supports multiple scoring presets and bonus categories.

### Scoring Presets

| Preset | Style | Key Features |
|--------|-------|-------------|
| **DiamondDraft Standard** | Points-based | Balanced hitting/pitching, rewards OBP |
| **Sabermetric** | Advanced stats | Emphasizes walks, penalizes Ks, rewards quality starts |
| **Classic** | Traditional | Simple counting stats, familiar to ESPN/Yahoo users |
| **Roto 5x5** | Rotisserie | Category-based standings (R, HR, RBI, SB, AVG / W, SV, ERA, WHIP, SO) |

### DiamondDraft Standard Scoring

**Hitting:**
| Category | Points |
|----------|--------|
| Single | +1 |
| Double | +2 |
| Triple | +3 |
| Home Run | +4 |
| Run | +1 |
| RBI | +1 |
| Walk (BB) | +1 |
| Hit By Pitch | +1 |
| Stolen Base | +2 |
| Caught Stealing | -1 |
| Strikeout | -0.5 |

**Pitching:**
| Category | Points |
|----------|--------|
| Inning Pitched | +3 |
| Strikeout | +1 |
| Win | +5 |
| Save | +5 |
| Hold | +3 |
| Earned Run | -2 |
| Hit Allowed | -0.5 |
| Walk Allowed | -1 |
| Loss | -3 |
| Blown Save | -3 |

**Bonus Categories:**
| Bonus | Points |
|-------|--------|
| Multi-hit game (3+) | +2 |
| Grand Slam | +4 |
| Hitting for the Cycle | +10 |
| No-Hitter | +10 |
| Perfect Game | +20 |

### Calculation Flow

```
Raw Boxscore Data
       │
       ▼
calculatePointsFromBoxscore()
       │
       ├─ Detect player type (hitter/pitcher)
       ├─ Extract relevant stats from boxscore JSON
       ├─ Map to GameStats interface
       │
       ▼
calculateFantasyPoints(stats, preset)
       │
       ├─ Apply hitting multipliers
       ├─ Apply pitching multipliers
       ├─ Check bonus conditions
       ├─ Sum total points
       │
       ▼
  fantasyPoints (Float)
       │
       ▼
  Stored in PlayerStat.fantasyPoints
```

---

## Delivery Layer: API Endpoints

### Fantasy API (Authenticated)

These endpoints power the fantasy sports features and require JWT authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync/full` | Trigger full data sync (admin) |
| POST | `/api/sync/players` | Sync players only (admin) |
| POST | `/api/sync/stats` | Sync season stats (admin) |
| POST | `/api/sync/boxscores` | Sync today's boxscores (admin) |
| GET | `/api/live/scores` | Live game scores |
| GET | `/api/live/games` | Today's games with details |
| GET | `/api/live/leaders` | Current stat leaders |
| GET | `/api/live/standings` | MLB standings |

### Stats Hub API (Public, No Auth)

These endpoints power the Stats & Live Games section, accessible to all users.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/scoreboard?date=` | Day's games with scores |
| GET | `/api/stats/scoreboard/week?startDate=` | Week of games |
| GET | `/api/stats/game/{gamePk}` | Full game detail (linescore + boxscore) |
| GET | `/api/stats/player/{mlbId}` | Complete player profile with stats |
| GET | `/api/stats/player/{mlbId}/splits` | Player splits (L/R, home/away) |
| GET | `/api/stats/player/{mlbId}/gamelog` | Game-by-game log |
| GET | `/api/stats/player/compare?ids=` | Side-by-side player comparison |
| GET | `/api/stats/leaders?season=&limit=` | Multi-category leaderboards |
| GET | `/api/stats/leaders/{category}` | Single category leaders |
| GET | `/api/stats/trending` | Hot & cold players (last 7/14 days) |
| GET | `/api/stats/teams` | All 30 MLB teams |
| GET | `/api/stats/teams/{teamId}` | Team roster with stats |
| GET | `/api/stats/standings` | Full MLB standings by division |
| GET | `/api/stats/schedule?startDate=&endDate=` | Schedule range |
| GET | `/api/stats/search?q=&position=&team=` | Player search |

---

## Scheduler & Sync Strategy

The scheduler (`backend/src/services/scheduler.ts`) manages periodic data sync jobs.

### Job Schedule

```
┌─────────────────────────────────────────────────────────────────┐
│                    24-Hour Sync Timeline (ET)                    │
├─────────┬───────────────────────────────────────────────────────┤
│  Time   │  Active Jobs                                          │
├─────────┼───────────────────────────────────────────────────────┤
│ 12:00am │  ■ Boxscore Sync (15m)  ■ Stats Sync (30m)           │
│  1:00am │  ■ Boxscore Sync (15m)  ■ Stats Sync (30m)           │
│  2:00am │  ○ Off-hours — only Full Sync runs                    │
│  3:00am │  ○ Off-hours                                          │
│  4:00am │  ○ Off-hours                                          │
│  5:00am │  ○ Off-hours                                          │
│  6:00am │  ○ Off-hours  ● Full Sync (6h cycle)                  │
│  7:00am │  ○ Off-hours                                          │
│  8:00am │  ○ Off-hours                                          │
│  9:00am │  ○ Off-hours                                          │
│ 10:00am │  ○ Off-hours                                          │
│ 11:00am │  ■ Game hours begin — all syncs active                │
│ 12:00pm │  ■ Boxscore (15m)  ■ Stats (30m)  ● Full Sync (6h)   │
│  1:00pm │  ■ Boxscore (15m)  ■ Stats (30m)                     │
│    ...   │  ■ Continuous during game hours                       │
│  6:00pm │  ■ Boxscore (15m)  ■ Stats (30m)  ● Full Sync (6h)   │
│    ...   │  ■ Peak game time                                     │
│ 11:00pm │  ■ Boxscore (15m)  ■ Stats (30m)                     │
│ 11:59pm │  ■ Game hours continue through midnight               │
├─────────┼───────────────────────────────────────────────────────┤
│ Legend   │  ■ Active  ○ Inactive  ● Periodic (runs regardless)  │
└─────────┴───────────────────────────────────────────────────────┘
```

### Game Hours Detection

```typescript
function isDuringGameHours(): boolean {
  const now = new Date();
  const etHour = now.getUTCHours() - 4; // ET approximation
  return etHour >= 11 || etHour <= 1;    // 11am - 1am ET
}
```

### Concurrency Protection

Each job has a `running` flag to prevent overlapping executions. If a job is still running when its next interval fires, the execution is skipped.

### Manual Triggers

Admin endpoints allow manual sync triggers for immediate data refresh:

```bash
# Full sync
curl -X POST https://your-app.railway.app/api/sync/full \
  -H "Authorization: Bearer <admin-token>"

# Players only
curl -X POST https://your-app.railway.app/api/sync/players

# Stats only
curl -X POST https://your-app.railway.app/api/sync/stats

# Boxscores only
curl -X POST https://your-app.railway.app/api/sync/boxscores
```

---

## Stats Hub: Real-Time Intelligence

The Stats Hub is a standalone section of DiamondDraft that provides comprehensive MLB data to help users make informed fantasy decisions. It's publicly accessible (no login required).

### Frontend Pages

| Page | Route | Features |
|------|-------|----------|
| **Live Scoreboard** | `/stats` | Today's games, live scores, auto-refresh (30s), date navigation |
| **Standings** | `/stats/standings` | Full MLB standings by division, W/L/PCT/GB/STRK/L10/HOME/AWAY |
| **Leaderboards** | `/stats/leaders` | 11 hitting + 6 pitching categories, expandable cards |
| **Teams** | `/stats/teams` | All 30 teams by division, team logos, links to detail |
| **Team Detail** | `/stats/teams/:id` | Full roster, team stats, hitter/pitcher splits |
| **Schedule** | `/stats/schedule` | Weekly calendar view, game cards, mobile list view |
| **Player Search** | `/stats/players` | Search by name, filter by position, quick stat preview |
| **Player Profile** | `/stats/players/:id` | Bio, season stats, splits, game log tabs |
| **Player Compare** | `/stats/compare` | Side-by-side comparison, stat highlighting, search selectors |
| **Game Detail** | `/stats/game/:gamePk` | Full linescore, batting/pitching boxscores, live updates |

### Data Flow for Stats Hub

```
User Request (e.g., /stats/player/660271)
       │
       ▼
Stats Hub Route Handler (statsHub.ts)
       │
       ├─ Check if data is in DB cache
       │     │
       │     ├─ YES → Return from PostgreSQL
       │     │
       │     └─ NO → Fetch from MLB Stats API
       │              │
       │              ▼
       │         Transform & Return
       │
       ▼
  JSON Response → React Frontend
       │
       ▼
  TanStack Query Cache (30s staleTime)
       │
       ▼
  Rendered UI Component
```

---

## Error Handling & Resilience

### API Fetch Errors
- All MLB API calls are wrapped in try/catch blocks
- Failed fetches log errors but don't crash the sync process
- Individual player failures are skipped; sync continues with remaining players

### Scheduler Resilience
- Jobs have `running` flags to prevent concurrent execution
- Errors in one job don't affect other scheduled jobs
- All errors are logged with `[Scheduler]` prefix for easy filtering

### Database Resilience
- Prisma `upsert` operations prevent duplicate key errors
- Transactions are used for batch operations where appropriate
- Connection pooling via Prisma handles concurrent requests

### Frontend Resilience
- TanStack Query provides automatic retry (1 retry by default)
- Stale data is shown while refetching in the background
- Loading and error states are handled in every component
- Auto-refresh intervals keep live data current

---

## Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/diamonddraft

# Authentication
JWT_SECRET=your-secret-key

# Server
PORT=3001
NODE_ENV=production

# Frontend (build-time)
VITE_API_URL=          # Empty for same-origin, or full URL
```

### Railway Deployment

The application deploys as a single container on Railway:

```
Dockerfile (multi-stage)
├── Stage 1: Build Frontend (Vite)
├── Stage 2: Build Backend (TypeScript)
└── Stage 3: Production
    ├── Serves frontend static files via @fastify/static
    ├── Runs API server on PORT
    └── Starts scheduler for data sync
```

---

## File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `backend/src/services/mlbApi.ts` | 610 | MLB Stats API client — all fetch functions |
| `backend/src/services/dataSync.ts` | 301 | Data ingestion — sync players, stats, boxscores |
| `backend/src/services/scheduler.ts` | 111 | Periodic job scheduler |
| `backend/src/utils/scoring.ts` | 396 | Fantasy scoring engine — 4 presets, bonus categories |
| `backend/src/routes/sync.ts` | 158 | Admin sync endpoints + live data routes |
| `backend/src/routes/statsHub.ts` | 328 | Public Stats Hub API endpoints |
| `frontend/src/services/api.ts` | — | API client with `statsHubAPI` object |
| `frontend/src/pages/stats/*.tsx` | 10 files | Stats Hub UI components |

---

*Last updated: March 2025*
*DiamondDraft — Where champions are built before Opening Day. ⚾*