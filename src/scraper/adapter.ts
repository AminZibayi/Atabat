// In the Name of God, the Creative, the Originator
import type {
  TripData,
  TripSearchParams,
  PassengerInfo,
  ReservationResult,
  ReceiptData,
} from './types';

/**
 * Interface for Atabat scraper operations.
 * Both real Playwright scraper and mock implementation must adhere to this contract.
 */
export interface IAtabatAdapter {
  /**
   * Search for available trips based on filters
   */
  searchTrips(params: TripSearchParams): Promise<TripData[]>;

  /**
   * Select a trip and create a reservation for one or more passengers.
   * The Atabat system requires at least `tripData.minCapacity` passengers.
   */
  createReservation(tripData: TripData, passengers: PassengerInfo[]): Promise<ReservationResult>;

  /**
   * Get receipt data for a reservation
   */
  getReceipt(resId: string): Promise<ReceiptData>;

  /**
   * Get the payment URL for a reservation
   */
  getPaymentUrl(resId: string): Promise<string | null>;

  /**
   * Check if the current session is authenticated
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * Authenticate with the Atabat system (login with credentials)
   */
  authenticate(): Promise<boolean>;
}

/**
 * Configuration for the adapter
 */
export interface AdapterConfig {
  useMock: boolean;
}

/**
 * Get adapter configuration from environment
 */
export function getAdapterConfig(): AdapterConfig {
  return {
    useMock:
      process.env.USE_MOCK_SCRAPER === 'true' ||
      process.env.NODE_ENV === 'test' ||
      process.env.CI === 'true',
  };
}
