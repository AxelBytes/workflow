import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import ECLIPSE_THEME from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// Premium Glass Card Component
export const GlassCard: React.FC<{
  children: React.ReactNode;
  style?: any;
  intensity?: number;
}> = ({ children, style, intensity = 20 }) => {
  return (
    <BlurView intensity={intensity} style={[styles.glassCard, style]}>
      <LinearGradient
        colors={ECLIPSE_THEME.colors.glassGradient}
        style={styles.glassGradient}
      >
        {children}
      </LinearGradient>
    </BlurView>
  );
};

// Animated Button with Glow Effect
export const GlowButton: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}> = ({ title, onPress, variant = 'primary', size = 'md', disabled = false }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.glowButton, styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.buttonPrimary];
      case 'secondary':
        return [...baseStyle, styles.buttonSecondary];
      case 'ghost':
        return [...baseStyle, styles.buttonGhost];
      default:
        return baseStyle;
    }
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowOpacity,
              backgroundColor: ECLIPSE_THEME.colors.glow,
            },
          ]}
        />
        <LinearGradient
          colors={variant === 'primary' ? ECLIPSE_THEME.colors.primaryGradient : ['transparent', 'transparent']}
          style={styles.buttonGradient}
        >
          <Text style={[styles.buttonText, styles[`buttonText${variant.charAt(0).toUpperCase() + variant.slice(1)}`]]}>
            {title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Floating Action Button
export const FloatingActionButton: React.FC<{
  icon: React.ReactNode;
  onPress: () => void;
  position?: 'bottomRight' | 'bottomLeft' | 'topRight' | 'topLeft';
}> = ({ icon, onPress, position = 'bottomRight' }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.fab,
        styles[`fab${position.charAt(0).toUpperCase() + position.slice(1)}`],
        {
          transform: [{ scale: scaleAnim }, { rotate: rotation }],
        },
      ]}
    >
      <TouchableOpacity style={styles.fabButton} onPress={handlePress}>
        <LinearGradient
          colors={ECLIPSE_THEME.colors.primaryGradient}
          style={styles.fabGradient}
        >
          {icon}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Premium Header with Logo
export const PremiumHeader: React.FC<{
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
}> = ({ title, subtitle, showLogo = true }) => {
  return (
    <View style={styles.premiumHeader}>
      <LinearGradient
        colors={ECLIPSE_THEME.colors.darkGradient}
        style={styles.headerGradient}
      >
        {showLogo && (
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ECLIPSE</Text>
            <View style={styles.logoAccent}>
              <View style={styles.crescentMoon} />
            </View>
          </View>
        )}
        {title && <Text style={styles.headerTitle}>{title}</Text>}
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </LinearGradient>
    </View>
  );
};

// Animated Loading Spinner
export const LoadingSpinner: React.FC<{ size?: number; color?: string }> = ({ 
  size = 40, 
  color = ECLIPSE_THEME.colors.accent 
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.loadingSpinner,
        {
          width: size,
          height: size,
          borderColor: color,
          transform: [{ rotate: spin }],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  // Glass Card Styles
  glassCard: {
    borderRadius: ECLIPSE_THEME.borderRadius.xl,
    overflow: 'hidden',
    ...ECLIPSE_THEME.shadows.md,
  },
  glassGradient: {
    padding: ECLIPSE_THEME.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Glow Button Styles
  glowButton: {
    borderRadius: ECLIPSE_THEME.borderRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  buttonGradient: {
    paddingHorizontal: ECLIPSE_THEME.spacing.xl,
    paddingVertical: ECLIPSE_THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: ECLIPSE_THEME.borderRadius.full,
  },
  buttonText: {
    fontSize: ECLIPSE_THEME.typography.fontSize.base,
    fontWeight: ECLIPSE_THEME.typography.fontWeight.semibold,
    color: ECLIPSE_THEME.colors.textPrimary,
  },
  buttonPrimary: {
    backgroundColor: ECLIPSE_THEME.colors.accent,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: ECLIPSE_THEME.colors.accent,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonSm: {
    paddingHorizontal: ECLIPSE_THEME.spacing.lg,
    paddingVertical: ECLIPSE_THEME.spacing.sm,
  },
  buttonMd: {
    paddingHorizontal: ECLIPSE_THEME.spacing.xl,
    paddingVertical: ECLIPSE_THEME.spacing.md,
  },
  buttonLg: {
    paddingHorizontal: ECLIPSE_THEME.spacing['2xl'],
    paddingVertical: ECLIPSE_THEME.spacing.lg,
  },
  buttonTextPrimary: {
    color: ECLIPSE_THEME.colors.textPrimary,
  },
  buttonTextSecondary: {
    color: ECLIPSE_THEME.colors.accent,
  },
  buttonTextGhost: {
    color: ECLIPSE_THEME.colors.textSecondary,
  },

  // FAB Styles
  fab: {
    position: 'absolute',
    zIndex: 1000,
  },
  fabBottomRight: {
    bottom: ECLIPSE_THEME.spacing.xl,
    right: ECLIPSE_THEME.spacing.xl,
  },
  fabBottomLeft: {
    bottom: ECLIPSE_THEME.spacing.xl,
    left: ECLIPSE_THEME.spacing.xl,
  },
  fabTopRight: {
    top: ECLIPSE_THEME.spacing.xl,
    right: ECLIPSE_THEME.spacing.xl,
  },
  fabTopLeft: {
    top: ECLIPSE_THEME.spacing.xl,
    left: ECLIPSE_THEME.spacing.xl,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    ...ECLIPSE_THEME.shadows.glow,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Premium Header Styles
  premiumHeader: {
    paddingTop: ECLIPSE_THEME.spacing.xl,
    paddingBottom: ECLIPSE_THEME.spacing.lg,
  },
  headerGradient: {
    paddingHorizontal: ECLIPSE_THEME.spacing.lg,
    paddingVertical: ECLIPSE_THEME.spacing.xl,
    borderRadius: ECLIPSE_THEME.borderRadius.xl,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ECLIPSE_THEME.spacing.md,
  },
  logoText: {
    fontSize: ECLIPSE_THEME.typography.fontSize['3xl'],
    fontWeight: ECLIPSE_THEME.typography.fontWeight.extrabold,
    color: ECLIPSE_THEME.colors.textPrimary,
    letterSpacing: 2,
  },
  logoAccent: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: ECLIPSE_THEME.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: ECLIPSE_THEME.spacing.sm,
  },
  crescentMoon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ECLIPSE_THEME.colors.accent,
    transform: [{ scaleX: 0.6 }],
  },
  headerTitle: {
    fontSize: ECLIPSE_THEME.typography.fontSize['2xl'],
    fontWeight: ECLIPSE_THEME.typography.fontWeight.bold,
    color: ECLIPSE_THEME.colors.textPrimary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: ECLIPSE_THEME.typography.fontSize.base,
    color: ECLIPSE_THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: ECLIPSE_THEME.spacing.sm,
  },

  // Loading Spinner Styles
  loadingSpinner: {
    borderWidth: 3,
    borderTopColor: 'transparent',
    borderRadius: ECLIPSE_THEME.borderRadius.full,
  },
});

export default {
  GlassCard,
  GlowButton,
  FloatingActionButton,
  PremiumHeader,
  LoadingSpinner,
}; 