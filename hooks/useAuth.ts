import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { NotificationService } from '../lib/notifications';
import { Platform } from 'react-native';

export interface AuthUser {
  uid: string;
  email: string | null;
  isAdmin: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notificationService = NotificationService.getInstance();

  // ============================================================================
  // REGISTRAR TOKEN DE NOTIFICACIÓN
  // ============================================================================
  const registerPushToken = async (userEmail: string, userId?: string) => {
    try {
      if (Platform.OS === 'web') return;
      await notificationService.registerForPushNotificationsAsync(userEmail, userId);
    } catch {
      // No es crítico
    }
  };

  // ============================================================================
  // INICIAR SESIÓN
  // ============================================================================
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('🔐 Intentando iniciar sesión con:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('✅ Firebase Auth exitoso para:', firebaseUser.email);
      
      // ✅ Verificar si existe el registro en 'customers', si no, crearlo
      try {
        const customerRef = doc(db, 'customers', firebaseUser.uid);
        const customerDoc = await getDoc(customerRef);
        
        if (!customerDoc.exists()) {
          // Crear registro si no existe (usuario que se registró antes de esta actualización)
          await setDoc(customerRef, {
            email: email.toLowerCase().trim(),
            name: '',
            phone: '',
            totalPoints: 0,
            registeredAt: serverTimestamp(),
            lastActivity: serverTimestamp(),
            source: 'mobile_app_legacy',
          });
          console.log('✅ Cliente legacy registrado en Firestore');
        } else {
          // Actualizar última actividad
          await setDoc(customerRef, { lastActivity: serverTimestamp() }, { merge: true });
          console.log('✅ Última actividad actualizada');
        }
      } catch (firestoreError) {
        console.error('⚠️ Error al verificar/crear cliente:', firestoreError);
        // No fallar el login si falla Firestore
      }
      
      // Registrar token de notificación (no bloquear si falla)
      try {
        await registerPushToken(email, firebaseUser.uid);
      } catch (pushError) {
        console.log('⚠️ No se pudo registrar push token:', pushError);
      }
      
      setLoading(false);
      setLoading(false);
      return true; // ✅ Login exitoso
      
    } catch (error: any) {
      console.error('❌ Error de autenticación:', error?.code, error?.message);
      const errorMessage = getAuthErrorMessage(error?.code);
      setError(errorMessage);
      setLoading(false);
      // Lanzar un error simple con el mensaje traducido
      throw new Error(errorMessage);
    }
  };

  // ============================================================================
  // REGISTRARSE
  // ============================================================================
  const signUp = async (
    email: string, 
    password: string, 
    userData?: { name?: string; dni?: string }
  ) => {
    try {
      setError(null);
      setLoading(true);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // ✅ VINCULAR CUENTA AL PERFIL DNI PRE-EXISTENTE (si el cajero ya cargó puntos)
      // Si el cliente tiene puntos acumulados de compras previas, este endpoint los migra
      try {
        const idToken = await firebaseUser.getIdToken();
        const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || '';

        const linkRes = await fetch(`${WEB_URL}/api/customers/link-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            dni: userData?.dni || '',
            name: userData?.name || '',
            email: email.toLowerCase().trim(),
          }),
        });

        if (linkRes.ok) {
          const linkData = await linkRes.json();
          if (linkData.pointsMigrated > 0) {
            console.log(`✅ ${linkData.pointsMigrated} puntos migrados desde perfil DNI`);
          } else {
            console.log('✅ Cliente vinculado en Firestore');
          }
        } else {
          throw new Error('link-account falló');
        }
      } catch (linkError) {
        console.error('⚠️ Error al vincular cuenta, creando perfil básico:', linkError);
        // Fallback: crear perfil básico directo en Firestore
        try {
          const customerRef = doc(db, 'customers', firebaseUser.uid);
          await setDoc(customerRef, {
            uid: firebaseUser.uid,
            email: email.toLowerCase().trim(),
            name: userData?.name || '',
            dni: userData?.dni?.replace(/\D/g, '') || '',
            phone: '',
            totalPoints: 0,
            linked: true,
            source: 'mobile_app',
            nameEditable: false,
            registeredAt: serverTimestamp(),
            lastActivity: serverTimestamp(),
          });
        } catch (fallbackError) {
          console.error('❌ Error en fallback Firestore:', fallbackError);
        }
      }
      
      // Registrar token de notificación con uid para notificaciones dirigidas
      try {
        await registerPushToken(email, firebaseUser.uid);
      } catch { /* no crítico */ }
      
      setLoading(false);
      return true;
      
    } catch (error: any) {
      console.error('❌ Error de registro:', error?.code, error?.message);
      const errorMessage = getAuthErrorMessage(error?.code);
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  // ============================================================================
  // CERRAR SESIÓN
  // ============================================================================
  const logout = async () => {
    try {
      await signOut(auth);
      console.log('✅ Sesión cerrada');
      
    } catch (error: any) {
      console.error('❌ Error al cerrar sesión:', error);
      setError('Error al cerrar sesión');
    }
  };

  // ============================================================================
  // ESCUCHAR CAMBIOS DE AUTENTICACIÓN
  // ============================================================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Leer el Custom Claim "role" del ID Token para determinar si es admin
        // Los Custom Claims los asigna el backend con Firebase Admin SDK
        let isAdmin = false;
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          isAdmin = tokenResult.claims.role === 'admin';
        } catch {
          isAdmin = false;
        }

        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          isAdmin,
        };
        setUser(authUser);
        
        // Registrar token con uid para que las notificaciones dirigidas funcionen
        if (firebaseUser.email) {
          registerPushToken(firebaseUser.email, firebaseUser.uid);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ============================================================================
  // MENSAJES DE ERROR
  // ============================================================================
  const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No existe una cuenta con este email';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con este email';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Intenta más tarde';
      default:
        return 'Error de autenticación';
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    logout,
    clearError: () => setError(null),
  };
}; 