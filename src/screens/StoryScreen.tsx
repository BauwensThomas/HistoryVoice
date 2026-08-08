import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import AnimatedBackground from '../components/AnimatedBackground';
import CustomAlertModal from '../components/CustomAlertModal';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { onReviewResponse } from '../services/reviewService';
import { chargerStatutPremium } from '../services/supabaseService';
import { sauvegarderHistoire } from '../services/storyLibraryService';
import AdBanner from '../components/AdBanner';

type StoryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Story'>;
  route: RouteProp<RootStackParamList, 'Story'>;
};

export default function StoryScreen({ navigation, route }: StoryScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = route.params;
  const { histoireGeneree } = params;

  // Chemin local du fichier audio, prêt pour la lecture.
  // Mode 'new' : déjà disponible immédiatement. Mode 'saved' : téléchargé au montage.
  const [resolvedAudioPath, setResolvedAudioPath] = useState<string | null>(
    params.mode === 'new' ? params.audioFilePath : null,
  );
  const [downloadingAudio, setDownloadingAudio] = useState(params.mode === 'saved');

  useEffect(() => {
    if (params.mode !== 'saved') return;
    const localPath = `${RNFS.CachesDirectoryPath}/histoire_bibliotheque_${Date.now()}.mp3`;
    RNFS.downloadFile({ fromUrl: params.audioUrl, toFile: localPath })
      .promise.then(() => {
        setResolvedAudioPath(localPath);
        setDownloadingAudio(false);
      })
      .catch(err => {
        console.error('Erreur téléchargement audio bibliothèque:', err);
        setDownloadingAudio(false);
        Alert.alert(t('msg_erreur_audio'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const soundRef = useRef<Sound | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressBarWidth = useRef(0);

  // Review modal state (uniquement en mode génération fraîche)
  const [showReviewModal, setShowReviewModal] = useState(
    params.mode === 'new' ? params.showReviewModal : false,
  );
  const [reviewTotal] = useState(params.mode === 'new' ? params.reviewTotal : 0);

  // Sauvegarde dans la bibliothèque (uniquement en mode génération fraîche)
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitReachedIsPremium, setLimitReachedIsPremium] = useState(false);

  const handleSave = async () => {
    if (params.mode !== 'new' || saving || saved || !resolvedAudioPath) return;
    setSaving(true);
    try {
      const audioBase64 = await RNFS.readFile(resolvedAudioPath, 'base64');
      const result = await sauvegarderHistoire({
        texte: histoireGeneree,
        audioBase64,
        age: params.age,
        ageLabel: params.ageLabel,
        sexe: params.sexe,
        genre: params.genre,
        moment: params.moment,
        dureeSecondes: params.dureeSecondes,
        langueId: params.langueId,
        voixId: params.voixId,
        description: params.description,
      });
      if (result.success) {
        setSaved(true);
      } else if (result.limitReached) {
        setLimitReachedIsPremium(!!result.isPremium);
        setShowLimitModal(true);
      } else {
        Alert.alert(t('msg_erreur_generale'));
      }
    } catch (error) {
      console.error('Erreur sauvegarde histoire:', error);
      Alert.alert(t('msg_erreur_generale'));
    } finally {
      setSaving(false);
    }
  };

  // Statut premium (zéro pub)
  const [isPremium, setIsPremium] = useState(false);
  useEffect(() => {
    chargerStatutPremium().then(setIsPremium);
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stop();
        soundRef.current.release();
        soundRef.current = null;
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startProgressTracking = (activeSound: Sound) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    progressInterval.current = setInterval(() => {
      activeSound.getCurrentTime(seconds => {
        setCurrentTime(seconds);
      });
    }, 500);
  };

  const handleSeek = (evt: any) => {
    if (!soundRef.current || duration <= 0) return;
    const x = evt.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / progressBarWidth.current));
    const seekTo = ratio * duration;
    soundRef.current.setCurrentTime(seekTo);
    setCurrentTime(seekTo);
  };

  const handlePlayPause = () => {
    if (!resolvedAudioPath) return;
    if (soundRef.current && isPlaying) {
      soundRef.current.pause();
      setIsPlaying(false);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    } else if (soundRef.current && !isPlaying) {
      soundRef.current.play(success => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
        if (!success) Alert.alert(t('msg_erreur_audio'));
      });
      setIsPlaying(true);
      startProgressTracking(soundRef.current);
    } else {
      // Première lecture
      const newSound = new Sound(resolvedAudioPath, '', error => {
        if (error) {
          console.error('Erreur chargement audio:', error);
          Alert.alert(t('msg_erreur_audio'));
          return;
        }
        soundRef.current = newSound;
        setDuration(newSound.getDuration());
        newSound.play(success => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
          }
          if (!success) Alert.alert(t('msg_erreur_audio'));
        });
        setIsPlaying(true);
        startProgressTracking(newSound);
      });
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <AnimatedBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={[styles.container, { paddingTop: insets.top + 16 }]}>

          {/* Bouton retour + sauvegarder */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← {t('recharge_back')}</Text>
            </TouchableOpacity>

            {params.mode === 'new' && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving || saved}>
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {saved ? t('library_saved') : t('library_save')}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Lecteur audio */}
          <View style={styles.audioContainer}>
            <TouchableOpacity
              style={[styles.btnEcouter, isPlaying ? styles.btnPause : styles.btnPlay]}
              onPress={handlePlayPause}
              disabled={downloadingAudio}>
              {downloadingAudio ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.btnEcouterText}>
                  {isPlaying ? t('btn_pause') : t('btn_ecouter')}
                </Text>
              )}
            </TouchableOpacity>

            {duration > 0 && (
              <View style={styles.seekBarWrapper}>
                <Text style={styles.seekTimeText}>{formatTime(currentTime)}</Text>
                <TouchableOpacity
                  activeOpacity={1}
                  style={styles.seekBarTouchable}
                  onLayout={e => { progressBarWidth.current = e.nativeEvent.layout.width; }}
                  onPress={handleSeek}>
                  <View style={styles.seekBarTrack}>
                    <View style={[styles.seekBarFill, { width: `${(currentTime / duration) * 100}%` }]} />
                    <View style={[styles.seekBarThumb, { left: `${(currentTime / duration) * 100}%` }]} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.seekTimeText}>-{formatTime(duration - currentTime)}</Text>
              </View>
            )}
          </View>

          {/* Pub bandeau */}
          <AdBanner isPremium={isPremium} />

          {/* Texte de l'histoire */}
          <View style={styles.resultCard}>
            <Text style={styles.resultText}>{histoireGeneree}</Text>
          </View>

        </View>
      </ScrollView>

      {/* Modal avis */}
      <CustomAlertModal
        visible={showReviewModal}
        icon="⭐"
        title={t('review_title')}
        message={t('review_message')}
        primaryButton={{
          text: t('review_yes'),
          onPress: () => { setShowReviewModal(false); onReviewResponse('yes', reviewTotal); },
        }}
        secondaryButton={{
          text: t('review_later'),
          onPress: () => { setShowReviewModal(false); onReviewResponse('later', reviewTotal); },
        }}
      />

      {/* Modal limite bibliothèque atteinte */}
      <CustomAlertModal
        visible={showLimitModal}
        icon="📚"
        title={t('library_limit_title')}
        message={limitReachedIsPremium ? t('library_limit_message_premium') : t('library_limit_message')}
        primaryButton={
          limitReachedIsPremium
            ? {
                text: t('library_limit_cta_premium'),
                onPress: () => { setShowLimitModal(false); navigation.navigate('Library'); },
              }
            : {
                text: t('library_limit_cta'),
                onPress: () => { setShowLimitModal(false); navigation.navigate('Recharge'); },
              }
        }
        secondaryButton={{
          text: 'OK',
          onPress: () => setShowLimitModal(false),
        }}
      />
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

  // Bouton retour
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 90,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: 'bold',
  },

  // Audio
  audioContainer: {
    marginBottom: 28,
  },
  btnEcouter: {
    width: '100%',
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  btnPlay: {
    backgroundColor: Colors.success,
  },
  btnPause: {
    backgroundColor: '#E65100',
  },
  btnEcouterText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  seekBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  seekTimeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
  seekBarTouchable: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 8,
  },
  seekBarTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    position: 'relative',
  },
  seekBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  seekBarThumb: {
    position: 'absolute',
    top: -5,
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },

  // Résultat
  resultCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 24,
  },
  resultText: {
    fontSize: 18,
    lineHeight: 30,
    color: Colors.textPrimary,
    fontFamily: 'serif',
  },
});