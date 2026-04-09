Scaffold a new event-driven Lambda handler (NOT HTTP — for EventBridge schedules, SQS queues, SNS topics, S3 events, etc.).

The user will describe what they want in plain English. Read `CLAUDE.md` and `.github/copilot-instructions.md` for the full conventions.

Ask the user for any missing details, then execute all steps below without pausing.

---

## What to ask if not provided

- **Domain** (`system` for infrastructure concerns, or a business domain like `orders`)
- **Event name** (kebab-case, e.g. `on-order-placed`, `process-queue`, `daily-report`)
- **Event source** (EventBridge schedule / SQS / SNS / S3 / DynamoDB Streams / etc.)
- **Event payload shape** — what fields does the event carry?
- **What should the handler do?** — brief description of the business logic

---

## Steps

### 1. Create `src/events/{domain}/{event-name}/handler.ts`

Event handlers live in `src/events/` and are NOT connected to API Gateway.
Each handler is a single file — no `spec/request.interface.ts` needed unless you
want to document the event payload shape.

**EventBridge schedule pattern:**
```typescript
import {ScheduledEvent, Context, Callback} from 'aws-lambda';
import {Logger} from '@vifros/aws-serverless-core';

const logger = new Logger();

export async function handler(_event: ScheduledEvent, _context: Context, callback: Callback): Promise<void> {
  logger.info('[{eventName}] Handler triggered');
  // ... logic
  callback(null, 'done');
}
```

**SQS pattern:**
```typescript
import {SQSEvent, SQSHandler} from 'aws-lambda';
import {Logger} from '@vifros/aws-serverless-core';

const logger = new Logger();

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const payload = JSON.parse(record.body);
    logger.info('[{eventName}] Processing record', {messageId: record.messageId});
    // ... logic
  }
};
```

**SNS pattern:**
```typescript
import {SNSEvent, SNSHandler} from 'aws-lambda';
import {Logger} from '@vifros/aws-serverless-core';

const logger = new Logger();

export const handler: SNSHandler = async (event: SNSEvent): Promise<void> => {
  for (const record of event.Records) {
    const message = JSON.parse(record.Sns.Message);
    logger.info('[{eventName}] Processing SNS message', {subject: record.Sns.Subject});
    // ... logic
  }
};
```

### 2. Add to `config/functions/system.yml` (or create `config/functions/{domain}.yml`)

**EventBridge schedule:**
```yaml
{event-name}:
  handler: src/events/{domain}/{event-name}/handler.handler
  description: {One-line description.}
  events:
    - schedule:
        rate: rate(5 minutes)    # or: cron(0 8 * * ? *)
        enabled: true
```

**SQS:**
```yaml
{event-name}:
  handler: src/events/{domain}/{event-name}/handler.handler
  description: {One-line description.}
  events:
    - sqs:
        arn: !GetAtt {QueueName}.Arn
        batchSize: 10
        functionResponseType: ReportBatchItemFailures
```

**SNS:**
```yaml
{event-name}:
  handler: src/events/{domain}/{event-name}/handler.handler
  description: {One-line description.}
  events:
    - sns:
        arn: !Ref {TopicName}
```

### 3. Register new yml file in `serverless.yml` (only if a new domain yml was created)

Add to the `functions` list:
```yaml
functions:
  - ${file(config/functions/{domain}.yml)}
```

### 4. Verify

Run `npm start` and trigger the event locally, or deploy to dev with `npm run deploy:dev`.
