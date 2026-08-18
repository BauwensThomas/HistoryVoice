import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme/colors';
import AnimatedBackground from '../components/AnimatedBackground';
import UpdateIcon from '../components/icons/UpdateIcon';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.historyvoice';

export default function UpdateRequiredScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <UpdateIcon size={56} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{t('update_required_title')}</Text>
        <Text style={styles.message}>{t('update_required_message')}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openURL(PLAY_STORE_URL)}>
          <Text style={styles.buttonText}>{t('update_required_cta')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrapper: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 28,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
