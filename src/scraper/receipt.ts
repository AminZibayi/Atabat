// In the Name of God, the Creative, the Originator
import type { ReceiptData, ItineraryItem, PassengerReceiptItem } from './types';
import { getContext, isSessionValid } from './browser';
import { authenticate } from './auth';

const RECEIPT_URL_BASE = 'https://atabatorg.haj.ir/Kargozar/Receipt.aspx?resID=';

export async function scrapeReceipt(resId: string): Promise<ReceiptData> {
  const context = await getContext();
  const page = await context.newPage();
  const targetUrl = `${RECEIPT_URL_BASE}${resId}`;

  try {
    if (!(await isSessionValid(page))) {
      await authenticate();
    }
    await page.goto(targetUrl);

    // Extract Data
    const data: ReceiptData = {
      resId,
      itinerary: [],
      passengers: [],
    };

    data.expireDate = await page.$eval('#ctl00_cp1_lblExpireDate', el => el.textContent?.trim());
    data.city = await page.$eval('#ctl00_cp1_lblCity', el => el.textContent?.trim());
    data.tripType = await page.$eval('#ctl00_cp1_lblType', el => el.textContent?.trim());
    data.departureDate = await page.$eval('#ctl00_cp1_lblDepdate', el => el.textContent?.trim());
    data.agentName = await page.$eval('#ctl00_cp1_lblKargozarTitle', el => el.textContent?.trim());
    data.agentPhone = await page.$eval('#ctl00_cp1_lblKargozarTell', el => el.textContent?.trim());
    data.agentAddress = await page.$eval('#ctl00_cp1_lblAddress', el => el.textContent?.trim());

    // Itinerary Table
    data.itinerary = await page.$$eval('#ctl00_cp1_grdReceiptPlan tbody tr', rows => {
      const items: ItineraryItem[] = [];
      // Skip header
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) continue;
        items.push({
          row: parseInt(cells[0]?.innerText || '0'),
          entryDate: cells[1]?.innerText?.trim(),
          city: cells[2]?.innerText?.trim(),
          hotel: cells[3]?.innerText?.trim(),
          exitDate: cells[4]?.innerText?.trim(),
        });
      }
      return items;
    });

    // Passengers Table
    data.passengers = await page.$$eval('#ctl00_cp1_grdPrePassenger tbody tr', rows => {
      const items: PassengerReceiptItem[] = [];
      // Skip header
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 6) continue;
        items.push({
          id: cells[0]?.innerText?.trim() || '',
          nationalId: cells[1]?.innerText?.trim() || '',
          firstName: cells[2]?.innerText?.trim() || '',
          lastName: cells[3]?.innerText?.trim() || '',
          birthdate: cells[4]?.innerText?.trim() || '',
          cost: parseInt(cells[5]?.innerText?.replace(/,/g, '') || '0'),
        });
      }
      return items;
    });

    // Payment URL
    const paymentLink = await page.$('#ctl00_cp1_EPaymentHyperLinkNew');
    if (paymentLink) {
      data.paymentUrl = (await paymentLink.getAttribute('href')) || undefined;
    }

    return data;
  } finally {
    await page.close();
  }
}
