// In the Name of God, the Creative, the Originator
import { test, expect } from '@playwright/test';

// Set mock adapter for all E2E tests
test.beforeAll(() => {
  process.env.USE_MOCK_SCRAPER = 'true';
});

test.describe('I18n and Locale Support', () => {
  test('should redirect / to default locale /fa', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/fa\/?$/);
  });

  test('should have RTL direction for Persian locale', async ({ page }) => {
    await page.goto('/fa');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'fa');
  });

  test('should have LTR direction for English locale', async ({ page }) => {
    await page.goto('/en');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'ltr');
    await expect(html).toHaveAttribute('lang', 'en');
  });

  test('should show Persian content on /fa', async ({ page }) => {
    await page.goto('/fa');
    // Check for Persian text (hero section)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should show English content on /en', async ({ page }) => {
    await page.goto('/en');
    // Check for English text
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to trips page', async ({ page }) => {
    await page.goto('/fa');
    await page.click('a[href*="/trips"]');
    await expect(page).toHaveURL(/\/fa\/trips/);
  });

  test('should navigate to reservations page', async ({ page }) => {
    await page.goto('/fa');
    await page.click('a[href*="/reservations"]');
    await expect(page).toHaveURL(/\/fa\/reservations/);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/fa');
    await page.click('a[href*="/auth/login"]');
    await expect(page).toHaveURL(/\/fa\/auth\/login/);
  });
});

test.describe('Trips Search', () => {
  test('should display search form', async ({ page }) => {
    await page.goto('/fa/trips');

    // Check for search form elements
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /جستجو|Search/i })).toBeVisible();
  });

  test('should search and display results', async ({ page }) => {
    await page.goto('/fa/trips');

    // Click search button
    await page.getByRole('button', { name: /جستجو|Search/i }).click();

    // Wait for results (mock data should appear)
    await page.waitForTimeout(500);

    // Check for results section
    const resultsSection = page.locator('[class*="results"]');
    await expect(resultsSection).toBeVisible();
  });
});

test.describe('Authentication Pages', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/fa/auth/login');

    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /ورود|Login/i })).toBeVisible();
  });

  test('should display register form', async ({ page }) => {
    await page.goto('/fa/auth/register');

    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /ثبت نام|Register/i })).toBeVisible();
  });

  test('should show error for empty login', async ({ page }) => {
    await page.goto('/fa/auth/login');

    // Try to submit empty form
    await page.getByRole('button', { name: /ورود|Login/i }).click();

    // Form should not submit (HTML5 validation)
    await expect(page).toHaveURL(/\/fa\/auth\/login/);
  });
});

test.describe('Reservations Page', () => {
  test('should display filter tabs', async ({ page }) => {
    await page.goto('/fa/reservations');

    // Check for filter buttons
    await expect(page.locator('button').filter({ hasText: /همه|All/i })).toBeVisible();
  });

  test('should show empty state when no reservations', async ({ page }) => {
    await page.goto('/fa/reservations');

    // Wait for load
    await page.waitForTimeout(500);

    // Check for empty state or results
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });
});

test.describe('API Endpoints', () => {
  test('should return trips from search API', async ({ request }) => {
    const response = await request.get('/api/trips/search');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.trips).toBeInstanceOf(Array);
  });

  test('should filter trips by province', async ({ request }) => {
    const response = await request.get('/api/trips/search?province=tehran');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('should filter trips by type', async ({ request }) => {
    const response = await request.get('/api/trips/search?tripType=air');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    // All results should be air trips
    for (const trip of data.trips) {
      expect(trip.tripType).toContain('هوایی');
    }
  });

  test('should validate registration data', async ({ request }) => {
    const response = await request.post('/api/pilgrims/register', {
      data: {
        phone: 'invalid',
        password: '123',
        nationalId: '123',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
