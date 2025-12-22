// In the Name of God, the Creative, the Originator
import { Page } from 'playwright';
import { PassengerInfo, ReservationResult, TripData, TripSearchParams } from './types';
import { getContext } from './browser';
import { searchTripsOnPage, selectTrip } from './trips';
import { addDaysToJalali } from '@/utils/jalaliDate';
import { convertToEnglishDigits } from '@/utils/digits';

// Selectors
const SELECTORS = {
  NATIONAL_ID: '#txtMelliCode',
  BIRTHDATE: '#txtBDate',
  PHONE: '#txtEmergincyTel',
  SAVE_BTN: '#ctl00_cp1_btnSave',
  MSG_LABEL: '#lblmessage',
  CONFIRM_BTN: '#ctl00_cp1_btnSaveData', // "تائید و چاپ فیش"
  SUCCESS_TABLE: '#tblOk',
};

/**
 * Complete reservation flow: re-search for trip, select it, and fill passenger form.
 * This is the main entry point for reservation creation.
 */
export async function createReservationWithTrip(
  tripData: TripData,
  passenger: PassengerInfo
): Promise<ReservationResult> {
  const context = await getContext();
  const page = await context.newPage();

  try {
    // The stored selectButtonScript is session-specific and will fail ASP.NET Event Validation
    // We need to re-search for the trip to get a fresh script for the current session
    // IMPORTANT: We must use the SAME PAGE for search and selection (postback tied to ViewState)

    // Build search params from trip data
    const nextDay = convertToEnglishDigits(addDaysToJalali(tripData.departureDate, 1));
    const searchParams: TripSearchParams = {
      dateFrom: tripData.departureDate,
      dateTo: nextDay,
      provinceCode: tripData.provinceCode,
      // Map trip type back to borderType filter
      borderType: tripData.tripType?.includes('هوایی')
        ? '2'
        : tripData.tripType?.includes('زمینی')
          ? '1'
          : undefined,
    };

    console.log(`[Scraper] Re-searching for trip: ${tripData.tripIdentifier}`);
    const freshTrips = await searchTripsOnPage(page, searchParams);
    console.log(`[Scraper] Found ${freshTrips.length} trips in fresh search`);

    // Find the matching trip by tripIdentifier
    const matchingTrip = freshTrips.find(t => t.tripIdentifier === tripData.tripIdentifier);

    if (!matchingTrip) {
      console.error(`[Scraper] Trip not found. Looking for: ${tripData.tripIdentifier}`);
      return {
        success: false,
        message: 'سفر مورد نظر یافت نشد. ممکن است ظرفیت تکمیل شده باشد.',
      };
    }

    if (!matchingTrip.selectButtonScript) {
      return {
        success: false,
        message: 'امکان انتخاب این سفر وجود ندارد.',
      };
    }

    console.log(`[Scraper] Found matching trip, selecting with fresh script...`);

    // Select the trip using the fresh script from current page
    await selectTrip(page, matchingTrip.selectButtonScript);

    // Fill the reservation form with passenger info
    return await fillReservationForm(page, passenger);
  } finally {
    // await page.close();
  }
}

/**
 * Fill the reservation form after trip is selected.
 * Internal function - expects page to already be on reservation form.
 */
async function fillReservationForm(
  page: Page,
  passenger: PassengerInfo
): Promise<ReservationResult> {
  try {
    await page.waitForSelector(SELECTORS.NATIONAL_ID);

    // Fill Form
    await page.fill(SELECTORS.NATIONAL_ID, passenger.nationalId);
    await page.fill(SELECTORS.BIRTHDATE, passenger.birthdate);
    await page.fill(SELECTORS.PHONE, passenger.phone);

    // Handle Alerts
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      console.log('Dialog opened:', alertMessage);
      await dialog.accept();
    });

    // Click Save "ثبت"
    await page.click(SELECTORS.SAVE_BTN);

    // Wait for result
    // Could be successful table OR error message
    try {
      await Promise.race([
        page.waitForSelector(SELECTORS.SUCCESS_TABLE, { timeout: 10000 }),
        page.waitForFunction(
          () => {
            const el = document.querySelector('#lblmessage');
            return el && el.textContent && el.textContent.length > 5;
          },
          { timeout: 10000 }
        ),
      ]);
    } catch (e) {
      // timeout
    }

    // Check for error
    const errorMsg = await page.$eval(SELECTORS.MSG_LABEL, el => el.textContent?.trim());
    if (errorMsg) {
      return { success: false, message: errorMsg };
    }

    // Check for Success Table and Confirm Button
    if (await page.isVisible(SELECTORS.SUCCESS_TABLE)) {
      // If we need to finalize immediately (as per user flow "submit button on that new table must be clicked")
      if (await page.isVisible(SELECTORS.CONFIRM_BTN)) {
        await page.click(SELECTORS.CONFIRM_BTN);
        // This should redirect to Receipt or something?
        // User says: "asp page will show an alert ... unless a new record is created on another table ... submit button on that new table must be clicked"
        // After clicking, it might redirect or show new content.
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {});

        // Get Reservation ID from URL
        const url = page.url();
        const resId = new URL(url).searchParams.get('resId');

        return { success: true, reservationId: resId || undefined };
      }
    }

    if (alertMessage) {
      return { success: false, message: alertMessage };
    }

    return { success: false, message: 'Unknown state after submission' };
  } catch (e) {
    console.error('Reservation creation failed', e);
    return { success: false, message: 'System error during reservation' };
  }
}

// Keep old function for backwards compatibility - deprecated
export async function createReservation(
  page: Page,
  passenger: PassengerInfo
): Promise<ReservationResult> {
  return fillReservationForm(page, passenger);
}
