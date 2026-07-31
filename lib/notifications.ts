import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Registrar el dispositivo para recibir notificaciones Y guardar en Firestore
  async registerForPushNotificationsAsync(userEmail?: string, userId?: string): Promise<string | null> {
    let token;

    // En web, no intentamos obtener tokens push
    if (Platform.OS === 'web') {
      console.log('📱 Push notifications no soportadas en web');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Eclipse Notificaciones',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('📱 Permisos de notificación no otorgados');
        return null;
      }
      
      try {
        // projectId requerido en builds EAS / production
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;

        const tokenData = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        token = tokenData.data;

        if (token) {
          await this.saveTokenToFirestore(token, userEmail, userId);
        }
      } catch (error) {
        console.log('📱 Error al obtener token push:', error);
        return null;
      }
    } else {
      console.log('📱 Debe usar un dispositivo físico para notificaciones');
    }

    this.expoPushToken = token || null;
    return token || null;
  }

  // Guardar token en Firestore
  private async saveTokenToFirestore(token: string, userEmail?: string, userId?: string): Promise<void> {
    try {
      const tokenId = token.replace(/[^a-zA-Z0-9]/g, '_');
      const tokenRef = doc(db, 'pushTokens', tokenId);
      
      await setDoc(tokenRef, {
        token,
        email: userEmail || 'anonymous',
        userId: userId || null,   // ← campo que usan las notificaciones dirigidas
        platform: Platform.OS,
        isActive: true,
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('❌ Error al guardar token en Firestore:', error);
    }
  }

  // Obtener el token actual
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Enviar notificación local de stock bajo
  async sendLowStockNotification(productName: string, currentStock: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Stock Bajo',
        body: `El producto "${productName}" tiene solo ${currentStock} unidades disponibles.`,
        data: { type: 'low_stock', productName, currentStock },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Enviar inmediatamente
    });
  }

  // Enviar notificación local de nueva oferta
  async sendNewOfferNotification(offerTitle: string, offerDescription: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 ¡Nueva Oferta!',
        body: `${offerTitle}: ${offerDescription}`,
        data: { type: 'new_offer', offerTitle, offerDescription },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Enviar inmediatamente
    });
  }

  // Enviar notificación local de stock agotado
  async sendOutOfStockNotification(productName: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '❌ Stock Agotado',
        body: `El producto "${productName}" se ha agotado completamente.`,
        data: { type: 'out_of_stock', productName },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Enviar inmediatamente
    });
  }

  // Enviar notificación push a todos los usuarios (requiere servidor)
  async sendPushNotificationToAllUsers(
    title: string, 
    body: string, 
    data?: any
  ): Promise<void> {
    // Esta función requeriría un servidor para enviar notificaciones push
    // Por ahora, solo enviamos notificación local
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  }

  // Configurar listener para notificaciones recibidas
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Configurar listener para notificaciones tocadas
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Cancelar todas las notificaciones
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Obtener notificaciones programadas
  async getScheduledNotificationsAsync(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

// Exportar instancia singleton
export const notificationService = NotificationService.getInstance(); 