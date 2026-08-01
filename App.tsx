/**
 * HistoryVoice - L'Atelier Magique
 * App de génération d'histoires avec IA et TTS
 * React Native - Cross-platform (Android + iOS)
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, Platform, I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { loadCalibration } from './src/services/calibrationStore';
import Purchases from 'react-native-purchases';
import mobileAds, { AdsConsent, MaxAdContentRating } from 'react-native-google-mobile-ads';

// Initialisation i18n (doit être importé avant tout composant)
import './src/i18n';
import i18n from './src/i18n';

// Support RTL pour l'Arabe
const isArabic = i18n.language === 'ar';
if (I18nManager.isRTL !== isArabic) {
  I18nManager.forceRTL(isArabic);
}

// Configuration Google Sign-In avec le webClientId (Google Cloud Console)
// Ce webClientId doit correspondre à celui configuré dans Supabase > Auth > Providers > Google
GoogleSignin.configure({
  webClientId: '1014494879896-nqe8dse0li99cvm0s3ll7i5iqcd78vbk.apps.googleusercontent.com',
});

// Configuration RevenueCat
const REVENUECAT_API_KEY = Platform.select({
  android: 'goog_bdUFgXIjLExggHcWAAZrGbmIASc',
  ios: '', // À ajouter quand l'app iOS sera prête
}) ?? '';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Initialiser RevenueCat
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });

    // Consentement RGPD (UMP) : à demander à chaque lancement avant d'initialiser les pubs.
    // En cas d'échec de la collecte, on retombe sur le consentement de la session précédente
    // (getConsentInfo), comme recommandé par la doc react-native-google-mobile-ads.
    AdsConsent.gatherConsent()
      .catch(error => console.error('Consentement pubs : échec de la collecte', error))
      .finally(async () => {
        const { canRequestAds } = await AdsConsent.getConsentInfo();
        if (!canRequestAds) return;

        // App à cible mixte (inclut des enfants) → pubs non personnalisées et
        // contenu limité au classement G, obligatoire côté Google Play/AdMob.
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.G,
          tagForChildDirectedTreatment: true,
          tagForUnderAgeOfConsent: true,
        });
        await mobileAds().initialize();
      });

    loadCalibration().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#CECCDE' }}>
        <ActivityIndicator size="large" color="#6750A4" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#CECCDE" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
