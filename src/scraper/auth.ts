// In the Name of God, the Creative, the Originator
import { Page } from 'playwright';
import { getPayload } from 'payload';
import config from '@payload-config';
import { saveCookies, getContext } from './browser';
import { solveCaptcha, refreshCaptcha, cleanupOCR } from './captcha';

// URLs
const LOGIN_URL = 'https://atabatorg.haj.ir/login.aspx';
const OTP_URL = 'https://atabatorg.haj.ir/Verify_MobileNo.aspx';

// Login Page Selectors (from research/Login/ورود به سیستم.html)
const LOGIN_SELECTORS = {
  USERNAME: '#tbUserName',
  PASSWORD: '#tbPass',
  CAPTCHA_IMAGE: '#captcha_image',
  CAPTCHA_INPUT: '#captcha_response_field',
  CAPTCHA_CHALLENGE: '#captcha_challenge_field',
  LOGIN_BTN: '#btnEnter',
  ERROR_MSG: '#lblmsg',
};

// OTP Page Selectors (from research/OTP/Verify_MobileNo.aspx.html)
const OTP_SELECTORS = {
  OTP_INPUT: '#ctl00_cp1_txtCode',
  VERIFY_BTN: '#ctl00_cp1_btnVerifyCode',
  RESEND_BTN: '#ctl00_cp1_SendAgain',
  COUNTDOWN: '#ctl00_cp1_countDownLabel',
  ERROR_MSG: '#ctl00_cp1_lblMsg',
};

// Default max captcha attempts
const DEFAULT_MAX_ATTEMPTS = 5;

interface StoredCredentials {
  username: string;
  password: string;
  otp: string;
  captchaMaxAttempts: number;
}

/**
 * Get authentication credentials from KargozarConfig global
 */
async function getStoredCredentials(): Promise<StoredCredentials> {
  const payload = await getPayload({ config });
  const kargozarConfig = await payload.findGlobal({
    slug: 'kargozar-config',
  });

  const username = kargozarConfig.username as string;
  const password = kargozarConfig.password as string;
  const otp = kargozarConfig.currentOTP as string;
  const captchaMaxAttempts = (kargozarConfig.captchaMaxAttempts as number) || DEFAULT_MAX_ATTEMPTS;

  if (!username || !password || !otp) {
    throw new Error('Missing credentials in Kargozar Config');
  }

  return { username, password, otp, captchaMaxAttempts };
}

/**
 * Check if we are on the login page
 */
async function isOnLoginPage(page: Page): Promise<boolean> {
  return (
    page.url().toLowerCase().includes('login') || (await page.isVisible(LOGIN_SELECTORS.USERNAME))
  );
}

/**
 * Check if we are on the OTP verification page
 */
async function isOnOTPPage(page: Page): Promise<boolean> {
  return (
    page.url().toLowerCase().includes('verify_mobileno') ||
    (await page.isVisible(OTP_SELECTORS.OTP_INPUT))
  );
}

/**
 * Check if login was successful (redirected to Kargozar panel)
 */
async function isLoginSuccessful(page: Page): Promise<boolean> {
  const url = page.url().toLowerCase();
  return url.includes('default') && !url.includes('login');
}

/**
 * Get error message from the page if present
 */
async function getErrorMessage(page: Page, selector: string): Promise<string | null> {
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
 * Step 1: Handle the login form with captcha
 */
async function handleLoginForm(page: Page, credentials: StoredCredentials): Promise<boolean> {
  console.log('[Auth] Handling login form...');

  // Fill username and password
  await page.fill(LOGIN_SELECTORS.USERNAME, credentials.username);
  await page.fill(LOGIN_SELECTORS.PASSWORD, credentials.password);

  let captchaSolved = false;
  let attempts = 0;

  while (!captchaSolved && attempts < credentials.captchaMaxAttempts) {
    attempts++;
    console.log(`[Auth] Captcha attempt ${attempts}/${credentials.captchaMaxAttempts}`);

    try {
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
 * Step 2: Handle OTP verification
 */
async function handleOTPVerification(page: Page, otp: string): Promise<boolean> {
  console.log('[Auth] Handling OTP verification...');

  try {
    // Wait for OTP input to be visible
    await page.waitForSelector(OTP_SELECTORS.OTP_INPUT, {
      state: 'visible',
      timeout: 10000,
    });

    // Fill OTP
    await page.fill(OTP_SELECTORS.OTP_INPUT, otp);

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
    if (errorMsg) {
      console.error(`[Auth] OTP verification error: ${errorMsg}`);
    }

    return false;
  } catch (error) {
    console.error('[Auth] OTP verification failed:', error);
    return false;
  }
}

/**
 * Main authentication function
 * Handles the two-step login process:
 * 1. Login with username/password/captcha
 * 2. OTP verification
 */
export async function authenticate(): Promise<boolean> {
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
      const otpSuccess = await handleOTPVerification(page, credentials.otp);
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
