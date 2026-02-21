import { EnrichedCallRecord } from '../call-record.i';
import { CallRecordSearchIndex } from './storage.i';

/** In-memory array index. In production this would be backed by Elasticsearch or similar. */
export class MockSearchIndex implements CallRecordSearchIndex {
  private records: EnrichedCallRecord[] = [];

  async index(record: EnrichedCallRecord): Promise<void> {
    this.records.push(record);
  }

  async getAll(): Promise<EnrichedCallRecord[]> {
    return [...this.records];
  }
}
