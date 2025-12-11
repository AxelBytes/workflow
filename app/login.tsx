import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../hooks/useAuth';
// import { useGoogleAuth } from '../hooks/useGoogleAuth'; // Deshabilitado temporalmente
import AnimatedLogo from '../components/AnimatedLogo';
import { Check, Fingerprint } from 'lucide-react-native';

export default function LoginScreen() {
  const { signIn, loading, error: authError, user } = useAuth();
  // Google Sign-In deshabilitado temporalmente
  // const { signInWithGoogle, loading: googleLoading, error: googleError, isReady: googleReady } = useGoogleAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('biométrica');

  // Verificar disponibilidad de biometría
  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        setBiometricAvailable(compatible && enrolled);
        
        // Determinar tipo de biometría
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('huella digital');
        }
      } catch (e) {
        console.log('Error verificando biometría:', e);
      }
    };
    checkBiometrics();
  }, []);

  // Cargar credenciales guardadas si existen
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('rememberedEmail');
        const savedPassword = await AsyncStorage.getItem('rememberedPassword');
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
          setHasSavedCredentials(true);
        } else if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (e) {
        console.log('No se pudieron cargar credenciales guardadas');
      }
    };
    loadSavedCredentials();
  }, []);

  // Función para login con biometría
  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Inicia sesión con ' + biometricType,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar contraseña',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Autenticación biométrica exitosa, hacer login con credenciales guardadas
        const savedEmail = await AsyncStorage.getItem('rememberedEmail');
        const savedPassword = await AsyncStorage.getItem('rememberedPassword');
        
        if (savedEmail && savedPassword) {
          setError('');
          await signIn(savedEmail, savedPassword);
        } else {
          setError('No hay credenciales guardadas');
        }
      } else if (result.error !== 'user_cancel') {
        setError('Autenticación fallida');
      }
    } catch (e: any) {
      console.log('Error en biometría:', e);
      setError('Error al autenticar');
    }
  };

  // Si el usuario ya está autenticado, redirigir al inicio
  useEffect(() => {
    if (user) {
      console.log('✅ Usuario ya autenticado, redirigiendo...');
      router.replace('/');
    }
  }, [user]);

  const handleLogin = async () => {
    // Validación básica
    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }
    if (!password) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    setError('');
    console.log('🔐 Intentando login con:', email.trim());
    
    try {
      // Guardar o eliminar credenciales según checkbox
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', email.trim());
        await AsyncStorage.setItem('rememberedPassword', password);
      } else {
        await AsyncStorage.removeItem('rememberedEmail');
        await AsyncStorage.removeItem('rememberedPassword');
      }
      
      await signIn(email.trim(), password);
      // La redirección se hace automáticamente cuando user cambia (useEffect arriba)
      console.log('✅ Login iniciado...');
    } catch (e: any) {
      console.log('⚠️ Error capturado en login:', e?.message || 'Error desconocido');
      // El error ya se establece en useAuth a través de authError
      setError(e?.message || 'Correo o contraseña incorrectos');
    }
  };

  // Mostrar error de autenticación si existe
  React.useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Animado */}
          <View style={styles.logoContainer}>
            <AnimatedLogo size={140} />
          </View>

          {/* Card de Login */}
          <View style={styles.card}>
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.subtitle}>Ingresa a tu cuenta Eclipse</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            
            {error ? <Text style={styles.error}>{error}</Text> : null}
            
            {/* Checkbox Recordar sesión */}
            <TouchableOpacity 
              style={styles.rememberContainer}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Check size={14} color="#fff" strokeWidth={3} />}
              </View>
              <Text style={styles.rememberText}>Recordar mis datos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleLogin} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Botón de biometría */}
            {biometricAvailable && hasSavedCredentials && (
              <TouchableOpacity 
                style={styles.biometricButton} 
                onPress={handleBiometricLogin}
                disabled={loading}
              >
                <Fingerprint size={24} color="#F97316" />
                <Text style={styles.biometricText}>
                  Ingresar con {biometricType}
                </Text>
              </TouchableOpacity>
            )}

            {/* Google Sign-In deshabilitado temporalmente - funciona en producción */}
            
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.link}>
                ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    color: '#1a1a1a',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 32,
  },
  input: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    color: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  button: {
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  link: {
    color: '#666',
    marginTop: 24,
    fontSize: 15,
  },
  linkBold: {
    color: '#F97316',
    fontWeight: '600',
  },
  error: {
    color: '#EF4444',
    marginBottom: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  rememberText: {
    color: '#666',
    fontSize: 14,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
    width: '100%',
  },
  biometricText: {
    color: '#F97316',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    color: '#999',
    fontSize: 14,
    paddingHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
}); 