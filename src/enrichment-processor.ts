import { CallRecord, EnrichedCallRecord } from './call-record.i';
import { OperatorInfo } from './operator-lookup';
import { CallRecordStore, CallRecordSearchIndex } from './storage/storage.i';

type LookupFn = (phoneNumber: string, callDate: string) => Promise<OperatorInfo>;

/**
 * Handles the async enrichment of call records after the handler has already
 * acknowledged receipt. Each record gets operator metadata via the lookup API,
 * then is persisted to both the primary store and search index.
 *
 * Dependencies are injected via constructor to keep this testable without
 * needing to mock module internals.
 */
export class EnrichmentProcessor {
  constructor(
    private store: CallRecordStore,
    private searchIndex: CallRecordSearchIndex,
    private lookupOperator: LookupFn,
  ) {}

  /**
   * Enrich all records in parallel. Uses allSettled so one record failing
   * doesn't prevent the rest from being processed.
   */
  async processBatch(records: CallRecord[]): Promise<void> {
    await Promise.allSettled(records.map(r => this.enrichAndStore(r)));
  }

  private async enrichAndStore(record: CallRecord): Promise<void> {
    const enriched = await this.enrichRecord(record);

    // Write to both stores in parallel — they're independent systems
    await Promise.all([
      this.store.save(enriched),
      this.searchIndex.index(enriched),
    ]);
  }

  private async enrichRecord(record: CallRecord): Promise<EnrichedCallRecord> {
    const start = new Date(record.callStartTime);
    const end = new Date(record.callEndTime);
    const duration = (end.getTime() - start.getTime()) / 1000;

    // The operator lookup API expects dates in 'yy-MM-dd' format
    const callDate = formatCallDate(start);

    // Look up both numbers in parallel — each takes 100-300ms so doing them
    // sequentially would double the enrichment time per record
    const [fromResult, toResult] = await Promise.allSettled([
      this.lookupOperator(record.fromNumber, callDate),
      this.lookupOperator(record.toNumber, callDate),
    ]);

    // TODO: retry failed lookups with backoff before giving up
    const fromInfo = fromResult.status === 'fulfilled' ? fromResult.value : undefined;
    const toInfo = toResult.status === 'fulfilled' ? toResult.value : undefined;

    // Originator-pays model: cost is based on the calling party's operator rate
    const estimatedCost = fromInfo
      ? fromInfo.estimatedCostPerMinute * (duration / 60)
      : undefined;

    return {
      ...record,
      duration,
      fromOperator: fromInfo?.operator,
      toOperator: toInfo?.operator,
      fromCountry: fromInfo?.country,
      toCountry: toInfo?.country,
      estimatedCost,
    };
  }
}

/**
 * Convert a Date to 'yy-MM-dd' format using UTC methods.
 * Required by the operator lookup API (see operator-lookup.ts).
 */
function formatCallDate(date: Date): string {
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
