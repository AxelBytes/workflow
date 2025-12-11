# 🔧 SOLUCIÓN RÁPIDA - Error de Credenciales Firebase

## El Problema

Cuando intentas crear un cajero, ves este error:

```
Could not load the default credentials. Browse to 
https://cloud.google.com/docs/authentication/getting-started 
for more information.
```

**Causa**: El archivo `firebase-service-account.json` no está en el lugar correcto o no existe.

---

## ✅ SOLUCIÓN (3 Pasos Simples)

### **Paso 1: Verifica dónde estás parado**

Abre PowerShell y escribe:

```bash
cd c:\Users\Lionel.Dev\Desktop\eclipse\project\web
```

### **Paso 2: Ejecuta el verificador**

Esto te dirá si el archivo existe o dónde buscarlo:

```bash
node verify-credentials.js
```

**Si ves ✅ Archivo encontrado** → Ve al Paso 3  
**Si ves ❌ Archivo NO encontrado** → Sigue las instrucciones de abajo

### **Paso 2b: Si no encuentras el archivo**

1. Ve a Firebase Console: https://console.firebase.google.com
2. Proyecto: `eclipse-15348`
3. ⚙️ (esquina inferior izquierda) → **Project Settings**
4. Pestaña **Service Accounts**
5. Haz clic en **"Generate New Private Key"** (botón rojo)
6. Se descargará un archivo (name: `eclipse-15348-xxx.json`)

**IMPORTANTE**: 
- Renómbralo a: `firebase-service-account.json`
- Muévelo a: `c:\Users\Lionel.Dev\Desktop\eclipse\project\web\`

### **Paso 3: Reinicia el servidor**

```bash
# Primero detén el servidor actual (Ctrl+C)

# Luego ejecuta:
npm run dev
```

Deberías ver en la consola:
```
[Firebase Admin] Buscando credenciales en: ...
[Firebase Admin] ✓ Archivo encontrado, inicializando...
[Firebase Admin] ✓ Inicializado correctamente
```

---

## 🎯 Ahora debería funcionar

1. http://localhost:3000/credentials
2. "Nuevo Cajero"
3. Completa los datos
4. "Guardar"
5. ¡Recibirás credenciales reales!

---

## 🆘 Si AÚN ves error después de esto

### **Opción A: Borra caché y reinicia**

```bash
# En PowerShell, en la carpeta web/
rm -r .next
npm run dev
```

### **Opción B: Verifica permisos del archivo**

El archivo debe tener permisos de lectura. En PowerShell:

```bash
# Navega a web/
cd c:\Users\Lionel.Dev\Desktop\eclipse\project\web

# Lista archivos
ls

# Deberías ver: firebase-service-account.json
```

### **Opción C: Verifica el contenido del JSON**

El archivo debe ser válido JSON. Abre con notepad:

```bash
notepad firebase-service-account.json
```

Debe verse como:
```json
{
  "type": "service_account",
  "project_id": "eclipse-15348",
  "private_key_id": "...",
  "private_key": "...",
  ...
}
```

Si ve garbar (caracteres raros), el archivo está corrupto. Descarga uno nuevo.

---

## 📋 Estructura Correcta

```
c:\Users\Lionel.Dev\Desktop\eclipse\project\web\
├── firebase-service-account.json  ← ¡AQUÍ!
├── .env.local
├── next.config.ts
├── app/
├── components/
├── lib/
├── public/
├── verify-credentials.js
└── ...
```

---

## ✨ Verificación Final

Ejecuta esto para confirmar que todo está OK:

```bash
node verify-credentials.js
```

Si ves:
```
✅ ¡Archivo encontrado!
Proyecto: eclipse-15348
...
✨ Las credenciales están configuradas correctamente.
```

¡Ya está listo! 🎉

Si aún ves error en la web, abre la consola (F12) y dime el mensaje exacto de error.
