import {Request} from '../../../../shared/interfaces/request.interface';

/** Request interface for `PUT /v1/items/:id`. All body fields are optional (partial update). */
export interface UpdateItemRequest extends Request {
  /**
   * @TJS-description ##path## UUID of the item to update.
   */
  id: string;

  /**
   * @TJS-description ##body## New display name for the item.
   * @TJS-minLength 1
   * @TJS-maxLength 120
   */
  name?: string;

  /**
   * @TJS-description ##body## New description for the item.
   * @TJS-minLength 1
   * @TJS-maxLength 500
   */
  description?: string;

  /**
   * @TJS-description ##body## New unit price in USD.
   * @TJS-type number
   * @TJS-minimum 0
   */
  price?: number;
}
