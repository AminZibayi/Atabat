// In the Name of God, the Creative, the Originator
'use client';

import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react';
import { useRouter } from 'next/navigation';
import React from 'react';

import { getClientSideURL } from '@/utils/getURL';

export const LivePreviewListener: React.FC = () => {
  const router = useRouter();

  return <PayloadLivePreview refresh={router.refresh} serverURL={getClientSideURL()} />;
};
