'use client';

// In the Name of God, the Creative, the Originator
import React from 'react';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

import styles from './JalaliDatePicker.module.css';

interface JalaliDatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  minDate?: string;
}

export function JalaliDatePicker({
  label,
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  fullWidth = false,
  minDate,
}: JalaliDatePickerProps) {
  // Convert string value to DateObject
  const dateValue = value
    ? new DateObject({
        date: value,
        format: 'YYYY/MM/DD',
        calendar: persian,
        locale: persian_fa,
      })
    : null;

  // Handle date change
  const handleChange = (date: DateObject | null) => {
    if (date) {
      onChange(date.format('YYYY/MM/DD'));
    } else {
      onChange('');
    }
  };

  // Convert minDate string to DateObject
  const minDateObj = minDate
    ? new DateObject({
        date: minDate,
        format: 'YYYY/MM/DD',
        calendar: persian,
        locale: persian_fa,
      })
    : undefined;

  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ''}`}>
      {label && <label className={styles.label}>{label}</label>}
      <DatePicker
        value={dateValue}
        onChange={handleChange}
        calendar={persian}
        locale={persian_fa}
        format="YYYY/MM/DD"
        placeholder={placeholder}
        minDate={minDateObj}
        calendarPosition="bottom-right"
        containerClassName={styles.inputWrapper}
        inputClass={styles.dateInput}
      />
    </div>
  );
}
