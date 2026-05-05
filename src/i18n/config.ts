import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
import esTranslations from "./locales/es.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
    },
    lng: "es", // Idioma por defecto. El LanguageProvider lo actualizará.
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React ya previene XSS
    },
  });

export default i18n;
