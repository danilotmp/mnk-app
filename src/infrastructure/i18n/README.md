# Sistema de Internacionalización (i18n)

Sistema ligero y rápido de traducciones para la aplicación React Native/Expo sin dependencias externas.

## 🚀 Características

- ✅ **Ligero**: Sin dependencias externas pesadas
- ✅ **Rápido**: Cambio instantáneo de idioma sin recarga
- ✅ **Type-safe**: Tipos TypeScript para autocompletado y validación
- ✅ **Escalable**: Estructura organizada por módulos
- ✅ **Interpolación**: Soporte para variables en traducciones
- ✅ **Cache en memoria**: Acceso inmediato sin overhead

## 📁 Estructura

```
src/infrastructure/i18n/
├── types.ts                    # Tipos TypeScript
├── translations/               # Archivos de traducción
│   ├── es.ts                   # Español
│   ├── en.ts                   # Inglés
│   └── index.ts                # Exportaciones
├── language.context.tsx        # Contexto de idioma
├── language-selector.tsx       # Selector de idioma UI
├── use-translation.ts          # Hook principal
└── README.md                   # Esta documentación
```

## 💻 Uso Básico

### 1. Importar el hook

```tsx
import { useTranslation } from '@/src/infrastructure/i18n';
```

### 2. Usar en componentes

```tsx
function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text>{t.common.welcome}</Text>
      <Text>{t.pages.home.description}</Text>
    </View>
  );
}
```

### 3. Con interpolación de variables

```tsx
function MyComponent() {
  const { t, interpolate } = useTranslation();
  
  return (
    <View>
      <Text>
        {interpolate(t.pages.home.step1Description, { 
          platform: 'F12' 
        })}
      </Text>
    </View>
  );
}
```

### 4. Hook simplificado

Para casos simples donde solo necesitas traducciones:

```tsx
import { useT } from '@/src/infrastructure/i18n';

function MyComponent() {
  const t = useT();
  
  return <Text>{t.common.welcome}</Text>;
}
```

## 📝 Agregar Nuevas Traducciones

### 1. Actualizar el tipo

Edita `types.ts` para agregar la nueva estructura:

```typescript
export interface Translations {
  // ... traducciones existentes
  
  newModule: {
    title: string;
    description: string;
  };
}
```

### 2. Agregar traducciones en español

Edita `translations/es.ts`:

```typescript
export const es: Translations = {
  // ... traducciones existentes
  
  newModule: {
    title: 'Nuevo Módulo',
    description: 'Descripción del módulo',
  },
};
```

### 3. Agregar traducciones en inglés

Edita `translations/en.ts`:

```typescript
export const en: Translations = {
  // ... traducciones existentes
  
  newModule: {
    title: 'New Module',
    description: 'Module description',
  },
};
```

## 🔄 Cambiar Idioma

El idioma se cambia automáticamente usando el `LanguageSelector` o programáticamente:

```tsx
import { useLanguage } from '@/src/infrastructure/i18n';

function MyComponent() {
  const { setLanguage } = useLanguage();
  
  const changeToEnglish = () => {
    setLanguage('en');
  };
  
  return <Button onPress={changeToEnglish} title="English" />;
}
```

**El cambio es instantáneo** - No requiere recarga de página ni compilación.

## 📦 Estructura de Traducciones

Las traducciones están organizadas por módulos/dominios:

- `common`: Textos comunes (botones, acciones, etc.)
- `navigation`: Navegación y menús
- `menu`: Items del menú
- `pages.*`: Traducciones específicas por página
- `user`: Textos relacionados con usuarios
- `errors`: Mensajes de error

## ⚡ Performance

- **Sin recarga**: El cambio de idioma es instantáneo
- **Cache en memoria**: Las traducciones se cargan una vez
- **Type-checking**: TypeScript valida que todas las traducciones existan
- **Lazy loading**: Opcional - puedes cargar traducciones bajo demanda si es necesario

## 🎯 Mejores Prácticas

1. **Usa keys descriptivas**: `t.pages.home.welcome` en lugar de `t.w1`
2. **Agrupa por dominio**: Organiza traducciones por módulo/funcionalidad
3. **Mantén consistencia**: Usa el mismo formato en todos los idiomas
4. **Interpolación**: Usa `{variable}` para valores dinámicos
5. **Type-safe**: Siempre actualiza `types.ts` antes de agregar traducciones

## 🔧 Ejemplos Avanzados

### Traducciones condicionales

```tsx
const { t, language } = useTranslation();
const isEnglish = language === 'en';
const greeting = isEnglish ? t.common.welcome : '¡Hola!';
```

### Traducciones con formato

```tsx
const { t, interpolate } = useTranslation();
const message = interpolate(t.pages.home.step1Description, {
  platform: Platform.select({
    ios: 'cmd + d',
    android: 'cmd + m',
    web: 'F12',
  }) || 'F12',
});
```

## 📚 Integración con API

El idioma seleccionado se envía automáticamente en el header `Accept-Language` de todas las peticiones API a través del `ApiClient`.

## 🐛 Troubleshooting

**Problema**: TypeScript muestra error de tipo
- **Solución**: Asegúrate de actualizar `types.ts` antes de usar nuevas traducciones

**Problema**: Traducción no cambia
- **Solución**: Verifica que estés usando `useTranslation()` y no importando traducciones directamente

**Problema**: Falta traducción en algún idioma
- **Solución**: TypeScript te avisará si falta alguna traducción gracias a los tipos

