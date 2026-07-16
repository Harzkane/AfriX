import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./translations/en.json";
import fr from "./translations/fr.json";

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: "en", // default
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes values to prevent XSS
    },
  });

export default i18next;
