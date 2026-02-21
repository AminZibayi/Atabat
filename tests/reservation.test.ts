// In the Name of God, the Creative, the Originator
import { describe, it, expect, vi, afterEach } from 'vitest';
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
  nationalId: '0123456789',
  birthdate: '1370/01/01',
  phone: '09121234567',
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
    expect(res.status).toBe(401);
  });

  it('should validate request body', async () => {
    const req = createMockReq({}); // Missing fields
    const res = await createReservationHandler(req);
    expect(res.status).toBe(400);
  });

  it('should validate passengers array is required', async () => {
    const req = createMockReq({
      tripSnapshot: {
        rowIndex: '0',
        tripIdentifier: 'test',
        departureDate: '1404/01/01',
        groupCode: '123',
        agentName: 'Test',
        cost: 1000,
        selectButtonScript: 'test',
      },
      // Missing passengers array
    });
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

    const req = createMockReq({
      tripSnapshot: {
        rowIndex: '0',
        tripIdentifier: 'test',
        departureDate: '1404/01/01',
        groupCode: '123',
        agentName: 'Test',
        cost: 1000,
        selectButtonScript: 'test',
      },
      passengers: [{ nationalId: '0123456789', birthdate: '1370/01/01', phone: '09121234567' }],
    });
    const res = await createReservationHandler(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.code).toContain('CANCELLATION');
  });

  it('should allow booking if no active/recent cancelled reservation', async () => {
    mockPayload.find.mockResolvedValueOnce({ docs: [] }); // No previous res

    // Enable MOCK
    process.env.MOCK_SCRAPER = 'true';
    mockPayload.create.mockResolvedValueOnce({ id: 999, status: 'pending' });

    const req = createMockReq({
      tripSnapshot: {
        rowIndex: '0',
        tripIdentifier: 'test',
        departureDate: '1404/01/01',
        groupCode: '123',
        agentName: 'Test',
        cost: 1000,
        selectButtonScript: 'test',
      },
      passengers: [{ nationalId: '0123456789', birthdate: '1370/01/01', phone: '09121234567' }],
    });
    const res = await createReservationHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.reservation).toBeDefined();
  });
});
