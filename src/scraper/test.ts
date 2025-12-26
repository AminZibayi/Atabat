// In the Name of God, the Creative, the Originator

// This is a self-contained script to test individual scraper functions

import { searchTrips } from './trips';

(async () => {
  try {
    const trips = await searchTrips({
      dateFrom: '1403/10/01',
      dateTo: '1403/10/10',
      provinceCode: '8', // Tehran
      borderType: '1', // Land
      adultCount: 1,
      infantCount: 0,
    });
    console.log('Search result:', trips);
  } catch (error) {
    console.error('❌ Execution failed:', (error as Error).message);
  }

  process.exit(0);
})();
