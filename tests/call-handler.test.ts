import { describe, it, expect, vi } from 'vitest';
import { CallHandler } from '../src/call-handler';
import { EnrichmentProcessor } from '../src/enrichment-processor';
import { MockDatabase } from '../src/storage/mock-database';
import { MockSearchIndex } from '../src/storage/mock-search-index';

const VALID_CSV = `id,callStartTime,callEndTime,fromNumber,toNumber,callType,region
cdr_001,2026-01-21T14:30:00.000Z,2026-01-21T14:35:30.000Z,+14155551234,+442071234567,voice,us-west
cdr_002,2026-01-21T14:31:15.000Z,2026-01-21T14:33:45.000Z,+442071234567,+14155551234,voice,eu-west
cdr_003,2026-01-21T14:32:00.000Z,2026-01-21T14:47:30.000Z,+14155559876,+447911123456,video,us-west`;

function createHandler() {
  const db = new MockDatabase();
  const idx = new MockSearchIndex();
  const lookup = vi.fn(async () => ({
    operator: 'TestOp',
    country: 'TestCountry',
    estimatedCostPerMinute: 0.05,
  }));
  const processor = new EnrichmentProcessor(db, idx, lookup);
  return { handler: new CallHandler(processor), db, idx };
}

describe('CallHandler', () => {
  it('returns { ok: true } for valid CSV', async () => {
    const { handler } = createHandler();
    const result = await handler.handleBatch(VALID_CSV);
    expect(result).toEqual({ ok: true });
  });

  it('returns error for empty payload', async () => {
    const { handler } = createHandler();
    const result = await handler.handleBatch('');
    expect(result).toEqual({ ok: false, error: 'Empty payload' });
  });

  it('responds within 500ms even with slow lookups', async () => {
    const db = new MockDatabase();
    const idx = new MockSearchIndex();
    const lookup = vi.fn(async () => {
      await new Promise(r => setTimeout(r, 200));
      return { operator: 'SlowOp', country: 'SlowCountry', estimatedCostPerMinute: 0.1 };
    });
    const handler = new CallHandler(new EnrichmentProcessor(db, idx, lookup));

    const start = Date.now();
    const result = await handler.handleBatch(VALID_CSV);
    const elapsed = Date.now() - start;

    expect(result).toEqual({ ok: true });
    expect(elapsed).toBeLessThan(500);
  });
});
