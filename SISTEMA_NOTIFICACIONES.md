# 🚀 Sistema de Notificaciones Eclipse - Guía Completa

## 📋 Resumen del Sistema

Hemos implementado un **sistema completo de notificaciones push** que funciona **100% gratis** sin necesidad de tarjetas de crédito. El sistema incluye:

✅ **Notificaciones automáticas** cuando creas ofertas  
✅ **Alertas de stock bajo** para el admin  
✅ **Notificaciones de bienvenida** para nuevos usuarios  
✅ **Panel de admin** con estadísticas en tiempo real  
✅ **Servidor local** que puedes ejecutar en tu computadora  
✅ **Limpieza automática** de tokens inactivos  

---

## 🛠️ Cómo Usar el Sistema

### **PASO 1: Iniciar el Servidor de Notificaciones**

```bash
# Navegar al directorio del servidor
cd notification-server

# Instalar dependencias (solo la primera vez)
npm install

# Iniciar el servidor
npm start
```

El servidor se iniciará en `http://localhost:3001`

### **PASO 2: Probar la App**

```bash
# En otra terminal, navegar al proyecto principal
cd project

# Iniciar la app
npx expo start
```

### **PASO 3: Probar las Notificaciones**

1. **Registra un usuario** en la app
2. **Inicia sesión como admin** (`admin@eclipse.com`)
3. **Ve al panel de admin** y prueba las notificaciones
4. **Verifica que lleguen** a tu dispositivo

---

## 📱 Funcionalidades del Sistema

### **Para Usuarios Normales:**
- ✅ Reciben notificaciones de nuevas ofertas automáticamente
- ✅ Reciben notificación de bienvenida al registrarse
- ✅ Pueden desactivar notificaciones desde la app

### **Para el Admin:**
- ✅ Panel completo con estadísticas en tiempo real
- ✅ Envío de notificaciones de prueba
- ✅ Alertas automáticas de stock bajo
- ✅ Limpieza de tokens inactivos
- ✅ Historial de notificaciones enviadas

### **Automático:**
- ✅ Notificaciones cuando se crean ofertas
- ✅ Alertas cuando el stock está bajo
- ✅ Limpieza semanal de tokens inactivos
- ✅ Registro automático de tokens al iniciar sesión

---

## 🔧 Configuración Avanzada

### **Cambiar URL del Servidor**

Si quieres usar un servidor en la nube (gratis), edita:

```typescript
// En lib/pushNotifications.ts
const NOTIFICATION_SERVER_URL = 'https://tu-servidor.com';
```

### **Opciones Gratuitas de Hosting:**

1. **Render.com** - Gratis para siempre
2. **Railway.app** - $5 de crédito gratis
3. **Vercel** - Gratis para siempre
4. **Netlify** - Gratis para siempre

### **Configurar para Producción:**

1. Sube el código del servidor a GitHub
2. Conecta con Render/Railway/Vercel
3. Cambia la URL en la app
4. ¡Listo!

---

## 📊 API del Servidor

### **Endpoints Disponibles:**

```
POST /api/register-token
POST /api/deactivate-token  
POST /api/send-notification
POST /api/send-notification-to-user
GET  /api/stats
POST /api/cleanup-tokens
```

### **Ejemplo de Uso:**

```javascript
// Registrar token
fetch('http://localhost:3001/api/register-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'ExponentPushToken[...]',
    email: 'usuario@email.com',
    isActive: true
  })
});

// Enviar notificación
fetch('http://localhost:3001/api/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '¡Nueva Oferta!',
    body: 'Descubre nuestras increíbles ofertas',
    data: { type: 'promotion' }
  })
});
```

---

## 🎯 Casos de Uso

### **1. Nueva Oferta Creada**
```javascript
// Automático cuando creas una oferta
await pushNotificationService.sendNewPromotionNotification(
  'Oferta Especial',
  '50% de descuento en productos seleccionados',
  'promotion-123'
);
```

### **2. Stock Bajo**
```javascript
// Automático cuando el stock baja
await pushNotificationService.sendLowStockNotification(
  'Leche Deslactosada',
  5, // stock actual
  10 // umbral mínimo
);
```

### **3. Notificación Personalizada**
```javascript
// Desde el panel de admin
await pushNotificationService.sendNotificationToAll(
  '🎉 ¡Oferta Flash!',
  'Solo por hoy, 30% de descuento en toda la tienda',
  { type: 'flash_sale' }
);
```

---

## 🔍 Solución de Problemas

### **El servidor no inicia:**
```bash
# Verificar que Node.js esté instalado
node --version

# Reinstalar dependencias
cd notification-server
rm -rf node_modules
npm install
```

### **Las notificaciones no llegan:**
1. Verificar que el servidor esté corriendo
2. Verificar permisos de notificación en el dispositivo
3. Verificar que el token se registre correctamente
4. Revisar logs del servidor

### **Error de conexión:**
1. Verificar que la URL del servidor sea correcta
2. Verificar que el puerto 3001 esté disponible
3. Verificar firewall/antivirus

---

## 📈 Estadísticas Disponibles

El sistema te proporciona:

- **Usuarios únicos** registrados
- **Dispositivos activos** con notificaciones
- **Notificaciones enviadas** (éxito/fallo)
- **Historial** de las últimas 10 notificaciones
- **Tokens inactivos** para limpiar

---

## 🚀 Próximos Pasos

1. **Probar el sistema** localmente
2. **Deployar el servidor** a un hosting gratuito
3. **Configurar notificaciones automáticas** para eventos específicos
4. **Personalizar mensajes** según tu marca
5. **Agregar más estadísticas** si las necesitas

---

## 💡 Tips Importantes

- **El servidor debe estar corriendo** para que funcionen las notificaciones
- **Los tokens se registran automáticamente** cuando los usuarios inician sesión
- **Las notificaciones son instantáneas** una vez configurado
- **Puedes enviar notificaciones** desde cualquier parte de la app
- **El sistema es escalable** y puede manejar miles de usuarios

---

## 🎉 ¡Listo!

Tu sistema de notificaciones está **100% funcional** y **completamente gratis**. 

**¿Qué puedes hacer ahora?**
1. Probar las notificaciones
2. Personalizar los mensajes
3. Deployar a producción
4. Agregar más funcionalidades

**¿Necesitas ayuda?** Revisa los logs del servidor o los errores en la consola de la app. 