'use client';

import { AuthProvider } from '@/lib/supabase/auth';
import { LanguageProvider } from '@/lib/i18n/language';

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );
}
