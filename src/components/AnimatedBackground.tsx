import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PARTICLE_COUNT = 15;
const STAR_COUNT = 3;

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  size: number;
}

interface ShootingStar {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  width: Animated.Value;
}

function createParticle(): Particle {
  return {
    x: new Animated.Value(Math.random() * SCREEN_WIDTH),
    y: new Animated.Value(SCREEN_HEIGHT + 20),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.3 + Math.random() * 0.7),
    size: 6 + Math.random() * 10,
  };
}

function createShootingStar(): ShootingStar {
  return {
    x: new Animated.Value(-50),
    y: new Animated.Value(Math.random() * SCREEN_HEIGHT * 0.4),
    opacity: new Animated.Value(0),
    width: new Animated.Value(0),
  };
}

function animateParticle(p: Particle) {
  const startX = Math.random() * SCREEN_WIDTH;
  const drift = (Math.random() - 0.5) * 80;
  const duration = 6000 + Math.random() * 8000;
  const delay = Math.random() * 5000;

  p.x.setValue(startX);
  p.y.setValue(SCREEN_HEIGHT + 20);
  p.opacity.setValue(0);

  Animated.sequence([
    Animated.delay(delay),
    Animated.parallel([
      Animated.timing(p.y, {
        toValue: -30,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(p.x, {
        toValue: startX + drift,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(p.opacity, {
          toValue: 0.6 + Math.random() * 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.delay(duration - 3000),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ]),
  ]).start(() => animateParticle(p));
}

function animateShootingStar(star: ShootingStar) {
  const delay = 4000 + Math.random() * 12000;
  const startY = Math.random() * SCREEN_HEIGHT * 0.35;
  const duration = 800 + Math.random() * 600;

  star.x.setValue(-50);
  star.y.setValue(startY);
  star.opacity.setValue(0);
  star.width.setValue(0);

  Animated.sequence([
    Animated.delay(delay),
    Animated.parallel([
      Animated.timing(star.x, {
        toValue: SCREEN_WIDTH + 100,
        duration,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(star.y, {
        toValue: startY + 80 + Math.random() * 60,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(star.opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.delay(duration - 400),
        Animated.timing(star.opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]),
  ]).start(() => animateShootingStar(star));
}

export default function AnimatedBackground() {
  const particles = useRef<Particle[]>(
    Array.from({ length: PARTICLE_COUNT }, createParticle),
  ).current;

  const shootingStars = useRef<ShootingStar[]>(
    Array.from({ length: STAR_COUNT }, createShootingStar),
  ).current;

  useEffect(() => {
    particles.forEach(p => animateParticle(p));
    shootingStars.forEach(s => animateShootingStar(s));
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Particules violettes */}
      {particles.map((p, i) => (
        <Animated.View
          key={`p-${i}`}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              opacity: p.opacity,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale },
              ],
            },
          ]}
        />
      ))}

      {/* Étoiles filantes */}
      {shootingStars.map((s, i) => (
        <Animated.View
          key={`s-${i}`}
          style={[
            styles.shootingStar,
            {
              opacity: s.opacity,
              transform: [
                { translateX: s.x },
                { translateY: s.y },
                { rotate: '25deg' },
              ],
            },
          ]}
        >
          {/* Corps de l'étoile */}
          <View style={styles.starHead} />
          {/* Traînée */}
          <View style={styles.starTail} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#9C7CF4',
    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  shootingStar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  starHead: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#E1BEE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  starTail: {
    width: 40,
    height: 2,
    borderRadius: 1,
    marginLeft: -2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    // gradient effect via opacity
    opacity: 0.7,
  },
});
