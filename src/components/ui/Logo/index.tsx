// In the Name of God, the Creative, the Originator
import Image from 'next/image';
import React from 'react';

import styles from './Logo.module.css';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';

export interface LogoProps {
  size?: LogoSize;
  className?: string;
  /** Whether to use inverted (white/light) version for dark backgrounds */
  inverted?: boolean;
}

const sizeMap: Record<LogoSize, number> = {
  xs: 32,
  sm: 48,
  md: 64,
  lg: 96,
  xl: 128,
  '2xl': 160,
  hero: 280,
};

export function Logo({ size = 'md', className = '', inverted = false }: LogoProps) {
  const pixelSize = sizeMap[size];

  return (
    <div
      className={`${styles.logo} ${inverted ? styles.inverted : styles.tinted} ${className}`}
      style={{ width: pixelSize, height: pixelSize }}>
      <Image
        src="/logo.png"
        alt="عتبات"
        width={pixelSize}
        height={pixelSize}
        className={styles.image}
        priority={size === 'lg' || size === 'xl' || size === '2xl' || size === 'hero'}
      />
    </div>
  );
}
