# Planificación de Refactorización de Componentes Monolíticos

## Objetivo
Separar lógica, diseño y estilos en componentes que actualmente violan el patrón de arquitectura definido en `COMPONENT_ORGANIZATION_PATTERN.md`.

## Patrón Correcto (Referencia: `src/domains/shared/components`)
```
component-name/
  ├── component-name.tsx          # Solo lógica y JSX
  ├── component-name.styles.ts    # Solo estilos (StyleSheet.create)
  └── component-name.types.ts    # Solo tipos e interfaces
```

## Análisis de Componentes

### 🔴 CRÍTICO - Componentes con Estilos Inline Mezclados

#### 1. `components/layouts/main-layout.tsx`
**Problema:**
- ✅ Usa `createMainLayoutStyles()` (correcto)
- ❌ Tiene estilos inline extensos mezclados con lógica (líneas 89-200, 717-730, etc.)
- ❌ Tiene interfaces inline (`CompanyLogoAndMenuContainerProps`)
- ❌ Componente interno `CompanyLogoAndMenuContainer` con estilos inline
- **Tamaño:** ~843 líneas
- **Complejidad:** ALTA - Componente principal del layout

**Refactorización:**
```
components/layouts/main-layout/
  ├── main-layout.tsx
  ├── main-layout.styles.ts (mover estilos inline aquí)
  ├── main-layout.types.ts (mover interfaces aquí)
  └── company-logo-and-menu-container/
      ├── company-logo-and-menu-container.tsx
      ├── company-logo-and-menu-container.styles.ts
      └── company-logo-and-menu-container.types.ts
```

**Riesgo:** ALTO - Componente crítico del sistema
**Prioridad:** ALTA

---

#### 2. `components/header.tsx`
**Problema:**
- ❌ Tiene `StyleSheet.create` inline en el mismo archivo (líneas 86-126)
- ❌ Interfaces inline (`HeaderProps`)
- **Tamaño:** ~127 líneas
- **Complejidad:** MEDIA

**Refactorización:**
```
components/header/
  ├── header.tsx
  ├── header.styles.ts
  └── header.types.ts
```

**Riesgo:** MEDIO
**Prioridad:** MEDIA

---

#### 3. `components/navigation/horizontal-menu.tsx`
**Problema:**
- ✅ Usa `createHorizontalMenuStyles()` (correcto)
- ❌ Interfaces inline (`MenuItem`, `MenuColumn`, `HorizontalMenuProps`)
- ❌ Tiene estilos inline en algunos lugares
- **Tamaño:** ~1783 líneas
- **Complejidad:** MUY ALTA

**Refactorización:**
```
components/navigation/horizontal-menu/
  ├── horizontal-menu.tsx
  ├── horizontal-menu.styles.ts (mover estilos inline aquí)
  └── horizontal-menu.types.ts (mover interfaces aquí)
```

**Riesgo:** ALTO - Componente de navegación crítico
**Prioridad:** ALTA

---

#### 4. `components/navigation/vertical-menu.tsx`
**Problema:**
- ✅ Usa `createVerticalMenuStyles()` (correcto)
- ❌ Interfaces inline (`VerticalMenuProps`)
- ❌ Tiene estilos inline en algunos lugares
- **Tamaño:** ~765 líneas
- **Complejidad:** ALTA

**Refactorización:**
```
components/navigation/vertical-menu/
  ├── vertical-menu.tsx
  ├── vertical-menu.styles.ts (mover estilos inline aquí)
  └── vertical-menu.types.ts (mover interfaces aquí)
```

**Riesgo:** ALTO - Componente de navegación crítico
**Prioridad:** ALTA

---

#### 5. `components/auth/login-modal.tsx`
**Problema:**
- ✅ Usa `createLoginModalStyles()` (correcto)
- ❌ Interfaces inline (`LoginModalProps`, `AuthMode`, `InputWithFocusProps`)
- ❌ Componente interno `InputWithFocus` con estilos inline
- **Tamaño:** ~325 líneas
- **Complejidad:** MEDIA

**Refactorización:**
```
components/auth/login-modal/
  ├── login-modal.tsx
  ├── login-modal.styles.ts
  ├── login-modal.types.ts
  └── input-with-focus/
      ├── input-with-focus.tsx
      ├── input-with-focus.styles.ts
      └── input-with-focus.types.ts
```

**Riesgo:** MEDIO
**Prioridad:** MEDIA

---

### 🟡 MEDIO - Componentes con Estilos Inline Menores

#### 6. `components/ui/button.tsx`
**Problema:**
- Probablemente tiene estilos inline
- **Prioridad:** BAJA (ya está en `components/ui`)

#### 7. `components/ui/card.tsx`
**Problema:**
- Probablemente tiene estilos inline
- **Prioridad:** BAJA

#### 8. `components/ui/select.tsx`
**Problema:**
- Probablemente tiene estilos inline
- **Prioridad:** BAJA

#### 9. `components/ui/tooltip.tsx`
**Problema:**
- Probablemente tiene estilos inline
- **Prioridad:** BAJA

#### 10. `components/ui/input-with-focus.tsx`
**Problema:**
- Probablemente tiene estilos inline
- **Prioridad:** BAJA

#### 11. `components/ui/side-modal.tsx`
**Problema:**
- Probablemente tiene estilos inline
- **Prioridad:** BAJA

#### 12. `components/ui/centered-modal.tsx`
**Problema:**
- Probablemente tiene estilos inline
- **Prioridad:** BAJA

#### 13. `components/ui/status-badge.tsx`
**Problema:**
- Probablemente tiene estilos inline
- **Prioridad:** BAJA

#### 14. `components/ui/inline-alert.tsx`
**Problema:**
- Probablemente tiene estilos inline
- **Prioridad:** BAJA

#### 15. `components/ui/collapsible.tsx`
**Problema:**
- Probablemente tiene estilos inline
- **Prioridad:** BAJA

#### 16. `components/ui/theme-toggle.tsx`
**Problema:**
- Probablemente tiene estilos inline
- **Prioridad:** BAJA

#### 17. `components/ui/touchable-opacity-safe.tsx`
**Problema:**
- Probablemente tiene estilos inline
- **Prioridad:** BAJA

---

### 🟢 BAJO - Componentes Simples

#### 18. `components/logo.tsx`
**Problema:**
- Probablemente simple, verificar
- **Prioridad:** MUY BAJA

#### 19. `components/themed-text.tsx`
**Problema:**
- Probablemente simple, verificar
- **Prioridad:** MUY BAJA

#### 20. `components/themed-view.tsx`
**Problema:**
- Probablemente simple, verificar
- **Prioridad:** MUY BAJA

#### 21. `components/parallax-scroll-view.tsx`
**Problema:**
- Probablemente simple, verificar
- **Prioridad:** MUY BAJA

#### 22. `components/hello-wave.tsx`
**Problema:**
- Probablemente simple, verificar
- **Prioridad:** MUY BAJA

---

## Plan de Ejecución

### Fase 1: Componentes Críticos (ALTA PRIORIDAD)
1. ✅ **main-layout.tsx** - Componente principal del layout
   - Separar `CompanyLogoAndMenuContainer` en su propio componente
   - Mover todos los estilos inline a archivos `.styles.ts`
   - Mover interfaces a archivos `.types.ts`
   - **Estimación:** 4-6 horas
   - **Riesgo:** ALTO - Requiere testing exhaustivo

2. ✅ **horizontal-menu.tsx** - Menú de navegación principal
   - Mover interfaces a `horizontal-menu.types.ts`
   - Mover estilos inline a `horizontal-menu.styles.ts`
   - **Estimación:** 3-4 horas
   - **Riesgo:** ALTO - Componente complejo con muchas interacciones

3. ✅ **vertical-menu.tsx** - Menú de navegación vertical
   - Mover interfaces a `vertical-menu.types.ts`
   - Mover estilos inline a `vertical-menu.styles.ts`
   - **Estimación:** 2-3 horas
   - **Riesgo:** ALTO - Componente de navegación crítico

### Fase 2: Componentes Importantes (MEDIA PRIORIDAD)
4. ✅ **header.tsx** - Header reutilizable
   - Mover `StyleSheet.create` a `header.styles.ts`
   - Mover interfaces a `header.types.ts`
   - **Estimación:** 1-2 horas
   - **Riesgo:** MEDIO

5. ✅ **login-modal.tsx** - Modal de autenticación
   - Separar `InputWithFocus` en su propio componente
   - Mover interfaces a archivos `.types.ts`
   - **Estimación:** 2-3 horas
   - **Riesgo:** MEDIO

### Fase 3: Componentes UI (BAJA PRIORIDAD)
6. ✅ Componentes en `components/ui/`
   - Refactorizar uno por uno según necesidad
   - **Estimación:** 1-2 horas cada uno
   - **Riesgo:** BAJO

---

## Estrategia de Refactorización

### Para cada componente:

1. **Preparación:**
   - Crear estructura de carpetas según patrón
   - Identificar todos los estilos inline
   - Identificar todas las interfaces/tipos

2. **Extracción de Estilos:**
   - Mover `StyleSheet.create` a `.styles.ts`
   - Mover estilos inline a objetos en `.styles.ts`
   - Mantener referencias a `colors`, `spacing`, etc. desde hooks

3. **Extracción de Tipos:**
   - Mover interfaces a `.types.ts`
   - Exportar tipos correctamente
   - Actualizar imports

4. **Refactorización de Lógica:**
   - Limpiar componente principal
   - Separar componentes internos si es necesario
   - Mantener funcionalidad exacta

5. **Testing:**
   - Verificar que no se rompió funcionalidad
   - Probar todos los casos de uso
   - Verificar estilos visuales

6. **Actualización de Exports:**
   - Actualizar `index.ts` si existe
   - Actualizar imports en otros archivos

---

## Consideraciones Importantes

### ⚠️ NO ROMPER FUNCIONALIDAD
- Mantener exactamente la misma funcionalidad
- No cambiar nombres de props
- No cambiar estructura de datos
- No cambiar comportamiento

### ⚠️ MANTENER COMPATIBILIDAD
- Actualizar imports gradualmente
- Mantener exports antiguos temporalmente si es necesario
- Documentar cambios en CHANGELOG

### ⚠️ TESTING EXHAUSTIVO
- Probar cada componente después de refactorizar
- Verificar estilos visuales
- Probar en diferentes dispositivos/tamaños
- Probar en modo claro/oscuro

---

## Métricas de Éxito

- ✅ Todos los componentes críticos refactorizados
- ✅ Cero estilos inline en componentes principales
- ✅ Cero interfaces inline en componentes principales
- ✅ Funcionalidad 100% preservada
- ✅ Estilos visuales idénticos
- ✅ Código más mantenible y escalable

---

## Notas

- Esta refactorización es **incremental** y **no destructiva**
- Se puede hacer componente por componente
- Cada componente se puede probar independientemente
- No es necesario hacer todo de una vez
