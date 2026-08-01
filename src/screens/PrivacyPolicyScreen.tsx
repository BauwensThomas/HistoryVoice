import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme/colors';
import AnimatedBackground from '../components/AnimatedBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type PrivacyPolicyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;
};

// Rend le texte avec les emails cliquables en bleu
function RichText({ text }: { text: string }) {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const parts = text.split(emailRegex);

  return (
    <Text style={styles.sectionContent}>
      {parts.map((part, i) =>
        emailRegex.test(part) ? (
          <Text
            key={i}
            style={styles.emailLink}
            onPress={() => Linking.openURL(`mailto:${part}`)}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
}

export default function PrivacyPolicyScreen({ navigation }: PrivacyPolicyScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const sections = t('privacy_sections', { returnObjects: true }) as {
    title: string;
    content: string;
  }[];

  return (
    <View style={styles.screenWrapper}>
      <AnimatedBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{t('privacy_back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('privacy_title')}</Text>
        <Text style={styles.lastUpdated}>{t('privacy_last_updated')}</Text>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <RichText text={section.content} />
          </View>
        ))}
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
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emailLink: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
});
