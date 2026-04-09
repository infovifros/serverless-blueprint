import {Callback, Context, ScheduledEvent} from 'aws-lambda';
import {InvokeCommand, LambdaClient} from '@aws-sdk/client-lambda';
import {Logger} from '@vifros/aws-serverless-core';

const lambdaClient = new LambdaClient({});
const logger = new Logger();

/**
 * Names of all HTTP API Lambda functions in this service that should be kept warm.
 * Add a new entry here whenever you add a new endpoint.
 *
 * The full function name is constructed at runtime as:
 *   `${SERVICE_NAME}-${SERVICE_STAGE}-${functionShortName}`
 */
const FUNCTIONS_TO_WARM: string[] = ['list-items', 'get-item', 'create-item', 'update-item', 'delete-item'];

/**
 * Sends an async invocation to a Lambda function carrying the keep-warm header.
 * `BaseHandler.lambdaHandler()` detects the header and returns early without
 * executing any business logic, resetting the idle timeout of the container.
 */
async function invokeWithWarmPing(qualifiedFunctionName: string): Promise<void> {
  const warmPingPayload = {
    headers: {'X-KEEP-LAMBDA-WARN': 'BBBBBBBBBBBPPPP000'},
  };

  const invokeCommand = new InvokeCommand({
    FunctionName: qualifiedFunctionName,
    InvocationType: 'Event', // Async — fire and forget
    Payload: Buffer.from(JSON.stringify(warmPingPayload)),
  });

  try {
    logger.debug('[warm-up] Pinging function', {functionName: qualifiedFunctionName});
    await lambdaClient.send(invokeCommand);
    logger.info('[warm-up] Ping sent', {functionName: qualifiedFunctionName});
  } catch (invocationError: unknown) {
    // Log but do not rethrow — a single failed ping should not abort the rest.
    logger.error('[warm-up] Failed to ping function', {
      functionName: qualifiedFunctionName,
      error: invocationError,
    });
  }
}

/**
 * Scheduled Lambda handler that keeps all HTTP API functions warm.
 *
 * Triggered by a CloudWatch Events / EventBridge schedule (see `config/functions/system.yml`).
 * Each invocation pings every function in `FUNCTIONS_TO_WARM` asynchronously.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function handler(_event: ScheduledEvent, _context: Context, callback: Callback): Promise<void> {
  logger.info('[warm-up] Starting warm-up cycle', {functionCount: FUNCTIONS_TO_WARM.length});

  const serviceName = process.env.SERVICE_NAME ?? 'serverless-blueprint';
  const serviceStage = process.env.SERVICE_STAGE ?? 'local';

  for (const shortFunctionName of FUNCTIONS_TO_WARM) {
    const qualifiedName = `${serviceName}-${serviceStage}-${shortFunctionName}`;
    logger.info('[warm-up] Processing function', {qualifiedName});
    await invokeWithWarmPing(qualifiedName);
  }

  logger.info('[warm-up] Warm-up cycle complete');
  callback(null, 'Warm-up cycle complete');
}
