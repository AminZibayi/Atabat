// In the Name of God, the Creative, the Originator
import type { SanitizedConfig } from 'payload';
import { getPayload } from 'payload';

// Helper to create Lexical paragraph node
const createParagraph = (text: string) => ({
  type: 'paragraph',
  children: [
    {
      type: 'text',
      detail: 0,
      format: 0,
      mode: 'normal',
      style: '',
      text,
      version: 1,
    },
  ],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  textFormat: 0,
  version: 1,
});

// Helper to create Lexical heading node
const createHeading = (text: string, tag: 'h1' | 'h2' | 'h3' = 'h2') => ({
  type: 'heading',
  tag,
  children: [
    {
      type: 'text',
      detail: 0,
      format: 0,
      mode: 'normal',
      style: '',
      text,
      version: 1,
    },
  ],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  textFormat: 0,
  version: 1,
});

// Helper to create root object
const createRichText = (children: ReturnType<typeof createParagraph | typeof createHeading>[]) => ({
  root: {
    type: 'root',
    children,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
});

/**
 * Seed script for static pages.
 * This script is idempotent - safe to run multiple times.
 * Usage: pnpm payload seed-static-pages
 */
export async function script(config: SanitizedConfig) {
  console.log('🌱 Seeding static pages...');

  const payload = await getPayload({ config });

  // About Us Content
  const aboutContentFa = createRichText([
    createHeading('درباره عتبات', 'h2'),
    createParagraph(
      'سامانه مدیریت زیارت عتبات عالیات با هدف تسهیل فرایند ثبت نام و اعزام زائرین محترم طراحی و پیاده‌سازی شده است. ما مفتخریم که با بهره‌گیری از تکنولوژی‌های روز، خدماتی شایسته به زائرین اباعبدالله الحسین (ع) ارائه دهیم.'
    ),
    createHeading('ماموریت ما', 'h2'),
    createParagraph(
      'ارائه خدمات شفاف، سریع و با کیفیت به زائرین، حذف واسطه‌های غیرضروری و کاهش هزینه‌های سفر از جمله مهمترین اهداف ماست.'
    ),
  ]);

  const aboutContentEn = createRichText([
    createHeading('About Atabat', 'h2'),
    createParagraph(
      'The Atabat Pilgrimage Management System is designed to facilitate the registration and dispatch process for pilgrims. We are proud to provide worthy services to the pilgrims of Imam Hussein (AS) using modern technologies.'
    ),
    createHeading('Our Mission', 'h2'),
    createParagraph(
      'Providing transparent, fast, and high-quality services to pilgrims, eliminating unnecessary intermediaries, and reducing travel costs are among our most important goals.'
    ),
  ]);

  // Contact Content
  const contactContentFa = createRichText([
    createParagraph('برای ارتباط با ما می‌توانید از طریق راه‌های زیر اقدام نمایید:'),
  ]);

  const contactContentEn = createRichText([
    createParagraph('You can contact us using the following methods:'),
  ]);

  // Terms Content
  const termsContentFa = createRichText([
    createHeading('شرایط و قوانین استفاده', 'h2'),
    createParagraph(
      '۱. تمامی کاربران می‌بایست هنگام ثبت نام اطلاعات هویتی خود را به درستی وارد نمایند.'
    ),
    createParagraph('۲. مسئولیت حفظ امنیت نام کاربری و رمز عبور بر عهده کاربر است.'),
    createParagraph('۳. هرگونه سوء استفاده از سامانه پیگرد قانونی دارد.'),
  ]);

  const termsContentEn = createRichText([
    createHeading('Terms of Service', 'h2'),
    createParagraph(
      '1. All users must correctly enter their identity information when registering.'
    ),
    createParagraph(
      '2. The user is responsible for maintaining the security of their username and password.'
    ),
    createParagraph('3. Any misuse of the system is subject to legal prosecution.'),
  ]);

  // Privacy Content
  const privacyContentFa = createRichText([
    createHeading('حریم خصوصی کاربران', 'h2'),
    createParagraph(
      'ما متعهد به حفظ حریم خصوصی کاربران هستیم. اطلاعات شما تنها برای امور زیارتی و طبق قوانین جمهوری اسلامی ایران استفاده خواهد شد.'
    ),
  ]);

  const privacyContentEn = createRichText([
    createHeading('User Privacy', 'h2'),
    createParagraph(
      'We are committed to protecting user privacy. Your information will only be used for pilgrimage purposes and in accordance with the laws of the Islamic Republic of Iran.'
    ),
  ]);

  const today = new Date().toISOString();

  // Update Global - This is idempotent (re-execution safe)
  // updateGlobal creates or updates, so it's safe to run multiple times
  await payload.updateGlobal({
    slug: 'static-pages',
    data: {
      aboutTitle: 'درباره ما',
      aboutContent: aboutContentFa,
      contactTitle: 'تماس با ما',
      contactContent: contactContentFa,
      contactEmail: 'info@atabat.org',
      contactPhone: '021-12345678',
      contactAddress: 'تهران، خیابان آزادی، سازمان حج و زیارت',
      termsTitle: 'شرایط و قوانین',
      termsContent: termsContentFa,
      termsLastUpdated: today,
      privacyTitle: 'حریم خصوصی',
      privacyContent: privacyContentFa,
      privacyLastUpdated: today,
    },
    locale: 'fa',
  });

  await payload.updateGlobal({
    slug: 'static-pages',
    data: {
      aboutTitle: 'About Us',
      aboutContent: aboutContentEn,
      contactTitle: 'Contact Us',
      contactContent: contactContentEn,
      contactEmail: 'info@atabat.org',
      contactPhone: '+98-21-12345678',
      contactAddress: 'Hajj and Pilgrimage Organization, Azadi St, Tehran',
      termsTitle: 'Terms of Service',
      termsContent: termsContentEn,
      termsLastUpdated: today,
      privacyTitle: 'Privacy Policy',
      privacyContent: privacyContentEn,
      privacyLastUpdated: today,
    },
    locale: 'en',
  });

  console.log('✅ Static pages seeded successfully!');
}
