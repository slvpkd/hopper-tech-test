import { parseCsvBatch } from './csv-parser';
import { EnrichmentProcessor } from './enrichment-processor';

type Response = {
    ok: boolean;
    error?: string;
};

export class CallHandler {
    constructor(private enrichmentProcessor: EnrichmentProcessor) {}

    /**
     * Handle a batch of call records
     *
     * @param payload The raw batch of CDRs in CSV format.
     */
    public async handleBatch(payload: string): Promise<Response> {
        const result = parseCsvBatch(payload);

        if (!result.success) {
            return { ok: false, error: result.error };
        }

        // Fire-and-forget: enrich asynchronously so we respond within 500ms.
        // In production this would publish to a durable message queue (e.g. SQS/RabbitMQ).
        this.enrichmentProcessor.processBatch(result.records).catch(err => {
            console.error('Enrichment batch failed:', err);
        });

        return { ok: true };
    }
}
