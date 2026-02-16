type Response = {
    ok: boolean;
    error?: string;
};
export class CallHandler {

    /**
     * Handle a batch of call records
     *
     * @param payload The raw batch of CDRs in CSV format.
     */
    public async handleBatch(payload: string): Promise<Response> {

        // TODO Handler code
        // ...


        return { ok: true };
    }
}