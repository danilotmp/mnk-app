# URLs del Menú para el Módulo de Seguridades - COMPLETO

Este documento contiene las URLs que deben agregarse a la base de datos para el menú del módulo de administración de Seguridades.

## ✅ Estado de Implementación

### Completado:
- ✅ **Dominio de Seguridades (DDD)** - Estructura completa
- ✅ **Servicios CRUD** - Usuarios, Roles, Permisos, Accesos
- ✅ **Páginas de Lista** - Todas con paginación, búsqueda y filtros
- ✅ **Formularios** - Crear/Editar para Usuarios, Roles y Permisos
- ✅ **Componentes Reutilizables** - DataTable, SearchFilterBar, InputWithFocus
- ✅ **Traducciones** - Español e Inglés completas

### Pendiente:
- ⏳ **Formularios de Accesos** - Crear/Editar (puede requerir endpoints adicionales)
- ⏳ **Asignación de Permisos a Roles** - Pantalla específica para gestionar permisos por rol

---

## 📋 Estructura del Menú

### Menú Principal: Seguridades

**Ruta base:** `/security`

---

## 🗺️ URLs del Menú para la Base de Datos

### 1. **Usuarios**
```
URL: /security/users
Label (ES): "Usuarios"
Label (EN): "Users"
Descripción (ES): "Administración de usuarios del sistema"
Descripción (EN): "System user management"
Icono: "people"
Orden: 1
Permisos requeridos: security.users.view
```

**Submenús/Opciones:**
- **Crear Usuario**
  - URL: `/security/users/create`
  - Label (ES): "Crear Usuario"
  - Label (EN): "Create User"
  - Permisos: `security.users.create`
  - Nota: Se accede desde botón en la lista

- **Editar Usuario**
  - URL: `/security/users/[id]` (dinámica, ej: `/security/users/123`)
  - Label (ES): "Editar Usuario"
  - Label (EN): "Edit User"
  - Permisos: `security.users.edit`
  - Nota: Se accede desde la lista, no debe agregarse como item estático

---

### 2. **Roles**
```
URL: /security/roles
Label (ES): "Roles"
Label (EN): "Roles"
Descripción (ES): "Administración de roles del sistema"
Descripción (EN): "System role management"
Icono: "key"
Orden: 2
Permisos requeridos: security.roles.view
```

**Submenús/Opciones:**
- **Crear Rol**
  - URL: `/security/roles/create`
  - Permisos: `security.roles.create`

- **Editar Rol**
  - URL: `/security/roles/[id]` (dinámica)
  - Permisos: `security.roles.edit`

- **Asignar Permisos a Rol** (Futura implementación)
  - URL: `/security/roles/[id]/permisos`
  - Permisos: `security.roles.edit`

---

### 3. **Permisos**
```
URL: /security/permissions
Label (ES): "Permisos"
Label (EN): "Permissions"
Descripción (ES): "Administración de permisos del sistema"
Descripción (EN): "System permission management"
Icono: "lock-closed"
Orden: 3
Permisos requeridos: security.permissions.view
```

**Submenús/Opciones:**
- **Crear Permiso**
  - URL: `/security/permissions/create`
  - Permisos: `security.permissions.create`

- **Editar Permiso**
  - URL: `/security/permissions/[id]` (dinámica)
  - Permisos: `security.permissions.edit`

---

### 4. **Accesos**
```
URL: /security/accesses
Label (ES): "Accesos"
Label (EN): "Accesses"
Descripción (ES): "Administración de accesos de usuarios"
Descripción (EN): "User access management"
Icono: "shield-checkmark"
Orden: 4
Permisos requeridos: security.accesses.view
```

**Submenús/Opciones:**
- **Crear Acceso**
  - URL: `/security/accesses/create`
  - Permisos: `security.accesses.create`
  - Nota: Pendiente de implementación

- **Editar Acceso**
  - URL: `/security/accesses/[id]` (dinámica)
  - Permisos: `security.accesses.edit`
  - Nota: Pendiente de implementación

---

## 📊 Estructura JSON para la Base de Datos

```json
{
  "id": "security",
  "label": {
    "es": "Seguridades",
    "en": "Security"
  },
  "description": {
    "es": "Módulo de administración de seguridad",
    "en": "Security management module"
  },
  "route": "/security",
  "icon": "shield",
  "order": 100,
  "permissions": ["security.*"],
  "submenu": [
    {
      "id": "security-users",
      "label": {
        "es": "Usuarios",
        "en": "Users"
      },
      "description": {
        "es": "Administración de usuarios del sistema",
        "en": "System user management"
      },
      "route": "/security/users",
      "icon": "people",
      "order": 1,
      "permissions": ["security.users.view"]
    },
    {
      "id": "security-roles",
      "label": {
        "es": "Roles",
        "en": "Roles"
      },
      "description": {
        "es": "Administración de roles del sistema",
        "en": "System role management"
      },
      "route": "/security/roles",
      "icon": "key",
      "order": 2,
      "permissions": ["security.roles.view"]
    },
    {
      "id": "security-permissions",
      "label": {
        "es": "Permisos",
        "en": "Permissions"
      },
      "description": {
        "es": "Administración de permisos del sistema",
        "en": "System permission management"
      },
      "route": "/security/permissions",
      "icon": "lock-closed",
      "order": 3,
      "permissions": ["security.permissions.view"]
    },
    {
      "id": "security-accesses",
      "label": {
        "es": "Accesos",
        "en": "Accesses"
      },
      "description": {
        "es": "Administración de accesos de usuarios",
        "en": "User access management"
      },
      "route": "/security/accesses",
      "icon": "shield-checkmark",
      "order": 4,
      "permissions": ["security.accesses.view"]
    }
  ]
}
```

---

## 🔑 Permisos Requeridos

Para acceder a estas pantallas, los usuarios deben tener los siguientes permisos:

### Usuarios
- Ver: `security.users.view`
- Crear: `security.users.create`
- Editar: `security.users.edit`
- Eliminar: `security.users.delete`

### Roles
- Ver: `security.roles.view`
- Crear: `security.roles.create`
- Editar: `security.roles.edit`
- Eliminar: `security.roles.delete`

### Permisos
- Ver: `security.permissions.view`
- Crear: `security.permissions.create`
- Editar: `security.permissions.edit`
- Eliminar: `security.permissions.delete`

### Accesos
- Ver: `security.accesses.view`
- Crear: `security.accesses.create`
- Editar: `security.accesses.edit`
- Eliminar: `security.accesses.delete`

---

## 🔌 Endpoints Backend Necesarios

### ✅ Implementados en el Frontend:

#### Usuarios (`/seguridades/usuarios`)
- ✅ `GET /seguridades/usuarios` - Listar usuarios (paginación, filtros)
- ✅ `GET /seguridades/usuarios/{id}` - Obtener usuario por ID
- ✅ `POST /seguridades/usuarios` - Crear usuario
- ✅ `PUT /seguridades/usuarios/{id}` - Actualizar usuario
- ✅ `DELETE /seguridades/usuarios/{id}` - Eliminar usuario (soft delete)
- ⏳ `PATCH /seguridades/usuarios/{id}/toggle-status` - Activar/Desactivar (no verificado en Swagger)

#### Roles (`/seguridades/roles`)
- ✅ `GET /seguridades/roles` - Listar roles (paginación, filtros)
- ✅ `GET /seguridades/roles/{id}` - Obtener rol por ID
- ✅ `POST /seguridades/roles` - Crear rol
- ✅ `PUT /seguridades/roles/{id}` - Actualizar rol
- ✅ `DELETE /seguridades/roles/{id}` - Eliminar rol (soft delete)
- ⏳ `POST /seguridades/roles/{id}/permisos` - Asignar permisos (no verificado en Swagger)
- ⏳ `DELETE /seguridades/roles/{id}/permisos` - Remover permisos (no verificado en Swagger)

#### Permisos (`/seguridades/permisos`)
- ✅ `GET /seguridades/permisos` - Listar permisos (paginación, filtros)
- ✅ `GET /seguridades/permisos/{id}` - Obtener permiso por ID
- ✅ `POST /seguridades/permisos` - Crear permiso
- ✅ `PUT /seguridades/permisos/{id}` - Actualizar permiso
- ✅ `DELETE /seguridades/permisos/{id}` - Eliminar permiso (soft delete)
- ⏳ `GET /seguridades/permisos/por-modulo` - Obtener permisos agrupados por módulo (no verificado en Swagger)

#### Accesos (`/seguridades/accesos`)
- ⏳ `GET /seguridades/accesos` - Listar accesos (paginación, filtros) - **NO VERIFICADO EN SWAGGER**
- ⏳ `GET /seguridades/accesos/{id}` - Obtener acceso por ID - **NO VERIFICADO EN SWAGGER**
- ⏳ `GET /seguridades/accesos/usuario/{userId}` - Obtener accesos de un usuario - **NO VERIFICADO EN SWAGGER**
- ⏳ `POST /seguridades/accesos` - Crear acceso - **NO VERIFICADO EN SWAGGER**
- ⏳ `PUT /seguridades/accesos/{id}` - Actualizar acceso - **NO VERIFICADO EN SWAGGER**
- ⏳ `DELETE /seguridades/accesos/{id}` - Eliminar acceso - **NO VERIFICADO EN SWAGGER**
- ⏳ `POST /seguridades/accesos/{id}/permisos` - Asignar permisos adicionales - **NO VERIFICADO EN SWAGGER**

**⚠️ NOTA IMPORTANTE:** Los endpoints de **Accesos** no aparecen en el Swagger revisado. Se debe verificar:
1. Si existen estos endpoints en el backend
2. Si tienen una estructura diferente
3. Si se manejan de otra manera (ej: como parte de usuarios o roles)

---

## 🎨 Características Implementadas

### Páginas de Lista
- ✅ Paginación completa (10, 25, 50, 100 registros)
- ✅ Búsqueda en tiempo real
- ✅ Filtros configurables
- ✅ Botones de navegación rápida (primera, anterior, siguiente, última)
- ✅ Selector de cantidad de registros por página
- ✅ Estado de carga y mensajes vacíos
- ✅ Acciones por fila (editar, eliminar, activar/desactivar)
- ✅ Diseño responsive

### Formularios
- ✅ Validación completa de campos
- ✅ Manejo de errores con detalles
- ✅ Estados de carga
- ✅ Campos requeridos marcados con *
- ✅ Auto-generación de códigos (permisos)
- ✅ Selección de empresas y roles desde servicios
- ✅ Soporte para cambio opcional de contraseña (editar usuario)

### Componentes Reutilizables
- ✅ **DataTable**: Tabla con paginación, búsqueda y acciones
- ✅ **SearchFilterBar**: Barra de búsqueda y filtros configurables
- ✅ **InputWithFocus**: Input con manejo correcto de focus y estilos

---

## 📝 Notas Importantes

1. **Rutas dinámicas:** Las rutas con `[id]` (como `/security/users/[id]`) no deben agregarse como items estáticos en el menú, ya que son páginas dinámicas que se acceden desde las listas.

2. **Rutas de creación:** Las rutas `/create` se acceden desde botones "Crear" en cada página de lista.

3. **Jerarquía:** El módulo de Seguridades debe estar al mismo nivel que otros módulos principales o dentro de un menú de "Administración" si existe.

4. **Permisos:** El backend debe validar los permisos antes de mostrar estas opciones en el menú dinámico.

5. **Idiomas:** Todos los labels y descripciones soportan español (es) e inglés (en).

6. **Endpoints de Accesos:** Los endpoints de accesos no aparecen en el Swagger. Se debe verificar con el backend si existen o si se manejan de otra manera.

---

## 🔄 Servicios que NO aparecen en el Swagger (posiblemente necesarios)

Si se necesita implementar completamente la funcionalidad de accesos, podrían ser necesarios los siguientes servicios adicionales:

1. **Obtener lista de empresas**
   - `GET /empresas` o similar
   - Para seleccionar empresa al crear usuario/rol/acceso

2. **Obtener lista de sucursales por empresa**
   - `GET /empresas/{id}/sucursales` o similar
   - Para seleccionar sucursales al crear acceso

3. **Obtener permisos agrupados por módulo**
   - `GET /seguridades/permisos/por-modulo`
   - Para facilitar la asignación de permisos a roles

4. **Obtener roles disponibles (sin paginación, para selectores)**
   - `GET /seguridades/roles/all` o similar
   - Para mostrar en selectores sin necesidad de paginación

5. **Endpoints de Accesos** (completos):
   - Todos los endpoints listados anteriormente en la sección de Accesos

---

## 📋 Checklist de Implementación

### Frontend
- ✅ Dominio de Seguridades (DDD)
- ✅ Servicios CRUD para todas las entidades
- ✅ Páginas de lista para todas las entidades
- ✅ Formularios de crear/editar usuarios
- ✅ Formularios de crear/editar roles
- ✅ Formularios de crear/editar permisos
- ⏳ Formularios de crear/editar accesos (pendiente verificar endpoints)
- ⏳ Pantalla de asignación de permisos a roles
- ✅ Componentes reutilizables
- ✅ Traducciones completas

### Backend (Verificar)
- ✅ Endpoints de Usuarios - Confirmados en Swagger
- ✅ Endpoints de Roles - Confirmados en Swagger
- ✅ Endpoints de Permisos - Confirmados en Swagger
- ❓ Endpoints de Accesos - **NO APARECEN EN SWAGGER**
- ❓ Endpoint para activar/desactivar usuario - **NO VERIFICADO**
- ❓ Endpoints de asignación de permisos a roles - **NO VERIFICADOS**

---

**Última actualización:** $(date)

