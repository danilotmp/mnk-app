# Sistema de Navegación Horizontal

Este documento describe el nuevo sistema de navegación horizontal implementado en la aplicación MNK.

## 🎯 Objetivo

Reemplazar el Tab Bar inferior por un **menú de navegación horizontal** similar al de Banco Guayaquil, con:
- Menú horizontal en la parte superior (desktop/tablet)
- Menú hamburger lateral (mobile)
- Submenús desplegables
- Completamente responsive

## 📊 Diseño

### 💻 Desktop/Tablet (≥ 640px)

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] MNK App                              [DA] Danilo ▼  │ <- Header
├─────────────────────────────────────────────────────────────┤
│ Inicio | Cuentas ▼ | Préstamos ▼ | Tarjetas ▼ | Servicios │ <- Menú Horizontal
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Contenido de la página                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 📱 Mobile (< 640px)

```
┌─────────────────────────────┐
│ [☰] MNK App        [DA]    │ <- Header compacto
├─────────────────────────────┤
│                             │
│ Contenido de la página      │
│                             │
└─────────────────────────────┘

Al tocar [☰]:
┌─────────────────────────────┐
│ Menú                    [✕] │
├─────────────────────────────┤
│ Inicio                      │
│ Cuentas e Inversiones    ▼  │
│ Préstamos                ▼  │
│ Tarjetas de Crédito      ▼  │
│ Más Servicios            ▼  │
│ Empresas                    │
└─────────────────────────────┘
```

## 🧩 Componentes

### 1. HorizontalMenu

**Ubicación:** `components/navigation/horizontal-menu.tsx`

**Props:**
```typescript
interface HorizontalMenuProps {
  items: MenuItem[];           // Items del menú
  onItemPress?: (item: MenuItem) => void;  // Callback al seleccionar
}

interface MenuItem {
  id: string;                  // ID único
  label: string;               // Texto a mostrar
  route?: string;              // Ruta de navegación
  onPress?: () => void;        // Callback personalizado
  icon?: string;               // Icono (opcional)
  submenu?: MenuItem[];        // Submenú (opcional)
}
```

**Características:**
- ✅ Responsive automático (desktop/mobile)
- ✅ Submenús desplegables
- ✅ Scroll horizontal en tablet
- ✅ Menú hamburger en mobile
- ✅ Modal lateral en mobile
- ✅ Theming integrado

### 2. MainLayout (Actualizado)

**Nuevas Props:**
```typescript
interface MainLayoutProps {
  // ... props existentes
  showNavigation?: boolean;    // Mostrar/ocultar menú
  menuItems?: MenuItem[];      // Items del menú
}
```

## 📝 Uso

### Básico - Menú por Defecto

```tsx
// app/(tabs)/_layout.tsx
<MainLayout title="Mi App">
  <Tabs>...</Tabs>
</MainLayout>
```

Esto muestra un menú por defecto con:
- Inicio
- Servicios (con submenú)
- Productos (con submenú)
- Acerca de

### Avanzado - Menú Personalizado

```tsx
import { MainLayout, MenuItem } from '@/components/layouts';

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'Inicio',
    route: '/',
  },
  {
    id: 'accounts',
    label: 'Cuentas e Inversiones',
    submenu: [
      { id: 'savings', label: 'Cuentas de Ahorro', route: '/accounts/savings' },
      { id: 'checking', label: 'Cuentas Corrientes', route: '/accounts/checking' },
      { id: 'investments', label: 'Inversiones', route: '/accounts/investments' },
    ],
  },
  {
    id: 'loans',
    label: 'Préstamos',
    submenu: [
      { id: 'personal', label: 'Préstamo Personal', route: '/loans/personal' },
      { id: 'mortgage', label: 'Préstamo Hipotecario', route: '/loans/mortgage' },
      { id: 'auto', label: 'Préstamo Vehicular', route: '/loans/auto' },
    ],
  },
];

<MainLayout title="MNK App" menuItems={menuItems}>
  <Tabs>...</Tabs>
</MainLayout>
```

### Con Callback Personalizado

```tsx
const menuItems: MenuItem[] = [
  {
    id: 'action',
    label: 'Acción Especial',
    onPress: () => {
      console.log('Ejecutar acción especial');
      // Lógica personalizada
    },
  },
];
```

### Ocultar Menú

```tsx
<MainLayout showNavigation={false}>
  <Content />
</MainLayout>
```

## 🎨 Estilos y Temas

El HorizontalMenu usa el sistema de temas existente:

```typescript
// Colores se adaptan automáticamente
backgroundColor: colors.background
borderColor: colors.border
textColor: colors.text
```

### Personalizar Estilos

Los estilos están en `components/navigation/horizontal-menu.tsx`:

```typescript
const styles = StyleSheet.create({
  horizontalMenuItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    // Personaliza aquí
  },
});
```

## 📱 Comportamiento Responsive

### Desktop (≥ 1024px)
- Menú horizontal completo
- Submenús dropdown al hacer hover/click
- Scroll horizontal si hay muchos items

### Tablet (640-1023px)
- Menú horizontal con scroll
- Submenús dropdown
- Items más compactos

### Mobile (< 640px)
- Botón hamburger (☰)
- Menú lateral modal
- Submenús colapsables
- Full height en el lateral

## 🔄 Flujo de Navegación

```
Usuario en Desktop:
1. Click en "Cuentas e Inversiones"
2. Se despliega dropdown con submenús
3. Click en "Cuentas de Ahorro"
4. Navega a /accounts/savings

Usuario en Mobile:
1. Click en botón hamburger (☰)
2. Se abre menú lateral
3. Click en "Cuentas e Inversiones"
4. Se expande submenú in-place
5. Click en "Cuentas de Ahorro"
6. Navega y cierra menú automáticamente
```

## 📚 Ejemplo Completo

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { MainLayout, MenuItem } from '@/components/layouts';

export default function TabLayout() {
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Inicio',
      route: '/',
    },
    {
      id: 'accounts',
      label: 'Cuentas e Inversiones',
      submenu: [
        { id: 'savings', label: 'Cuentas de Ahorro', route: '/accounts/savings' },
        { id: 'checking', label: 'Cuentas Corrientes', route: '/accounts/checking' },
        { id: 'investments', label: 'Inversiones', route: '/accounts/investments' },
      ],
    },
    {
      id: 'loans',
      label: 'Préstamos',
      submenu: [
        { id: 'personal', label: 'Préstamo Personal', route: '/loans/personal' },
        { id: 'mortgage', label: 'Préstamo Hipotecario', route: '/loans/mortgage' },
        { id: 'auto', label: 'Préstamo Vehicular', route: '/loans/auto' },
      ],
    },
    {
      id: 'cards',
      label: 'Tarjetas de Crédito',
      submenu: [
        { id: 'visa', label: 'Visa', route: '/cards/visa' },
        { id: 'mastercard', label: 'Mastercard', route: '/cards/mastercard' },
      ],
    },
    {
      id: 'services',
      label: 'Más Servicios',
      submenu: [
        { id: 'transfers', label: 'Transferencias', route: '/services/transfers' },
        { id: 'payments', label: 'Pagos', route: '/services/payments' },
        { id: 'insurance', label: 'Seguros', route: '/services/insurance' },
      ],
    },
    {
      id: 'business',
      label: 'Empresas',
      route: '/business',
    },
  ];

  return (
    <MainLayout title="MNK App" menuItems={menuItems}>
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="explore" />
      </Tabs>
    </MainLayout>
  );
}
```

## 🛠️ Integración con Navegación

### TODO: Implementar navegación real

Actualmente, el menú solo hace `console.log`. Para integrar con Expo Router:

```tsx
// En MainLayout
import { router } from 'expo-router';

const handleMenuItemPress = (item: MenuItem) => {
  if (item.route) {
    router.push(item.route);
  }
  if (item.onPress) {
    item.onPress();
  }
};
```

### Con React Navigation

```tsx
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();

const handleMenuItemPress = (item: MenuItem) => {
  if (item.route) {
    navigation.navigate(item.route);
  }
};
```

## 🎯 Beneficios

### ✅ Ventajas sobre Tab Bar Inferior

1. **Más Espacio**: No ocupa espacio del contenido
2. **Más Items**: Puede tener más opciones con submenús
3. **Profesional**: Se ve más empresarial
4. **Jerárquico**: Submenús para organizar mejor
5. **Responsive**: Se adapta a mobile con hamburger

### ✅ Ventajas del Diseño

1. **Modular**: Fácil agregar/quitar items
2. **Reutilizable**: Mismo menú en todas las páginas
3. **Customizable**: Props para personalizar
4. **Accesible**: Fácil de usar en mobile y desktop
5. **Theming**: Usa colores del tema automáticamente

## 📊 Comparación

| Característica | Tab Bar Inferior | Menú Horizontal |
|----------------|------------------|-----------------|
| **Posición** | Inferior | Superior |
| **Espacio** | Fijo (60px) | Flexible |
| **Items** | 3-5 max | Ilimitado con scroll |
| **Submenús** | ❌ No | ✅ Sí |
| **Mobile** | Igual | Hamburger |
| **Tablet** | Igual | Optimizado |
| **Desktop** | Desperdicia espacio | Optimizado |

## 🔍 Testing

### Desktop
1. Verifica que todos los items del menú sean visibles
2. Prueba hover en items con submenú
3. Prueba click en submenú
4. Verifica scroll horizontal si hay muchos items

### Tablet
1. Verifica scroll horizontal
2. Prueba submenús dropdown
3. Verifica que no se vea amontonado

### Mobile
1. Verifica que aparezca botón hamburger
2. Abre menú lateral
3. Expande submenús
4. Verifica que cierre al seleccionar
5. Prueba en portrait y landscape

## 📝 Próximos Pasos

1. ✅ Implementar navegación real con Expo Router
2. ⏳ Agregar animaciones de transición
3. ⏳ Agregar iconos a los items
4. ⏳ Agregar badges/notificaciones
5. ⏳ Agregar breadcrumbs debajo del menú
6. ⏳ Agregar search en el menú mobile

## 📚 Referencias

- Ver `components/navigation/horizontal-menu.tsx` - Implementación completa
- Ver `components/layouts/main-layout.tsx` - Integración
- Ver `app/(tabs)/_layout.tsx` - Ejemplo de uso

---

**Última actualización:** Octubre 2025

