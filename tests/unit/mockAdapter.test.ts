// In the Name of God, the Creative, the Originator
import { describe, it, expect, beforeEach } from 'vitest';
import { MockAdapter } from '@/scraper/mockAdapter';
import type { TripSearchParams, PassengerInfo, TripData } from '@/scraper/types';

describe('MockAdapter', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
  });

  describe('searchTrips', () => {
    it('should return all trips when no filters provided', async () => {
      const trips = await adapter.searchTrips({});
      expect(trips).toBeInstanceOf(Array);
      expect(trips.length).toBeGreaterThan(0);
    });

    it('should filter trips by province', async () => {
      const params: TripSearchParams = { provinceCode: '17' }; // Tehran
      const trips = await adapter.searchTrips(params);

      trips.forEach(trip => {
        expect(trip.city).toBe('تهران');
      });
    });

    it('should filter trips by air travel type', async () => {
      const params: TripSearchParams = { borderType: '2' }; // Air
      const trips = await adapter.searchTrips(params);

      trips.forEach(trip => {
        expect(trip.tripType).toContain('هوایی');
      });
    });

    it('should filter trips by land travel type', async () => {
      const params: TripSearchParams = { borderType: '1' }; // Land
      const trips = await adapter.searchTrips(params);

      trips.forEach(trip => {
        expect(trip.tripType).toContain('زمینی');
      });
    });

    it('should filter trips by minimum capacity', async () => {
      const params: TripSearchParams = { adultCount: 5 };
      const trips = await adapter.searchTrips(params);

      trips.forEach(trip => {
        expect(trip.remainingCapacity).toBeGreaterThanOrEqual(5);
      });
    });

    it('should return trip data with all required fields', async () => {
      const trips = await adapter.searchTrips({});
      const trip = trips[0];

      expect(trip).toHaveProperty('dayOfWeek');
      expect(trip).toHaveProperty('departureDate');
      expect(trip).toHaveProperty('remainingCapacity');
      expect(trip).toHaveProperty('tripType');
      expect(trip).toHaveProperty('cost');
      expect(trip).toHaveProperty('city');
      expect(trip).toHaveProperty('agentName');
      expect(trip).toHaveProperty('groupCode');
      expect(trip).toHaveProperty('najafHotel');
      expect(trip).toHaveProperty('karbalaHotel');
    });
  });

  describe('createReservation', () => {
    let sampleTrip: TripData;

    beforeEach(async () => {
      const trips = await adapter.searchTrips({});
      sampleTrip = trips[0];
    });

    it('should create reservation with valid passenger data', async () => {
      const passenger: PassengerInfo = {
        nationalId: '0123456789',
        birthdate: '1370/01/15',
        phone: '09123456789',
      };

      const result = await adapter.createReservation(sampleTrip, passenger);

      expect(result.success).toBe(true);
      expect(result.reservationId).toBeDefined();
      expect(result.reservationId).toMatch(/^[a-f0-9-]{36}$/);
    });

    it('should reject invalid national ID (wrong length)', async () => {
      const passenger: PassengerInfo = {
        nationalId: '123', // Too short
        birthdate: '1370/01/15',
        phone: '09123456789',
      };

      const result = await adapter.createReservation(sampleTrip, passenger);

      expect(result.success).toBe(false);
      expect(result.message).toContain('کد ملی');
    });

    it('should reject invalid birthdate format', async () => {
      const passenger: PassengerInfo = {
        nationalId: '0123456789',
        birthdate: '1370-01-15', // Wrong format
        phone: '09123456789',
      };

      const result = await adapter.createReservation(sampleTrip, passenger);

      expect(result.success).toBe(false);
      expect(result.message).toContain('تاریخ');
    });

    it('should reject invalid phone number', async () => {
      const passenger: PassengerInfo = {
        nationalId: '0123456789',
        birthdate: '1370/01/15',
        phone: '1234567890', // Doesn't start with 09
      };

      const result = await adapter.createReservation(sampleTrip, passenger);

      expect(result.success).toBe(false);
      expect(result.message).toContain('تلفن');
    });

    it('should include warning about cancellation policy', async () => {
      const passenger: PassengerInfo = {
        nationalId: '0123456789',
        birthdate: '1370/01/15',
        phone: '09123456789',
      };

      const result = await adapter.createReservation(sampleTrip, passenger);

      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('ساعت'); // Check for Persian word 'hour'
    });
  });

  describe('getReceipt', () => {
    it('should return receipt data for any resId', async () => {
      const resId = 'test-reservation-id';
      const receipt = await adapter.getReceipt(resId);

      expect(receipt.resId).toBe(resId);
      expect(receipt.itinerary).toBeInstanceOf(Array);
      expect(receipt.passengers).toBeInstanceOf(Array);
    });

    it('should include all required receipt fields', async () => {
      const receipt = await adapter.getReceipt('test-id');

      expect(receipt).toHaveProperty('city');
      expect(receipt).toHaveProperty('tripType');
      expect(receipt).toHaveProperty('departureDate');
      expect(receipt).toHaveProperty('agentName');
      expect(receipt).toHaveProperty('agentPhone');
      expect(receipt).toHaveProperty('paymentUrl');
    });

    it('should return itinerary with city and hotel info', async () => {
      const receipt = await adapter.getReceipt('test-id');

      expect(receipt.itinerary.length).toBeGreaterThan(0);
      const item = receipt.itinerary[0];
      expect(item).toHaveProperty('city');
      expect(item).toHaveProperty('hotel');
      expect(item).toHaveProperty('entryDate');
    });

    it('should return passenger info in receipt', async () => {
      const receipt = await adapter.getReceipt('test-id');

      expect(receipt.passengers.length).toBeGreaterThan(0);
      const passenger = receipt.passengers[0];
      expect(passenger).toHaveProperty('nationalId');
      expect(passenger).toHaveProperty('firstName');
      expect(passenger).toHaveProperty('cost');
    });
  });

  describe('getPaymentUrl', () => {
    it('should return valid payment URL', async () => {
      const resId = 'test-res-id';
      const url = await adapter.getPaymentUrl(resId);

      expect(url).toBeDefined();
      expect(url).toContain('atabatorg.haj.ir');
      expect(url).toContain(resId);
    });
  });

  describe('authentication', () => {
    it('should start as unauthenticated', async () => {
      const isAuth = await adapter.isAuthenticated();
      expect(isAuth).toBe(false);
    });

    it('should authenticate successfully', async () => {
      const result = await adapter.authenticate();
      expect(result).toBe(true);
    });

    it('should be authenticated after login', async () => {
      await adapter.authenticate();
      const isAuth = await adapter.isAuthenticated();
      expect(isAuth).toBe(true);
    });
  });
});
