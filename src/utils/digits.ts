// In the Name of God, the Creative, the Originator

/**
 * Persian/Arabic numerals mapping to English numerals
 */
const PERSIAN_ARABIC_TO_ENGLISH: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

/**
 * Convert Persian/Arabic numerals to English numerals
 */
export function convertToEnglishDigits(text: string): string {
  let result = '';
  for (const char of text) {
    result += PERSIAN_ARABIC_TO_ENGLISH[char] || char;
  }
  return result;
}
