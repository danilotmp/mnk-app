# System Overview

This document explains the current functional scope and the main implementation patterns to keep the MNK administration app consistent.

---

## 1. Core Functional Areas

| Area | Description | Key Screens |
| --- | --- | --- |
| Autenticación | Manejo de sesión y login (integrado vía servicios en `src/infrastructure/services`). | `app/auth/login.tsx` |
| Seguridad | Administración de usuarios, roles, permisos, empresas y sucursales. | `app/security/...` |
| Catálogos | Módulo base para administrar encabezados/detalles reutilizables. | `app/security` (próximas implementaciones) |
| Servicios Financieros (demo) | Páginas de ejemplo (`payments`, `transfers`). | `app/services/...` |

---

## 2. Seguridad (Prioritario)

### 2.1 Usuarios
* **Listado**: `app/security/users/index.tsx`  
  - Filtros avanzados (`SearchFilterBar`), badge de estado, columna de acciones.  
  - Filtro “Otros” (usuarios eliminados) independiente del selector principal.
* **Creación / Edición**: `UserCreateForm` / `UserEditForm`  
  - Formularios en `src/domains/security/components`.  
  - Uso de `useRef` para mantener valores actuales (`statusRef`, `branchIdsRef`, etc.) y evitar “stale closures”.  
  - Confirmación antes de eliminar, toasts con detalles `details.message`.
* **Servicios**: `UsersService` se encuentra en `src/domains/security/services/users.service.ts`.  
  - Payloads usan `status` numérico en lugar de `isActive`.
  - Control de recargas innecesarias tras edición mediante `justEditedRef`.

### 2.2 Roles & Permisos
* Patrones espejo a Usuarios: tablas con `StatusBadge`, formularios con selector de estado uniforme, llamadas API que envían/reciben `status`.
* `RoleCreateForm`/`RoleEditForm` y `PermissionCreateForm`/`PermissionEditForm` replican la arquitectura de usuarios.

### 2.3 Empresas & Sucursales
* Formularios en proceso de migración al sistema de estados (`status`) siguiendo los mismos patrones.
* Hooks `use-company-options` y `use-branch-options` retornan datos filtrados por `status: 1`.

---

## 3. Patrones de Implementación

### 3.1 Componentes Compartidos
* `SearchFilterBar` (`src/domains/shared/components`) gestiona filtros horizontales/verticales y contiene la lógica del botón “Limpiar”.
* `StatusBadge` (`components/ui/status-badge.tsx`) evidencia la condición del registro.
* `SideModal` (`components/ui/side-modal.tsx`) estandariza modales deslizables para formularios.

### 3.2 Servicios y Tipos
* Cada dominio declara sus tipos en `src/domains/<domain>/types`.
* Los servicios construyen peticiones a través de `apiClient` y retornan un objeto `{ data, result }`.
* Validaciones en frontend aseguran que los payloads se adhieran a los tipos (por ejemplo, `branchIds` siempre UUIDs válidos).

### 3.3 Internacionalización
* Textos se obtienen con `useTranslation()`.
* Traducciones se ubican en `src/infrastructure/i18n/translations/<lang>.ts`.
* Al agregar nuevas etiquetas, hacerlo en ambos idiomas.

---

## 4. Guideline para Nuevos Módulos

1. **Generar tipos** en `src/domains/<module>/types`.
2. **Crear servicios** bajo `src/domains/<module>/services` reutilizando `apiClient`.
3. **Diseñar componentes** reutilizando `SearchFilterBar`, `DataTable` y `SideModal` para mantener UX consistente.
4. **Configurar rutas** en `app/<module>/` y conectar el layout correspondiente.
5. **Actualizar documentación**: reflejar decisiones relevantes en `ADR.md` y, de ser necesario, ampliar secciones de este documento.

---

## 5. Flujo de Estados (`status`)

| Valor | Descripción | Uso principal |
| --- | --- | --- |
| `1` | Activo | Registros disponibles en operaciones normales. |
| `2` | Pendiente | En espera de aprobación / onboarding. |
| `3` | Suspendido | Acceso temporalmente deshabilitado. |
| `4` | Eliminado | Registros no visibles en listados estándar salvo filtro “Otros”. |

* El backend expone `statusDescription` (respetar traducción entregada).  
* Formularios muestran selector textual reutilizando `StatusBadge` para visualización.

---

## 6. Errores & Manejo de Toasts

* Usar `alert.showError({ title, message, detail })`.  
  - `detail` debe venir de `error.details?.message` cuando esté disponible.
* Toasts se muestran sobre modales gracias a `ToastContainer` (z-index + `Modal` transparente).
* Confirmaciones de eliminación deben invocar `alert.showConfirm`.

---

## 7. Próximos Pasos Recomendados

* Finalizar migración de empresas/sucursales al patrón de estado.  
* Revisar que cada nueva funcionalidad extienda los patrones de `Users` (formularios, toasts, filtros).  
* Añadir pruebas de regresión manual (scripts de QA) o unit tests cuando se introduzcan nuevas reglas críticas.

---

Este documento se actualiza conforme evolucione la funcionalidad. Cambios estructurales relevantes también deben quedar reflejados en `ADR.md` y en la documentación de arquitectura.

