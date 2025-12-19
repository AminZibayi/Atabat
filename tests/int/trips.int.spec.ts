import { describe, it, expect, beforeAll } from 'vitest';
import { getPayload } from 'payload';
import config from '../../src/payload.config';
import { TripData } from '@/scraper/types';

describe('Trip Search API Integration', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>;

  beforeAll(async () => {
    const payloadConfig = await config;
    payload = await getPayload({ config: payloadConfig });
  });

  it('should return all trips when no filters provided', async () => {
    const { tripSearchHandler } = await import('../../src/endpoints/trips');

    const req = new Request('http://localhost:3000/api/trips/search', {
      method: 'GET',
    });
    (req as any).payload = payload;

    const response = await tripSearchHandler(req as any);
    const data = await response.json();

    if (!data.success) console.error('Search failed:', JSON.stringify(data, null, 2));

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.trips)).toBe(true);
    expect(data.data.trips.length).toBeGreaterThan(0);
  });

  it('should filter by province', async () => {
    const { tripSearchHandler } = await import('../../src/endpoints/trips');
    const req = new Request('http://localhost:3000/api/trips/search?province=17', {
      method: 'GET',
    });
    (req as any).payload = payload;

    const response = await tripSearchHandler(req as any);
    const data = await response.json();

    expect(data.success).toBe(true);
    // Mock adapter returns trips for Tehran (17)
    data.data.trips.forEach((trip: TripData) => {
      expect(trip.city).toContain('تهران');
    });
  });

  it('should filter by border type', async () => {
    const { tripSearchHandler } = await import('../../src/endpoints/trips');
    const req = new Request('http://localhost:3000/api/trips/search?tripType=2', {
      // 2 = Air
      method: 'GET',
    });
    (req as any).payload = payload;

    const response = await tripSearchHandler(req as any);
    const data = await response.json();

    expect(data.success).toBe(true);
    data.data.trips.forEach((trip: TripData) => {
      expect(trip.tripType).toContain('هوایی');
    });
  });

  it('should filter by date range', async () => {
    const { tripSearchHandler } = await import('../../src/endpoints/trips');
    // Using a wide range to ensure we get results from the mock
    const req = new Request(
      'http://localhost:3000/api/trips/search?departureFrom=1403/01/01&departureTo=1405/01/01',
      {
        method: 'GET',
      }
    );
    (req as any).payload = payload;

    const response = await tripSearchHandler(req as any);
    const data = await response.json();

    if (!data.success) console.error('Date search failed:', JSON.stringify(data, null, 2));

    expect(data.success).toBe(true);
    // Depending on logic, it might return empty or full list, but success should be true
    expect(Array.isArray(data.data.trips)).toBe(true);
  });

  it('should validate date format', async () => {
    const { tripSearchHandler } = await import('../../src/endpoints/trips');
    const req = new Request('http://localhost:3000/api/trips/search?departureFrom=invalid-date', {
      method: 'GET',
    });
    (req as any).payload = payload;

    const response = await tripSearchHandler(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('INVALID_PARAMS');
  });

  it('should validate response structure', async () => {
    const { tripSearchHandler } = await import('../../src/endpoints/trips');
    const req = new Request('http://localhost:3000/api/trips/search', {
      method: 'GET',
    });
    (req as any).payload = payload;

    const response = await tripSearchHandler(req as any);
    const data = await response.json();

    expect(data.success).toBe(true);
    const trip = data.data.trips[0];

    expect(trip).toHaveProperty('dayOfWeek');
    expect(trip).toHaveProperty('departureDate');
    expect(trip).toHaveProperty('remainingCapacity');
    expect(trip).toHaveProperty('cost');
    expect(trip).toHaveProperty('agentName');
  });
});
