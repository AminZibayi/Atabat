// In the Name of God, the Creative, the Originator
import { Page } from 'playwright';
import { TripData, TripSearchParams } from './types';
import { getContext, isSessionValid } from './browser';
import { authenticate } from './auth';

const TRIPS_URL = 'https://atabatorg.haj.ir/Kargozar/KargroupResLock.aspx';

// Selectors based on analyzed HTML
const SELECTORS = {
  dateFrom: '#txtDateFrom',
  dateTo: '#txtDateto', // Note: lowercase 't' in txtDateto
  province: '#ctl00_cp1_cmbProvince',
  borderType: '#ctl00_cp1_cmbBorder',
  adultCount: '#ctl00_cp1_cmbCount',
  infantCount: '#ctl00_cp1_cmbUnder2Year',
  searchButton: '#ctl00_cp1_btnSearch',
  tripsGrid: '#ctl00_cp1_grdKargroup',
};

// Type for ASP.NET page with __doPostBack
interface WindowWithPostBack extends Window {
  __doPostBack?: (eventTarget: string, eventArgument: string) => void;
}

export async function searchTrips(params: TripSearchParams): Promise<TripData[]> {
  const context = await getContext();
  const page = await context.newPage();

  try {
    return await searchTripsOnPage(page, params);
  } finally {
    if (process.env.NODE_ENV === 'production') {
      await page.close();
    }
  }
}

/**
 * Search for trips on an existing page - allows reusing the same page for trip selection
 */
export async function searchTripsOnPage(page: Page, params: TripSearchParams): Promise<TripData[]> {
  // Check session and navigate
  if (!(await isSessionValid(page))) {
    const authSuccess = await authenticate();
    if (!authSuccess) throw new Error('Could not authenticate session for trip search');
  }
  await page.goto(TRIPS_URL, { waitUntil: 'networkidle' });

  // Fill date inputs - KamaDatepicker uses readonly inputs, so we need to:
  // 1. Remove readonly attribute
  // 2. Clear the field
  // 3. Fill with the value
  // 4. Dispatch change event to trigger any JS listeners
  if (params.dateFrom) {
    await fillDateInput(page, SELECTORS.dateFrom, params.dateFrom);
  }
  if (params.dateTo) {
    await fillDateInput(page, SELECTORS.dateTo, params.dateTo);
  }

  // Province selection
  if (params.provinceCode) {
    await page.selectOption(SELECTORS.province, params.provinceCode);
  }

  // Border type selection (trip type: 1=Land, 2=Air, 128=Accommodation, 129=Flight only)
  if (params.borderType) {
    await page.selectOption(SELECTORS.borderType, params.borderType);
  }

  // Adult count
  if (params.adultCount) {
    await page.selectOption(SELECTORS.adultCount, params.adultCount.toString());
  }

  // Infant count (under 2 years)
  if (params.infantCount !== undefined) {
    await page.selectOption(SELECTORS.infantCount, params.infantCount.toString());
  }

  // Click search button and wait for postback to complete
  await Promise.all([page.waitForLoadState('networkidle'), page.click(SELECTORS.searchButton)]);

  // Wait for the grid to be present (it should be there after postback)
  await page.waitForSelector(SELECTORS.tripsGrid, { timeout: 10000 }).catch(() => null);

  // Parse and return trips
  const trips = await parseTripsTable(page);
  return trips;
}

/**
 * Fill a KamaDatepicker readonly input field
 */
async function fillDateInput(page: Page, selector: string, value: string): Promise<void> {
  await page.$eval(
    selector,
    (el: HTMLInputElement, val: string) => {
      // Remove readonly to allow input
      el.removeAttribute('readonly');
      // Set the value
      el.value = val;
      // Dispatch events to trigger any JS listeners
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    value
  );
}

async function parseTripsTable(page: Page): Promise<TripData[]> {
  return await page.$$eval(`${SELECTORS.tripsGrid} tbody tr`, rows => {
    const results: TripData[] = [];

    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      // Skip header rows (they use <th> not <td>, or have fewer cells)
      if (cells.length < 14) continue;

      // Helper to get cell text
      const txt = (idx: number) => cells[idx]?.innerText?.trim() || '';

      // Extract row index from the select button's onclick attribute
      // Format: javascript:__doPostBack('ctl00$cp1$grdKargroup','Select$0')
      const onclickAttr =
        cells[14]?.querySelector('input[type="button"]')?.getAttribute('onclick') || '';
      const selectMatch = onclickAttr.match(/Select\$(\d+)/);
      const rowIndex = selectMatch ? selectMatch[1] : `row-${results.length}`;

      // Extract trip data
      const departureDate = txt(1);
      const groupCode = txt(8);
      const agentName = txt(7);

      // Generate stable tripIdentifier
      const tripIdentifier = `${departureDate}|${groupCode}|${agentName}`;

      results.push({
        rowIndex,
        tripIdentifier,
        dayOfWeek: txt(0),
        departureDate,
        remainingCapacity: parseInt(txt(2)) || 0,
        tripType: txt(3),
        cost: parseInt(txt(4).replace(/,/g, '')) || 0,
        departureLocation: txt(5),
        city: txt(6),
        agentName,
        groupCode,
        executorName: txt(9),
        najafHotel: txt(10),
        karbalaHotel: txt(11),
        kazemainHotel: txt(12),
        address: txt(13),
        selectButtonScript: onclickAttr,
      });
    }
    return results;
  });
}

/**
 * Select a trip from the grid (triggers ASP.NET postback and redirects to reservation page)
 */
export async function selectTrip(page: Page, selectButtonScript: string): Promise<void> {
  // The onclick is like: javascript:__doPostBack('ctl00$cp1$grdKargroup','Select$0')
  // We need to execute the __doPostBack function properly
  const match = selectButtonScript.match(/__doPostBack\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/);

  if (match) {
    const [, eventTarget, eventArgument] = match;
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.evaluate(
        ({ target, arg }) => {
          // ASP.NET __doPostBack is a global function
          const w = window as unknown as WindowWithPostBack;
          if (typeof w.__doPostBack === 'function') {
            w.__doPostBack(target, arg);
          }
        },
        { target: eventTarget, arg: eventArgument }
      ),
    ]);
  } else {
    // Fallback: try to evaluate the script directly
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.evaluate(script => {
        eval(script.replace('javascript:', ''));
      }, selectButtonScript),
    ]);
  }
}
