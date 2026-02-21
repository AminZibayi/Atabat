// In the Name of God, the Creative, the Originator
import { draftMode } from 'next/headers';
import { getPayload } from 'payload';
import { setRequestLocale } from 'next-intl/server';
import React from 'react';
import type { Config } from '@/payload-types';

import config from '@/payload.config';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { LivePreviewListener } from '@/components/ui/LivePreviewListener';
import { RichText } from '@/components/ui/RichText';
import { useRandomHeroBackground } from '@/hooks/useRandomHeroBackground';
import styles from '../static.module.css';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { isEnabled: isDraftMode } = await draftMode();
  setRequestLocale(locale);

  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });

  const staticPages = await payload.findGlobal({
    slug: 'static-pages',
    locale: locale as Config['locale'],
    draft: isDraftMode,
  });

  const title = staticPages?.contactTitle || (locale === 'fa' ? 'تماس با ما' : 'Contact Us');
  const content = staticPages?.contactContent;
  const email = staticPages?.contactEmail;
  const phone = staticPages?.contactPhone;
  const address = staticPages?.contactAddress;

  return (
    <>
      {isDraftMode && <LivePreviewListener />}
      <Header />
      <ContactPageClient
        title={title}
        content={content}
        locale={locale}
        email={email}
        phone={phone}
        address={address}
      />
      <Footer />
    </>
  );
}

function ContactPageClient({ title, content, locale, email, phone, address }: any) {
  const bgImage = useRandomHeroBackground();

  return (
    <main className={styles.page}>
      <div
        className={styles.header}
        style={bgImage ? ({ '--hero-bg': `url("${bgImage}")` } as React.CSSProperties) : undefined}>
        <div className={styles.container}>
          <h1 className={styles.title}>{title}</h1>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.container}>
          <div className={styles.content}>
            {content ? (
              <RichText data={content} />
            ) : (
              <div className={styles.empty}>
                <p>{locale === 'fa' ? 'محتوایی وجود ندارد' : 'No content available'}</p>
              </div>
            )}

            {(email || phone || address) && (
              <div className={styles.contactInfo}>
                {email && (
                  <div className={styles.contactItem}>
                    <svg
                      className={styles.contactIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <div>
                      <div className={styles.contactLabel}>
                        {locale === 'fa' ? 'ایمیل' : 'Email'}
                      </div>
                      <div className={styles.contactValue}>
                        <a href={`mailto:${email}`}>{email}</a>
                      </div>
                    </div>
                  </div>
                )}

                {phone && (
                  <div className={styles.contactItem}>
                    <svg
                      className={styles.contactIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <div>
                      <div className={styles.contactLabel}>
                        {locale === 'fa' ? 'تلفن' : 'Phone'}
                      </div>
                      <div className={styles.contactValue}>
                        <a href={`tel:${phone}`}>{phone}</a>
                      </div>
                    </div>
                  </div>
                )}

                {address && (
                  <div className={styles.contactItem}>
                    <svg
                      className={styles.contactIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div>
                      <div className={styles.contactLabel}>
                        {locale === 'fa' ? 'آدرس' : 'Address'}
                      </div>
                      <div className={styles.contactValue}>{address}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
