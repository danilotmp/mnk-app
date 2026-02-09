# Design System & Theming

Este documento consolida la información que antes estaba distribuida en `DESIGN_SYSTEM.md`, `THEME_HAPI_STYLE.md` y otras notas.  
Su objetivo es servir como referencia única para mantener y personalizar la apariencia de la aplicación.

---

## 1. Fundamentos de estilo

| Concepto | Ubicación | Notas |
| --- | --- | --- |
| Tokens base | `src/styles/themes/base.theme.ts` | Define paleta primaria, tipografía, tamaños y radios por defecto. |
| Tema claro / oscuro | `src/styles/themes/light.theme.ts`, `src/styles/themes/dark.theme.ts` | Extienden los tokens base para cada modo. |
| Paleta global | `src/styles/index.ts` expone los temas activos y helpers. |
| Hooks de tema | `hooks/use-theme-mode.tsx` controla el modo y persistencia. |
| Componentes tematizados | `components/themed-text.tsx`, `components/themed-view.tsx` abstraen colores y tipografías. |

---

## 2. Cambiar la paleta de colores

1. **Actualizar tokens base**  
   Modifica los valores en `base.theme.ts`:
   ```ts
   export const baseTheme = {
     colors: {
       primary: '#3D6AF2',
       primaryDark: '#2C4BC2',
       // ...
     },
     radius: {
       sm: 6,
       md: 10,
       lg: 16,
     },
     // ...
   };
   ```
2. **Ajustar variantes claro/oscuro**  
   En `light.theme.ts` y `dark.theme.ts` puedes sobrescribir tonalidades específicas (`background`, `surface`, `text`).  
   Si el cliente requiere una versión totalmente personalizada, crea una nueva variante y actualiza `hooks/use-theme-mode.tsx` para reconocerla.
3. **Actualizar referencias**  
   Los estilos de componentes y páginas (`src/styles/**`) usan `colors.<token>`. Al modificar los tokens, toda la UI se actualiza automáticamente.

---

## 3. Tipografía y escalas

* Las tipografías se definen en `base.theme.ts` dentro de `typography`.  
* `ThemedText` acepta variantes (`title`, `body`, `caption`). Ajusta allí tamaños o pesos globales.
* Componentes específicos con estilos a medida se ubican en `src/styles/components/*.ts`. Mantén el uso de `theme.colors` y `theme.typography` para garantizar coherencia.

---

## 4. Componentes UI reutilizables

| Componente | Ruta | Descripción |
| --- | --- | --- |
| Botones | `components/ui/button.tsx` | Usa variantes (primario, secundario, fantasma). Fuertemente tipado para RN/Expo. |
| Badges de estado | `components/ui/status-badge.tsx` | Mapea `status` → color e icono. |
| Modales laterales | `components/ui/side-modal.tsx` | Contenedor estándar para formularios (animación + footer consistente). |
| Inputs con foco | `components/ui/input-with-focus.tsx` | Contiene estilos y manejo de enfoque consistente. |

Siempre que se construya un nuevo componente, revisar estas implementaciones antes de crear estilos desde cero.

---

## 5. Diseño responsivo

* Hook `useResponsive()` (`hooks/use-responsive.ts`) expone `isMobile`, `isTablet`, `isDesktop` según `constants/breakpoints.ts`.
* Estilos adaptativos en `SearchFilterBar` y `DataTable` demuestran cómo variar paddings, tipografías y disposiciones según `isMobile`.
* Para vistas específicas, preferir escribir estilos en `src/styles/pages/<feature>.ts` y consumirlos desde los componentes correspondientes.

---

## 6. Íconos y assets

* Íconos provienen de `@expo/vector-icons`. Centraliza los nombres y tamaños en los componentes para evitar inconsistencias.
* Assets gráficos residen en `assets/images`. Los cambios globales (favicon, splash, etc.) se configuran en `app.json`.

---

## 7. Guía de personalización para clientes

1. **Colores**: editar tokens mencionados en la sección 2.  
   Para generar un nuevo tema completo, clonar `light.theme.ts` y `dark.theme.ts`, renombrar e integrar en el proveedor de temas.
2. **Fuentes**: actualizar `typography.fontFamily` en `base.theme.ts` y asegurar la carga de la fuente en la inicialización de Expo (si es distinta de la estándar).
3. **Componentes específicos**: centralizar overrides en los estilos de página/componente (`src/styles/...`). Evitar estilos inline para mantener un solo punto de ajuste.
4. **Variables CSS web**: si se requiere adaptar la versión web con CSS variables, usarlas dentro de `app/_layout.tsx` o crear un proveedor de estilos que lea de los tokens del tema para sincronizar colores.

---

Mantén esta guía actualizada cuando se introduzcan cambios de branding o se agreguen componentes base nuevos. Cualquier decisión de diseño relevante se documenta adicionalmente en `ADR.md`.

