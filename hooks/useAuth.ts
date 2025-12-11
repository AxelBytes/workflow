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
  const registerPushToken = async (userEmail: string) => {
    try {
      // En web, saltar registro de notificaciones
      if (Platform.OS === 'web') {
        console.log('📱 Push notifications no soportadas en web');
        return;
      }

      // Registrar token y guardarlo en Firestore
      const token = await notificationService.registerForPushNotificationsAsync(userEmail);
      
      if (token) {
        console.log('✅ Token de notificación registrado para:', userEmail);
      }
    } catch (error) {
      // No es crítico - solo logueamos sin bloquear
      console.log('📱 Notificaciones no disponibles en este entorno');
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
        await registerPushToken(email);
      } catch (pushError) {
        console.log('⚠️ No se pudo registrar push token:', pushError);
      }
      
      console.log('✅ Usuario autenticado exitosamente:', email);
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
      
      // ✅ CREAR REGISTRO EN LA COLECCIÓN 'customers' DE FIRESTORE
      // Esto permite que el cajero pueda encontrar al cliente y cargarle puntos
      try {
        const customerRef = doc(db, 'customers', firebaseUser.uid);
        await setDoc(customerRef, {
          email: email.toLowerCase().trim(),
          name: userData?.name || '',
          dni: userData?.dni || '',
          phone: '',
          totalPoints: 0,
          registeredAt: serverTimestamp(),
          lastActivity: serverTimestamp(),
          source: 'mobile_app', // Indica que se registró desde la app
        });
        console.log('✅ Cliente registrado en Firestore');
      } catch (firestoreError) {
        console.error('❌ Error al crear cliente en Firestore:', firestoreError);
        // No fallar el registro si falla Firestore
      }
      
      // Registrar token de notificación (no bloquear si falla)
      try {
        await registerPushToken(email);
      } catch (pushError) {
        console.log('⚠️ No se pudo registrar push token:', pushError);
      }
      
      console.log('✅ Usuario registrado:', email);
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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          isAdmin: true, // Temporalmente todos son admin para pruebas
        };
        setUser(authUser);
        
        // Registrar token cuando el usuario se autentica
        if (firebaseUser.email) {
          registerPushToken(firebaseUser.email);
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