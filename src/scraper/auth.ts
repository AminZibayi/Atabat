// In the Name of God, the Creative, the Originator
import { Page } from 'playwright';
import { chromium } from 'playwright';
import { getPayload } from 'payload';
import config from '@payload-config';
import { saveCookies, getContext } from './browser';
import { solveCaptcha, refreshCaptcha, cleanupOCR } from './captcha';
import { getLatestAtabatOTP } from './bale';

// URLs
const LOGIN_URL = 'https://atabatorg.haj.ir/login.aspx';

// Login Page Selectors - exported for reuse
export const LOGIN_SELECTORS = {
  USERNAME: '#tbUserName',
  PASSWORD: '#tbPass',
  CAPTCHA_IMAGE: '#captcha_image',
  CAPTCHA_INPUT: '#captcha_response_field',
  CAPTCHA_CHALLENGE: '#captcha_challenge_field',
  LOGIN_BTN: '#btnEnter',
  ERROR_MSG: '#lblmsg',
};

// OTP Page Selectors - exported for reuse
export const OTP_SELECTORS = {
  OTP_INPUT: '#ctl00_cp1_txtCode',
  VERIFY_BTN: '#ctl00_cp1_btnVerifyCode',
  RESEND_BTN: '#ctl00_cp1_SendAgain',
  COUNTDOWN: '#ctl00_cp1_countDownLabel',
  ERROR_MSG: '#ctl00_cp1_lblMsg',
};

// Default max captcha attempts
const DEFAULT_MAX_ATTEMPTS = 5;
const HEADLESS = process.env.PLAYWRIGHT_HEADLESS === 'true';

export interface StoredCredentials {
  username: string;
  password: string;
  otp: string;
  otpLastUpdated: string | null;
  captchaMaxAttempts: number;
}

/**
 * Get authentication credentials from KargozarConfig global
 */
export async function getStoredCredentials(): Promise<StoredCredentials> {
  const payload = await getPayload({ config });
  const kargozarConfig = await payload.findGlobal({
    slug: 'kargozar-config',
  });

  const username = kargozarConfig.username as string;
  const password = kargozarConfig.password as string;
  const otp = kargozarConfig.currentOTP as string;
  const otpLastUpdated = kargozarConfig.otpLastUpdated as string | null;
  const captchaMaxAttempts = (kargozarConfig.captchaMaxAttempts as number) || DEFAULT_MAX_ATTEMPTS;

  if (!username || !password) {
    throw new Error('Missing credentials in Kargozar Config');
  }

  return { username, password, otp, otpLastUpdated, captchaMaxAttempts };
}

/**
 * Check if the OTP is expired (OTP expires at midnight, so check if it's from a previous day)
 */
export function isOTPExpired(otpLastUpdated: string | null): boolean {
  if (!otpLastUpdated) {
    console.log('[Auth] No OTP update timestamp found, considering expired');
    return true;
  }

  const lastUpdateDate = new Date(otpLastUpdated);
  const now = new Date();

  // OTP expires at midnight, so check if the last update was on a different day
  const lastUpdateDay = lastUpdateDate.toDateString();
  const todayDay = now.toDateString();

  const expired = lastUpdateDay !== todayDay;
  if (expired) {
    console.log(`[Auth] OTP expired (last updated: ${lastUpdateDay}, today: ${todayDay})`);
  }

  return expired;
}

/**
 * Refresh OTP by scraping from Bale and updating the database
 */
export async function refreshOTPFromBale(): Promise<string | null> {
  console.log('[Auth] Refreshing OTP from Bale...');

  try {
    const newOTP = await getLatestAtabatOTP();

    if (!newOTP) {
      console.error('[Auth] Failed to get OTP from Bale');
      return null;
    }

    // Save new OTP to database
    const payload = await getPayload({ config });
    await payload.updateGlobal({
      slug: 'kargozar-config',
      data: {
        currentOTP: newOTP,
        otpLastUpdated: new Date().toISOString(),
      },
    });

    console.log('[Auth] OTP refreshed and saved:', newOTP);
    return newOTP;
  } catch (error) {
    console.error('[Auth] Failed to refresh OTP from Bale:', error);
    return null;
  }
}

/**
 * Check if we are on the login page
 */
export async function isOnLoginPage(page: Page): Promise<boolean> {
  return (
    page.url().toLowerCase().includes('login') || (await page.isVisible(LOGIN_SELECTORS.USERNAME))
  );
}

/**
 * Check if we are on the OTP verification page
 */
export async function isOnOTPPage(page: Page): Promise<boolean> {
  return (
    page.url().toLowerCase().includes('verify_mobileno') ||
    (await page.isVisible(OTP_SELECTORS.OTP_INPUT))
  );
}

/**
 * Check if login was successful (redirected to Kargozar panel)
 */
export async function isLoginSuccessful(page: Page): Promise<boolean> {
  const url = page.url().toLowerCase();
  return url.includes('default') && !url.includes('login');
}

/**
 * Get error message from the page if present
 */
export async function getErrorMessage(page: Page, selector: string): Promise<string | null> {
  try {
    const errorElement = await page.$(selector);
    if (errorElement) {
      const text = await errorElement.textContent();
      return text?.trim() || null;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Handle the login form with captcha
 */
export async function handleLoginForm(
  page: Page,
  credentials: StoredCredentials
): Promise<boolean> {
  console.log('[Auth] Handling login form...');

  let captchaSolved = false;
  let attempts = 0;

  while (!captchaSolved && attempts < credentials.captchaMaxAttempts) {
    attempts++;
    console.log(`[Auth] Captcha attempt ${attempts}/${credentials.captchaMaxAttempts}`);

    try {
      // Fill username and password (refill on retry as password might be cleared)
      await page.fill(LOGIN_SELECTORS.USERNAME, credentials.username);
      await page.fill(LOGIN_SELECTORS.PASSWORD, credentials.password);

      // Wait for captcha image to be visible
      await page.waitForSelector(LOGIN_SELECTORS.CAPTCHA_IMAGE, {
        state: 'visible',
        timeout: 5000,
      });

      // Solve captcha using EasyOCR
      const captchaText = await solveCaptcha(page, LOGIN_SELECTORS.CAPTCHA_IMAGE);

      if (!captchaText || captchaText.length === 0) {
        console.log('[Auth] Empty captcha result, refreshing...');
        await refreshCaptcha(page, LOGIN_SELECTORS.CAPTCHA_IMAGE);
        continue;
      }

      // Fill captcha input
      await page.fill(LOGIN_SELECTORS.CAPTCHA_INPUT, captchaText);

      // Click login button
      await page.click(LOGIN_SELECTORS.LOGIN_BTN);

      // Wait for navigation or error
      await page.waitForTimeout(2000);

      // Check if we moved to OTP page or logged in successfully
      if ((await isOnOTPPage(page)) || (await isLoginSuccessful(page))) {
        captchaSolved = true;
        console.log('[Auth] Login form submitted successfully');
      } else if (await isOnLoginPage(page)) {
        // Still on login page - captcha might have failed
        const errorMsg = await getErrorMessage(page, LOGIN_SELECTORS.ERROR_MSG);
        if (errorMsg) {
          console.log(`[Auth] Login error: ${errorMsg}`);
        }
        // Refresh captcha for next attempt
        await refreshCaptcha(page, LOGIN_SELECTORS.CAPTCHA_IMAGE);
      }
    } catch (error) {
      console.error(`[Auth] Captcha attempt ${attempts} failed:`, error);
      // Try refreshing captcha
      await refreshCaptcha(page, LOGIN_SELECTORS.CAPTCHA_IMAGE);
    }
  }

  return captchaSolved;
}

/**
 * Handle OTP verification with retry logic
 * Retries when OTP is incorrect by scraping fresh OTP from Bale
 */
export async function handleOTPVerification(
  page: Page,
  initialOTP: string,
  maxRetries: number = 3
): Promise<boolean> {
  console.log('[Auth] Handling OTP verification...');

  let attempts = 0;
  let otpToUse = initialOTP;

  while (attempts < maxRetries) {
    attempts++;
    console.log(`[Auth] OTP verification attempt ${attempts}/${maxRetries}`);

    try {
      // Wait for OTP input to be visible
      await page.waitForSelector(OTP_SELECTORS.OTP_INPUT, {
        state: 'visible',
        timeout: 10000,
      });

      // Clear and fill OTP
      await page.fill(OTP_SELECTORS.OTP_INPUT, ''); // Clear first
      await page.fill(OTP_SELECTORS.OTP_INPUT, otpToUse);

      // Click verify button
      await page.click(OTP_SELECTORS.VERIFY_BTN);

      // Wait for navigation
      await page.waitForTimeout(3000);

      // Check for success
      if (await isLoginSuccessful(page)) {
        console.log('[Auth] OTP verification successful');
        return true;
      }

      // Check for error
      const errorMsg = await getErrorMessage(page, OTP_SELECTORS.ERROR_MSG);
      if (errorMsg?.includes('کد وارد شده صحیح نمی باشد')) {
        console.log(`[Auth] OTP incorrect (${errorMsg}), attempt ${attempts}/${maxRetries}`);

        // If not last attempt, scrape fresh OTP from Bale
        if (attempts < maxRetries) {
          console.log('[Auth] Scraping fresh OTP from Bale...');
          const freshOTP = await refreshOTPFromBale();
          if (freshOTP) {
            otpToUse = freshOTP;
            console.log('[Auth] Got fresh OTP, retrying...');
            continue; // Retry with new OTP
          } else {
            console.error('[Auth] Failed to get fresh OTP from Bale');
            return false;
          }
        }
      } else if (errorMsg) {
        // Different error, don't retry
        console.error(`[Auth] OTP verification error (non-retryable): ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error(`[Auth] OTP verification attempt ${attempts} failed:`, error);
      if (attempts >= maxRetries) {
        return false;
      }
    }
  }

  console.error('[Auth] OTP verification failed after max retries');
  return false;
}

const AUTH_PROMISE_KEY = Symbol.for('atabat_auth_promise');

function getAuthPromise(): Promise<boolean> | null {
  return (global as any)[AUTH_PROMISE_KEY] || null;
}

function setAuthPromise(p: Promise<boolean> | null) {
  (global as any)[AUTH_PROMISE_KEY] = p;
}

export async function waitForAuth(): Promise<void> {
  const p = getAuthPromise();
  if (p) {
    console.log('[Auth] Scraper paused: waiting for ongoing authentication to finish...');
    await p;
  }
}

/**
 * Main authentication function
 * Handles the two-step login process:
 * 1. Login with username/password/captcha
 * 2. OTP verification (auto-refreshes from Bale if expired)
 */
export async function authenticate(): Promise<boolean> {
  const existing = getAuthPromise();
  if (existing) {
    console.log('[Auth] Authentication already in progress, waiting for existing promise...');
    return existing;
  }

  const promise = doAuthenticate().finally(() => {
    setAuthPromise(null);
  });

  setAuthPromise(promise);
  return promise;
}

async function doAuthenticate(): Promise<boolean> {
  const context = await getContext();
  const page = await context.newPage();

  try {
    const credentials = await getStoredCredentials();

    console.log('[Auth] Starting authentication process...');
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

    // Step 1: Handle login form with captcha
    if (await isOnLoginPage(page)) {
      const loginSuccess = await handleLoginForm(page, credentials);
      if (!loginSuccess) {
        throw new Error('Failed to pass login form after max captcha attempts');
      }
    }

    // Step 2: Handle OTP verification if needed
    if (await isOnOTPPage(page)) {
      let otpToUse = credentials.otp;

      // Check if OTP is expired and refresh from Bale if needed
      if (isOTPExpired(credentials.otpLastUpdated) || !otpToUse) {
        console.log('[Auth] OTP is expired or missing, refreshing from Bale...');
        const freshOTP = await refreshOTPFromBale();
        if (freshOTP) {
          otpToUse = freshOTP;
        } else {
          throw new Error('Failed to refresh OTP from Bale');
        }
      }

      const otpSuccess = await handleOTPVerification(page, otpToUse, 3);
      if (!otpSuccess) {
        throw new Error('Failed to verify OTP');
      }
    }

    // Final verification
    if (await isLoginSuccessful(page)) {
      console.log('[Auth] Authentication successful!');
      await saveCookies(context);
      return true;
    } else {
      throw new Error(`Authentication failed - unexpected page: ${page.url()}`);
    }
  } catch (error) {
    console.error('[Auth] Authentication process error:', error);
    return false;
  } finally {
    await page.close();
    await cleanupOCR();
  }
}

/**
 * Force fresh authentication and refresh OTP from Bale
 * Used by cron job when OTP needs renewal at midnight.
 * Creates a fresh browser context (no cookies) to force OTP page.
 */
export async function authenticateWithFreshOTP(): Promise<{
  success: boolean;
  newOTP?: string;
  error?: string;
}> {
  console.log('[Auth] Starting fresh authentication with OTP refresh...');

  // Launch fresh browser (no cookies to force new login)
  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    const credentials = await getStoredCredentials();

    // Step 1: Navigate to login
    console.log('[Auth] Navigating to Atabat login...');
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Step 2: Handle login form with captcha
    if (await isOnLoginPage(page)) {
      const loginSuccess = await handleLoginForm(page, credentials);
      if (!loginSuccess) {
        throw new Error('Failed to pass login form after max captcha attempts');
      }
    }

    // Step 3: We should now be on OTP page - scrape fresh OTP from Bale
    if (!(await isOnOTPPage(page))) {
      throw new Error('Expected OTP page but got: ' + page.url());
    }

    console.log('[Auth] Scraping fresh OTP from Bale...');
    const newOTP = await refreshOTPFromBale();

    if (!newOTP) {
      throw new Error('Failed to get OTP from Bale');
    }

    // Step 4: Enter OTP
    const otpSuccess = await handleOTPVerification(page, newOTP, 3);
    if (!otpSuccess) {
      throw new Error('Failed to verify OTP');
    }

    // Step 5: Save cookies
    if (await isLoginSuccessful(page)) {
      console.log('[Auth] Fresh authentication successful!');

      // Save cookies to database
      const payload = await getPayload({ config });
      const cookies = await context.cookies();
      await payload.updateGlobal({
        slug: 'kargozar-config',
        data: {
          cookiesData: cookies,
          cookiesExpireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          lastAuthAt: new Date().toISOString(),
        },
      });

      return { success: true, newOTP };
    } else {
      throw new Error('Authentication failed - unexpected page: ' + page.url());
    }
  } catch (error) {
    console.error('[Auth] Fresh authentication failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    await cleanupOCR();
  }
}
