// In the Name of God, the Creative, the Originator

/**
 * Result codes for successful API responses
 */
export const ResultCodes = {
  OK: 'OK',
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  DELETED: 'DELETED',
} as const;

export type ResultCode = (typeof ResultCodes)[keyof typeof ResultCodes];

/**
 * Error codes organized by category
 */
export const ErrorCodes = {
  // Common HTTP errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  INVALID_PARAMS: 'INVALID_PARAMS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',

  // Trip errors
  TRIP_SEARCH_FAILED: 'TRIP_SEARCH_FAILED',
  TRIP_NOT_FOUND: 'TRIP_NOT_FOUND',

  // Reservation errors
  RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
  RESERVATION_CREATE_FAILED: 'RESERVATION_CREATE_FAILED',
  RESERVATION_CANCEL_FAILED: 'RESERVATION_CANCEL_FAILED',
  RESERVATION_ALREADY_EXISTS: 'RESERVATION_ALREADY_EXISTS',
  RESERVATION_PASSENGER_DUPLICATE: 'RESERVATION_PASSENGER_DUPLICATE',
  RESERVATION_PASSENGER_INVALID: 'RESERVATION_PASSENGER_INVALID',

  // Payment errors
  PAYMENT_INIT_FAILED: 'PAYMENT_INIT_FAILED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: ErrorCode = ErrorCodes.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
