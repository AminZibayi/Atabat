// In the Name of God, the Creative, the Originator

import { chromium, Browser, BrowserContext, Page, Cookie } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import { getPayload } from 'payload';
import config from '@payload-config';

let browserInstance: Browser | null = null;
let contextInstance: BrowserContext | null = null;

const COOKIES_PATH = path.resolve(process.cwd(), 'data/cookies.json');
const HEADLESS = process.env.PLAYWRIGHT_HEADLESS === 'true';

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: HEADLESS,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export async function getContext(): Promise<BrowserContext> {
  if (!contextInstance) {
    const browser = await getBrowser();
    contextInstance = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });

    // Load cookies if they exist
    await loadCookies(contextInstance);
  }
  return contextInstance;
}

export async function closeBrowser() {
  if (contextInstance) {
    await contextInstance.close();
    contextInstance = null;
  }
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function saveCookies(context: BrowserContext) {
  const cookies = await context.cookies();

  // Save to Database (KargozarConfig)
  // We need to fetch the config global, then update it.
  // Since we are likely running in a separate process or need API access,
  // we might want to use Payload's local API if running within Next.js

  // For file system backup:
  await fs.mkdir(path.dirname(COOKIES_PATH), { recursive: true });
  await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));

  try {
    // Using local payload API if available in this context
    // This assumes this code runs in the Next.js server context where payload is initialized
    // If this runs in a separate worker, we might need a different approach (REST API)
    const payload = await getPayload({ config });
    const kargozarConfig = await payload.findGlobal({
      slug: 'kargozar-config',
    });

    if (kargozarConfig) {
      await payload.updateGlobal({
        slug: 'kargozar-config',
        data: {
          cookiesData: cookies,
          cookiesExpireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Approx 1 day
          lastAuthAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.warn('Failed to save cookies to Payload DB:', error);
  }
}

export async function loadCookies(context: BrowserContext) {
  try {
    // Try DB first
    const payload = await getPayload({ config });
    const kargozarConfig = await payload.findGlobal({
      slug: 'kargozar-config',
    });

    if (kargozarConfig && kargozarConfig.cookiesData) {
      const cookies = kargozarConfig.cookiesData as Cookie[];
      if (cookies.length > 0) {
        await context.addCookies(cookies);
        console.log('Cookies loaded from DB');
        return;
      }
    }
  } catch (e) {
    console.warn('Could not load cookies from DB', e);
  }

  // Fallback to file
  try {
    const cookiesString = await fs.readFile(COOKIES_PATH, 'utf-8');
    const cookies = JSON.parse(cookiesString);
    await context.addCookies(cookies);
    console.log('Cookies loaded from File');
  } catch (_error) {
    // No cookies found, that's fine
    console.log('No stored cookies found.');
  }
}

export async function isSessionValid(page: Page): Promise<boolean> {
  try {
    await page.goto('https://atabatorg.haj.ir/Kargozar/KargroupResLock.aspx', {
      timeout: 10000,
      waitUntil: 'domcontentloaded',
    });

    // If redirected to login info or login page, session is invalid
    if (page.url().includes('Login') || page.url().includes('login')) {
      return false;
    }

    // Check for specific element that should exist when logged in
    const kargozarName = await page.$('#ctl00_lblKargozarTitle'); // Check selector later
    return !!kargozarName;
  } catch (_e) {
    return false;
  }
}
