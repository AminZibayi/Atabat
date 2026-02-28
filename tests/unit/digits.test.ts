// In the Name of God, the Creative, the Originator
import { describe, it, expect } from 'vitest';
import { convertToEnglishDigits } from '@/utils/digits';

describe('convertToEnglishDigits', () => {
  it('should return English digits unchanged', () => {
    expect(convertToEnglishDigits('1404/01/15')).toBe('1404/01/15');
  });

  it('should convert Persian digits to English', () => {
    expect(convertToEnglishDigits('۱۴۰۴/۰۱/۱۵')).toBe('1404/01/15');
  });

  it('should convert Arabic-Indic digits to English', () => {
    expect(convertToEnglishDigits('١٤٠٤/٠١/١٥')).toBe('1404/01/15');
  });

  it('should convert mixed Persian and Arabic digits', () => {
    expect(convertToEnglishDigits('۱٤٠٤')).toBe('1404');
  });

  it('should leave non-digit characters unchanged', () => {
    expect(convertToEnglishDigits('hello/world')).toBe('hello/world');
  });

  it('should handle empty string', () => {
    expect(convertToEnglishDigits('')).toBe('');
  });

  it('should convert all Persian digit variants (0–9)', () => {
    expect(convertToEnglishDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });

  it('should convert all Arabic-Indic digit variants (0–9)', () => {
    expect(convertToEnglishDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('should handle a phone number with Persian digits', () => {
    expect(convertToEnglishDigits('۰۹۱۲۳۴۵۶۷۸۹')).toBe('09123456789');
  });
});
