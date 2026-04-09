import {Logger} from '@vifros/aws-serverless-core';
import {itemStore, Item} from '../../../shared/store/in-memory.store';
import {ListResourceResponse} from '../../../shared/interfaces/response.interface';
import {ListItemsRequest} from './spec/request.interface';

const logger = new Logger();

/**
 * Returns all items from the in-memory store.
 *
 * Supports optional pagination via `page` and `limit` query parameters.
 * When neither is provided the full list is returned.
 */
async function listItems(request: ListItemsRequest): Promise<ListResourceResponse<Item>> {
  logger.info('[listItems] Fetching items', {page: request.page, limit: request.limit});

  const allItems = itemStore.findAll();

  if (!request.page && !request.limit) {
    logger.info('[listItems] Returning full list', {total: allItems.length});
    return {data: allItems, total: allItems.length};
  }

  const currentPage = request.page ?? 1;
  const pageSize = request.limit ?? 20;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = allItems.slice(startIndex, startIndex + pageSize);

  logger.info('[listItems] Returning paginated list', {
    page: currentPage,
    limit: pageSize,
    returned: paginatedItems.length,
    total: allItems.length,
  });

  return {data: paginatedItems, total: allItems.length};
}

export default listItems;
