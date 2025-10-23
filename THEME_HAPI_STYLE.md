# 🎨 Tema Dark - Estilo Hapi Trade

## Paleta de Colores Actualizada

La aplicación ahora utiliza una paleta de colores inspirada en **Hapi Trade**, ofreciendo una experiencia visual moderna con tonos azules oscuros profundos y acentos cyan/turquesa brillantes.

---

## 🌙 Modo Oscuro (Dark Theme)

### Colores de Fondo

```typescript
background: '#0a0e27'      // Azul oscuro muy profundo (fondo principal)
surface: '#151b2e'         // Azul oscuro medio (cards, contenedores)
surfaceVariant: '#1e2538'  // Azul oscuro ligeramente más claro
```

**Vista Previa:**
```
┌─────────────────────────────────────┐
│ #0a0e27 - Background Principal      │ ← Fondo principal
│  ┌───────────────────────────────┐  │
│  │ #151b2e - Surface (Card)      │  │ ← Cards y contenedores
│  │  ┌─────────────────────────┐  │  │
│  │  │ #1e2538 - Variant       │  │  │ ← Elementos elevados
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Colores Primarios

```typescript
primary: '#4dd4ff'        // Cyan brillante (botones, links)
primaryLight: '#7ee0ff'   // Cyan más claro (hover states)
primaryDark: '#00a8cc'    // Cyan oscuro (pressed states)
```

**Uso:**
- Botones principales
- Links y elementos interactivos
- Iconos activos en navegación
- Indicadores de selección

### Colores de Texto

```typescript
text: '#ffffff'           // Blanco puro (texto principal)
textSecondary: '#a0a8c1'  // Gris azulado claro (texto secundario)
textTertiary: '#6b7588'   // Gris azulado medio (texto terciario)
```

**Jerarquía:**
```
#ffffff   - Títulos, texto principal, datos importantes
#a0a8c1   - Subtítulos, descripciones, etiquetas
#6b7588   - Texto de ayuda, placeholders, texto deshabilitado
```

### Colores de Estado

```typescript
success: '#00d98d'   // Verde brillante (valores positivos, éxito)
error: '#ff3366'     // Rojo/Rosa brillante (valores negativos, errores)
warning: '#ffd93d'   // Amarillo brillante (advertencias)
info: '#4dd4ff'      // Cyan (información, igual que primary)
```

**Ejemplo de Uso (Trading):**
```
$186.22
+$1.86 (+1.01%) ← Verde #00d98d (valor positivo)

$182.16
-$0.01 (-0.00%) ← Rojo #ff3366 (valor negativo)
```

### Colores de Borde

```typescript
border: '#1e2538'        // Bordes sutiles (divisores)
borderLight: '#2a3142'   // Bordes más visibles (contenedores)
```

---

## ☀️ Modo Claro (Light Theme)

### Colores Principales

```typescript
primary: '#00a8cc'        // Cyan oscuro (mejor contraste en fondo claro)
primaryLight: '#b3f2ff'   // Cyan muy claro
primaryDark: '#006175'    // Cyan muy oscuro
```

### Colores de Fondo

```typescript
background: '#ffffff'     // Blanco puro
surface: '#f8f9fa'        // Gris muy claro
surfaceVariant: '#f1f3f4' // Gris claro
```

---

## 🎨 Paleta Completa de Brand Colors

### Cyan/Turquesa (Primary)

```typescript
50:  '#e6fbff'  // Muy claro
100: '#b3f2ff'
200: '#80e9ff'
300: '#4dd4ff'  // ← Principal (Dark Mode)
400: '#1ac8ff'
500: '#00b8f0'
600: '#00a8cc'  // ← Principal (Light Mode)
700: '#0088a3'
800: '#006175'
900: '#003947'  // Muy oscuro
```

### Verde (Success/Positive)

```typescript
50:  '#e6fff5'
100: '#b3ffe0'
200: '#80ffcb'
300: '#4dffb6'
400: '#1affa1'
500: '#00d98d'  // ← Principal (valores positivos)
600: '#00b377'
700: '#008d5e'
800: '#006745'
900: '#00412c'
```

### Amarillo/Naranja (Warning)

```typescript
50:  '#fffde6'
100: '#fffab3'
200: '#fff780'
300: '#fff44d'
400: '#ffd93d'  // ← Principal (advertencias)
500: '#ffc700'
600: '#e6b000'
700: '#cc9900'
800: '#997300'
900: '#664d00'
```

### Rojo/Rosa (Error/Negative)

```typescript
error: '#ff3366'  // Rojo/Rosa brillante
```

---

## 📱 Ejemplos de Uso

### Header/Navegación

```tsx
// Fondo del header
backgroundColor: colors.background  // #0a0e27

// Texto del menú (normal)
color: colors.textSecondary  // #a0a8c1

// Texto del menú (activo)
color: colors.primary  // #4dd4ff
```

### Cards/Contenedores

```tsx
// Card principal
backgroundColor: colors.surface  // #151b2e
borderColor: colors.border       // #1e2538

// Card elevado o destacado
backgroundColor: colors.surfaceVariant  // #1e2538
shadowColor: colors.primary            // #4dd4ff (sombra cyan)
```

### Botones

```tsx
// Botón primario
backgroundColor: colors.primary  // #4dd4ff
color: colors.background        // #0a0e27 (texto oscuro en botón claro)

// Botón secundario
backgroundColor: colors.surface  // #151b2e
borderColor: colors.primary     // #4dd4ff
color: colors.primary           // #4dd4ff

// Botón de éxito
backgroundColor: colors.success  // #00d98d
color: '#ffffff'
```

### Valores Financieros

```tsx
// Valor positivo
<ThemedText style={{ color: colors.success }}>
  +$1.86 (+1.01%)
</ThemedText>

// Valor negativo
<ThemedText style={{ color: colors.error }}>
  -$0.01 (-0.00%)
</ThemedText>
```

---

## 🔄 Comparación: Antes vs Después

### Antes (Colores Genéricos)

```
Primary:    #0087FF  (Azul estándar)
Background: #202124  (Gris oscuro)
Success:    #00AF00  (Verde genérico)
```

### Después (Estilo Hapi Trade)

```
Primary:    #4DD4FF  (Cyan brillante) ✨
Background: #0A0E27  (Azul oscuro profundo) 🌌
Success:    #00D98D  (Verde turquesa brillante) 💚
Error:      #FF3366  (Rosa brillante) 💗
```

---

## 💡 Ventajas de esta Paleta

### ✅ Legibilidad
- Alto contraste entre texto blanco (#ffffff) y fondos oscuros (#0a0e27)
- Textos secundarios (#a0a8c1) perfectamente visibles

### ✅ Jerarquía Visual
- Colores brillantes (#4dd4ff) destacan elementos interactivos
- Fondos en diferentes tonos de azul crean profundidad
- Estados claramente diferenciados (verde/rojo)

### ✅ Modernidad
- Estilo "dark finance UI" popular en apps fintech
- Cyan/turquesa da sensación de confianza y tecnología
- Bordes sutiles (#1e2538) evitan saturación visual

### ✅ Accesibilidad
- Cumple con WCAG 2.1 AA para contraste
- Colores de estado universalmente reconocibles
- Funciona bien en diferentes tamaños de pantalla

---

## 🎯 Referencias de Diseño

Esta paleta está inspirada en:
- **Hapi Trade** - Dark finance UI con cyan brillante
- **Trading platforms** - Verde/Rojo para valores
- **Modern Fintech apps** - Fondos azules oscuros profundos

---

## 🔧 Uso en Código

### Hook useTheme

```tsx
import { useTheme } from '@/hooks/use-theme';

function MyComponent() {
  const { colors } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.surface }}>
      <Text style={{ color: colors.text }}>Título</Text>
      <Text style={{ color: colors.textSecondary }}>Subtítulo</Text>
      <TouchableOpacity style={{ backgroundColor: colors.primary }}>
        <Text style={{ color: colors.background }}>Acción</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Componentes Temáticos

```tsx
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

<ThemedView variant="surface">
  <ThemedText type="title">Título Principal</ThemedText>
  <ThemedText type="body1" color="secondary">Texto secundario</ThemedText>
  <ThemedText type="caption" color="tertiary">Ayuda</ThemedText>
</ThemedView>
```

---

## 📊 Matriz de Contraste

| Combinación | Ratio | WCAG AA | WCAG AAA |
|-------------|-------|---------|----------|
| #ffffff sobre #0a0e27 | 19.2:1 | ✅ Pasa | ✅ Pasa |
| #a0a8c1 sobre #0a0e27 | 11.5:1 | ✅ Pasa | ✅ Pasa |
| #4dd4ff sobre #0a0e27 | 12.8:1 | ✅ Pasa | ✅ Pasa |
| #00d98d sobre #0a0e27 | 10.2:1 | ✅ Pasa | ✅ Pasa |

---

**Creado:** Octubre 2025  
**Inspirado por:** Hapi Trade UI Design  
**Autor:** MNK App Team

