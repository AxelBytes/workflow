import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../lib/notifications';
import { useAuth } from './useAuth';
import { ADMIN_EMAIL } from '../constants/admin';

export const useNotifications = () => {
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const { user } = useAuth();

  useEffect(() => {
    // Registrar para notificaciones push (no logueamos el token: es sensible,
    // permite enviarle notificaciones al dispositivo si se filtra en logs)
    notificationService.registerForPushNotificationsAsync().then(token => {
      if (__DEV__) {
        console.log('Token de notificación registrado:', token ? 'OK' : 'no disponible');
      }
    });

    // Listener para notificaciones recibidas
    notificationListener.current = notificationService.addNotificationReceivedListener((notification: Notifications.Notification) => {
      console.log('Notificación recibida:', notification);
    });

    // Listener para cuando el usuario toca la notificación
    responseListener.current = notificationService.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      console.log('Notificación tocada:', response);
      
      const data = response.notification.request.content.data;
      
      // Manejar diferentes tipos de notificaciones
      if (data?.type === 'low_stock') {
        console.log('Stock bajo:', data.productName, data.currentStock);
        // Aquí podrías navegar a la pantalla de admin o mostrar un modal
      } else if (data?.type === 'new_offer') {
        console.log('Nueva oferta:', data.offerTitle);
        // Aquí podrías navegar a la pantalla de ofertas
      } else if (data?.type === 'out_of_stock') {
        console.log('Stock agotado:', data.productName);
        // Aquí podrías navegar a la pantalla de admin
      }
    });

    return () => {
      // Limpiar listeners
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Función para enviar notificación de prueba (solo admin)
  const sendTestNotification = async () => {
    if (user?.email === ADMIN_EMAIL) {
      await notificationService.sendNewOfferNotification(
        'Oferta de Prueba',
        'Esta es una notificación de prueba para verificar el sistema'
      );
    }
  };

  // Función para enviar notificación de stock bajo (solo admin)
  const sendLowStockTest = async () => {
    if (user?.email === ADMIN_EMAIL) {
      await notificationService.sendLowStockNotification('Producto de Prueba', 5);
    }
  };

  return {
    sendTestNotification,
    sendLowStockTest,
  };
}; 