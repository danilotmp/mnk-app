# 🚀 Inicio Rápido - Arquitectura Multiempresa

Esta guía te ayudará a entender y usar la arquitectura multiempresa implementada en MNK.

## 📦 ¿Qué se ha implementado?

Se ha añadido una arquitectura completa de multiempresas que permite:

- ✅ Gestión de múltiples empresas y sucursales
- ✅ Control de acceso basado en permisos
- ✅ Cambio dinámico entre sucursales
- ✅ Sistema de roles y permisos granular
- ✅ Datos mock para desarrollo

## 🏗️ Estructura de Archivos

```
src/domains/shared/
├── types/
│   ├── index.ts
│   └── multi-company.types.ts         # Tipos de datos
├── services/
│   ├── index.ts
│   └── multi-company.service.ts       # Servicio mock
├── contexts/
│   ├── index.ts
│   └── multi-company.context.tsx      # Context de React
├── hooks/
│   ├── index.ts
│   └── use-multi-company.hook.ts      # Hooks personalizados
└── components/
    ├── index.ts
    ├── branch-selector.tsx            # Selector de sucursales
    └── access-guard.tsx               # Control de acceso
```

## 👤 Usuarios de Prueba

El sistema incluye 3 usuarios mock para testing:

### 1. Danilo (Administrador)
- **Email:** danilo@mnk-demo.com
- **Acceso:** Quito y Loja (todas las sucursales)
- **Permisos:** Administración completa
- **Puede cambiar de sucursal:** ✅ Sí

### 2. Juan (Usuario Básico)
- **Email:** juan@mnk-demo.com
- **Acceso:** Solo Loja
- **Permisos:** Usuario estándar
- **Puede cambiar de sucursal:** ❌ No (solo tiene una)

### 3. Sebastian (Usuario Multisucursal)
- **Email:** sebastian@mnk-demo.com
- **Acceso:** Quito y Loja
- **Permisos:** Usuario estándar
- **Puede cambiar de sucursal:** ✅ Sí

## 🎯 Uso Básico

### 1. Ver información de la empresa actual

```tsx
import { useCompany } from '@/src/domains/shared';

function MyComponent() {
  const { company, branch, user } = useCompany();
  
  return (
    <View>
      <Text>Empresa: {company?.name}</Text>
      <Text>Sucursal: {branch?.name}</Text>
      <Text>Usuario: {user?.firstName}</Text>
    </View>
  );
}
```

### 2. Agregar selector de sucursales

```tsx
import { BranchSelector } from '@/src/domains/shared';

function MyScreen() {
  return (
    <View>
      <BranchSelector 
        onBranchChange={(newBranch) => {
          console.log('Cambiado a:', newBranch.name);
        }} 
      />
    </View>
  );
}
```

### 3. Controlar acceso por permisos

```tsx
import { AccessGuard } from '@/src/domains/shared';

function AdminPanel() {
  return (
    <View>
      {/* Solo visible para usuarios con permiso 'users.view' */}
      <AccessGuard permission="users.view">
        <UsersList />
      </AccessGuard>
      
      {/* Solo para administradores */}
      <AccessGuard moduleAccess={{ module: "admin", action: "manage" }}>
        <AdminSettings />
      </AccessGuard>
    </View>
  );
}
```

### 4. Verificar permisos en código

```tsx
import { usePermissions } from '@/src/domains/shared';

function MyButton() {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission('users.create')) {
    return null; // No mostrar si no tiene permiso
  }
  
  return <Button title="Crear Usuario" />;
}
```

### 5. Cambiar de sucursal programáticamente

```tsx
import { useMultiCompany } from '@/src/domains/shared';

function SwitchBranchButton() {
  const { switchBranch, availableBranches } = useMultiCompany();
  
  const handleSwitch = async () => {
    try {
      await switchBranch('branch-loja');
      console.log('Sucursal cambiada exitosamente');
    } catch (error) {
      console.error('Error al cambiar sucursal:', error);
    }
  };
  
  return <Button title="Ir a Loja" onPress={handleSwitch} />;
}
```

## 🔧 Cambiar Usuario de Prueba

Por defecto, la aplicación usa el usuario "Danilo" (administrador). Para probar con otros usuarios:

**Edita:** `app/(tabs)/index.tsx`

```tsx
// Línea ~28
const mockUsers = service.getMockUsers();
await setUserContext(mockUsers[0]); // Cambiar el índice

// Índices:
// 0 = Danilo (admin, todas las sucursales)
// 1 = Juan (usuario, solo Loja)
// 2 = Sebastian (usuario, Quito y Loja)
```

## 📋 Permisos Disponibles

### Administración
- `users.view` - Ver usuarios
- `users.create` - Crear usuarios
- `users.edit` - Editar usuarios
- `users.delete` - Eliminar usuarios
- `branches.view` - Ver sucursales
- `branches.manage` - Gestionar sucursales

### Usuario
- `profile.view` - Ver perfil
- `profile.edit` - Editar perfil
- `branch.switch` - Cambiar sucursal

## 🔌 Próximos Pasos

### Para conectar con un backend real:

1. **Instalar axios o fetch**
   ```bash
   npm install axios
   ```

2. **Crear servicio HTTP**
   ```tsx
   // src/services/http.service.ts
   import axios from 'axios';
   
   export const apiClient = axios.create({
     baseURL: 'https://tu-api.com/api',
     headers: {
       'Content-Type': 'application/json'
     }
   });
   ```

3. **Modificar MultiCompanyService**
   Reemplaza los métodos mock con llamadas HTTP reales.

4. **Implementar autenticación**
   Agrega un flujo de login real que guarde tokens.

## 📚 Documentación Completa

Para más detalles, consulta:
- **[MULTI_COMPANY_ARCHITECTURE.md](./MULTI_COMPANY_ARCHITECTURE.md)** - Documentación completa de la arquitectura
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura general del proyecto

## ❓ Preguntas Frecuentes

### ¿Cómo añado una nueva sucursal?

Agrega la sucursal en `mockBranches` dentro de `multi-company.service.ts`.

### ¿Cómo creo nuevos permisos?

Agrega permisos en `mockPermissions` dentro de `multi-company.service.ts`.

### ¿El selector no aparece?

El selector solo se muestra si el usuario tiene acceso a más de una sucursal.

### ¿Cómo limpio el contexto al hacer logout?

```tsx
const { clearContext } = useMultiCompany();
clearContext(); // Limpia todo
```

---

**¡Listo para usar!** 🎉

La aplicación ya está configurada y funcionando con arquitectura multiempresa. Ejecuta:

```bash
npm start
```

Y abre la aplicación para verla en acción.

