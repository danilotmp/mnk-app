---
inclusion: always
---

# AIBox Frontend — Steering de Proyecto

## Documentación

La documentación del proyecto está en `documents/`. Leerla antes de hacer cambios significativos:

- `documents/CONTEXTO-DESARROLLO.md` — Qué es, stack, arquitectura, estructura de carpetas, convenciones, estados, providers, comandos.
- `documents/ADR.md` — Decisiones arquitectónicas con contexto y razón.
- `documents/ESTANDARES.md` — Reglas de implementación, checklists, patrón de componentes, iconos, deuda técnica.
- `documents/INTEGRACION-API.md` — Contrato con backend: respuestas, headers, JWT, endpoints por dominio.

## Stack

- React Native 0.81 + Expo SDK 54 + Expo Router 6 (file-based routing).
- TypeScript 5.9 strict. Path alias `@/` apunta a la raíz.
- State management: React Context API + useState/useRef local. No hay Zustand ni Redux.
- Estilos: StyleSheet.create con sistema de temas propio (Light/Dark).
- i18n: sistema propio con `useTranslation()`.
- HTTP: `apiClient` singleton (fetch nativo envuelto).

## Arquitectura

### Estructura de carpetas

```
app/                    → SOLO rutas (wrappers delgados, 5-10 líneas máximo)
src/features/           → Features completas por dominio (adapters, components, screens, services, types, hooks)
src/domains/            → Compartidos por dominio. shared/ para cross-domain
src/infrastructure/     → API client, i18n, menu, messages, session, access
src/config/             → AppConfig centralizado
src/styles/             → Temas (base, light, dark), estilos de componentes y páginas
components/             → UI genéricos (Button, SideModal, StatusBadge, ThemedText, etc.)
constants/              → Tema central en uso (LightTheme, DarkTheme, Typography, PageLayout, ModalLayout)
hooks/                  → Hooks raíz (useTheme, useResponsive, useColorScheme)
```

### Flujo de datos

```
Screen → Service → Adapter → ApiClient → Backend
```

### Cuándo usar cada carpeta

- `src/features/[domain]/[feature]/` — Feature completa con screens, services, types propios.
- `src/domains/[domain]/` — Componentes/servicios compartidos DENTRO de un dominio.
- `src/domains/shared/` — Componentes/servicios compartidos CROSS-DOMAIN (DataTable, SearchFilterBar, etc.).
- `components/ui/` — Componentes UI base reutilizables en toda la app.

## Patrón de componentes

Cada componente en su carpeta con tres archivos:

```
component-name/
├── component-name.tsx          # Lógica y JSX
├── component-name.styles.ts    # Factory: createComponentStyles(theme)
└── component-name.types.ts     # Interfaces y tipos
```

- Estilos SIEMPRE en `.styles.ts`, nunca inline (excepto valores dinámicos de props/estado).
- Factory de estilos recibe theme: `createStyles({ colors, spacing, typography, ... })`.
- Prohibido colores, tamaños o espaciados hardcodeados. Siempre tokens del tema.

## Convenciones de nombrado

### Archivos (kebab-case)

- Componente: `user-create-form.tsx`
- Estilos: `user-create-form.styles.ts`
- Tipos: `user-create-form.types.ts`
- Servicio: `users.service.ts`
- Hook: `use-users.hook.ts`
- Screen: `users-list.screen.tsx`
- Adapter: `user.adapter.ts`

### Código

- Componentes: PascalCase (`UserCreateForm`)
- Servicios: PascalCase + Service (`UsersService`), clases estáticas con métodos async
- Hooks: camelCase con `use` (`useUsers`)
- Tipos/Interfaces: PascalCase (`UserFilters`)
- Enums: PascalCase (`RecordStatus`)

### Orden de imports

1. React
2. Librerías externas
3. Componentes internos
4. Hooks
5. Servicios
6. Tipos
7. Estilos

## Conexión con backend

### Headers automáticos (enviados por apiClient)

- `Authorization: Bearer <accessToken>`
- `Accept-Language: es|en`
- `company-code: AIBOX` (o el código de empresa activa)
- `user-id: <uuid>`
- `Content-Type: application/json`

### Formato de respuesta estándar

```typescript
{ data: T, result: { statusCode, type?, description, details } }
```

Paginados incluyen `meta: { page, limit, total, totalPages, hasNext, hasPrev }`.

### JWT

- Refresh automático transparente en apiClient (401 → refresh → reintento).
- Si refresh falla → evento `tokenExpired` → limpia sesión → redirige a login.
- Requests concurrentes durante refresh se encolan.

## Sistema de estados

Sincronizado con backend (`RecordStatus` enum):

- `-1` Eliminado (gris), `0` Inactivo (rojo), `1` Activo (verde), `2` Pendiente (ámbar), `3` Suspendido (naranja).
- Siempre mostrar `statusDescription` del backend. Fallback: enum local.
- Visual: componente `StatusBadge`.

## Manejo de errores

- Fuera de modales: `alert.showError(message)` → Toast.
- Dentro de modales: `InlineAlert` vía prop `topAlert` del SideModal/CenteredModal. Prohibido usar toasts dentro de modales.
- El backend puede enviar `result.type` (success/error/warning/info) y el front enruta al toast correspondiente.
- Confirmaciones destructivas: `alert.showConfirm` o `alert.showConfirmDirect`.

## Tema y estilos

- Tema central: `constants/theme.ts` (LightPalette, DarkPalette, Typography, PageLayout, ModalLayout).
- Consumo: `useTheme()` expone `colors`, `spacing`, `typography`, `borderRadius`, `shadows`, `pageLayout`, `modalLayout`, `isDark`.
- Modales usan tokens de `ModalLayout` (headerPadding, contentPadding, footerPadding, etc.).
- Páginas usan tokens de `PageLayout` (titleSubtitleGap, headerTitleGap, iconTitle, etc.).
- Responsivo: `useResponsive()` expone `isMobile`, `isTablet`, `isDesktop`.

## i18n

- Traducciones en `src/infrastructure/i18n/translations/[lang].ts`.
- Consumo: `const { t } = useTranslation()`.
- Optional chaining: `t.security?.users?.title || 'Fallback'`.
- Prohibido strings hardcodeados visibles al usuario.
- Agregar textos nuevos en ambos idiomas (es + en).

## Providers (orden en _layout.tsx)

```
LanguageProvider → CustomThemeProvider → MultiCompanyProvider → ToastProvider → LayoutContent + ToastContainer
```

## Patrones de screens de administración

Seguir el patrón de `users-list.screen.tsx`:

1. `useRouteAccessGuard(pathname)` para control de acceso.
2. Header: icono + título + subtítulo (tokens de pageLayout).
3. `SearchFilterBar` para filtros locales y remotos.
4. `DataTable` con paginación, columnas tipadas, `StatusBadge` en columna de estado.
5. `SideModal` para crear/editar con `InlineAlert` para errores.
6. Formularios exponen acciones vía `onFormReady({ isLoading, handleSubmit, handleCancel, generalError })`.
7. Campos críticos con `useRef` para evitar stale closures.
8. Optimización: actualización local tras edición exitosa (`justEditedRef`).

## Servicios

- Clases estáticas (no instancias). Métodos estáticos async.
- Usan `apiClient` centralizado (nunca fetch directo).
- Retornan tipos de dominio (transformados por adapters si es necesario).
- Campos `code` se formatean: mayúsculas, espacios → `_`, sin caracteres especiales.
