/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Inicializar Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// ============================================================================
// FUNCIÓN 1: Notificación automática cuando se crea una nueva oferta
// ============================================================================
export const onNewPromotion = functions.firestore
  .document('promotions/{promotionId}')
  .onCreate(async (snap, context) => {
    try {
      const promotion = snap.data();
      
      if (!promotion || !promotion.isActive) {
        console.log('Promoción inactiva o no válida');
        return;
      }

      console.log('Nueva promoción creada:', promotion.title);

      // Obtener todos los tokens activos
      const tokensSnapshot = await db.collection('pushTokens')
        .where('isActive', '==', true)
        .get();

      if (tokensSnapshot.empty) {
        console.log('No hay tokens activos para enviar notificaciones');
        return;
      }

      const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
      console.log(`Enviando notificación a ${tokens.length} usuarios`);

      // Preparar mensaje de notificación
      const message = {
        notification: {
          title: '🎉 ¡Nueva Oferta en Eclipse!',
          body: `${promotion.title}: ${promotion.description}`,
        },
        data: {
          type: 'new_promotion',
          promotionId: context.params.promotionId,
          title: promotion.title,
          description: promotion.description,
          timestamp: new Date().toISOString(),
        },
        tokens: tokens,
      };

      // Enviar notificación usando FCM
      const response = await admin.messaging().sendMulticast(message);
      
      console.log(`Notificación enviada exitosamente: ${response.successCount}/${tokens.length}`);
      
      // Registrar estadísticas
      await db.collection('notificationStats').add({
        type: 'new_promotion',
        promotionId: context.params.promotionId,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        totalTokens: tokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

    } catch (error) {
      console.error('Error al enviar notificación de nueva promoción:', error);
    }
  });

// ============================================================================
// FUNCIÓN 2: Notificación automática cuando el stock está bajo
// ============================================================================
export const onLowStock = functions.firestore
  .document('products/{productId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      
      // Verificar si el stock bajó del umbral
      if (after.stock > before.lowStockThreshold || after.stock > after.lowStockThreshold) {
        return; // Stock no está bajo
      }

      if (after.stock <= after.lowStockThreshold && after.stock > 0) {
        console.log(`Stock bajo detectado para: ${after.name} (${after.stock} unidades)`);

        // Obtener tokens del admin
        const adminTokensSnapshot = await db.collection('pushTokens')
          .where('email', '==', 'admin@eclipse.com')
          .where('isActive', '==', true)
          .get();

        if (adminTokensSnapshot.empty) {
          console.log('No se encontraron tokens del admin');
          return;
        }

        const adminTokens = adminTokensSnapshot.docs.map(doc => doc.data().token);

        // Enviar notificación al admin
        const message = {
          notification: {
            title: '⚠️ Stock Bajo - Eclipse',
            body: `El producto "${after.name}" tiene solo ${after.stock} unidades disponibles.`,
          },
          data: {
            type: 'low_stock',
            productId: context.params.productId,
            productName: after.name,
            currentStock: after.stock.toString(),
            threshold: after.lowStockThreshold.toString(),
            timestamp: new Date().toISOString(),
          },
          tokens: adminTokens,
        };

        const response = await admin.messaging().sendMulticast(message);
        console.log(`Notificación de stock bajo enviada: ${response.successCount}/${adminTokens.length}`);

      } else if (after.stock <= 0 && before.stock > 0) {
        console.log(`Stock agotado para: ${after.name}`);

        // Obtener tokens del admin
        const adminTokensSnapshot = await db.collection('pushTokens')
          .where('email', '==', 'admin@eclipse.com')
          .where('isActive', '==', true)
          .get();

        if (adminTokensSnapshot.empty) {
          console.log('No se encontraron tokens del admin');
          return;
        }

        const adminTokens = adminTokensSnapshot.docs.map(doc => doc.data().token);

        // Enviar notificación de stock agotado al admin
        const message = {
          notification: {
            title: '❌ Stock Agotado - Eclipse',
            body: `El producto "${after.name}" se ha agotado completamente.`,
          },
          data: {
            type: 'out_of_stock',
            productId: context.params.productId,
            productName: after.name,
            timestamp: new Date().toISOString(),
          },
          tokens: adminTokens,
        };

        const response = await admin.messaging().sendMulticast(message);
        console.log(`Notificación de stock agotado enviada: ${response.successCount}/${adminTokens.length}`);
      }

    } catch (error) {
      console.error('Error al procesar notificación de stock:', error);
    }
  });

// ============================================================================
// FUNCIÓN 3: Limpiar tokens inactivos automáticamente (cada semana)
// ============================================================================
export const cleanupInactiveTokens = functions.pubsub
  .schedule('every 7 days')
  .onRun(async (context) => {
    try {
      console.log('Iniciando limpieza de tokens inactivos...');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const inactiveTokensSnapshot = await db.collection('pushTokens')
        .where('isActive', '==', false)
        .where('updatedAt', '<', thirtyDaysAgo)
        .get();

      if (inactiveTokensSnapshot.empty) {
        console.log('No hay tokens inactivos para limpiar');
        return;
      }

      const batch = db.batch();
      inactiveTokensSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`${inactiveTokensSnapshot.docs.length} tokens inactivos eliminados`);

    } catch (error) {
      console.error('Error al limpiar tokens inactivos:', error);
    }
  });

// ============================================================================
// FUNCIÓN 4: Generar reporte de ventas automático (cada día)
// ============================================================================
export const generateDailySalesReport = functions.pubsub
  .schedule('every day 00:00')
  .onRun(async (context) => {
    try {
      console.log('Generando reporte de ventas diario...');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Aquí puedes agregar lógica para generar reportes
      // Por ejemplo, contar productos vendidos, calcular ingresos, etc.
      
      const report = {
        date: yesterday,
        totalProducts: 0,
        totalRevenue: 0,
        lowStockProducts: 0,
        activePromotions: 0,
        registeredUsers: 0,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Guardar reporte en Firestore
      await db.collection('dailyReports').add(report);
      
      console.log('Reporte diario generado exitosamente');

    } catch (error) {
      console.error('Error al generar reporte diario:', error);
    }
  });

// ============================================================================
// FUNCIÓN 5: Notificación de bienvenida cuando se registra un usuario
// ============================================================================
export const onUserRegistration = functions.auth
  .user()
  .onCreate(async (user) => {
    try {
      console.log('Nuevo usuario registrado:', user.email);

      // Guardar información de bienvenida
      await db.collection('welcomeMessages').add({
        userId: user.uid,
        email: user.email,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        message: 'Bienvenido a Eclipse - Tu supermercado de confianza',
      });

      console.log('Mensaje de bienvenida procesado para:', user.email);

    } catch (error) {
      console.error('Error al procesar registro de usuario:', error);
    }
  });

// ============================================================================
// FUNCIÓN 6: Actualizar estadísticas cuando se actualiza un token
// ============================================================================
export const onTokenUpdate = functions.firestore
  .document('pushTokens/{tokenId}')
  .onWrite(async (change, context) => {
    try {
      // Calcular estadísticas actualizadas
      const statsSnapshot = await db.collection('pushTokens').get();
      const totalTokens = statsSnapshot.size;
      const activeTokens = statsSnapshot.docs.filter(doc => doc.data().isActive).length;

      // Actualizar estadísticas globales
      await db.collection('globalStats').doc('notifications').set({
        totalUsers: totalTokens,
        activeUsers: activeTokens,
        inactiveUsers: totalTokens - activeTokens,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Estadísticas actualizadas: ${activeTokens}/${totalTokens} usuarios activos`);

    } catch (error) {
      console.error('Error al actualizar estadísticas:', error);
    }
  });

// ============================================================================
// FUNCIÓN 7: Validar datos antes de guardar (seguridad)
// ============================================================================
export const validateProductData = functions.firestore
  .document('products/{productId}')
  .onWrite(async (change, context) => {
    try {
      const after = change.after.exists ? change.after.data() : null;
      
      if (!after) return; // Documento eliminado

      // Validar que el precio sea positivo
      if (after.price <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      // Validar que el stock no sea negativo
      if (after.stock < 0) {
        throw new Error('El stock no puede ser negativo');
      }

      // Validar que el umbral de stock bajo sea razonable
      if (after.lowStockThreshold < 0 || after.lowStockThreshold > 1000) {
        throw new Error('El umbral de stock bajo debe estar entre 0 y 1000');
      }

      console.log('Datos del producto validados correctamente');

    } catch (error) {
      console.error('Error de validación:', error);
      // Aquí podrías enviar una notificación al admin sobre el error
    }
  });
