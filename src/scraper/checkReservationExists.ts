// In the Name of God, the Creative, the Originator
import { getContext, isSessionValid } from './browser';
import { authenticate } from './auth';

const BASE_URL = 'https://atabatorg.haj.ir/Kargozar/Reservation_cs.aspx';

/**
 * Checks if a reservation page exists on the Atabat system.
 * Returns true if the page exists and shows the reservation form.
 * Returns false if the page shows an error or the reservation doesn't exist.
 */
export async function checkReservationExists(resId: string): Promise<boolean> {
  const url = `${BASE_URL}?resid=${resId}`;
  const context = await getContext();
  const page = await context.newPage();

  try {
    // Ensure we're authenticated
    if (!(await isSessionValid(page))) {
      await authenticate();
    }

    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Check for HTTP errors
    if (!response || response.status() >= 400) {
      console.log(`[checkReservationExists] HTTP ${response?.status()} for resId: ${resId}`);
      return false;
    }

    // Check if the page shows the passenger table which indicates a valid reservation
    // A valid reservation page has the passenger grid table with registered passengers
    const hasPassengerTable = (await page.locator('#ctl00_cp1_grdPassenger').count()) > 0;

    // Check for common error indicators (e.g., redirected to login or error page)
    const isLoginPage = (await page.locator('#ctl00_cp1_txtUsername').count()) > 0;
    const hasErrorMessage = (await page.locator('.alert-danger, .error-message').count()) > 0;

    if (isLoginPage) {
      console.log(`[checkReservationExists] Redirected to login for resId: ${resId}`);
      return false;
    }

    if (hasErrorMessage) {
      console.log(`[checkReservationExists] Error message found for resId: ${resId}`);
      return false;
    }

    console.log(`[checkReservationExists] Reservation ${resId} exists: ${hasPassengerTable}`);
    return hasPassengerTable;
  } catch (error) {
    console.error(`[checkReservationExists] Error checking resId ${resId}:`, error);
    return false;
  } finally {
    // Keep page open for debugging in dev, close in prod
    if (process.env.NODE_ENV === 'production') {
      await page.close();
    }
  }
}
