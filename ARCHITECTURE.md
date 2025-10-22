# Arquitectura DDD - MNK App

Este documento describe la arquitectura Domain-Driven Design (DDD) implementada en la aplicación MNK.

## 🏗️ Estructura de Directorios

```
src/
├── domains/                 # Dominios de negocio
│   ├── shared/             # Dominio compartido
│   │   ├── components/     # Componentes compartidos
│   │   ├── services/       # Servicios compartidos
│   │   ├── types/          # Tipos compartidos
│   │   └── utils/          # Utilidades compartidas
│   ├── auth/               # Dominio de autenticación
│   │   ├── components/     # Componentes de auth
│   │   ├── services/       # Servicios de auth
│   │   ├── types/          # Tipos de auth
│   │   └── hooks/          # Hooks de auth
│   ├── user/               # Dominio de usuario
│   ├── dashboard/          # Dominio de dashboard
│   └── settings/           # Dominio de configuración
├── styles/                 # Sistema de estilos
│   ├── themes/             # Temas base
│   │   ├── base.theme.ts   # Tema base
│   │   ├── light.theme.ts  # Tema claro
│   │   └── dark.theme.ts   # Tema oscuro
│   ├── components/         # Estilos por componente
│   │   ├── button.styles.ts
│   │   ├── card.styles.ts
│   │   ├── input.styles.ts
│   │   └── table.styles.ts
│   └── global.styles.ts    # Estilos globales
├── hooks/                  # Hooks personalizados
├── config/                 # Configuración
└── utils/                  # Utilidades globales
```

## 🎯 Principios DDD

### 1. Separación por Dominios
Cada dominio representa un área de negocio específica:
- **Shared**: Elementos comunes a toda la aplicación
- **Auth**: Autenticación y autorización
- **User**: Gestión de usuarios
- **Dashboard**: Panel principal
- **Settings**: Configuración de la aplicación

### 2. Capas por Dominio
Cada dominio tiene sus propias capas:
- **Components**: Componentes específicos del dominio
- **Services**: Lógica de negocio y servicios
- **Types**: Tipos específicos del dominio
- **Hooks**: Hooks específicos del dominio

### 3. Dependencias
- Los dominios pueden depender del dominio `shared`
- Los dominios NO pueden depender entre sí directamente
- La comunicación entre dominios se hace a través de eventos o servicios compartidos

## 🎨 Sistema de Estilos Jerárquico

### 1. Tema Base (`base.theme.ts`)
Contiene la configuración fundamental:
- Colores de marca
- Espaciado base
- Tipografía base
- Configuración de bordes y sombras

### 2. Temas Específicos (`light.theme.ts`, `dark.theme.ts`)
Extienden el tema base con:
- Colores específicos del tema
- Configuraciones de contraste
- Ajustes de opacidad

### 3. Estilos por Componente
Cada componente tiene su propio archivo de estilos:
- `button.styles.ts`
- `card.styles.ts`
- `input.styles.ts`
- `table.styles.ts`

### 4. Estilos Globales
Estilos reutilizables en toda la aplicación:
- Contenedores
- Espaciado
- Flexbox
- Utilidades

## 🔧 Configuración Centralizada

### 1. Configuración de Tema
```typescript
// Cambiar tema globalmente
const { setTheme } = useTheme();
setTheme('dark');

// Obtener tema actual
const { theme, isDark } = useTheme();
```

### 2. Configuración de Componentes
```typescript
// Usar estilos específicos
const buttonStyle = getButtonStyle(theme, 'primary', 'md', false);
const cardStyle = getCardStyle(theme, 'elevated', 'md', 'lg');
```

### 3. Configuración de Colores
```typescript
// Cambiar colores en base.theme.ts
export const baseTheme: BaseTheme = {
  brand: {
    primary: '#TU_COLOR_PRINCIPAL',
    secondary: '#TU_COLOR_SECUNDARIO',
    // ...
  },
  // ...
};
```

## 🚀 Beneficios de la Arquitectura

### 1. Modularidad
- Cada dominio es independiente
- Fácil agregar nuevos dominios
- Mantenimiento simplificado

### 2. Escalabilidad
- Estructura clara para crecimiento
- Separación de responsabilidades
- Reutilización de código

### 3. Mantenibilidad
- Código organizado por dominio
- Estilos centralizados y modulares
- Fácil localización de problemas

### 4. Testabilidad
- Cada dominio se puede probar independientemente
- Servicios aislados
- Componentes desacoplados

## 📱 Compatibilidad Multiplataforma

### 1. iOS
- Soporte completo para SafeArea
- Estilos específicos para iOS
- Navegación nativa

### 2. Android
- Material Design
- Estilos específicos para Android
- Navegación nativa

### 3. Web
- Responsive design
- Estilos específicos para web
- Navegación web

## 🔄 Flujo de Datos

### 1. Componentes
- Reciben props del dominio
- Usan hooks del dominio
- Renderizan UI

### 2. Hooks
- Conectan componentes con servicios
- Manejan estado local
- Proporcionan lógica de negocio

### 3. Servicios
- Lógica de negocio
- Llamadas a API
- Manejo de datos

### 4. Tipos
- Definiciones de interfaces
- Contratos de datos
- Validaciones

## 🛠️ Herramientas de Desarrollo

### 1. TypeScript
- Tipado fuerte
- IntelliSense
- Detección de errores

### 2. ESLint
- Linting de código
- Reglas de estilo
- Mejores prácticas

### 3. Prettier
- Formateo de código
- Consistencia visual
- Automatización

## 📚 Mejores Prácticas

### 1. Naming Conventions
- Dominios en minúsculas
- Servicios con sufijo `.service`
- Hooks con prefijo `use`
- Tipos con sufijo `Type` o `Interface`

### 2. Estructura de Archivos
- Un archivo por componente
- Agrupación por funcionalidad
- Exports centralizados

### 3. Gestión de Estado
- Estado local en hooks
- Estado global en servicios
- Persistencia en storage

### 4. Estilos
- Usar el sistema de temas
- Evitar estilos inline
- Reutilizar componentes

## 🔍 Debugging

### 1. Logs
- Logs por dominio
- Niveles de log
- Filtrado por contexto

### 2. DevTools
- React DevTools
- Redux DevTools (si se usa)
- Flipper (React Native)

### 3. Testing
- Tests unitarios por dominio
- Tests de integración
- Tests E2E

## 📈 Métricas y Monitoreo

### 1. Performance
- Métricas de renderizado
- Tiempo de carga
- Uso de memoria

### 2. Errores
- Tracking de errores
- Logs de crash
- Alertas automáticas

### 3. Uso
- Analytics de usuario
- Métricas de funcionalidad
- Feedback de usuario
