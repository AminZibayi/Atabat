// In the Name of God, the Creative, the Originator
'use client';

import { useTheme } from '@payloadcms/ui';
import * as React from 'react';

const AdminLogo = () => {
  const { theme } = useTheme();

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <div className="admin-logo">
      <img
        alt="Moj Zamzam Logo"
        src="/logo.png"
        style={{
          width: 'auto',
          height: '180px',
          marginBottom: '-40px',
          filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none',
        }}
      />
    </div>
  );
};

export default AdminLogo;
