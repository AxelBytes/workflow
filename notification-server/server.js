const express = require('express');
const cors = require('cors');
const { Expo } = require('expo-server-sdk');

const app = express();
const expo = new Expo();

// Middleware
app.use(cors());
app.use(express.json());

// Almacenamiento simple en memoria (en producción usarías una base de datos)
let pushTokens = [];
let notifications = [];

// ============================================================================
// RUTAS DE LA API
// ============================================================================

// 1. Registrar token de notificación
app.post('/api/register-token', (req, res) => {
  try {
    const { token, email, isActive = true } = req.body;
    
    if (!Expo.isExpoPushToken(token)) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    // Verificar si el token ya existe
    const existingTokenIndex = pushTokens.findIndex(t => t.token === token);
    
    if (existingTokenIndex >= 0) {
      // Actualizar token existente
      pushTokens[existingTokenIndex] = {
        ...pushTokens[existingTokenIndex],
        email,
        isActive,
        updatedAt: new Date()
      };
    } else {
      // Agregar nuevo token
      pushTokens.push({
        token,
        email,
        isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log(`Token registrado: ${email} - ${token.substring(0, 20)}...`);
    res.json({ success: true, message: 'Token registrado exitosamente' });
    
  } catch (error) {
    console.error('Error al registrar token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 2. Desactivar token
app.post('/api/deactivate-token', (req, res) => {
  try {
    const { token } = req.body;
    
    const tokenIndex = pushTokens.findIndex(t => t.token === token);
    if (tokenIndex >= 0) {
      pushTokens[tokenIndex].isActive = false;
      pushTokens[tokenIndex].updatedAt = new Date();
      console.log(`Token desactivado: ${token.substring(0, 20)}...`);
    }
    
    res.json({ success: true, message: 'Token desactivado' });
    
  } catch (error) {
    console.error('Error al desactivar token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 3. Enviar notificación a todos los usuarios
app.post('/api/send-notification', async (req, res) => {
  try {
    const { title, body, data = {} } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Título y cuerpo son requeridos' });
    }

    // Obtener tokens activos
    const activeTokens = pushTokens.filter(t => t.isActive);
    
    if (activeTokens.length === 0) {
      return res.json({ success: true, message: 'No hay usuarios activos para notificar' });
    }

    // Crear mensajes
    const messages = activeTokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    }));

    // Enviar notificaciones
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error al enviar chunk:', error);
      }
    }

    // Guardar notificación en historial
    notifications.push({
      title,
      body,
      data,
      sentAt: new Date(),
      totalTokens: activeTokens.length,
      successCount: tickets.filter(t => t.status === 'ok').length,
      failureCount: tickets.filter(t => t.status === 'error').length
    });

    console.log(`Notificación enviada: ${title} - ${activeTokens.length} usuarios`);
    
    res.json({
      success: true,
      message: 'Notificación enviada',
      stats: {
        totalTokens: activeTokens.length,
        successCount: tickets.filter(t => t.status === 'ok').length,
        failureCount: tickets.filter(t => t.status === 'error').length
      }
    });
    
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 4. Enviar notificación a usuario específico
app.post('/api/send-notification-to-user', async (req, res) => {
  try {
    const { email, title, body, data = {} } = req.body;
    
    if (!email || !title || !body) {
      return res.status(400).json({ error: 'Email, título y cuerpo son requeridos' });
    }

    // Buscar tokens del usuario
    const userTokens = pushTokens.filter(t => t.email === email && t.isActive);
    
    if (userTokens.length === 0) {
      return res.json({ success: true, message: 'Usuario no encontrado o sin tokens activos' });
    }

    // Crear mensajes
    const messages = userTokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    }));

    // Enviar notificaciones
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error al enviar chunk:', error);
      }
    }

    console.log(`Notificación enviada a ${email}: ${title}`);
    
    res.json({
      success: true,
      message: 'Notificación enviada al usuario',
      stats: {
        userEmail: email,
        totalTokens: userTokens.length,
        successCount: tickets.filter(t => t.status === 'ok').length,
        failureCount: tickets.filter(t => t.status === 'error').length
      }
    });
    
  } catch (error) {
    console.error('Error al enviar notificación al usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 5. Obtener estadísticas
app.get('/api/stats', (req, res) => {
  try {
    const totalTokens = pushTokens.length;
    const activeTokens = pushTokens.filter(t => t.isActive).length;
    const inactiveTokens = totalTokens - activeTokens;
    
    // Agrupar por email
    const usersByEmail = {};
    pushTokens.forEach(token => {
      if (!usersByEmail[token.email]) {
        usersByEmail[token.email] = 0;
      }
      if (token.isActive) {
        usersByEmail[token.email]++;
      }
    });

    res.json({
      totalTokens,
      activeTokens,
      inactiveTokens,
      uniqueUsers: Object.keys(usersByEmail).length,
      usersByEmail,
      recentNotifications: notifications.slice(-10) // Últimas 10 notificaciones
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 6. Limpiar tokens inactivos (más de 30 días)
app.post('/api/cleanup-tokens', (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const beforeCount = pushTokens.length;
    pushTokens = pushTokens.filter(token => {
      return token.isActive || token.updatedAt > thirtyDaysAgo;
    });
    const afterCount = pushTokens.length;
    
    console.log(`Limpieza completada: ${beforeCount - afterCount} tokens eliminados`);
    
    res.json({
      success: true,
      message: 'Limpieza completada',
      removedCount: beforeCount - afterCount
    });
    
  } catch (error) {
    console.error('Error en limpieza:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============================================================================
// INICIALIZAR SERVIDOR
// ============================================================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor de notificaciones iniciado en puerto ${PORT}`);
  console.log(`📱 API disponible en: http://localhost:${PORT}`);
  console.log(`📊 Estadísticas: http://localhost:${PORT}/api/stats`);
});

module.exports = app; 