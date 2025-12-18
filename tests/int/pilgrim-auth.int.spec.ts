import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPayload } from 'payload';

describe('Pilgrim Auth Integration', () => {
  let payload: Awaited<ReturnType<typeof getPayload>>;
  // Use a fixed random phone to avoid potential collisions/issues, but random enough
  const testPhone = `0912${Math.floor(Math.random() * 8999999 + 1000000)}`;
  const testPassword = 'testPass123';
  let createdPilgrimId: number | string;

  beforeAll(async () => {
    // Set secret before importing config
    process.env.PAYLOAD_SECRET =
      'testing-secret-key-must-be-long-enough-for-jose-at-least-32-chars';

    // Dynamic import to pick up env var
    const config = (await import('../../src/payload.config')).default;
    payload = await getPayload({ config: await config });
  });

  afterAll(async () => {
    // Cleanup test pilgrim
    if (createdPilgrimId) {
      try {
        await payload.delete({
          collection: 'pilgrims',
          id: createdPilgrimId,
        });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('Registration', () => {
    it('should create a new pilgrim with valid data', async () => {
      // Ensure it doesn't exist
      try {
        const existing = await payload.find({
          collection: 'pilgrims',
          where: { phone: { equals: testPhone } },
        });
        if (existing.docs.length > 0) {
          await payload.delete({ collection: 'pilgrims', id: existing.docs[0].id });
        }
      } catch (e) {}

      const pilgrim = await payload.create({
        collection: 'pilgrims',
        data: {
          phone: testPhone,
          username: testPhone,
          password: testPassword,
          nationalId: '0123456789',
          birthdate: '1380/01/01',
          firstName: 'تست',
          lastName: 'زائر',
        },
      });

      createdPilgrimId = pilgrim.id;

      expect(pilgrim.id).toBeDefined();
      expect(pilgrim.phone).toBe(testPhone);
      expect(pilgrim.firstName).toBe('تست');
    });

    it('should reject duplicate phone number', async () => {
      await expect(
        payload.create({
          collection: 'pilgrims',
          data: {
            phone: testPhone, // Same phone
            password: 'anotherPass',
            nationalId: '9876543210',
            username: testPhone,
            birthdate: '1380/01/01',
          },
          draft: false,
        })
      ).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      await expect(
        payload.create({
          collection: 'pilgrims',
          data: {
            phone: '', // Empty phone
            password: testPassword,
            nationalId: '1111111111',
            username: '',
          },
          draft: false,
        })
      ).rejects.toThrow();
    });
  });

  describe('Authentication', () => {
    it('should login with valid credentials', async () => {
      const result = await payload.login({
        collection: 'pilgrims',
        data: {
          username: testPhone, // Using phone as username for auth
          password: testPassword,
        },
      });

      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await expect(
        payload.login({
          collection: 'pilgrims',
          data: {
            username: testPhone,
            password: 'wrongPassword',
          },
        })
      ).rejects.toThrow();
    });

    it('should reject non-existent user', async () => {
      await expect(
        payload.login({
          collection: 'pilgrims',
          data: {
            username: '09000000000', // Non-existent
            password: testPassword,
          },
        })
      ).rejects.toThrow();
    });
  });
});

describe('Trip Search Integration', () => {
  it('should be able to import adapter', async () => {
    const { getAdapter } = await import('../../src/scraper');
    expect(getAdapter).toBeDefined();
  });

  it('should use mock adapter when USE_MOCK_SCRAPER is true', async () => {
    process.env.USE_MOCK_SCRAPER = 'true';

    const { getAdapter, getAdapterConfig } = await import('../../src/scraper');
    const config = getAdapterConfig();

    expect(config.useMock).toBe(true);

    const adapter = getAdapter();
    const trips = await adapter.searchTrips({});

    expect(trips).toBeInstanceOf(Array);
    expect(trips.length).toBeGreaterThan(0);
  });
});
