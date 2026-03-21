# DoubSolve — Real-Time Academic Doubt Solving Platform

A full-stack university capstone project that enables students to post academic doubts and receive real-time answers from peers. Built with a modern microservices-inspired architecture using WebSockets, event streaming, and in-memory caching.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite), Socket.io Client, Axios |
| Backend | Node.js, Express.js, Socket.io |
| Database | PostgreSQL 15, Prisma ORM |
| Cache & Sessions | Redis 7 (ioredis) |
| Event Streaming | Apache Kafka (KafkaJS) |
| Containerization | Docker, Docker Compose |

---

## Features

- **Real-Time Replies** — Replies appear instantly for all viewers via Socket.io WebSockets
- **Live Typing Indicators** — See when other students are typing a reply
- **Upvoting System** — Vote on helpful replies with live count updates
- **Accepted Answers** — Doubt authors can mark the best reply as accepted
- **Push Notifications** — Kafka-driven notification pipeline with real-time delivery
- **Subject Filtering** — Browse doubts by academic subject category
- **Full-Text Search** — Search doubts by keyword or subject
- **Image Uploads** — Attach images to doubts via Multer
- **JWT Authentication** — Secure login with Redis-based token blacklisting on logout
- **Rate Limiting** — Redis-based sliding window rate limiting (10 doubts/hour)
- **User Profiles** — View stats, posted doubts, and replies per user

---

## Architecture

```
Browser (React + Socket.io Client)
        │
        ▼
  Nginx (port 3000)
        ├── /api/*      →  Express REST API  (port 5000)
        ├── /socket.io  →  Socket.io Server  (port 5000)
        └── /uploads    →  Static Files      (port 5000)
                                │
               ┌────────────────┼────────────────┐
               ▼                ▼                ▼
          PostgreSQL          Redis            Kafka
          (Prisma ORM)    (Cache, Sessions,  (Event Streaming,
          Primary Store    Rate Limiting,     Notifications)
                           Token Blacklist)
```

### Real-Time Flow
```
Student posts reply
    → REST API saves to PostgreSQL
    → Socket.io emits new_reply to doubt room
    → All viewers receive reply instantly
    → Kafka publishes reply-added event
    → Notification consumer creates DB record
    → Socket.io pushes notification to recipient
```

---

## API Overview

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | 6 | Register, Login, Logout, Get Me, Refresh |
| Doubts | 11 | Full CRUD, Popular, Recent, Unsolved, My Doubts |
| Replies | 6 | Create, Update, Delete, Accept Answer |
| Votes | 3 | Toggle Vote, Get Votes, My Votes |
| Notifications | 6 | List, Unread, Count, Mark Read, Delete |
| Subjects | 4 | List, Create, By Subject, Stats |
| Search | 3 | Search Doubts, Subjects, Users |
| Profile | 5 | Get Profile, Update, Avatar, Stats |
| Utility | 3 | Health, Platform Stats, Online Count |

**Total: 47 REST endpoints**

### Socket.io Events

| Direction | Event | Description |
|-----------|-------|-------------|
| Client → Server | `join_doubt` | Subscribe to doubt room |
| Client → Server | `typing_start` | Broadcast typing state |
| Client → Server | `mark_online` | Register online presence |
| Server → Client | `new_reply` | Real-time reply delivery |
| Server → Client | `vote_updated` | Live vote count update |
| Server → Client | `answer_accepted` | Answer accepted broadcast |
| Server → Client | `notification` | Personal notification push |
| Server → Client | `new_doubt` | New doubt broadcast to all |

### Kafka Topics

| Topic | Events |
|-------|--------|
| `doubt-events` | doubt-created, doubt-deleted, doubt-solved |
| `reply-events` | reply-added, reply-deleted, answer-accepted |
| `vote-events` | reply-upvoted, vote-removed |

---

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/RohanBabhale1/doubt-solver-platform.git
cd doubt-solver-platform
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Start the platform
```bash
docker compose up --build -d
```

### 4. Run database migrations and seed
```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node prisma/seed.js
```

### 5. Open the app
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api/health |

---

## Demo Accounts

| Name | Email | Password |
|------|-------|----------|
| Alice Johnson | alice@demo.com | password123 |
| Bob Smith | bob@demo.com | password123 |

---

## Local Development (without full Docker build)

```bash
# Start only infrastructure services
docker compose -f docker-compose.dev.yml up -d

# Terminal 1 — Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## Project Structure

```
doubt-solver-platform/
├── docker-compose.yml          # Production — all 6 services
├── docker-compose.dev.yml      # Development — infra only
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (6 models)
│   │   ├── migrations/         # Versioned SQL migrations
│   │   └── seed.js             # Seed script (subjects + demo users)
│   ├── src/
│   │   ├── config/             # Redis, Kafka, Socket.io, Prisma clients
│   │   ├── controllers/        # Business logic (8 controllers)
│   │   ├── middleware/         # Auth, rate limit, upload, error handlers
│   │   ├── routes/             # Express routers (8 route files)
│   │   ├── services/           # Cache and Kafka helper wrappers
│   │   └── kafka/              # Producer + notification/analytics consumers
│   ├── uploads/                # User-uploaded images
│   └── server.js               # Entry point
│
└── frontend/
    ├── src/
    │   ├── pages/              # 9 pages (Home, DoubtList, DoubtDetail, etc.)
    │   ├── components/         # Reusable UI components
    │   ├── context/            # AuthContext, SocketContext
    │   ├── hooks/              # useAuth, useSocket, useFetch
    │   ├── services/           # Axios API layer
    │   └── styles/             # Global CSS + Component CSS
    └── nginx.conf              # SPA routing + WebSocket proxy
```

---

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | Registered students with bcrypt-hashed passwords |
| `subjects` | Academic categories (Mathematics, Physics, CS, etc.) |
| `doubts` | Student questions with optional image attachments |
| `replies` | Answers to doubts with vote counts |
| `votes` | Junction table — prevents duplicate votes |
| `notifications` | Created by Kafka consumer, pushed via Socket.io |

---

## Docker Services

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| doubt_postgres | postgres:15-alpine | 5432 | Primary database |
| doubt_redis | redis:7-alpine | 6379 | Cache, sessions, rate limiting |
| doubt_zookeeper | cp-zookeeper:7.4.0 | 2181 | Kafka coordinator |
| doubt_kafka | cp-kafka:7.4.0 | 9092 | Event streaming |
| doubt_backend | Node.js 18 | 5000 | REST API + Socket.io |
| doubt_frontend | Nginx + React | 3000 | SPA + reverse proxy |

---

## Development Phases

| Phase | Description |
|-------|-------------|
| 0 | Repository setup, Docker configuration, folder structure |
| 1 | Prisma schema, database migration, seed data |
| 2 | Redis, Kafka, Socket.io configuration, middleware, server entry point |
| 3 | All 8 controllers, 8 route files, Kafka producers and consumers |
| 4 | React foundation — contexts, hooks, API service, Navbar, Footer |
| 5 | Home page, DoubtList, DoubtCard, NotificationBell components |
| 6 | DoubtDetail, CreateDoubt, Notifications, Profile pages |
| 7 | Services layer (cacheService, kafkaService) |
| 8 | toast notifications, mobile responsive polish |
| 9 | Complete Postman test collection (47 endpoints) |
| 10 | Production docker-compose.yml with named networks and volumes |
| 11 | Finalised Dockerfiles and Nginx configuration |
| 12 | Full Docker deployment, migrations, end-to-end verification |
| 13 | README, final submission |

---

## Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- **JWT** authentication with 7-day expiry
- **Redis token blacklist** — instant token invalidation on logout
- **Rate limiting** — 10 doubt posts per user per hour
- **Ownership checks** — users can only edit/delete their own content
- **Input validation** — all endpoints validate required fields
- **SQL injection prevention** — all queries via Prisma parameterized API
- **File upload security** — JPEG/PNG only, 5MB maximum

---

## Useful Commands

```bash
# View all running containers
docker compose ps

# View backend logs
docker compose logs -f backend

# Open Redis CLI
docker exec -it doubt_redis redis-cli

# Open PostgreSQL shell
docker exec -it doubt_postgres psql -U student doubtsolverdb

# Stop all containers
docker compose down

# Full reset (removes all data)
docker compose down -v
```

---

## Project Statistics

| Metric | Count |
|--------|-------|
| REST API Endpoints | 47 |
| Socket.io Events | 8 client + 8 server |
| Kafka Topics | 3 |
| Consumer Groups | 2 |
| Docker Containers | 6 |
| Database Tables | 6 |
| React Pages | 8 |

---

*Stack: Node.js · Express · Socket.io · PostgreSQL · Prisma · Redis · Kafka · Docker · React*