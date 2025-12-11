import { ExpoPushMessage } from 'expo-server-sdk';

// Configuración del servidor de notificaciones
const NOTIFICATION_SERVER_URL = 'http://localhost:3001'; // Cambiar por tu URL de producción

export interface NotificationStats {
  totalTokens: number;
  activeTokens: number;
  inactiveTokens: number;
  uniqueUsers: number;
  usersByEmail: Record<string, number>;
  recentNotifications: Array<{
    title: string;
    body: string;
    sentAt: string;
    totalTokens: number;
    successCount: number;
    failureCount: number;
  }>;
}

export interface SendNotificationResponse {
  success: boolean;
  message: string;
  stats?: {
    totalTokens: number;
    successCount: number;
    failureCount: number;
  };
}

class PushNotificationService {
  private static instance: PushNotificationService;

  private constructor() {}

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // ============================================================================
  // REGISTRAR TOKEN DE NOTIFICACIÓN
  // ============================================================================
  async registerToken(token: string, email: string, isActive: boolean = true): Promise<boolean> {
    try {
      const response = await fetch(`${NOTIFICATION_SERVER_URL}/api/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          isActive,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Token registrado exitosamente');
        return true;
      } else {
        console.error('❌ Error al registrar token:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error de conexión al registrar token:', error);
      return false;
    }
  }

  // ============================================================================
  // DESACTIVAR TOKEN
  // ============================================================================
  async deactivateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${NOTIFICATION_SERVER_URL}/api/deactivate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Token desactivado exitosamente');
        return true;
      } else {
        console.error('❌ Error al desactivar token:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error de conexión al desactivar token:', error);
      return false;
    }
  }

  // ============================================================================
  // ENVIAR NOTIFICACIÓN A TODOS LOS USUARIOS
  // ============================================================================
  async sendNotificationToAll(
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<SendNotificationResponse> {
    try {
      const response = await fetch(`${NOTIFICATION_SERVER_URL}/api/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          data,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Notificación enviada: ${title}`);
        return result;
      } else {
        console.error('❌ Error al enviar notificación:', result.error);
        return {
          success: false,
          message: result.error || 'Error desconocido',
        };
      }
    } catch (error) {
      console.error('❌ Error de conexión al enviar notificación:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor',
      };
    }
  }

  // ============================================================================
  // ENVIAR NOTIFICACIÓN A USUARIO ESPECÍFICO
  // ============================================================================
  async sendNotificationToUser(
    email: string,
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<SendNotificationResponse> {
    try {
      const response = await fetch(`${NOTIFICATION_SERVER_URL}/api/send-notification-to-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          title,
          body,
          data,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Notificación enviada a ${email}: ${title}`);
        return result;
      } else {
        console.error('❌ Error al enviar notificación al usuario:', result.error);
        return {
          success: false,
          message: result.error || 'Error desconocido',
        };
      }
    } catch (error) {
      console.error('❌ Error de conexión al enviar notificación al usuario:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor',
      };
    }
  }

  // ============================================================================
  // OBTENER ESTADÍSTICAS
  // ============================================================================
  async getStats(): Promise<NotificationStats | null> {
    try {
      const response = await fetch(`${NOTIFICATION_SERVER_URL}/api/stats`);
      const result = await response.json();
      
      if (response.ok) {
        return result;
      } else {
        console.error('❌ Error al obtener estadísticas:', result.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Error de conexión al obtener estadísticas:', error);
      return null;
    }
  }

  // ============================================================================
  // LIMPIAR TOKENS INACTIVOS
  // ============================================================================
  async cleanupTokens(): Promise<boolean> {
    try {
      const response = await fetch(`${NOTIFICATION_SERVER_URL}/api/cleanup-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Limpieza completada: ${result.removedCount} tokens eliminados`);
        return true;
      } else {
        console.error('❌ Error en limpieza:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error de conexión en limpieza:', error);
      return false;
    }
  }

  // ============================================================================
  // MÉTODOS DE CONVENIENCIA PARA NOTIFICACIONES ESPECÍFICAS
  // ============================================================================
  
  // Notificación de nueva oferta
  async sendNewPromotionNotification(
    promotionTitle: string,
    promotionDescription: string,
    promotionId: string
  ): Promise<SendNotificationResponse> {
    return this.sendNotificationToAll(
      '🎉 ¡Nueva Oferta en Eclipse!',
      `${promotionTitle}: ${promotionDescription}`,
      {
        type: 'new_promotion',
        promotionId,
        title: promotionTitle,
        description: promotionDescription,
      }
    );
  }

  // Notificación de stock bajo (solo para admin)
  async sendLowStockNotification(
    productName: string,
    currentStock: number,
    threshold: number
  ): Promise<SendNotificationResponse> {
    return this.sendNotificationToUser(
      'admin@eclipse.com',
      '⚠️ Stock Bajo - Eclipse',
      `El producto "${productName}" tiene solo ${currentStock} unidades disponibles.`,
      {
        type: 'low_stock',
        productName,
        currentStock,
        threshold,
      }
    );
  }

  // Notificación de stock agotado (solo para admin)
  async sendOutOfStockNotification(productName: string): Promise<SendNotificationResponse> {
    return this.sendNotificationToUser(
      'admin@eclipse.com',
      '❌ Stock Agotado - Eclipse',
      `El producto "${productName}" se ha agotado completamente.`,
      {
        type: 'out_of_stock',
        productName,
      }
    );
  }

  // Notificación de bienvenida
  async sendWelcomeNotification(email: string): Promise<SendNotificationResponse> {
    return this.sendNotificationToUser(
      email,
      '🎉 ¡Bienvenido a Eclipse!',
      'Gracias por registrarte. Descubre nuestras increíbles ofertas.',
      {
        type: 'welcome',
      }
    );
  }
}

export default PushNotificationService; 