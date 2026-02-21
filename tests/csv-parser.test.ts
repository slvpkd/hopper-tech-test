import { describe, it, expect } from 'vitest';
import { parseCsvBatch } from '../src/csv-parser';

describe('parseCsvBatch', () => {
  it('parses the example CSV into 3 records', () => {
    const payload = `id,callStartTime,callEndTime,fromNumber,toNumber,callType,region
cdr_001,2026-01-21T14:30:00.000Z,2026-01-21T14:35:30.000Z,+14155551234,+442071234567,voice,us-west
cdr_002,2026-01-21T14:31:15.000Z,2026-01-21T14:33:45.000Z,+442071234567,+14155551234,voice,eu-west
cdr_003,2026-01-21T14:32:00.000Z,2026-01-21T14:47:30.000Z,+14155559876,+447911123456,video,us-west`;

    const result = parseCsvBatch(payload);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.records).toHaveLength(3);
    expect(result.records[0]).toEqual({
      id: 'cdr_001',
      callStartTime: '2026-01-21T14:30:00.000Z',
      callEndTime: '2026-01-21T14:35:30.000Z',
      fromNumber: '+14155551234',
      toNumber: '+442071234567',
      callType: 'voice',
      region: 'us-west',
    });
  });

  it('returns error for empty payload', () => {
    expect(parseCsvBatch('')).toEqual({ success: false, error: 'Empty payload' });
  });

  it('returns error for invalid header', () => {
    const result = parseCsvBatch('wrong,header\ndata,here');
    expect(result).toEqual({ success: false, error: 'Invalid CSV header' });
  });

  it('skips invalid records and keeps valid ones', () => {
    const payload = `id,callStartTime,callEndTime,fromNumber,toNumber,callType,region
cdr_001,2026-01-21T14:30:00.000Z,2026-01-21T14:35:30.000Z,not-a-number,+442071234567,voice,us-west
cdr_002,2026-01-21T14:31:15.000Z,2026-01-21T14:33:45.000Z,+442071234567,+14155551234,voice,eu-west`;

    const result = parseCsvBatch(payload);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBe('cdr_002');
  });
});
