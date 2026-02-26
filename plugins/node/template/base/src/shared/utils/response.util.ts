

import {
  SuccessResponse,
  ErrorResponse,
  PaginatedResponse,
  PaginationMeta,
} from '../types';

/**
 * Create success response
 */
export function successResponse<T = any>(
  data?: T,
  message?: string
): SuccessResponse<T> {
  return {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
  };
}

/**
 * Create error response
 */
export function errorResponse(
  error: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error,
    ...(details && { details }),
  };
}

/**
 * Create paginated response
 */
export function paginatedResponse<T = any>(
  data: T[],
  meta: PaginationMeta
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}

/**
 * Create created response (201)
 */
export function createdResponse<T = any>(
  data: T,
  message: string = 'Resource created successfully'
): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Create no content response (204)
 */
export function noContentResponse(): { success: true } {
  return {
    success: true,
  };
}
