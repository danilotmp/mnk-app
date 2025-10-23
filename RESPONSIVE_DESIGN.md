# Sistema de Diseño Responsive

Este documento describe el sistema de diseño responsive implementado en la aplicación MNK.

## 🎯 Objetivo

**Todos los componentes de la aplicación deben ser responsive** y adaptarse automáticamente a diferentes tamaños de pantalla:

- 📱 **Mobile** (Smartphones): < 640px
- 📱 **Tablet**: 640px - 1023px
- 💻 **Desktop**: 1024px+

## 📐 Breakpoints

Los breakpoints están centralizados en `constants/breakpoints.ts`:

```typescript
export const BREAKPOINTS = {
  mobile: 640,    // 0 - 639px
  tablet: 1024,   // 640 - 1023px
  desktop: 1024,  // 1024px+
  lg: 1440,       // 1440px+
  xl: 1920,       // 1920px+
}
```

## 🪝 Hooks Disponibles

### 1. `useResponsive()` - Hook Principal

Hook completo con toda la información responsive:

```tsx
import { useResponsive } from '@/hooks/use-responsive';

function MyComponent() {
  const { 
    isMobile, 
    isTablet, 
    isDesktop,
    width,
    height,
    isPortrait,
    isLandscape,
    deviceType 
  } = useResponsive();

  return (
    <View>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </View>
  );
}
```

### 2. Hooks Simplificados

Para uso rápido cuando solo necesitas un breakpoint:

```tsx
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/use-responsive';

function QuickComponent() {
  const isMobile = useIsMobile();
  
  return (
    <View style={isMobile ? styles.mobile : styles.desktop}>
      {/* ... */}
    </View>
  );
}
```

## 🎨 Patrones de Diseño

### 1. Renderizado Condicional

**Mostrar/ocultar elementos según el tamaño:**

```tsx
function Header() {
  const { isMobile, isDesktop } = useResponsive();
  
  return (
    <View>
      {/* Avatar siempre visible */}
      <Avatar />
      
      {/* Nombre solo en tablet y desktop */}
      {!isMobile && <UserName />}
      
      {/* Sucursal solo en desktop */}
      {isDesktop && <BranchName />}
    </View>
  );
}
```

### 2. Estilos Condicionales

**Aplicar diferentes estilos según el tamaño:**

```tsx
function Card() {
  const { isMobile } = useResponsive();
  
  return (
    <View style={[
      styles.card,
      isMobile && styles.cardMobile
    ]}>
      {/* ... */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 12,
  },
  cardMobile: {
    padding: 12,
    borderRadius: 8,
  },
});
```

### 3. Contenido Adaptativo

**Cambiar el contenido según el tamaño:**

```tsx
function UserInfo() {
  const { isMobile, isDesktop } = useResponsive();
  
  return (
    <View>
      {isMobile && <Text>{user.firstName}</Text>}
      {!isMobile && !isDesktop && <Text>{user.firstName} {user.lastName[0]}.</Text>}
      {isDesktop && <Text>{user.firstName} {user.lastName}</Text>}
    </View>
  );
}
```

### 4. Layout Diferente

**Cambiar completamente el layout:**

```tsx
function Dashboard() {
  const { isMobile, isDesktop } = useResponsive();
  
  if (isMobile) {
    return <MobileDashboard />;
  }
  
  if (isDesktop) {
    return <DesktopDashboard />;
  }
  
  return <TabletDashboard />;
}
```

## 📱 Ejemplo Completo: UserProfileHeader

```tsx
export function UserProfileHeader() {
  const { isMobile, isDesktop } = useResponsive();
  
  return (
    <TouchableOpacity style={[
      styles.container,
      isMobile && styles.containerMobile
    ]}>
      {/* Avatar - Siempre visible */}
      <Avatar />
      
      {/* Info - Solo tablet y desktop */}
      {!isMobile && (
        <View>
          <Text>{user.firstName} {isDesktop ? user.lastName : ''}</Text>
          {isDesktop && <Text>{branch.name}</Text>}
        </View>
      )}
      
      {/* Dropdown icon - Solo tablet y desktop */}
      {!isMobile && <Icon name="chevron-down" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  containerMobile: {
    padding: 4,
    gap: 0,
  },
});
```

## 📊 Tabla de Adaptaciones Recomendadas

| Elemento | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| **Texto** | Compacto | Normal | Completo |
| **Padding** | 8-12px | 12-16px | 16-24px |
| **Font Size** | 14px | 16px | 16-18px |
| **Columnas** | 1 | 2 | 3+ |
| **Menú** | Hamburger | Tabs | Sidebar |
| **Modal** | Full screen | Centered | Centered |
| **Cards** | Stack | Grid 2 col | Grid 3+ col |

## 🎯 Componentes Responsive Existentes

### ✅ UserProfileHeader

**Mobile:**
- Solo muestra avatar
- Sin nombre
- Sin sucursal
- Sin icono dropdown
- Padding reducido

**Tablet:**
- Avatar + nombre
- Sin apellido completo
- Sin sucursal
- Con icono dropdown

**Desktop:**
- Avatar + nombre completo
- Con sucursal
- Con icono dropdown
- Padding completo

## 📝 Checklist para Nuevos Componentes

Al crear cualquier componente nuevo, verifica:

- [ ] ¿Se ve bien en mobile (< 640px)?
- [ ] ¿Se ve bien en tablet (640-1023px)?
- [ ] ¿Se ve bien en desktop (1024px+)?
- [ ] ¿Los textos son legibles en todos los tamaños?
- [ ] ¿Los botones son suficientemente grandes en mobile?
- [ ] ¿El padding/spacing es apropiado para cada tamaño?
- [ ] ¿Las imágenes/iconos escalan correctamente?
- [ ] ¿El modal se ve bien en mobile (fullscreen)?
- [ ] ¿La navegación es accesible en mobile?
- [ ] ¿Se probó en orientación portrait y landscape?

## 🛠️ Herramientas de Testing

### Navegadores Desktop
- Chrome DevTools (F12 → Toggle Device Toolbar)
- Firefox Responsive Design Mode
- Safari Responsive Design Mode

### Dispositivos Reales
- iPhone SE (375px) - Mobile pequeño
- iPhone 12/13 (390px) - Mobile estándar
- iPad (768px) - Tablet
- iPad Pro (1024px) - Tablet grande
- Desktop (1920px) - Desktop

### Expo Go
- Prueba en dispositivo físico
- Prueba en simulador iOS
- Prueba en emulador Android

## 💡 Mejores Prácticas

### ✅ DO (Hacer)

1. **Usar el hook useResponsive()** en lugar de calcular manualmente
   ```tsx
   const { isMobile } = useResponsive(); // ✅ Correcto
   ```

2. **Mobile-first**: Diseñar primero para mobile
   ```tsx
   <View style={[styles.base, !isMobile && styles.desktop]}>
   ```

3. **Texto adaptativo**: Ajustar según espacio
   ```tsx
   {isMobile ? 'Guardar' : 'Guardar cambios'}
   ```

4. **Padding progresivo**: Más espacio en pantallas grandes
   ```tsx
   padding: isMobile ? 12 : isTablet ? 16 : 24
   ```

5. **Touch targets**: Mínimo 44x44px en mobile
   ```tsx
   minHeight: 44, minWidth: 44
   ```

### ❌ DON'T (No Hacer)

1. **No hardcodear breakpoints** en cada componente
   ```tsx
   width < 640 // ❌ Incorrecto
   ```

2. **No asumir tamaños fijos**
   ```tsx
   width: 300 // ❌ No responsive
   ```

3. **No ignorar orientación landscape**
   ```tsx
   // Considerar isLandscape en tablets
   ```

4. **No hacer componentes solo para un tamaño**
   ```tsx
   // Siempre considerar mobile, tablet y desktop
   ```

5. **No usar ScrollView sin considerar altura**
   ```tsx
   // Usar flex: 1 o maxHeight
   ```

## 🔍 Debugging Responsive

### Ver tamaño actual:
```tsx
const { width, height, deviceType } = useResponsive();
console.log(`Width: ${width}px, Type: ${deviceType}`);
```

### Overlay de desarrollo:
```tsx
// Agregar en development
{__DEV__ && (
  <Text style={styles.debug}>
    {width}px - {deviceType}
  </Text>
)}
```

## 📚 Referencias

- [React Native - useWindowDimensions](https://reactnative.dev/docs/usewindowdimensions)
- [Material Design - Responsive Layout Grid](https://m3.material.io/foundations/layout/applying-layout/window-size-classes)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Android Material Design Guidelines](https://m3.material.io/foundations/layout/understanding-layout/overview)

## 📦 Ejemplo de Implementación

Ver componentes existentes:
- `src/domains/shared/components/user-profile-header.tsx` - Ejemplo completo
- `constants/breakpoints.ts` - Constantes centralizadas
- `hooks/use-responsive.ts` - Hook personalizado

---

**IMPORTANTE:** A partir de ahora, **TODOS los componentes nuevos deben ser responsive por defecto**.

**Última actualización:** Octubre 2025

