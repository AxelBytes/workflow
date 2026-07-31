import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Clipboard,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { ArrowLeft, RefreshCw, Copy, CheckCircle, WifiOff } from 'lucide-react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || '';

const COLORS = {
  orange: '#F97316',
  black: '#1a1a1a',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
};

interface TokenData {
  token: string;
  expiresAt: string;
  ttlMinutes: number;
}

export default function QrTokenScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  // Detectar estado de red
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
    });
    return () => unsubscribe();
  }, []);

  // UID del usuario como QR estático de respaldo. Se genera 100% localmente
  // (react-native-qrcode-svg) para que funcione realmente sin internet; antes
  // se pedía la imagen a una API externa, lo cual rompía el propósito del
  // modo offline y además usaba un <img> de HTML que no existe en RN nativo.
  const staticQrValue = auth.currentUser?.uid || user?.uid || '';

  const generateToken = useCallback(async () => {
    if (!user || !isOnline) return;
    setLoading(true);
    setTokenData(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('No se pudo obtener token de autenticación');

      const response = await fetch(`${WEB_URL}/api/customers/qr-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al generar token');
      }

      const data: TokenData = await response.json();
      setTokenData(data);

      const expiry = new Date(data.expiresAt);
      setSecondsLeft(Math.floor((expiry.getTime() - Date.now()) / 1000));

    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo generar el código');
    } finally {
      setLoading(false);
    }
  }, [user, isOnline]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(interval); setTokenData(null); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const handleCopy = async () => {
    if (!tokenData) return;
    Clipboard.setString(tokenData.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Código QR</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>Debés iniciar sesión para usar esta función</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Código en Caja</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Banner sin conexión */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={18} color={COLORS.amber} />
          <Text style={styles.offlineBannerText}>Sin internet — mostrando QR de respaldo</Text>
        </View>
      )}

      <View style={styles.content}>

        {/* ── MODO OFFLINE: QR estático basado en UID ──────────────────── */}
        {!isOnline && (
          <>
            <View style={styles.offlineCard}>
              <Text style={styles.offlineTitle}>🔒 QR de Respaldo</Text>
              <Text style={styles.offlineSubtitle}>
                Este código identifica tu cuenta. El cajero puede escanearlo para cargarte puntos aunque no tengas internet.
              </Text>
              {staticQrValue ? (
                <View style={styles.staticQrImageWrapper}>
                  <QRCode value={`UID:${staticQrValue}`} size={200} ecl="L" />
                </View>
              ) : null}
              <View style={styles.staticQrBox}>
                <Text style={styles.staticQrLabel}>ID de cuenta</Text>
                <Text style={styles.staticQrValue} numberOfLines={1} ellipsizeMode="middle">
                  {staticQrValue.slice(0, 8)}…{staticQrValue.slice(-6)}
                </Text>
              </View>
              <Text style={styles.offlineNote}>
                Este QR es permanente y único de tu cuenta.{'\n'}
                Mostráselo al cajero cuando no tengas señal.
              </Text>
            </View>
          </>
        )}

        {/* ── MODO ONLINE: QR dinámico con TTL ──────────────────────────── */}
        {isOnline && (
          <>
            <Text style={styles.subtitle}>
              Mostrá este código al cajero para que te identifique y cargue tus puntos
            </Text>

            {loading && (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.orange} />
                <Text style={styles.loadingText}>Generando código...</Text>
              </View>
            )}

            {!loading && !tokenData && (
              <View style={styles.center}>
                <TouchableOpacity style={styles.generateButton} onPress={generateToken}>
                  <RefreshCw size={24} color={COLORS.white} />
                  <Text style={styles.generateButtonText}>Generar Código</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && tokenData && (
              <View style={styles.tokenContainer}>
                <View style={styles.tokenBox}>
                  <Text style={styles.tokenText}>{tokenData.token}</Text>
                </View>

                <View style={[
                  styles.timerContainer,
                  secondsLeft < 60 && styles.timerWarning,
                ]}>
                  <Text style={styles.timerText}>
                    Vence en {formatSeconds(secondsLeft)}
                  </Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                    {copied
                      ? <CheckCircle size={20} color={COLORS.green} />
                      : <Copy size={20} color={COLORS.orange} />
                    }
                    <Text style={[styles.copyButtonText, copied && { color: COLORS.green }]}>
                      {copied ? 'Copiado' : 'Copiar'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.refreshButton} onPress={generateToken}>
                    <RefreshCw size={20} color={COLORS.gray} />
                    <Text style={styles.refreshButtonText}>Nuevo código</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
          <Text style={styles.infoText}>1. Generá el código antes de pagar en caja</Text>
          <Text style={styles.infoText}>2. Mostráselo al cajero (tiene 5 minutos)</Text>
          <Text style={styles.infoText}>3. El cajero te identifica y carga tus puntos</Text>
          <Text style={styles.infoText}>4. Sin internet: usá el QR de respaldo permanente</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: COLORS.white,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.black },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: COLORS.amberLight, borderBottomWidth: 1, borderBottomColor: '#FDE68A',
  },
  offlineBannerText: { color: '#92400E', fontSize: 13, fontWeight: '600' },
  content: { flex: 1, padding: 24 },
  subtitle: { fontSize: 15, color: COLORS.gray, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: COLORS.gray, fontSize: 16 },
  errorText: { color: COLORS.gray, fontSize: 16, textAlign: 'center', marginBottom: 24 },
  generateButton: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.orange, paddingHorizontal: 32, paddingVertical: 16,
    borderRadius: 16, shadowColor: COLORS.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  generateButtonText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  tokenContainer: { alignItems: 'center', gap: 20 },
  tokenBox: {
    backgroundColor: COLORS.white, borderRadius: 24, paddingHorizontal: 40, paddingVertical: 32,
    borderWidth: 3, borderColor: COLORS.orange, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
  },
  tokenText: { fontSize: 52, fontWeight: '900', color: COLORS.black, letterSpacing: 12 },
  timerContainer: {
    backgroundColor: COLORS.lightGray, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
  },
  timerWarning: { backgroundColor: '#FEF3C7' },
  timerText: { fontSize: 16, color: COLORS.gray, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  copyButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, borderWidth: 2, borderColor: COLORS.orange, backgroundColor: '#FFF7ED',
  },
  copyButtonText: { color: COLORS.orange, fontSize: 15, fontWeight: '600' },
  refreshButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: COLORS.white,
  },
  refreshButtonText: { color: COLORS.gray, fontSize: 15, fontWeight: '600' },
  button: {
    backgroundColor: COLORS.orange, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12,
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  // Offline card
  offlineCard: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 2, borderColor: '#FDE68A',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, marginBottom: 24,
  },
  offlineTitle: { fontSize: 20, fontWeight: '800', color: COLORS.black, marginBottom: 8 },
  offlineSubtitle: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  staticQrImageWrapper: {
    padding: 12, backgroundColor: COLORS.white, borderRadius: 12, marginTop: 12,
  },
  staticQrBox: {
    marginTop: 16, backgroundColor: COLORS.lightGray, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', width: '100%',
  },
  staticQrLabel: { fontSize: 11, color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  staticQrValue: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginTop: 4 },
  offlineNote: {
    fontSize: 12, color: COLORS.gray, textAlign: 'center', lineHeight: 18, marginTop: 12,
  },
  // Info box
  infoBox: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginTop: 24, gap: 8,
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  infoText: { fontSize: 14, color: COLORS.gray, lineHeight: 22 },
});
