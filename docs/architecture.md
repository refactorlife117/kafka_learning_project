# Architecture

## Service responsibilities

| Service             | Owns (source of truth)                        | Keeps local copies of (read models)                                   |
| ------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| **member-service**  | members, credentials, roles, membership plans | —                                                                     |
| **class-service**   | gym classes, schedule, capacity               | `trainers` (from member events), `booked_count` (from booking events) |
| **booking-service** | bookings                                      | `member_snapshots`, `class_snapshots`                                 |
| **api-gateway**     | nothing (stateless)                           | —                                                                     |

No service reads another service's database, and **services never call each other over HTTP**.
All cross-service data arrives through Kafka.

## Main flows

### 1. Registration

```
POST /api/auth/register ─▶ gateway ─▶ member-service
   BEGIN
     INSERT INTO members ...
     INSERT INTO outbox_events (member.registered)
   COMMIT
                       outbox relay ─▶ fitness.member.events
                                            ├─▶ class-service   (ignores unless role = trainer)
                                            └─▶ booking-service (upsert member_snapshots)
```

### 2. Becoming a trainer

Admin `PATCH /members/:id/role {role:"trainer"}` → `member.updated` →
class-service upserts the `trainers` read model → the trainer can now schedule classes.

### 3. Scheduling & booking

```
trainer POST /classes ─▶ class-service ─▶ class.scheduled ─▶ booking-service (class_snapshots)

member POST /bookings ─▶ booking-service
   BEGIN
     SELECT ... FROM class_snapshots WHERE id = $1 FOR UPDATE   -- serialise the last spot
     check: status, start time, duplicate, capacity, plan limit
     INSERT INTO bookings; INSERT INTO outbox_events (booking.confirmed)
   COMMIT
                     ─▶ booking.confirmed ─▶ class-service (booked_count + 1)
```

### 4. Class cancellation (choreography)

```
class-service:   class.cancelled
booking-service:   └─▶ cancel every confirmed booking  ─▶ booking.cancelled × N
class-service:                                              └─▶ booked_count - 1 each
```

Nobody orchestrates this; each service reacts to facts published by the others.

## Patterns used (and where)

| Pattern                          | Why                                                            | Code                                                         |
| -------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| **Database per service**         | Services deploy and evolve independently                       | each `services/*/src/db`                                     |
| **API gateway**                  | One public entry point; auth verified once at the edge         | `api-gateway/`                                               |
| **Transactional outbox**         | DB change + event are atomic; no lost or phantom events        | `packages/common/src/kafka/outbox.js`                        |
| **Idempotent consumer**          | Kafka is at-least-once; duplicates must be harmless            | `packages/common/src/kafka/consumer.js` (`processed_events`) |
| **Retry + dead-letter queue**    | One poison message must not block a partition                  | `consumer.js` → `<topic>.dlq`                                |
| **Event-carried state transfer** | Events carry full snapshots so consumers can build read models | `events/publishers/*`                                        |
| **Keyed messages**               | Same key → same partition → ordered per entity                 | `enqueueEvent({ key })`                                      |
| **Consumer groups**              | Each service gets every event once; instances share partitions | `KAFKA_GROUP_ID`                                             |
| **Idempotent producer**          | Broker de-dupes producer retries                               | `createProducer()`                                           |

## Delivery guarantees, end to end

1. Business change and event row commit together (outbox).
2. Relay publishes, then marks `published_at`. A crash in between re-publishes → **at-least-once**.
3. Consumer stores `eventId` in `processed_events` **in the same transaction** as its own
   changes, then Kafka commits the offset. A crash before the offset commit means redelivery,
   which is detected as a duplicate → **effectively-once processing**.

## Security notes

- The gateway strips any client-supplied `x-user-*` headers and sets them from the verified JWT.
- Services trust those headers, so **service ports must not be publicly reachable**. In
  production, put them on a private network (or add mTLS / an internal token).
- Passwords are hashed with bcrypt; password hashes never leave member-service, not even in events.

## Going further

- Schema registry (Avro/JSON Schema) to enforce event contracts
- Distributed tracing (OpenTelemetry), since `x-request-id` is already propagated
- `@confluentinc/kafka-javascript`: Confluent's maintained client with a KafkaJS-compatible API
- Change Data Capture (Debezium) instead of a polling outbox relay
- A notification service consuming `booking.*` to send emails
