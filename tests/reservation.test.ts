// In the Name of God, the Creative, the Originator
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { createReservationHandler } from '@/endpoints/reservations';

// Mock Payload Request
const mockPayload = {
  find: vi.fn(),
  create: vi.fn(),
  findByID: vi.fn(),
};

const mockUser = {
  id: 1,
  collection: 'pilgrims',
  email: 'test@example.com',
};

const createMockReq = (body: any, user: any = mockUser) =>
  ({
    user,
    payload: mockPayload as any,
    json: async () => body,
  }) as any;

describe('Reservation Endpoint Integration', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should reject unauthorized users', async () => {
    const req = createMockReq({}, { id: 1, collection: 'users' }); // Wrong collection
    const res = await createReservationHandler(req);
    // Response object in test env might need mocking or handling if it returns standard Response
    // In actual Payload environment it matches standard Request/Response
    expect(res.status).toBe(401);
  });

  it('should validate request body', async () => {
    const req = createMockReq({}); // Missing fields
    const res = await createReservationHandler(req);
    expect(res.status).toBe(400);
  });

  it('should enforce 24h rule for cancelled reservations', async () => {
    mockPayload.find.mockResolvedValueOnce({
      docs: [
        {
          id: 123,
          status: 'cancelled',
          bookedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
        },
      ],
    });

    const req = createMockReq({ tripId: 'test-trip', passengerCount: 1 });
    const res = await createReservationHandler(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('24 hours');
  });

  it('should allow booking if no active/recent cancelled reservation', async () => {
    mockPayload.find.mockResolvedValueOnce({ docs: [] }); // No previous res

    // Enable MOCK
    process.env.MOCK_SCRAPER = 'true';
    mockPayload.create.mockResolvedValueOnce({ id: 999, status: 'pending' });

    const req = createMockReq({ tripId: 'test-trip', passengerCount: 1 });
    const res = await createReservationHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200); // Or 200 depending on implementation
    expect(json.reservation).toBeDefined();
  });
});
