import { EnrichedCallRecord } from '../call-record.i';

/**
 * Primary data store for enriched call records.
 * In production: PostgreSQL — we need ACID guarantees and the data is relational.
 */
export interface CallRecordStore {
  save(record: EnrichedCallRecord): Promise<void>;
  findById(id: string): Promise<EnrichedCallRecord | undefined>;
  getAll(): Promise<EnrichedCallRecord[]>;
}

/**
 * Search/analytics index for enriched call records.
 * In production: Elasticsearch — optimised for full-text search and aggregation
 * queries (e.g. "all calls from UK operators in the last hour").
 */
export interface CallRecordSearchIndex {
  index(record: EnrichedCallRecord): Promise<void>;
  getAll(): Promise<EnrichedCallRecord[]>;
}
