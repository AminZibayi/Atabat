// In the Name of God, the Creative, the Originator
import { NextResponse } from 'next/server';
import { getAdapter } from '@/scraper';
import type { TripSearchParams } from '@/scraper/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Build search params from query string
    const params: TripSearchParams = {};

    if (searchParams.get('departureFrom')) {
      params.dateFrom = searchParams.get('departureFrom')!;
    }
    if (searchParams.get('departureTo')) {
      params.dateTo = searchParams.get('departureTo')!;
    }
    if (searchParams.get('province')) {
      // Province codes are now passed directly from frontend
      params.provinceCode = searchParams.get('province')!;
    }
    if (searchParams.get('tripType')) {
      // Trip type codes are now passed directly from frontend
      params.borderType = searchParams.get('tripType')!;
    }
    if (searchParams.get('minCapacity')) {
      params.adultCount = parseInt(searchParams.get('minCapacity')!, 10);
    }

    // Get adapter (mock or real based on environment)
    const adapter = getAdapter();

    // Search trips
    const trips = await adapter.searchTrips(params);

    return NextResponse.json({
      success: true,
      trips,
      count: trips.length,
    });
  } catch (error) {
    console.error('Trip search error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در جستجوی سفرها',
        trips: [],
      },
      { status: 500 }
    );
  }
}
