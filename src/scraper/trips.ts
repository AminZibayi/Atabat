// In the Name of God, the Creative, the Originator
import { Page } from 'playwright';
import { TripData, TripSearchParams } from './types';
import { getContext, isSessionValid } from './browser';
import { authenticate } from './auth';

const TRIPS_URL = 'https://atabatorg.haj.ir/Kargozar/KargroupResLock.aspx';

export async function searchTrips(params: TripSearchParams): Promise<TripData[]> {
  const context = await getContext();
  const page = await context.newPage();

  try {
    if (!(await isSessionValid(page))) {
      const authSuccess = await authenticate();
      if (!authSuccess) throw new Error('Could not authenticate session for trip search');
      await page.goto(TRIPS_URL);
    } else {
      await page.goto(TRIPS_URL);
    }

    // Fill Search Form
    if (params.dateFrom) {
      // Dealing with KamaDatepicker might be tricky.
      // Often input works if we remove readonly or just type.
      // Or we might need to click the calendar.
      // Let's try direct fill first, maybe via evaluate to bypass readonly
      await page.$eval('#txtDateFrom', (el: any, val: any) => (el.value = val), params.dateFrom);
    }
    if (params.dateTo) {
      await page.$eval('#txtDateto', (el: any, val: any) => (el.value = val), params.dateTo);
    }

    // Province
    if (params.provinceCode) {
      await page.selectOption('#ctl00_cp1_cmbProvince', params.provinceCode);
    }

    // Border
    if (params.borderType) {
      // Need mapping from 'air' -> '2', etc if strictly typed.
      // unique logic for values: 2=Air, 1=Land...
      await page.selectOption('#ctl00_cp1_cmbBorder', params.borderType);
    }

    // Count? The form has 'ctl00_cp1_cmbCount' for adults and 'ctl00_cp1_cmbUnder2Year'
    if (params.adultCount) {
      await page.selectOption('#ctl00_cp1_cmbCount', params.adultCount.toString());
    }

    // Trigger Search? Usually a button or auto-postback on some fields?
    // User says: "turn it into a get request ... output table ... will be parsed"
    // But ASP.NET usually POSTs. The user request says "turn it into a get request with ... queryParameters",
    // implies we might just want to parse the resulting page after we perform the action.
    // Wait, the User says: "on page ... table to list the trips > turn it into a get request ... query is performed and output table ... parsed"
    // Use standard interaction:
    // There isn't an explicit "Search" button visible in the provided HTML snippet for the search bar,
    // possibly implied or I missed it in the snippet. Assuming there's a button or enter key triggers it.
    // Let's look for a button like 'جستجو' or 'نمایش'.
    // If not, maybe changing the Province triggers postback?
    // User snippet showed: <select ... onchange="...">

    // Check for Submit/Search button not in snippet?
    // Let's assume there is one or we trigger postback.
    // If the query is just a GET request, maybe we don't need Playwright interaction?
    // BUT "asp.net webforms" usually rely on ViewState so GET might not work easily without previous state.
    // Playwright interaction is safer.
    // Let's assume changing a filter triggers update or there is a button.

    // For now, let's look for the table `ctl00_cp1_grdKargroup`
    await page.waitForSelector('#ctl00_cp1_grdKargroup', { timeout: 5000 }).catch(() => null);

    // Parse Table
    const trips = await parseTripsTable(page);
    return trips;
  } catch (e) {
    console.error('Error searching trips', e);
    throw e;
  } finally {
    await page.close();
  }
}

async function parseTripsTable(page: Page): Promise<TripData[]> {
  return await page.$$eval('#ctl00_cp1_grdKargroup tbody tr', rows => {
    const results: any[] = [];
    // Skip header row (class "header" or styled)
    // In snippet: <tr style="color:Black;background-color:DarkSeaGreen;height:20px;"><th...

    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 13) continue; // Likely header or footer

      // Mapping based on index

      // Clean helper
      const txt = (idx: number) => cells[idx]?.innerText?.trim() || '';

      results.push({
        dayOfWeek: txt(0),
        departureDate: txt(1),
        remainingCapacity: parseInt(txt(2)) || 0,
        tripType: txt(3),
        cost: parseInt(txt(4).replace(/,/g, '')) || 0,
        departureLocation: txt(5),
        city: txt(6),
        agentName: txt(7),
        groupCode: txt(8),
        executorName: txt(9),
        najafHotel: txt(10),
        karbalaHotel: txt(11),
        kazemainHotel: txt(12),
        address: txt(13),
        // Button ID for selection
        selectButtonId:
          cells[14]?.querySelector('input[type="button"]')?.getAttribute('onclick') || '',
      });
    }
    return results;
  });
}

// Function to actually select the trip (triggers redirect)
export async function selectTrip(page: Page, selectButtonScript: string) {
  // script is like: javascript:__doPostBack('ctl00$cp1$grdKargroup','Select$0')
  // We can evaluate it
  await page.evaluate(
    script => {
      window.location.href = script; // or eval(script) if it's actually js code
    },
    selectButtonScript.replace('javascript:', '')
  );

  await page.waitForNavigation();
}
