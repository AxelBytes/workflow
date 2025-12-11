import React, { useEffect, useRef, useMemo } from 'react';
import { View, Image, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = 160;
const NUM_LINES = 20; // Más líneas para efecto más lleno

interface SplashScreenProps {
  onFinish: () => void;
}

// Componente para cada línea animada
const AnimatedLine = ({ 
  delay, 
  duration, 
  startX, 
  lineWidth, 
  lineHeight,
  opacity 
}: {
  delay: number;
  duration: number;
  startX: number;
  lineWidth: number;
  lineHeight: number;
  opacity: number;
}) => {
  const translateY = useRef(new Animated.Value(height + 100)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, {
          toValue: -lineHeight - 100,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: height + 100,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.line,
        {
          left: startX,
          width: lineWidth,
          height: lineHeight,
          opacity: opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fillAnimation = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  // Generar líneas aleatorias - más naranjas y visibles
  const lines = useMemo(() => {
    return Array.from({ length: NUM_LINES }, (_, i) => ({
      id: i,
      delay: Math.random() * 1500, // Delay aleatorio 0-1.5s
      duration: 2000 + Math.random() * 2500, // Duración 2-4.5s (más rápido)
      startX: Math.random() * width, // Posición X aleatoria
      lineWidth: 3 + Math.random() * 5, // Ancho 3-8px
      lineHeight: 80 + Math.random() * 180, // Alto 80-260px
      opacity: 0.5 + Math.random() * 0.5, // Opacidad 0.5-1.0 (bien naranjas)
    }));
  }, []);

  useEffect(() => {
    Animated.sequence([
      // Llenado lento de 6 segundos
      Animated.timing(fillAnimation, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: false,
      }),
      // Pausa breve
      Animated.delay(300),
      // Fade out
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const fillHeight = fillAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, LOGO_SIZE],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      {/* Fondo blanco */}
      <View style={styles.background} />

      {/* Líneas animadas naranjas */}
      {lines.map((line) => (
        <AnimatedLine
          key={line.id}
          delay={line.delay}
          duration={line.duration}
          startX={line.startX}
          lineWidth={line.lineWidth}
          lineHeight={line.lineHeight}
          opacity={line.opacity}
        />
      ))}

      {/* Logo Container */}
      <View style={styles.logoContainer}>
        {/* Logo gris (base) */}
        <Image
          source={require('../assets/images/LogoSplashScreen.png')}
          style={[styles.logo, styles.logoGray]}
          resizeMode="contain"
        />

        {/* Logo a color (se llena de abajo hacia arriba) */}
        <Animated.View style={[styles.colorMask, { height: fillHeight }]}>
          <Image
            source={require('../assets/images/LogoSplashScreen.png')}
            style={[styles.logo, styles.logoColor]}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  line: {
    position: 'absolute',
    backgroundColor: '#F97316', // Naranja Eclipse intenso
    borderRadius: 4,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    zIndex: 10, // Logo encima de las líneas
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  logoGray: {
    position: 'absolute',
    opacity: 0.15,
  },
  colorMask: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: LOGO_SIZE,
    overflow: 'hidden',
  },
  logoColor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
});
