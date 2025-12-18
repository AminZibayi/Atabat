// In the Name of God, the Creative, the Originator
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import styles from './not-found.module.css';

export default function NotFound() {
  const t = useTranslations('errors.notFound');

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.errorCode}>404</div>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.message}>{t('message')}</p>
        <Link href="/" className={styles.homeLink}>
          {t('backHome')}
        </Link>
      </div>
      <div className={styles.decoration}>
        <div className={styles.circle} />
        <div className={styles.circleSmall} />
      </div>
    </div>
  );
}
