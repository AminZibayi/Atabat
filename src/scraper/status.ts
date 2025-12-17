// In the Name of God, the Creative, the Originator
import { Page } from 'playwright';
import { getContext, isSessionValid } from './browser';
import { authenticate } from './auth';

const STATUS_URL = 'https://atabatorg.haj.ir/Kargozar/KargroupReslockStatus.aspx';

export async function searchStatus(dateFrom?: string, dateTo?: string) {
  const context = await getContext();
  const page = await context.newPage();

  try {
    if (!(await isSessionValid(page))) {
      await authenticate();
    }
    await page.goto(STATUS_URL);

    if (dateFrom) {
      await page.$eval('#ctl00_cp1_txtDateFrom', (el: any, val: any) => (el.value = val), dateFrom);
    }
    if (dateTo) {
      await page.$eval('#ctl00_cp1_txtDateTo', (el: any, val: any) => (el.value = val), dateTo);
    }

    // Click Load/Recover "بازیابی"
    await page.click('#ctl00_cp1_btnLoad');
    await page.waitForSelector('#ctl00_cp1_grdResLockStatus');

    // Parse Status Table
    // Need to return data, for now just returning raw count or basic info
    const results = await page.$$eval('#ctl00_cp1_grdResLockStatus tbody tr', rows => {
      const items: any[] = [];
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 9) continue;
        items.push({
          user: cells[0]?.innerText?.trim(),
          regDate: cells[1]?.innerText?.trim(),
          agent: cells[2]?.innerText?.trim(),
          status: cells[7]?.innerText?.trim(),
          // Capture buttons for further action if needed
        });
      }
      return items;
    });

    return results;
  } finally {
    await page.close();
  }
}
