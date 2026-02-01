# Arquitectura del Sistema MNK-App

Este documento describe la arquitectura completa del sistema MNK-App, diseñada para evitar crear un monolito mediante separación por dominios y features.

---

## 1. Principios Arquitectónicos

### 1.1 Separación por Dominios (Anti-Monolito)

La arquitectura está diseñada para **evitar crear un monolito** mediante:

- **Separación por dominio de negocio**: Cada dominio (seguridad, facturación, etc.) está completamente desacoplado
- **Separación por feature dentro de cada dominio**: Cada feature tiene su propia estructura completa
- **Componentes compartidos centralizados**: Elementos reutilizables en `domains/shared/` o `components/ui/`

### 1.2 Estructura de Directorios

```
app/                          # ⚠️ SOLO rutas (Expo Router file-based routing)
└── [domain]/[feature]/
    └── index.tsx             # Wrapper delgado (5-10 líneas máximo)

src/
├── domains/                  # Componentes y servicios compartidos POR DOMINIO
│   ├── security/            # Dominio de seguridad
│   │   ├── components/      # Componentes compartidos del dominio seguridad
│   │   ├── services/        # Servicios compartidos del dominio seguridad
│   │   ├── hooks/           # Hooks específicos del dominio seguridad
│   │   └── types/           # Tipos compartidos del dominio seguridad
│   ├── shared/              # Elementos compartidos cross-domain
│   │   ├── components/      # Componentes reutilizables (DataTable, SearchFilterBar)
│   │   ├── contexts/        # Contextos compartidos (MultiCompany)
│   │   ├── hooks/           # Hooks compartidos (useMultiCompany)
│   │   └── services/        # Servicios compartidos (ThemeService)
│   └── [otro-dominio]/      # Otros dominios (facturación, etc.)
│
├── features/                 # Features completas con estructura propia
│   └── [domain]/[feature]/
│       ├── adapters/        # Transformación API → Dominio
│       ├── components/       # Componentes específicos de la feature
│       ├── screens/          # Pantallas (smart components)
│       ├── services/         # Servicios de negocio (SSOT)
│       ├── types/            # Tipos de dominio y API
│       │   ├── domain/       # Modelos de negocio puros
│       │   └── api/          # Contratos de API (DTOs)
│       └── hooks/            # Hooks específicos de la feature
│
├── infrastructure/           # Servicios de bajo nivel
│   ├── api/                 # Cliente API centralizado
│   ├── i18n/                # Sistema de traducciones
│   ├── menu/                # Configuración dinámica del menú
│   ├── messages/            # Sistema de alertas y toasts
│   └── session/             # Gestión de sesión
│
├── styles/                   # Sistema de estilos centralizado
│   ├── themes/              # Tokens de diseño (colores, tipografía)
│   ├── components/          # Estilos de componentes compartidos
│   └── pages/               # Estilos de páginas específicas
│
└── hooks/                    # Hooks globales (useTheme, useResponsive)
```

---

## 2. Reglas de Organización

### 2.1 ¿Cuándo usar `domains/` vs `features/`?

**`src/domains/[domain]/`** - Usar para:

- Componentes compartidos **dentro de un dominio** (ej: `permissions-carousel` compartido en seguridad)
- Servicios compartidos **dentro de un dominio** (ej: `PermissionsService` usado por múltiples features)
- Hooks específicos del dominio (ej: `use-company-options` usado por múltiples features de seguridad)
- Tipos compartidos del dominio

**`src/features/[domain]/[feature]/`** - Usar para:

- Features completas con estructura propia
- Componentes específicos de una feature (ej: `UserCreateForm` solo para usuarios)
- Servicios específicos de una feature (ej: `UsersService` solo para gestión de usuarios)
- Screens (pantallas) de una feature

**`src/domains/shared/`** - Usar para:

- Componentes reutilizables **cross-domain** (ej: `DataTable`, `SearchFilterBar`)
- Contextos compartidos (ej: `MultiCompanyContext`)
- Hooks compartidos (ej: `useMultiCompany`)
- Servicios compartidos (ej: `ThemeService`)

### 2.2 Estructura de Componentes

Cada componente debe seguir el patrón:

```
component-name/
├── component-name.tsx          # Lógica y JSX
├── component-name.styles.ts    # Estilos (StyleSheet.create)
└── component-name.types.ts     # Tipos e interfaces
```

**Regla de oro**: **NUNCA mezclar estilos inline con lógica**. Todos los estilos deben estar en el archivo `.styles.ts`. Toda nueva interfaz debe reutilizar variables del tema central (`constants/theme.ts`): colores, tipografía, espaciado, bordes y sombras (véase § 3.2).

**Excepción**: Estilos dinámicos que dependen de props/estado pueden calcularse en el componente usando estilos base del archivo `.styles.ts`:

```typescript
// ✅ CORRECTO: Estilos base en .styles.ts, variantes dinámicas en el componente
const containerStyle = [
  styles.containerBase,
  { backgroundColor: isActive ? colors.primary : colors.surface },
];
```

### 2.3 Estructura de Screens

Los screens deben:

- Estar en `src/features/[domain]/[feature]/screens/`
- Usar estilos del archivo `.styles.ts` correspondiente
- Usar traducciones del sistema i18n (nunca strings hardcodeados)
- Ser importados desde `app/` que solo actúa como wrapper de ruta

---

## 3. Sistema de Estilos

### 3.1 Organización

```
constants/
└── theme.ts                   # ★ Tema central en uso (colores, spacing, typography, borderRadius, shadows)
                               #   LightTheme / DarkTheme para cambio claro/oscuro. Consumido vía useTheme().

src/styles/
├── themes/                    # Tokens alternativos (base, light, dark)
│   ├── base.theme.ts
│   ├── light.theme.ts
│   └── dark.theme.ts
├── components/                # Estilos de componentes compartidos
└── pages/                     # Estilos de páginas específicas
```

### 3.2 Tema central (obligatorio para nuevas interfaces)

**Todas las interfaces nuevas deben reutilizar variables del tema central.** No se permiten valores hardcodeados de colores, tamaños de texto, espaciado ni bordes.

- **Ubicación del tema en uso**: `constants/theme.ts`
  - Contiene: `LightTheme`, `DarkTheme` (colores, spacing, borderRadius, shadows), `Typography` (h1–h6, body1, body2, caption, button).
  - Consumo: hook `useTheme()` desde `@/hooks/use-theme`, que expone `colors`, `spacing`, `typography`, `borderRadius`, `shadows`, `isDark`/`isLight`.

- **Uso obligatorio**:
  - **Colores**: siempre `colors.*` del tema (p. ej. `colors.text`, `colors.primary`, `colors.border`). Respeta el cambio de tema claro/oscuro.
  - **Tipografía**: títulos y cuerpo desde `typography.*` (p. ej. `typography.h1`, `typography.body2`) o tokens semánticos definidos en el mismo archivo (p. ej. `pageTitle`, `sectionTitle`).
  - **Espaciado**: solo `spacing.xs` … `spacing.xxl` del tema; no usar números mágicos (24, 48, etc.) en pantallas o componentes.
  - **Bordes y sombras**: `borderRadius.*`, `shadows.*` del tema.

- **Estilos de componente**: en `component-name.styles.ts` usar una factory que reciba el tema (o al menos `colors` y `spacing`) y construya los estilos únicamente con propiedades del tema. Ejemplo: `createComponentStyles(theme)` usando `theme.colors`, `theme.spacing`, `theme.typography`.

Así, un único cambio en `constants/theme.ts` (p. ej. tamaño de títulos de página o espaciado) se refleja en toda la aplicación.

### 3.3 Patrón de Estilos

**Estilos generales** (bordes, colores, tamaños):

- Centralizados en el tema en uso: `constants/theme.ts`
- Accesibles vía `useTheme()`: `colors.primary`, `colors.surface`, `spacing.lg`, `typography.h1`, etc.

**Estilos de componente**:

- En archivo `component-name.styles.ts` junto al componente
- Función factory que recibe el **tema** (`useTheme()`): `createComponentStyles(theme)` usando solo `theme.colors`, `theme.spacing`, `theme.typography`, etc.

**Ejemplo**:

```typescript
// component-name.styles.ts
export const createComponentStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    containerBase: {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    containerActive: {
      borderColor: theme.colors.primary,
    },
  });

// component-name.tsx
const { theme, colors } = useTheme();
const styles = createComponentStyles(theme);
const dynamicStyle = [
  styles.containerBase,
  isActive && styles.containerActive,
  { backgroundColor: isActive ? colors.primary : colors.surface },
];
```

---

## 4. Sistema de Traducciones (i18n)

### 4.1 Ubicación

- Traducciones: `src/infrastructure/i18n/translations/[lang].ts`
- Tipos: `src/infrastructure/i18n/types.ts`
- Hook: `useTranslation()` desde `src/infrastructure/i18n`

### 4.2 Uso

```typescript
const { t } = useTranslation();

// Con optional chaining para evitar errores TypeScript
const menuAdminTranslations = t.security?.menuAdmin || {};

// Uso con fallback
<Text>{menuAdminTranslations.title || 'Título por defecto'}</Text>
```

### 4.3 Regla

**NUNCA usar strings hardcodeados**. Todos los textos visibles al usuario deben venir de traducciones.

---

## 5. Servicios y API

### 5.1 Cliente API Centralizado

- Ubicación: `src/infrastructure/api/api.client.ts`
- Instancia singleton: `apiClient`
- Funcionalidades:
  - Gestión automática de tokens (refresh automático)
  - Headers automáticos (Authorization, Accept-Language, company-code, user-id)
  - Manejo centralizado de errores
  - Redirecciones automáticas en caso de 401

### 5.2 Servicios de Dominio

- Patrón Singleton para servicios compartidos
- Ubicación según alcance:
  - `src/domains/[domain]/services/` - Servicios compartidos del dominio
  - `src/features/[domain]/[feature]/services/` - Servicios específicos de la feature

**Ejemplo**:

```typescript
export class ThemeService {
  private static instance: ThemeService;

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }
}
```

---

## 6. Flujo de Datos

### 6.1 Flujo Típico

```
Screen (src/features/.../screens/)
  ↓
Service (src/features/.../services/)
  ↓
Adapter (src/features/.../adapters/) - Transforma API → Dominio
  ↓
API Client (src/infrastructure/api/)
  ↓
Backend API
```

### 6.2 Tipos

- **Tipos de API** (`types/api/`): Estructura exacta de la respuesta del backend
- **Tipos de Dominio** (`types/domain/`): Modelos de negocio puros, independientes del backend
- **Adapters**: Transforman tipos de API a tipos de dominio

---

## 7. Estado y Contextos

### 7.1 Estado Local

- Usar `useState` para estado local del componente
- Usar `useRef` para valores que no deben causar re-renders

### 7.2 Estado Compartido

- **Contextos**: `src/domains/shared/contexts/` (ej: `MultiCompanyContext`)
- **Hooks**: `src/domains/shared/hooks/` (ej: `useMultiCompany`)

### 7.3 Patrón de Contexto

```typescript
// Contexto
export const MultiCompanyContext = createContext<MultiCompanyContextType | undefined>(undefined);

// Provider
export function MultiCompanyProvider({ children }: Props) {
  // Lógica del contexto
  return <MultiCompanyContext.Provider value={value}>{children}</MultiCompanyContext.Provider>;
}

// Hook de uso
export function useMultiCompany() {
  const context = useContext(MultiCompanyContext);
  if (!context) throw new Error('useMultiCompany must be used within MultiCompanyProvider');
  return context;
}
```

---

## 8. Navegación

### 8.1 Expo Router

- `app/` contiene solo rutas (file-based routing)
- Cada ruta es un wrapper delgado que importa el screen correspondiente

**Ejemplo**:

```typescript
// app/security/users/index.tsx
import { UsersListScreen } from '@/src/features/security/users/screens/users-list.screen';

export default function UsersListPage() {
  return <UsersListScreen />;
}
```

### 8.2 Layouts

- Layout global: `app/_layout.tsx`
- Wraps la app con providers: `ThemeProvider`, `LanguageProvider`, `MultiCompanyProvider`, `ToastProvider`

---

## 9. Manejo de Errores

### 9.1 Alertas y Toasts

- Hook: `useAlert()` desde `src/infrastructure/messages/alert.service.ts`
- Métodos:
  - `alert.showError(message)` - Muestra error
  - `alert.showSuccess(message)` - Muestra éxito
  - `alert.showConfirm(title, message, onConfirm, onCancel)` - Confirmación

### 9.2 Errores de API

- El `apiClient` maneja automáticamente:
  - Refresh de tokens expirados
  - Redirecciones en caso de 401
  - Parsing de errores del backend

---

## 10. Guía para Nuevos Desarrollos

### 10.1 Crear una Nueva Feature

1. **Crear estructura en `src/features/[domain]/[feature]/`**:

   ```
   feature-name/
   ├── adapters/
   ├── components/
   ├── screens/
   ├── services/
   ├── types/
   │   ├── domain/
   │   └── api/
   └── hooks/
   ```

2. **Crear tipos**:
   - `types/domain/feature.types.ts` - Modelos de negocio
   - `types/api/feature-api.types.ts` - Contratos de API

3. **Crear servicio**:
   - `services/feature.service.ts` - Usa `apiClient` para llamadas API

4. **Crear adapter** (si es necesario):
   - `adapters/feature.adapter.ts` - Transforma API → Dominio

5. **Crear componentes**:
   - Seguir patrón: `component-name.tsx`, `component-name.styles.ts`, `component-name.types.ts`
   - Usar estilos del archivo `.styles.ts`
   - Usar traducciones (nunca strings hardcodeados)

6. **Crear screen**:
   - `screens/feature-list.screen.tsx`
   - Usar estilos de `src/styles/pages/` o crear archivo propio

7. **Crear ruta**:
   - `app/[domain]/[feature]/index.tsx` - Wrapper delgado que importa el screen

### 10.2 Crear un Componente Compartido

**Si es compartido dentro de un dominio**:

- `src/domains/[domain]/components/component-name/`

**Si es compartido cross-domain**:

- `src/domains/shared/components/component-name/`

**Si es componente UI base**:

- `components/ui/component-name/`

### 10.3 Agregar Traducciones

1. Agregar en `src/infrastructure/i18n/types.ts` (si es nueva sección)
2. Agregar en `src/infrastructure/i18n/translations/es.ts`
3. Agregar en `src/infrastructure/i18n/translations/en.ts`
4. Usar con optional chaining: `t.security?.menuAdmin?.title`

---

## 11. Convenciones de Código

### 11.1 Nombres de Archivos

- Componentes: `kebab-case` (ej: `user-create-form.tsx`)
- Servicios: `kebab-case.service.ts` (ej: `users.service.ts`)
- Tipos: `kebab-case.types.ts` (ej: `user.types.ts`)
- Estilos: `kebab-case.styles.ts` (ej: `user-create-form.styles.ts`)

### 11.2 Nombres de Funciones/Clases

- Componentes: `PascalCase` (ej: `UserCreateForm`)
- Servicios: `PascalCase` + `Service` (ej: `UsersService`)
- Hooks: `camelCase` con prefijo `use` (ej: `useUsers`)
- Funciones: `camelCase` (ej: `loadUsers`)

### 11.3 Imports

- Usar paths absolutos con `@/` (configurado en `tsconfig.json`)
- Agrupar imports: React → Librerías externas → Componentes internos → Hooks → Servicios → Tipos → Estilos

---

## 12. Checklist para Nuevos Desarrollos

Antes de considerar un desarrollo completo, verificar:

- [ ] ¿Los estilos están en archivo `.styles.ts` separado?
- [ ] ¿No hay strings hardcodeados? (todos usan traducciones)
- [ ] ¿Los tipos están separados en archivos `.types.ts`?
- [ ] ¿El componente sigue el patrón `component-name.tsx`, `.styles.ts`, `.types.ts`?
- [ ] ¿Los servicios usan `apiClient` centralizado?
- [ ] ¿Los errores se manejan con `useAlert()`?
- [ ] ¿La feature está en `src/features/[domain]/[feature]/`?
- [ ] ¿Los componentes compartidos están en `domains/shared/` o `domains/[domain]/` según corresponda?
- [ ] ¿La ruta en `app/` es un wrapper delgado?

---

## 13. Referencias

- **Decisiones arquitectónicas**: `docs/ADR.md`
- **Vista funcional del sistema**: `docs/SystemOverview.md`
- **Sistema de diseño**: `docs/DesignSystem.md`
- **Patrón de componentes**: `docs/COMPONENT_ORGANIZATION_PATTERN.md`
- **Estructura del proyecto**: `docs/ESTRUCTURA_PROYECTO.md`
- **Análisis home y estilos**: `docs/ANALISIS_HOME_Y_ESTILOS.md`

---

**Última actualización**: 2025-01-XX  
**Versión del documento**: 2.0
