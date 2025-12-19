// In the Name of God, the Creative, the Originator

// This is a self-contained script to test individual scraper functions

import { searchTrips } from './trips';

(async () => {
  try {
    const success = await searchTrips();
    console.log('Execution result:', success);
  } catch (error) {
    console.error('❌ Execution failed:', (error as Error).message);
  }

  process.exit(0);
})();
