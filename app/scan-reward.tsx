import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Keyboard, CheckCircle, XCircle } from 'lucide-react-native';
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
  darkGray: '#374151',
};

type ScanMode = 'camera' | 'manual';
type ResultState = 'idle' | 'loading' | 'success' | 'error';

interface RedeemResult {
  productName: string;
  pointsCost: number;
  newBalance: number;
}

export default function ScanRewardScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('camera');
  const [manualToken, setManualToken] = useState('');
  const [resultState, setResultState] = useState<ResultState>('idle');
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [processing, setProcessing] = useState(false);
  const lastScannedRef = useRef<string | null>(null);

  const redeemToken = useCallback(async (token: string) => {
    const normalizedToken = token.toUpperCase().trim();
    if (!normalizedToken || processing) return;

    setProcessing(true);
    setResultState('loading');
    setErrorMsg('');

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Debés iniciar sesión para canjear');

      const res = await fetch(`${WEB_URL}/api/rewards/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token: normalizedToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResultState('error');
        setErrorMsg(data.error || 'No se pudo procesar el canje');
        return;
      }

      setResult({
        productName: data.productName,
        pointsCost: data.pointsCost,
        newBalance: data.newBalance,
      });
      setResultState('success');

    } catch (err: any) {
      setResultState('error');
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setProcessing(false);
    }
  }, [processing]);

  const handleBarcodeScan = useCallback(({ data }: { data: string }) => {
    if (processing || resultState !== 'idle') return;
    if (lastScannedRef.current === data) return;
    lastScannedRef.current = data;
    redeemToken(data);
    // Reset para poder escanear otro en 5s
    setTimeout(() => { lastScannedRef.current = null; }, 5000);
  }, [processing, resultState, redeemToken]);

  const handleManualSubmit = () => {
    if (!manualToken.trim()) return;
    redeemToken(manualToken.trim());
  };

  const handleReset = () => {
    setResultState('idle');
    setResult(null);
    setErrorMsg('');
    setManualToken('');
    lastScannedRef.current = null;
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Canjear Premio</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.grayText}>Iniciá sesión para canjear premios</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/login')}>
            <Text style={styles.primaryBtnText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Resultado ──────────────────────────────────────────────────────────────
  if (resultState === 'success' && result) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Canje Exitoso</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <View style={styles.successCircle}>
            <CheckCircle size={64} color={COLORS.green} />
          </View>
          <Text style={styles.successTitle}>¡Premio canjeado!</Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Premio</Text>
            <Text style={styles.resultValue}>{result.productName}</Text>
            <View style={styles.divider} />
            <Text style={styles.resultLabel}>Puntos utilizados</Text>
            <Text style={[styles.resultValue, { color: COLORS.red }]}>-{result.pointsCost} pts</Text>
            <View style={styles.divider} />
            <Text style={styles.resultLabel}>Saldo restante</Text>
            <Text style={[styles.resultValue, { color: COLORS.green }]}>{result.newBalance} pts</Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleReset}>
            <Text style={styles.primaryBtnText}>Escanear otro</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => router.back()}>
            <Text style={styles.ghostBtnText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (resultState === 'error') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleReset} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error en el canje</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <XCircle size={64} color={COLORS.red} />
          <Text style={styles.errorTitle}>No se pudo canjear</Text>
          <View style={styles.errorCard}>
            <Text style={styles.errorMsgText}>{errorMsg}</Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleReset}>
            <Text style={styles.primaryBtnText}>Intentar nuevamente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => router.back()}>
            <Text style={styles.ghostBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Scanner ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Canjear Premio</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Toggle camera / manual */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'camera' && styles.toggleActive]}
          onPress={() => setMode('camera')}
        >
          <Camera size={16} color={mode === 'camera' ? COLORS.white : COLORS.gray} />
          <Text style={[styles.toggleText, mode === 'camera' && styles.toggleActiveText]}>
            Escanear QR
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'manual' && styles.toggleActive]}
          onPress={() => setMode('manual')}
        >
          <Keyboard size={16} color={mode === 'manual' ? COLORS.white : COLORS.gray} />
          <Text style={[styles.toggleText, mode === 'manual' && styles.toggleActiveText]}>
            Código manual
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cámara */}
      {mode === 'camera' && (
        <>
          {!permission?.granted ? (
            <View style={styles.center}>
              <Camera size={48} color={COLORS.gray} />
              <Text style={styles.grayText}>Se necesita acceso a la cámara</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
                <Text style={styles.primaryBtnText}>Permitir cámara</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.scannerContainer}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcodeScan}
              />
              {/* Overlay con cuadrado */}
              <View style={styles.overlay}>
                <View style={styles.scanFrame} />
              </View>
              {processing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.white} />
                  <Text style={styles.processingText}>Procesando canje...</Text>
                </View>
              )}
              <View style={styles.scanHint}>
                <Text style={styles.scanHintText}>
                  Apuntá la cámara al QR que te muestra el cajero
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      {/* Manual */}
      {mode === 'manual' && (
        <View style={[styles.center, { paddingHorizontal: 24 }]}>
          <Text style={styles.manualTitle}>Ingresá el código</Text>
          <Text style={styles.grayText}>Pedile el código de 8 caracteres al cajero</Text>
          <TextInput
            style={styles.tokenInput}
            value={manualToken}
            onChangeText={(t) => setManualToken(t.toUpperCase())}
            placeholder="Ej: A3KP7MNR"
            placeholderTextColor={COLORS.gray}
            autoCapitalize="characters"
            maxLength={8}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.primaryBtn, { width: '100%', marginTop: 8 }]}
            onPress={handleManualSubmit}
            disabled={manualToken.length < 6 || processing}
          >
            {processing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Canjear</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  toggleRow: {
    flexDirection: 'row', margin: 16, gap: 8,
    backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 4,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  toggleActive: { backgroundColor: COLORS.orange },
  toggleText: { fontSize: 14, color: COLORS.gray, fontWeight: '600' },
  toggleActiveText: { color: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 },
  grayText: { color: COLORS.gray, fontSize: 15, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: COLORS.orange, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center', minWidth: 200,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  ghostBtn: {
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.lightGray,
  },
  ghostBtnText: { color: COLORS.gray, fontSize: 15, fontWeight: '500' },
  // Scanner
  scannerContainer: { flex: 1, position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanFrame: {
    width: 240, height: 240, borderRadius: 16,
    borderWidth: 3, borderColor: COLORS.orange,
    backgroundColor: 'transparent',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  processingText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  scanHint: {
    position: 'absolute', bottom: 40, left: 0, right: 0,
    alignItems: 'center', paddingHorizontal: 24,
  },
  scanHintText: {
    color: COLORS.white, fontSize: 14, textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
  },
  // Manual
  manualTitle: { fontSize: 20, fontWeight: '700', color: COLORS.black },
  tokenInput: {
    width: '100%', borderWidth: 2, borderColor: COLORS.orange,
    borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16,
    fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: 8,
    color: COLORS.black, backgroundColor: COLORS.lightGray,
  },
  // Resultado exitoso
  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center',
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.black },
  resultCard: {
    width: '100%', backgroundColor: COLORS.lightGray,
    borderRadius: 16, padding: 20, gap: 4,
  },
  resultLabel: { fontSize: 12, color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  resultValue: { fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  // Error
  errorTitle: { fontSize: 22, fontWeight: '800', color: COLORS.black },
  errorCard: {
    width: '100%', backgroundColor: '#FEF2F2', borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: '#FECACA',
  },
  errorMsgText: { color: '#B91C1C', fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
