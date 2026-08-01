import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import AnimatedBackground from '../components/AnimatedBackground';
import { signInWithGoogle } from '../services/authService';
import { verifierUtilisateurSupabase } from '../services/supabaseService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      await signInWithGoogle();

      // Sync avec Supabase
      await verifierUtilisateurSupabase();

      // Naviguer vers Main
      navigation.replace('Main');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        t('error_google_login'),
        error.message || 'Unknown error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <AnimatedBackground />
      <Text style={styles.title}>{t('login_title')}</Text>

      <TouchableOpacity
        style={styles.btnLogin}
        onPress={handleGoogleLogin}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#757575" />
        ) : (
          <>
            <Image
              source={require('../assets/google_logo.png')}
              style={styles.providerIcon}
            />
            <Text style={styles.btnLoginText}>{t('btn_google_login')}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D2D2D',
    marginBottom: 40,
  },
  btnLogin: {
    width: '90%',
    height: 56,
    backgroundColor: Colors.white,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  providerIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  btnLoginText: {
    color: '#757575',
    fontSize: 16,
  },
});
