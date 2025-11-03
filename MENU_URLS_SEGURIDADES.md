# URLs del Menú para el Módulo de Seguridades

Este documento contiene las URLs que deben agregarse a la base de datos para el menú del módulo de administración de Seguridades.

## Estructura del Menú

El módulo de Seguridades debe tener una estructura jerárquica con las siguientes opciones:

### Menú Principal: Seguridades

**Ruta base:** `/security`

---

## URLs del Menú

### 1. Usuarios
- **URL:** `/security/users`
- **Label (ES):** "Usuarios"
- **Label (EN):** "Users"
- **Descripción (ES):** "Administración de usuarios del sistema"
- **Descripción (EN):** "System user management"
- **Icono:** `people` (Ionicons)
- **Orden:** 1

**Submenu:**
- **Crear Usuario**
  - **URL:** `/security/users/create`
  - **Label (ES):** "Crear Usuario"
  - **Label (EN):** "Create User"
  - **Descripción (ES):** "Crear nuevo usuario"
  - **Descripción (EN):** "Create new user"
  - **Orden:** 1.1

- **Editar Usuario** (página dinámica, ID en parámetro)
  - **URL:** `/security/users/[id]` (ejemplo: `/security/users/123`)
  - **Label (ES):** "Editar Usuario"
  - **Label (EN):** "Edit User"
  - **Descripción (ES):** "Editar usuario existente"
  - **Descripción (EN):** "Edit existing user"
  - **Orden:** 1.2
  - **Nota:** Esta ruta es dinámica, no debe agregarse al menú estático, pero debe estar disponible cuando se accede desde la lista.

---

### 2. Roles
- **URL:** `/security/roles`
- **Label (ES):** "Roles"
- **Label (EN):** "Roles"
- **Descripción (ES):** "Administración de roles del sistema"
- **Descripción (EN):** "System role management"
- **Icono:** `key` (Ionicons)
- **Orden:** 2

**Submenu:**
- **Crear Rol**
  - **URL:** `/security/roles/create`
  - **Label (ES):** "Crear Rol"
  - **Label (EN):** "Create Role"
  - **Descripción (ES):** "Crear nuevo rol"
  - **Descripción (EN):** "Create new role"
  - **Orden:** 2.1

- **Editar Rol** (página dinámica, ID en parámetro)
  - **URL:** `/security/roles/[id]` (ejemplo: `/security/roles/456`)
  - **Label (ES):** "Editar Rol"
  - **Label (EN):** "Edit Role"
  - **Descripción (ES):** "Editar rol existente"
  - **Descripción (EN):** "Edit existing role"
  - **Orden:** 2.2
  - **Nota:** Esta ruta es dinámica, no debe agregarse al menú estático, pero debe estar disponible cuando se accede desde la lista.

---

### 3. Permisos
- **URL:** `/security/permissions`
- **Label (ES):** "Permisos"
- **Label (EN):** "Permissions"
- **Descripción (ES):** "Administración de permisos del sistema"
- **Descripción (EN):** "System permission management"
- **Icono:** `lock-closed` (Ionicons)
- **Orden:** 3

**Submenu:**
- **Crear Permiso**
  - **URL:** `/security/permissions/create`
  - **Label (ES):** "Crear Permiso"
  - **Label (EN):** "Create Permission"
  - **Descripción (ES):** "Crear nuevo permiso"
  - **Descripción (EN):** "Create new permission"
  - **Orden:** 3.1

- **Editar Permiso** (página dinámica, ID en parámetro)
  - **URL:** `/security/permissions/[id]` (ejemplo: `/security/permissions/789`)
  - **Label (ES):** "Editar Permiso"
  - **Label (EN):** "Edit Permission"
  - **Descripción (ES):** "Editar permiso existente"
  - **Descripción (EN):** "Edit existing permission"
  - **Orden:** 3.2
  - **Nota:** Esta ruta es dinámica, no debe agregarse al menú estático, pero debe estar disponible cuando se accede desde la lista.

---

### 4. Accesos
- **URL:** `/security/accesses`
- **Label (ES):** "Accesos"
- **Label (EN):** "Accesses"
- **Descripción (ES):** "Administración de accesos de usuarios"
- **Descripción (EN):** "User access management"
- **Icono:** `shield-checkmark` (Ionicons)
- **Orden:** 4

**Submenu:**
- **Crear Acceso**
  - **URL:** `/security/accesses/create`
  - **Label (ES):** "Crear Acceso"
  - **Label (EN):** "Create Access"
  - **Descripción (ES):** "Crear nuevo acceso"
  - **Descripción (EN):** "Create new access"
  - **Orden:** 4.1

- **Editar Acceso** (página dinámica, ID en parámetro)
  - **URL:** `/security/accesses/[id]` (ejemplo: `/security/accesses/101`)
  - **Label (ES):** "Editar Acceso"
  - **Label (EN):** "Edit Access"
  - **Descripción (ES):** "Editar acceso existente"
  - **Descripción (EN):** "Edit existing access"
  - **Orden:** 4.2
  - **Nota:** Esta ruta es dinámica, no debe agregarse al menú estático, pero debe estar disponible cuando se accede desde la lista.

---

## Estructura JSON para la Base de Datos

### Ejemplo de estructura para el menú de Seguridades:

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
      "order": 1
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
      "order": 2
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
      "order": 3
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
      "order": 4
    }
  ]
}
```

---

## Permisos Requeridos

Para acceder a estas pantallas, los usuarios deben tener los siguientes permisos:

- **Usuarios:**
  - Ver: `security.users.view`
  - Crear: `security.users.create`
  - Editar: `security.users.edit`
  - Eliminar: `security.users.delete`

- **Roles:**
  - Ver: `security.roles.view`
  - Crear: `security.roles.create`
  - Editar: `security.roles.edit`
  - Eliminar: `security.roles.delete`

- **Permisos:**
  - Ver: `security.permissions.view`
  - Crear: `security.permissions.create`
  - Editar: `security.permissions.edit`
  - Eliminar: `security.permissions.delete`

- **Accesos:**
  - Ver: `security.accesses.view`
  - Crear: `security.accesses.create`
  - Editar: `security.accesses.edit`
  - Eliminar: `security.accesses.delete`

---

## Notas Importantes

1. **Rutas dinámicas:** Las rutas con `[id]` (como `/security/users/[id]`) no deben agregarse como items estáticos en el menú, ya que son páginas dinámicas que se acceden desde las listas.

2. **Rutas de creación:** Las rutas `/create` pueden agregarse como submenu o como acciones dentro de cada lista. La implementación actual usa botones "Crear" en cada página de lista.

3. **Jerarquía:** El módulo de Seguridades debe estar al mismo nivel que otros módulos principales (Productos, Servicios, etc.) o dentro de un menú de "Administración" si existe.

4. **Permisos:** El backend debe validar los permisos antes de mostrar estas opciones en el menú dinámico.

5. **Idiomas:** Todos los labels y descripciones deben soportar al menos español (es) e inglés (en).

---

## Servicios Backend Necesarios

Los siguientes endpoints deben estar implementados en el backend (ya están implementados en los servicios del frontend):

### Usuarios
- `GET /seguridades/usuarios` - Listar usuarios (con paginación y filtros)
- `GET /seguridades/usuarios/:id` - Obtener usuario por ID
- `POST /seguridades/usuarios` - Crear usuario
- `PUT /seguridades/usuarios/:id` - Actualizar usuario
- `DELETE /seguridades/usuarios/:id` - Eliminar usuario
- `PATCH /seguridades/usuarios/:id/toggle-status` - Activar/Desactivar usuario

### Roles
- `GET /seguridades/roles` - Listar roles (con paginación y filtros)
- `GET /seguridades/roles/:id` - Obtener rol por ID
- `POST /seguridades/roles` - Crear rol
- `PUT /seguridades/roles/:id` - Actualizar rol
- `DELETE /seguridades/roles/:id` - Eliminar rol
- `POST /seguridades/roles/:id/permisos` - Asignar permisos a rol
- `DELETE /seguridades/roles/:id/permisos` - Remover permisos de rol

### Permisos
- `GET /seguridades/permisos` - Listar permisos (con paginación y filtros)
- `GET /seguridades/permisos/:id` - Obtener permiso por ID
- `POST /seguridades/permisos` - Crear permiso
- `PUT /seguridades/permisos/:id` - Actualizar permiso
- `DELETE /seguridades/permisos/:id` - Eliminar permiso
- `GET /seguridades/permisos/por-modulo` - Obtener permisos agrupados por módulo

### Accesos
- `GET /seguridades/accesos` - Listar accesos (con paginación y filtros)
- `GET /seguridades/accesos/:id` - Obtener acceso por ID
- `GET /seguridades/accesos/usuario/:userId` - Obtener accesos de un usuario
- `POST /seguridades/accesos` - Crear acceso
- `PUT /seguridades/accesos/:id` - Actualizar acceso
- `DELETE /seguridades/accesos/:id` - Eliminar acceso
- `POST /seguridades/accesos/:id/permisos` - Asignar permisos adicionales a un acceso

---

## Implementación Frontend

### Estado Actual:
✅ Servicios implementados
✅ Páginas de lista implementadas
✅ Componentes reutilizables (DataTable, SearchFilterBar)
✅ Traducciones en español e inglés
⏳ Páginas de formularios (crear/editar) - Pendiente

### Próximos Pasos:
1. Implementar páginas de formularios para crear/editar cada entidad
2. Implementar validaciones de formularios
3. Implementar componentes de selección para relaciones (empresa, rol, permisos, etc.)
4. Agregar protección de rutas con permisos (si es necesario)

---

**Última actualización:** $(date)

