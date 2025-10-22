# Sistema de Diseño MNK App

Este documento describe el sistema de diseño implementado en la aplicación MNK, basado en una paleta de colores azules, verdes y naranjas.

## 🎨 Paleta de Colores

### Colores Principales
- **Azul Principal**: `#0087FF` - Color primario de la marca
- **Verde Principal**: `#00AF00` - Color secundario
- **Naranja Principal**: `#FF7D00` - Color de acento

### Colores de Estado
- **Éxito**: `#00AF00`
- **Advertencia**: `#FF7D00`
- **Error**: `#EA4335`
- **Información**: `#0087FF`

## 🏗️ Arquitectura del Sistema

### 1. Tema Centralizado (`constants/theme.ts`)
- **BrandColors**: Paleta completa de colores con variaciones (50-900)
- **LightTheme**: Tema para modo claro
- **DarkTheme**: Tema para modo oscuro
- **Typography**: Sistema tipográfico unificado
- **Spacing**: Espaciado consistente
- **BorderRadius**: Radio de bordes estandarizado
- **Shadows**: Sistema de sombras

### 2. Hook de Tema (`hooks/use-theme.ts`)
Proporciona acceso centralizado a:
- Colores del tema actual
- Espaciado
- Tipografía
- Sombras
- Estado del tema (claro/oscuro)

### 3. Componentes Modulares

#### Componentes Base
- **ThemedText**: Texto con soporte para variantes de color y tipografía
- **ThemedView**: Contenedor con variantes de fondo
- **Header**: Encabezado con logo y título
- **Logo**: Componente de logo reutilizable

#### Componentes UI
- **Button**: Botón con múltiples variantes y tamaños
- **Card**: Tarjeta con diferentes estilos
- **Collapsible**: Componente colapsable
- **IconSymbol**: Iconos del sistema

## 🎯 Uso del Sistema

### Colores
```typescript
import { useTheme } from '@/hooks/use-theme';

const { colors } = useTheme();

// Usar colores del tema
<ThemedText variant="primary">Texto azul</ThemedText>
<ThemedView variant="surface">Fondo de superficie</ThemedView>
```

### Tipografía
```typescript
<ThemedText type="h1">Título principal</ThemedText>
<ThemedText type="body1">Texto del cuerpo</ThemedText>
<ThemedText type="caption">Texto pequeño</ThemedText>
```

### Espaciado
```typescript
const { spacing } = useTheme();

// Usar espaciado del tema
<View style={{ padding: spacing.md, margin: spacing.lg }} />
```

### Componentes
```typescript
import { Button, Card, Header } from '@/components';

<Header title="Mi App" />
<Card variant="elevated">
  <Button title="Acción" variant="primary" size="large" />
</Card>
```

## 🔧 Personalización

### Cambiar Colores
Para cambiar los colores globalmente, edita `constants/theme.ts`:

```typescript
export const BrandColors = {
  blue: {
    500: '#TU_COLOR_AZUL', // Cambiar color principal
  },
  // ... otros colores
};
```

### Agregar Nuevos Componentes
1. Crea el componente en `components/ui/`
2. Exporta en `components/index.ts`
3. Usa el hook `useTheme` para acceder a los estilos

### Agregar Nuevas Variantes
1. Actualiza los tipos en el componente
2. Agrega la lógica de estilo
3. Actualiza la documentación

## 📱 Responsive Design

El sistema incluye:
- Espaciado adaptativo
- Tipografía escalable
- Componentes flexibles
- Soporte para diferentes tamaños de pantalla

## 🌙 Modo Oscuro

El sistema soporta automáticamente:
- Cambio de colores entre modos
- Ajuste de opacidades
- Sombras adaptadas
- Contraste optimizado

## 🚀 Mejores Prácticas

1. **Usa el hook useTheme**: Siempre accede a los estilos a través del hook
2. **Componentes reutilizables**: Crea componentes modulares y reutilizables
3. **Variantes consistentes**: Usa las variantes definidas en el sistema
4. **Espaciado del tema**: Usa el espaciado del tema en lugar de valores fijos
5. **Colores semánticos**: Usa colores semánticos (primary, secondary, etc.) en lugar de colores específicos

## 📚 Estructura de Archivos

```
constants/
├── theme.ts          # Sistema de colores y tema
└── styles.ts         # Estilos globales reutilizables

hooks/
└── use-theme.ts      # Hook para acceder al tema

components/
├── ui/               # Componentes de interfaz
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── header.tsx        # Componente de encabezado
├── logo.tsx          # Componente de logo
├── themed-text.tsx   # Texto temático
├── themed-view.tsx   # Vista temática
└── index.ts          # Exportaciones
```

## 🔄 Actualizaciones

Para actualizar el sistema:
1. Modifica `constants/theme.ts` para cambios globales
2. Actualiza componentes individuales para cambios específicos
3. Mantén la consistencia en toda la aplicación
4. Documenta los cambios en este archivo
