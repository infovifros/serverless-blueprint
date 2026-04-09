import {APIHandler, HandlerResponse} from '@vifros/aws-serverless-core';
import {StatusCodes} from 'http-status-codes';
import {UpdateItemRequest} from './spec/request.interface';
import updateItemSchema from './spec/schemaValidator.json';
import updateItem from './update-item';

/** Lambda entry point for `PUT /v1/items/:id`. */
async function initHandler(request: UpdateItemRequest): Promise<HandlerResponse> {
  const response = await updateItem(request);
  return new HandlerResponse(response, StatusCodes.OK);
}

export const handler = new APIHandler(initHandler, {
  schemaValidator: updateItemSchema,
}).lambdaHandler;
