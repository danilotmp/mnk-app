# Architecture Decision Records (ADR) — AIBox Frontend

Decisiones arquitectónicas del frontend. Cada entrada explica el porqué, no solo el cómo.

---

## ADR-001 · Expo Router como sistema de navegación

- **Fecha**: 2025-10
- **Contexto**: Se necesitaba routing multiplataforma (web + móvil) con soporte de deep linking y file-based routing.
- **Decisión**: Usar Expo Router (file-based routing). La carpeta `app/` solo contiene wrappers delgados (5-10 líneas) que importan screens de `src/features/`.
- **Consecuencias**: Rutas declarativas, navegación consistente entre plataformas. La lógica nunca vive en `app/`.

---

## ADR-002 · React Context API como state management

- **Fecha**: 2025-10
- **Contexto**: Se evaluaron Zustand, Redux Toolkit y Context API para estado compartido.
- **Decisión**: Usar React Context API para estado global (MultiCompany, Toast, Theme, Language). Estado local con `useState`/`useRef`.
- **Razón**: La app no tiene flujos de estado complejos que justifiquen una librería externa. Context cubre multiempresa, tema e i18n.
- **Consecuencias**: Menos dependencias. Si la complejidad crece, migrar a Zustand es incremental.

---

## ADR-003 · Arquitectura por dominios con features aisladas

- **Fecha**: 2025-10
- **Contexto**: Evitar un monolito donde todo está mezclado.
- **Decisión**: Organizar en `src/features/[domain]/[feature]/` con estructura completa (adapters, components, screens, services, types, hooks). Componentes compartidos en `src/domains/[domain]/` o `src/domains/shared/`.
- **Razón**: Cada feature es autocontenida. Agregar un módulo nuevo no toca código existente.
- **Consecuencias**: Descubribilidad alta ("¿dónde está usuarios?" → `src/features/security/users/`). Requiere disciplina para no meter cosas en el lugar equivocado.

---

## ADR-004 · Patrón de componentes: .tsx + .styles.ts + .types.ts

- **Fecha**: 2025-10
- **Contexto**: Estilos inline y tipos mezclados en componentes dificultaban el mantenimiento.
- **Decisión**: Cada componente en su carpeta con tres archivos: lógica (`.tsx`), estilos (`.styles.ts`), tipos (`.types.ts`). Estilos usan factory `createXxxStyles(theme)`.
- **Razón**: Separación clara, trazabilidad en logs (nombre real del archivo, no `index.tsx`), estilos reactivos al tema.
- **Consecuencias**: Más archivos, pero cada uno tiene un propósito claro. Los estilos se actualizan automáticamente al cambiar el tema.

---

## ADR-005 · Sistema de temas dual (Light/Dark) con paletas centralizadas

- **Fecha**: 2025-10
- **Contexto**: Se necesitaba soporte dark/light mode con cambio dinámico.
- **Decisión**: Paletas `LightPalette`/`DarkPalette` en `constants/theme.ts` como única fuente de verdad. Consumo vía `useTheme()` que expone `colors`, `spacing`, `typography`, `borderRadius`, `shadows`, `modalLayout`, `pageLayout`.
- **Razón**: Un cambio en la paleta se refleja en toda la app. No se permiten colores hardcodeados.
- **Consecuencias**: Consistencia visual garantizada. Nuevas interfaces deben usar exclusivamente tokens del tema.

---

## ADR-006 · Migración de `isActive` booleano a `status` numérico

- **Fecha**: 2025-11-05
- **Contexto**: El backend eliminó `isActive` y lo reemplazó por `status` (numérico) + `statusDescription` (texto traducido).
- **Decisión**: Actualizar todos los tipos de dominio. Formularios usan selectores de estado. Filtros envían `status` numérico. Visualización con `StatusBadge` que muestra `statusDescription` del backend.
- **Consecuencias**: Soporte de 5 estados (deleted, inactive, active, pending, suspended) en lugar de solo activo/inactivo.

---

## ADR-007 · Toasts sobre modales con Modal transparente

- **Fecha**: 2025-11-06
- **Contexto**: Los toasts se renderizaban detrás de modales (z-index insuficiente).
- **Decisión**: `ToastContainer` se renderiza dentro de un `Modal` transparente con `pointerEvents="box-none"`. Dentro de modales se usa `InlineAlert` (prop `topAlert`) en lugar de toasts.
- **Consecuencias**: Mensajes siempre visibles. Dentro de modales no se usan toasts.

---

## ADR-008 · Formularios con `useRef` para evitar stale closures

- **Fecha**: 2025-11-08
- **Contexto**: Formularios enviaban datos desactualizados por closures obsoletas en callbacks.
- **Decisión**: Usar `useRef` para campos críticos (teléfono, sucursales, rol, estado). Sincronizar en `useEffect`, leer de `ref.current` en `handleSubmit`.
- **Consecuencias**: Payloads siempre actualizados. Evita bucles de renderizado.

---

## ADR-009 · Menú dinámico desde backend con modo mix

- **Fecha**: 2025-11
- **Contexto**: El menú debe reflejar los permisos del usuario y soportar configuración por empresa.
- **Decisión**: El backend envía la estructura de menú completa (recursiva con `submenu` y `columns`). El front soporta tres modos: `horizontal`, `vertical` y `mix` (horizontal para público + vertical para privado). Configurable vía `EXPO_PUBLIC_MENU_TYPE`.
- **Consecuencias**: El menú se adapta automáticamente a los permisos. En modo `mix`, el sidebar se oculta si no hay opciones privadas.

---

## ADR-010 · Control de acceso por ruta con AccessService

- **Fecha**: 2025-11
- **Contexto**: Algunas rutas deben verificar permisos antes de renderizar contenido.
- **Decisión**: `AccessService.checkRouteAccess(route)` consulta al backend. El hook `useRouteAccessGuard` maneja loading, allowed y errores de API (401/403). Los screens verifican acceso antes de renderizar.
- **Consecuencias**: Seguridad en frontend alineada con backend. Si el acceso es denegado, no se renderiza la pantalla.

---

## ADR-011 · ApiClient singleton con refresh automático de tokens

- **Fecha**: 2025-10
- **Contexto**: Se necesitaba manejo transparente de autenticación JWT con refresh automático.
- **Decisión**: `ApiClient` singleton maneja tokens, headers automáticos (`Authorization`, `Accept-Language`, `company-code`, `user-id`), refresh automático cuando el access token expira, cola de requests pendientes durante el refresh, y redirección en caso de 401 definitivo.
- **Consecuencias**: Los servicios no se preocupan por autenticación. El refresh es transparente.

---

## ADR-012 · Multiempresa con contexto compartido

- **Fecha**: 2025-11
- **Contexto**: Usuarios pueden pertenecer a múltiples empresas y necesitan cambiar entre ellas.
- **Decisión**: `MultiCompanyProvider` gestiona la empresa y sucursal activa. Los servicios envían `companyId` opcionalmente; si no se envía, el backend usa la del usuario autenticado.
- **Consecuencias**: Cambio de empresa sin relogin. Los listados se filtran automáticamente.

---

## Próximas entradas

Documentar decisiones sobre: catálogos, sistema de chat IA, notificaciones push, exportación Excel.
