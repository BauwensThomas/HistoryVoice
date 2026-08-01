import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Config } from '../config';
import AnimatedBackground from '../components/AnimatedBackground';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getSession } from '../services/authService';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const year = new Date().getFullYear();

  const handleEntrer = async () => {
    const session = await getSession();
    if (session) {
      navigation.replace('Main');
    } else {
      navigation.navigate('Login');
    }
  };

  const handleContact = () => {
    const subject = encodeURIComponent(t('email_subject'));
    const url = `mailto:${Config.CONTACT_EMAIL}?subject=${subject}`;
    Linking.openURL(url).catch(err =>
      console.error('Could not open email client', err),
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <AnimatedBackground />
      {/* Contenu centré */}
      <View style={styles.centerContent}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>{t('app_name_titre')}</Text>

        <TouchableOpacity style={styles.btnEntrer} onPress={handleEntrer}>
          <Text style={styles.btnEntrerText}>{t('btn_entrer_atelier')}</Text>
        </TouchableOpacity>

        <Text style={styles.description}>{t('home_description')}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => Linking.openURL(Config.WEBSITE_URL)}>
            <Text style={styles.footerLink}>{t('website_link')}</Text>
          </TouchableOpacity>
          <Text style={styles.footerSeparator}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(Config.PRIVACY_URL)}>
            <Text style={styles.footerLink}>{t('privacy_link')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.copyrightText}>
          {t('copyright_text', { year })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 32,
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  btnEntrer: {
    width: '100%',
    height: 64,
    backgroundColor: Colors.primary,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 48,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  btnEntrerText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    marginTop: 24,
    fontSize: 20,
    color: '#4A3B75',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 28,
    paddingHorizontal: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 12,
  },
  footerSeparator: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  copyrightText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
