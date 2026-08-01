import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Colors } from '../theme/colors';

interface BookLoadingModalProps {
  visible: boolean;
  message?: string;
}

export default function BookLoadingModal({ visible, message = 'Chargement en cours...' }: BookLoadingModalProps) {
  const page1Rotate = useRef(new Animated.Value(0)).current;
  const page2Rotate = useRef(new Animated.Value(0)).current;
  const bookScale = useRef(new Animated.Value(0.8)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Entrée avec scale
    Animated.spring(bookScale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Animation des pages qui tournent
    const pageAnimation = () => {
      Animated.loop(
        Animated.sequence([
          // Page 1 tourne
          Animated.timing(page1Rotate, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(200),
          // Page 1 revient
          Animated.timing(page1Rotate, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          // Page 2 tourne
          Animated.timing(page2Rotate, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(200),
          // Page 2 revient
          Animated.timing(page2Rotate, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    // Points animés
    Animated.loop(
      Animated.timing(dotsAnim, {
        toValue: 3,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ).start();

    pageAnimation();

    return () => {
      page1Rotate.setValue(0);
      page2Rotate.setValue(0);
      bookScale.setValue(0.8);
      dotsAnim.setValue(0);
    };
  }, [visible]);

  const page1RotateInterp = page1Rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-160deg'],
  });

  const page2RotateInterp = page2Rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-160deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContent, { transform: [{ scale: bookScale }] }]}>
          {/* Livre */}
          <View style={styles.bookContainer}>
            {/* Couverture arrière */}
            <View style={styles.bookBack} />

            {/* Pages statiques */}
            <View style={[styles.page, styles.pageStatic1]} />
            <View style={[styles.page, styles.pageStatic2]} />

            {/* Page 2 animée */}
            <Animated.View
              style={[
                styles.page,
                styles.pageAnimated,
                {
                  transform: [
                    { perspective: 800 },
                    { rotateY: page2RotateInterp },
                  ],
                },
              ]}
            >
              <View style={styles.pageLine} />
              <View style={[styles.pageLine, { width: '70%' }]} />
              <View style={[styles.pageLine, { width: '85%' }]} />
            </Animated.View>

            {/* Page 1 animée (dessus) */}
            <Animated.View
              style={[
                styles.page,
                styles.pageAnimated,
                {
                  transform: [
                    { perspective: 800 },
                    { rotateY: page1RotateInterp },
                  ],
                },
              ]}
            >
              <View style={styles.pageLine} />
              <View style={[styles.pageLine, { width: '60%' }]} />
              <View style={[styles.pageLine, { width: '90%' }]} />
              <View style={[styles.pageLine, { width: '45%' }]} />
            </Animated.View>

            {/* Couverture avant */}
            <View style={styles.bookFront}>
              <Text style={styles.bookEmoji}>📖</Text>
            </View>
          </View>

          {/* Texte */}
          <Text style={styles.loadingText}>{message}</Text>

          {/* Points animés */}
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map(i => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    opacity: dotsAnim.interpolate({
                      inputRange: [i, i + 0.5, i + 1],
                      outputRange: [0.3, 1, 0.3],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 31, 80, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 28,
    padding: 40,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    minWidth: 220,
  },
  bookContainer: {
    width: 80,
    height: 100,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBack: {
    position: 'absolute',
    width: 70,
    height: 90,
    backgroundColor: '#5E35B1',
    borderRadius: 4,
    left: 8,
  },
  page: {
    position: 'absolute',
    width: 62,
    height: 82,
    backgroundColor: '#FEFEFE',
    borderRadius: 2,
    left: 12,
    padding: 8,
  },
  pageStatic1: {
    top: 6,
    backgroundColor: '#F5F0FF',
  },
  pageStatic2: {
    top: 4,
    backgroundColor: '#FAF8FF',
  },
  pageAnimated: {
    top: 2,
    transformOrigin: 'left center',
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pageLine: {
    height: 3,
    backgroundColor: '#E0D8F0',
    borderRadius: 1.5,
    marginBottom: 6,
    width: '80%',
  },
  bookFront: {
    position: 'absolute',
    width: 70,
    height: 90,
    backgroundColor: '#7E57C2',
    borderRadius: 4,
    left: 8,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  bookEmoji: {
    fontSize: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
});
