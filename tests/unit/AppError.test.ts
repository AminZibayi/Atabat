// In the Name of God, the Creative, the Originator
import { describe, it, expect } from 'vitest';
import { AppError, ErrorCodes, ResultCodes } from '@/utils/AppError';

describe('AppError', () => {
  it('should create an error with default values', () => {
    const error = new AppError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR);
    expect(error.statusCode).toBe(500);
    expect(error.details).toBeUndefined();
    expect(error.name).toBe('AppError');
  });

  it('should create an error with all custom values', () => {
    const details = { field: 'phone' };
    const error = new AppError('Not found', ErrorCodes.NOT_FOUND, 404, details);
    expect(error.message).toBe('Not found');
    expect(error.code).toBe(ErrorCodes.NOT_FOUND);
    expect(error.statusCode).toBe(404);
    expect(error.details).toEqual(details);
  });

  it('should be an instance of Error', () => {
    const error = new AppError('test');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof AppError).toBe(true);
  });

  it('should preserve instanceof check across prototype chain', () => {
    const error = new AppError('test');
    // Ensures Object.setPrototypeOf(this, AppError.prototype) is working
    expect(Object.getPrototypeOf(error)).toBe(AppError.prototype);
  });
});

describe('ErrorCodes', () => {
  it('should include all expected error codes', () => {
    expect(ErrorCodes.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR');
    expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
    expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCodes.BAD_REQUEST).toBe('BAD_REQUEST');
    expect(ErrorCodes.TRIP_NOT_FOUND).toBe('TRIP_NOT_FOUND');
    expect(ErrorCodes.RESERVATION_NOT_FOUND).toBe('RESERVATION_NOT_FOUND');
    expect(ErrorCodes.RESERVATION_CREATE_FAILED).toBe('RESERVATION_CREATE_FAILED');
    expect(ErrorCodes.RESERVATION_PASSENGER_DUPLICATE).toBe('RESERVATION_PASSENGER_DUPLICATE');
    expect(ErrorCodes.PAYMENT_INIT_FAILED).toBe('PAYMENT_INIT_FAILED');
  });
});

describe('ResultCodes', () => {
  it('should include all expected result codes', () => {
    expect(ResultCodes.OK).toBe('OK');
    expect(ResultCodes.CREATED).toBe('CREATED');
    expect(ResultCodes.UPDATED).toBe('UPDATED');
    expect(ResultCodes.DELETED).toBe('DELETED');
  });
});
