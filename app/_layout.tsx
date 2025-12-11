import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useNotifications } from '../hooks/useNotifications';
import { firebaseSyncService } from '../lib/firebaseSync';
import { useProductStore } from '../store/productStore';
import { AuthProvider, useAuthContext } from '../contexts/AuthContext';
import SplashScreen from '../components/SplashScreen';

function RootLayoutContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const segments = useSegments();

  // Inicializar notificaciones
  useNotifications();

  // Sincronizar productos desde Firebase (web) a la app móvil
  useEffect(() => {
    console.log('[App] 🔄 Iniciando sincronización con Firebase...');
    
    const unsubscribe = firebaseSyncService.subscribeToProducts((firebaseProducts) => {
      if (firebaseProducts.length > 0) {
        console.log('[App] ✅ Productos sincronizados desde Firebase:', firebaseProducts.length);
        
        // Convertir productos de Firebase al formato del store local
        const products = firebaseProducts.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          originalPrice: undefined,
          image: p.image,
          category: p.category,
          weight: '',
          rating: 4.5,
          badge: undefined,
          isFavorite: false,
          isActive: true,
          stock: p.stock,
          lowStockThreshold: 10,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }));
        
        // Actualizar el store local con los productos de Firebase
        useProductStore.setState({ products });
      }
    });

    return () => {
      console.log('[App] 🧹 Limpiando sincronización...');
      unsubscribe();
      firebaseSyncService.unsubscribeAll();
    };
  }, []);

  // Redirigir según estado de autenticación después del splash
  useEffect(() => {
    if (showSplash || authLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && !inAuthGroup) {
      // No está autenticado, ir al login
      console.log('[App] 🔐 Usuario no autenticado, redirigiendo a login...');
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Está autenticado pero está en login/register, ir a home
      console.log('[App] ✅ Usuario autenticado, redirigiendo a home...');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, authLoading, showSplash, segments]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Mostrar splash screen
  if (showSplash) {
    return (
      <>
        <StatusBar style="dark" />
        <SplashScreen onFinish={handleSplashFinish} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
