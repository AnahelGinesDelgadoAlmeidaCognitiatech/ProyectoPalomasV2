import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
import esTranslations from "./locales/es.json";
import ptTranslations from "./locales/pt.json";

const storedLang = (() => {
  try { return localStorage.getItem("pigeondb_lang") || "es"; } catch { return "es"; }
})();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      pt: { translation: ptTranslations },
    },
    lng: storedLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
