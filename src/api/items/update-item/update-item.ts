import {HandlerError, Logger} from '@vifros/aws-serverless-core';
import {StatusCodes} from 'http-status-codes';
import {itemStore, Item} from '../../../shared/store/in-memory.store';
import {MutationResponse} from '../../../shared/interfaces/response.interface';
import {ErrorMessages} from '../../../shared/enums/error-messages.enum';
import {UpdateItemRequest} from './spec/request.interface';

const logger = new Logger();

/**
 * Partially updates an existing item.
 * Only fields present in the request body are modified — omitted fields keep
 * their current values.
 *
 * Throws a 404 `HandlerError` if no item exists with the given id.
 */
async function updateItem(request: UpdateItemRequest): Promise<MutationResponse<Item>> {
  logger.info('[updateItem] Updating item', {itemId: request.id});

  const updatedItem = itemStore.update(request.id, {
    ...(request.name !== undefined && {name: request.name}),
    ...(request.description !== undefined && {description: request.description}),
    ...(request.price !== undefined && {price: request.price}),
  });

  if (!updatedItem) {
    logger.warn('[updateItem] Item not found', {itemId: request.id});
    throw new HandlerError(ErrorMessages.ItemNotFound, StatusCodes.NOT_FOUND, false, false);
  }

  logger.info('[updateItem] Item updated', {itemId: updatedItem.id});
  return {data: updatedItem};
}

export default updateItem;
