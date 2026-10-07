# 🏋️ Fitness Platform — Node.js Microservices + Kafka

A gym class-booking platform built as an event-driven microservices system:

- **API Gateway** (Express) — single entry point, JWT auth, rate limiting, routing
- **3 services**, each with **its own PostgreSQL database** (database-per-service)
- **Apache Kafka** for asynchronous communication between services

Members register, trainers schedule classes (Yoga, HIIT, Spin…), members book them —
and the services keep each other in sync purely through Kafka events.

```
                        ┌─────────────────────┐
   Client ──HTTP──────▶ │  api-gateway :3000  │  JWT verify · rate limit · proxy
                        └──────────┬──────────┘
            ┌──────────────────────┼───────────────────────┐
            ▼                      ▼                       ▼
 ┌────────────────────┐ ┌────────────────────┐ ┌──────────────────────┐
 │ member-service     │ │ class-service      │ │ booking-service      │
 │ :3001              │ │ :3002              │ │ :3003                │
 │ auth, profiles,    │ │ classes, trainers  │ │ bookings, capacity,  │
 │ membership plans   │ │                    │ │ plan limits          │
 └───┬───────────▲────┘ └───┬───────────▲────┘ └───┬─────────────▲────┘
     │ Postgres  │          │ Postgres  │          │ Postgres    │
     ▼ (members) │          ▼ (classes) │          ▼ (bookings)  │
 ════╪═══════════╪══════════╪═══════════╪══════════╪═════════════╪════
     └─publish   │          └─publish   └─consume──┘  publish    └─consume
       fitness.member.events  fitness.class.events  fitness.booking.events
 ═════════════════════════════════ Kafka ════════════════════════════
```

See [docs/architecture.md](docs/architecture.md) for the full event flow and the Kafka
patterns used (outbox, idempotent consumer, DLQ, read models, choreography).

---

## Folder structure

```
.
├── api-gateway/                    # Edge service (no database)
│   └── src/
│       ├── config/                 # env config, logger, routing table (routes.js)
│       ├── middlewares/            # authenticate (JWT), rate-limiter
│       ├── routes/                 # proxy routes, health routes
│       ├── app.js                  # express app composition
│       └── server.js               # process entry point
│
├── services/
│   ├── member-service/
│   │   └── src/
│   │       ├── config/             # env config + logger
│   │       ├── controllers/        # HTTP layer: req → service → res
│   │       ├── services/           # business logic
│   │       ├── repositories/       # SQL / data access
│   │       ├── validators/         # zod request schemas
│   │       ├── routes/             # express routers
│   │       ├── events/
│   │       │   ├── kafka.js        # Kafka client
│   │       │   ├── publishers/     # domain → event (written to outbox)
│   │       │   └── consumers/      # event handlers (class & booking services)
│   │       ├── db/
│   │       │   ├── migrations/     # 001_xxx.sql, 002_xxx.sql …
│   │       │   ├── migrate.js      # `npm run migrate`
│   │       │   └── pool.js
│   │       ├── constants.js
│   │       ├── app.js
│   │       └── server.js           # bootstrap: DB → migrations → Kafka → HTTP
│   ├── class-service/              # same layout
│   └── booking-service/            # same layout
│
├── packages/
│   └── common/                     # @fitness/common — shared library
│       └── src/
│           ├── kafka/              # client, topics, event envelope, outbox relay, consumer
│           ├── db/                 # pool, transactions, migration runner
│           ├── http/               # base app, validation, auth headers, error handler
│           ├── errors/             # AppError hierarchy
│           ├── config.js, logger.js, lifecycle.js
│
├── scripts/create-topics.js        # npm run kafka:topics
├── docs/                           # architecture notes + api.http request collection
├── docker-compose.yml              # Kafka + Kafka UI (+ optional app containers)
└── package.json                    # npm workspaces root
```

Request flow inside a service: **route → validator → controller → service → repository**.
Writes that must notify other services go **service → (same DB transaction) → outbox → Kafka**.

---

## Prerequisites

- Node.js **20+**
- Docker (for Kafka) — or any Kafka 3.x/4.x broker reachable at `localhost:9092`
- **3 PostgreSQL databases** (one per service; can be on the same server). PostgreSQL 13+.

## Getting started

```bash
# 1. Install dependencies for every workspace
npm install

# 2. Start Kafka (+ Kafka UI on http://localhost:8080)
npm run kafka:up

# 3. Configure each app — copy the examples and fill DATABASE_URL in each service
cp api-gateway/.env.example               api-gateway/.env
cp services/member-service/.env.example   services/member-service/.env
cp services/class-service/.env.example    services/class-service/.env
cp services/booking-service/.env.example  services/booking-service/.env
#    ⚠ JWT_SECRET must be identical in api-gateway/.env and member-service/.env

# 4. Run everything (migrations run automatically on start)
npm run dev
```

| App             | Port | Database (example) |
| --------------- | ---- | ------------------ |
| api-gateway     | 3000 | —                  |
| member-service  | 3001 | `fitness_members`  |
| class-service   | 3002 | `fitness_classes`  |
| booking-service | 3003 | `fitness_bookings` |
| Kafka           | 9092 | —                  |
| Kafka UI        | 8080 | —                  |

Run one app at a time: `npm run dev:gateway`, `dev:member`, `dev:class`, `dev:booking`.

Create the first admin (registration always creates a plain `member`):

```bash
npm run create-admin -w member-service -- admin@gym.com 'AdminPass123' Ada Admin
```

### Useful scripts

| Command                | What it does                                         |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | All 4 apps with auto-reload                          |
| `npm run migrate`      | Run DB migrations for all services                   |
| `npm run kafka:up`     | Start Kafka + Kafka UI in Docker                     |
| `npm run kafka:topics` | Create/list all topics (services also do it on boot) |
| `npm run lint`         | ESLint                                               |
| `npm run format`       | Prettier                                             |

Run the whole stack in containers instead: `docker compose --profile apps up -d --build`
(DATABASE_URLs must then be reachable from inside Docker, e.g. `host.docker.internal`).

---

## API (via the gateway, `http://localhost:3000/api`)

Ready-to-run requests: [docs/api.http](docs/api.http) (VS Code "REST Client" / JetBrains HTTP client).

| Method | Path                          | Auth                  | Service |
| ------ | ----------------------------- | --------------------- | ------- |
| POST   | `/auth/register`              | public                | member  |
| POST   | `/auth/login`                 | public                | member  |
| GET    | `/members/me`                 | any                   | member  |
| PATCH  | `/members/me`                 | any                   | member  |
| GET    | `/members`                    | admin                 | member  |
| GET    | `/members/:id`                | self / admin          | member  |
| PATCH  | `/members/:id/role`           | admin                 | member  |
| GET    | `/classes`                    | public                | class   |
| GET    | `/classes/:id`                | public                | class   |
| POST   | `/classes`                    | trainer / admin       | class   |
| PATCH  | `/classes/:id/cancel`         | owner trainer / admin | class   |
| GET    | `/trainers`                   | public                | class   |
| POST   | `/bookings`                   | any                   | booking |
| GET    | `/bookings/me`                | any                   | booking |
| GET    | `/bookings?classId=`          | trainer / admin       | booking |
| GET    | `/bookings/:id`               | owner / staff         | booking |
| PATCH  | `/bookings/:id/cancel`        | owner / admin         | booking |
| GET    | `/health`, `/health/services` | public                | gateway |

Business rules: class capacity is enforced; membership plan limits upcoming bookings
(**basic 2, premium 5, elite unlimited**); a member can't double-book a class.

> The role is inside the JWT, so after an admin changes someone's role they must log in again.

---

## Events

Envelope (every message value):

```json
{
  "eventId": "uuid",
  "eventType": "booking.confirmed",
  "eventVersion": 1,
  "source": "booking-service",
  "occurredAt": "2026-10-07T10:00:00.000Z",
  "data": { "bookingId": "…", "memberId": "…", "classId": "…" }
}
```

| Topic                    | Key        | Event types                              | Producer | Consumers            |
| ------------------------ | ---------- | ---------------------------------------- | -------- | -------------------- |
| `fitness.member.events`  | memberId   | `member.registered`, `member.updated`    | member   | class, booking       |
| `fitness.class.events`   | classId    | `class.scheduled`, `class.cancelled`     | class    | booking              |
| `fitness.booking.events` | bookingId  | `booking.confirmed`, `booking.cancelled` | booking  | class                |
| `<topic>.dlq`            | (original) | messages that failed after 3 attempts    | any      | you (inspect/replay) |

---

## Kafka learning exercises

1. **Watch the flow** — open Kafka UI (http://localhost:8080), book a class and find the
   `booking.confirmed` message; check `class-service` consumer group lag.
2. **Outbox in action** — stop Kafka, register a user (it still succeeds!), look at
   `SELECT * FROM outbox_events WHERE published_at IS NULL`, start Kafka again and watch
   the relay publish it.
3. **Eventual consistency** — stop `booking-service`, register + book quickly after
   restarting it. Read the 409 "profile is still being set up" message and why it exists.
4. **Consumer groups & partitions** — run a second `class-service` on another port
   (`PORT=3012 npm run dev:class`). Partitions get rebalanced between the two instances.
5. **Idempotency** — reset the consumer group offset to the beginning
   (Kafka UI → Consumers → reset offsets) and see every event logged as
   "Duplicate event ignored" instead of being applied twice.
6. **Dead-letter queue** — produce garbage to a topic
   (`docker exec -it fitness-kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic fitness.member.events`)
   and find it in `fitness.member.events.dlq` with error headers.
7. **Choreography** — cancel a class and follow the chain:
   `class.cancelled` → booking-service cancels bookings → `booking.cancelled` × N →
   class-service resets `bookedCount`.
