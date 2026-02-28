// In the Name of God, the Creative, the Originator
import { Page, Dialog } from 'playwright';
import {
  PassengerInfo,
  ReservationResult,
  AddPassengerResult,
  TripData,
  TripSearchParams,
} from './types';
import { getContext } from './browser';
import { searchTripsOnPage, selectTrip } from './trips';
import { addDaysToJalali } from '@/utils/jalaliDate';
import { convertToEnglishDigits } from '@/utils/digits';

// Selectors based on actual HTML analysis
const SELECTORS = {
  // Form inputs
  PASSENGER_TABLE: '#tblPassenger',
  NATIONAL_ID: '#txtMelliCode',
  BIRTHDATE: '#txtBDate',
  PHONE: '#txtEmergincyTel',

  // Buttons
  SAVE_BTN: '#ctl00_cp1_btnSave', // "ثبت" - triggers AJAX
  CONFIRM_BTN: '#ctl00_cp1_btnSaveData', // "تائید و چاپ فیش" - form submit

  // Feedback elements
  MSG_LABEL: '#lblmessage',
  GLOBAL_MSG_LABEL: '#ctl00_cp1_lblmsg', // Shows errors like "زائري با کد ملي ... قبلا ثبت شده است"
  PERSON_LIST_TABLE: '#myTable',
  PERSON_ROW: '#myTable .personRow',

  // Confirmation area
  SUCCESS_TABLE: '#tblOk',
};

// Timeout constants (in ms)
const TIMEOUT = {
  SHORT: 2000,
  MEDIUM: 5000,
  LONG: 10000,
  AJAX: 15000,
};

/**
 * Wait for the number of elements matching selector to exceed a threshold.
 * Uses polling with page.evaluate for type safety.
 */
async function waitForRowCount(
  page: Page,
  selector: string,
  minCount: number,
  timeout: number
): Promise<void> {
  const pollInterval = 200;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const count = await page.$$eval(selector, els => els.length).catch(() => 0);
    if (count > minCount) return;
    await page.waitForTimeout(pollInterval);
  }
  throw new Error(`Timeout waiting for row count > ${minCount}`);
}

/**
 * Wait for an element to have text content (length > 5).
 * Uses polling with page.evaluate for type safety.
 */
async function waitForTextContent(page: Page, selector: string, timeout: number): Promise<void> {
  const pollInterval = 200;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const text = await page
      .$eval(selector, el => (el as HTMLElement).textContent?.trim() || '')
      .catch(() => '');
    if (text.length > 5) return;
    await page.waitForTimeout(pollInterval);
  }
  throw new Error(`Timeout waiting for text in ${selector}`);
}

/**
 * Read the maxRequestCount variable from the reservation page.
 * This is set by Atabat's JS and determines how many passengers must be registered.
 */
async function readMaxRequestCount(page: Page): Promise<number> {
  try {
    const count = await page.evaluate(() => {
      // maxRequestCount is a global JS variable set in the page
      return (window as unknown as { maxRequestCount?: number }).maxRequestCount ?? 1;
    });
    console.log(`[Scraper] maxRequestCount (minCapacity) = ${count}`);
    return count;
  } catch {
    console.warn('[Scraper] Could not read maxRequestCount, defaulting to 1');
    return 1;
  }
}

/**
 * Check if the passenger form (مشخصات زائر) is still visible.
 * When enough passengers are added, Atabat hides the form.
 */
async function isPassengerFormVisible(page: Page): Promise<boolean> {
  try {
    const visible = await page.isVisible(SELECTORS.PASSENGER_TABLE);
    return visible;
  } catch {
    return false;
  }
}

/**
 * Complete reservation flow: re-search for trip, select it, and fill passenger forms.
 * This is the main entry point for reservation creation.
 * Accepts an array of passengers and adds them one by one.
 */
export async function createReservationWithTrip(
  tripData: TripData,
  passengers: PassengerInfo[]
): Promise<ReservationResult> {
  const context = await getContext();
  const page = await context.newPage();

  try {
    // Build search params from trip data
    const nextDay = convertToEnglishDigits(addDaysToJalali(tripData.departureDate, 1));
    const searchParams: TripSearchParams = {
      dateFrom: tripData.departureDate,
      dateTo: nextDay,
      provinceCode: tripData.provinceCode,
      adultCount: passengers.length,
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

    // Carry over minCapacity from the original trip data (re-search defaults to 1)
    matchingTrip.minCapacity = tripData.minCapacity || matchingTrip.minCapacity || 1;

    if (!matchingTrip.selectButtonScript) {
      return {
        success: false,
        message: 'امکان انتخاب این سفر وجود ندارد.',
      };
    }

    console.log(`[Scraper] Found matching trip, selecting with fresh script...`);

    // Select the trip using the fresh script from current page
    await selectTrip(page, matchingTrip.selectButtonScript);

    // Read how many passengers are required by the Atabat system
    const maxRequestCount = await readMaxRequestCount(page);
    console.log(
      `[Scraper] Trip requires ${maxRequestCount} passengers, provided ${passengers.length}`
    );

    if (passengers.length < maxRequestCount) {
      return {
        success: false,
        message: `این سفر حداقل ${maxRequestCount} نفر نیاز دارد، اما ${passengers.length} نفر ارسال شده است.`,
        minCapacity: maxRequestCount,
      };
    }

    // Add passengers one by one
    return await addPassengersAndConfirm(page, passengers, maxRequestCount);
  } finally {
    // Keep page open for debugging in dev, close in prod
    if (process.env.NODE_ENV === 'production') {
      await page.close();
    }
  }
}

/**
 * Add all passengers to the Atabat form one by one, then confirm.
 * Handles per-passenger errors (e.g., national ID mismatch).
 */
async function addPassengersAndConfirm(
  page: Page,
  passengers: PassengerInfo[],
  requiredCount: number
): Promise<ReservationResult> {
  const passengerResults: AddPassengerResult[] = [];

  for (let i = 0; i < passengers.length; i++) {
    const passenger = passengers[i];
    console.log(
      `[Scraper] Adding passenger ${i + 1}/${passengers.length}: ${passenger.nationalId}`
    );

    // Check if the form is still visible (Atabat hides it when enough people are added)
    const formVisible = await isPassengerFormVisible(page);
    if (!formVisible) {
      console.log(`[Scraper] Form hidden after ${i} passengers (expected ${requiredCount})`);
      // If we've added enough, that's fine — move to confirm
      if (i >= requiredCount) break;
      // Otherwise something went wrong
      return {
        success: false,
        message: `فرم ثبت نام پس از ثبت ${i} نفر مخفی شد. حداقل ${requiredCount} نفر لازم است.`,
        passengerResults,
        minCapacity: requiredCount,
      };
    }

    const result = await addSinglePassenger(page, passenger, i);
    passengerResults.push(result);

    if (!result.success) {
      console.error(`[Scraper] Failed to add passenger ${i + 1}: ${result.message}`);
      return {
        success: false,
        message: result.message || `خطا در ثبت مسافر ${i + 1}`,
        passengerResults,
        minCapacity: requiredCount,
      };
    }

    console.log(`[Scraper] Passenger ${i + 1} added successfully`);
  }

  // Verify enough passengers were added by checking the person list
  const rowCount = await page.$$eval(SELECTORS.PERSON_ROW, rows => rows.length).catch(() => 0);

  console.log(`[Scraper] Total rows in person table: ${rowCount}, required: ${requiredCount}`);

  if (rowCount < requiredCount) {
    return {
      success: false,
      message: `تنها ${rowCount} نفر ثبت شده ولی ${requiredCount} نفر لازم است.`,
      passengerResults,
      minCapacity: requiredCount,
    };
  }

  // Check if confirm button is visible (Atabat shows it when enough passengers are added)
  const confirmVisible = await page.isVisible(SELECTORS.CONFIRM_BTN).catch(() => false);
  if (!confirmVisible) {
    // Wait briefly for it to appear
    await page
      .waitForSelector(SELECTORS.CONFIRM_BTN, {
        state: 'visible',
        timeout: TIMEOUT.MEDIUM,
      })
      .catch(() => null);
  }

  // Confirm the reservation
  console.log('[Scraper] All passengers added, confirming reservation...');
  const confirmResult = await confirmReservation(page);
  confirmResult.passengerResults = passengerResults;
  confirmResult.minCapacity = requiredCount;
  return confirmResult;
}

/**
 * Add a single passenger to the Atabat form.
 * Fills the form fields, clicks save, and waits for result.
 */
async function addSinglePassenger(
  page: Page,
  passenger: PassengerInfo,
  passengerIndex: number
): Promise<AddPassengerResult> {
  // Setup dialog handler
  let dialogMessage = '';
  const dialogHandler = async (dialog: Dialog) => {
    dialogMessage = dialog.message();
    console.log(`[Scraper] Dialog for passenger ${passengerIndex + 1}:`, dialogMessage);
    await dialog.accept();
  };
  page.on('dialog', dialogHandler);

  try {
    // Wait for form to be visible
    await page.waitForSelector(SELECTORS.PASSENGER_TABLE, {
      state: 'visible',
      timeout: TIMEOUT.MEDIUM,
    });

    // Wait for input fields
    await page.waitForSelector(SELECTORS.NATIONAL_ID, { timeout: TIMEOUT.SHORT });

    // Clear and fill form fields
    console.log(`[Scraper] Filling data for passenger: ${passenger.nationalId}`);
    await page.fill(SELECTORS.NATIONAL_ID, '');
    await page.fill(SELECTORS.NATIONAL_ID, passenger.nationalId);
    await page.fill(SELECTORS.BIRTHDATE, '');
    await page.fill(SELECTORS.BIRTHDATE, passenger.birthdate);
    await page.fill(SELECTORS.PHONE, '');
    await page.fill(SELECTORS.PHONE, passenger.phone);

    // Get initial row count
    const initialRowCount = await page
      .$$eval(SELECTORS.PERSON_ROW, rows => rows.length)
      .catch(() => 0);
    console.log(`[Scraper] Current person rows before add: ${initialRowCount}`);

    // Setup AJAX response listener
    const ajaxResponsePromise = page
      .waitForResponse(
        resp => resp.url().includes('Sabteahval_Validate') || resp.url().includes('IsOmrehFishOk'),
        { timeout: TIMEOUT.AJAX }
      )
      .catch(() => null);

    // Click Save "ثبت" button
    console.log('[Scraper] Clicking save button...');
    await page.click(SELECTORS.SAVE_BTN);

    // Wait for AJAX response OR DOM changes OR dialog
    const result = await Promise.race([
      // Option 1: AJAX response
      ajaxResponsePromise.then(async resp => {
        if (!resp) return null;
        try {
          const json = await resp.json();
          console.log('[Scraper] AJAX response:', json);
          return { type: 'ajax' as const, data: json };
        } catch {
          return { type: 'ajax' as const, data: null };
        }
      }),

      // Option 2: New row appears
      waitForRowCount(page, SELECTORS.PERSON_ROW, initialRowCount, TIMEOUT.LONG)
        .then(() => ({ type: 'newRow' as const }))
        .catch(() => null),

      // Option 3: Error message appears
      waitForTextContent(page, SELECTORS.MSG_LABEL, TIMEOUT.LONG)
        .then(() => ({ type: 'error' as const }))
        .catch(() => null),

      // Option 4: Global error message
      waitForTextContent(page, SELECTORS.GLOBAL_MSG_LABEL, TIMEOUT.LONG)
        .then(() => ({ type: 'globalError' as const }))
        .catch(() => null),

      // Option 5: Timeout fallback
      new Promise(resolve => setTimeout(() => resolve({ type: 'timeout' as const }), TIMEOUT.LONG)),
    ]);

    console.log('[Scraper] Wait result:', result);

    // Brief pause for DOM to settle
    await page.waitForTimeout(500);

    // Check for inline error message
    const errorMsg = await page
      .$eval(SELECTORS.MSG_LABEL, el => el.textContent?.trim() || '')
      .catch(() => '');

    if (errorMsg && errorMsg.length > 5) {
      console.log('[Scraper] Error from lblmessage:', errorMsg);
      return { success: false, message: errorMsg, nationalId: passenger.nationalId };
    }

    // Check for global error message
    const globalErrorMsg = await page
      .$eval(SELECTORS.GLOBAL_MSG_LABEL, el => el.textContent?.trim() || '')
      .catch(() => '');

    if (globalErrorMsg && globalErrorMsg.length > 5) {
      console.log('[Scraper] Error from global lblmsg:', globalErrorMsg);
      return { success: false, message: globalErrorMsg, nationalId: passenger.nationalId };
    }

    // Check dialog message for errors
    if (
      dialogMessage &&
      (dialogMessage.includes('خطا') ||
        dialogMessage.includes('مطابقت') ||
        dialogMessage.includes('نامعتبر') ||
        dialogMessage.includes('اشتباه') ||
        dialogMessage.includes('قبلا'))
    ) {
      return { success: false, message: dialogMessage, nationalId: passenger.nationalId };
    }

    // Verify row was added
    const currentRowCount = await page
      .$$eval(SELECTORS.PERSON_ROW, rows => rows.length)
      .catch(() => 0);

    console.log(`[Scraper] Person rows after add: ${currentRowCount}`);

    if (currentRowCount > initialRowCount) {
      return { success: true, nationalId: passenger.nationalId };
    }

    // Fallback: unknown state
    return {
      success: false,
      message: dialogMessage || 'وضعیت نامشخص پس از ثبت مسافر. لطفا مجددا تلاش کنید.',
      nationalId: passenger.nationalId,
    };
  } catch (error) {
    console.error(`[Scraper] Failed to add passenger ${passengerIndex + 1}:`, error);
    return {
      success: false,
      message: dialogMessage || 'خطای سیستمی در ثبت مسافر.',
      nationalId: passenger.nationalId,
    };
  } finally {
    page.off('dialog', dialogHandler);
  }
}

/**
 * Click the confirmation button and extract reservation ID from resulting URL.
 * Handles two outcomes:
 * 1. Success: Navigation to Receipt.aspx
 * 2. Failure: Page reloads with error message in #ctl00_cp1_lblmsg
 */
async function confirmReservation(page: Page): Promise<ReservationResult> {
  try {
    // Wait for confirm button to be visible
    await page.waitForSelector(SELECTORS.CONFIRM_BTN, {
      state: 'visible',
      timeout: TIMEOUT.SHORT,
    });

    console.log('[Scraper] Clicking confirmation button...');

    // Click confirm button - this will either:
    // 1. Navigate to Receipt.aspx (success)
    // 2. Reload the page with error message (failure)
    await page.click(SELECTORS.CONFIRM_BTN);

    // Wait for either navigation to Receipt OR page load complete
    await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUT.LONG });

    // Check if we navigated to Receipt page (success)
    const currentUrl = page.url();
    console.log('[Scraper] After confirmation, URL:', currentUrl);

    if (currentUrl.includes('Receipt.aspx')) {
      // Success - extract reservation ID
      const urlObj = new URL(currentUrl);
      const resId = urlObj.searchParams.get('resId') || urlObj.searchParams.get('resID');

      if (resId) {
        console.log('[Scraper] Reservation created successfully, ID:', resId);
        return {
          success: true,
          reservationId: resId,
          message: 'رزرو با موفقیت ثبت شد.',
        };
      }

      return {
        success: true,
        message: 'رزرو با موفقیت ثبت شد.',
      };
    }

    // Page reloaded (not navigated to Receipt) - check for error message
    const globalErrorMsg = await page
      .$eval(SELECTORS.GLOBAL_MSG_LABEL, el => el.textContent?.trim() || '')
      .catch(() => '');

    if (globalErrorMsg && globalErrorMsg.length > 5) {
      console.log('[Scraper] Error after confirmation:', globalErrorMsg);
      return { success: false, message: globalErrorMsg };
    }

    // Check for inline error message too
    const inlineErrorMsg = await page
      .$eval(SELECTORS.MSG_LABEL, el => el.textContent?.trim() || '')
      .catch(() => '');

    if (inlineErrorMsg && inlineErrorMsg.length > 5) {
      console.log('[Scraper] Inline error after confirmation:', inlineErrorMsg);
      return { success: false, message: inlineErrorMsg };
    }

    // Unknown state - page reloaded but no error found
    console.error('[Scraper] Unknown state after confirmation');
    return {
      success: false,
      message: 'وضعیت نامشخص پس از تایید. لطفا وضعیت رزرو را بررسی کنید.',
    };
  } catch (error) {
    console.error('[Scraper] Confirmation failed:', error);
    return {
      success: false,
      message: 'خطا در تایید نهایی رزرو. لطفا وضعیت را در پنل مدیریت بررسی کنید.',
    };
  }
}

// Keep old function for backwards compatibility
/** @deprecated Use {@link createReservationWithTrip} instead */
export async function createReservation(
  page: Page,
  passenger: PassengerInfo
): Promise<ReservationResult> {
  return addSinglePassenger(page, passenger, 0);
}
