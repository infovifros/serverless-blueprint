import {HandlerError, Logger} from '@vifros/aws-serverless-core';
import {StatusCodes} from 'http-status-codes';
import {itemStore} from '../../../common/store/in-memory.store';
import {ErrorMessages} from '../../../common/enums/error-messages.enum';
import {DeleteItemRequest} from './interfaces/delete-item.interface';

const logger = new Logger();

/**
 * Deletes an item by its UUID.
 * Returns `null` on success (the handler maps this to HTTP 204 No Content).
 * Throws a 404 `HandlerError` if no item exists with the given id.
 */
async function deleteItem(request: DeleteItemRequest): Promise<null> {
  logger.info('[deleteItem] Deleting item', {itemId: request.id});

  const wasDeleted = itemStore.delete(request.id);

  if (!wasDeleted) {
    logger.warn('[deleteItem] Item not found', {itemId: request.id});
    throw new HandlerError(ErrorMessages.ItemNotFound, StatusCodes.NOT_FOUND, false, false);
  }

  logger.info('[deleteItem] Item deleted', {itemId: request.id});
  return null;
}

export default deleteItem;
