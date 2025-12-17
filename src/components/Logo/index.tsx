'use client';

import { useTheme } from '@payloadcms/ui';
import * as React from 'react';

const PlyaLogo = () => {
  const { theme } = useTheme();

  return (
    <div className="plya-logo">
      {theme === 'dark' ? (
        <img
          alt="Plya Logo"
          src="/logo_white-removebg_upscayl_3x.png"
          style={{
            width: 'auto',
            height: '180px',
            marginBottom: '-40px',
          }}
        />
      ) : (
        <img
          alt="Plya Logo"
          src="/logo-removebg_upscayl_3x.png"
          style={{
            width: 'auto',
            height: '180px',
            marginBottom: '-40px',
          }}
        />
      )}
    </div>
  );
};

export default PlyaLogo;
