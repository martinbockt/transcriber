'use client';

import React, { createContext, useContext } from 'react';
import type { Locale } from '@/i18n-config';

type Dictionary = Record<string, any>;

interface LanguageContextType {
  dictionary: Dictionary;
  locale: Locale;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
  dictionary,
  locale,
}: {
  children: React.ReactNode;
  dictionary: Dictionary;
  locale: Locale;
}) {
  return (
    <LanguageContext.Provider value={{ dictionary, locale }}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
