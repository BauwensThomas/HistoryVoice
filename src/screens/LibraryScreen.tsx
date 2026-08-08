import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme/colors';
import AnimatedBackground from '../components/AnimatedBackground';
import CustomAlertModal from '../components/CustomAlertModal';
import AdBanner from '../components/AdBanner';
import TrashIcon from '../components/icons/TrashIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chargerStatutPremium } from '../services/supabaseService';
import { listerHistoires, supprimerHistoire, SavedStory } from '../services/storyLibraryService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const FREE_TIER_LIMIT = 3;
const PREMIUM_TIER_LIMIT = 20;

type LibraryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Library'>;
};

export default function LibraryScreen({ navigation }: LibraryScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [premium, list] = await Promise.all([
      chargerStatutPremium(),
      listerHistoires(),
    ]);
    setIsPremium(premium);
    setStories(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const handleOpen = (story: SavedStory) => {
    if (!story.audioUrl) return;
    navigation.navigate('Story', {
      mode: 'saved',
      histoireGeneree: story.texte,
      audioUrl: story.audioUrl,
    });
  };

  const handleDelete = async (id: number) => {
    setConfirmDeleteId(null);
    setDeletingId(id);
    const success = await supprimerHistoire(id);
    if (success) {
      setStories(prev => prev.filter(s => s.id !== id));
    }
    setDeletingId(null);
  };

  const formatDuree = (secondes?: number): string => {
    if (!secondes) return '';
    const mins = Math.floor(secondes / 60);
    const secs = secondes % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleDateString();
  };

  return (
    <View style={styles.screenWrapper}>
      <AnimatedBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}>

        {/* Bouton retour */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{t('recharge_back')}</Text>
        </TouchableOpacity>

        {/* Titre */}
        <Text style={styles.title}>{t('library_title')}</Text>
        <Text style={styles.subtitle}>
          {t('library_count', {
            count: stories.length,
            limit: isPremium ? PREMIUM_TIER_LIMIT : FREE_TIER_LIMIT,
          })}
        </Text>

        {!isPremium && (
          <View style={styles.premiumPromo}>
            <Text style={styles.premiumPromoText}>{t('library_premium_promo')}</Text>
            <TouchableOpacity
              style={styles.premiumPromoButton}
              onPress={() => navigation.navigate('Recharge')}>
              <Text style={styles.premiumPromoButtonText}>{t('library_limit_cta')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : stories.length === 0 ? (
          <Text style={styles.emptyText}>{t('library_empty')}</Text>
        ) : (
          <View style={styles.storiesContainer}>
            {stories.map(story => (
              <TouchableOpacity
                key={story.id}
                style={styles.storyCard}
                onPress={() => handleOpen(story)}
                disabled={deletingId === story.id}>
                <View style={styles.storyCardHeader}>
                  <Text style={styles.storyGenre}>{story.genre}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => setConfirmDeleteId(story.id)}
                    disabled={deletingId === story.id}>
                    {deletingId === story.id ? (
                      <ActivityIndicator size="small" color={Colors.error} />
                    ) : (
                      <TrashIcon size={18} color={Colors.error} />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.storyMeta}>
                  {story.ageLabel} · {story.moment} · {formatDuree(story.dureeSecondes)}
                </Text>
                <Text style={styles.storyDate}>{formatDate(story.createdAt)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Pub bandeau */}
        <View style={styles.adWrapper}>
          <AdBanner isPremium={isPremium} />
        </View>
      </ScrollView>

      {/* Confirmation suppression */}
      <CustomAlertModal
        visible={confirmDeleteId !== null}
        icon={<TrashIcon size={36} color={Colors.error} />}
        title={t('library_delete_title')}
        message={t('library_delete_confirm')}
        primaryButton={{
          text: t('library_delete'),
          onPress: () => confirmDeleteId !== null && handleDelete(confirmDeleteId),
        }}
        secondaryButton={{
          text: 'OK',
          onPress: () => setConfirmDeleteId(null),
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
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  premiumPromo: {
    backgroundColor: Colors.magicPurpleLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumPromoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    marginRight: 10,
  },
  premiumPromoButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  premiumPromoButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  adWrapper: {
    marginTop: 32,
  },
  storiesContainer: {
    gap: 12,
  },
  storyCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  storyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyGenre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  deleteButton: {
    padding: 4,
  },
  storyMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  storyDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    opacity: 0.7,
  },
});
