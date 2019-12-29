import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';

// the translations
import fr from './vitrine.fr.json';
import en from './vitrine.en.json';
const resources = {fr, en};

i18n
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'fr',

    keySeparator: '.', // we use keys in form messages.welcome

    interpolation: {
      escapeValue: false // react is already safe from xss
    }
  });

export default i18n;
