import { CallRecord } from './call-record.i';

type ParseResult =
  | { success: true; records: CallRecord[] }
  | { success: false; error: string };

const EXPECTED_HEADER = 'id,callStartTime,callEndTime,fromNumber,toNumber,callType,region';

// E.164 format: '+' followed by country code (1-3 digits) and subscriber number, 7-15 digits total
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

const VALID_CALL_TYPES = ['voice', 'video'];

/**
 * Validate a single row of CSV fields and return a CallRecord if valid, null otherwise.
 * We skip invalid records rather than rejecting the whole batch — at high volume,
 * partial success is more useful than all-or-nothing.
 */
function validateRecord(fields: string[]): CallRecord | null {
  const [id, callStartTime, callEndTime, fromNumber, toNumber, callType, region] = fields.map(f => f.trim());

  if (!id) return null;

  // Ensure both timestamps are valid ISO 8601 and the call has positive duration
  const start = new Date(callStartTime);
  const end = new Date(callEndTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  if (end <= start) return null;

  if (!E164_REGEX.test(fromNumber) || !E164_REGEX.test(toNumber)) return null;
  if (!VALID_CALL_TYPES.includes(callType)) return null;
  if (!region) return null;

  return { id, callStartTime, callEndTime, fromNumber, toNumber, callType: callType as 'voice' | 'video', region };
}

/**
 * Parse a raw CSV payload into validated CallRecords.
 *
 * Handles upstream error cases (empty payloads, malformed headers) and skips
 * individual records that fail validation so the rest of the batch can proceed.
 */
export function parseCsvBatch(payload: string): ParseResult {
  // Empty payloads indicate an upstream system error — fail fast
  if (!payload || !payload.trim()) {
    return { success: false, error: 'Empty payload' };
  }

  const lines = payload.trim().split('\n');
  const header = lines[0].trim();

  if (header !== EXPECTED_HEADER) {
    return { success: false, error: 'Invalid CSV header' };
  }

  // Parse data rows, skipping any that are blank or fail validation
  const records: CallRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = line.split(',');
    if (fields.length !== 7) continue;
    const record = validateRecord(fields);
    if (record) records.push(record);
  }

  if (records.length === 0) {
    return { success: false, error: 'No valid records found' };
  }

  return { success: true, records };
}
