# Propuesta de Refactorización Arquitectónica
## Adaptación de Clean Architecture a React Native/Expo

> **Análisis basado en**: Arquitectura Angular con Clean Architecture, Screaming Architecture, SSOT y patrón Contenedor-Presentacional

---

## 📊 Análisis Comparativo

### Estructura Actual vs Propuesta

#### **Estructura Actual (React Native/Expo)**
```
app/                          # Rutas (file-based routing)
├── security/
│   ├── users/
│   ├── roles/
│   └── companies/
src/
├── domains/                  # Dominios de negocio
│   ├── security/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   └── shared/
├── infrastructure/            # Infraestructura
│   ├── api/
│   ├── i18n/
│   └── menu/
components/                    # Componentes UI compartidos
```

#### **Estructura Propuesta (Angular)**
```
pages/                        # Funcionalidades por dominio
├── sales/                    # Funcionalidad completa
│   ├── adapters/
│   ├── components/
│   ├── services/
│   └── interfaces/
services/                     # Lógica de negocio (SSOT)
adapters/                     # Transformación API → Dominio
interfaces/                   # Tipos (domain y api)
components/                   # UI compartidos
```

---

## ✅ Factibilidad de Adaptación

### **✅ ALTAMENTE FACTIBLE**

Los principios arquitectónicos son **independientes del framework** y se pueden adaptar perfectamente a React Native/Expo:

1. **Clean Architecture** ✅
   - Separación por capas (Dominio → Aplicación → Infraestructura → Presentación)
   - Independencia del framework
   - Ya tenemos algo de esto con `domains/` e `infrastructure/`

2. **Screaming Architecture** ✅
   - Organización por funcionalidad, no por tipo técnico
   - Perfectamente aplicable a React Native

3. **SSOT (Single Source of Truth)** ✅
   - React Context API o Zustand/Redux para estado global
   - Ya usamos Context (`MultiCompanyContext`)

4. **Contenedor-Presentacional** ✅
   - Patrón nativo de React
   - Separación entre componentes "smart" y "dumb"

---

## 🏗️ Propuesta de Estructura Refactorizada

### **Estructura Recomendada para React Native/Expo**

```
src/
├── app/                      # Rutas (Expo Router - NO TOCAR)
│   ├── security/
│   │   ├── users/
│   │   └── roles/
│   └── auth/
│
├── features/                 # ⭐ NUEVO: Funcionalidades (Screaming Architecture)
│   ├── security/
│   │   ├── users/           # Funcionalidad completa de usuarios
│   │   │   ├── adapters/    # Transformación API → Dominio
│   │   │   │   └── user.adapter.ts
│   │   │   ├── components/  # Componentes específicos de usuarios
│   │   │   │   ├── user-list/
│   │   │   │   ├── user-form/
│   │   │   │   └── user-card/
│   │   │   ├── hooks/       # Hooks específicos
│   │   │   │   └── use-users.hook.ts
│   │   │   ├── services/    # Servicios de negocio (SSOT)
│   │   │   │   └── users.service.ts
│   │   │   ├── types/       # Tipos específicos
│   │   │   │   ├── domain/  # Modelos de dominio
│   │   │   │   │   └── user.types.ts
│   │   │   │   └── api/     # Contratos de API
│   │   │   │       └── user-api.types.ts
│   │   │   └── index.ts     # Barrel export
│   │   │
│   │   ├── roles/           # Funcionalidad completa de roles
│   │   │   ├── adapters/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── types/
│   │   │
│   │   └── companies/        # Funcionalidad completa de empresas
│   │
│   ├── auth/                 # Funcionalidad de autenticación
│   │   ├── adapters/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   │
│   └── catalog/              # Funcionalidad de catálogo
│
├── infrastructure/           # Capa de infraestructura (YA EXISTE)
│   ├── api/                  # Cliente HTTP, adaptadores de almacenamiento
│   ├── i18n/                 # Internacionalización
│   ├── menu/                 # Servicio de menú
│   ├── session/              # Gestión de sesión
│   └── messages/             # Toast, alerts
│
├── shared/                   # Componentes y utilidades compartidas
│   ├── components/           # Componentes UI reutilizables
│   │   ├── ui/               # Componentes base (Button, Input, etc.)
│   │   └── layout/           # Layouts compartidos
│   ├── hooks/                # Hooks compartidos
│   ├── contexts/             # Contextos globales
│   ├── services/              # Servicios compartidos
│   └── types/                 # Tipos compartidos
│
└── styles/                   # Estilos y temas (YA EXISTE)
    ├── themes/
    └── components/
```

---

## 🔄 Mapeo de Conceptos Angular → React Native

| Concepto Angular | Equivalente React Native | Estado Actual |
|-----------------|-------------------------|---------------|
| **Services (SSOT)** | Context API / Zustand / Custom Hooks | ✅ Parcial (Context) |
| **Adaptadores** | Funciones puras de transformación | ❌ No existe |
| **Interfaces Domain** | TypeScript types/interfaces | ✅ Existe en `types/` |
| **Interfaces API** | TypeScript types/interfaces | ❌ Mezclado |
| **Componentes Contenedor** | Componentes con hooks/context | ✅ Parcial |
| **Componentes Presentacionales** | Componentes funcionales puros | ✅ Existe |
| **Pages (Features)** | Carpetas de funcionalidad | ❌ No existe |

---

## 📋 Plan de Migración Gradual

### **Fase 1: Establecer Estructura Base** (1-2 días)

1. Crear estructura `features/` con una funcionalidad piloto
2. Mover `src/domains/security/users/` → `src/features/security/users/`
3. Crear estructura de carpetas completa:
   ```
   features/security/users/
   ├── adapters/
   ├── components/
   ├── hooks/
   ├── services/
   ├── types/
   │   ├── domain/
   │   └── api/
   └── index.ts
   ```

### **Fase 2: Implementar Adaptadores** (2-3 días)

1. Separar tipos de dominio de tipos de API
2. Crear funciones adaptadoras:
   ```typescript
   // features/security/users/adapters/user.adapter.ts
   export function userAdapter(apiUser: UserApi): User {
     return {
       id: apiUser.id,
       name: apiUser.name,
       // Transformación de datos
     };
   }
   ```

### **Fase 3: Refactorizar Servicios (SSOT)** (3-5 días)

1. Crear servicios de negocio con estado centralizado:
   ```typescript
   // features/security/users/services/users.service.ts
   export class UsersService {
     private state = createContext<UserState>();
     
     // Fuente única de verdad
     getUsers() { /* ... */ }
     updateUser() { /* ... */ }
   }
   ```

2. Usar React Context o Zustand para estado global

### **Fase 4: Separar Contenedor-Presentacional** (2-3 días)

1. Identificar componentes "smart" (con lógica) vs "dumb" (presentacionales)
2. Refactorizar componentes existentes:
   - Contenedor: Maneja estado, llama servicios
   - Presentacional: Recibe props, emite eventos

### **Fase 5: Migrar Funcionalidades Restantes** (1-2 semanas)

1. Migrar `security/roles/`
2. Migrar `security/companies/`
3. Migrar `auth/`
4. Migrar `catalog/`

---

## 🎯 Beneficios Esperados

### **1. Descubribilidad Mejorada**
```
❌ Antes: "¿Dónde está el código de usuarios?"
   - Buscar en domains/security/components/
   - Buscar en domains/security/services/
   - Buscar en app/security/users/

✅ Después: "¿Dónde está el código de usuarios?"
   - Todo en features/security/users/
```

### **2. Escalabilidad Horizontal**
```
✅ Agregar nueva funcionalidad:
   - Crear features/sales/
   - Auto-contenida, sin tocar código existente
```

### **3. Mantenibilidad**
```
✅ Cambios en API:
   - Solo actualizar adaptador
   - No tocar componentes ni servicios
```

### **4. Testabilidad**
```
✅ Testing:
   - Adaptadores: Funciones puras, fáciles de testear
   - Servicios: Aislados, mockeables
   - Componentes: Presentacionales, testear con props
```

---

## ⚠️ Consideraciones Especiales para React Native/Expo

### **1. Expo Router (File-based Routing)**
- **NO TOCAR** la carpeta `app/` - es el sistema de routing
- Las rutas en `app/` deben ser **delgadas** y solo importar de `features/`

### **2. Estado Global**
- **Opciones**:
  - React Context API (ya lo usamos)
  - Zustand (recomendado para SSOT)
  - Redux Toolkit (si el proyecto crece mucho)

### **3. Adaptadores**
- Funciones puras de TypeScript
- No dependen de React ni de frameworks
- Fáciles de testear y reutilizar

### **4. Componentes Presentacionales**
- Usar `components/ui/` para componentes base
- Usar `features/*/components/` para componentes específicos

---

## 📝 Ejemplo de Implementación

### **Antes (Estructura Actual)**
```typescript
// app/security/users/index.tsx
import { UsersService } from '@/src/domains/security/services/users.service';
import { UserCreateForm } from '@/src/domains/security/components/user-create-form';

export default function UsersPage() {
  // Lógica mezclada
}
```

### **Después (Estructura Propuesta)**
```typescript
// app/security/users/index.tsx (DELGADO - solo routing)
import { UsersContainer } from '@/src/features/security/users';

export default function UsersPage() {
  return <UsersContainer />;
}

// src/features/security/users/index.ts (Barrel export)
export { UsersContainer } from './components/users-container';
export { useUsers } from './hooks/use-users.hook';
export type { User } from './types/domain/user.types';

// src/features/security/users/components/users-container.tsx (CONTENEDOR)
import { useUsers } from '../hooks/use-users.hook';
import { UserList } from './user-list';
import { UserForm } from './user-form';

export function UsersContainer() {
  const { users, loading, createUser } = useUsers();
  
  return (
    <UserList 
      users={users} 
      loading={loading}
      onCreateUser={createUser}
    />
  );
}

// src/features/security/users/components/user-list.tsx (PRESENTACIONAL)
interface UserListProps {
  users: User[];
  loading: boolean;
  onCreateUser: (user: User) => void;
}

export function UserList({ users, loading, onCreateUser }: UserListProps) {
  // Solo UI, sin lógica de negocio
}

// src/features/security/users/adapters/user.adapter.ts
import { UserApi } from '../types/api/user-api.types';
import { User } from '../types/domain/user.types';

export function userAdapter(apiUser: UserApi): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    // Transformación de datos
  };
}

// src/features/security/users/services/users.service.ts (SSOT)
import { createContext } from 'react';
import { userAdapter } from '../adapters/user.adapter';
import { UsersApiService } from '@/src/infrastructure/api';

export class UsersService {
  // Fuente única de verdad para usuarios
  private users = new Map<string, User>();
  
  async fetchUsers() {
    const apiUsers = await UsersApiService.getUsers();
    return apiUsers.map(userAdapter);
  }
}
```

---

## 🚀 Recomendación Final

### **✅ SÍ, ES FACTIBLE Y RECOMENDADO**

**Razones:**
1. ✅ Los principios son **independientes del framework**
2. ✅ Mejora significativamente la **organización y escalabilidad**
3. ✅ Facilita el **onboarding** de nuevos desarrolladores
4. ✅ Reduce la **complejidad cognitiva** del proyecto
5. ✅ Mejora la **testabilidad** y **mantenibilidad**

**Estrategia:**
- ✅ Migración **gradual** (funcionalidad por funcionalidad)
- ✅ Empezar con una funcionalidad piloto (`users`)
- ✅ Mantener compatibilidad durante la migración
- ✅ Documentar el proceso

**Riesgos:**
- ⚠️ Refactorización grande (pero gradual)
- ⚠️ Requiere disciplina del equipo
- ⚠️ Curva de aprendizaje inicial

**Mitigación:**
- ✅ Migración gradual reduce riesgos
- ✅ Documentación clara de la estructura
- ✅ Ejemplos y guías de estilo

---

## 📚 Próximos Pasos

1. **Revisar y aprobar** esta propuesta
2. **Seleccionar funcionalidad piloto** (recomiendo `users`)
3. **Crear estructura base** en `features/`
4. **Migrar funcionalidad piloto** completamente
5. **Documentar lecciones aprendidas**
6. **Migrar funcionalidades restantes** una por una

---

**¿Quieres que empecemos con la migración de una funcionalidad piloto?**

