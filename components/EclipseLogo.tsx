import { View, Text, StyleSheet, Image } from 'react-native';

interface EclipseLogoProps {
  size?: 'small' | 'medium' | 'large';
  showAppText?: boolean;
}

const COLORS = {
  orange: '#F97316',
};

export default function EclipseLogo({ size = 'medium', showAppText = true }: EclipseLogoProps) {
  const sizes = {
    small: { width: 90, height: 36, appFont: 12 },
    medium: { width: 120, height: 70, appFont: 18 },
    large: { width: 180, height: 90, appFont: 24 },
  };

  const s = sizes[size];

  return (
    <View style={styles.container}>
      {/* Logo imagen */}
      <Image
        source={require('../assets/images/LogoSplashScreen.png')}
        style={{ width: s.height, height: s.height }}
        resizeMode="contain"
      />
      
      {/* App text */}
      {showAppText && (
        <Text style={[styles.appText, { fontSize: s.appFont }]}>App</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appText: {
    fontWeight: '500',
    color: COLORS.orange,
    marginLeft: 6,
  },
});
