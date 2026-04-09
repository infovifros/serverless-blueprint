/**
 * Standard response envelope for a single-resource endpoint (GET /resource/:id).
 */
export interface SingleResourceResponse<TResource> {
  data: TResource | null;
}

/**
 * Standard response envelope for a list endpoint (GET /resource).
 */
export interface ListResourceResponse<TResource> {
  data: TResource[];
  total: number;
}

/**
 * Standard response envelope for a create/update endpoint.
 * Returns the full updated resource so callers don't need a follow-up GET.
 */
export interface MutationResponse<TResource> {
  data: TResource;
}
