// In the Name of God, the Creative, the Originator
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

/**
 * Get today's date in Jalali format (YYYY/MM/DD)
 */
export function getTodayJalali(): string {
  const date = new DateObject({ calendar: persian, locale: persian_fa });
  return date.format('YYYY/MM/DD');
}

/**
 * Add days to today's date and return in Jalali format (YYYY/MM/DD)
 */
export function addDaysToTodayJalali(days: number): string {
  const date = new DateObject({ calendar: persian, locale: persian_fa });
  date.add(days, 'day');
  return date.format('YYYY/MM/DD');
}

/**
 * Convert Jalali date string to DateObject for the picker
 */
export function jalaliStringToDateObject(jalaliStr: string): DateObject | null {
  if (!jalaliStr) return null;
  try {
    return new DateObject({
      date: jalaliStr,
      format: 'YYYY/MM/DD',
      calendar: persian,
      locale: persian_fa,
    });
  } catch {
    return null;
  }
}

/**
 * Convert DateObject to Jalali string (YYYY/MM/DD)
 */
export function dateObjectToJalaliString(date: DateObject | null): string {
  if (!date) return '';
  return date.format('YYYY/MM/DD');
}

/**
 * Add days to a Jalali date string and return the result in format YYYY/MM/DD
 */
export function addDaysToJalali(jalaliDate: string, days: number): string {
  try {
    // Convert any Persian/Arabic digits to English first
    const persianToEnglish: Record<string, string> = {
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
    };
    let normalized = '';
    for (const char of jalaliDate) {
      normalized += persianToEnglish[char] || char;
    }

    const date = new DateObject({
      date: normalized,
      format: 'YYYY/MM/DD',
      calendar: persian,
      locale: persian_fa,
    });
    date.add(days, 'day');
    return date.format('YYYY/MM/DD');
  } catch (e) {
    console.error('Failed to parse Jalali date:', jalaliDate, e);
    // If parsing fails, return original date
    return jalaliDate;
  }
}
