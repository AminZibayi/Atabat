// In the Name of God, the Creative, the Originator
/**
 * Test script for captcha OCR pipeline validation
 * Tests all sample captchas in data/captcha/ directory
 * Captcha filenames are the expected values (e.g., 245.png -> expected: "245")
 */

import fs from 'fs/promises';
import path from 'path';
import { solveCaptchaFromFile } from '../src/scraper/captcha';

const CAPTCHA_DIR = path.resolve(process.cwd(), 'data/captcha');

interface TestResult {
  filename: string;
  expected: string;
  recognized: string;
  passed: boolean;
}

async function runTests(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Captcha OCR Pipeline Test');
  console.log('='.repeat(60));
  console.log();

  // Get all PNG files in the captcha directory
  const files = await fs.readdir(CAPTCHA_DIR);
  const captchaFiles = files.filter(
    f => f.endsWith('.png') && !f.includes('_preprocessed') && !f.startsWith('captcha_')
  );

  if (captchaFiles.length === 0) {
    console.error('No captcha files found in', CAPTCHA_DIR);
    process.exit(1);
  }

  console.log(`Found ${captchaFiles.length} captcha files to test\n`);

  const results: TestResult[] = [];

  for (const filename of captchaFiles) {
    const expected = path.basename(filename, '.png');
    const imagePath = path.join(CAPTCHA_DIR, filename);

    console.log(`Testing: ${filename}`);
    console.log(`  Expected: ${expected}`);

    try {
      const recognized = await solveCaptchaFromFile(imagePath);
      const passed = recognized === expected;

      console.log(`  Recognized: ${recognized}`);
      console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
      console.log();

      results.push({ filename, expected, recognized, passed });
    } catch (error) {
      console.error(`  Error: ${error}`);
      console.log(`  Result: ✗ FAIL (error)`);
      console.log();

      results.push({ filename, expected, recognized: 'ERROR', passed: false });
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const accuracy = ((passed / total) * 100).toFixed(1);

  console.log(`\nResults: ${passed}/${total} passed (${accuracy}% accuracy)\n`);

  // Detailed table
  console.log('| Filename  | Expected | Recognized | Status |');
  console.log('|-----------|----------|------------|--------|');
  for (const r of results) {
    const status = r.passed ? 'PASS' : 'FAIL';
    console.log(
      `| ${r.filename.padEnd(9)} | ${r.expected.padEnd(8)} | ${r.recognized.padEnd(10)} | ${status.padEnd(6)} |`
    );
  }
  console.log();

  // Exit with error code if any test failed
  if (passed < total) {
    console.log('⚠️  Some tests failed. Consider adjusting preprocessing parameters.');
    process.exit(1);
  } else {
    console.log('✓ All tests passed!');
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
