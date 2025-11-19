# ESPECIFICACIÓN TÉCNICA: PERMISOS GRANULARES POR RUTA

## 1. PROBLEMA ACTUAL

Actualmente el sistema de permisos requiere **duplicación innecesaria**:

- Para mostrar un item en el menú: `users.view` (permiso básico)
- Para permitir acceso a la pantalla: `security.users.view` (permiso con módulo)

**Ejemplo del problema:**
- Si un rol necesita ver "Usuarios" en el menú Y acceder a la pantalla, necesita **DOS permisos separados**
- Esto genera confusión y duplicación de permisos
- No permite control granular por ruta específica

## 2. SOLUCIÓN PROPUESTA

**Unificar en un solo permiso** que controle tanto la visibilidad en el menú como el acceso a la ruta mediante un campo `route` opcional.

**Principio:**
- Un permiso con `route: "/security/users"` y `action: "view"` debe:
  1. Mostrar el item en el menú (filtrado backend)
  2. Permitir acceso a la ruta `/security/users` (verificación backend)

## 3. CAMBIOS EN BASE DE DATOS

### 3.1. Tabla `permissions`

Agregar columna opcional para almacenar la ruta asociada al permiso:

```sql
ALTER TABLE permissions 
ADD COLUMN route VARCHAR(255) NULL;

CREATE INDEX idx_permissions_route ON permissions(route);
```

**Características:**
- Campo `route` es **NULLABLE** (opcional) para mantener retrocompatibilidad
- Permisos antiguos sin `route` seguirán funcionando con la lógica actual (por módulo)
- Nuevos permisos pueden incluir `route` para control granular

**Ejemplos de valores de `route`:**
- `/security/users`
- `/security/roles`
- `/security/permissions`
- `/catalog/headers`
- `/catalog/details`

## 4. CAMBIOS EN ENDPOINTS

### 4.1. GET `/api/seguridades/permisos`

**Cambios en la respuesta:**

La respuesta debe incluir el campo `route` cuando exista:

```json
{
  "result": {
    "statusCode": 200,
    "description": "Operación exitosa"
  },
  "data": {
    "data": [
      {
        "id": "uuid-1",
        "code": "users.view",
        "name": "Ver usuarios",
        "module": "security",
        "action": "view",
        "route": "/security/users",
        "description": "Permite visualizar la lista de usuarios",
        "status": 1,
        "statusDescription": "Activo",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "uuid-2",
        "code": "roles.view",
        "name": "Ver roles",
        "module": "security",
        "action": "view",
        "route": "/security/roles",
        "description": "Permite visualizar la lista de roles",
        "status": 1,
        "statusDescription": "Activo",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "uuid-3",
        "code": "admin.view",
        "name": "Ver administración",
        "module": "admin",
        "action": "view",
        "route": null,
        "description": "Permiso antiguo sin ruta (retrocompatibilidad)",
        "status": 1,
        "statusDescription": "Activo",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**Importante:**
- Si `route` es NULL, el campo debe estar presente en la respuesta con valor `null`
- No omitir el campo, siempre incluirlo en la respuesta

### 4.2. POST `/api/seguridades/permisos`

**Cambios en el body de la petición:**

Aceptar el campo `route` como opcional:

```json
{
  "name": "Ver usuarios",
  "code": "users.view",
  "module": "security",
  "action": "view",
  "route": "/security/users",
  "description": "Permite visualizar la lista de usuarios",
  "status": 1
}
```

**Validaciones:**
- `route` es opcional (puede ser NULL o no enviarse)
- Si se envía `route`, debe ser un string no vacío
- Si se envía `route`, debe empezar con `/`
- Validar formato de ruta (opcional): solo letras, números, guiones, barras

**Ejemplo de permiso sin ruta (retrocompatibilidad):**
```json
{
  "name": "Ver administración",
  "code": "admin.view",
  "module": "admin",
  "action": "view",
  "description": "Permiso general de administración",
  "status": 1
}
```

### 4.3. PUT `/api/seguridades/permisos/{id}`

**Cambios en el body de la petición:**

Aceptar el campo `route` como opcional (igual que POST):

```json
{
  "name": "Ver usuarios",
  "code": "users.view",
  "module": "security",
  "action": "view",
  "route": "/security/users",
  "description": "Permiso actualizado",
  "status": 1
}
```

**Comportamiento:**
- Si se envía `route: null` o se omite, mantener el valor actual en BD
- Si se envía un `route` nuevo, actualizar el valor en BD
- Si se envía `route: ""` (string vacío), establecer como NULL en BD

### 4.4. GET `/api/seguridades/menu`

**CAMBIOS CRÍTICOS EN LA LÓGICA DE FILTRADO:**

Este endpoint debe cambiar su lógica de filtrado para usar `route` cuando esté disponible.

**Lógica híbrida (retrocompatible):**

```javascript
// Pseudocódigo de la lógica a implementar

function filterMenuByPermissions(menuItems, userPermissions) {
  return menuItems.filter(menuItem => {
    // Si el menuItem tiene ruta, buscar permiso por ruta exacta
    if (menuItem.route) {
      // Buscar permiso que coincida con la ruta exacta y acción "view"
      const hasRoutePermission = userPermissions.some(perm => 
        perm.route !== null && 
        perm.route === menuItem.route && 
        perm.action === 'view'
      );
      
      if (hasRoutePermission) {
        return true; // Mostrar en menú
      }
    }
    
    // Si no hay permiso por ruta, usar lógica antigua (por módulo)
    // Esto mantiene retrocompatibilidad con permisos antiguos
    const moduleFromRoute = extractModuleFromRoute(menuItem.route);
    if (moduleFromRoute) {
      const hasModulePermission = userPermissions.some(perm => 
        perm.module === moduleFromRoute && 
        perm.action === 'view' &&
        (perm.route === null || perm.route === undefined) // Solo permisos sin ruta
      );
      
      if (hasModulePermission) {
        return true; // Mostrar en menú
      }
    }
    
    // Si el menuItem no tiene ruta, usar lógica antigua
    if (menuItem.module) {
      return userPermissions.some(perm => 
        perm.module === menuItem.module && 
        perm.action === 'view' &&
        (perm.route === null || perm.route === undefined)
      );
    }
    
    return false; // No mostrar en menú
  });
}

function extractModuleFromRoute(route) {
  // Extraer módulo de la ruta
  // Ejemplo: "/security/users" -> "security"
  // Ejemplo: "/catalog/headers" -> "catalog"
  if (!route) return null;
  
  const parts = route.split('/').filter(p => p);
  return parts.length > 0 ? parts[0] : null;
}
```

**Ejemplo de funcionamiento:**

**Caso 1: Permiso con `route` (nuevo sistema)**
- MenuItem: `{ route: "/security/users", label: "Usuarios" }`
- Permiso del usuario: `{ route: "/security/users", action: "view", module: "security" }`
- **Resultado:** ✅ Muestra en menú (coincidencia exacta por ruta)

**Caso 2: Permiso sin `route` (sistema antiguo)**
- MenuItem: `{ route: "/security/users", label: "Usuarios" }`
- Permiso del usuario: `{ route: null, action: "view", module: "security" }`
- **Resultado:** ✅ Muestra en menú (coincidencia por módulo "security")

**Caso 3: Control granular**
- MenuItem 1: `{ route: "/security/users", label: "Usuarios" }`
- MenuItem 2: `{ route: "/security/roles", label: "Roles" }`
- Permiso del usuario: `{ route: "/security/users", action: "view", module: "security" }`
- **Resultado:** 
  - ✅ Muestra "Usuarios" (tiene permiso por ruta)
  - ❌ NO muestra "Roles" (no tiene permiso por ruta)

### 4.5. Middleware de Protección de Rutas

**NUEVO ENDPOINT O MIDDLEWARE:**

Implementar verificación de acceso a rutas antes de permitir acceso a endpoints protegidos.

**Endpoint sugerido:**
```
GET /api/seguridades/verificar-acceso?route=/security/users&action=view
```

**Respuesta:**
```json
{
  "result": {
    "statusCode": 200,
    "description": "Operación exitosa"
  },
  "data": {
    "hasAccess": true,
    "permission": {
      "id": "uuid",
      "code": "users.view",
      "route": "/security/users",
      "action": "view"
    }
  }
}
```

**Lógica de verificación:**

```javascript
// Pseudocódigo
function verifyRouteAccess(userPermissions, requestedRoute, requestedAction = 'view') {
  // 1. Buscar permiso por ruta exacta
  const routePermission = userPermissions.find(perm => 
    perm.route !== null && 
    perm.route === requestedRoute && 
    perm.action === requestedAction
  );
  
  if (routePermission) {
    return { hasAccess: true, permission: routePermission };
  }
  
  // 2. Si no hay permiso por ruta, verificar por módulo (retrocompatibilidad)
  const moduleFromRoute = extractModuleFromRoute(requestedRoute);
  if (moduleFromRoute) {
    const modulePermission = userPermissions.find(perm => 
      perm.module === moduleFromRoute && 
      perm.action === requestedAction &&
      (perm.route === null || perm.route === undefined)
    );
    
    if (modulePermission) {
      return { hasAccess: true, permission: modulePermission };
    }
  }
  
  return { hasAccess: false, permission: null };
}
```

## 5. MIGRACIÓN DE DATOS (OPCIONAL)

**Script de migración para permisos existentes:**

Si se desea migrar permisos antiguos a incluir `route`, se puede ejecutar un script:

```sql
-- Ejemplo: Migrar permisos comunes
UPDATE permissions 
SET route = '/security/users' 
WHERE code = 'users.view' AND module = 'security' AND route IS NULL;

UPDATE permissions 
SET route = '/security/roles' 
WHERE code = 'roles.view' AND module = 'security' AND route IS NULL;

UPDATE permissions 
SET route = '/security/permissions' 
WHERE code = 'permissions.view' AND module = 'security' AND route IS NULL;

-- Agregar más según corresponda...
```

**Importante:**
- Esta migración es **OPCIONAL**
- Los permisos antiguos seguirán funcionando sin `route`
- Solo ejecutar si se desea tener control granular desde el inicio

## 6. CASOS DE USO

### Caso de Uso 1: Rol "Editor de Usuarios"

**Permisos asignados:**
```json
[
  {
    "code": "users.view",
    "module": "security",
    "action": "view",
    "route": "/security/users"
  },
  {
    "code": "users.create",
    "module": "security",
    "action": "create",
    "route": "/security/users"
  },
  {
    "code": "users.edit",
    "module": "security",
    "action": "edit",
    "route": "/security/users"
  }
]
```

**Resultado:**
- ✅ Muestra "Usuarios" en el menú (tiene `view` con `route`)
- ✅ Puede acceder a `/security/users`
- ❌ NO muestra "Roles" (no tiene permiso para esa ruta)
- ❌ NO muestra "Permisos" (no tiene permiso para esa ruta)

### Caso de Uso 2: Rol "Solo Lectura General"

**Permisos asignados (sin `route`, sistema antiguo):**
```json
[
  {
    "code": "security.view",
    "module": "security",
    "action": "view",
    "route": null
  }
]
```

**Resultado:**
- ✅ Muestra TODOS los items del módulo "security" en el menú (retrocompatibilidad)
- ✅ Puede acceder a todas las rutas del módulo "security"

### Caso de Uso 3: Rol "Acceso Granular Mixto"

**Permisos asignados (mezcla de antiguos y nuevos):**
```json
[
  {
    "code": "users.view",
    "module": "security",
    "action": "view",
    "route": "/security/users"
  },
  {
    "code": "catalog.view",
    "module": "catalog",
    "action": "view",
    "route": null
  }
]
```

**Resultado:**
- ✅ Muestra "Usuarios" en el menú (permiso granular)
- ❌ NO muestra "Roles" (no tiene permiso específico)
- ❌ NO muestra "Permisos" (no tiene permiso específico)
- ✅ Muestra TODOS los items del módulo "catalog" (permiso general)

## 7. RESUMEN DE CAMBIOS

| Componente | Cambio | Prioridad |
|------------|--------|-----------|
| **BDD - Tabla `permissions`** | Agregar columna `route` (NULLABLE) | **ALTA** |
| **GET `/permisos`** | Incluir campo `route` en respuesta | **ALTA** |
| **POST `/permisos`** | Aceptar campo `route` opcional | **ALTA** |
| **PUT `/permisos/{id}`** | Aceptar campo `route` opcional | **ALTA** |
| **GET `/menu`** | Cambiar lógica de filtrado (híbrida) | **CRÍTICA** |
| **Verificación de acceso** | Implementar middleware/endpoint | **MEDIA** |
| **Migración de datos** | Script opcional para agregar `route` | **BAJA** |

## 8. VALIDACIONES Y REGLAS DE NEGOCIO

1. **`route` es opcional:**
   - Puede ser NULL
   - Si se envía, debe ser un string no vacío
   - Debe empezar con `/`

2. **Unicidad:**
   - No es necesario que `route` sea único en la tabla
   - Puede haber múltiples permisos con la misma `route` pero diferentes `action`
   - Ejemplo: `users.view` y `users.create` pueden tener la misma `route: "/security/users"`

3. **Retrocompatibilidad:**
   - Permisos sin `route` (NULL) deben seguir funcionando
   - El filtrado del menú debe soportar ambos casos (con y sin `route`)

4. **Prioridad en filtrado:**
   - Si un permiso tiene `route`, usar filtrado por ruta (más específico)
   - Si un permiso NO tiene `route`, usar filtrado por módulo (más general)

## 9. PREGUNTAS PARA ACLARAR

1. ¿Las rutas deben validarse contra una lista de rutas válidas del sistema?
2. ¿Se debe permitir wildcards en `route`? (ej: `/security/*`)
3. ¿Los permisos con `route` deben reemplazar automáticamente permisos antiguos del mismo módulo?
4. ¿Se debe implementar un endpoint de migración automática de permisos antiguos?

## 10. CONTACTO

Para dudas o aclaraciones sobre esta especificación, contactar al equipo de frontend.

---

**Versión:** 1.0  
**Fecha:** 2024-11-09  
**Estado:** Pendiente de implementación




