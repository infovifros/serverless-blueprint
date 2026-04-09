import {APIHandler, HandlerResponse} from '@vifros/aws-serverless-core';
import {StatusCodes} from 'http-status-codes';
import {ListItemsRequest} from './interfaces/list-items.interface';
import listItems from './list-items';

/**
 * Lambda entry point for `GET /v1/items`.
 *
 * No request body or path parameters required.
 * Optional query params: `page` (integer ≥ 1) and `limit` (integer 1–100).
 */
async function initHandler(request: ListItemsRequest): Promise<HandlerResponse> {
  const response = await listItems(request);
  return new HandlerResponse(response, StatusCodes.OK);
}

export const handler = new APIHandler(initHandler).lambdaHandler;
