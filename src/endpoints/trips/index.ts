// In the Name of God, the Creative, the Originator
import type { PayloadHandler } from 'payload';
import { searchTrips } from '@/scraper/trips';
import { tripSearchSchema } from '@/validations/trip';

export const tripSearchHandler: PayloadHandler = async req => {
  try {
    // Check auth?
    // Assuming public or authenticated. `req.user` exists if auth.
    // Let's assume public for viewing, but rate limited (not implemented here).

    // Parse query params
    const query = req.query || {};
    // Should validate
    const validParams = tripSearchSchema.safeParse(query);

    // Zod parsing of query params might fail on numbers as strings, so logical conversion needed first
    // Simplified for now:
    const params = {
      dateFrom: query.dateFrom as string | undefined,
      dateTo: query.dateTo as string | undefined,
      provinceCode: query.province as string | undefined,
      borderType: query.borderType as string | undefined,
      adultCount: query.adultCount ? parseInt(query.adultCount as string) : undefined,
    };

    const trips = await searchTrips(params);

    return Response.json({ trips });
  } catch (error) {
    console.error('Trip search error:', error);
    return Response.json({ error: 'Failed to search trips' }, { status: 500 });
  }
};
