# Patrón de Organización de Componentes

## Estructura

Cada componente debe estar organizado en una carpeta con el siguiente patrón:

```
component-name/
  ├── component-name.tsx          # Lógica y JSX del componente
  ├── component-name.styles.ts    # Estilos (StyleSheet.create)
  └── component-name.types.ts     # Tipos e interfaces
```

## Estilos

- Definir estilos en **clases** (StyleSheet o `.styles.ts`), no inline en el JSX.
- **Un estilo por elemento/rol**: agrupar en un solo estilo todo lo que aplica a ese elemento (ej. `actionButtonLeadingIcon` con marginRight y demás propiedades del icono), no crear un estilo por cada atributo (evitar `iconMarginRight`, `iconPadding`, etc.).
- **Genérico:** lo reutilizable (tokens, `colors.primary`) en tema o lugar general; en JSX se usa el token.
- **Particular:** si el estilo solo se usa en este componente, se define en su StyleSheet; si ya existe uno reutilizable, se reutiliza.
- **Excepción:** valores que dependen del tema o de props pueden ir en un objeto mínimo: `style={[styles.xyz, { backgroundColor: colors.surface }]}`.

## Ejemplo

```
search-filter-bar/
  ├── search-filter-bar.tsx
  ├── search-filter-bar.styles.ts
  └── search-filter-bar.types.ts
```

## Razón

Esta estructura permite:
1. **Trazabilidad**: Los errores en logs muestran el nombre real del componente (ej: `search-filter-bar.tsx`) en lugar de un genérico `index.tsx`
2. **Organización**: Separación clara entre lógica, estilos y tipos
3. **Mantenibilidad**: Fácil de localizar y modificar cada parte del componente
4. **Escalabilidad**: Fácil agregar más archivos (tests, hooks, etc.) sin confusión

## Exportación

En el archivo `index.ts` del directorio de componentes:

```typescript
export { ComponentName } from './component-name/component-name';
export type { ComponentNameProps } from './component-name/component-name.types';
```

## Importación

En otros archivos:

```typescript
import { ComponentName } from '@/src/domains/shared/components/component-name/component-name';
import type { ComponentNameProps } from '@/src/domains/shared/components/component-name/component-name.types';
```

O desde el index:

```typescript
import { ComponentName, type ComponentNameProps } from '@/src/domains/shared/components';
```

## Componentes Refactorizados

- ✅ `SearchFilterBar`
- ✅ `DataTable`
- ✅ `AccessGuard`
- ✅ `BranchSelector`
- ✅ `UserProfileHeader`

## Próximos Pasos

Aplicar este patrón a:
- Componentes del dominio `security`
- Componentes del dominio `catalog`
- Componentes de UI en `components/ui`

