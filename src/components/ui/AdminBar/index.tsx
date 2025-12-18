// In the Name of God, the Creative, the Originator
'use client';

import type { PayloadAdminBarProps, PayloadMeUser } from '@payloadcms/admin-bar';

import { PayloadAdminBar } from '@payloadcms/admin-bar';
import { useRouter } from 'next/navigation';
import React, { useState, useCallback } from 'react';

import { getClientSideURL } from '@/utils/getURL';

import './index.scss';

const baseClass = 'admin-bar';

const Title: React.FC = () => <span>پیشخوان</span>;

export interface AdminBarProps {
  adminBarProps?: PayloadAdminBarProps;
}

export const AdminBar: React.FC<AdminBarProps> = props => {
  const { adminBarProps } = props || {};
  const [show, setShow] = useState(false);
  const router = useRouter();

  const onAuthChange = useCallback((user: PayloadMeUser) => {
    setShow(Boolean(user?.id));
  }, []);

  return (
    <div
      className={`${baseClass} ${show ? `${baseClass}--visible` : `${baseClass}--hidden`}`}
      style={{
        backgroundColor: '#1a1a2e',
        padding: show ? '0.5rem 0' : 0,
        display: show ? 'block' : 'none',
      }}>
      <div className={`${baseClass}__container`}>
        <PayloadAdminBar
          {...adminBarProps}
          className={`${baseClass}__bar`}
          classNames={{
            controls: `${baseClass}__controls`,
            logo: `${baseClass}__logo`,
            user: `${baseClass}__user`,
          }}
          cmsURL={getClientSideURL()}
          logo={<Title />}
          onAuthChange={onAuthChange}
          onPreviewExit={() => {
            fetch('/api/exit-preview').then(() => {
              router.push('/');
              router.refresh();
            });
          }}
          style={{
            backgroundColor: 'transparent',
            padding: 0,
            position: 'relative',
            zIndex: 'unset',
          }}
        />
      </div>
    </div>
  );
};
