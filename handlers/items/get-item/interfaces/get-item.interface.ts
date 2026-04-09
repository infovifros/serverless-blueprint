import {Request} from '../../../../common/interfaces/request.interface';

/** Request interface for `GET /v1/items/:id`. */
export interface GetItemRequest extends Request {
  /**
   * @TJS-description ##path## UUID of the item to retrieve.
   */
  id: string;
}
