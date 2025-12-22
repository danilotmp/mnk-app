## Implementación - Notificaciones (Fase 1 Email) y Registro con Verificación

### Alcance confirmado
- Notificaciones F1: canal email único, colas Bull/Redis, plantillas multilenguaje con herencia global/empresa; reply-to por plantilla → fallback empresa → remitente; SMTP global; bandera de throttling lista (OFF); logs redacted; endpoint de retry para fallidos.
- Registro/verificación: código numérico 6 dígitos, TTL 15 min, 3 intentos, 3 reenvíos, captcha OFF; rol `guest`; empresa por defecto la primera; rate-limit por IP/correo.
- Parámetros/catálogos: tablas separadas; `system_params` tipados y sin hardcode; `catalogs` + `catalog_entries` con jerarquía y `externalCode` para homologación; herencia global/empresa.
- Auditoría: solo campos básicos (`createdAt/By`, `updatedAt/By`), sin historial detallado.

### Menú propuesto (Seguridades)
- Columna Administración: Empresas (`/security/companies`), Sucursales (`/security/branches`), Menú (`/security/menu`).
- Columna Perfilamiento: Usuarios, Permisos, Roles.
- Columna Notificaciones: Plantillas (`/notifications/templates`), Envíos (`/notifications/sends`), Parámetros Notif (`/notifications/params`).
- Columna Sistema: Catálogos (`/catalogs`), Parámetros (`/config/system-params`).
- Parámetros: una sola pantalla, filtrada/agrupada por scope (auth, notifications, system, auditoria, etc.).

### UI / Front
- Plantillas: CRUD, herencia global/empresa, vista previa, envío de prueba; editor WYSIWYG free permitido (`react-native-quilljs`) guardando HTML (markdown opcional renderizado a HTML); back bloquea scripts peligrosos.
- Envíos: tabla/log con filtros (code, estado, fecha, empresa, idioma), detalle de error/reintentos; acción retry sobre estados failed.
- Parámetros: CRUD único por scope/company con validación de tipo.
- Catálogos: CRUD cabecera/detalle con jerarquía y herencia global/empresa. Sin export CSV por ahora.

### Backend (respuestas/expectativas)
- Plantillas aceptan HTML enriquecido; WYSIWYG OK; markdown se renderiza a HTML.
- Logs de envíos redacted: enmascarar correos/vars sensibles; guardar estado, code plantilla, error, destinatarios enmascarados, metadatos.
- Retry: endpoint para reintentar estados failed con la misma payload, validando límites/reintentos.
- Auth/headers: mismo Bearer + headers de contexto (empresa/usuario); el back resuelve herencias con esa info.
- Rate limits registro: TTL 15 min, 3 intentos, 3 reenvíos, captcha OFF; al exceder, devolver códigos claros para bloquear UI.
- Parámetros: un CRUD de `system_params` con scopes indicados; sin scopes extra por ahora.
- Export CSV catálogos: no se implementa en esta fase.

### Diseño de datos (back)
- `notification_templates`: id, companyId (nullable), code, channel=email, lang, subject, body (HTML), requiredVars, metadata (prioridad/retries), replyTo, status, audit.
- `notifications` (log/envíos): id, templateCode, companyId, recipients (enmascarados), status, error, retries, payloadRedacted (metadatos), audit.
- `notification_delivery_attempts` (opcional): notificationId, status, error, retriedAt, audit.
- `system_params`: key, value, type (string/number/bool/duration), scope (auth, notifications, system, auditoria, …), companyId nullable, description, audit.
- `catalogs`: id, code, name, description, status, companyId nullable, isHierarchical, audit.
- `catalog_entries`: id, catalogId, code, name, description, parentEntryId nullable, companyId nullable, externalCode, metadata, status, audit. Índices por (catalogId, companyId, code) y (catalogId, companyId, externalCode).

### Servicios / Casos de uso (back)
- Notificaciones
  - CRUD plantillas (`/notifications/templates`): herencia global/empresa; valida requiredVars; soporta HTML.
  - Envío (`/notifications/send`): code, companyId, recipients[], variables{}, lang?, channel=email, replyTo? override. Valida requiredVars, render HTML, encola en Bull, log redacted.
  - Retry: endpoint para reintentar notificaciones en estado failed con misma payload (back controla límites).
  - Logs: listar envíos con filtros (code, estado, fecha, empresa, idioma), detalle de error/reintentos.
- Registro/verificación
  - `POST /auth/register`: crea usuario PENDING_EMAIL, genera código 6 dígitos, TTL 15, reenvíos máx 3, intentos máx 3; dispara email (usa notifs).
  - `POST /auth/verify-email`: valida código (respeta TTL/intent); activa, asigna rol guest, empresa default la primera.
  - `POST /auth/resend-code`: respeta límite 3 reenvíos; rehace TTL.
  - Rate-limit por IP/correo para registro/verificación. Errores claros para bloquear UI al exceder límites.
- Parámetros
  - CRUD `system_params` (un solo UI) con filtro por scope; herencia global/empresa; validación de tipo; sin hardcode.
- Catálogos
  - Cabecera/detalle; herencia global/empresa; jerarquía via parentEntryId; externalCode para homologación. API para árbol y filtros por catalogCode + parentEntryId.

### Integración Front–Back
- Plantillas: almacenar/renderizar HTML; usar editor WYSIWYG o textarea + preview. Back bloquea scripts peligrosos.
- Logs: payload redacted (enmascarar correos y variables sensibles). Mostrar estado, error, intentos.
- Retry: botón “Reintentar” visible solo en failed; llama endpoint de retry.
- Auth/headers: Bearer + headers de contexto actuales (empresa/usuario); el back resuelve herencias con esa info.
- Parámetros: una pantalla con scopes (auth, notifications, system, auditoria…). Catálogos: una pantalla cabecera/detalle con jerarquía y homologación.
- Menú: aplicar estructura de columnas indicada en Seguridades.

### Parámetros iniciales (system_params, global por defecto)
- auth: ttl_minutes=15, max_attempts=3, max_resends=3, captcha.enabled=false
- notifications: throttling.enabled=false, email.reply_to.default (opcional), email.retry_limit (opcional/null)
- multiempresa (opcional): tenant.default_company_id (si no, se usa la primera empresa)

### Entregables de implementación (back)
1. Migraciones para: notification_templates, notifications (+attempts opcional), system_params, catalogs, catalog_entries.
2. Ports/adapters: email (SMTP global), colas Bull/Redis, render HTML seguro, logging redacted.
3. Endpoints: templates CRUD, send, retry; registro/verify/resend; catálogos; system_params.
4. Middlewares/guards: rate-limit registro/verificación; auditoría básica.
5. Config: bandera throttling (OFF), SMTP global, scopes parametrizables.

### JSON de menú sugerido (referencia)
```json
{
  "id": "security",
  "label": "Seguridades",
  "isPublic": false,
  "route": "/security",
  "icon": "MaterialIcons:security",
  "columns": [
    {
      "title": "Administración",
      "items": [
        { "id": "companies", "label": "Empresas", "route": "/security/companies", "icon": "business", "isPublic": false },
        { "id": "branches", "label": "Sucursales", "route": "/security/branches", "icon": "MaterialIcons:store", "isPublic": false },
        { "id": "menu", "label": "Menú", "route": "/security/menu", "icon": "menu", "isPublic": false }
      ]
    },
    {
      "title": "Perfilamiento",
      "items": [
        { "id": "users", "label": "Usuarios", "route": "/security/users", "icon": "people", "isPublic": false },
        { "id": "permissions", "label": "Permisos", "route": "/security/permissions", "icon": "MaterialIcons:lock", "isPublic": false },
        { "id": "roles", "label": "Roles", "route": "/security/roles", "icon": "MaterialIcons:admin-panel-settings", "isPublic": false }
      ]
    },
    {
      "title": "Notificaciones",
      "items": [
        { "id": "notif-templates", "label": "Plantillas", "route": "/notifications/templates", "icon": "mail-outline", "isPublic": false },
        { "id": "notif-sends", "label": "Envíos", "route": "/notifications/sends", "icon": "send-outline", "isPublic": false },
        { "id": "notif-params", "label": "Parámetros Notif", "route": "/notifications/params", "icon": "settings-outline", "isPublic": false }
      ]
    },
    {
      "title": "Sistema",
      "items": [
        { "id": "catalogs", "label": "Catálogos", "route": "/catalogs", "icon": "list-outline", "isPublic": false },
        { "id": "system-params", "label": "Parámetros", "route": "/config/system-params", "icon": "options-outline", "isPublic": false }
      ]
    }
  ]
}
```
