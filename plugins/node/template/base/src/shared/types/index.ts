export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface SuccessResponse<T = any> {
  success: true,
  data?: T
}

export interface ErrorResponse {
  success: false,
  message: string
}


export interface PaginatedResponse<T = any> {
  success: true,
  data: T[],
  meta: PaginationMeta
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
