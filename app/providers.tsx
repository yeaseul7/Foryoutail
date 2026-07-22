'use client';

import { AuthProvider } from '@/lib/supabase/auth';

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
