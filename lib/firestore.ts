import firestore from '@react-native-firebase/firestore';
import { notificationService } from './notifications';

export interface PushToken {
  token: string;
  email: string;
  userId: string;
  deviceInfo: {
    platform: string;
    model: string;
  };
  updatedAt: Date;
  isActive: boolean;
}

export class FirestoreService {
  private static instance: FirestoreService;
  private tokensCollection = firestore().collection('pushTokens');

  private constructor() {}

  public static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  // Guardar o actualizar el token push de un usuario
  async savePushToken(userId: string, email: string): Promise<void> {
    try {
      const token = await notificationService.registerForPushNotificationsAsync();
      
      if (!token) {
        console.log('No se pudo obtener el token push');
        return;
      }

      const deviceInfo = {
        platform: 'react-native',
        model: 'mobile',
      };

      const pushTokenData: PushToken = {
        token,
        email,
        userId,
        deviceInfo,
        updatedAt: new Date(),
        isActive: true,
      };

      // Guardar o actualizar el token
      await this.tokensCollection.doc(userId).set(pushTokenData, { merge: true });
      
      console.log('Token push guardado exitosamente');
    } catch (error) {
      console.error('Error al guardar token push:', error);
    }
  }

  // Obtener todos los tokens activos
  async getAllActiveTokens(): Promise<PushToken[]> {
    try {
      const snapshot = await this.tokensCollection
        .where('isActive', '==', true)
        .get();

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as PushToken[];
    } catch (error) {
      console.error('Error al obtener tokens:', error);
      return [];
    }
  }

  // Obtener tokens por email (para notificaciones específicas)
  async getTokensByEmail(email: string): Promise<PushToken[]> {
    try {
      const snapshot = await this.tokensCollection
        .where('email', '==', email)
        .where('isActive', '==', true)
        .get();

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as PushToken[];
    } catch (error) {
      console.error('Error al obtener tokens por email:', error);
      return [];
    }
  }

  // Desactivar token (cuando el usuario cierra sesión)
  async deactivateToken(userId: string): Promise<void> {
    try {
      await this.tokensCollection.doc(userId).update({
        isActive: false,
        updatedAt: new Date(),
      });
      console.log('Token desactivado exitosamente');
    } catch (error) {
      console.error('Error al desactivar token:', error);
    }
  }

  // Eliminar token completamente
  async deleteToken(userId: string): Promise<void> {
    try {
      await this.tokensCollection.doc(userId).delete();
      console.log('Token eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar token:', error);
    }
  }

  // Limpiar tokens inactivos (mantenimiento)
  async cleanupInactiveTokens(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const snapshot = await this.tokensCollection
        .where('isActive', '==', false)
        .where('updatedAt', '<', thirtyDaysAgo)
        .get();

      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`${snapshot.docs.length} tokens inactivos eliminados`);
    } catch (error) {
      console.error('Error al limpiar tokens inactivos:', error);
    }
  }

  // Obtener estadísticas de tokens
  async getTokenStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    try {
      const [totalSnapshot, activeSnapshot] = await Promise.all([
        this.tokensCollection.get(),
        this.tokensCollection.where('isActive', '==', true).get(),
      ]);

      return {
        total: totalSnapshot.docs.length,
        active: activeSnapshot.docs.length,
        inactive: totalSnapshot.docs.length - activeSnapshot.docs.length,
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return { total: 0, active: 0, inactive: 0 };
    }
  }
}

// Exportar instancia singleton
export const firestoreService = FirestoreService.getInstance(); 