import React, { useState, useEffect, useRef } from 'react';
import { version } from '../../package.json';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme/colors';
import DropdownPicker from '../components/DropdownPicker';
import AnimatedBackground from '../components/AnimatedBackground';
import BookLoadingModal from '../components/BookLoadingModal';
import CustomAlertModal from '../components/CustomAlertModal';
import { genererHistoireAvecRetry } from '../services/groqService';
import { genererAudio } from '../services/ttsService';
import {
  chargerCredits,
  chargerStatutPremium,
  deduireCredits,
} from '../services/supabaseService';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { AD_UNIT_INTERSTITIAL } from '../config/adsConfig';
import AdBanner from '../components/AdBanner';
import { construirePrompt } from '../utils/promptBuilder';
import { getAgeFromIndex, obtenirNombreMotsCible } from '../utils/wordCount';
import { LANGUAGE_IDS } from '../config/ttsVoices';
import { signOut, getCurrentUser } from '../services/authService';
import { addStorySeconds, checkAndPromptReview } from '../services/reviewService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Sound from 'react-native-sound';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type MainScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');


export default function MainScreen({ navigation }: MainScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // State: formulaire
  const [ageIndex, setAgeIndex] = useState(0);
  const [sexeIndex, setSexeIndex] = useState(0);
  const [langueIndex, setLangueIndex] = useState(0);
  const [dureeIndex, setDureeIndex] = useState(0);
  const [momentIndex, setMomentIndex] = useState(0);
  const [genreIndex, setGenreIndex] = useState(0);
  const [voixIndex, setVoixIndex] = useState(0);
  const [description, setDescription] = useState('');

  // State: génération
  const [loading, setLoading] = useState(false);

  // Refs
  const scrollViewRef = useRef<any>(null);

  // State: crédits
  const [creditsSecondes, setCreditsSecondes] = useState(0);

  // State: premium (zéro pub)
  const [isPremium, setIsPremium] = useState(false);

  // Interstitiel préchargé, affiché juste avant d'afficher l'histoire (utilisateurs non-premium)
  const interstitialRef = useRef(InterstitialAd.createForAdRequest(AD_UNIT_INTERSTITIAL));
  const interstitialLoadedRef = useRef(false);

  // State: modals
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsModalMessage, setCreditsModalMessage] = useState('');

  // State: clavier
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const descriptionY = useRef(0);

  // Récupérer les tableaux traduits
  const ages = t('ages', { returnObjects: true }) as string[];
  const sexes = t('sexes', { returnObjects: true }) as string[];
  const langues = t('langues', { returnObjects: true }) as string[];
  const durees = t('durees', { returnObjects: true }) as string[];
  const moments = t('moments', { returnObjects: true }) as string[];
  const genres = t('genres', { returnObjects: true }) as string[];
  const voix = t('voix', { returnObjects: true }) as string[];

  // Charger l'utilisateur, les crédits et le statut premium au montage
  useEffect(() => {
    getCurrentUser().then(u => {
      setUserEmail(u?.email ?? null);
    });
    chargerCredits().then(setCreditsSecondes);
    chargerStatutPremium().then(setIsPremium);
  }, []);

  // Rafraîchir les crédits/premium quand on revient sur cet écran (ex: retour de RechargeScreen)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      chargerCredits().then(setCreditsSecondes);
      chargerStatutPremium().then(setIsPremium);
      // Second chargement différé pour attraper le délai du webhook RevenueCat
      setTimeout(() => {
        chargerCredits().then(setCreditsSecondes);
        chargerStatutPremium().then(setIsPremium);
      }, 4000);
    });
    return unsubscribe;
  }, [navigation]);

  // Précharger l'interstitiel (utilisateurs non-premium uniquement)
  useEffect(() => {
    if (isPremium) return;

    const interstitial = interstitialRef.current;
    const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoadedRef.current = true;
    });
    const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialLoadedRef.current = false;
      interstitial.load(); // recharger pour la prochaine génération
    });
    interstitial.load();

    return () => {
      unsubLoaded();
      unsubClosed();
    };
  }, [isPremium]);

  // Keyboard listeners
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const formatCredits = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DÉCONNEXION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleDeconnexion = async () => {
    try {
      await signOut();
      navigation.replace('Home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GÉNÉRATION HISTOIRE + AUDIO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleGenerer = async () => {
    Keyboard.dismiss();

    // Vérification des crédits (estimation basée sur la durée choisie)
    const dureeMinutes = dureeIndex + 1;
    const coutEstime = dureeMinutes * 60;

    if (creditsSecondes < coutEstime) {
      let minutesLabel;
      if (creditsSecondes < 60) {
        minutesLabel = '<1';
      } else {
        minutesLabel = Math.floor(creditsSecondes / 60).toString();
      }
      setCreditsModalMessage(t('msg_credits_insuffisants', { minutes: minutesLabel }));
      setShowCreditsModal(true);
      return;
    }

    setLoading(true);
    let etape = 'histoire';

    try {
      const age = getAgeFromIndex(ageIndex);
      const langueId = LANGUAGE_IDS[langueIndex];
      const voixId = voixIndex === 0 ? 'female' : 'male';

      // Paramètres du prompt
      const promptParams = {
        age,
        ageLabel: ages[ageIndex],
        sexe: sexes[sexeIndex],
        genre: genres[genreIndex],
        moment: moments[momentIndex],
        duree: dureeMinutes,
        description,
        langueId,
      };

      // Nombre de mots cible calibré
      const motsCible = obtenirNombreMotsCible(dureeMinutes, age, langueId);

      // 1. Générer l'histoire avec retry (±10 mots, max 5 tentatives, garde le plus proche)
      const { texte } = await genererHistoireAvecRetry(
        (mots, correction) => construirePrompt(promptParams, mots, correction),
        motsCible,
      );

      // 2. Générer l'audio avec Google TTS
      etape = 'audio';
      const filePath = await genererAudio({
        texte,
        langueId,
        voixId: voixId as 'male' | 'female',
        age,
      });

      // 3. Mesurer la durée réelle de l'audio et déduire les crédits
      etape = 'lecture';
      const dureeReelle = await new Promise<number>((resolve, reject) => {
        const s = new Sound(filePath, '', err => {
          if (err) { reject(err); return; }
          const dur = Math.ceil(s.getDuration());
          s.release();
          resolve(dur);
        });
      });

      // Déduction côté serveur (anti-triche : le solde est calculé sur le serveur)
      etape = 'credits';
      const nouveauSolde = await deduireCredits(dureeReelle);
      setCreditsSecondes(nouveauSolde);

      // Vérifier si on demande un avis
      await addStorySeconds(dureeReelle);
      const { shouldShow, currentTotal } = await checkAndPromptReview();

      // Interstitiel avant de révéler l'histoire (utilisateurs non-premium, si prêt à temps)
      if (!isPremium && interstitialLoadedRef.current) {
        etape = 'pub';
        await new Promise<void>(resolve => {
          const unsub = interstitialRef.current.addAdEventListener(AdEventType.CLOSED, () => {
            unsub();
            resolve();
          });
          interstitialRef.current.show();
          // Filet de sécurité si l'événement CLOSED ne se déclenche jamais
          setTimeout(() => { unsub(); resolve(); }, 10000);
        });
      }

      setLoading(false);
      navigation.navigate('Story', {
        histoireGeneree: texte,
        audioFilePath: filePath,
        showReviewModal: shouldShow,
        reviewTotal: currentTotal,
      });
    } catch (error: any) {
      console.error(`Erreur génération [${etape}]:`, error);
      setLoading(false);
      const details = error.message || t('msg_erreur_generale');
      Alert.alert(t('msg_erreur_audio'), `[${etape}] ${details}`);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDU
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <View style={styles.screenWrapper}>
      <AnimatedBackground />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0 }}>
        <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>

        {/* ━━━ BANDEAU UTILISATEUR ━━━ */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail} numberOfLines={1}>
              {userEmail || 'Utilisateur'}
            </Text>
            <View style={styles.userBadges}>
              <Text style={styles.creditsText}>
                Solde : {formatCredits(creditsSecondes)}
              </Text>
              {creditsSecondes < 60 && (
                <TouchableOpacity
                  style={styles.btnRecharge}
                  onPress={() => navigation.navigate('Recharge')}>
                  <Text style={styles.btnRechargeText}>{t('btn_recharger')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.btnDeconnexion}
            onPress={handleDeconnexion}>
            <Text style={styles.btnDeconnexionText}>{t('btn_deconnexion')}</Text>
          </TouchableOpacity>
        </View>

        {/* ━━━ TITRE ━━━ */}
        <Text style={styles.title}>{t('app_name_titre')}</Text>
        <Text style={styles.subtitle}>{t('sous_titre')}</Text>

        {/* ━━━ SECTION AUDITEUR ━━━ */}
        <Text style={styles.sectionLabel}>{t('titre_auditeur')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <DropdownPicker
                label={t('hint_age')}
                value={ages[ageIndex]}
                options={ages}
                onSelect={(_, idx) => setAgeIndex(idx)}
              />
            </View>
            <View style={styles.spacer} />
            <View style={styles.halfWidth}>
              <DropdownPicker
                label={t('hint_sexe')}
                value={sexes[sexeIndex]}
                options={sexes}
                onSelect={(_, idx) => setSexeIndex(idx)}
              />
            </View>
          </View>
        </View>

        {/* ━━━ SECTION HISTOIRE ━━━ */}
        <Text style={styles.sectionLabel}>{t('titre_histoire')}</Text>
        <View style={styles.card}>
          <View style={{ marginBottom: 12 }}>
            <DropdownPicker
              label={t('hint_genre') + ' (' + genres.length + ')'}
              value={genres[genreIndex]}
              options={genres}
              onSelect={(_, idx) => setGenreIndex(idx)}
            />
          </View>

          <View style={[styles.row, { marginBottom: 12 }]}>
            <View style={styles.halfWidth}>
              <DropdownPicker
                label={t('hint_duree')}
                value={durees[dureeIndex]}
                options={durees}
                onSelect={(_, idx) => setDureeIndex(idx)}
              />
            </View>
            <View style={styles.spacer} />
            <View style={styles.halfWidth}>
              <DropdownPicker
                label={t('hint_moment')}
                value={moments[momentIndex]}
                options={moments}
                onSelect={(_, idx) => setMomentIndex(idx)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <DropdownPicker
                label={t('hint_langue') + ' (' + langues.length + ')'}
                value={langues[langueIndex]}
                options={langues}
                onSelect={(_, idx) => setLangueIndex(idx)}
              />
            </View>
            <View style={styles.spacer} />
            <View style={styles.halfWidth}>
              <DropdownPicker
                label={t('hint_voix')}
                value={voix[voixIndex]}
                options={voix}
                onSelect={(_, idx) => setVoixIndex(idx)}
              />
            </View>
          </View>
        </View>

        {/* ━━━ DESCRIPTION ━━━ */}
        <View
          style={styles.descriptionWrapper}
          onLayout={(e) => {
            descriptionY.current = e.nativeEvent.layout.y;
          }}>
          <TextInput
            style={styles.descriptionInput}
            placeholder={t('hint_details')}
            placeholderTextColor={Colors.primary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollTo({
                  y: descriptionY.current - 80,
                  animated: true,
                });
              }, 300);
            }}
          />
        </View>

        {/* ━━━ BOUTON CRÉER ━━━ */}
        <TouchableOpacity
          style={[styles.btnCreer, loading && styles.btnDisabled]}
          onPress={handleGenerer}
          disabled={loading}>
          <Text style={styles.btnCreerText}>{t('btn_creer')}</Text>
        </TouchableOpacity>

        {/* ━━━ LOADER POPUP ━━━ */}
        <BookLoadingModal visible={loading} message={t('msg_generation_en_cours')} />

        {/* MODAL CREDITS INSUFFISANTS */}
        <CustomAlertModal
          visible={showCreditsModal}
          icon="💎"
          title="Credits insuffisants"
          message={creditsModalMessage}
          primaryButton={{
            text: t('recharge_buy'),
            onPress: () => { setShowCreditsModal(false); navigation.navigate('Recharge'); },
          }}
          secondaryButton={{
            text: 'OK',
            onPress: () => setShowCreditsModal(false),
          }}
        />

        {/* ━━━ PUB BANDEAU ━━━ */}
        <AdBanner isPremium={isPremium} />

        {/* ━━━ FOOTER ━━━ */}
        <Text style={styles.version}>Version {version}</Text>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 24,
  },

  // User card
  userCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  userBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  creditsText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  btnRecharge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  btnRechargeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  btnDeconnexion: {
    backgroundColor: Colors.error,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDeconnexionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.white,
  },

  // Titre
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Sections
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 2,
    color: Colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.cardBackgroundAlt,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  halfWidth: {
    flex: 1,
  },
  spacer: {
    width: 16,
  },

  // Description
  descriptionWrapper: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 20,
    marginBottom: 32,
    backgroundColor: Colors.cardBackgroundAlt,
  },
  descriptionInput: {
    minHeight: 80,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  // Bouton Créer
  btnCreer: {
    width: '100%',
    height: 68,
    backgroundColor: Colors.primary,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnCreerText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Footer
  version: {
    textAlign: 'center',
    color: '#8E8C9A',
    fontSize: 12,
    marginTop: 16,
    marginBottom: 8,
    opacity: 0.7,
  },
});