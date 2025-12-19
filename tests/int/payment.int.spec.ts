import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPayload } from 'payload';
import config from '../../src/payload.config';
import { Pilgrim } from '@/payload-types';

describe('Payment API Integration', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>;
  let pilgrim: Pilgrim;

  beforeAll(async () => {
    process.env.USE_MOCK_SCRAPER = 'true';
    const payloadConfig = await config;
    payload = await getPayload({ config: payloadConfig });

    const testPhone = `09${Math.floor(Math.random() * 900000000 + 100000000)}`;
    pilgrim = await payload.create({
      collection: 'pilgrims',
      data: {
        phone: testPhone,
        username: testPhone,
        password: 'testPassword123',
        nationalId: '1234567890',
        birthdate: '1370/01/01',
      },
    });
  });

  afterAll(async () => {
    if (pilgrim) {
      // Cleanup all reservations first
      const reservations = await payload.find({
        collection: 'reservations',
        where: {
          pilgrim: { equals: pilgrim.id },
        },
      });
      for (const res of reservations.docs) {
        await payload.delete({ collection: 'reservations', id: res.id });
      }

      await payload.delete({
        collection: 'pilgrims',
        id: pilgrim.id,
      });
    }
  });

  it('should reject unauthenticated requests', async () => {
    const { initiatePaymentHandler } = await import('../../src/endpoints/payments');
    const req = new Request('http://localhost:3000/api/payments/initiate', {
      method: 'POST',
    });
    (req as any).payload = payload;

    const response = await initiatePaymentHandler(req as any);
    expect(response.status).toBe(401);
  });

  it('should return mock payment URL', async () => {
    // Create a reservation first
    const reservation = await payload.create({
      collection: 'reservations',
      data: {
        pilgrim: pilgrim.id,
        status: 'pending',
        bookedAt: new Date().toISOString(),
        externalResId: 'test-external-guid-123',
        tripSnapshot: { selectButtonId: 'test' } as any,
      },
    });

    const { initiatePaymentHandler } = await import('../../src/endpoints/payments');

    // Pass the Payload ID of the reservation
    const req = new Request('http://localhost:3000/api/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({ reservationId: reservation.id }),
    });
    (req as any).payload = payload;
    (req as any).user = { ...pilgrim, collection: 'pilgrims' };

    const response = await initiatePaymentHandler(req as any);
    const data = await response.json();

    if (!data.data?.paymentUrl)
      console.error('Payment URL generation failed:', JSON.stringify(data, null, 2));

    expect(response.status).toBe(200);
    expect(data.data.paymentUrl).toBeDefined();
    expect(data.data.paymentUrl).toContain('atabatorg.haj.ir');
    expect(data.data.paymentUrl).toContain('test-external-guid-123'); // Should use external ID
  });
});
