// In the Name of God, the Creative, the Originator

import type { SanitizedConfig } from 'payload';
import { getPayload } from 'payload';
import readline from 'readline';
import {
  getBaleBrowser,
  getBaleContext,
  closeBaleBrowser,
  saveBaleSession,
  isBaleLoggedIn,
  navigateToOTPPage,
  enterBaleOTP,
} from '../scraper/bale';

const HEADLESS = process.env.PLAYWRIGHT_HEADLESS === 'true';

/**
 * Prompt user for input in the terminal
 */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Bale Login Script
 *
 * This script is used to authenticate with Bale messenger and save the session
 * for use by the OTP scraper. It should be run once to establish the session,
 * then the session can be reused for subsequent OTP scraping.
 */
export const script = async (config: SanitizedConfig) => {
  console.log('='.repeat(50));
  console.log('Bale Login Script');
  console.log('='.repeat(50));
  console.log(`Headless mode: ${HEADLESS}`);
  console.log();

  // Initialize Payload (required for bin scripts)
  await getPayload({ config });

  // Use getBaleContext which handles storageState loading automatically
  const context = await getBaleContext();
  const page = await context.newPage();

  try {
    // Check if existing session is still valid
    console.log('[Bale] Checking existing session...');
    await page.goto('https://web.bale.ai/chat', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    if (await isBaleLoggedIn(page)) {
      console.log('[Bale] Already logged in! Session is valid.');
      console.log('[Bale] You can now use the OTP scraper.');
      return;
    }

    console.log('[Bale] Session expired or not found, need to authenticate.');

    // Navigate to login and enter phone number
    const readyForOTP = await navigateToOTPPage(page);

    if (!readyForOTP) {
      console.error('[Bale] Failed to reach OTP page. Please try again.');
      process.exit(1);
    }

    // Prompt user for OTP
    console.log();
    console.log('='.repeat(50));
    const otp = await prompt('Enter the OTP code sent to Bale: ');
    console.log('='.repeat(50));
    console.log();

    if (!otp) {
      console.error('[Bale] No OTP provided. Aborting.');
      process.exit(1);
    }

    // Enter OTP
    const loginSuccess = await enterBaleOTP(page, otp);

    if (loginSuccess) {
      // Save the session using storageState (saves cookies + localStorage)
      await saveBaleSession(context);
      console.log();
      console.log('='.repeat(50));
      console.log('[Bale] Login successful!');
      console.log('[Bale] Session saved. You can now use the OTP scraper.');
      console.log('='.repeat(50));
    } else {
      console.error('[Bale] Login failed. Please check the OTP and try again.');
      process.exit(1);
    }
  } catch (error) {
    console.error('[Bale] Error during login:', error);
    process.exit(1);
  } finally {
    await page.close();
    await context.close();
    await closeBaleBrowser();
    process.exit(0);
  }
};
