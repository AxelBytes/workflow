import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import AnimatedLogo from '../components/AnimatedLogo';

// Función para calcular fortaleza de contraseña
const getPasswordStrength = (password: string): { level: number; label: string; color: string } => {
  if (!password) return { level: 0, label: '', color: '#E5E5E5' };
  
  let score = 0;
  
  // Longitud
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Tiene minúsculas
  if (/[a-z]/.test(password)) score += 1;
  
  // Tiene mayúsculas
  if (/[A-Z]/.test(password)) score += 1;
  
  // Tiene números
  if (/[0-9]/.test(password)) score += 1;
  
  // Tiene caracteres especiales
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  if (score <= 2) return { level: 1, label: 'Débil', color: '#EF4444' };
  if (score <= 4) return { level: 2, label: 'Media', color: '#F59E0B' };
  if (score <= 5) return { level: 3, label: 'Buena', color: '#84CC16' };
  return { level: 4, label: 'Excelente', color: '#22C55E' };
};

export default function RegisterScreen() {
  const { signUp, loading, error: authError, user } = useAuth();
  const { signInWithGoogle, loading: googleLoading, error: googleError, isReady: googleReady } = useGoogleAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Calcular fortaleza de contraseña
  const passwordStrength = getPasswordStrength(password);

  // Si el usuario ya está autenticado, redirigir al inicio
  React.useEffect(() => {
    if (user) {
      console.log('✅ Usuario registrado y autenticado, redirigiendo...');
      router.replace('/');
    }
  }, [user]);

  const handleRegister = async () => {
    // Validación
    if (!name.trim()) {
      setError('Por favor ingresa tu nombre completo');
      return;
    }
    if (!dni.trim()) {
      setError('Por favor ingresa tu DNI');
      return;
    }
    if (dni.trim().length < 7 || dni.trim().length > 8) {
      setError('El DNI debe tener 7 u 8 dígitos');
      return;
    }
    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setError('');
    console.log('📝 Intentando registro con:', email.trim());
    
    try {
      await signUp(email.trim(), password, {
        name: name.trim(),
        dni: dni.trim(),
      });
      console.log('✅ Registro exitoso');
      // La redirección se hace automáticamente cuando user cambia
    } catch (e: any) {
      console.error('❌ Error en registro:', e.message);
      if (!authError) {
        setError('No se pudo registrar. El correo puede estar en uso o la contraseña es débil.');
      }
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

          {/* Card de Registro */}
          <View style={styles.card}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a la familia Eclipse</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre Completo"
              placeholderTextColor="#999"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="DNI (sin puntos)"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={8}
              value={dni}
              onChangeText={(text) => setDni(text.replace(/[^0-9]/g, ''))}
            />
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
              placeholder="Contraseña (mínimo 6 caracteres)"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            
            {/* Barra de fortaleza de contraseña */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor: level <= passwordStrength.level 
                            ? passwordStrength.color 
                            : '#E5E5E5',
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}
            
            {error ? <Text style={styles.error}>{error}</Text> : null}
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleRegister} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Registrarse</Text>
              )}
            </TouchableOpacity>

            {/* Separador */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>o continúa con</Text>
              <View style={styles.divider} />
            </View>

            {/* Botón de Google */}
            <TouchableOpacity 
              style={[styles.googleButton, (googleLoading || !googleReady) && styles.buttonDisabled]} 
              onPress={signInWithGoogle}
              disabled={googleLoading || !googleReady}
            >
              {googleLoading ? (
                <ActivityIndicator color="#666" />
              ) : (
                <>
                  <Image 
                    source={{ uri: 'https://www.google.com/favicon.ico' }} 
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>Google</Text>
                </>
              )}
            </TouchableOpacity>

            {googleError && <Text style={styles.error}>{googleError}</Text>}
            
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.link}>
                ¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text>
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
  strengthContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'right',
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
