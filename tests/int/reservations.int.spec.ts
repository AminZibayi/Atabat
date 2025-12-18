import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPayload } from 'payload';
import config from '../../src/payload.config';
import { Pilgrim } from '@/payload-types';

describe('Reservation API Integration', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>;
  let pilgrim: Pilgrim;
  let tripId: string;

  beforeAll(async () => {
    process.env.USE_MOCK_SCRAPER = 'true';
    const payloadConfig = await config;
    payload = await getPayload({ config: payloadConfig });

    // Create a test pilgrim
    const testPhone = `09${Math.floor(Math.random() * 900000000 + 100000000)}`;
    pilgrim = await payload.create({
      collection: 'pilgrims',
      data: {
        phone: testPhone,
        username: testPhone,
        password: 'testPassword123',
        firstName: 'Test',
        lastName: 'Pilgrim',
        nationalId: '1234567890',
        birthdate: '1370/01/01',
      },
    });

    // Get a valid trip ID from mock adapter
    const { getAdapter } = await import('../../src/scraper');
    const adapter = getAdapter();
    const trips = await adapter.searchTrips({});
    tripId = trips[0].selectButtonId || 'test-trip-id';
  });

  afterAll(async () => {
    // Cleanup
    if (pilgrim) {
      await payload.delete({
        collection: 'pilgrims',
        id: pilgrim.id,
      });
      // Cleanup reservations for this pilgrim
      try {
        await payload.delete({
          collection: 'reservations',
          where: {
            pilgrim: { equals: pilgrim.id },
          },
        });
      } catch (e) {}
    }
  });

  describe('Create Reservation', () => {
    it('should reject unauthenticated requests', async () => {
      const { createReservationHandler } = await import('../../src/endpoints/reservations');
      const req = new Request('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ tripId, passengerCount: 1 }),
      });
      (req as any).payload = payload;

      const response = await createReservationHandler(req as any);
      expect(response.status).toBe(401);
    });

    it('should validate request body', async () => {
      const { createReservationHandler } = await import('../../src/endpoints/reservations');
      const req = new Request('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({}), // Missing tripId
      });
      (req as any).payload = payload;
      (req as any).user = { ...pilgrim, collection: 'pilgrims' };

      const response = await createReservationHandler(req as any);
      expect(response.status).toBe(400);
    });

    it('should create reservation successfully', async () => {
      // Ensure no active reservation exists
      await payload.delete({
        collection: 'reservations',
        where: { pilgrim: { equals: pilgrim.id } },
      });

      const { createReservationHandler } = await import('../../src/endpoints/reservations');
      const req = new Request('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ tripId, passengerCount: 1 }),
      });
      (req as any).payload = payload;
      (req as any).user = { ...pilgrim, collection: 'pilgrims' };

      const response = await createReservationHandler(req as any);
      const data = await response.json();

      if (response.status !== 200) console.error('Reservation creation failed:', data);

      expect(response.status).toBe(200);
      expect(data.reservation).toBeDefined();
      expect(data.reservation.status).toBe('pending');

      const resPilgrimId =
        typeof data.reservation.pilgrim === 'object'
          ? data.reservation.pilgrim.id
          : data.reservation.pilgrim;
      expect(resPilgrimId).toBe(pilgrim.id);
    });

    it('should block new reservation if one is active', async () => {
      const { createReservationHandler } = await import('../../src/endpoints/reservations');
      const req = new Request('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ tripId, passengerCount: 1 }),
      });
      (req as any).payload = payload;
      (req as any).user = { ...pilgrim, collection: 'pilgrims' };

      const response = await createReservationHandler(req as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('active reservation');
    });

    it('should enforce 24-hour rule for cancelled reservations', async () => {
      // Cleanup active reservations first
      await payload.delete({
        collection: 'reservations',
        where: { pilgrim: { equals: pilgrim.id } },
      });

      // Manually create a cancelled reservation recently
      // Need to use 'any' to bypass strict Payload options if generating types creates conflict in tests
      await payload.create({
        collection: 'reservations',
        data: {
          pilgrim: pilgrim.id,
          status: 'cancelled',
          bookedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          tripSnapshot: { id: 'cancelled-trip' } as any,
        } as any,
      });

      // Try to create new one
      const { createReservationHandler } = await import('../../src/endpoints/reservations');
      const req = new Request('http://localhost:3000/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ tripId, passengerCount: 1 }),
      });
      (req as any).payload = payload;
      (req as any).user = { ...pilgrim, collection: 'pilgrims' };

      const response = await createReservationHandler(req as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('24 hours');
    });
  });

  describe('Get Receipt', () => {
    it('should return receipt for valid reservation', async () => {
      const res = await payload.create({
        collection: 'reservations',
        data: {
          pilgrim: pilgrim.id,
          status: 'confirmed',
          bookedAt: new Date().toISOString(),
          tripSnapshot: { id: 'receipt-trip' } as any,
          receiptData: {
            resId: 'receipt-test-id',
            city: 'Karbala',
            itinerary: [],
            passengers: [],
          } as any,
        } as any,
      });

      const { getReceiptHandler } = await import('../../src/endpoints/reservations');
      const req = new Request(`http://localhost:3000/api/reservations/${res.id}/receipt`, {
        method: 'GET',
      });
      (req as any).payload = payload;
      (req as any).user = { ...pilgrim, collection: 'pilgrims' };
      (req as any).routeParams = { id: res.id.toString() };

      const response = await getReceiptHandler(req as any);
      const data = await response.json();

      expect(data.receipt).toBeDefined();
      expect(data.receipt.resId).toBe('receipt-test-id');

      // cleanup
      await payload.delete({ collection: 'reservations', id: res.id });
    });

    it('should return 404 for non-existent reservation', async () => {
      const { getReceiptHandler } = await import('../../src/endpoints/reservations');
      const req = new Request(`http://localhost:3000/api/reservations/999999/receipt`, {
        method: 'GET',
      });
      (req as any).payload = payload;
      (req as any).user = { ...pilgrim, collection: 'pilgrims' };
      (req as any).routeParams = { id: '999999' };

      const response = await getReceiptHandler(req as any);
      expect(response.status).toBe(404);
    });

    it("should return 403 for other pilgrim's reservation", async () => {
      const otherPilgrim = await payload.create({
        collection: 'pilgrims',
        data: {
          phone: `09${Math.floor(Math.random() * 900000000)}`,
          username: `other${Date.now()}`,
          password: 'pass',
          nationalId: '1111111111',
          birthdate: '1370/01/01',
        },
      });

      const res = await payload.create({
        collection: 'reservations',
        data: {
          pilgrim: otherPilgrim.id,
          status: 'confirmed',
          bookedAt: new Date().toISOString(),
          tripSnapshot: { id: 'other-trip' } as any,
        } as any,
      });

      const { getReceiptHandler } = await import('../../src/endpoints/reservations');
      const req = new Request(`http://localhost:3000/api/reservations/${res.id}/receipt`, {
        method: 'GET',
      });
      (req as any).payload = payload;
      (req as any).user = { ...pilgrim, collection: 'pilgrims' };
      (req as any).routeParams = { id: res.id.toString() };

      const response = await getReceiptHandler(req as any);
      expect(response.status).toBe(403);

      // cleanup
      await payload.delete({ collection: 'reservations', id: res.id });
      await payload.delete({ collection: 'pilgrims', id: otherPilgrim.id });
    });
  });
});
