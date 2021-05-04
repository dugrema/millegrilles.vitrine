import i18n from "i18next"
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from "react-i18next"

import moment from 'moment'

// the translations
import 'moment/locale/fr'
import fr from './translation.fr.json'
import en from './translation.en.json'
const resources = {fr, en}

function formatterValeur(value, format, lng) {
  if(value instanceof Date) {
    return moment(value).locale(lng).format(format)
  } else if(!isNaN(value) && !isNaN(format)) {
    return Number(value).toFixed(format)
  }

  return value
}

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'fr',

    // debug: true,

    keySeparator: '.', // we use keys in form messages.welcome

    // backend: {
    //   loadPath: './locales/{{lng}}/{{ns}}.json',
    // },

    interpolation: {
      escapeValue: false, // react is already safe from xss,
      format: formatterValeur
    }
  })

export default i18n
