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
