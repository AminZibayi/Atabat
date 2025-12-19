// In the Name of God, the Creative, the Originator
import { ZodError } from 'zod';
import { AppError, ErrorCode } from './AppError';

export function successResponse<T>(data: T, code: string = 'SUCCESS', statusCode: number = 200) {
  return Response.json(
    {
      success: true,
      data,
      code,
    },
    { status: statusCode }
  );
}

export function errorResponse(error: unknown) {
  let statusCode = 500;
  let code: ErrorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown = undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code as ErrorCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    code = 'INVALID_PARAMS';
    message = 'Invalid parameters';
    details = error.format();
  } else if (error instanceof Error) {
    message = error.message;
  }

  return Response.json(
    {
      success: false,
      code,
      message,
      details,
    },
    { status: statusCode }
  );
}
