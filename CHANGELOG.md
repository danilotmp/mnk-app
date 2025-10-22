# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [Unreleased] - 2025-10-22

### Agregado
- **UserProfileHeader Component**: Componente de perfil de usuario en la esquina superior derecha
  - Avatar con iniciales del usuario
  - Nombre completo y sucursal actual visible
  - Modal desplegable con:
    - Información detallada del usuario
    - Selector de sucursales (si tiene más de una)
    - Opciones de menú: Mi Perfil, Configuración, Cerrar Sesión
  - Integrado en el Header de la aplicación

### Modificado
- **Header Component**: Ahora incluye UserProfileHeader como children
- **Home Screen**: Removido el card de información de empresa que estaba en el contenido, ya que ahora está en el header
- **Componentes Index**: Exporta UserProfileHeader

### Mejorado
- UI más limpia y profesional
- Información del usuario siempre visible en el header
- Experiencia de usuario mejorada con modal interactivo

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

