// In the Name of God, the Creative, the Originator
import { authenticate } from './auth';

(async () => {
  try {
    const success = await authenticate();
    console.log('Auth result:', success);
  } catch (error) {
    console.error('❌ Auth failed:', (error as Error).message);
  }

  process.exit(0);
})();
