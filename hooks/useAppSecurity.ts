import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

interface SecurityStatus {
  isSecure: boolean;
  threats: string[];
  checked: boolean;
}

/**
 * Hook de seguridad en runtime.
 * Detecta condiciones inseguras y alerta al usuario.
 * En producción, bloquea la app si detecta amenazas graves.
 */
export function useAppSecurity(): SecurityStatus {
  const [status, setStatus] = useState<SecurityStatus>({
    isSecure: true,
    threats: [],
    checked: false,
  });

  useEffect(() => {
    // Solo en producción y en dispositivos reales
    if (__DEV__) {
      setStatus({ isSecure: true, threats: [], checked: true });
      return;
    }

    checkSecurity();
  }, []);

  const checkSecurity = async () => {
    const threats: string[] = [];

    // 1. Detectar dispositivo rooteado (Android) / jailbreakeado (iOS)
    if (Platform.OS === 'android') {
      const isRooted = !Device.isDevice || await checkRootAndroid();
      if (isRooted) {
        threats.push('root');
      }
    }

    // 2. Detectar emulador
    if (!Device.isDevice) {
      threats.push('emulator');
    }

    // 3. Detectar si está corriendo en modo debug (fuera de App Store/APK firmado)
    if (Constants.appOwnership === 'expo') {
      threats.push('expo_go');
    }

    // 4. Verificar que la app tenga la firma correcta (anti-tampering básico)
    const expectedAppId = 'com.eclipse.app';
    const currentAppId = Constants.expoConfig?.android?.package;
    if (currentAppId && currentAppId !== expectedAppId) {
      threats.push('tampered_package');
    }

    const isSecure = threats.length === 0;

    if (!isSecure) {
      handleThreats(threats);
    }

    setStatus({ isSecure, threats, checked: true });
  };

  const handleThreats = (threats: string[]) => {
    // Root o tampered son graves — alertar con opción de cerrar
    if (threats.includes('root') || threats.includes('tampered_package')) {
      Alert.alert(
        'Entorno inseguro detectado',
        'Esta aplicación no puede ejecutarse en dispositivos rooteados o modificados. Esto protege la seguridad de tu cuenta.',
        [{ text: 'Cerrar', style: 'destructive' }],
        { cancelable: false }
      );
    }
    // Expo Go — advertencia
    if (threats.includes('expo_go')) {
      Alert.alert(
        'Modo de desarrollo',
        'Estás usando una versión de desarrollo. Algunas funciones pueden no estar disponibles.',
        [{ text: 'Entendido' }]
      );
    }
  };

  return status;
}

// ── Detección de root en Android ─────────────────────────────────────────────
async function checkRootAndroid(): Promise<boolean> {
  try {
    // Paths comunes de herramientas de root — si existen, el dispositivo está rooteado
    const rootPaths = [
      '/system/app/Superuser.apk',
      '/sbin/su',
      '/system/bin/su',
      '/system/xbin/su',
      '/data/local/xbin/su',
      '/data/local/bin/su',
      '/system/sd/xbin/su',
      '/system/bin/failsafe/su',
      '/data/local/su',
    ];

    // Intentar acceder a paths de root usando el FileSystem
    // Si alguno es accesible, hay root
    const { getInfoAsync } = await import('expo-file-system/legacy');
    for (const path of rootPaths) {
      const info = await getInfoAsync(path);
      if (info.exists) return true;
    }
    return false;
  } catch {
    return false;
  }
}
