// In the Name of God, the Creative, the Originator
import { Page } from 'playwright';
import { createWorker } from 'tesseract.js';
import payload from 'payload';
import { saveCookies, getContext } from './browser';

const LOGIN_URL = 'https://atabatorg.haj.ir/login';
// Selectors - these are guesses based on typical ASP.NET WebForms, needs adjustment on actual HTML check
const SELECTORS = {
  USERNAME: 'input[name$="UserName"]', // partial match for ASP.NET naming
  PASSWORD: 'input[name$="Password"]',
  CAPTCHA_IMG: 'img[src*="Captcha"]', // or specific ID if known
  CAPTCHA_INPUT: 'input[name$="Captcha"]',
  LOGIN_BTN: 'input[type="submit"]',
  OTP_INPUT: 'input[name$="OTP"]', // purely hypothetical, need actual selector
  OTP_SUBMIT_BTN: 'input[type="submit"]', // might be the same button or different
};

async function solveCaptcha(page: Page): Promise<string> {
  const captchaElement = await page.$(SELECTORS.CAPTCHA_IMG);
  if (!captchaElement) {
    throw new Error('Captcha image not found');
  }

  const screenShotPath = 'temp_captcha.png';
  await captchaElement.screenshot({ path: screenShotPath });

  const worker = await createWorker('eng');
  const {
    data: { text },
  } = await worker.recognize(screenShotPath);
  await worker.terminate();

  // Basic cleaning of OCR result (usually numbers or simple chars)
  return text.trim().replace(/[^a-zA-Z0-9]/g, '');
}

async function getStoredCredentials() {
  const config = await payload.findGlobal({
    slug: 'kargozar-config',
  });

  // Type assertion or check safe access
  const username = config.username as string;
  const password = config.password as string;
  const otp = config.currentOTP as string;

  if (!username || !password || !otp) {
    throw new Error('Missing credentials in Kargozar Config');
  }

  return { username, password, otp };
}

export async function authenticate() {
  const context = await getContext();
  const page = await context.newPage();

  try {
    const { username, password, otp } = await getStoredCredentials();

    await page.goto(LOGIN_URL);

    // 1. Initial Login with Captcha
    if (await page.isVisible(SELECTORS.USERNAME)) {
      await page.fill(SELECTORS.USERNAME, username);
      await page.fill(SELECTORS.PASSWORD, password);

      let captchaSolved = false;
      let attempts = 0;

      while (!captchaSolved && attempts < 3) {
        try {
          const captchaText = await solveCaptcha(page);
          await page.fill(SELECTORS.CAPTCHA_INPUT, captchaText);

          await page.click(SELECTORS.LOGIN_BTN);
          await page.waitForTimeout(2000); // wait for postback

          // Check if OTP input appeared or if we are still on login (captcha fail)
          if (await page.isVisible(SELECTORS.OTP_INPUT)) {
            captchaSolved = true;
          } else if (await page.isVisible('.error-message')) {
            // Check for error
            // refresh captcha?
            attempts++;
          } else {
            // Maybe successful login without OTP? (Unlikely based on req)
            captchaSolved = true;
          }
        } catch (e) {
          console.error('Captcha solve attempt failed', e);
          attempts++;
        }
      }
    }

    // 2. OTP Entry
    if (await page.isVisible(SELECTORS.OTP_INPUT)) {
      await page.fill(SELECTORS.OTP_INPUT, otp);
      await page.click(SELECTORS.OTP_SUBMIT_BTN);
      await page.waitForNavigation({ waitUntil: 'networkidle' });
    }

    // 3. Verify Login success
    if (page.url().includes('Kargozar')) {
      await saveCookies(context);
      return true;
    } else {
      throw new Error('Authentication failed - not redirected to Kargozar panel');
    }
  } catch (error) {
    console.error('Auth process error:', error);
    return false;
  } finally {
    await page.close();
  }
}
