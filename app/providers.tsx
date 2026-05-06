'use client';

import dynamic from 'next/dynamic';
import { AuthProvider } from '@/lib/supabase/auth';

const LocationDataProvider = dynamic(
  () => import('@/packages/components/base/LocationDataProvider'),
  { ssr: false }
);

const SitePopupModal = dynamic(
  () => import('@/packages/components/base/SitePopupModal'),
  { ssr: false }
);

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <LocationDataProvider />
      <SitePopupModal />
      {children}
    </AuthProvider>
  );
}
