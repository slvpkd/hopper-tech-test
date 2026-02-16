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
- **AI Usage**: Use of AI tools is fine (and encouraged where appropriate). If you use AI, please still sanity-check outputs and ensure you understand what you’re submitting (and be prepared to say which parts are AI generated). 
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

As a starting point, the provided [`call-handler.ts`](src/call-handler.ts) provides the basic interface for handling incoming batches of call records. 

## Requirements

### Data Structures

#### Incoming raw calls

Each batch contains approximately 10 records. The data structure is represented by the `CallRecord` type in [`call-record.i.ts`](src/call-record.i.ts). It contains these fields:

- `id`: Unique identifier for the call
- `callStartTime`: ISO 8601 formatted timestamp
- `callEndTime`: ISO 8601 formatted timestamp
- `fromNumber`: Calling phone number
- `toNumber`: Called phone number
- `callType`: Either 'voice' or 'video'
- `region`: Regional identifier

Occasionally the incoming messages may be empty (indicating an error in an upstream system). You should gracefully handle such scenarios.

#### Stored enriched calls
The `EnrichedCallRecord` in [`call-record.i.ts`](src/call-record.i.ts) provides a suggested output format for the CDRS after enriching with operator/country metadata from the operator lookup API. It contains these fields:

- `duration`: Call duration in seconds (calculated)
- `fromOperator`: Operator of the calling number
- `toOperator`: Operator of the called number
- `fromCountry`: Country of the calling number
- `toCountry`: Country of the called number
- `estimatedCost`: Estimated cost of the call

## Provided Mock API

We provide a mock operator lookup function in our GitHub repo.

**Implementation available in [`operator-lookup.ts`](src/operator-lookup.ts)**

The `lookupOperator` function provides:
- Takes 100-300ms to simulate network latency
- Occasionally fails (~5% failure rate) to simulate real-world API behavior
- Accepts a phone number in E.164 format (e.g., `+14155551234`)
- Accepts a call date in 'yy-MM-dd' format (e.g., `'26-01-21'`)
- Returns `OperatorInfo` containing operator name, country, and estimated cost per minute

The `OperatorInfo` interface includes:
- `operator`: The telecom operator name
- `country`: The country of the phone number
- `estimatedCostPerMinute`: Pricing information in dollars

**Note**: You'll need to convert the ISO 8601 timestamp to 'yy-MM-dd' format for the operator lookup.

## Database and Search Index

For the purposes of this exercise, **there's no need to integrate with actual database or search technologies**. Instead:

- Create mock/stub implementations that demonstrate how your code would interact with these systems
- Include brief comments explaining your technology choices (e.g., PostgreSQL, Elasticsearch, etc.)
- Show how data would flow to these systems in your architecture
