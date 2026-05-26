import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import id from "./locales/id";
import en from "./locales/en";

export const SUPPORTED_LANGS = ["id", "en"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "id",
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    resources: {
      id: { translation: id },
      en: { translation: en },
    },
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "feb_penilaian_lang",
    },
  });

export default i18n;
