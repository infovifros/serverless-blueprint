import {Request} from '../../../../common/interfaces/request.interface';

/** Request interface for `POST /v1/items`. */
export interface CreateItemRequest extends Request {
  /**
   * @TJS-description ##body## Display name of the item.
   * @TJS-minLength 1
   * @TJS-maxLength 120
   */
  name: string;

  /**
   * @TJS-description ##body## Human-readable description.
   * @TJS-minLength 1
   * @TJS-maxLength 500
   */
  description: string;

  /**
   * @TJS-description ##body## Unit price in USD. Must be zero or greater.
   * @TJS-type number
   * @TJS-minimum 0
   */
  price: number;
}
