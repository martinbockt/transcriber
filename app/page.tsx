'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { i18n } from '@/i18n-config';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check for saved preference
    const savedLocale = localStorage.getItem('i18nextLng'); // Common key, or use custom

    // Detect browser language
    const browserLang = navigator.language.split('-')[0];

    // Determine target locale
    let targetLocale = i18n.defaultLocale;
    if (savedLocale && i18n.locales.includes(savedLocale as any)) {
      targetLocale = savedLocale as any;
    } else if (i18n.locales.includes(browserLang as any)) {
      targetLocale = browserLang as any;
    }

    // Redirect
    router.replace(`/${targetLocale}`);
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
    </div>
  );
}
