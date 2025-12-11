/**
 * Hook para sincronizar datos de Firebase con la app móvil
 * Conecta productos, clientes y transacciones en tiempo real
 */

import { useState, useEffect, useCallback } from 'react';
import { firebaseSyncService, FirebaseProduct, FirebaseCustomer, FirebaseTransaction, FirebasePromotion, FirebaseRaffle } from '../lib/firebaseSync';
import { useProductStore, Product } from '../store/productStore';

/**
 * Hook para sincronizar promociones desde Firebase
 */
export function useFirebasePromotions() {
  const [promotions, setPromotions] = useState<FirebasePromotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[useFirebasePromotions] 🎁 Iniciando sincronización...');
    setLoading(true);

    const unsubscribe = firebaseSyncService.subscribeToPromotions((firebasePromotions) => {
      console.log('[useFirebasePromotions] ✅ Promociones actualizadas:', firebasePromotions.length);
      setPromotions(firebasePromotions);
      setLoading(false);
    });

    return () => {
      console.log('[useFirebasePromotions] 🧹 Limpiando suscripción...');
      unsubscribe();
    };
  }, []);

  return {
    promotions,
    loading,
  };
}

/**
 * Hook para sincronizar sorteos desde Firebase
 */
export function useFirebaseRaffles() {
  const [raffles, setRaffles] = useState<FirebaseRaffle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[useFirebaseRaffles] 🎰 Iniciando sincronización...');
    setLoading(true);

    const unsubscribe = firebaseSyncService.subscribeToRaffles((firebaseRaffles) => {
      console.log('[useFirebaseRaffles] ✅ Sorteos actualizados:', firebaseRaffles.length);
      setRaffles(firebaseRaffles);
      setLoading(false);
    });

    return () => {
      console.log('[useFirebaseRaffles] 🧹 Limpiando suscripción...');
      unsubscribe();
    };
  }, []);

  return {
    raffles,
    loading,
  };
}

/**
 * Hook para sincronizar productos desde Firebase
 */
export function useFirebaseProducts() {
  const [products, setProducts] = useState<FirebaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useFirebaseProducts] Iniciando sincronización...');
    setLoading(true);
    setError(null);

    const unsubscribe = firebaseSyncService.subscribeToProducts((firebaseProducts) => {
      console.log('[useFirebaseProducts] Productos actualizados:', firebaseProducts.length);
      setProducts(firebaseProducts);
      setLoading(false);
    });

    return () => {
      console.log('[useFirebaseProducts] Limpiando suscripción...');
      unsubscribe();
    };
  }, []);

  // Convertir productos de Firebase al formato del store local
  const productsForStore: Product[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    image: p.image,
    category: p.category,
    weight: '',
    rating: 4.5,
    isFavorite: false,
    isActive: true,
    stock: p.stock,
    lowStockThreshold: 10,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  return {
    products: productsForStore,
    firebaseProducts: products,
    loading,
    error,
    refresh: async () => {
      setLoading(true);
      const freshProducts = await firebaseSyncService.getProducts();
      setProducts(freshProducts);
      setLoading(false);
    },
  };
}

/**
 * Hook para obtener información del cliente actual (puntos, etc.)
 * Se suscribe en tiempo real para actualizar cuando cambien los puntos
 */
export function useCustomerData(userEmail: string | null) {
  const [customer, setCustomer] = useState<FirebaseCustomer | null>(null);
  const [transactions, setTransactions] = useState<FirebaseTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setCustomer(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    console.log('[useCustomerData] 🔄 Iniciando suscripción para:', userEmail);
    setLoading(true);

    // Suscribirse a los datos del cliente en tiempo real
    // Esto actualiza automáticamente cuando cambian los puntos
    const unsubscribeCustomer = firebaseSyncService.subscribeToCustomerData(
      userEmail,
      (customerData) => {
        console.log('[useCustomerData] ✅ Cliente actualizado:', customerData?.totalPoints, 'puntos');
        setCustomer(customerData);
        setLoading(false);
      }
    );

    // Suscribirse a transacciones en tiempo real
    const unsubscribeTransactions = firebaseSyncService.subscribeToCustomerTransactions(
      userEmail,
      (txns) => {
        console.log('[useCustomerData] 💳 Transacciones actualizadas:', txns.length);
        setTransactions(txns);
      }
    );

    return () => {
      console.log('[useCustomerData] 🧹 Limpiando suscripciones');
      unsubscribeCustomer();
      unsubscribeTransactions();
    };
  }, [userEmail]);

  return {
    customer,
    transactions,
    loading,
    totalPoints: customer?.totalPoints || 0,
  };
}

/**
 * Hook para sincronizar el store local con Firebase
 * Esto permite que los productos cargados desde la web aparezcan en la app
 */
export function useSyncStoreWithFirebase() {
  const { products: firebaseProducts, loading } = useFirebaseProducts();
  const localProducts = useProductStore((state) => state.products);
  
  // Determinar qué productos mostrar
  // Prioridad: Firebase > Local (si hay productos en Firebase, usarlos)
  const products = firebaseProducts.length > 0 ? firebaseProducts : localProducts;
  
  return {
    products,
    loading,
    isFromFirebase: firebaseProducts.length > 0,
    localCount: localProducts.length,
    firebaseCount: firebaseProducts.length,
  };
}

/**
 * Hook combinado para toda la sincronización
 */
export function useFirebaseSync(userEmail: string | null) {
  const productsData = useFirebaseProducts();
  const customerData = useCustomerData(userEmail);

  return {
    // Productos
    products: productsData.products,
    productsLoading: productsData.loading,
    
    // Cliente
    customer: customerData.customer,
    customerLoading: customerData.loading,
    totalPoints: customerData.totalPoints,
    transactions: customerData.transactions,
    
    // Estado general
    isConnected: !productsData.error,
    
    // Acciones
    refreshProducts: productsData.refresh,
  };
}

export default useFirebaseSync;

