import { describe, it, expect, vi } from 'vitest';
import { EnrichmentProcessor } from '../src/enrichment-processor';
import { MockDatabase } from '../src/storage/mock-database';
import { MockSearchIndex } from '../src/storage/mock-search-index';
import { CallRecord } from '../src/call-record.i';

const RECORD: CallRecord = {
  id: 'cdr_001',
  callStartTime: '2026-01-21T14:30:00.000Z',
  callEndTime: '2026-01-21T14:35:30.000Z',
  fromNumber: '+14155551234',
  toNumber: '+442071234567',
  callType: 'voice',
  region: 'us-west',
};

function makeLookup() {
  return vi.fn(async () => ({
    operator: 'TestOp',
    country: 'TestCountry',
    estimatedCostPerMinute: 0.06,
  }));
}

describe('EnrichmentProcessor', () => {
  it('calculates duration and enriches with operator data', async () => {
    const db = new MockDatabase();
    const idx = new MockSearchIndex();
    const processor = new EnrichmentProcessor(db, idx, makeLookup());

    await processor.processBatch([RECORD]);

    const enriched = await db.findById('cdr_001');
    expect(enriched).toBeDefined();
    expect(enriched!.duration).toBe(330);
    expect(enriched!.fromOperator).toBe('TestOp');
    expect(enriched!.estimatedCost).toBeCloseTo(0.06 * (330 / 60));
  });

  it('passes yy-MM-dd formatted date to lookup', async () => {
    const db = new MockDatabase();
    const idx = new MockSearchIndex();
    const lookup = makeLookup();
    const processor = new EnrichmentProcessor(db, idx, lookup);

    await processor.processBatch([RECORD]);

    expect(lookup).toHaveBeenCalledWith('+14155551234', '26-01-21');
    expect(lookup).toHaveBeenCalledWith('+442071234567', '26-01-21');
  });

  it('handles lookup failures gracefully', async () => {
    const db = new MockDatabase();
    const idx = new MockSearchIndex();
    const lookup = vi.fn(async () => { throw new Error('Service down'); });
    const processor = new EnrichmentProcessor(db, idx, lookup);

    await processor.processBatch([RECORD]);

    const enriched = await db.findById('cdr_001');
    expect(enriched).toBeDefined();
    expect(enriched!.duration).toBe(330);
    expect(enriched!.fromOperator).toBeUndefined();
    expect(enriched!.estimatedCost).toBeUndefined();
  });
});
