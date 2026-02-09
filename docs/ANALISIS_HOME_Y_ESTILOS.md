# Análisis: Página de Inicio y Estandarización de Estilos

## 1. Estado actual de la página de inicio

### Ubicación y estructura

- **Ubicación**: `app/index.tsx` (~537 líneas).
- **Problemas**:
  - La pantalla está en `app/` en lugar de `src/features/[domain]/[feature]/screens/`.
  - Todo en un solo archivo: lógica, JSX, datos (strengths) y `StyleSheet.create` al final.
  - No se cumple el patrón de componentes: no hay `component-name.tsx` + `component-name.styles.ts` + `component-name.types.ts`.
  - No existe feature "home" en `src/features/`.

### Estilos

- **Problemas**:
  - ~180 líneas de estilos al final del mismo archivo.
  - Valores fijos: `fontSize: 27`, `32`, `14`, `22`, `13`, `16`; `padding: 24`, `48`; `gap: 12`, `16`; `marginTop: 24`, `32`, etc.
  - Colores sí se usan vía `useTheme()` (`colors.primary`, `colors.text`, etc.), pero tamaños y espaciados no salen del tema central.
  - No hay archivo `.styles.ts` separado ni factory que reciba el tema.

### Textos

- Todos los textos están hardcodeados en español (sin i18n).

### Resumen de incumplimientos

| Regla (Architecture.md)                        | Estado actual                                |
| ---------------------------------------------- | -------------------------------------------- |
| Screens en `src/features/.../screens/`         | ❌ Pantalla en `app/index.tsx`               |
| Componentes con .tsx + .styles.ts + .types.ts  | ❌ Un solo archivo                           |
| Estilos en .styles.ts, no mezclados con lógica | ❌ StyleSheet en el mismo .tsx               |
| Colores/espaciado/tipografía del tema central  | ❌ Parcial: colores sí, tamaños/espaciado no |
| Traducciones (nunca strings hardcodeados)      | ❌ Textos fijos en español                   |

---

## 2. Dónde está el “CSS principal” (tema central)

El tema que usa la aplicación (incl. cambio claro/oscuro) está en:

- **`constants/theme.ts`**
  - `LightTheme` / `DarkTheme`: `colors`, `spacing`, `borderRadius`, `shadows`.
  - `Typography`: `h1`–`h6`, `body1`, `body2`, `caption`, `button` (fontSize, lineHeight, fontWeight).
  - `BrandColors`, `Fonts`.
- **Consumo**: `hooks/use-theme.ts` expone `colors`, `spacing`, `borderRadius`, `shadows`, `typography` desde ese archivo.

Existe además `src/styles/themes/` (base.theme.ts, light.theme.ts, dark.theme.ts) y `src/styles/global.styles.ts`, pero la UI actual (p. ej. `app/index.tsx`, `app/main/contact.tsx`) usa `@/hooks/use-theme`, que toma todo de **`constants/theme.ts`**. Por tanto, el “CSS principal” efectivo es **`constants/theme.ts`**.

---

## 3. Cómo debería organizarse

### 3.1 Tema central (una sola fuente de verdad)

- **Títulos**: Usar `typography.h1`, `typography.h2`, etc., o tokens semánticos nuevos (p. ej. `pageTitle`, `sectionTitle`) definidos en `constants/theme.ts`. Si se necesita tamaño distinto en móvil, definir allí `pageTitleMobile` (o similar) y usarlo en toda la app.
- **Subtítulos y cuerpo**: `typography.body1`, `typography.body2`, `caption`, etc.
- **Espaciado**: Solo `spacing.xs` … `spacing.xxl` del tema, sin números mágicos (24, 48, 32, etc.) en pantallas.
- **Colores**: Solo `colors.*` del tema (ya se hace en parte).
- **Bordes y sombras**: `borderRadius`, `shadows` del tema.

Así, un cambio en `constants/theme.ts` (p. ej. tamaño de títulos de página) se refleja en toda la aplicación.

### 3.2 Página de inicio

- **Feature**: `src/features/main/home/` (o `src/features/public/home/`).
- **Estructura**:
  - `screens/home.screen.tsx`: orquestador (contenedor que monta secciones).
  - `screens/home.screen.styles.ts`: estilos del screen usando tema (`createHomeScreenStyles(theme)` con `theme.colors`, `theme.spacing`, `theme.typography`).
  - `screens/home.screen.types.ts`: tipos del screen si hace falta.
  - Componentes por sección, cada uno con su patrón:
    - `components/hero-section/`: hero-section.tsx, hero-section.styles.ts, hero-section.types.ts.
    - `components/strengths-section/`: strengths-section.tsx, .styles.ts, .types.ts.
    - `components/feature-list/` (o ítems reutilizables): feature-item.tsx, .styles.ts, .types.ts.
- **Ruta**: `app/index.tsx` se reduce a un wrapper de 5–10 líneas que importa `HomeScreen` desde la feature y lo renderiza.

### 3.3 Estilos de cada componente

- En `component-name.styles.ts`: factory que recibe el tema (o al menos `colors` y `spacing`), por ejemplo `createHeroSectionStyles(theme)`.
- Dentro solo usar propiedades del tema: `theme.colors.*`, `theme.spacing.*`, `theme.typography.*` (o tokens semánticos que estén en el tema).
- Sin números mágicos de fontSize, lineHeight, padding, margin, gap; todo derivado del tema.

### 3.4 Traducciones

- Textos de la home en `src/infrastructure/i18n/translations/` (es/en).
- En el screen y componentes: `useTranslation()` y `t.home.*` (o la clave que se defina), sin strings hardcodeados.

---

## 4. Próximos pasos (orden sugerido)

1. Actualizar **Architecture.md** para exigir uso del tema central y referenciar `constants/theme.ts`.
2. Añadir en **constants/theme.ts** tokens semánticos si hace falta (p. ej. `pageTitle`, `pageTitleMobile`, `sectionTitle`).
3. Crear la feature **home** en `src/features/main/home/` con screen + componentes + .styles.ts + .types.ts.
4. Reducir **app/index.tsx** a wrapper que importe y renderice `HomeScreen`.
5. Añadir claves i18n para la home y usarlas en el screen y componentes.

Con esto la página de inicio queda alineada con la arquitectura y sirve de plantilla para estandarizar el resto de pantallas (Productos, Contactos, etc.).
