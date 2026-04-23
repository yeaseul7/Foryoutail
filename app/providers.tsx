'use client';

import dynamic from 'next/dynamic';
import { AuthProvider } from '@/lib/firebase/auth';

const LocationDataProvider = dynamic(
  () => import('@/packages/components/base/LocationDataProvider'),
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
      {children}
    </AuthProvider>
  );
}
