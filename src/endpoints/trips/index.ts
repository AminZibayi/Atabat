// In the Name of God, the Creative, the Originator
import type { PayloadHandler } from 'payload';
import { getAdapter } from '@/scraper';
import { tripSearchSchema } from '@/validations/trip';
import { convertToEnglishDigits } from '@/utils/digits';
import { AppError, ErrorCodes } from '@/utils/AppError';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export const tripSearchHandler: PayloadHandler = async req => {
  try {
    // Check auth?
    // Assuming public or authenticated. `req.user` exists if auth.
    // Let's assume public for viewing, but rate limited (not implemented here).

    // Parse query params
    const searchParams = new URL(req.url as string, 'http://localhost').searchParams;
    const query = Object.fromEntries(searchParams.entries());

    // Validate with Zod
    const validation = tripSearchSchema.safeParse(query);

    if (!validation.success) {
      return errorResponse(validation.error);
    }

    // Use validated data from Zod - these are now the correct client-friendly field names
    const validatedInput = validation.data;

    // Map client-friendly names to scraper's expected parameter names
    const params = {
      dateFrom: validatedInput.departureFrom
        ? convertToEnglishDigits(validatedInput.departureFrom)
        : undefined,
      dateTo: validatedInput.departureTo
        ? convertToEnglishDigits(validatedInput.departureTo)
        : undefined,
      provinceCode: validatedInput.province,
      borderType: validatedInput.tripType || undefined,
      adultCount: validatedInput.minCapacity,
    };

    const adapter = getAdapter();

    try {
      const trips = await adapter.searchTrips(params);
      return successResponse({ trips, count: trips.length });
    } catch (adapterError) {
      console.error('Adapter search error:', adapterError);
      throw new AppError('Trip search failed', ErrorCodes.TRIP_SEARCH_FAILED, 500, adapterError);
    }
  } catch (error) {
    console.error('Trip search error:', error);
    return errorResponse(error);
  }
};
