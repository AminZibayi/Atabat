// In the Name of God, the Creative, the Originator

export * from './types';
export * from './adapter';
export * from './mockAdapter';
export * from './browser';
export * from './auth';
export * from './trips';
export * from './reservation';
export * from './receipt';
export * from './status';

import type {
  TripSearchParams,
  TripData,
  ReservationResult,
  PassengerInfo,
  ReceiptData,
} from './types';
import type { IAtabatAdapter } from './adapter';
import { getAdapterConfig } from './adapter';
import { getMockAdapter } from './mockAdapter';
import { getContext, isSessionValid } from './browser';
import { searchTrips, selectTrip } from './trips';
import { createReservation } from './reservation';
import { scrapeReceipt } from './receipt';
import { authenticate } from './auth';

/**
 * Real adapter implementation that wraps the Playwright scraper functions.
 * This connects the interface to the actual scraper implementations.
 */
class RealAdapter implements IAtabatAdapter {
  async searchTrips(params: TripSearchParams): Promise<TripData[]> {
    return searchTrips(params);
  }

  async createReservation(
    tripData: TripData,
    passenger: PassengerInfo
  ): Promise<ReservationResult> {
    const context = await getContext();
    const page = await context.newPage();

    try {
      // Navigate to trips page and select the trip
      await page.goto('https://atabatorg.haj.ir/Kargozar/KargroupResLock.aspx');

      // Select the trip using stored button ID
      if (tripData.selectButtonId) {
        await selectTrip(page, tripData.selectButtonId);
      }

      // Create reservation with passenger info
      return await createReservation(page, passenger);
    } finally {
      await page.close();
    }
  }

  async getReceipt(resId: string): Promise<ReceiptData> {
    return scrapeReceipt(resId);
  }

  async getPaymentUrl(resId: string): Promise<string | null> {
    const receipt = await this.getReceipt(resId);
    return receipt.paymentUrl || null;
  }

  async isAuthenticated(): Promise<boolean> {
    const context = await getContext();
    const page = await context.newPage();
    try {
      return await isSessionValid(page);
    } finally {
      await page.close();
    }
  }

  async authenticate(): Promise<boolean> {
    return authenticate();
  }
}

// Singleton instance for real adapter
let realAdapterInstance: RealAdapter | null = null;

function getRealAdapter(): RealAdapter {
  if (!realAdapterInstance) {
    realAdapterInstance = new RealAdapter();
  }
  return realAdapterInstance;
}

/**
 * Factory function to get the appropriate adapter based on environment.
 * Returns MockAdapter for testing, RealAdapter for production.
 */
export function getAdapter(): IAtabatAdapter {
  const config = getAdapterConfig();

  if (config.useMock) {
    console.log('[Scraper] Using MockAdapter');
    return getMockAdapter();
  }

  console.log('[Scraper] Using RealAdapter (Playwright)');
  return getRealAdapter();
}
