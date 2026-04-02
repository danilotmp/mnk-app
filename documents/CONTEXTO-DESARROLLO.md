# Contexto de Desarrollo — AIBox Frontend

## 1. Qué es

AIBox es una aplicación multiplataforma (Web + Móvil) construida como monolito modular. Sirve como plataforma de administración empresarial con módulos de seguridad, notificaciones, catálogos, comercial y chat IA.

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Routing | Expo Router 6 (file-based) |
| Lenguaje | TypeScript 5.9 (strict) |
| State Management | React Context API + useState/useRef local |
| Navegación | @react-navigation/native 7 |
| Estilos | StyleSheet.create + sistema de temas propio |
| i18n | Sistema propio con hook `useTranslation()` |
| HTTP | Fetch nativo envuelto en `apiClient` singleton |
| Almacenamiento | AsyncStorage (abstracción `StorageAdapter`) |
| Iconos | @expo/vector-icons (principalmente Ionicons) |
| WebSocket | socket.io-client (chat) |

## 3. Arquitectura

### 3.1 Principios

- **Domain-Driven Design**: código organizado por contexto de negocio, no por tipo técnico.
- **Separación de concernimientos**: screens orquestan, components presentan, services comunican, adapters transforman.
- **Componentización extrema**: si se usa en más de un lugar o es complejo, se extrae a componente.
- **Wrappers delgados en `app/`**: las rutas solo importan screens, máximo 5-10 líneas.

### 3.2 Estructura de Carpetas

```
app/                              # SOLO rutas (Expo Router file-based routing)
└── [domain]/[feature]/
    └── index.tsx                 # Wrapper delgado → importa screen de src/features/

src/
├── features/                     # Features completas por dominio
│   └── [domain]/[feature]/
│       ├── adapters/             # Transformación API → Dominio
│       ├── components/           # Componentes específicos de la feature
│       ├── screens/              # Pantallas (smart components)
│       ├── services/             # Servicios de negocio
│       ├── types/
│       │   ├── domain/           # Modelos de negocio puros
│       │   └── api/              # Contratos de API (DTOs)
│       └── hooks/                # Hooks específicos
│
├── domains/                      # Componentes y servicios compartidos POR DOMINIO
│   ├── security/                 # Compartidos dentro de seguridad
│   │   ├── components/           # (permission forms, carousel, etc.)
│   │   ├── services/             # (PermissionsService, AccessesService)
│   │   ├── hooks/                # (useCompanyOptions, useBranchOptions)
│   │   └── types/
│   ├── shared/                   # Compartidos CROSS-DOMAIN
│   │   ├── components/           # DataTable, SearchFilterBar, StatusSelector, etc.
│   │   ├── contexts/             # MultiCompanyContext
│   │   ├── hooks/                # useMultiCompany
│   │   ├── services/             # ThemeService, UserSessionService
│   │   ├── types/                # BaseEntity, PaginationParams, RecordStatus
│   │   └── utils/
│   └── [otro-dominio]/
│
├── infrastructure/               # Capa de bajo nivel
│   ├── api/                      # ApiClient singleton, config, types, storage adapter
│   ├── i18n/                     # Traducciones, LanguageProvider, useTranslation
│   ├── menu/                     # MenuService, useMenu
│   ├── messages/                 # AlertService, useAlert, Toast, InlineAlert
│   ├── session/                  # SessionManager, useSession, useCachedState
│   ├── access/                   # AccessService, useRouteAccessGuard
│   ├── services/                 # AuthService, UserMapperService
│   ├── templates/                # TemplateService
│   └── utils/                    # Formatters
│
├── config/                       # AppConfig centralizado (API URL, auth, cache, nav)
├── hooks/                        # Hooks globales (useTheme, useScrollbarStyles)
├── styles/                       # Sistema de estilos
│   ├── themes/                   # base.theme, light.theme, dark.theme
│   ├── components/               # Estilos de componentes compartidos
│   └── pages/                    # Estilos de pantallas específicas
└── utils/                        # Utilidades generales

components/                       # Componentes UI genéricos (fuera de src/)
├── ui/                           # Button, Card, SideModal, CenteredModal, StatusBadge, etc.
├── navigation/                   # HorizontalMenu, VerticalMenu
├── layouts/                      # MainLayout
└── *.tsx                         # ThemedText, ThemedView, Header, Logo, etc.

constants/                        # Tema central en uso (LightTheme, DarkTheme, Typography, etc.)
hooks/                            # Hooks de nivel raíz (useTheme, useResponsive, useColorScheme)
```

### 3.3 Flujo de Datos

```
Screen (src/features/.../screens/)
  → Service (src/features/.../services/)
    → Adapter (src/features/.../adapters/)
      → ApiClient (src/infrastructure/api/)
        → Backend API
```

### 3.4 ¿Cuándo usar `domains/` vs `features/`?

| Ubicación | Cuándo |
|-----------|--------|
| `src/features/[domain]/[feature]/` | Feature completa con su propia estructura (screens, services, types) |
| `src/domains/[domain]/` | Componentes/servicios compartidos DENTRO de un dominio |
| `src/domains/shared/` | Componentes/servicios compartidos CROSS-DOMAIN |
| `components/ui/` | Componentes UI base reutilizables en toda la app |

## 4. Dominios Implementados

| Dominio | Features | Estado |
|---------|----------|--------|
| Security | users, roles, permissions, companies, branches, menu | Maduro |
| Notifications | templates, sends, params | En desarrollo |
| Catalog | CRUD genérico encabezado/detalle | En desarrollo |
| Commercial | setup, capabilities, activate | En desarrollo |
| Interacciones | chat, dashboard | En desarrollo |
| Auth | login, register, verify | Maduro |

## 5. Convenciones de Nombrado

### Archivos

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Componente | `kebab-case.tsx` | `user-create-form.tsx` |
| Estilos | `kebab-case.styles.ts` | `user-create-form.styles.ts` |
| Tipos | `kebab-case.types.ts` | `user-create-form.types.ts` |
| Servicio | `kebab-case.service.ts` | `users.service.ts` |
| Hook | `use-kebab-case.hook.ts` | `use-users.hook.ts` |
| Screen | `kebab-case.screen.tsx` | `users-list.screen.tsx` |
| Adapter | `kebab-case.adapter.ts` | `user.adapter.ts` |

### Código

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Componentes | PascalCase | `UserCreateForm` |
| Servicios | PascalCase + Service | `UsersService` |
| Hooks | camelCase con `use` | `useUsers` |
| Funciones | camelCase | `loadUsers` |
| Tipos/Interfaces | PascalCase | `UserFilters` |
| Enums | PascalCase | `RecordStatus` |

### Imports

- Path alias: `@/` apunta a la raíz del proyecto (configurado en `tsconfig.json`).
- Orden: React → Librerías externas → Componentes internos → Hooks → Servicios → Tipos → Estilos.

## 6. Sistema de Estados

Sincronizado con el backend (`RecordStatus` enum):

| Valor | Estado | Color | Uso |
|-------|--------|-------|-----|
| `-1` | Eliminado | `colors.deleted` (gris) | Registros soft-deleted, filtro "Otros" |
| `0` | Inactivo | `colors.error` (rojo) | Acceso deshabilitado |
| `1` | Activo | `colors.success` (verde) | Operación normal |
| `2` | Pendiente | `colors.warning` (ámbar) | En espera de aprobación |
| `3` | Suspendido | `colors.suspended` (naranja) | Acceso temporalmente deshabilitado |

- El backend envía `status` (numérico) y `statusDescription` (texto traducido).
- Siempre mostrar `statusDescription` del backend. Fallback: `RecordStatus` enum local.
- Componente visual: `StatusBadge`.

## 7. Manejo de Errores

| Contexto | Mecanismo |
|----------|-----------|
| Fuera de modales | `alert.showError(message)` → Toast visual |
| Dentro de modales | `InlineAlert` vía prop `topAlert` del modal |
| Errores de API | `apiClient` maneja 401 (refresh token), redirige si falla |
| Confirmaciones | `alert.showConfirm` / `alert.showConfirmDirect` |

El backend puede enviar `result.type` (`success` | `error` | `warning` | `info`) y el front lo enruta al toast correspondiente.

## 8. Providers (orden en `_layout.tsx`)

```
LanguageProvider
  └── CustomThemeProvider
        └── MultiCompanyProvider
              └── ToastProvider
                    └── LayoutContent + ToastContainer
```

## 9. Comandos

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia Expo dev server |
| `npm run web` | Inicia en modo web |
| `npm run start:clean` | Inicia limpiando caché |
| `npm run clean` | Limpia caché de Expo y Metro |
| `npm run clean:all` | Limpia todo + reinstala node_modules |
| `npm run lint` | Ejecuta ESLint |

## 10. Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | URL base del backend | `http://localhost:15000/api` |
| `EXPO_PUBLIC_COMPANY_CODE` | Código de empresa para headers | `AIBOX` |
| `EXPO_PUBLIC_MENU_TYPE` | Tipo de menú: `horizontal`, `vertical`, `mix` | `mix` |
| `EXPO_PUBLIC_MENU_ACTIVE_COLOR` | Color de items activos del menú | `blue` |
