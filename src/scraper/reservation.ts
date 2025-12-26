// In the Name of God, the Creative, the Originator
import { Page } from 'playwright';
import { PassengerInfo, ReservationResult, TripData, TripSearchParams } from './types';
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
    // Build search params from trip data
    const nextDay = convertToEnglishDigits(addDaysToJalali(tripData.departureDate, 1));
    const searchParams: TripSearchParams = {
      dateFrom: tripData.departureDate,
      dateTo: nextDay,
      provinceCode: tripData.provinceCode,
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
    // Keep page open for debugging in dev, close in prod
    if (process.env.NODE_ENV === 'production') {
      await page.close();
    }
  }
}

/**
 * Fill the reservation form after trip is selected.
 * Uses AJAX interception for reliable success/failure detection.
 */
async function fillReservationForm(
  page: Page,
  passenger: PassengerInfo
): Promise<ReservationResult> {
  console.log('[Scraper] Filling reservation form...');

  // Setup dialog handler BEFORE any interaction
  let dialogMessage = '';
  const dialogHandler = async (dialog: any) => {
    dialogMessage = dialog.message();
    console.log('[Scraper] Dialog received:', dialogMessage);
    await dialog.accept();
  };
  page.on('dialog', dialogHandler);

  try {
    // Wait for form to be visible (it may start hidden)
    await page.waitForSelector(SELECTORS.PASSENGER_TABLE, {
      state: 'visible',
      timeout: TIMEOUT.MEDIUM,
    });

    // Wait for input fields
    await page.waitForSelector(SELECTORS.NATIONAL_ID, { timeout: TIMEOUT.SHORT });

    // Fill Form
    console.log('[Scraper] Filling passenger data...');
    await page.fill(SELECTORS.NATIONAL_ID, passenger.nationalId);
    await page.fill(SELECTORS.BIRTHDATE, passenger.birthdate);
    await page.fill(SELECTORS.PHONE, passenger.phone);

    // Get initial row count in person list (to detect new additions)
    const initialRowCount = await page
      .$$eval(SELECTORS.PERSON_ROW, rows => rows.length)
      .catch(() => 0);
    console.log(`[Scraper] Initial person rows: ${initialRowCount}`);

    // Setup AJAX response listener BEFORE clicking save
    // The "ثبت" button triggers callAjaxRegister() which POSTs to Sabteahval_Validate
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
      // Option 1: AJAX response (fastest)
      ajaxResponsePromise.then(async resp => {
        if (!resp) return null;
        try {
          const json = await resp.json();
          console.log('[Scraper] AJAX response:', json);
          return { type: 'ajax', data: json };
        } catch {
          return { type: 'ajax', data: null };
        }
      }),

      // Option 2: New row appears in person list (success indicator)
      waitForRowCount(page, SELECTORS.PERSON_ROW, initialRowCount, TIMEOUT.LONG)
        .then(() => ({ type: 'newRow' }))
        .catch(() => null),

      // Option 3: Error message appears in #lblmessage or #ctl00_cp1_lblmsg
      waitForTextContent(page, SELECTORS.MSG_LABEL, TIMEOUT.LONG)
        .then(() => ({ type: 'error' }))
        .catch(() => null),

      // Option 4: Global error message appears (e.g., duplicate registration)
      waitForTextContent(page, SELECTORS.GLOBAL_MSG_LABEL, TIMEOUT.LONG)
        .then(() => ({ type: 'globalError' }))
        .catch(() => null),

      // Option 5: Timeout fallback
      new Promise(resolve => setTimeout(() => resolve({ type: 'timeout' }), TIMEOUT.LONG)),
    ]);

    console.log('[Scraper] Wait result:', result);

    // Brief pause to let DOM settle after AJAX
    await page.waitForTimeout(500);

    // Check for error message first (inline message)
    const errorMsg = await page
      .$eval(SELECTORS.MSG_LABEL, el => el.textContent?.trim() || '')
      .catch(() => '');

    if (errorMsg && errorMsg.length > 5) {
      console.log('[Scraper] Error from lblmessage:', errorMsg);
      return { success: false, message: errorMsg };
    }

    // Check for global error message (e.g., "زائري با کد ملي ... قبلا ثبت شده است")
    const globalErrorMsg = await page
      .$eval(SELECTORS.GLOBAL_MSG_LABEL, el => el.textContent?.trim() || '')
      .catch(() => '');

    if (globalErrorMsg && globalErrorMsg.length > 5) {
      console.log('[Scraper] Error from global lblmsg:', globalErrorMsg);
      return { success: false, message: globalErrorMsg };
    }

    // Check if new row was added (success case)
    const currentRowCount = await page
      .$$eval(SELECTORS.PERSON_ROW, rows => rows.length)
      .catch(() => 0);

    console.log(`[Scraper] Current person rows: ${currentRowCount}`);

    if (currentRowCount > initialRowCount) {
      console.log('[Scraper] Person added successfully, confirming reservation...');
      return await confirmReservation(page);
    }

    // Check if confirm button is visible (alternative success indicator)
    const confirmVisible = await page.isVisible(SELECTORS.CONFIRM_BTN);
    if (confirmVisible) {
      console.log('[Scraper] Confirm button visible, confirming reservation...');
      return await confirmReservation(page);
    }

    // Fallback: unknown state
    console.error('[Scraper] Unknown state after form submission');
    return {
      success: false,
      message: dialogMessage || 'وضعیت نامشخص پس از ارسال فرم. لطفا مجددا تلاش کنید.',
    };
  } catch (error) {
    console.error('[Scraper] Reservation creation failed:', error);
    return {
      success: false,
      message: dialogMessage || 'خطای سیستمی در ایجاد رزرو. لطفا مجددا تلاش کنید.',
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

// Keep old function for backwards compatibility - deprecated
export async function createReservation(
  page: Page,
  passenger: PassengerInfo
): Promise<ReservationResult> {
  return fillReservationForm(page, passenger);
}
