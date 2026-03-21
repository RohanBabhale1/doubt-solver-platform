# DoubSolve — Real-Time Academic Doubt Solving Platform

A full-stack university capstone project enabling students to post academic doubts and receive real-time answers from peers.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), Socket.io Client, Axios |
| Backend | Node.js, Express, Socket.io |
| Database | PostgreSQL, Prisma ORM |
| Cache / Sessions | Redis (ioredis) |
| Event Streaming | Apache Kafka (kafkajs) |
| Containerization | Docker, Docker Compose |

## Quick Start

### Prerequisites
- Docker Desktop
- Node.js v20+ (for local dev)

### 1. Clone and configure
```bash
git clone https://github.com/RohanBabhale1/doubt-solver-platform.git
cd doubt-solver-platform
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Start with Docker Compose
```bash
docker compose up --build -d
```

### 3. Run database migrations and seed
```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node prisma/seed.js
```

### 4. Open the app
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api/health

## Demo Accounts

| Email | Password |
|-------|----------|
| alice@demo.com | password123 |
| bob@demo.com | password123 |

## API Summary

- **49 REST endpoints** across Auth, Doubts, Replies, Votes, Notifications, Subjects, Search, Profile
- **8 Socket.io real-time events** (new_reply, user_typing, vote_updated, answer_accepted, new_doubt, notification, doubt_solved, user_stopped_typing)
- **3 Kafka topics** (doubt-events, reply-events, vote-events)

## Development (without Docker)

```bash
# Start infra services only
docker compose -f docker-compose.dev.yml up -d

# Backend (new terminal)
cd backend
npm install
cp .env.example .env
.\node_modules\.bin\prisma migrate dev
node prisma/seed.js
npm run dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Project Structure

```
doubt-solver-platform/
├── backend/
│   ├── prisma/           # Schema + migrations + seed
│   ├── src/
│   │   ├── config/       # DB, Redis, Kafka, Socket.io
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # Auth, rate limit, upload, errors
│   │   ├── routes/       # Express routers
│   │   ├── services/     # Cache + Kafka helpers
│   │   └── kafka/        # Producer + consumers
│   └── uploads/          # Uploaded images
└── frontend/
    └── src/
        ├── pages/        # Home, Login, Register, DoubtList, DoubtDetail, etc.
        ├── components/   # Navbar, DoubtCard, ReplyCard, etc.
        ├── context/      # Auth + Socket contexts
        ├── hooks/        # useAuth, useSocket, useFetch
        ├── services/     # Axios API layer
        └── styles/       # Global CSS + Component CSS
```

## Development Phases

| Phase | Description |
|-------|-------------|
| 0 | Repo setup, Docker config, folder structure |
| 1 | Prisma schema, DB migration, seed data |
| 2 | Redis, Kafka, Socket.io, middleware, server |
| 3 | All 8 controllers, 8 route files, Kafka producers/consumers |
| 4 | React foundation: contexts, hooks, API service, Navbar |
| 5 | Home, DoubtList, DoubtCard, NotificationBell |
| 6 | DoubtDetail, CreateDoubt, Notifications, Profile |
| 7 | Services layer, sort bug fix |
| 8 | 404 page, toast system, mobile polish |
| 9 | Complete Postman test collection (49 endpoints) |
| 10 | Production docker-compose.yml |
| 11 | Final Dockerfiles, nginx.conf |
| 12 | Full Docker deployment, migrations, E2E verification |
| 13 | README, final submission |

## Windows Development Notes

- Stop local PostgreSQL before starting Docker:
  `Stop-Service -Name "postgresql-x64-18"` (Admin PowerShell)
- Docker uses WSL2 backend (Windows Home)
- Always use `.\node_modules\.bin\prisma` locally (never `npx prisma`) to avoid Prisma version conflicts
- Git push from regular PowerShell (not VS Code integrated terminal) to avoid credential errors

## Known Fixes Applied

- **Frontend Dockerfile:** Changed to `node:20-alpine` for Vite 8.x compatibility
- **Backend Dockerfile:** Added `openssl` and `curl` packages for Prisma engine and health check
- **sort=popular bug:** Replaced `{ voteCount: 'desc' }` with `{ replies: { _count: 'desc' } }` in doubtController.js
- **nginx.conf:** Added `proxy_read_timeout 86400` for persistent WebSocket connections