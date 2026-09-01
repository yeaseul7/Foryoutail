'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'ko' | 'en';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  isEnglish: boolean;
  t: (korean: string, english: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = 'kkosunnae_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'ko' || saved === 'en') {
      document.documentElement.lang = saved;
      queueMicrotask(() => setLanguageState(saved));
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    document.documentElement.lang = nextLanguage;
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      isEnglish: language === 'en',
      t: (korean: string, english: string) => language === 'en' ? english : korean,
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
