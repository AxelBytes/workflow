# 🔧 Configurar Firebase Admin SDK para Crear Cajeros Reales

## ¿Qué es esto?

Antes, cuando creabas un cajero en la web, **solo se guardaba en Firestore** pero no creaba un usuario real en Firebase Authentication. Ahora, con los endpoints que acabo de crear, **crea usuarios REALES** que pueden iniciar sesión.

---

## 🚀 Pasos para Configurar (PASO A PASO)

### **Paso 1: Descargar Service Account JSON**

1. Ve a Firebase Console: https://console.firebase.google.com
2. Selecciona proyecto **"eclipse-15348"**
3. Haz clic en el engranaje ⚙️ (abajo a la izquierda)
4. Selecciona **"Project Settings"**
5. Ve a la pestaña **"Service Accounts"** (la tercera pestaña)
6. Selecciona **"Firebase Admin SDK"**
7. Haz clic en el botón **"Generate New Private Key"** (en rojo)
8. Se descargará un archivo llamado algo como: `eclipse-15348-xxxxx.json`

### **Paso 2: Guardar el archivo en la carpeta web**

1. El archivo que descargaste tiene un nombre largo
2. **Renómbralo a**: `firebase-service-account.json`
3. **Muévelo a**: `c:\Users\Lionel.Dev\Desktop\eclipse\project\web\`
   - Esto es importante: debe estar en la carpeta `web`, no en la raíz

**Estructura correcta:**
```
project/
├── web/
│   ├── firebase-service-account.json ← AQUÍ
│   ├── .env.local
│   ├── next.config.ts
│   └── ... otros archivos
├── (other folders)
```

### **Paso 3: Verificar .env.local**

Abre `web/.env.local` y asegúrate de que tenga EXACTAMENTE esto:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCYHixky_tg-768iplpAvu2UVMcfFlIifI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=eclipse-15348.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=eclipse-15348
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=eclipse-15348.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=728527346221
NEXT_PUBLIC_FIREBASE_APP_ID=1:728527346221:web:3dbdc2edbdd94c20f476a4
NEXT_PUBLIC_MEASUREMENT_ID=G-QRSX3PKQQL
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

### **Paso 4: Añadir .gitignore**

Para que NO subas el archivo de credenciales a Git, abre `web/.gitignore` y verifica que tenga:

```
firebse-service-account.json
.env.local
```

### **Paso 5: Reinicia el servidor**

Detén el servidor (Ctrl+C) y vuelve a iniciarlo:

```bash
cd c:\Users\Lionel.Dev\Desktop\eclipse\project\web
npm run dev
```

Deberías ver:
```
✓ Ready in XXXms
- Local: http://localhost:3000
```

---

## ✅ Cómo Usar

Ahora que está configurado:

### **Crear un Cajero Real:**

1. Ve a http://localhost:3000/credentials
2. Haz clic en **"Nuevo Cajero"**
3. Completa los datos:
   - **Nombre**: Juan Pérez
   - **Email**: juan.perez@eclipse.com
   - **Sucursal**: Sucursal 1
   - **Permisos**: Los que quieras
4. Haz clic en **"Guardar"**

**¿Qué sucede?**
- ✅ Se crea un usuario REAL en Firebase Auth
- ✅ Se asignan los permisos (custom claims)
- ✅ Se guarda en Firestore
- ✅ Se muestra una contraseña temporal

### **Resultado:**

Aparecerá un popup con:
```
✅ Cajero creado exitosamente!

Email: juan.perez@eclipse.com
Contraseña temporal: 8xKz9m2P

⚠️ El cajero debe cambiar la contraseña al primer inicio de sesión.
```

**Ahora el cajero PUEDE INICIAR SESIÓN** en la plataforma (o en la app móvil si la configuras).

---

## 🔐 Activar/Desactivar Cajeros

En la tabla de cajeros, verás dos botones:

- **✏️ Editar**: Cambiar nombre, sucursal, permisos
- **❌ Desactivar** (si está activo): El usuario no puede iniciar sesión
- **✅ Activar** (si está inactivo): El usuario puede volver a iniciar sesión

---

## 🐛 Troubleshooting

### "Error: GOOGLE_APPLICATION_CREDENTIALS not found"

**Solución:**
1. Verifica que `firebase-service-account.json` esté en la carpeta `web/`
2. Verifica que la ruta en `.env.local` sea correcta
3. Reinicia el servidor (`npm run dev`)

### "Error: credential_type invalid"

**Solución:**
- El JSON descargado está corrupto
- Descarga uno nuevo desde Firebase Console

### "Error creating cashier: Email already exists"

**Solución:**
- El email ya está registrado en Firebase
- Usa un email diferente

### "The user can't login after I create them"

**Solución:**
1. Verifica que el usuario esté **activo** (verde en la tabla)
2. Verifica que esté usando el email y contraseña correctos
3. Verifica que tenga custom claim `role: cashier`

---

## 📱 Resultado Final

Con esto configurado, ahora:

✅ Puedes crear cajeros reales desde la web  
✅ Cada cajero recibe credenciales únicas  
✅ Pueden iniciar sesión en la web o móvil  
✅ Sus acciones se sincronizan en tiempo real  
✅ Puedes activar/desactivar acceso sin eliminarlos  

---

## 🔄 Integración con App Móvil

Si tu app móvil tiene un login de cajero, ahora puedes usarla:

```typescript
// En la app móvil, el cajero hace login así:
const { user } = await signInWithEmailAndPassword(
  auth,
  'juan.perez@eclipse.com',
  '8xKz9m2P' // (después cambia esta contraseña)
);

// El custom claim 'role: cashier' se valida automáticamente
// Y los permisos se cargan desde Firestore
```

---

**¡Ya estás listo! Ahora crea cajeros reales, no simulados.** ✅

Si algo no funciona, revisa la consola del navegador (F12) para ver errores específicos.
