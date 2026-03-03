# ⚾ DiamondDraft — Fantasy Baseball Platform

A next-generation fantasy baseball platform built with React, Fastify, PostgreSQL, and WebSockets.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat&logo=fastify&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat&logo=railway&logoColor=white)

---

## 🏗️ Architecture

```
DiamondDraft-FantasySports/
├── Dockerfile              # Multi-stage build (frontend + backend)
├── railway.toml            # Railway deployment config
├── .env.example            # Environment variables template
├── backend/
│   ├── src/
│   │   ├── server.ts       # Fastify server + static file serving
│   │   ├── config.ts       # Environment configuration
│   │   ├── plugins/        # Prisma, Auth (JWT) plugins
│   │   ├── routes/         # API routes (auth, leagues, teams, players, trades, draft, chat)
│   │   ├── websocket/      # Real-time WebSocket handler
│   │   └── utils/          # Scoring engine, Draft engine
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema (18+ models)
│   │   └── seed.ts         # MLB player data seeder
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.tsx          # Routes & auth guards
    │   ├── pages/           # All page components
    │   ├── components/      # Layout, Navbar
    │   ├── services/        # API client, WebSocket service
    │   ├── stores/          # Zustand state management
    │   └── styles/          # Design system (CSS)
    └── package.json
```

---

## 🚀 Deploy to Railway (One-Click)

### Step 1: Add PostgreSQL
1. Go to [Railway](https://railway.app) and create a **New Project**
2. Click **"Add Service"** → **"Database"** → **"PostgreSQL"**
3. Railway will provision a PostgreSQL instance automatically

### Step 2: Deploy the App
1. Click **"Add Service"** → **"GitHub Repo"**
2. Select **`stgLockDown/DiamondDraft-FantasySports`**
3. Railway will detect the `Dockerfile` and `railway.toml` automatically

### Step 3: Set Environment Variables
In the app service settings, add these variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Click **"Add Reference"** → select your PostgreSQL service's `DATABASE_URL` |
| `JWT_SECRET` | Generate one: `openssl rand -base64 64` |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `HOST` | `0.0.0.0` |
| `CORS_ORIGIN` | `*` (or your Railway domain) |

### Step 4: Deploy!
Railway will automatically:
1. Build the frontend (React + Vite)
2. Build the backend (Fastify + TypeScript)
3. Run `prisma db push` to create database tables
4. Start the server serving both API and frontend

### Step 5: Seed the Database (Optional)
To populate with MLB player data, open the Railway service shell and run:
```bash
npx tsx prisma/seed.ts
```

---

## 🖥️ Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

### Setup

```bash
# Clone the repo
git clone https://github.com/stgLockDown/DiamondDraft-FantasySports.git
cd DiamondDraft-FantasySports

# ─── Backend ───────────────────────────
cd backend
cp ../.env.example .env
# Edit .env with your local PostgreSQL URL
npm install
npx prisma db push
npx tsx prisma/seed.ts   # Seed 52 MLB players + demo users
npm run dev              # Starts on http://localhost:3001

# ─── Frontend (new terminal) ──────────
cd frontend
npm install
npm run dev              # Starts on http://localhost:5173
```

### Demo Credentials
- **Email:** `demo@diamonddraft.com`
- **Password:** `demo1234`

---

## ⚡ Features

### Draft Room
- **4 Draft Types:** Snake, Auction, Linear, 3rd Round Reversal
- Real-time WebSocket updates
- Auto-pick with positional need AI
- Pick timer with visual countdown
- Draft board + available players + chat

### Scoring Engine
- **Points League** with 50+ categories
- **Roto** (5x5, custom categories)
- **Head-to-Head** categories
- Presets: Standard, Sabermetric, Roto 5x5

### League Management
- Create/join leagues with invite codes
- Commissioner controls (settings, veto trades, delete)
- Public & private leagues
- Standings, rosters, transactions

### Player Database
- 52 seeded MLB players with full stats
- Search, filter by position/team
- Sort by AVG, HR, ERA, projections
- Player detail cards with headshots

### Trade System
- Propose multi-player trades
- League voting & commissioner veto
- Trade deadline enforcement
- Transaction history

### Real-Time
- WebSocket draft rooms
- Live league chat with reactions
- Typing indicators
- Score update broadcasts

### Social
- League chat with message history
- Notification system
- Profile management

### Pricing Tiers
- **Free:** 2 leagues, basic features
- **Pro ($49/yr):** Unlimited leagues, advanced stats, mock drafts
- **Commissioner+ ($99/yr):** Custom scoring, priority support, API access

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login (email or username) |
| `POST` | `/api/auth/refresh` | Refresh JWT token |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/leagues` | Get my leagues |
| `POST` | `/api/leagues` | Create league |
| `GET` | `/api/leagues/:id` | Get league details |
| `POST` | `/api/leagues/:id/join` | Join league |
| `GET` | `/api/players` | Search players |
| `GET` | `/api/players/:id` | Player detail |
| `POST` | `/api/drafts` | Create draft |
| `POST` | `/api/drafts/:id/pick` | Make draft pick |
| `POST` | `/api/trades` | Propose trade |
| `GET` | `/api/health` | Health check |

---

## 🎨 Brand Identity

| Element | Value |
|---------|-------|
| Primary | Deep Navy `#0A1628` |
| Accent | Field Green `#1DB954` |
| Background | Chalk White `#F9FAFB` |
| Heading Font | Playfair Display |
| Body Font | Inter |

---

## 📱 Mobile App (Future)

The architecture is designed for **80%+ code sharing** with React Native:
- Services (`api.ts`, `websocket.ts`) — framework-agnostic
- Stores (`authStore.ts`, `leagueStore.ts`) — Zustand works in RN
- Utils (`scoring.ts`, `draft.ts`) — pure TypeScript
- Only UI components need to be rewritten for React Native

---

## 📄 License

MIT © DiamondDraft