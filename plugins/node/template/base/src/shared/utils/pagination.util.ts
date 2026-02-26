

import { PaginationParams, PaginationMeta } from '../types';

/**
 * Calculate pagination offset
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  return {
    total,
    page,
    limit,
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: PaginationParams): {
  page: number;
  limit: number;
} {
  let { page, limit } = params;

  // Validate page
  page = Math.max(1, page);

  // Validate limit (between 1 and 100)
  limit = Math.max(1, Math.min(100, limit));

  return { page, limit };
}

/**
 * Check if there's a next page
 */
export function hasNextPage(page: number, totalPages: number): boolean {
  return page < totalPages;
}

/**
 * Check if there's a previous page
 */
export function hasPreviousPage(page: number): boolean {
  return page > 1;
}

/**
 * Get next page number (or null if no next page)
 */
export function getNextPage(
  page: number,
  totalPages: number
): number | null {
  return hasNextPage(page, totalPages) ? page + 1 : null;
}

/**
 * Get previous page number (or null if no previous page)
 */
export function getPreviousPage(page: number): number | null {
  return hasPreviousPage(page) ? page - 1 : null;
}
