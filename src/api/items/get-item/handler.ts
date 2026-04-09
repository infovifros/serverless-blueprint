import {APIHandler, HandlerResponse} from '@vifros/aws-serverless-core';
import {StatusCodes} from 'http-status-codes';
import {GetItemRequest} from './spec/request.interface';
import getItem from './get-item';

/** Lambda entry point for `GET /v1/items/:id`. */
async function initHandler(request: GetItemRequest): Promise<HandlerResponse> {
  const response = await getItem(request);
  return new HandlerResponse(response, StatusCodes.OK);
}

export const handler = new APIHandler(initHandler).lambdaHandler;
