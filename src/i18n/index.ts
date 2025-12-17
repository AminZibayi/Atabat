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
  },
} as const;

export type SupportedLanguage = keyof typeof i18n.collections.media.labels.singular;
