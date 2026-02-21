import { EnrichedCallRecord } from '../call-record.i';
import { CallRecordStore } from './storage.i';

/** In-memory Map store. In production this would be backed by PostgreSQL or similar. */
export class MockDatabase implements CallRecordStore {
  private records = new Map<string, EnrichedCallRecord>();

  async save(record: EnrichedCallRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  async findById(id: string): Promise<EnrichedCallRecord | undefined> {
    return this.records.get(id);
  }

  async getAll(): Promise<EnrichedCallRecord[]> {
    return Array.from(this.records.values());
  }
}
