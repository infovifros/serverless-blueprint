import {PaginationParams, Request} from '../../../../shared/interfaces/request.interface';

/**
 * Request interface for `GET /v1/items`.
 *
 * All fields are optional — omitting them returns the full list without
 * pagination applied.
 */
export interface ListItemsRequest extends Request, PaginationParams {}
