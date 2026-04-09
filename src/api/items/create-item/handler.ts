import {APIHandler, HandlerResponse} from '@vifros/aws-serverless-core';
import {StatusCodes} from 'http-status-codes';
import {CreateItemRequest} from './spec/request.interface';
import createItemSchema from './spec/schemaValidator.json';
import createItem from './create-item';

/** Lambda entry point for `POST /v1/items`. */
async function initHandler(request: CreateItemRequest): Promise<HandlerResponse> {
  const response = await createItem(request);
  return new HandlerResponse(response, StatusCodes.CREATED);
}

export const handler = new APIHandler(initHandler, {
  schemaValidator: createItemSchema,
}).lambdaHandler;
