import React from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNIT_BANNER } from '../config/adsConfig';

interface AdBannerProps {
  isPremium: boolean;
}

/**
 * Bannière publicitaire, masquée pour les utilisateurs premium (zéro pub).
 */
export default function AdBanner({ isPremium }: AdBannerProps) {
  if (isPremium) return null;

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <BannerAd
        unitId={AD_UNIT_BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </View>
  );
}
