import { i18n } from '@/i18n-config';
import { getDictionary } from '@/lib/dictionary';
import { LanguageProvider } from '@/components/language-provider';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  // @ts-ignore
  const dictionary = await getDictionary(lang);

  return (
    <LanguageProvider dictionary={dictionary} locale={lang as any}>
      {children}
    </LanguageProvider>
  );
}
