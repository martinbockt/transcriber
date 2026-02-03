import 'server-only';
import type { Locale } from '@/i18n-config';

const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  de: () => import('@/dictionaries/de.json').then((module) => module.default),
  fr: () => import('@/dictionaries/fr.json').then((module) => module.default),
  es: () => import('@/dictionaries/es.json').then((module) => module.default),
  it: () => import('@/dictionaries/it.json').then((module) => module.default),
  pt: () => import('@/dictionaries/pt.json').then((module) => module.default),
  nl: () => import('@/dictionaries/nl.json').then((module) => module.default),
  pl: () => import('@/dictionaries/pl.json').then((module) => module.default),
  sv: () => import('@/dictionaries/sv.json').then((module) => module.default),
  fi: () => import('@/dictionaries/fi.json').then((module) => module.default),
  da: () => import('@/dictionaries/da.json').then((module) => module.default),
  cs: () => import('@/dictionaries/cs.json').then((module) => module.default),
  el: () => import('@/dictionaries/el.json').then((module) => module.default),
  hu: () => import('@/dictionaries/hu.json').then((module) => module.default),
  ro: () => import('@/dictionaries/ro.json').then((module) => module.default),
  bg: () => import('@/dictionaries/bg.json').then((module) => module.default),
  hr: () => import('@/dictionaries/hr.json').then((module) => module.default),
  sk: () => import('@/dictionaries/sk.json').then((module) => module.default),
  sl: () => import('@/dictionaries/sl.json').then((module) => module.default),
  et: () => import('@/dictionaries/et.json').then((module) => module.default),
  lv: () => import('@/dictionaries/lv.json').then((module) => module.default),
  lt: () => import('@/dictionaries/lt.json').then((module) => module.default),
  mt: () => import('@/dictionaries/mt.json').then((module) => module.default),
  ga: () => import('@/dictionaries/ga.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]?.() ?? dictionaries.en();
};
