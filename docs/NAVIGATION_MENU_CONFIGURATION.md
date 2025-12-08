# Configuración de Menú de Navegación

Esta aplicación soporta dos tipos de menú de navegación que pueden configurarse según las necesidades del proyecto.

## Tipos de Menú Disponibles

### 1. Menú Horizontal (Por Defecto)
- **Ubicación**: En el header de la aplicación
- **Comportamiento**: 
  - Se muestra siempre antes del login
  - Se mantiene en el header después del login si está configurado
  - Responsive: En móviles se convierte en un menú hamburger con drawer
  - Soporta mega menú con columnas para submenús complejos

### 2. Menú Vertical (Estilo Azure DevOps)
- **Ubicación**: En el lado izquierdo de la página
- **Comportamiento**:
  - Solo se muestra después del login
  - Puede expandirse/colapsarse
  - Cuando está colapsado: muestra solo iconos (48px de ancho)
  - Cuando está expandido: muestra iconos + texto (240px de ancho)
  - Incluye animación suave al expandir/colapsar
  - Soporta submenús anidados

## Configuración

La configuración del tipo de menú se realiza en `src/config/index.ts`:

```typescript
export const AppConfig = {
  // ... otras configuraciones
  navigation: {
    // Tipo de menú: 'horizontal' | 'vertical'
    menuType: (process.env.EXPO_PUBLIC_MENU_TYPE as 'horizontal' | 'vertical') || 'horizontal',
    // Ancho del menú vertical cuando está expandido (en píxeles)
    verticalMenuExpandedWidth: 240,
    // Ancho del menú vertical cuando está colapsado (solo iconos)
    verticalMenuCollapsedWidth: 48,
  },
};
```

### Configuración mediante Variable de Entorno

Puedes configurar el tipo de menú usando la variable de entorno `EXPO_PUBLIC_MENU_TYPE`:

**Para menú horizontal:**
```bash
EXPO_PUBLIC_MENU_TYPE=horizontal
```

**Para menú vertical:**
```bash
EXPO_PUBLIC_MENU_TYPE=vertical
```

O en tu archivo `.env`:
```
EXPO_PUBLIC_MENU_TYPE=vertical
```

### Configuración mediante Código

También puedes modificar directamente en `src/config/index.ts`:

```typescript
navigation: {
  menuType: 'vertical', // o 'horizontal'
  verticalMenuExpandedWidth: 240,
  verticalMenuCollapsedWidth: 48,
},
```

## Comportamiento

### Antes del Login
- **Siempre** se muestra el menú horizontal en el header
- Esto asegura una experiencia consistente para usuarios no autenticados

### Después del Login
- Se aplica la configuración definida en `AppConfig.navigation.menuType`
- Si está configurado como `'horizontal'`: se mantiene el menú horizontal en el header
- Si está configurado como `'vertical'`: se muestra el menú vertical en el lado izquierdo

## Componentes

### HorizontalMenu
- **Ubicación**: `components/navigation/horizontal-menu.tsx`
- **Estilos**: `src/styles/components/horizontal-menu.styles.ts`
- **Características**:
  - Menú horizontal responsive
  - Mega menú con columnas
  - Drawer en móviles

### VerticalMenu
- **Ubicación**: `components/navigation/vertical-menu.tsx`
- **Estilos**: `src/styles/components/vertical-menu.styles.ts`
- **Características**:
  - Menú vertical expandible/colapsable
  - Soporte para iconos
  - Submenús anidados
  - Indicador visual de item activo
  - Animación suave al expandir/colapsar

## Uso en MainLayout

El componente `MainLayout` (`components/layouts/main-layout.tsx`) maneja automáticamente la lógica de qué menú mostrar:

```typescript
// Determinar el tipo de menú según configuración y estado de autenticación
const isAuthenticated = !!user;
const menuType = isAuthenticated 
  ? AppConfig.navigation.menuType 
  : 'horizontal';
const useVerticalMenu = menuType === 'vertical' && isAuthenticated;
```

## Iconos

El menú vertical soporta iconos mediante la propiedad `icon` en los items del menú:

```typescript
{
  id: 'dashboard',
  label: 'Dashboard',
  route: '/dashboard',
  icon: 'grid', // Nombre del icono de Ionicons
}
```

Iconos comunes disponibles:
- `home`: Inicio
- `grid`: Dashboard
- `settings`: Configuración
- `person`: Usuario
- `people`: Usuarios
- `lock-closed`: Seguridad
- `key`: Roles
- `business`: Empresas
- `storefront`: Sucursales
- `cube`: Productos
- `construct`: Servicios
- `information-circle`: Acerca de

Si no se especifica un icono, se usa `ellipse-outline` por defecto.

## Personalización

### Ancho del Menú Vertical

Puedes personalizar los anchos del menú vertical en `AppConfig`:

```typescript
navigation: {
  verticalMenuExpandedWidth: 280, // Cambiar ancho expandido
  verticalMenuCollapsedWidth: 56,   // Cambiar ancho colapsado
},
```

### Estilos

Los estilos pueden personalizarse en:
- `src/styles/components/vertical-menu.styles.ts` - Estilos del menú vertical
- `src/styles/components/horizontal-menu.styles.ts` - Estilos del menú horizontal
- `src/styles/components/main-layout.styles.ts` - Estilos del layout principal

## Ejemplos de Uso

### Ejemplo 1: Menú Horizontal (Por Defecto)
```typescript
// En src/config/index.ts
navigation: {
  menuType: 'horizontal',
}
```

### Ejemplo 2: Menú Vertical
```typescript
// En src/config/index.ts
navigation: {
  menuType: 'vertical',
  verticalMenuExpandedWidth: 240,
  verticalMenuCollapsedWidth: 48,
}
```

### Ejemplo 3: Variable de Entorno
```bash
# En .env
EXPO_PUBLIC_MENU_TYPE=vertical
```

## Notas Importantes

1. **El menú horizontal siempre se muestra antes del login** para mantener una experiencia consistente.

2. **El menú vertical solo aparece después del login** y solo si está configurado en `AppConfig`.

3. **La configuración se lee una vez al cargar la aplicación**. Si necesitas cambiar el tipo de menú dinámicamente, deberás recargar la aplicación.

4. **Los items del menú vienen del backend** a través del hook `useMenu()`, por lo que la estructura del menú se controla desde el servidor.

5. **El estado de colapsado del menú vertical** se mantiene durante la sesión pero se resetea al recargar la página.

## Troubleshooting

### El menú vertical no aparece
- Verifica que el usuario esté autenticado (`user` no sea `null`)
- Verifica que `AppConfig.navigation.menuType` esté configurado como `'vertical'`
- Verifica que `showNavigation` sea `true` en `MainLayout`

### El menú no se expande/colapsa
- Verifica que el botón de toggle esté visible
- Revisa la consola por errores de JavaScript
- Verifica que las animaciones estén habilitadas en `AppConfig.styles.enableAnimations`

### Los iconos no aparecen
- Verifica que los nombres de iconos sean válidos de Ionicons
- Si un icono no existe, se usará `ellipse-outline` por defecto
- Revisa la documentación de Ionicons para nombres válidos

