# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [Unreleased] - 2025-10-23

### Agregado
- **🎨 Tema Dark Estilo Hapi Trade**
  - Nueva paleta de colores inspirada en Hapi Trade (dark finance UI)
  - Colores principales:
    - Background: `#0a0e27` (azul oscuro profundo)
    - Surface: `#151b2e` (azul oscuro medio para cards)
    - Primary: `#4dd4ff` (cyan brillante para botones e interactivos)
    - Success: `#00d98d` (verde turquesa brillante para valores positivos)
    - Error: `#ff3366` (rojo/rosa brillante para valores negativos)
    - Warning: `#ffd93d` (amarillo brillante)
    - Texto: `#ffffff` / `#a0a8c1` / `#6b7588` (jerarquía clara)
  - Actualización completa de `BrandColors` en `constants/theme.ts`
  - Documentación detallada en `THEME_HAPI_STYLE.md`
  - Alto contraste y cumplimiento WCAG 2.1 AA/AAA

- **Navegación Horizontal Completa**
  - Home y Explore integrados EN el menú horizontal
  - Navegación real con Expo Router implementada
  - Menú centrado en el header con distribución equilibrada
  - Tab Bar inferior completamente oculto
  - Estructura: [Logo] ─────── [Menú CENTRADO] ─────── [Usuario]

### Modificado
- **constants/theme.ts**: Paleta completa actualizada con colores Hapi
- **app/(tabs)/_layout.tsx**: Home y Explore agregados al menuItems
- **components/layouts/main-layout.tsx**: 
  - Navegación real con `useRouter()` de Expo Router
  - Estilos ajustados para centrar menú perfectamente
  - Secciones balanceadas (logo, menú, usuario) con `minWidth: 150px`
- **Todos los componentes**: Ahora usan la nueva paleta de colores

### Mejorado
- **Experiencia Visual**: UI moderna estilo fintech/trading
- **Legibilidad**: Contraste mejorado con fondo azul oscuro profundo
- **Interactividad**: Colores cyan brillantes para elementos clickeables
- **Estados**: Verde/Rojo universalmente reconocibles para valores positivos/negativos
- **Navegación**: Flujo más natural, todo en un solo menú horizontal

## [1.1.0] - 2025-10-22

### Agregado
- **Sistema de Diseño Responsive Completo**
  - `constants/breakpoints.ts` - Breakpoints centralizados (mobile: 640px, tablet: 1024px)
  - `hooks/use-responsive.ts` - Hook personalizado para responsive design
  - Helper functions: `isMobileDevice()`, `isTabletDevice()`, `isDesktopDevice()`
  - Documentación completa en `RESPONSIVE_DESIGN.md`

- **MainLayout Component**: Layout principal persistente
  - Envuelve todas las páginas de la aplicación
  - Header, Logo y UserProfile persistentes
  - Componentes no desaparecen al cambiar de página
  - Arquitectura modular y escalable
  - Documentación en `ARCHITECTURE_LAYOUT.md`

- **UserProfileHeader Component**: Componente responsive de perfil
  - **Mobile**: Solo avatar (compacto, sin texto)
  - **Tablet**: Avatar + nombre (sin apellido completo)
  - **Desktop**: Avatar + nombre completo + sucursal
  - Modal desplegable con:
    - Información detallada del usuario
    - Selector de sucursales (si tiene más de una)
    - Opciones de menú: Mi Perfil, Configuración, Cerrar Sesión
  - Totalmente responsive usando `useResponsive()` hook

### Modificado
- **app/(tabs)/_layout.tsx**: Envuelve Tabs con MainLayout
- **app/(tabs)/index.tsx**: Removido Header (ahora en MainLayout)
- **app/(tabs)/explore.tsx**: Removido Header (ahora en MainLayout)
- **UserProfileHeader**: Ahora es completamente responsive
- **Componentes Index**: Exporta MainLayout y helpers responsive

### Mejorado
- **Modularidad**: Separación clara entre layout persistente y contenido de páginas
- **Persistencia**: Header y UserProfile siempre visibles, no se recargan
- **Responsive**: Todos los componentes se adaptan a mobile, tablet y desktop
- **Experiencia móvil**: UI optimizada para smartphones sin amontonamiento
- **Mantenibilidad**: Un solo lugar para modificar elementos globales
- **Escalabilidad**: Fácil agregar nuevas páginas y elementos persistentes

## [1.0.0] - 2025-10-22

### Agregado
- **Arquitectura Multiempresa Completa**
  - Tipos de datos: Company, Branch, User, Permission
  - Servicio mock: MultiCompanyService
  - Context de React: MultiCompanyProvider
  - Hooks personalizados: useMultiCompany, useCompany, useBranches, usePermissions
  - Componentes UI: BranchSelector, AccessGuard
  
- **Documentación**
  - MULTI_COMPANY_ARCHITECTURE.md: Documentación técnica completa
  - GETTING_STARTED_MULTICOMPANY.md: Guía de inicio rápido
  
- **Usuarios Mock**
  - Danilo: Administrador con acceso completo
  - Juan: Usuario con acceso solo a Loja
  - Sebastian: Usuario con acceso a Quito y Loja

- **Control de Acceso**
  - Sistema de permisos granular
  - AccessGuard component para control declarativo
  - Verificación de permisos en hooks

### Modificado
- **Theme**: Agregadas variantes de colores (primaryLight, primaryDark, etc.)
- **App Layout**: Integrado MultiCompanyProvider
- **Home Screen**: Implementado ejemplo de uso de multiempresa

---

## Convenciones de Versionado

Este proyecto sigue [Semantic Versioning](https://semver.org/):
- **MAJOR**: Cambios incompatibles en la API
- **MINOR**: Funcionalidad nueva compatible con versiones anteriores
- **PATCH**: Correcciones de bugs compatibles con versiones anteriores

