# TypeScript Coding Exercise: Call Record Processing

## Background

We operate a telecommunications analytics platform that processes phone call records in near real-time. Our system receives call detail records (CDRs) from telecom providers at high volume. Each batch must be acknowledged quickly (sub-500ms) to meet our SLAs with the upstream systems.

## Time Expectation

This exercise should take no more than **2-4 hours**. We value quality over completeness - it's better to have a well-implemented subset than a rushed full implementation.

## What We're Looking For

- **Well-Structured Code**: Clean, maintainable TypeScript with proper types
- **Code Quality**: Focus on writing quality code - a well-written happy-path test is sufficient
- **Performance**: How you meet the 500ms acknowledgment requirement
- **Error Handling**: Graceful handling of validation errors and API failures
- **System Design**: How you structure the flow from ingestion through enrichment to storage
- **AI Usage**: Use of AI tools is fine (and encouraged where appropriate). If you use AI, please still sanity-check outputs and ensure you understand what you’re submitting.
- **Documentation**: Brief explanation of your approach - a basic README is fine

## Out of Scope

- **A Deployed Application**: The code and thought process are what we're interested in
- **A Complex Authentication/Authorisation Model**: Same as point #1
- **Real DB/Search Integration**: Mocks/stubs are sufficient for this exercise

## The Challenge

Build a TypeScript-based call record processing system that:

1. **Accepts** batches of call records in CSV format (typically 10 records per batch)
2. **Parses and validates** the CSV data
3. **Acknowledges** receipt quickly (< 500ms)
4. **Enriches** records by calling an external operator lookup API to fetch operator/country metadata and pricing (e.g., estimated cost per minute) for the phone numbers involved in each call
5. **Stores** enriched records in a database and search index

## Assumptions

- API endpoint infrastructure already exists - you're writing the handler code only
- You can use any libraries or approaches you see fit
- **No need to integrate with actual database or search technologies** - mocks/stubs are sufficient

## Hints/Guidance

The API handler may not need to do all the processing itself. You can optionally suggest an architectural approach/design that would help meet the sub-500ms acknowledgment requirement if you'd like to demonstrate your system design skills.

## Requirements

### Data Structures

#### Incoming CSV Format

Each batch contains approximately 10 records with the following structure:

```csv
id,callStartTime,callEndTime,fromNumber,toNumber,callType,region
cdr_001,2026-01-21T14:30:00.000Z,2026-01-21T14:35:30.000Z,+14155551234,+442071234567,voice,us-west
cdr_002,2026-01-21T14:31:15.000Z,2026-01-21T14:33:45.000Z,+442071234567,+14155551234,voice,eu-west
cdr_003,2026-01-21T14:32:00.000Z,2026-01-21T14:47:30.000Z,+14155559876,+447911123456,video,us-west
```

Occasionally the incoming messages may be empty (indicating an error in an upstream system). You should gracefully handle such scenarios.

The interfaces below give you an idea of how the parsed and enriched data may be represented in code. They are available for your use in the GitHub repo provided.

#### Parsed Call Record

```typescript
interface CallRecord {
  id: string;
  callStartTime: string; // ISO 8601 format
  callEndTime: string;   // ISO 8601 format
  fromNumber: string;
  toNumber: string;
  callType: 'voice' | 'video';
  region: string;
}
```

#### Enriched Call Record

```typescript
interface EnrichedCallRecord extends CallRecord {
  duration: number; // calculated in seconds
  fromOperator?: string;
  toOperator?: string;
  fromCountry?: string;
  toCountry?: string;
  estimatedCost?: number;
}
```

## Provided Mock API

We provide a mock operator lookup function in our GitHub repo:

```typescript
/**
 * Mock operator lookup service
 * Takes 100-300ms and occasionally fails (~5% failure rate)
 *
 * @param phoneNumber - Phone number in E.164 format (e.g., +14155551234)
 * @param callDate - Call start date in 'yy-MM-dd' format (e.g., '26-01-21')
 * @returns Operator information including pricing
 */
async function lookupOperator(
  phoneNumber: string,
  callDate: string
): Promise<OperatorInfo>;

interface OperatorInfo {
  operator: string;
  country: string;
  estimatedCostPerMinute: number;
}
```

**Note**: You'll need to convert the ISO 8601 timestamp to 'yy-MM-dd' format for the operator lookup.

## Database and Search Index

For the purposes of this exercise, **there's no need to integrate with actual database or search technologies**. Instead:

- Create mock/stub implementations that demonstrate how your code would interact with these systems
- Include brief comments explaining your technology choices (e.g., PostgreSQL, Elasticsearch, etc.)
- Show how data would flow to these systems in your architecture

## Example Usage

Your solution should look something like this:

```typescript
import { CallRecordProcessor } from './processor';

const processor = new CallRecordProcessor();

// Process a batch (CSV string)
const csvBatch = `id,callStartTime,callEndTime,fromNumber,toNumber,callType,region
cdr_001,2026-01-21T14:30:00.000Z,2026-01-21T14:35:30.000Z,+14155551234,+442071234567,voice,us-west`;

const result = await processor.processBatch(csvBatch);

console.log(`Acknowledged batch in ${result.ackTimeMs}ms`);
// Enrichment and storage can happen asynchronously
```
````
