// In the Name of God, the Creative, the Originator

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs/promises';

// Constants
const BALE_LOGIN_URL = 'https://web.bale.ai/login?redirectTo=/chat';
const BALE_CHAT_URL = 'https://web.bale.ai/chat?uid=13449455';
// Use storageState path instead of just cookies - includes both cookies AND localStorage
const BALE_STORAGE_PATH = path.resolve(process.cwd(), 'data/bale-storage.json');
const PHONE_NUMBER = '9192261648';
const HEADLESS = process.env.PLAYWRIGHT_HEADLESS === 'true';

// Regex to extract OTP from message
// Message format: "*سازمان حج و زیارت* کد موقت امروز شما برای ورود به سامانه XXXXX .می باشد"
const OTP_REGEX = /سامانه\s+(\d+)\s*\.?\s*می/;

let baleBrowserInstance: Browser | null = null;

/**
 * Get a fresh browser instance for Bale
 */
export async function getBaleBrowser(): Promise<Browser> {
  if (!baleBrowserInstance) {
    baleBrowserInstance = await chromium.launch({
      headless: HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return baleBrowserInstance;
}

/**
 * Close the Bale browser instance
 */
export async function closeBaleBrowser(): Promise<void> {
  if (baleBrowserInstance) {
    await baleBrowserInstance.close();
    baleBrowserInstance = null;
  }
}

/**
 * Check if Bale storage state file exists
 */
async function hasStoredSession(): Promise<boolean> {
  try {
    await fs.access(BALE_STORAGE_PATH);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a browser context for Bale with loaded storage state if available
 * Uses Playwright's storageState API which preserves both cookies AND localStorage
 */
export async function getBaleContext(): Promise<BrowserContext> {
  const browser = await getBaleBrowser();

  // Check if we have a stored session
  if (await hasStoredSession()) {
    console.log('[Bale] Loading session from storage state file');
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      storageState: BALE_STORAGE_PATH, // Playwright best practice: load full storage state
    });
    return context;
  }

  // No stored session, create fresh context
  console.log('[Bale] No stored session found, creating fresh context');
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });

  return context;
}

/**
 * Save Bale session using Playwright's storageState API
 * This saves both cookies AND localStorage - Playwright best practice
 */
export async function saveBaleSession(context: BrowserContext): Promise<void> {
  await fs.mkdir(path.dirname(BALE_STORAGE_PATH), { recursive: true });

  // Use storageState() to save both cookies and localStorage
  await context.storageState({ path: BALE_STORAGE_PATH });

  console.log('[Bale] Session saved to', BALE_STORAGE_PATH);
}

/**
 * Load Bale session - kept for backward compatibility
 * Note: With storageState, loading is done at context creation time
 */
export async function loadBaleSession(context: BrowserContext): Promise<boolean> {
  // With storageState approach, loading is handled in getBaleContext
  // This function is kept for backward compatibility but is no longer the primary method
  return await hasStoredSession();
}

/**
 * Check if the page is logged into Bale
 */
export async function isBaleLoggedIn(page: Page): Promise<boolean> {
  try {
    // If we're on the chat page and can see chat UI, we're logged in
    const url = page.url();
    if (url.includes('web.bale.ai/chat')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Navigate to Bale login page and enter phone number
 * Returns true when ready for OTP input
 *
 * Uses Playwright's recommended locator methods:
 * - getByRole() for accessibility-based selection
 * - getByTestId() for test IDs
 */
export async function navigateToOTPPage(page: Page): Promise<boolean> {
  console.log('[Bale] Navigating to login page...');

  await page.goto(BALE_LOGIN_URL, { waitUntil: 'domcontentloaded' });

  try {
    // Click "متوجه شدم" (I understand) button if present - PWA install dialog
    // Using getByRole with accessible name - Playwright best practice
    await page.getByRole('button', { name: 'متوجه شدم' }).click({ timeout: 5000 });
    console.log('[Bale] Install dialog dismissed');
  } catch {
    // Dialog not present, continue
    console.log('[Bale] No install dialog found, continuing...');
  }

  try {
    // Click initial submit button to go to phone input
    // Using getByTestId - Playwright best practice for test IDs
    console.log('[Bale] Clicking submit button...');
    await page.getByTestId('submit-button').click();

    // Click phone input group to focus
    await page.getByRole('group', { name: 'شماره همراه' }).click();

    // Fill phone number using chained getByTestId
    console.log('[Bale] Entering phone number...');
    await page
      .getByTestId('phone-input')
      .getByTestId('textfield-single-line-input')
      .fill(PHONE_NUMBER);

    // Click submit to request OTP
    console.log('[Bale] Submitting phone number...');
    await page.getByTestId('submit-button').click();

    // Wait for OTP input to appear
    console.log('[Bale] Waiting for OTP input...');
    await page.getByTestId('otp-input').waitFor({ state: 'visible', timeout: 10000 });
    console.log('[Bale] OTP input page reached');

    return true;
  } catch (error) {
    console.error('[Bale] Failed to navigate to OTP page:', error);
    console.error('[Bale] Current URL:', page.url());
    return false;
  }
}

/**
 * Enter OTP and complete login
 */
export async function enterBaleOTP(page: Page, otp: string): Promise<boolean> {
  console.log('[Bale] Entering OTP...');

  try {
    // Using getByTestId for OTP input - Playwright best practice
    await page.getByTestId('otp-input').click();
    await page.getByTestId('otp-input').fill(otp);
    await page.waitForTimeout(2000);

    // Check if login was successful (redirected to chat)
    if (page.url().includes('/chat')) {
      console.log('[Bale] Login successful!');
      return true;
    }

    // Wait a bit more and check again
    await page.waitForTimeout(3000);
    if (page.url().includes('/chat')) {
      console.log('[Bale] Login successful!');
      return true;
    }

    console.log('[Bale] Login may have failed, current URL:', page.url());
    return false;
  } catch (error) {
    console.error('[Bale] Failed to enter OTP:', error);
    return false;
  }
}

/**
 * Full Bale login flow with OTP
 */
export async function loginToBale(page: Page, otp: string): Promise<boolean> {
  const navigated = await navigateToOTPPage(page);
  if (!navigated) {
    return false;
  }

  return enterBaleOTP(page, otp);
}

/**
 * Navigate to the Atabat chat and scrape the latest OTP
 */
export async function scrapeAtabatOTP(page: Page): Promise<string | null> {
  console.log('[Bale] Navigating to Atabat chat...');

  try {
    await page.goto(BALE_CHAT_URL, { waitUntil: 'domcontentloaded' });

    await page.getByTitle('سازمان حج و زیارت').click();

    // Wait for messages to load using aria-label (accessibility best practice)
    await page
      .locator('[aria-label="message-item"]')
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });

    // Get all message elements
    const messages = await page.locator('[aria-label="message-item"]').all();

    console.log(`[Bale] Found ${messages.length} messages`);

    // Iterate from last (newest) to first to find the latest OTP message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const text = await message.textContent();

      if (text && text.includes('سازمان حج و زیارت')) {
        console.log('[Bale] Found Atabat message:', text);

        const match = text.match(OTP_REGEX);
        if (match && match[1]) {
          const otp = match[1];
          console.log('[Bale] Extracted OTP:', otp);
          return otp;
        }
      }
    }

    console.log('[Bale] No OTP message found');
    return null;
  } catch (error) {
    console.error('[Bale] Failed to scrape OTP:', error);
    return null;
  }
}

/**
 * Complete flow: Check session, login if needed, scrape OTP
 * Requires pre-authenticated Bale session
 */
export async function getLatestAtabatOTP(): Promise<string | null> {
  const context = await getBaleContext();
  const page = await context.newPage();

  try {
    // Go to chat page
    await page.goto(BALE_CHAT_URL, { waitUntil: 'domcontentloaded' });

    // Check if we're logged in
    if (!(await isBaleLoggedIn(page))) {
      console.error('[Bale] Not logged in. Please run `pnpm payload bale-login` first.');
      return null;
    }

    // Scrape the OTP
    return await scrapeAtabatOTP(page);
  } finally {
    await page.close();
    await context.close();
    await closeBaleBrowser();
  }
}
