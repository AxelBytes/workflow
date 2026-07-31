import { useState } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Web Client ID de Firebase - necesario para obtener idToken compatible con Firebase
const WEB_CLIENT_ID = '728527346221-kou5va3efqpt37ps7makjaijud7brg4e.apps.googleusercontent.com';

// La configuración se hace de forma diferida (recién cuando el usuario toca
// "Iniciar con Google"), no al cargar el módulo. `@react-native-google-signin`
// es un módulo nativo que no existe en Expo Go: si `configure()` corriera al
// importar este archivo, abrir la pantalla de login en Expo Go rompía TODA
// la app apenas cargaba, antes de que el usuario tocara nada.
let googleConfigured = false;
function ensureGoogleConfigured() {
  if (googleConfigured) return;
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
  });
  googleConfigured = true;
}

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      ensureGoogleConfigured();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      await GoogleSignin.signOut();

      const userInfo = await GoogleSignin.signIn();

      if (userInfo.type !== 'success' || !userInfo.data?.idToken) {
        throw new Error('No se recibió token de Google');
      }

      const { idToken } = userInfo.data;

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      console.log('✅ Login con Google exitoso:', firebaseUser.email);

      await saveUserToFirestore(firebaseUser);

      setLoading(false);
      return true;

    } catch (err: any) {
      console.error('❌ Error en Google Sign-In:', err);

      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        setError(null);
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setError('Ya hay un inicio de sesión en progreso');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services no disponible');
      } else {
        setError(err.message || 'Error al iniciar sesión con Google');
      }

      setLoading(false);
      return false;
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
          nameEditable: true,
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

  return {
    signInWithGoogle,
    loading,
    error,
    isReady: true,
  };
}
