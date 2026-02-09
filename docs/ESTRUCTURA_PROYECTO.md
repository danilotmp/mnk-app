# 📁 Estructura del Proyecto MNK-App

## 🎯 Diferencia Clave: `app/` vs `src/features/`

### **`app/` - SOLO para Rutas (Expo Router)**

La carpeta `app/` es **especial** en Expo Router. Se usa **SOLO** para definir rutas (URLs) mediante file-based routing.

**Regla de oro:** Los archivos en `app/` deben ser **wrappers delgados** de máximo 5-10 líneas que solo importan el screen correspondiente.

**Ejemplo:**
```typescript
// app/security/users/index.tsx (SOLO 5 líneas)
import { UsersListScreen } from '@/src/features/security/users/screens/users-list.screen';

export default function UsersListPage() {
  return <UsersListScreen />;
}
```

**NO debe contener:**
- ❌ Lógica de negocio
- ❌ Estado complejo
- ❌ Hooks personalizados
- ❌ Componentes grandes

---

### **`src/features/` - TODO el Código Real**

Esta es la carpeta donde vive **TODA** la lógica de la aplicación, siguiendo la arquitectura propuesta.

**Estructura por funcionalidad:**
```
src/features/security/users/
├── adapters/          # Transformación API → Dominio
├── components/        # Componentes específicos (formularios, modales)
├── screens/           # Componentes contenedores (equivalente a "paginas" en Angular)
├── services/          # Servicios de negocio (SSOT)
├── types/            # Tipos de dominio y API (equivalente a "interfaces")
│   ├── domain/       # Modelos de negocio puros
│   └── api/          # Contratos de API (DTOs)
└── hooks/            # Hooks personalizados (equivalente a "utilidades")
```

---

## 📊 Comparación: Angular vs React Native/Expo

### **Angular (Imagen de referencia):**
```
src/app/
├── adaptadores/      # Generales para toda la app
├── componentes/      # Generales (table, input, etc.)
├── interfaces/       # Generales
├── paginas/          # Módulos por dominio
│   ├── ventas/
│   │   ├── adaptadores/    # Específicos de ventas
│   │   ├── componentes/    # Específicos de ventas
│   │   ├── interfaces/     # Específicos de ventas
│   │   ├── paginas/        # Sub-páginas de ventas
│   │   ├── servicios/      # Específicos de ventas
│   │   └── utilidades/     # Específicos de ventas
│   └── reportes/
├── servicios/        # Generales
└── utilidades/       # Generales
```

### **React Native/Expo (Nuestra estructura):**
```
app/                  # ⚠️ SOLO rutas (Expo Router)
└── security/
    └── users/
        └── index.tsx  # Wrapper delgado (5 líneas)

src/
├── features/         # ⭐ TODO el código real
│   └── security/
│       └── users/
│           ├── adapters/      # Específicos de users
│           ├── components/    # Específicos de users (formularios)
│           ├── screens/       # Componentes contenedores (equivalente a "paginas")
│           ├── services/     # Específicos de users
│           ├── types/         # Específicos de users (equivalente a "interfaces")
│           └── hooks/         # Específicos de users (equivalente a "utilidades")
│
├── shared/           # Componentes y utilidades GENERALES (equivalente a app/componentes y app/utilidades)
│   ├── components/   # Generales (DataTable, SearchFilterBar, etc.)
│   ├── hooks/       # Generales (useTheme, useMultiCompany)
│   └── contexts/    # Generales (MultiCompanyContext)
│
└── infrastructure/   # Servicios de bajo nivel (API, i18n, menu, session)
```

---

## 🔍 Mapeo de Conceptos

| Angular (Imagen) | React Native/Expo | Ubicación |
|-----------------|-------------------|-----------|
| `app/adaptadores/` | `src/features/[domain]/[feature]/adapters/` | Específico por feature |
| `app/componentes/` | `src/shared/components/` | General (DataTable, Button, etc.) |
| `app/paginas/ventas/componentes/` | `src/features/security/users/components/` | Específico (UserCreateForm, etc.) |
| `app/interfaces/` | `src/features/[domain]/[feature]/types/` | Específico por feature |
| `app/paginas/ventas/paginas/` | `src/features/security/users/screens/` | Componentes contenedores |
| `app/servicios/` | `src/features/[domain]/[feature]/services/` | Específico por feature |
| `app/utilidades/` | `src/features/[domain]/[feature]/hooks/` | Específico por feature |
| `app/paginas/ventas/utilidades/` | `src/features/security/users/hooks/` | Específico del módulo |

---

## ✅ Reglas de Organización

### **1. Componentes Generales vs Específicos**

**Generales** (reutilizables en múltiples features):
- Ubicación: `src/shared/components/`
- Ejemplos: `DataTable`, `SearchFilterBar`, `Button`, `Input`, `Select`

**Específicos** (solo para una feature):
- Ubicación: `src/features/security/users/components/`
- Ejemplos: `UserCreateForm`, `UserEditForm`

### **2. Utilidades/Hooks Generales vs Específicos**

**Generales**:
- Ubicación: `src/shared/hooks/` o `src/hooks/`
- Ejemplos: `useTheme`, `useMultiCompany`, `useResponsive`

**Específicos**:
- Ubicación: `src/features/security/users/hooks/`
- Ejemplos: `useUsers` (hook específico para gestión de usuarios)

### **3. Screens (Páginas)**

**Ubicación:** `src/features/security/users/screens/`
- Contienen toda la lógica de la página
- Son componentes contenedores (smart components)
- Se importan desde `app/` que solo actúa como ruta

---

## 🚫 NO Hacer

1. ❌ **NO poner lógica en `app/`** - Solo wrappers delgados
2. ❌ **NO duplicar código** - Si está en `src/features/`, no debe estar en `app/`
3. ❌ **NO mezclar componentes generales con específicos** - Usar `src/shared/` para generales

---

## ✅ Sí Hacer

1. ✅ **Mantener `app/` delgado** - Solo importar screens
2. ✅ **Todo el código en `src/features/`** - Lógica, componentes, servicios
3. ✅ **Separar general vs específico** - `src/shared/` para generales, `src/features/` para específicos

---

## 📝 Ejemplo Completo: Usuarios

### **Ruta (app/):**
```typescript
// app/security/users/index.tsx (5 líneas)
import { UsersListScreen } from '@/src/features/security/users/screens/users-list.screen';
export default function UsersListPage() {
  return <UsersListScreen />;
}
```

### **Screen (src/features/):**
```typescript
// src/features/security/users/screens/users-list.screen.tsx (700+ líneas)
// TODO el código: estado, lógica, hooks, etc.
export function UsersListScreen() {
  // ... toda la lógica aquí
}
```

### **Componentes Específicos:**
```typescript
// src/features/security/users/components/user-create-form/user-create-form.tsx
// Componente específico de usuarios
```

### **Componentes Generales:**
```typescript
// src/shared/components/data-table/data-table.tsx
// Componente reutilizable en cualquier feature
```

---

## 🎯 Conclusión

**Tu estructura Angular es correcta y lógica.** La diferencia es que en React Native/Expo:

- **`app/`** = Solo rutas (equivalente a `app.routes.ts` en Angular)
- **`src/features/`** = Todo el código real (equivalente a `app/paginas/` en Angular)

**No hay duplicación** - `app/` solo "apunta" a `src/features/`, igual que en Angular las rutas apuntan a los componentes.

