# Arquitectura de Layouts - Estructura Modular

Este documento describe la arquitectura de layouts implementada para garantizar modularidad y persistencia de componentes globales.

## 🏗️ Problema Resuelto

**Antes:** Los componentes como Header y UserProfileHeader estaban incluidos directamente en cada página, causando:
- ❌ Duplicación de código
- ❌ Inconsistencia visual entre páginas
- ❌ Componentes que desaparecían al cambiar de página
- ❌ Difícil mantenimiento

**Ahora:** Arquitectura modular con Layout Principal:
- ✅ Componentes globales persistentes
- ✅ Código centralizado y reutilizable
- ✅ Consistencia visual en toda la aplicación
- ✅ Fácil mantenimiento y escalabilidad

## 📊 Estructura de la Aplicación

```
┌─────────────────────────────────────────────────────────────┐
│                    MultiCompanyProvider                      │ <- Contexto Global
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  ThemeProvider                         │  │ <- Tema Global
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              Stack Navigator                     │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │          MainLayout (NUEVO)              │  │  │  │
│  │  │  │  ┌────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  Header (Persistente)              │  │  │  │  │
│  │  │  │  │  - Logo                            │  │  │  │  │
│  │  │  │  │  - Título                          │  │  │  │  │
│  │  │  │  │  - UserProfileHeader →  [DA] ▼   │  │  │  │  │
│  │  │  │  └────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  Tabs Navigator                    │  │  │  │  │
│  │  │  │  │  ┌──────────────────────────────┐ │  │  │  │  │
│  │  │  │  │  │  Página 1 (index.tsx)        │ │  │  │  │  │
│  │  │  │  │  │  - Contenido dinámico        │ │  │  │  │  │
│  │  │  │  │  └──────────────────────────────┘ │  │  │  │  │
│  │  │  │  │  ┌──────────────────────────────┐ │  │  │  │  │
│  │  │  │  │  │  Página 2 (explore.tsx)      │ │  │  │  │  │
│  │  │  │  │  │  - Contenido dinámico        │ │  │  │  │  │
│  │  │  │  │  └──────────────────────────────┘ │  │  │  │  │
│  │  │  │  │  ┌──────────────────────────────┐ │  │  │  │  │
│  │  │  │  │  │  Tab Bar                     │ │  │  │  │  │
│  │  │  │  │  └──────────────────────────────┘ │  │  │  │  │
│  │  │  │  └────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estructura de Archivos

```
mnk-app/
├── app/
│   ├── _layout.tsx                    # Root Layout - Providers globales
│   └── (tabs)/
│       ├── _layout.tsx                # Tab Layout - Envuelve con MainLayout
│       ├── index.tsx                  # Página Home (solo contenido)
│       └── explore.tsx                # Página Explore (solo contenido)
│
├── components/
│   ├── layouts/
│   │   ├── main-layout.tsx           # ✨ NUEVO: Layout principal persistente
│   │   └── index.ts                  # Exportaciones
│   ├── header.tsx                    # Header reutilizable
│   └── ...
│
└── src/
    └── domains/
        └── shared/
            └── components/
                └── user-profile-header.tsx  # Componente de perfil
```

## 🧩 Componentes Principales

### 1. MainLayout (`components/layouts/main-layout.tsx`)

**Propósito:** Contenedor principal que envuelve todas las páginas y mantiene elementos persistentes.

**Props:**
```typescript
interface MainLayoutProps {
  children: ReactNode;      // Contenido de las páginas
  title?: string;           // Título del header
  showHeader?: boolean;     // Mostrar/ocultar header
  showUserProfile?: boolean; // Mostrar/ocultar perfil usuario
}
```

**Características:**
- ✅ Header persistente con logo y título
- ✅ UserProfileHeader siempre visible
- ✅ Callbacks configurables (logout, settings, profile)
- ✅ Configurable por página si es necesario

**Uso:**
```tsx
<MainLayout title="Mi App">
  {children}
</MainLayout>
```

### 2. Tab Layout (`app/(tabs)/_layout.tsx`)

**Antes:**
```tsx
export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
    </Tabs>
  );
}
```

**Ahora:**
```tsx
export default function TabLayout() {
  return (
    <MainLayout title="MNK App">
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="explore" />
      </Tabs>
    </MainLayout>
  );
}
```

### 3. Páginas Individuales

**Antes:**
```tsx
export default function HomePage() {
  return (
    <View>
      <Header title="Home">
        <UserProfileHeader />
      </Header>
      <Content />
    </View>
  );
}
```

**Ahora:**
```tsx
export default function HomePage() {
  return (
    <View>
      <Content />  {/* Solo el contenido específico */}
    </View>
  );
}
```

## 🎯 Beneficios de esta Arquitectura

### 1. **Modularidad**
- Cada componente tiene una responsabilidad única
- Fácil de mantener y modificar
- Componentes reutilizables

### 2. **Persistencia**
- Header, Logo y UserProfile siempre visibles
- No se recargan al cambiar de página
- Mejor experiencia de usuario

### 3. **Consistencia**
- Todas las páginas tienen el mismo header
- Diseño uniforme en toda la aplicación
- Comportamiento predecible

### 4. **Escalabilidad**
- Fácil agregar nuevas páginas
- Fácil agregar nuevos elementos persistentes (menú lateral, footer, etc.)
- Fácil personalizar por sección si es necesario

### 5. **Mantenimiento**
- Cambios en el header se aplican a todas las páginas
- Un solo lugar para modificar elementos globales
- Menos código duplicado

## 🔄 Flujo de Navegación

```
Usuario en Página A (index.tsx)
│
├─ Header (Persistente) ────────────────┐
│  ├─ Logo                              │
│  ├─ Título: "MNK App"                 │
│  └─ UserProfile: [DA] Danilo ▼       │ <- Siempre visible
│                                        │
├─ Contenido de Página A                │
│  └─ Cards, Botones, etc.              │
│                                        │
└─ Tab Bar                              │
                                         │
Usuario hace click en "Explore"         │
↓                                        │
                                         │
Usuario en Página B (explore.tsx)       │
│                                        │
├─ Header (Persistente) ────────────────┘ <- Mismo header
│  ├─ Logo                                  NO se recarga
│  ├─ Título: "MNK App"
│  └─ UserProfile: [DA] Danilo ▼
│
├─ Contenido de Página B  <- Solo cambia esto
│  └─ Diferente contenido
│
└─ Tab Bar
```

## 🛠️ Personalización por Página

Si una página necesita personalización:

```tsx
// Página sin header
export default function SpecialPage() {
  return (
    <MainLayout showHeader={false}>
      <CustomContent />
    </MainLayout>
  );
}

// Página con título diferente
export default function AboutPage() {
  return (
    <MainLayout title="Acerca de">
      <AboutContent />
    </MainLayout>
  );
}

// Página sin perfil de usuario
export default function PublicPage() {
  return (
    <MainLayout showUserProfile={false}>
      <PublicContent />
    </MainLayout>
  );
}
```

## 🚀 Agregar Nuevos Elementos Persistentes

### Ejemplo: Agregar un menú lateral

```tsx
// components/layouts/main-layout.tsx
export function MainLayout({ children }: MainLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ThemedView style={styles.container}>
      {/* Header persistente */}
      <Header title={title}>
        <MenuButton onPress={() => setMenuOpen(true)} />
        <UserProfileHeader />
      </Header>

      <View style={styles.body}>
        {/* Menú lateral persistente */}
        <Drawer open={menuOpen} onClose={() => setMenuOpen(false)}>
          <MenuItems />
        </Drawer>

        {/* Contenido de las páginas */}
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </ThemedView>
  );
}
```

## 📝 Mejores Prácticas

### ✅ DO (Hacer)
1. Usar `MainLayout` para todas las páginas principales
2. Mantener el contenido de las páginas simple y enfocado
3. Agregar elementos persistentes al `MainLayout`
4. Usar props para personalizar el layout por página
5. Mantener callbacks del layout en el propio layout

### ❌ DON'T (No Hacer)
1. No duplicar el Header en cada página
2. No incluir lógica de navegación en las páginas
3. No hardcodear el UserProfile en cada página
4. No crear layouts diferentes para páginas similares
5. No mezclar estilos persistentes con estilos de página

## 🎓 Conceptos Clave

### Layout Composition (Composición de Layouts)
- Los layouts se componen entre sí
- Cada nivel agrega funcionalidad
- El nivel más alto (Root) provee contextos globales
- El nivel intermedio (MainLayout) provee UI persistente
- El nivel más bajo (Páginas) provee contenido específico

### Separation of Concerns (Separación de Responsabilidades)
- **Root Layout**: Providers y configuración global
- **Main Layout**: UI persistente y navegación
- **Páginas**: Contenido específico y funcionalidad

### Single Source of Truth (Única Fuente de Verdad)
- Header → Un solo lugar
- UserProfile → Un solo lugar
- Tema → Un solo contexto
- MultiCompany → Un solo contexto

## 🔍 Debugging

Si el Header no aparece:
1. Verificar que `MainLayout` envuelve el contenido en `_layout.tsx`
2. Verificar que `showHeader` no está en `false`
3. Verificar que hay usuario autenticado (para UserProfile)

Si el UserProfile no aparece:
1. Verificar que `showUserProfile` no está en `false`
2. Verificar que el usuario está logueado
3. Verificar que `MultiCompanyProvider` está en el Root Layout

## 📚 Referencias

- [React Navigation - Layout Patterns](https://reactnavigation.org/docs/screen-options/)
- [Expo Router - Layouts](https://docs.expo.dev/router/layouts/)
- [React - Composition vs Inheritance](https://react.dev/learn/thinking-in-react)

---

**Última actualización:** Octubre 2025
**Versión:** 2.0.0

