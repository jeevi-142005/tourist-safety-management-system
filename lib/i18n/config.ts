export const defaultLocale = "en"

export const locales = [
  "en", // English
  "hi", // Hindi
  "as", // Assamese
  "bn", // Bengali
  "te", // Telugu
  "ta", // Tamil
  "ml", // Malayalam
  "kn", // Kannada
  "gu", // Gujarati
  "mr", // Marathi
  "or", // Odia
  "pa", // Punjabi
] as const

export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  as: "অসমীয়া",
  bn: "বাংলা",
  te: "తెలుగు",
  ta: "தமிழ்",
  ml: "മലയാളം",
  kn: "ಕನ್ನಡ",
  gu: "ગુજરાતી",
  mr: "मराठी",
  or: "ଓଡ଼ିଆ",
  pa: "ਪੰਜਾਬੀ",
}

export const rtlLocales: Locale[] = []

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale)
}
