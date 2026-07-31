/**
 * Servicio de sincronización con Firebase Firestore
 * Conecta la app móvil con los datos de la web
 */

import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || '';

// Tipos
export interface FirebaseProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirebaseCustomer {
  id: string;
  email: string;
  name: string;
  phone: string;
  totalPoints: number;
  registeredAt: Date;
}

export interface FirebaseTransaction {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  pointsAmount: number;
  transactionType: 'load' | 'redeem';
  branch: string;
  cashierId: string;
  timestamp: Date;
  notes?: string;
}

export interface FirebasePromotion {
  id: string;
  title: string;
  description: string;
  image: string;
  active: boolean;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  discount?: string;
  category?: string;
}

export interface FirebaseRaffle {
  id: string;
  title: string;
  prize: string;
  description: string;
  image: string;
  pointsCost: number;
  maxParticipants: number;
  currentParticipants: number;
  startDate: Date;
  endDate: Date;
  drawDate: Date;
  status: 'active' | 'closed' | 'completed';
  winnerId?: string;
  winnerName?: string;
  active: boolean;
  createdAt: Date;
}

export interface RaffleParticipant {
  id: string;
  raffleId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  participatedAt: Date;
}

// Convertir Timestamp de Firebase a Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
};

/**
 * Servicio de sincronización con Firebase
 */
class FirebaseSyncService {
  private unsubscribeProducts: (() => void) | null = null;
  private unsubscribeCustomers: (() => void) | null = null;
  private unsubscribeTransactions: (() => void) | null = null;
  private unsubscribePromotions: (() => void) | null = null;
  private unsubscribeRaffles: (() => void) | null = null;

  /**
   * Suscribirse a promociones en tiempo real
   */
  subscribeToPromotions(callback: (promotions: FirebasePromotion[]) => void): () => void {
    console.log('[FirebaseSync] 🎁 Suscribiendo a promociones...');
    this.unsubscribePromotions?.();

    try {
      // Query simple sin orderBy para evitar necesitar índices
      const q = query(
        collection(db, 'promotions'),
        where('active', '==', true)
      );

      this.unsubscribePromotions = onSnapshot(q, 
        (snapshot) => {
          const promotions: FirebasePromotion[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title || '',
              description: data.description || '',
              image: data.image || '',
              active: data.active ?? true,
              startDate: convertTimestamp(data.startDate),
              endDate: convertTimestamp(data.endDate),
              createdAt: convertTimestamp(data.createdAt),
            };
          });
          
          console.log('[FirebaseSync] ✅ Promociones recibidas:', promotions.length);
          callback(promotions);
        },
        (error) => {
          console.error('[FirebaseSync] ❌ Error en promociones:', error);
          callback([]);
        }
      );

      return () => {
        if (this.unsubscribePromotions) {
          this.unsubscribePromotions();
          this.unsubscribePromotions = null;
        }
      };
    } catch (error) {
      console.error('[FirebaseSync] ❌ Error suscribiendo a promociones:', error);
      return () => {};
    }
  }

  /**
   * Suscribirse a sorteos en tiempo real
   */
  subscribeToRaffles(callback: (raffles: FirebaseRaffle[]) => void): () => void {
    console.log('[FirebaseSync] 🎰 Suscribiendo a sorteos...');
    this.unsubscribeRaffles?.();

    try {
      // Query simple sin orderBy para evitar necesitar índices
      const q = query(
        collection(db, 'raffles'),
        where('active', '==', true)
      );

      this.unsubscribeRaffles = onSnapshot(q, 
        (snapshot) => {
          const raffles: FirebaseRaffle[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title || '',
              prize: data.prize || '',
              description: data.description || '',
              image: data.image || '',
              pointsCost: data.pointsCost || 0,
              maxParticipants: data.maxParticipants || 0,
              currentParticipants: data.currentParticipants || 0,
              startDate: convertTimestamp(data.startDate),
              endDate: convertTimestamp(data.endDate),
              drawDate: convertTimestamp(data.drawDate),
              status: data.status || 'active',
              winnerId: data.winnerId,
              winnerName: data.winnerName,
              active: data.active ?? true,
              createdAt: convertTimestamp(data.createdAt),
            };
          });
          
          console.log('[FirebaseSync] ✅ Sorteos recibidos:', raffles.length);
          callback(raffles);
        },
        (error) => {
          console.error('[FirebaseSync] ❌ Error en sorteos:', error);
          callback([]);
        }
      );

      return () => {
        if (this.unsubscribeRaffles) {
          this.unsubscribeRaffles();
          this.unsubscribeRaffles = null;
        }
      };
    } catch (error) {
      console.error('[FirebaseSync] ❌ Error suscribiendo a sorteos:', error);
      return () => {};
    }
  }

  /**
   * Suscribirse a productos en tiempo real
   */
  subscribeToProducts(callback: (products: FirebaseProduct[]) => void): () => void {
    console.log('[FirebaseSync] 📦 Suscribiendo a productos...');
    this.unsubscribeProducts?.();

    try {
      const q = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc')
      );

      this.unsubscribeProducts = onSnapshot(q, 
        (snapshot) => {
          const products: FirebaseProduct[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || '',
              description: data.description || '',
              price: data.price || 0,
              image: data.image || '',
              category: data.category || '',
              stock: data.stock || 0,
              createdAt: convertTimestamp(data.createdAt),
              updatedAt: convertTimestamp(data.updatedAt),
            };
          });
          
          console.log('[FirebaseSync] ✅ Productos recibidos:', products.length);
          callback(products);
        },
        (error) => {
          console.error('[FirebaseSync] ❌ Error en productos:', error);
          callback([]);
        }
      );

      return () => {
        if (this.unsubscribeProducts) {
          this.unsubscribeProducts();
          this.unsubscribeProducts = null;
        }
      };
    } catch (error) {
      console.error('[FirebaseSync] ❌ Error suscribiendo a productos:', error);
      return () => {};
    }
  }

  /**
   * Obtener productos una sola vez (sin tiempo real)
   */
  async getProducts(): Promise<FirebaseProduct[]> {
    try {
      console.log('[FirebaseSync] 📦 Obteniendo productos...');
      
      const q = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      const products: FirebaseProduct[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          image: data.image || '',
          category: data.category || '',
          stock: data.stock || 0,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        };
      });
      
      console.log('[FirebaseSync] ✅ Productos obtenidos:', products.length);
      return products;
    } catch (error) {
      console.error('[FirebaseSync] ❌ Error obteniendo productos:', error);
      return [];
    }
  }

  /**
   * Suscribirse a clientes en tiempo real
   */
  subscribeToCustomers(callback: (customers: FirebaseCustomer[]) => void): () => void {
    console.log('[FirebaseSync] 👥 Suscribiendo a clientes...');
    this.unsubscribeCustomers?.();

    try {
      const q = query(collection(db, 'customers'));

      this.unsubscribeCustomers = onSnapshot(q, 
        (snapshot) => {
          const customers: FirebaseCustomer[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              email: data.email || '',
              name: data.name || '',
              phone: data.phone || '',
              totalPoints: data.totalPoints || 0,
              registeredAt: convertTimestamp(data.registeredAt),
            };
          });
          
          console.log('[FirebaseSync] ✅ Clientes recibidos:', customers.length);
          callback(customers);
        },
        (error) => {
          console.error('[FirebaseSync] ❌ Error en clientes:', error);
          callback([]);
        }
      );

      return () => {
        if (this.unsubscribeCustomers) {
          this.unsubscribeCustomers();
          this.unsubscribeCustomers = null;
        }
      };
    } catch (error) {
      console.error('[FirebaseSync] ❌ Error suscribiendo a clientes:', error);
      return () => {};
    }
  }

  /**
   * Obtener puntos de un cliente por email
   */
  async getCustomerByEmail(email: string): Promise<FirebaseCustomer | null> {
    try {
      // Normalizar email para búsqueda
      const normalizedEmail = email.toLowerCase().trim();
      console.log('[FirebaseSync] 🔍 Buscando cliente por email:', normalizedEmail);
      
      const q = query(
        collection(db, 'customers'),
        where('email', '==', normalizedEmail)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('[FirebaseSync] ⚠️ Cliente no encontrado, intentando sin normalizar...');
        // Intentar sin normalizar por si el email fue guardado con mayúsculas
        const q2 = query(
          collection(db, 'customers'),
          where('email', '==', email)
        );
        const snapshot2 = await getDocs(q2);
        
        if (snapshot2.empty) {
          console.log('[FirebaseSync] ❌ Cliente definitivamente no encontrado');
          return null;
        }
        
        const doc = snapshot2.docs[0];
        const data = doc.data();
        console.log('[FirebaseSync] ✅ Cliente encontrado (sin normalizar):', data.email);
        
        return {
          id: doc.id,
          email: data.email || '',
          name: data.name || '',
          phone: data.phone || '',
          totalPoints: data.totalPoints || 0,
          registeredAt: convertTimestamp(data.registeredAt),
        };
      }
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      console.log('[FirebaseSync] ✅ Cliente encontrado:', data.email, '- Puntos:', data.totalPoints);
      
      return {
        id: doc.id,
        email: data.email || '',
        name: data.name || '',
        phone: data.phone || '',
        totalPoints: data.totalPoints || 0,
        registeredAt: convertTimestamp(data.registeredAt),
      };
    } catch (error) {
      console.error('[FirebaseSync] ❌ Error buscando cliente:', error);
      return null;
    }
  }

  /**
   * Suscribirse a los datos del cliente en tiempo real (para actualizar puntos)
   */
  private unsubscribeCustomerData: (() => void) | null = null;
  
  subscribeToCustomerData(
    email: string,
    callback: (customer: FirebaseCustomer | null) => void
  ): () => void {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[FirebaseSync] 👤 Suscribiendo a datos del cliente:', normalizedEmail);
    this.unsubscribeCustomerData?.();

    try {
      const q = query(
        collection(db, 'customers'),
        where('email', '==', normalizedEmail)
      );

      this.unsubscribeCustomerData = onSnapshot(q, 
        (snapshot) => {
          if (snapshot.empty) {
            console.log('[FirebaseSync] ⚠️ Cliente no encontrado en suscripción');
            callback(null);
            return;
          }
          
          const doc = snapshot.docs[0];
          const data = doc.data();
          
          const customer: FirebaseCustomer = {
            id: doc.id,
            email: data.email || '',
            name: data.name || '',
            phone: data.phone || '',
            totalPoints: data.totalPoints || 0,
            registeredAt: convertTimestamp(data.registeredAt),
          };
          
          console.log('[FirebaseSync] ✅ Datos del cliente actualizados:', customer.email, '- Puntos:', customer.totalPoints);
          callback(customer);
        },
        (error) => {
          console.error('[FirebaseSync] ❌ Error en suscripción de cliente:', error);
          callback(null);
        }
      );

      return () => {
        if (this.unsubscribeCustomerData) {
          this.unsubscribeCustomerData();
          this.unsubscribeCustomerData = null;
        }
      };
    } catch (error) {
      console.error('[FirebaseSync] ❌ Error suscribiendo a cliente:', error);
      return () => {};
    }
  }

  /**
   * Suscribirse a transacciones de un cliente
   */
  subscribeToCustomerTransactions(
    customerEmail: string, 
    callback: (transactions: FirebaseTransaction[]) => void
  ): () => void {
    console.log('[FirebaseSync] 💳 Suscribiendo a transacciones de:', customerEmail);
    this.unsubscribeTransactions?.();

    try {
      // Query simple sin orderBy para evitar necesitar índices
      const q = query(
        collection(db, 'pointTransactions'),
        where('customerEmail', '==', customerEmail)
      );

      this.unsubscribeTransactions = onSnapshot(q, 
        (snapshot) => {
          const transactions: FirebaseTransaction[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              customerId: data.customerId || '',
              customerName: data.customerName || '',
              customerEmail: data.customerEmail || '',
              pointsAmount: data.pointsAmount || 0,
              transactionType: data.transactionType || 'load',
              branch: data.branch || '',
              cashierId: data.cashierId || '',
              timestamp: convertTimestamp(data.timestamp),
              notes: data.notes,
            };
          });
          
          console.log('[FirebaseSync] ✅ Transacciones recibidas:', transactions.length);
          callback(transactions);
        },
        (error) => {
          console.error('[FirebaseSync] ❌ Error en transacciones:', error);
          callback([]);
        }
      );

      return () => {
        if (this.unsubscribeTransactions) {
          this.unsubscribeTransactions();
          this.unsubscribeTransactions = null;
        }
      };
    } catch (error) {
      console.error('[FirebaseSync] ❌ Error suscribiendo a transacciones:', error);
      return () => {};
    }
  }

  /**
   * Limpiar todas las suscripciones
   */
  unsubscribeAll() {
    console.log('[FirebaseSync] 🧹 Limpiando suscripciones...');

    this.unsubscribeProducts?.();
    this.unsubscribeProducts = null;
    this.unsubscribeCustomers?.();
    this.unsubscribeCustomers = null;
    this.unsubscribeTransactions?.();
    this.unsubscribeTransactions = null;
    this.unsubscribePromotions?.();
    this.unsubscribePromotions = null;
    this.unsubscribeRaffles?.();
    this.unsubscribeRaffles = null;
    this.unsubscribeCustomerData?.();
    this.unsubscribeCustomerData = null;
  }

  /**
   * Participar en un sorteo.
   *
   * Se resuelve 100% en el servidor (ver web/app/api/raffles/participate):
   * ahí es donde se valida cupo/estado, se evita duplicados con un ID
   * determinístico y se descuenta `pointsCost` en la misma transacción. El
   * cliente ya no escribe directo a `raffles`/`raffleParticipants` (las reglas
   * de Firestore de hecho ya no lo permiten para el conteo de participantes).
   */
  async participateInRaffle(raffleId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'Debés iniciar sesión para participar' };
      }
      const idToken = await user.getIdToken();

      const response = await fetch(`${WEB_URL}/api/raffles/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ raffleId }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.error || 'No se pudo registrar la participación' };
      }

      return { success: true, message: data.message || '¡Participación registrada exitosamente!' };
    } catch (error) {
      console.error('[FirebaseSync] ❌ Error al participar:', error);
      return { success: false, message: 'Error al registrar participación' };
    }
  }

  /**
   * Verificar si el usuario logueado ya participa en un sorteo. Usa el mismo
   * ID determinístico `${raffleId}_${uid}` que genera el endpoint de
   * participación, así una sola lectura de documento alcanza (sin query).
   */
  async isParticipating(raffleId: string): Promise<boolean> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return false;
      const snap = await getDoc(doc(db, 'raffleParticipants', `${raffleId}_${uid}`));
      return snap.exists();
    } catch (error) {
      console.error('[FirebaseSync] ❌ Error verificando participación:', error);
      return false;
    }
  }

  /**
   * Suscribirse a participantes de un sorteo
   */
  subscribeToRaffleParticipants(
    raffleId: string,
    callback: (participants: RaffleParticipant[]) => void
  ): () => void {
    console.log('[FirebaseSync] 👥 Suscribiendo a participantes del sorteo:', raffleId);
    
    try {
      // Query simple sin orderBy para evitar necesitar índices
      const q = query(
        collection(db, 'raffleParticipants'),
        where('raffleId', '==', raffleId)
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const participants: RaffleParticipant[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              raffleId: data.raffleId,
              customerId: data.customerId,
              customerEmail: data.customerEmail,
              customerName: data.customerName,
              participatedAt: convertTimestamp(data.participatedAt),
            };
          });
          
          console.log('[FirebaseSync] ✅ Participantes recibidos:', participants.length);
          callback(participants);
        },
        (error) => {
          console.error('[FirebaseSync] ❌ Error en participantes:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('[FirebaseSync] ❌ Error suscribiendo a participantes:', error);
      return () => {};
    }
  }
}

// Exportar instancia única
export const firebaseSyncService = new FirebaseSyncService();

