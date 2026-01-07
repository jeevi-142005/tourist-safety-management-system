import { type Locale, defaultLocale } from "./config"

const dictionaries = {
  en: () => import("./locales/en.json").then((module) => module.default),
  hi: () => import("./locales/hi.json").then((module) => module.default),
  as: () => import("./locales/as.json").then((module) => module.default),
}

export const getDictionary = async (locale: Locale) => {
  if (locale in dictionaries) {
    return dictionaries[locale as keyof typeof dictionaries]()
  }
  return dictionaries[defaultLocale]()
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
