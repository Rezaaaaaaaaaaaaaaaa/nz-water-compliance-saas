/**
 * Data Transfer Objects (DTOs) for API Responses
 *
 * Provides consistent, type-safe response formats across all API endpoints
 */

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  meta?: ResponseMeta;
}

/**
 * Error Response
 */
export interface ErrorResponse {
  message: string;
  code: string;
  statusCode: number;
  correlationId?: string;
  details?: Record<string, any>;
  timestamp: string;
  stack?: string[];
}

/**
 * Response Metadata
 */
export interface ResponseMeta {
  correlationId?: string;
  timestamp?: string;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ResponseMeta & {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Response Builder Class
 *
 * Fluent API for building consistent responses
 */
export class ResponseBuilder {
  /**
   * Success response with data
   */
  static success<T>(data: T, meta?: Partial<ResponseMeta>): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  /**
   * Error response
   */
  static error(
    message: string,
    code: string = 'ERROR',
    statusCode: number = 500,
    details?: Record<string, any>,
    correlationId?: string
  ): ApiResponse<never> {
    return {
      success: false,
      error: {
        message,
        code,
        statusCode,
        correlationId,
        details,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Paginated response
   */
  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    correlationId?: string
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data,
      meta: {
        correlationId,
        timestamp: new Date().toISOString(),
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Created response (201)
   */
  static created<T>(data: T, correlationId?: string): ApiResponse<T> {
    return ResponseBuilder.success(data, { correlationId });
  }

  /**
   * No content response (204)
   */
  static noContent(correlationId?: string): ApiResponse<null> {
    return {
      success: true,
      data: null,
      meta: {
        correlationId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Accepted response (202)
   */
  static accepted<T>(data: T, correlationId?: string): ApiResponse<T> {
    return ResponseBuilder.success(data, { correlationId });
  }
}

/**
 * Common Response DTOs
 */

export interface MessageResponse {
  message: string;
}

export interface IdResponse {
  id: string;
}

export interface CountResponse {
  count: number;
}

export interface StatusResponse {
  status: string;
  message?: string;
}

export interface BulkOperationResponse {
  successful: number;
  failed: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

/**
 * Helper Functions
 */

/**
 * Calculate pagination parameters
 */
export function calculatePagination(
  page: number = 1,
  limit: number = 20
): PaginationParams {
  const safeLimit = Math.min(Math.max(limit, 1), 100); // Max 100 items per page
  const safePage = Math.max(page, 1);
  const offset = (safePage - 1) * safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    offset,
  };
}

/**
 * Build pagination meta from query results
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): ResponseMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}
