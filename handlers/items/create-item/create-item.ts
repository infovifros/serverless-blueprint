import {Logger} from '@vifros/aws-serverless-core';
import {itemStore, Item} from '../../../common/store/in-memory.store';
import {MutationResponse} from '../../../common/interfaces/response.interface';
import {CreateItemRequest} from './interfaces/create-item.interface';

const logger = new Logger();

/**
 * Creates a new item in the store and returns the full record with its
 * auto-generated `id` and timestamps.
 */
async function createItem(request: CreateItemRequest): Promise<MutationResponse<Item>> {
  logger.info('[createItem] Creating item', {name: request.name, price: request.price});

  const createdItem = itemStore.create({
    name: request.name,
    description: request.description,
    price: request.price,
  });

  logger.info('[createItem] Item created', {itemId: createdItem.id});
  return {data: createdItem};
}

export default createItem;
