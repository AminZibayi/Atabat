// In the Name of God, the Creative, the Originator
import { Page } from 'playwright';
import { PassengerInfo, ReservationResult } from './types';

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

export async function createReservation(
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
