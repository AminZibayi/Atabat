// In the Name of God, the Creative, the Originator
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/utils/apiResponse';
import { AppError, ErrorCodes, ResultCodes } from '@/utils/AppError';

describe('successResponse', () => {
  it('should return a 200 response with success true and data', async () => {
    const data = { id: 1, name: 'test' };
    const res = successResponse(data);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual(data);
    expect(json.code).toBe(ResultCodes.OK);
  });

  it('should use a custom result code and status', async () => {
    const res = successResponse({ id: 2 }, ResultCodes.CREATED, 201);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.code).toBe(ResultCodes.CREATED);
  });
});

describe('errorResponse', () => {
  it('should handle AppError correctly', async () => {
    const error = new AppError('Not found', ErrorCodes.NOT_FOUND, 404, { id: 99 });
    const res = errorResponse(error);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe(ErrorCodes.NOT_FOUND);
    expect(json.message).toBe('Not found');
    expect(json.details).toEqual({ id: 99 });
  });

  it('should handle ZodError correctly', async () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });
    if (result.success) throw new Error('Expected parse to fail');

    const res = errorResponse(result.error);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('INVALID_PARAMS');
    expect(json.message).toBe('Invalid parameters');
    expect(json.details).toBeDefined();
  });

  it('should handle a generic Error', async () => {
    const error = new Error('unexpected');
    const res = errorResponse(error);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('INTERNAL_SERVER_ERROR');
    expect(json.message).toBe('unexpected');
  });

  it('should handle an unknown non-Error value', async () => {
    const res = errorResponse('some string error');
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toBe('An unexpected error occurred');
  });
});
