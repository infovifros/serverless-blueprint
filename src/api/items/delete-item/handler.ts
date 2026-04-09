import {APIHandler, HandlerResponse} from '@vifros/aws-serverless-core';
import {StatusCodes} from 'http-status-codes';
import {DeleteItemRequest} from './spec/request.interface';
import deleteItem from './delete-item';

/**
 * Lambda entry point for `DELETE /v1/items/:id`.
 * Returns HTTP 204 No Content on success (HandlerResponse with null body).
 */
async function initHandler(request: DeleteItemRequest): Promise<HandlerResponse> {
  await deleteItem(request);
  return new HandlerResponse(null, StatusCodes.NO_CONTENT);
}

export const handler = new APIHandler(initHandler).lambdaHandler;
