import React, { useState, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type RechargeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Recharge'>;
};

// Définition des packs avec les IDs produits Google Play
const PACKS = [
  {
    id: 'starter_10min',
    minutes: 10,
    priceKey: 'recharge_price_starter',
    nameKey: 'recharge_pack_starter',
    color: '#4CAF50',
  },
  {
    id: 'standard_25min',
    minutes: 25,
    priceKey: 'recharge_price_standard',
    nameKey: 'recharge_pack_standard',
    color: '#2196F3',
    popular: true,
  },
  {
    id: 'premium_60min',
    minutes: 60,
    priceKey: 'recharge_price_premium',
    nameKey: 'recharge_pack_premium',
    color: '#9C27B0',
  },
];

export default function RechargeScreen({ navigation }: RechargeScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Charger les offres RevenueCat
  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoading(true);
      const offerings = await Purchases.getOfferings();
      if (offerings.current?.availablePackages) {
        setPackages(offerings.current.availablePackages);
      }
    } catch (error) {
      console.error('[RevenueCat] Erreur chargement offres:', error);
    } finally {
      setLoading(false);
    }
  };

  // Trouver le prix réel depuis RevenueCat, sinon afficher le prix par défaut
  const getPrice = (packId: string, fallbackKey: string): string => {
    const pkg = packages.find(p => p.product.identifier === packId);
    return pkg?.product.priceString ?? t(fallbackKey);
  };

  const handlePurchase = async (packId: string) => {
    const pkg = packages.find(p => p.product.identifier === packId);
    if (!pkg) {
      setErrorMessage(t('recharge_error_unavailable'));
      setShowErrorModal(true);
      return;
    }

    try {
      setPurchasing(packId);
      await Purchases.purchasePackage(pkg);

      // Achat réussi — les crédits sont ajoutés par le webhook RevenueCat (handle-payment)
      // Pas d'appel direct pour éviter toute manipulation côté client
      setShowSuccessModal(true);
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('[RevenueCat] Erreur achat:', error);
        setErrorMessage(t('recharge_error_purchase'));
        setShowErrorModal(true);
      }
    } finally {
      setPurchasing(null);
    }
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{t('recharge_back')}</Text>
        </TouchableOpacity>

        {/* Titre */}
        <Text style={styles.title}>{t('recharge_title')}</Text>
        <Text style={styles.subtitle}>{t('recharge_subtitle')}</Text>

        {/* Packs */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.packsContainer}>
            {PACKS.map(pack => (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.packCard,
                  pack.popular && styles.packCardPopular,
                  { borderColor: pack.color },
                ]}
                onPress={() => handlePurchase(pack.id)}
                disabled={purchasing !== null}>

                {pack.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: pack.color }]}>
                    <Text style={styles.popularText}>{t('recharge_popular')}</Text>
                  </View>
                )}

                <Text style={[styles.packName, { color: pack.color }]}>
                  {t(pack.nameKey)}
                </Text>

                <Text style={styles.packMinutes}>
                  {pack.minutes} {t('recharge_minutes')}
                </Text>

                <Text style={[styles.packPrice, { color: pack.color }]}>
                  {getPrice(pack.id, pack.priceKey)}
                </Text>

                {purchasing === pack.id ? (
                  <ActivityIndicator size="small" color={pack.color} style={{ marginTop: 12 }} />
                ) : (
                  <View style={[styles.buyButton, { backgroundColor: pack.color }]}>
                    <Text style={styles.buyButtonText}>{t('recharge_buy')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Info */}
        <Text style={styles.infoText}>{t('recharge_info')}</Text>
      </ScrollView>

      <CustomAlertModal
        visible={showSuccessModal}
        icon="✅"
        title={t('recharge_success_title')}
        message={t('recharge_success_message')}
        primaryButton={{
          text: 'OK',
          onPress: () => {
            setShowSuccessModal(false);
            navigation.goBack();
          },
        }}
      />

      <CustomAlertModal
        visible={showErrorModal}
        icon="⚠️"
        title={t('recharge_error_title')}
        message={errorMessage}
        primaryButton={{
          text: 'OK',
          onPress: () => setShowErrorModal(false),
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
  packsContainer: {
    gap: 16,
  },
  packCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 2,
    padding: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  packCardPopular: {
    elevation: 6,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  packName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  packMinutes: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  packPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 1,
  },
  buyButton: {
    marginTop: 6,
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: 16,
  },
  buyButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
