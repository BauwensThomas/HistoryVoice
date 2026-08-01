import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';

import fr from './locales/fr';
import en from './locales/en';
import it from './locales/it';
import es from './locales/es';
import nl from './locales/nl';
import pt from './locales/pt';
import de from './locales/de';
import ar from './locales/ar';
import tr from './locales/tr';
import pl from './locales/pl';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  it: { translation: it },
  es: { translation: es },
  nl: { translation: nl },
  pt: { translation: pt },
  de: { translation: de },
  ar: { translation: ar },
  tr: { translation: tr },
  pl: { translation: pl },
};

// Détection de la langue du téléphone
const getDeviceLanguage = (): string => {
  try {
    const locales = getLocales();
    if (locales.length > 0) {
      const lang = locales[0].languageCode;
      // Vérifier si la langue est supportée
      if (['fr', 'en', 'it', 'es', 'nl', 'pt', 'de', 'ar', 'tr', 'pl'].includes(lang)) {
        return lang;
      }
    }
  } catch (e) {
    console.log('Could not detect device language', e);
  }
  return 'fr'; // Français par défaut
};

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
  // Pour supporter les tableaux dans les traductions
  returnObjects: true,
});

export default i18n;
