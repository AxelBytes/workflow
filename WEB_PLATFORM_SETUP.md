# 🌐 Plataforma Web Eclipse - Guía Completa de Instalación

## 📋 Contenido

La plataforma web de administración ha sido completamente desarrollada con:

- **Next.js 14** (React App Router)
- **TypeScript** para tipado seguro
- **Tailwind CSS** para estilos
- **Firebase Firestore** para base de datos en tiempo real
- **Zustand** para estado global

---

## 🚀 Instalación y Configuración

### 1. Navegar al directorio web

```bash
cd c:\Users\Lionel.Dev\Desktop\eclipse\project\web
```

### 2. Instalar dependencias (ya hecho)

Las dependencias ya están instaladas. Si necesitas reinstalarlas:

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz de `web/`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCYHixky_tg-768iplpAvu2UVMcfFlIifI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=eclipse-15348.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=eclipse-15348
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=eclipse-15348.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=728527346221
NEXT_PUBLIC_FIREBASE_APP_ID=1:728527346221:web:3dbdc2edbdd94c20f476a4
```

### 4. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

---

## 🔐 Credenciales de Acceso

### Admin Login (único)

Para acceder a la plataforma web como administrador:

**Email**: `admin@eclipse.com`  
**Password**: (Configura en Firebase Authentication)

⚠️ **IMPORTANTE**: Debes crear el usuario admin en Firebase antes de acceder:

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona el proyecto "eclipse-15348"
3. Ve a **Authentication**
4. Crea un nuevo usuario con email `admin@eclipse.com`
5. Establece una contraseña segura
6. En las custom claims del usuario, añade: `{"role": "admin"}`

---

## 📱 Estructura de la Plataforma

### Dashboard (`/dashboard`)
- **Métricas en tiempo real**: Puntos otorgados, canjes, transacciones
- **Tabla de actividad**: Muestra todas las transacciones con filtros por sucursal
- **Actualización cada 2 segundos**: Sincronización automática
- **Filtros**: Sucursal 1, Sucursal 2, o ambas

### Productos (`/products`)
- **Listado completo**: Todos los productos con imagen, precio, stock
- **CRUD completo**: Crear, editar, eliminar productos
- **Campos**:
  - Nombre
  - Descripción
  - Precio ($)
  - Stock
  - Categoría
  - URL de imagen

### Carga de Puntos (`/points`)
- **Búsqueda inteligente**: Autocompletado por nombre, email o teléfono
- **Selección de cliente**: Con vista previa de puntos actuales
- **Tipo de transacción**: Cargar o Canjear
- **Selección de sucursal**: Branch 1 o Branch 2
- **Notas opcionales**: Para comentarios adicionales
- **Registro automático**: Se guarda en la actividad reciente

### Monitoreo (`/monitoring`)
- **Estado en tiempo real**: De todas las cajas POS
- **Por sucursal**: Visualización separada
- **Indicadores de estado**:
  - 🟢 Activa
  - 🔴 Inactiva
  - 🟡 Sin conexión (>5 minutos sin actividad)
- **Información**: Última actividad, estado abierto/cerrado

### Credenciales (`/credentials`)
- **Gestión de cajeros**: Crear, editar, eliminar usuarios
- **Permisos configurables**:
  - Cargar puntos
  - Ver clientes
  - Ver actividad
  - Ver productos
- **Control de acceso**: Activar/desactivar cuentas
- **Asignación por sucursal**: Cada cajero se asigna a una sucursal

---

## 🔄 Sincronización en Tiempo Real

### Firestore Listeners (Web)

La plataforma se suscribe automáticamente a:

```typescript
- Transacciones de puntos (orderBy timestamp, desc)
- Productos
- Cajas activas
- Cajeros
- Clientes
- Métricas del dashboard
```

**Actualización automática**: Cuando cambios en Firestore ocurren, la UI se actualiza automáticamente.

### Datos que se Sincronizan

1. **PointTransactions**
   - ID, Cliente, Email, Puntos, Tipo (load/redeem)
   - Sucursal, Timestamp, Notas

2. **Products**
   - ID, Nombre, Descripción, Precio, Stock
   - Categoría, Imagen, Timestamps

3. **CashierBoxes**
   - ID, Número, Sucursal, Estado
   - Estado abierto/cerrado, Última actividad

4. **Customers**
   - ID, Email, Nombre, Teléfono
   - Puntos totales, Fecha registro

5. **Cashiers**
   - ID, Email, Nombre, Sucursal
   - Permisos, Estado activo, Fecha creación

6. **DashboardMetrics**
   - Total puntos otorgados
   - Total canjes
   - Transacciones hoy
   - Cajas activas

---

## 📂 Estructura de Carpetas

```
web/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Página de login
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Layout con sidebar
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard principal
│   │   ├── products/
│   │   │   └── page.tsx          # Gestión de productos
│   │   ├── points/
│   │   │   └── page.tsx          # Carga de puntos
│   │   ├── monitoring/
│   │   │   └── page.tsx          # Monitoreo de cajas
│   │   └── credentials/
│   │       └── page.tsx          # Gestión de cajeros
│   └── layout.tsx                # Root layout
├── components/
│   ├── common/
│   │   ├── Header.tsx            # Header con logout
│   │   ├── Sidebar.tsx           # Navegación lateral
│   │   └── Providers.tsx         # Auth & Listeners
│   ├── dashboard/
│   │   ├── DashboardMetrics.tsx  # Cards de métricas
│   │   └── ActivityTable.tsx     # Tabla de actividad
│   ├── products/
│   │   └── ProductForm.tsx       # Modal para productos
│   ├── points/
│   │   └── CustomerSearch.tsx    # Búsqueda de clientes
│   ├── monitoring/
│   └── credentials/
├── lib/
│   ├── firebase/
│   │   ├── config.ts             # Configuración Firebase
│   │   ├── firestore.ts          # Servicios CRUD
│   │   └── realtime.ts           # Listeners en tiempo real
│   ├── stores/
│   │   └── app.ts                # Zustand store global
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── utils/
├── public/
│   └── images/
├── .env.local                    # Variables de entorno
└── package.json
```

---

## 🎨 Colores y Tema

```typescript
// Colores principales
Orange: #FF6B35 (Naranja - Marca)
Gray-900: #111827 (Negro)
Gray-100: #F3F4F6 (Gris claro)

// Estados
Green: #10B981 (Activo)
Red: #EF4444 (Inactivo/Error)
Yellow: #F59E0B (Advertencia)
Blue: #3B82F6 (Información)
```

---

## 🔌 Integración con App Móvil

### Base de Datos Compartida

Ambas plataformas usan la misma **Firestore** como fuente única de verdad:

- **Web**: Lee y escribe via Firebase SDK
- **Mobile**: Lee y escribe via Firebase SDK

### Flujo de Sincronización

```
Web: Carga de puntos
  ↓
Firestore: Actualiza transacción
  ↓
Mobile: Listener recibe cambio automáticamente
  ↓
App móvil actualiza UI en tiempo real
```

### Datos Sincronizados

Cualquier cambio en estas colecciones se refleja automáticamente:

✅ Point Transactions  
✅ Products  
✅ Customers  
✅ Cashiers  
✅ Dashboard Metrics  

---

## 🛡️ Seguridad

### Firestore Rules (necesarias en Firebase)

```typescript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo admin puede leer/escribir todo
    match /{document=**} {
      allow read, write: if request.auth.token.role == 'admin';
    }
    
    // Cajeros solo lectura de ciertos documentos
    match /products/{document=**} {
      allow read: if request.auth != null;
    }
    
    match /customers/{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

### Autenticación

- Login con email/password (Firebase Auth)
- Custom claims verifican rol "admin"
- Sesión persistente con tokens Firebase

---

## ⚙️ API Endpoints (próximas fases)

Estos endpoints se pueden crear en `app/api/`:

```typescript
POST /api/create-cashier       // Crear nuevo cajero
POST /api/update-cashier       // Actualizar cajero
POST /api/send-notification    // Notificación web
GET  /api/dashboard-metrics    // Obtener métricas
POST /api/export-report        // Exportar datos
```

---

## 🐛 Troubleshooting

### "Cannot find module '@/components/common/Providers'"

Asegúrate de que el archivo existe en la ruta correcta:
`web/components/common/Providers.tsx`

### Firestore no se actualiza

1. Verifica que las Firestore Rules sean correctas
2. Asegúrate de que los datos existan en Firestore
3. Revisa la consola del navegador para errores
4. Comprueba la conexión a Firebase

### Usuarios no se sincronizan

1. Verifica que los usuarios tengan `role: 'admin'` en custom claims
2. Revisa que la colección `cashiers` exista en Firestore
3. Asegúrate de que los datos se escriban correctamente

---

## 📊 Colecciones Firestore Requeridas

```
eclipse-15348/
├── products/
│   └── {productId}
│       ├── name: string
│       ├── description: string
│       ├── price: number
│       ├── stock: number
│       ├── category: string
│       ├── image: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── pointTransactions/
│   └── {transactionId}
│       ├── customerId: string
│       ├── customerName: string
│       ├── customerEmail: string
│       ├── pointsAmount: number
│       ├── transactionType: 'load' | 'redeem'
│       ├── branch: 'branch1' | 'branch2'
│       ├── cashierId: string
│       ├── timestamp: timestamp
│       └── notes?: string
│
├── customers/
│   └── {customerId}
│       ├── email: string
│       ├── name: string
│       ├── phone: string
│       ├── totalPoints: number
│       └── registeredAt: timestamp
│
├── cashiers/
│   └── {cashierId}
│       ├── email: string
│       ├── name: string
│       ├── branch: 'branch1' | 'branch2'
│       ├── permissions: {}
│       ├── isActive: boolean
│       ├── createdAt: timestamp
│       └── createdBy: string
│
├── cashierBoxes/
│   └── {boxId}
│       ├── boxNumber: number
│       ├── branch: 'branch1' | 'branch2'
│       ├── status: 'active' | 'inactive' | 'offline'
│       ├── assignedCashierId: string
│       ├── lastActivityAt: timestamp
│       └── isOpen: boolean
│
└── dashboardMetrics/
    └── {metricId}
        ├── totalPointsLoaded: number
        ├── totalPointsRedeemed: number
        ├── activeTransactionsToday: number
        ├── activeBoxes: number
        └── customersRegisteredToday: number
```

---

## ✅ Checklist de Implementación

- [x] Setup Next.js
- [x] Firebase Firestore Integration
- [x] Admin Login
- [x] Dashboard con métricas y tabla de actividad
- [x] Gestión de productos (CRUD)
- [x] Sistema de carga de puntos
- [x] Búsqueda inteligente de clientes
- [x] Monitoreo de cajas en tiempo real
- [x] Gestión de credenciales de cajeros
- [x] Sincronización en tiempo real (Firestore)
- [ ] API endpoints (próxima fase)
- [ ] WebSocket para notificaciones en vivo (próxima fase)
- [ ] Integración móvil completa (próxima fase)

---

## 🚀 Próximas Mejoras

1. **Cloud Functions**: Automatizar cálculos de métricas
2. **Reportes**: Exportar datos en Excel/PDF
3. **Gráficos**: Dashboard con Charts.js o Recharts
4. **Notificaciones**: Email/SMS para eventos
5. **Mobile App Integration**: API REST completa
6. **Analytics**: Seguimiento de eventos
7. **Multi-idioma**: Soporte para múltiples idiomas

---

## 📞 Soporte

Para problemas o dudas, revisa:

1. Consola del navegador (F12)
2. Logs de Firebase
3. Estado de Firestore Rules
4. Verificar variables de entorno

¡La plataforma web está lista para usar! 🎉
