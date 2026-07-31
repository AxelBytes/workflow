import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
// @ts-expect-error - getReactNativePersistence existe en el build de RN del SDK
// pero los tipos públicos de firebase/auth v12 solo exponen el build web (bug conocido).
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '../firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth con la persistencia correcta según la plataforma: en web,
// `firebase/auth` resuelve a su build de navegador, donde
// `getReactNativePersistence` no existe (queda `undefined`) y llamarlo
// explota con "is not a function" al bundlear con Metro para la plataforma
// web de Expo Router. En nativo sí existe y es la persistencia correcta.
const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence(ReactNativeAsyncStorage),
});

// Initialize Firestore (para sincronización con la web)
const db = getFirestore(app);

// Initialize Storage (para imágenes)
const storage = getStorage(app);

export { auth, db, storage };
export default app; 