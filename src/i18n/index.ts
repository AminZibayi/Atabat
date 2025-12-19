import { password } from 'payload/shared';

// In the Name of God, the Creative, the Originator
export const i18n = {
  collections: {
    media: {
      labels: {
        singular: { en: 'Media', fa: 'رسانه' },
        plural: { en: 'Media', fa: 'رسانه‌ها' },
      },
      admin: {
        group: { en: 'Content', fa: 'محتوا' },
      },
      fields: {
        alt: {
          label: { en: 'Alt text', fa: 'متن جایگزین' },
          admin: {
            placeholder: { en: 'Describe the asset', fa: 'توضیحی برای فایل' },
          },
        },
      },
    },
    users: {
      labels: {
        singular: { en: 'User', fa: 'کاربر' },
        plural: { en: 'Users', fa: 'کاربران' },
      },
      admin: {
        group: { en: 'Access', fa: 'دسترسی' },
      },
      fields: {
        displayName: {
          label: { en: 'Display name', fa: 'نام نمایشی' },
          admin: {
            placeholder: { en: 'Shown in the admin', fa: 'نمایش در پنل' },
          },
        },
      },
    },
    pilgrims: {
      labels: {
        singular: { en: 'Pilgrim', fa: 'زائر' },
        plural: { en: 'Pilgrims', fa: 'زائران' },
      },
      admin: {
        group: { en: 'Operations', fa: 'عملیات' },
      },
      fields: {
        phone: {
          label: { en: 'Phone Number', fa: 'شماره تلفن' },
        },
        nationalId: {
          label: { en: 'National ID', fa: 'کد ملی' },
        },
        birthdate: {
          label: { en: 'Birth Date (Jalali)', fa: 'تاریخ تولد (شمسی)' },
        },
      },
    },
    trips: {
      labels: {
        singular: { en: 'Trip', fa: 'سفر' },
        plural: { en: 'Trips', fa: 'سفرها' },
      },
      admin: {
        group: { en: 'Operations', fa: 'عملیات' },
      },
    },
    reservations: {
      labels: {
        singular: { en: 'Reservation', fa: 'رزرو' },
        plural: { en: 'Reservations', fa: 'رزروها' },
      },
      admin: {
        group: { en: 'Operations', fa: 'عملیات' },
      },
      fields: {
        status: {
          label: { en: 'Status', fa: 'وضعیت' },
          options: {
            pending: { en: 'Pending', fa: 'در انتظار' },
            confirmed: { en: 'Confirmed', fa: 'تایید شده' },
            paid: { en: 'Paid', fa: 'پرداخت شده' },
            cancelled: { en: 'Cancelled', fa: 'لغو شده' },
          },
        },
      },
    },
    kargozarConfig: {
      labels: {
        singular: { en: 'Kargozar Config', fa: 'تنظیمات کارگزار' },
        plural: { en: 'Kargozar Configs', fa: 'تنظیمات کارگزار' },
      },
      admin: {
        group: { en: 'Settings', fa: 'تنظیمات' },
      },
      fields: {
        username: { label: { en: 'Username', fa: 'نام کاربری' } },
        password: { label: { en: 'Password', fa: 'رمز عبور' } },
        currentOTP: { label: { en: 'Current OTP', fa: 'رمز یکبار مصرف فعلی' } },
        otpLastUpdated: { label: { en: 'OTP Last Updated', fa: 'آخرین بروزرسانی رمز' } },
        captchaMaxAttempts: { label: { en: 'Captcha Max Attempts', fa: 'حداکثر تلاش کپچا' } },
      },
    },
  },
  globals: {
    staticPages: {
      labels: {
        singular: { en: 'Static Pages', fa: 'صفحات ثابت' },
      },
      admin: {
        group: { en: 'Content', fa: 'محتوا' },
      },
      tabs: {
        about: { en: 'About Us', fa: 'درباره ما' },
        contact: { en: 'Contact', fa: 'تماس با ما' },
        terms: { en: 'Terms of Service', fa: 'شرایط استفاده' },
        privacy: { en: 'Privacy Policy', fa: 'حریم خصوصی' },
      },
      fields: {
        title: { en: 'Title', fa: 'عنوان' },
        content: { en: 'Content', fa: 'محتوا' },
        email: { en: 'Email', fa: 'ایمیل' },
        phone: { en: 'Phone', fa: 'تلفن' },
        address: { en: 'Address', fa: 'آدرس' },
        lastUpdated: { en: 'Last Updated', fa: 'آخرین بروزرسانی' },
      },
    },
  },
} as const;

export type SupportedLanguage = keyof typeof i18n.collections.media.labels.singular;
