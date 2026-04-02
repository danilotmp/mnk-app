# Integración con API — AIBox Frontend

Contrato entre frontend y backend: formato de respuestas, headers, endpoints, autenticación y manejo de tokens.

---

## 1. Formato de Respuesta Estándar

Todas las respuestas del backend siguen esta estructura:

```typescript
interface ApiResponse<T> {
  data: T;                    // Datos solicitados (objeto, array, null)
  result: {
    statusCode: number;       // Código HTTP (200, 201, 400, 401, 403, 404, 500...)
    type?: ApiMessageType;    // "success" | "error" | "warning" | "info" (opcional)
    description: string;      // Mensaje legible
    details: any;             // Detalles adicionales del error (validación, etc.)
  };
}
```

Para listados paginados, la respuesta incluye `meta`:

```typescript
interface PaginatedApiResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  result: { statusCode: number; description: string; details: any };
}
```

### Tipo de mensaje (`result.type`)

Cuando el backend envía `result.type`, el front lo usa para decidir el tipo de notificación:

| `result.type` | Acción en front |
|---------------|----------------|
| `"success"` | Toast verde (éxito) |
| `"error"` | Toast rojo (error) |
| `"warning"` | Toast ámbar (advertencia) |
| `"info"` | Toast azul (informativo) |
| ausente | Se trata como error si el statusCode es >= 400 |

---

## 2. Headers Requeridos

El `apiClient` envía automáticamente estos headers en cada request:

| Header | Valor | Descripción |
|--------|-------|-------------|
| `Authorization` | `Bearer <accessToken>` | Token JWT de autenticación |
| `Accept-Language` | `es` \| `en` | Idioma activo del usuario |
| `company-code` | `AIBOX`, `OPTIMAGEN`, etc. | Código de empresa activa |
| `user-id` | UUID del usuario | Identificador del usuario autenticado |
| `Content-Type` | `application/json` | Tipo de contenido |
| `app-source` | `web` \| `mobile` | Plataforma de origen |

El `company-code` se configura vía `EXPO_PUBLIC_COMPANY_CODE` (default: `AIBOX`) o se actualiza dinámicamente al cambiar de empresa en el contexto multiempresa.

---

## 3. Autenticación JWT

### Flujo de Login

```
POST /security/auth/login
Body: { email, password }
Response: { data: { accessToken, refreshToken, user }, result: {...} }
```

Los tokens se almacenan en `AsyncStorage` vía `StorageAdapter`.

### Refresh Automático

El `apiClient` maneja el refresh de forma transparente:

1. Un request recibe 401 (token expirado).
2. `apiClient` llama a `POST /security/auth/refresh-token` con el refresh token.
3. Si el refresh es exitoso, reintenta el request original con el nuevo access token.
4. Si el refresh falla, emite evento `tokenExpired` → se limpia la sesión y se redirige al login.
5. Requests concurrentes durante el refresh se encolan y se resuelven cuando el refresh termina.

### Configuración de Tokens

| Parámetro | Default | Configurable en |
|-----------|---------|----------------|
| Access token duration | 15 minutos | `AppConfig.auth.accessTokenDuration` |
| Refresh token duration | 7 días | `AppConfig.auth.refreshTokenDuration` |
| Refresh threshold | 5 minutos antes de expirar | `AppConfig.auth.tokenRefreshThreshold` |

---

## 4. Endpoints por Dominio

### Autenticación (`/security/auth/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/security/auth/login` | Login |
| POST | `/security/auth/register` | Registro |
| POST | `/security/auth/refresh-token` | Refresh de token |
| POST | `/security/auth/logout` | Logout |

### Seguridad — Usuarios (`/security/users/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/security/users?page=&limit=&search=&status=` | Listar usuarios (paginado) |
| GET | `/security/users/:id` | Obtener usuario por ID |
| GET | `/security/users/:id/complete` | Obtener usuario completo (con empresas, roles, sucursales) |
| POST | `/security/users` | Crear usuario |
| PUT | `/security/users/:id` | Actualizar usuario |
| PUT | `/security/users/:id/complete` | Actualizar usuario completo |
| DELETE | `/security/users/:id` | Eliminar usuario (soft delete) |

### Seguridad — Roles (`/security/roles/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/security/roles?page=&limit=&search=&status=` | Listar roles |
| GET | `/security/roles/:id` | Obtener rol por ID |
| POST | `/security/roles` | Crear rol |
| PUT | `/security/roles/:id` | Actualizar rol |
| DELETE | `/security/roles/:id` | Eliminar rol |

### Seguridad — Permisos (`/security/permissions/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/security/permissions?page=&limit=&search=&status=` | Listar permisos |
| GET | `/security/permissions/:id` | Obtener permiso por ID |
| POST | `/security/permissions` | Crear permiso |
| PUT | `/security/permissions/:id` | Actualizar permiso |
| DELETE | `/security/permissions/:id` | Eliminar permiso |

### Seguridad — Empresas (`/security/companies/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/security/companies?page=&limit=&search=&status=` | Listar empresas |
| GET | `/security/companies/:id` | Obtener empresa por ID |
| POST | `/security/companies` | Crear empresa |
| PUT | `/security/companies/:id` | Actualizar empresa |

### Seguridad — Sucursales (`/security/branches/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/security/branches?page=&limit=&search=&status=&companyId=` | Listar sucursales |
| GET | `/security/branches/:id` | Obtener sucursal por ID |
| POST | `/security/branches` | Crear sucursal |
| PUT | `/security/branches/:id` | Actualizar sucursal |

### Seguridad — Menú y Acceso

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/security/menu` | Obtener menú del usuario autenticado |
| POST | `/security/admin/menu-items/sync` | Sincronizar menú (admin) |
| GET | `/security/access?route=` | Verificar acceso a ruta |

### Perfil

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/security/profile` | Obtener perfil del usuario autenticado |

---

## 5. Campos de Auditoría

Todas las entidades de administración incluyen:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `createdAt` | Date | Fecha de creación |
| `updatedAt` | Date | Fecha de última actualización |
| `createdBy` | string | ID del usuario que creó |
| `updatedBy` | string | ID del usuario que actualizó |
| `status` | number | Estado del registro (-1, 0, 1, 2, 3) |
| `statusDescription` | string | Descripción traducida del estado |

---

## 6. Manejo de Errores de API

### En el ApiClient

- **401**: Intenta refresh token. Si falla, emite `tokenExpired`.
- **403**: Retorna error con mensaje del backend.
- **4xx/5xx**: Lanza `ApiError` con `statusCode`, `message` y `details`.

### En los Screens

```typescript
try {
  await Service.action(payload);
} catch (error: any) {
  // handleApiError retorna true si es 401/403 (ya manejado)
  if (handleApiError(error)) return;

  // Extraer mensaje y detalle del error
  const { message, detail } = extractErrorInfo(error, 'Mensaje fallback');

  // Fuera de modal: toast
  alert.showError(message, false, undefined, detail, error);

  // Dentro de modal: InlineAlert vía onFormReady
  onFormReady({ ...formActions, generalError: { message, detail } });
}
```

### Errores Silenciosos

Ciertos mensajes no muestran toast (credenciales inválidas, errores de conexión). Definidos en `SILENT_ERROR_MESSAGES` en `alert.service.ts`.

---

## 7. Configuración de API

| Parámetro | Fuente | Default |
|-----------|--------|---------|
| Base URL | `EXPO_PUBLIC_API_BASE_URL` o `app.json extra.apiBaseUrl` | `http://localhost:15000/api` |
| Timeout | `AppConfig.api.timeout` | 30000ms |
| Company Code | `EXPO_PUBLIC_COMPANY_CODE` | `AIBOX` |

En producción, si la app se sirve desde un dominio diferente a `localhost`, el `apiClient` reemplaza automáticamente el hostname de la URL base con `window.location.hostname`.
