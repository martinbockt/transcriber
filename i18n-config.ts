export const i18n = {
  defaultLocale: 'en',
  locales: [
    'en', // English
    'de', // German
    'fr', // French
    'es', // Spanish
    'it', // Italian
    'pt', // Portuguese
    'nl', // Dutch
    'pl', // Polish
    'sv', // Swedish
    'fi', // Finnish
    'da', // Danish
    'cs', // Czech
    'el', // Greek
    'hu', // Hungarian
    'ro', // Romanian
    'bg', // Bulgarian
    'hr', // Croatian
    'sk', // Slovak
    'sl', // Slovenian
    'et', // Estonian
    'lv', // Latvian
    'lt', // Lithuanian
    'mt', // Maltese
    'ga', // Irish
  ],
} as const;

export type Locale = (typeof i18n)['locales'][number];
