// In the Name of God, the Creative, the Originator
import { Page } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { spawn } from 'child_process';
import { convertToEnglishDigits } from '../utils/digits';

const TEMP_CAPTCHA_DIR = path.resolve(process.cwd(), 'data/temp_captcha');
const OCR_SCRIPT_PATH = path.resolve(process.cwd(), 'scripts/ocr_captcha.py');

/**
 * OCR result from Python script
 */
interface OCRResult {
  text: string;
  raw?: string;
  confidence: number;
  error?: string;
}

/**
 * Clean up captcha text - extract only digits
 * The captcha is always 3 Persian numbers
 */
function cleanCaptchaText(rawText: string): string {
  // Convert Persian digits to Arabic
  const converted = convertToEnglishDigits(rawText);
  // Extract only digits
  const digits = converted.replace(/[^0-9]/g, '');
  return digits;
}

/**
 * Preprocessing strategy configuration
 */
interface PreprocessConfig {
  name: string;
  apply: (input: sharp.Sharp) => sharp.Sharp;
}

/**
 * Multiple preprocessing strategies to try
 * Different captchas may respond better to different processing
 */
const PREPROCESS_STRATEGIES: PreprocessConfig[] = [
  {
    // Strategy 1: Minimal - just grayscale and slight contrast
    name: 'minimal',
    apply: input => input.grayscale().normalize().resize({ width: 150, height: 60, fit: 'fill' }),
  },
  {
    // Strategy 2: High contrast with threshold
    name: 'threshold',
    apply: input =>
      input
        .grayscale()
        .normalize()
        .linear(1.3, -20)
        .threshold(140)
        .resize({ width: 150, height: 60, fit: 'fill' }),
  },
  {
    // Strategy 3: Inverted (black text on white background)
    name: 'inverted',
    apply: input =>
      input.grayscale().negate().normalize().resize({ width: 150, height: 60, fit: 'fill' }),
  },
  {
    // Strategy 4: Scale up significantly for small captchas
    name: 'scaled',
    apply: input =>
      input
        .grayscale()
        .normalize()
        .resize({ width: 300, height: 120, fit: 'fill' })
        .sharpen({ sigma: 1 }),
  },
];

/**
 * Preprocess captcha image using Sharp for better OCR accuracy
 * @param inputPath - Path to input image
 * @param outputPath - Path to save preprocessed image
 * @param strategyIndex - Index of preprocessing strategy to use (0-4)
 */
export async function preprocessCaptcha(
  inputPath: string,
  outputPath: string,
  strategyIndex: number = 0
): Promise<void> {
  const strategy = PREPROCESS_STRATEGIES[strategyIndex % PREPROCESS_STRATEGIES.length];
  const input = sharp(inputPath);
  await strategy.apply(input).toFile(outputPath);
}

/**
 * Call Python EasyOCR script to recognize captcha text
 * Returns structured result with confidence score
 */
async function runPythonOCR(imagePath: string): Promise<OCRResult> {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [OCR_SCRIPT_PATH, imagePath], {
      encoding: 'utf-8',
    } as never);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data: Buffer) => {
      stdout += data.toString('utf-8');
    });

    python.stderr.on('data', (data: Buffer) => {
      stderr += data.toString('utf-8');
    });

    python.on('close', (code: number) => {
      if (code !== 0) {
        reject(new Error(`Python OCR failed with code ${code}: ${stderr}`));
      } else {
        try {
          const result = JSON.parse(stdout.trim()) as OCRResult;
          resolve(result);
        } catch {
          // Fallback to treating output as plain text
          resolve({ text: cleanCaptchaText(stdout.trim()), confidence: 0.5 });
        }
      }
    });

    python.on('error', (err: Error) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
}

/**
 * Result from trying a preprocessing strategy
 */
interface StrategyResult {
  text: string;
  confidence: number;
  strategy: string;
  valid: boolean;
}

/**
 * Try to solve captcha with a specific preprocessing strategy
 */
async function trySolveWithStrategy(
  imagePath: string,
  strategyIndex: number
): Promise<StrategyResult> {
  const ext = path.extname(imagePath);
  const basename = path.basename(imagePath, ext);
  const preprocessedPath = path.join(
    TEMP_CAPTCHA_DIR,
    `${basename}_preprocessed_s${strategyIndex}${ext}`
  );

  try {
    // Preprocess the image with specified strategy
    await preprocessCaptcha(imagePath, preprocessedPath, strategyIndex);

    // Run Python OCR on preprocessed image
    const result = await runPythonOCR(preprocessedPath);

    return {
      text: result.text,
      confidence: result.confidence,
      strategy: PREPROCESS_STRATEGIES[strategyIndex].name,
      valid: result.text.length === 3,
    };
  } finally {
    // Clean up preprocessed file
    try {
      await fs.unlink(preprocessedPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Solve captcha from file path using Sharp preprocessing + EasyOCR
 * Tries multiple preprocessing strategies and picks the best result
 * @param imagePath - Path to captcha image file
 * @param strategyNames - Optional array of strategy names to run. If omitted, runs all.
 * @returns Recognized captcha text (3 digits)
 */
export async function solveCaptchaFromFile(
  imagePath: string,
  strategyNames?: string[]
): Promise<string> {
  const results: StrategyResult[] = [];

  // First, try with raw image (no preprocessing)
  try {
    const rawResult = await runPythonOCR(imagePath);
    const text = rawResult.text;

    console.log(
      `[Captcha] Raw (no preprocess): "${rawResult.raw || text}" -> "${text}" (conf: ${rawResult.confidence.toFixed(2)})`
    );

    results.push({
      text,
      confidence: rawResult.confidence,
      strategy: 'raw',
      valid: text.length === 3,
    });
  } catch (error) {
    console.warn(`[Captcha] Raw OCR failed: ${error}`);
  }

  // Determine which strategies to run
  let indicesToRun: number[];

  if (strategyNames) {
    indicesToRun = [];
    for (const name of strategyNames) {
      const idx = PREPROCESS_STRATEGIES.findIndex(s => s.name === name);
      if (idx !== -1) {
        indicesToRun.push(idx);
      } else {
        console.warn(`[Captcha] Unknown strategy name: "${name}"`);
      }
    }
  } else {
    // Run all if not specified
    indicesToRun = PREPROCESS_STRATEGIES.map((_, i) => i);
  }

  // Try each preprocessing strategy
  for (const i of indicesToRun) {
    try {
      const result = await trySolveWithStrategy(imagePath, i);
      results.push(result);

      console.log(
        `[Captcha] Strategy "${result.strategy}": "${result.text}" (conf: ${result.confidence.toFixed(2)}, valid: ${result.valid})`
      );
    } catch (error) {
      console.warn(`[Captcha] Strategy "${PREPROCESS_STRATEGIES[i].name}" failed: ${error}`);
    }
  }

  // Filter to only valid 3-digit results
  const validResults = results.filter(r => r.valid);

  if (validResults.length > 0) {
    // Sort by confidence (highest first)
    validResults.sort((a, b) => b.confidence - a.confidence);
    const best = validResults[0];
    console.log(
      `[Captcha] Best result: "${best.text}" from "${best.strategy}" (conf: ${best.confidence.toFixed(2)})`
    );
    return best.text;
  }

  // No valid result found - return the longest result as best guess
  const sortedResults = results.sort((a, b) => b.text.length - a.text.length);
  const bestResult = sortedResults[0]?.text || '';

  console.warn(`[Captcha] No valid 3-digit result found. Best guess: "${bestResult}"`);

  return bestResult;
}

/**
 * Solve captcha from the login page using Sharp preprocessing + EasyOCR
 * @param page - Playwright page instance
 * @param captchaSelector - CSS selector for captcha image
 * @returns Recognized captcha text (3 digits)
 */
export async function solveCaptcha(
  page: Page,
  captchaSelector: string = '#captcha_image'
): Promise<string> {
  const captchaElement = await page.$(captchaSelector);
  if (!captchaElement) {
    throw new Error('Captcha image element not found');
  }

  // Ensure temp directory exists
  await fs.mkdir(TEMP_CAPTCHA_DIR, { recursive: true });

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const captchaPath = path.join(TEMP_CAPTCHA_DIR, `captcha_${timestamp}.png`);

  // Screenshot the captcha element
  await captchaElement.screenshot({ path: captchaPath });

  try {
    // Use the file-based solver
    return await solveCaptchaFromFile(captchaPath);
  } finally {
    // Clean up original captcha file after a delay (for debugging)
    setTimeout(async () => {
      try {
        await fs.unlink(captchaPath);
      } catch {
        // Ignore cleanup errors
      }
    }, 5000);
  }
}

/**
 * Refresh the captcha image by clicking it
 */
export async function refreshCaptcha(
  page: Page,
  captchaSelector: string = '#captcha_image'
): Promise<void> {
  const captchaElement = await page.$(captchaSelector);
  if (captchaElement) {
    await captchaElement.click();
    // Wait for new captcha to load
    await page.waitForTimeout(500);
  }
}

/**
 * Cleanup OCR resources (no-op for Python-based implementation)
 * Kept for backward compatibility with auth.ts
 */
export async function cleanupOCR(): Promise<void> {
  // No cleanup needed for Python-based implementation
  // Python process terminates after each call
}
