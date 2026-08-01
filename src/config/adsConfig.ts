// Configuration AdMob
import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

// En build debug (__DEV__), on utilise les ID de test officiels Google : ils
// affichent toujours une pub factice, indépendamment du fill rate réel du
// compte AdMob. Les vrais ID ne sont utilisés qu'en build release.
export const AD_UNIT_BANNER = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      android: 'ca-app-pub-3549294158319032/6555352365',
      ios: '', // À ajouter quand l'app iOS sera prête
    }) ?? '';

export const AD_UNIT_INTERSTITIAL = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.select({
      android: 'ca-app-pub-3549294158319032/7177334747',
      ios: '',
    }) ?? '';
