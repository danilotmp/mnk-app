# Arquitectura Multiempresa

Este documento describe la arquitectura multiempresa implementada en la aplicación MNK.

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Estructura de Datos](#estructura-de-datos)
3. [Componentes Principales](#componentes-principales)
4. [Hooks Personalizados](#hooks-personalizados)
5. [Flujo de Autenticación](#flujo-de-autenticación)
6. [Control de Acceso](#control-de-acceso)
7. [Casos de Uso](#casos-de-uso)
8. [Integración con Backend](#integración-con-backend)

## 🎯 Visión General

La arquitectura multiempresa permite que una única aplicación pueda ser utilizada por múltiples empresas, donde cada empresa puede tener múltiples sucursales, y cada usuario puede tener acceso a una o más sucursales con diferentes permisos.

### Características Principales

- ✅ Soporte para múltiples empresas
- ✅ Múltiples sucursales por empresa
- ✅ Control de acceso basado en permisos
- ✅ Cambio dinámico entre sucursales
- ✅ Sistema de roles y permisos granular
- ✅ Mock services para desarrollo
- ✅ Preparado para integración con backend

## 📊 Estructura de Datos

### Company (Empresa)

```typescript
interface Company {
  id: string;
  name: string;
  code: string;
  description?: string;
  email: string;
  address: Address;
  settings: CompanySettings;
  subscriptionPlan: SubscriptionPlan;
  isActive: boolean;
}
```

### Branch (Sucursal)

```typescript
interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  type: BranchType; // 'headquarters' | 'branch' | 'warehouse' | 'store'
  address: Address;
  contactInfo: ContactInfo;
  settings: BranchSettings;
  isActive: boolean;
}
```

### MultiCompanyUser (Usuario)

```typescript
interface MultiCompanyUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  currentBranchId: string;
  availableBranches: BranchAccess[]; // Sucursales a las que tiene acceso
  roles: Role[];
  permissions: Permission[];
  preferences: UserPreferences;
}
```

### Permission (Permiso)

```typescript
interface Permission {
  id: string;
  name: string;
  code: string; // Ej: 'users.view', 'admin.manage'
  module: string; // Ej: 'admin', 'users', 'reports'
  action: string; // Ej: 'view', 'create', 'edit', 'delete'
  isActive: boolean;
}
```

## 🧩 Componentes Principales

### 1. MultiCompanyProvider

Proveedor de contexto React que envuelve toda la aplicación y proporciona el estado de multiempresa.

**Ubicación:** `src/domains/shared/contexts/multi-company.context.tsx`

**Uso:**

```tsx
// En app/_layout.tsx
<MultiCompanyProvider>
  <YourApp />
</MultiCompanyProvider>
```

### 2. BranchSelector

Componente UI para seleccionar y cambiar entre sucursales.

**Ubicación:** `src/domains/shared/components/branch-selector.tsx`

**Uso:**

```tsx
import { BranchSelector } from '@/src/domains/shared';

<BranchSelector 
  onBranchChange={(branch) => {
    console.log('Nueva sucursal:', branch.name);
  }} 
/>
```

### 3. AccessGuard

Componente para controlar el acceso basado en permisos.

**Ubicación:** `src/domains/shared/components/access-guard.tsx`

**Uso:**

```tsx
import { AccessGuard } from '@/src/domains/shared';

// Permiso único
<AccessGuard permission="users.view">
  <UsersList />
</AccessGuard>

// Todos los permisos requeridos
<AccessGuard permissions={["users.view", "users.edit"]}>
  <UserForm />
</AccessGuard>

// Al menos un permiso
<AccessGuard anyPermission={["admin.view", "superadmin.view"]}>
  <AdminPanel />
</AccessGuard>

// Por módulo y acción
<AccessGuard moduleAccess={{ module: "admin", action: "view" }}>
  <AdminDashboard />
</AccessGuard>

// Con fallback personalizado
<AccessGuard 
  permission="premium.feature" 
  fallback={<UpgradePrompt />}
  hideOnDenied={false}
>
  <PremiumFeature />
</AccessGuard>
```

## 🪝 Hooks Personalizados

### useMultiCompany()

Hook principal que proporciona acceso a toda la funcionalidad multiempresa.

```tsx
const {
  currentCompany,
  currentBranch,
  availableBranches,
  user,
  permissions,
  isLoading,
  error,
  setUserContext,
  switchBranch,
  hasPermission,
  hasModuleAccess,
  canSwitchBranch,
  clearContext,
} = useMultiCompany();
```

### useCompany()

Hook simplificado para información de empresa y sucursal.

```tsx
const { company, branch, user } = useCompany();
```

### useBranches()

Hook para gestionar sucursales.

```tsx
const {
  branches,
  currentBranch,
  switchBranch,
  canSwitch,
  isLoading,
} = useBranches();
```

### usePermissions()

Hook para verificar permisos.

```tsx
const {
  permissions,
  hasPermission,
  hasModuleAccess,
  hasAllPermissions,
  hasAnyPermission,
} = usePermissions();

// Verificar permiso único
if (hasPermission('users.edit')) {
  // Mostrar botón de editar
}

// Verificar acceso a módulo
if (hasModuleAccess('admin', 'view')) {
  // Mostrar panel de administración
}

// Verificar múltiples permisos
if (hasAllPermissions(['users.view', 'users.edit'])) {
  // Mostrar formulario completo
}
```

## 🔐 Flujo de Autenticación

### 1. Login del Usuario

```typescript
// En tu componente de login o inicialización
import { useMultiCompany } from '@/src/domains/shared';
import { MultiCompanyService } from '@/src/domains/shared';

const { setUserContext } = useMultiCompany();

// Después de autenticar al usuario
const service = MultiCompanyService.getInstance();
const mockUsers = service.getMockUsers();
await setUserContext(mockUsers[0]); // Usuario Danilo (admin)
```

### 2. Estado Después del Login

Una vez autenticado, el contexto contendrá:
- Empresa actual
- Sucursal actual
- Sucursales disponibles
- Permisos del usuario
- Información del usuario

### 3. Cambio de Sucursal

```typescript
const { switchBranch } = useMultiCompany();

// Cambiar a otra sucursal
await switchBranch('branch-loja');
```

### 4. Logout

```typescript
const { clearContext } = useMultiCompany();

clearContext(); // Limpia todo el contexto
```

## 🛡️ Control de Acceso

### Niveles de Control

1. **A nivel de componente** - Usando `<AccessGuard>`
2. **A nivel de lógica** - Usando hooks `hasPermission()` / `hasModuleAccess()`
3. **A nivel de servicio** - El `MultiCompanyService` verifica permisos

### Ejemplo Completo

```tsx
import { AccessGuard, usePermissions } from '@/src/domains/shared';

function UserManagement() {
  const { hasPermission } = usePermissions();

  return (
    <View>
      {/* Mostrar lista solo si tiene permiso de ver */}
      <AccessGuard permission="users.view">
        <UsersList />
      </AccessGuard>

      {/* Mostrar botón solo si tiene permiso de crear */}
      {hasPermission('users.create') && (
        <Button title="Crear Usuario" onPress={handleCreate} />
      )}

      {/* Formulario completo solo para admin */}
      <AccessGuard moduleAccess={{ module: "admin", action: "manage" }}>
        <AdminUserForm />
      </AccessGuard>
    </View>
  );
}
```

## 💼 Casos de Uso

### Caso 1: Usuario Juan (Una Sucursal)

```typescript
// Juan solo tiene acceso a Loja
{
  id: 'user-juan',
  firstName: 'Juan',
  companyId: 'company-1',
  currentBranchId: 'branch-loja',
  availableBranches: [
    {
      branchId: 'branch-loja',
      role: 'user',
      permissions: [...permisos de usuario]
    }
  ]
}
```

**Resultado:** Juan ve información de Loja y NO puede cambiar de sucursal.

### Caso 2: Usuario Sebastian (Múltiples Sucursales)

```typescript
// Sebastian tiene acceso a Quito y Loja
{
  id: 'user-sebastian',
  firstName: 'Sebastian',
  currentBranchId: 'branch-quito',
  availableBranches: [
    { branchId: 'branch-quito', role: 'user' },
    { branchId: 'branch-loja', role: 'user' }
  ]
}
```

**Resultado:** Sebastian puede cambiar entre Quito y Loja usando el `BranchSelector`.

### Caso 3: Usuario Danilo (Administrador)

```typescript
// Danilo tiene acceso total
{
  id: 'user-danilo',
  firstName: 'Danilo',
  currentBranchId: 'branch-quito',
  availableBranches: [
    { branchId: 'branch-quito', role: 'admin', permissions: [...admin permisos] },
    { branchId: 'branch-loja', role: 'admin', permissions: [...admin permisos] }
  ]
}
```

**Resultado:** Danilo tiene acceso completo a todas las sucursales y módulos de administración.

## 🔌 Integración con Backend

El servicio actual (`MultiCompanyService`) es un mock. Para conectar con un backend real:

### 1. Estructura de Endpoints Esperados

```typescript
// GET /api/auth/login
// POST body: { email, password }
// Response: { token, user: MultiCompanyUser }

// GET /api/companies/{companyId}
// Response: Company

// GET /api/branches/{branchId}
// Response: Branch

// GET /api/users/{userId}/branches
// Response: Branch[]

// GET /api/users/{userId}/permissions?branchId={branchId}
// Response: Permission[]

// POST /api/users/{userId}/switch-branch
// POST body: { branchId }
// Response: BranchSwitchResponse
```

### 2. Modificar MultiCompanyService

Reemplaza los métodos mock con llamadas HTTP reales:

```typescript
// Ejemplo con fetch
private async getCompanyById(companyId: string): Promise<Company | null> {
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) return null;
  
  const data = await response.json();
  return data;
}
```

### 3. Gestión de Tokens

```typescript
// Guardar token después del login
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('authToken', token);

// Recuperar token para peticiones
const token = await AsyncStorage.getItem('authToken');
```

## 🧪 Testing

### Usuarios Mock Disponibles

La aplicación incluye 3 usuarios mock para pruebas:

1. **danilo@mnk-demo.com** - Administrador con acceso completo
2. **juan@mnk-demo.com** - Usuario con acceso solo a Loja
3. **sebastian@mnk-demo.com** - Usuario con acceso a Quito y Loja

Para cambiar el usuario de prueba, modifica el código en `app/(tabs)/index.tsx`:

```typescript
const mockUsers = service.getMockUsers();
await setUserContext(mockUsers[1]); // 0=Danilo, 1=Juan, 2=Sebastian
```

## 📚 Recursos Adicionales

- Ver `src/domains/shared/types/multi-company.types.ts` para todos los tipos
- Ver `src/domains/shared/services/multi-company.service.ts` para la lógica del servicio
- Ver `src/domains/shared/contexts/multi-company.context.tsx` para el contexto React

## 🤝 Contribuir

Al agregar nuevas funcionalidades multiempresa:

1. Agrega tipos en `multi-company.types.ts`
2. Implementa lógica en `multi-company.service.ts`
3. Crea hooks en `use-multi-company.hook.ts` si es necesario
4. Actualiza la documentación

---

**Última actualización:** Octubre 2025

