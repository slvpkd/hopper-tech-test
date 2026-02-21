# Hopper Tech Test

## Getting Started

Please refer to [coding-exercise.md](./coding-exercise.md) for the full problem description and instructions.

## Setup & Running

```bash
npm install
npm test
```

## Submitting your solution

Create you solution in a fork of this repository. Once you're ready to submit, please add dmanning-resilient as a collaborate on your private repository and send us a message.

## Candidate Notes

### Approach

The core problem is that enrichment (10 records x 2 lookups x 100-300ms) far exceeds the 500ms SLA. So the handler parses and validates synchronously, returns immediately, and kicks off enrichment as a fire-and-forget async task.

```
CSV Payload ──► CallHandler.handleBatch()
                    │
                    ├─ Parse & validate ──► return { ok: true }   (< 500ms)
                    │
                    └─ async ──► EnrichmentProcessor
                                    │
                                    ├─ lookupOperator(from) ┐
                                    ├─ lookupOperator(to)   ┘ in parallel
                                    ├─ calculate duration & cost
                                    └─ save to DB + search index
```

### Production Architecture

In production, the in-process fire-and-forget would be replaced by a message queue to make enrichment durable and scalable:

```
                                          ┌─────────────┐
CSV Payload ──► API Handler ──► SQS/RabbitMQ ──► Worker Pool
                    │                          │    │    │
                    │                          ▼    ▼    ▼
                 { ok: true }            Enrichment Workers
                 (< 500ms)                     │
                                               ▼
                                    ┌──────────┴──────────┐
                                    │                     │
                                PostgreSQL          Elasticsearch
                              (primary store)      (search/analytics)
```

- **Message queue** — if a worker crashes, the message returns to the queue and is retried. Also provides backpressure when enrichment falls behind ingestion.
- **Worker pool** — scales horizontally. Add workers to increase throughput without affecting API response time.
- **Retry with backoff** — the operator lookup has ~5% failure rate. A dead-letter queue catches records that fail after N retries for investigation.
- **PostgreSQL** for the primary store (ACID, relational) and **Elasticsearch** for search/analytics queries (e.g. "all calls from UK operators in the last hour").

### Key Decisions

- **Originator-pays cost model** — estimated cost uses the `fromNumber` operator's rate
- **Skip invalid records** rather than rejecting the whole batch — partial success is more useful at high volume
- **Dependency injection** on `EnrichmentProcessor` — makes testing straightforward without module-level mocking
- **No runtime deps** — CSV schema is fixed so hand-parsing is fine

### Assumptions

- CSV fields don't contain commas or newlines (fixed schema)
- Records with validation errors are skipped; the rest of the batch proceeds
- If an operator lookup fails, the record is still stored with duration — operator fields are just `undefined`
