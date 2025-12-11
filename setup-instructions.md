# Eclipse Minimercado - Setup Local

## 1. Crear nuevo proyecto Expo
```bash
npx create-expo-app@latest eclipse-minimercado --template blank-typescript
cd eclipse-minimercado
```

## 2. Instalar dependencias
```bash
npm install @expo-google-fonts/inter @expo/vector-icons @lucide/lab @react-native-async-storage/async-storage @react-navigation/bottom-tabs @react-navigation/material-top-tabs @react-navigation/native @supabase/supabase-js expo-blur expo-camera expo-constants expo-font expo-haptics expo-linear-gradient expo-linking expo-router expo-secure-store expo-splash-screen expo-status-bar expo-symbols expo-system-ui expo-web-browser lucide-react-native react-native-gesture-handler react-native-modal react-native-pager-view react-native-reanimated react-native-safe-area-context react-native-screens react-native-svg react-native-url-polyfill react-native-vector-icons react-native-web react-native-webview zustand
```

## 3. Configurar app.json
```json
{
  "expo": {
    "name": "Eclipse Minimercado",
    "slug": "eclipse-minimercado",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": ["expo-router", "expo-font", "expo-web-browser"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

## 4. Copiar archivos del proyecto
- Copia todos los archivos de la carpeta `app/`
- Copia el archivo `store/cartStore.ts`
- Copia el archivo `hooks/useFrameworkReady.ts`
- Actualiza `package.json` con las dependencias mostradas

## 5. Ejecutar el proyecto
```bash
npx expo start
```

## Estructura de archivos a crear:
```
eclipse-minimercado/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── catalog.tsx
│   │   ├── cart.tsx
│   │   └── profile.tsx
│   ├── checkout/
│   │   └── index.tsx
│   ├── order-confirmation/
│   │   └── index.tsx
│   ├── _layout.tsx
│   └── +not-found.tsx
├── store/
│   └── cartStore.ts
├── hooks/
│   └── useFrameworkReady.ts
└── package.json
```

## Próximos pasos para producción:
1. Configurar Firebase (Auth, Firestore, Storage)
2. Integrar Mercado Pago SDK
3. Configurar notificaciones push
4. Optimizar imágenes y assets
5. Testing en dispositivos reales
6. Build para App Store y Google Play