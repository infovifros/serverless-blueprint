import {Request} from '../../../../common/interfaces/request.interface';

/** Request interface for `DELETE /v1/items/:id`. */
export interface DeleteItemRequest extends Request {
  /**
   * @TJS-description ##path## UUID of the item to delete.
   */
  id: string;
}
