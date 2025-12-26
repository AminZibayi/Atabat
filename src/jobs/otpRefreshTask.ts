// In the Name of God, the Creative, the Originator

import type { TaskConfig } from 'payload';
import { authenticateWithFreshOTP } from '../scraper/auth';

// !! this is not test and not sure if correctly runs

/**
 * OTP Refresh Task
 *
 * This task runs daily at midnight (00:00) to refresh the Atabat OTP.
 * It uses the authenticateWithFreshOTP function from auth.ts which:
 * 1. Creates a fresh browser context (no existing Atabat cookies)
 * 2. Navigates to Atabat login page
 * 3. Handles captcha and login form
 * 4. When OTP page is reached, scrapes new OTP from Bale
 * 5. Saves the new OTP to KargozarConfig
 * 6. Completes Atabat login with the new OTP
 */
export const OTPRefreshTask: TaskConfig<'otpRefresh'> = {
  slug: 'otpRefresh',
  // Run every day at midnight (00:00) when OTP expires
  schedule: [
    {
      cron: '0 0 * * *', // Every day at midnight
      queue: 'nightly',
    },
  ],
  // Define output schema for the task
  outputSchema: [
    {
      name: 'success',
      type: 'checkbox',
      required: true,
    },
    {
      name: 'newOTP',
      type: 'text',
    },
    {
      name: 'error',
      type: 'text',
    },
  ],
  handler: async () => {
    console.log('[OTPRefresh] Starting OTP refresh task...');

    // Delegate to auth.ts - single source of truth
    const result = await authenticateWithFreshOTP();

    console.log('[OTPRefresh] Task completed:', result.success ? 'SUCCESS' : 'FAILED');

    return { output: result };
  },
};
