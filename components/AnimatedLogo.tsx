import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Easing } from 'react-native';

interface AnimatedLogoProps {
  size?: number;
}

export default function AnimatedLogo({ size = 120 }: AnimatedLogoProps) {
  const fillAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación infinita: llenar y vaciar
    const animation = Animated.loop(
      Animated.sequence([
        // Llenar de abajo hacia arriba
        Animated.timing(fillAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        // Pausa
        Animated.delay(300),
        // Vaciar de arriba hacia abajo
        Animated.timing(fillAnimation, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        // Pausa
        Animated.delay(300),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, []);

  const fillHeight = fillAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Logo gris (base) */}
      <Image
        source={require('../assets/images/LogoSplashScreen.png')}
        style={[styles.logo, { width: size, height: size }, styles.logoGray]}
        resizeMode="contain"
      />

      {/* Logo a color (se llena y vacía) */}
      <Animated.View 
        style={[
          styles.colorMask, 
          { 
            height: fillHeight,
            width: size,
          }
        ]}
      >
        <Image
          source={require('../assets/images/LogoSplashScreen.png')}
          style={[styles.logo, styles.logoColor, { width: size, height: size }]}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  logo: {
    position: 'absolute',
  },
  logoGray: {
    opacity: 0.2,
  },
  colorMask: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  logoColor: {
    bottom: 0,
    left: 0,
  },
});

