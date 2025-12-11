import { useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Necesario para que el navegador se cierre correctamente
WebBrowser.maybeCompleteAuthSession();

// ============================================================================
// CONFIGURACIÓN DE GOOGLE OAUTH
// ============================================================================
// Web Client - para el navegador
const WEB_CLIENT_ID = '35951872296-jqfldoi71ofb49j5c3q91r0drnhl41at.apps.googleusercontent.com';

// Android Client para tu app (producción)
const ANDROID_CLIENT_ID = '35951872296-48fiv2927idg9db78t9l2r9r5ji4adp2.apps.googleusercontent.com';

// Android Client para Expo Go (desarrollo) - con SHA-1 de Expo Go
const EXPO_GO_ANDROID_CLIENT_ID = '35951872296-gkd40rci7slr3ml4o3fesqt3goc8vv9o.apps.googleusercontent.com';

// iOS Client
const IOS_CLIENT_ID = '35951872296-2pi5fumapi4ajkbbu53jdf8h34em2tq3.apps.googleusercontent.com';

// Detectar si estamos en Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usar el client ID correcto según el entorno
  const androidClientId = isExpoGo ? EXPO_GO_ANDROID_CLIENT_ID : ANDROID_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: WEB_CLIENT_ID,
    androidClientId: androidClientId,
    iosClientId: IOS_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    console.log('🔧 Google Auth Config:');
    console.log('  - Platform:', Platform.OS);
    console.log('  - Is Expo Go:', isExpoGo);
    console.log('  - Android Client ID:', androidClientId.substring(0, 20) + '...');
    console.log('  - Request ready:', !!request);
    if (request) {
      console.log('  - Redirect URI:', request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    if (response) {
      console.log('📱 Google Auth Response:', response.type);
      handleGoogleResponse();
    }
  }, [response]);

  const handleGoogleResponse = async () => {
    if (response?.type === 'success') {
      setLoading(true);
      setError(null);
      
      try {
        console.log('✅ Google Auth Success');
        
        // Obtener el token - puede estar en diferentes lugares según el flujo
        let idToken = response.params?.id_token;
        let accessToken = response.params?.access_token;
        
        // También verificar authentication object
        const authentication = (response as any).authentication;
        if (!idToken && authentication?.idToken) {
          idToken = authentication.idToken;
          accessToken = authentication.accessToken;
        }
        
        if (!idToken && !accessToken) {
          console.error('❌ No se recibió token de Google');
          console.log('  - Response params:', response.params);
          setError('No se recibió token de Google. Intenta de nuevo.');
          setLoading(false);
          return;
        }
        
        console.log('🔑 Token recibido, autenticando con Firebase...');
        
        // Crear credencial de Firebase
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        
        // Iniciar sesión en Firebase
        const userCredential = await signInWithCredential(auth, credential);
        const firebaseUser = userCredential.user;
        
        console.log('✅ Login con Google exitoso:', firebaseUser.email);
        
        // Guardar/actualizar usuario en Firestore
        await saveUserToFirestore(firebaseUser);
        
        setLoading(false);
        return true;
        
      } catch (err: any) {
        console.error('❌ Error en Google Sign-In:', err);
        setError(err.message || 'Error al iniciar sesión con Google');
        setLoading(false);
        return false;
      }
    } else if (response?.type === 'error') {
      console.error('❌ Google Auth Error:', response.error);
      const errorMsg = response.error?.message || 'Error desconocido';
      setError(`Error de Google: ${errorMsg}`);
    } else if (response?.type === 'cancel') {
      console.log('⚠️ Usuario canceló el login con Google');
    } else if (response?.type === 'dismiss') {
      console.log('⚠️ Login con Google descartado');
    }
  };

  const saveUserToFirestore = async (firebaseUser: any) => {
    try {
      const customerRef = doc(db, 'customers', firebaseUser.uid);
      const customerDoc = await getDoc(customerRef);
      
      if (!customerDoc.exists()) {
        await setDoc(customerRef, {
          email: firebaseUser.email?.toLowerCase().trim() || '',
          name: firebaseUser.displayName || '',
          phone: firebaseUser.phoneNumber || '',
          totalPoints: 0,
          registeredAt: serverTimestamp(),
          lastActivity: serverTimestamp(),
          source: 'google_auth',
          photoURL: firebaseUser.photoURL || '',
        });
        console.log('✅ Nuevo cliente creado en Firestore (Google)');
      } else {
        await setDoc(customerRef, {
          lastActivity: serverTimestamp(),
        }, { merge: true });
        console.log('✅ Cliente actualizado en Firestore');
      }
    } catch (err) {
      console.error('⚠️ Error guardando en Firestore:', err);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    console.log('🚀 Iniciando Google Sign-In...');
    console.log('  - Is Expo Go:', isExpoGo);
    console.log('  - Request ready:', !!request);
    
    if (!request) {
      setError('Google Sign-In no está listo. Espera un momento.');
      return;
    }
    
    try {
      console.log('  - Redirect URI:', request.redirectUri);
      const result = await promptAsync();
      console.log('📱 promptAsync result:', result?.type);
    } catch (err: any) {
      console.error('❌ Error en promptAsync:', err);
      setError(err.message || 'Error al iniciar sesión con Google');
    }
  };

  return {
    signInWithGoogle,
    loading,
    error,
    isReady: !!request,
  };
}
