/**
 * Application-level error messages.
 *
 * Centralise all user-facing error strings here so they can be reused across
 * handlers and kept consistent.  Each value is the human-readable message
 * returned in the error response body.
 */
export enum ErrorMessages {
  ItemNotFound = 'Item not found',
  ItemAlreadyExists = 'An item with this name already exists',
  InvalidItemId = 'The provided item ID is not a valid UUID',
  MissingRequiredFields = 'One or more required fields are missing',
  InvalidPaginationParams = 'Pagination parameters must be positive integers',
}
