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
/**
 * Seed script for static pages.
 * This script is idempotent - safe to run multiple times.
 * Usage: pnpm payload seed-static-pages
 */
export async function script(config: SanitizedConfig) {
  console.log('🌱 Seeding static pages...');

  const payload = await getPayload({ config });

  // About Us Content — Fa
  const aboutContentFa = createRichText([
    createHeading('درباره موج زمزم', 'h2'),
    createParagraph(
      'موج زمزم بخش تخصصی سفرهای زیارتی آژانس مسافرتی موج زمزم (mz724.ir) است که با هدف ارائه خدماتی نوآورانه، شفاف و بی‌دردسر به زائران کربلا، نجف، کاظمین و سامرا فعالیت می‌کند. ما معتقدیم که یک سفر معنوی باید از همان لحظه رزرو، آرامش‌بخش باشد.'
    ),
    createHeading('چرا موج زمزم؟', 'h2'),
    createParagraph(
      'با تجربه‌ی سال‌ها حضور در صنعت گردشگری ایران، موج زمزم یک درگاه آنلاین برای مقایسه و رزرو کاروان‌های زیارتی از معتبرترین مجریان کشور فراهم کرده است. تنوع تورها، شفافیت قیمت‌ها و پشتیبانی ۲۴ ساعته، ما را از سایر سامانه‌ها متمایز می‌کند.'
    ),
    createHeading('ماموریت ما', 'h2'),
    createParagraph(
      'ماموریت ما ساده است: هر زائر ایرانی بتواند با چند کلیک ساده، بهترین تور را با بهترین قیمت پیدا کند، رزرو کند و با خیال راحت به سفر برود. ما واسطه‌ها را کم و کیفیت خدمات را زیاد می‌کنیم.'
    ),
    createHeading('مجوزها و اعتبار', 'h2'),
    createParagraph(
      'موج زمزم زیرمجموعه آژانس مسافرتی موج زمزم با شماره مجوز رسمی از سازمان میراث فرهنگی، گردشگری و صنایع دستی ایران است. تمامی مجریان تور نمایش داده‌شده در این سامانه دارای مجوز معتبر از سازمان حج و زیارت می‌باشند.'
    ),
  ]);

  // About Us Content — En
  const aboutContentEn = createRichText([
    createHeading('About Moj Zamzam', 'h2'),
    createParagraph(
      'Moj Zamzam is the pilgrimage travel division of Moj Zamzam Travel Agency (mz724.ir), dedicated to providing innovative, transparent, and stress-free services for pilgrims traveling to Karbala, Najaf, Kazimain, and Samarra.'
    ),
    createHeading('Why Moj Zamzam?', 'h2'),
    createParagraph(
      'With years of experience in the Iranian tourism industry, Moj Zamzam provides an online platform to compare and book pilgrimage tours from the most reputable operators in the country. Variety of tours, transparent pricing, and 24/7 support set us apart.'
    ),
    createHeading('Our Mission', 'h2'),
    createParagraph(
      'Our mission is simple: every Iranian pilgrim should be able to find the best tour at the best price with just a few clicks, book it, and travel with peace of mind.'
    ),
  ]);

  // Contact Content — Fa
  const contactContentFa = createRichText([
    createParagraph(
      'تیم پشتیبانی موج زمزم آماده پاسخگویی به تمام سوالات شما درباره تورها، رزروها و خدمات زیارتی است. از طریق راه‌های زیر با ما در تماس باشید:'
    ),
  ]);

  // Contact Content — En
  const contactContentEn = createRichText([
    createParagraph(
      'The Moj Zamzam support team is ready to answer all your questions about tours, reservations, and pilgrimage services. Contact us through the following channels:'
    ),
  ]);

  // Terms Content — Fa
  const termsContentFa = createRichText([
    createHeading('شرایط و قوانین استفاده از سامانه موج زمزم', 'h2'),
    createParagraph('۱. استفاده از این سامانه به منزله پذیرش کامل این شرایط و قوانین است.'),
    createParagraph(
      '۲. تمامی کاربران موظف‌اند اطلاعات هویتی خود را به‌درستی و کامل وارد نمایند. هرگونه اطلاعات ناقص یا نادرست ممکن است منجر به لغو رزرو شود.'
    ),
    createParagraph(
      '۳. مسئولیت حفظ محرمانگی اطلاعات حساب کاربری (نام کاربری و رمز عبور) به عهده کاربر است.'
    ),
    createParagraph(
      '۴. موج زمزم واسط بین زائر و مجریان تور است. در صورت بروز مشکل در سفر، موج زمزم تلاش می‌کند در رفع مشکل کمک کند اما مسئولیت مستقیم عملکرد مجری تور را بر عهده ندارد.'
    ),
    createParagraph(
      '۵. لغو رزرو تابع قوانین و ضوابط مجری تور مربوطه است و باید از طریق پشتیبانی موج زمزم پیگیری شود.'
    ),
    createParagraph('۶. هرگونه سوءاستفاده از سامانه ممنوع است و پیگرد قانونی خواهد داشت.'),
  ]);

  // Terms Content — En
  const termsContentEn = createRichText([
    createHeading('Terms of Service — Moj Zamzam', 'h2'),
    createParagraph(
      '1. Using this platform constitutes full acceptance of these terms and conditions.'
    ),
    createParagraph(
      '2. All users must provide accurate and complete identity information. Incomplete or incorrect information may result in cancellation of the booking.'
    ),
    createParagraph(
      '3. Users are responsible for maintaining the confidentiality of their account credentials.'
    ),
    createParagraph(
      "4. Moj Zamzam acts as an intermediary between pilgrims and tour operators. Moj Zamzam will assist in resolving any issues but does not bear direct responsibility for the tour operator's conduct."
    ),
    createParagraph(
      '5. Cancellations are subject to the policies of the respective tour operator and must be coordinated through Moj Zamzam support.'
    ),
  ]);

  // Privacy Content — Fa
  const privacyContentFa = createRichText([
    createHeading('سیاست حریم خصوصی موج زمزم', 'h2'),
    createParagraph(
      'موج زمزم کاملاً متعهد به حفاظت از اطلاعات شخصی کاربران خود است. این سند توضیح می‌دهد که چه اطلاعاتی جمع‌آوری می‌شود، چگونه استفاده می‌شود و چطور محافظت می‌شود.'
    ),
    createHeading('اطلاعات جمع‌آوری‌شده', 'h2'),
    createParagraph(
      'در هنگام ثبت‌نام و رزرو، اطلاعاتی از قبیل نام، کد ملی، شماره تلفن و تاریخ تولد جمع‌آوری می‌شود. این اطلاعات صرفاً جهت تسهیل فرایند اعزام به سفر زیارتی و مطابق با الزامات سازمان حج و زیارت استفاده خواهد شد.'
    ),
    createHeading('حفاظت از اطلاعات', 'h2'),
    createParagraph(
      'اطلاعات شما از طریق پروتکل‌های امنیتی استاندارد رمزگذاری و ذخیره می‌شود. هیچ‌گاه اطلاعات شخصی شما به اشخاص ثالث بدون رضایت شما فروخته یا واگذار نخواهد شد.'
    ),
    createHeading('حقوق کاربران', 'h2'),
    createParagraph(
      'شما حق دارید در هر زمان درخواست مشاهده، اصلاح یا حذف اطلاعات شخصی خود را از طریق تیم پشتیبانی موج زمزم داشته باشید.'
    ),
  ]);

  // Privacy Content — En
  const privacyContentEn = createRichText([
    createHeading('Privacy Policy — Moj Zamzam', 'h2'),
    createParagraph(
      'Moj Zamzam is fully committed to protecting the personal information of its users. This document explains what information is collected, how it is used, and how it is protected.'
    ),
    createHeading('Information Collected', 'h2'),
    createParagraph(
      'During registration and booking, information such as name, national ID, phone number, and date of birth is collected. This information is used exclusively to facilitate the pilgrimage dispatch process and in accordance with Hajj and Pilgrimage Organization requirements.'
    ),
    createHeading('Data Protection', 'h2'),
    createParagraph(
      'Your information is encrypted and stored using standard security protocols. Your personal data will never be sold or transferred to third parties without your consent.'
    ),
  ]);

  const today = new Date().toISOString();

  await payload.updateGlobal({
    slug: 'static-pages',
    data: {
      aboutTitle: 'درباره موج زمزم',
      aboutContent: aboutContentFa,
      contactTitle: 'تماس با موج زمزم',
      contactContent: contactContentFa,
      contactEmail: 'info@mz724.ir',
      contactPhone: '021-91012724',
      contactAddress: 'تهران — سامانه زیارتی موج زمزم (mz724.ir)',
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
      aboutTitle: 'About Moj Zamzam',
      aboutContent: aboutContentEn,
      contactTitle: 'Contact Moj Zamzam',
      contactContent: contactContentEn,
      contactEmail: 'info@mz724.ir',
      contactPhone: '+98-21-91012724',
      contactAddress: 'Tehran — Moj Zamzam Pilgrimage Platform (mz724.ir)',
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
