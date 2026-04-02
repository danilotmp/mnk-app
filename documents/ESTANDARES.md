# Estándares de Desarrollo — AIBox Frontend

Reglas de implementación concretas y checklists para mantener la consistencia del proyecto.

---

## 1. Estructura de Componentes

Cada componente debe estar en su carpeta con tres archivos:

```
component-name/
├── component-name.tsx          # Lógica y JSX
├── component-name.styles.ts    # Estilos (factory que recibe theme)
└── component-name.types.ts     # Tipos e interfaces
```

### Estilos

- Siempre en `.styles.ts`, nunca inline (excepto valores dinámicos que dependen de props/estado).
- Usar factory: `createComponentStyles(theme)` que recibe `colors`, `spacing`, `typography`, etc. del tema.
- Un estilo por elemento/rol, no un estilo por atributo.
- Valores dinámicos permitidos como array: `style={[styles.base, { backgroundColor: colors.surface }]}`.
- Prohibido usar colores, tamaños o espaciados hardcodeados. Siempre tokens del tema.

```typescript
// ✅ Correcto
export const createComponentStyles = (theme: { colors: any; spacing: any }) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
    },
  });

// ❌ Incorrecto
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
});
```

### Exportación

```typescript
// index.ts del directorio de componentes
export { ComponentName } from './component-name/component-name';
export type { ComponentNameProps } from './component-name/component-name.types';
```

---

## 2. Estructura de Screens

Los screens viven en `src/features/[domain]/[feature]/screens/` y:

- Son smart components que orquestan la pantalla.
- Usan estilos de su `.styles.ts` correspondiente.
- Usan traducciones (`useTranslation()`), nunca strings hardcodeados.
- Se importan desde `app/` que solo actúa como wrapper de ruta.

```typescript
// app/security/users/index.tsx — MÁXIMO 5-10 líneas
import { UsersListScreen } from '@/src/features/security/users/screens/users-list.screen';

export default function UsersListPage() {
  return <UsersListScreen />;
}
```

---

## 3. Cómo Crear una Pantalla Nueva

### Checklist

1. **Crear estructura en `src/features/[domain]/[feature]/`**:
   ```
   feature-name/
   ├── adapters/
   │   └── feature.adapter.ts
   ├── components/
   │   └── feature-form/
   │       ├── feature-form.tsx
   │       ├── feature-form.styles.ts
   │       └── feature-form.types.ts
   ├── screens/
   │   ├── feature-list.screen.tsx
   │   └── feature-list.screen.styles.ts
   ├── services/
   │   └── feature.service.ts
   ├── types/
   │   ├── domain/feature.types.ts
   │   └── api/feature-api.types.ts
   ├── hooks/
   │   └── use-feature.hook.ts
   └── index.ts
   ```

2. **Crear tipos de dominio** (`types/domain/`) y tipos de API (`types/api/`).

3. **Crear servicio** que use `apiClient` centralizado. Clase estática con métodos `getAll`, `getById`, `create`, `update`, `delete`.

4. **Crear adapter** si la respuesta del API difiere del modelo de dominio.

5. **Crear screen** siguiendo el patrón de `users-list.screen.tsx`:
   - Header con icono + título + subtítulo (tokens de `pageLayout`).
   - `SearchFilterBar` para filtros.
   - `DataTable` para listado con paginación.
   - `SideModal` para crear/editar.
   - `useRouteAccessGuard` para control de acceso.

6. **Crear ruta** en `app/[domain]/[feature]/index.tsx` (wrapper delgado).

7. **Agregar traducciones** en `src/infrastructure/i18n/translations/es.ts` y `en.ts`.

---

## 4. Cómo Consumir un Endpoint

### Servicio

```typescript
import { apiClient } from '@/src/infrastructure/api';
import { API_CONFIG } from '@/src/infrastructure/api/config';

export class FeatureService {
  static async getAll(filters: FeatureFilters): Promise<PaginatedResponse<Feature>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get<any>(
      `/domain/features?${params.toString()}`
    );

    return {
      data: response.data?.map(featureAdapter) || [],
      meta: response.meta || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  static async create(payload: FeatureCreatePayload): Promise<Feature> {
    const response = await apiClient.post<any>('/domain/features', payload);
    return featureAdapter(response.data);
  }
}
```

### En el Screen

```typescript
const loadData = useCallback(async (currentFilters: Filters) => {
  try {
    setLoading(true);
    const response = await FeatureService.getAll(currentFilters);
    setData(response.data);
    setPagination(response.meta);
  } catch (error: any) {
    if (handleApiError(error)) return; // 401/403 manejado
    const { message, detail } = extractErrorInfo(error, 'Error al cargar');
    alert.showError(message, false, undefined, detail, error);
  } finally {
    setLoading(false);
  }
}, [alert, handleApiError]);
```

---

## 5. Manejo de Errores

| Contexto | Qué usar |
|----------|----------|
| Pantalla normal | `alert.showError(message)` → muestra Toast |
| Dentro de modal | `InlineAlert` vía prop `topAlert` del `SideModal`/`CenteredModal` |
| Confirmación destructiva | `alert.showConfirm(title, message, onConfirm)` |
| Error de API con tipo | El backend envía `result.type` y el front enruta al toast correcto |

```typescript
// Dentro de modal: exponer error vía onFormReady
onFormReady({
  isLoading,
  handleSubmit,
  handleCancel,
  generalError: { message: 'Error al guardar', detail: error.details?.message },
});
```

---

## 6. Internacionalización (i18n)

- Traducciones en `src/infrastructure/i18n/translations/[lang].ts`.
- Tipos en `src/infrastructure/i18n/types.ts`.
- Consumo con `useTranslation()`.
- Usar optional chaining: `t.security?.users?.title || 'Fallback'`.
- Al agregar textos nuevos, hacerlo en ambos idiomas (es + en).
- Prohibido strings hardcodeados visibles al usuario.

---

## 7. Tematización

- Todos los colores, espaciados, tipografías, bordes y sombras deben venir del tema.
- Consumir vía `useTheme()`: `colors`, `spacing`, `typography`, `borderRadius`, `shadows`, `pageLayout`, `modalLayout`.
- Estilos de componente: factory `createStyles(theme)`.
- Estilos de modal: usar tokens de `ModalLayout` (`headerPadding`, `contentPadding`, `footerPadding`, etc.).
- Estilos de página: usar tokens de `PageLayout` (`titleSubtitleGap`, `headerTitleGap`, `iconTitle`, etc.).

---

## 8. Convenciones de Código

### Imports

```typescript
// 1. React
import React, { useState, useCallback } from 'react';
// 2. Librerías externas
import { Ionicons } from '@expo/vector-icons';
// 3. Componentes internos
import { Button } from '@/components/ui/button';
import { DataTable } from '@/src/domains/shared/components/data-table/data-table';
// 4. Hooks
import { useTheme } from '@/hooks/use-theme';
// 5. Servicios
import { UsersService } from '../services/users.service';
// 6. Tipos
import type { User } from '../types/domain/user.types';
// 7. Estilos
import { createStyles } from './screen.styles';
```

### Servicios

- Clases estáticas (no instancias). Métodos estáticos async.
- Usan `apiClient` centralizado.
- Retornan tipos de dominio (transformados por adapters si es necesario).

### Formularios

- Campos críticos con `useRef` para evitar stale closures.
- Exponer acciones al padre vía `onFormReady({ isLoading, handleSubmit, handleCancel, generalError })`.
- Validación en frontend antes de enviar al backend.
- Campos `code` se formatean: mayúsculas, espacios → `_`, sin caracteres especiales.

---

## 9. Iconos

- Fuente principal: `@expo/vector-icons`, familia **Ionicons**.
- Buscador oficial: [https://icons.expo.fyi/](https://icons.expo.fyi/)
- En código: `import { Ionicons } from "@expo/vector-icons"`.
- El componente `IconInput` usa formato `Familia:Nombre` (ej. `Ionicons:link`).
- Si un icono se renderiza como interrogación, verificar que el nombre exista en la familia usada.
- Centralizar nombres e iconos en los componentes para evitar inconsistencias.

---

## 10. Diseño Responsivo

- Hook `useResponsive()` expone `isMobile`, `isTablet`, `isDesktop` según `constants/breakpoints.ts`.
- Estilos adaptativos: variar paddings, tipografías y disposiciones según `isMobile`.
- Tipografía de página: usar `Typography.pageTitle` / `Typography.pageTitleMobile` según plataforma.
- Para vistas específicas, escribir estilos en `src/styles/pages/<feature>.ts`.

---

## 11. Personalización de Tema para Clientes

1. **Colores**: editar `LightPalette` / `DarkPalette` en `constants/theme.ts`. Para un tema completamente nuevo, clonar `light.theme.ts` y `dark.theme.ts` en `src/styles/themes/`.
2. **Fuentes**: actualizar `typography.fontFamily` en `src/styles/themes/base.theme.ts` y asegurar la carga en la inicialización de Expo.
3. **Componentes**: centralizar overrides en `src/styles/components/` o `src/styles/pages/`. Evitar estilos inline.

---

## 12. Cumplimiento del Patrón de Componentes

Componentes que aún no cumplen el patrón `.tsx` + `.styles.ts` + `.types.ts`:

### Falta `.styles.ts`

| Ubicación | Componente |
|-----------|-----------|
| `domains/security/components/shared/` | menu-item-selector-modal, permission-action-icons, permission-menu-item |
| `features/security/companies/components/` | company-edit-form |
| `features/security/users/components/` | user-edit-form, company-config-carousel |
| `features/commercial/setup/components/` | wizard-stepper, todos los layers |
| `features/interacciones/chat/components/` | image-with-token |
| `features/auth/components/` | register-form, verify-email-form |

### Falta `.types.ts`

| Ubicación | Componente |
|-----------|-----------|
| `domains/security/components/` | permissions-carousel |
| `domains/security/components/shared/` | menu-item-selector-modal, permission-action-icons, permission-menu-item |
| `features/security/users/components/` | company-config-carousel |
| `features/commercial/setup/components/` | todos los layers |
| `features/auth/components/` | register-form, verify-email-form |

Ir añadiendo los archivos faltantes conforme se toquen estos componentes.

---

## 13. Checklist para Nuevos Desarrollos

- [ ] Estilos en `.styles.ts` separado (no inline).
- [ ] Sin strings hardcodeados (todo vía traducciones).
- [ ] Tipos en `.types.ts` separado.
- [ ] Patrón de carpeta: `.tsx` + `.styles.ts` + `.types.ts`.
- [ ] Servicios usan `apiClient` centralizado.
- [ ] Errores manejados con `useAlert()` / `InlineAlert`.
- [ ] Feature en `src/features/[domain]/[feature]/`.
- [ ] Componentes compartidos en `domains/shared/` o `domains/[domain]/`.
- [ ] Ruta en `app/` es wrapper delgado.
- [ ] Traducciones en ambos idiomas.
- [ ] Colores y espaciados del tema, no hardcodeados.
- [ ] Control de acceso con `useRouteAccessGuard`.
