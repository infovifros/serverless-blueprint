/**
 * Base request interface shared by all HTTP API handler interfaces.
 *
 * The `headers` object is automatically populated by `APIHandler.localFn()`
 * before the business-logic function receives the request — callers never
 * need to construct it manually.
 *
 * Extend this interface in each handler's `spec/` folder and add your
 * endpoint-specific fields.  Use the `@TJS-description` annotation to tell
 * the schema generator where each field comes from:
 *
 * | Annotation     | Source                        |
 * |----------------|-------------------------------|
 * | `##query##`    | URL query-string parameter    |
 * | `##path##`     | URL path parameter (`:id`)    |
 * | `##body##`     | JSON request body field       |
 * | `##header##`   | HTTP request header           |
 */
export interface Request {
  headers: {
    /** Correlation ID that spans the full request chain across services. */
    'x-transaction-request-id'?: string;
    /** Name of the upstream application or client making the request. */
    'x-remote-application-name'?: string;
    /** Client application name. */
    'x-app-name'?: string;
    /** Client application version (semver string). */
    'x-app-version'?: string;
    /** Opaque identity token forwarded from the caller. */
    'x-user-token'?: string;
  };
}

/**
 * Standard pagination query parameters.  Mix into handler request interfaces
 * when the endpoint supports paginated list responses.
 */
export interface PaginationParams {
  /**
   * @TJS-description ##query## Page number (1-based, default: 1).
   * @TJS-type integer
   * @TJS-minimum 1
   */
  page?: number;

  /**
   * @TJS-description ##query## Maximum number of items per page (default: 20, max: 100).
   * @TJS-type integer
   * @TJS-minimum 1
   * @TJS-maximum 100
   */
  limit?: number;
}
