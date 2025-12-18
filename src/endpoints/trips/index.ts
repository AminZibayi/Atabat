// In the Name of God, the Creative, the Originator
import type { PayloadHandler } from 'payload';
import { getAdapter } from '@/scraper';
import { tripSearchSchema } from '@/validations/trip';

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
      return Response.json(
        { success: false, message: 'Invalid search parameters', errors: validation.error.format() },
        { status: 400 }
      );
    }

    const params = {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      provinceCode: query.province,
      borderType: query.borderType,
      adultCount: query.adultCount ? parseInt(query.adultCount, 10) : undefined,
    };

    const adapter = getAdapter();

    const trips = await adapter.searchTrips(params);

    return Response.json({ success: true, trips, count: trips.length });
  } catch (error) {
    console.error('Trip search error:', error);
    return Response.json({ success: false, message: 'Failed to search trips' }, { status: 500 });
  }
};
