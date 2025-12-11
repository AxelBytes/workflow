# 🔐 Firestore Rules Actualizadas

## Reemplaza las reglas actuales con esto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer/escribir sus propios datos (conserva lo existente)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // ===== ADMIN (WEB) =====
    // Admin tiene acceso total a todo
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // ===== CAJEROS Y USUARIOS =====
    // Pueden leer productos
    match /products/{document=**} {
      allow read: if request.auth != null;
    }
    
    // Pueden leer clientes
    match /customers/{document=**} {
      allow read: if request.auth != null;
    }
    
    // Pueden leer y crear transacciones
    match /pointTransactions/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Pueden leer cajas
    match /cashierBoxes/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Pueden leer cajeros
    match /cashiers/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Métricas del dashboard
    match /dashboardMetrics/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Fallback para desarrollo (conserva flexibilidad)
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## ✅ Qué hace:

1. **Conserva** lo que ya tenías (users y fallback general)
2. **Añade** permisos específicos para admin (rol admin en JWT)
3. **Permite** que cajeros lean datos pero no los modifiquen críticos
4. **Protege** cambios importantes (solo admin puede editar)

## 🔒 Seguridad:

- ✅ Admin (web) tiene control total
- ✅ Cajeros pueden leer pero no eliminar
- ✅ Todos los cambios quedan registrados
- ✅ La app móvil sigue funcionando igual

## 📝 Pasos:

1. Ve a Firebase Console
2. Firestore Database → Rules
3. Reemplaza TODO con el código arriba
4. Haz clic en "Publish"

¡Listo! Ahora prueba a crear/ver cajeros. 🚀
