// In the Name of God, the Creative, the Originator

export const ErrorCodes = {
  // Common
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  INVALID_PARAMS: 'INVALID_PARAMS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',

  // Trips
  TRIP_SEARCH_FAILED: 'TRIP_SEARCH_FAILED',
  TRIP_NOT_FOUND: 'TRIP_NOT_FOUND',

  // Reservations
  RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
  CREATE_RESERVATION_FAILED: 'CREATE_RESERVATION_FAILED',
  ALREADY_RESERVED: 'ALREADY_RESERVED',
  PASSENGER_ALREADY_RESERVED: 'PASSENGER_ALREADY_RESERVED',
  PASSENGER_VALIDATION_FAILED: 'PASSENGER_VALIDATION_FAILED',
  RESERVATION_CANCEL_FAILED: 'RESERVATION_CANCEL_FAILED',
  CANCELLATION_24H_RULE: 'CANCELLATION_24H_RULE',
  ACTIVE_RESERVATION_EXISTS: 'ACTIVE_RESERVATION_EXISTS',

  // Payments
  PAYMENT_INIT_FAILED: 'PAYMENT_INIT_FAILED',
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: ErrorCode = 'INTERNAL_SERVER_ERROR',
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
