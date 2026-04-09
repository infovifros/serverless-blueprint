import {HandlerError, Logger} from '@vifros/aws-serverless-core';
import {StatusCodes} from 'http-status-codes';
import {itemStore, Item} from '../../../shared/store/in-memory.store';
import {SingleResourceResponse} from '../../../shared/interfaces/response.interface';
import {ErrorMessages} from '../../../shared/enums/error-messages.enum';
import {GetItemRequest} from './spec/request.interface';

const logger = new Logger();

/**
 * Retrieves a single item by its UUID.
 * Throws a 404 `HandlerError` if no item is found with the given id.
 */
async function getItem(request: GetItemRequest): Promise<SingleResourceResponse<Item>> {
  logger.info('[getItem] Looking up item', {itemId: request.id});

  const foundItem = itemStore.findById(request.id);

  if (!foundItem) {
    logger.warn('[getItem] Item not found', {itemId: request.id});
    throw new HandlerError(ErrorMessages.ItemNotFound, StatusCodes.NOT_FOUND, false, false);
  }

  logger.info('[getItem] Item found', {itemId: foundItem.id});
  return {data: foundItem};
}

export default getItem;
