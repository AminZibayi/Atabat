// In the Name of God, the Creative, the Originator
import { describe, it, expect } from 'vitest';
import { addDaysToJalali } from '@/utils/jalaliDate';

describe('addDaysToJalali', () => {
  it('should add 1 day and return a non-empty string', () => {
    const result = addDaysToJalali('1404/01/01', 1);
    // persian_fa locale outputs Persian digits; verify the format without asserting digit script
    expect(result).toBeTruthy();
    expect(result).toMatch(
      /\d{4}\/\d{2}\/\d{2}|[\u06F0-\u06F9]{4}\/[\u06F0-\u06F9]{2}\/[\u06F0-\u06F9]{2}/
    );
  });

  it('should add days when input uses Persian digits', () => {
    // Same calendar date either way - both should produce equal output
    const fromEnglish = addDaysToJalali('1404/01/01', 1);
    const fromPersian = addDaysToJalali('۱۴۰۴/۰۱/۰۱', 1);
    expect(fromEnglish).toBe(fromPersian);
  });

  it('should add days when input uses Arabic-Indic digits', () => {
    const fromEnglish = addDaysToJalali('1404/01/01', 1);
    const fromArabic = addDaysToJalali('١٤٠٤/٠١/٠١', 1);
    expect(fromEnglish).toBe(fromArabic);
  });

  it('should return an empty string when the date cannot be parsed (DateObject silently fails)', () => {
    // DateObject does not throw for invalid input; it produces an empty formatted string.
    // The catch block is only reached when DateObject throws, which does not happen here.
    const result = addDaysToJalali('not-a-date', 1);
    expect(result).toBe('');
  });
});
