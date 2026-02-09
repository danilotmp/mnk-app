# Documento de Arquitectura y Estándares - MNK App

## 1. Visión General
La aplicación **MNK App** es un monolito modular construido sobre **React Native (Expo)** con soporte multiplataforma (Web y Móvil). Sigue principios de **Arquitectura por Dominios**, **Clean Code** y una estricta separación entre la lógica de negocio, la presentación y los estilos.

## 2. Arquitectura de Software
### 2.1 Estructura de Carpetas
- `src/domains/`: Contiene la lógica central por dominio (Shared, Security, Notifications). Cada dominio tiene su `services/`, `types/`, `hooks/` y `components/` (componentes pesados o específicos del dominio).
- `src/features/`: Implementaciones específicas de funcionalidades de usuario (pantallas, formularios específicos).
- `components/`: Componentes de UI genéricos y atómicos (botones, textos, entradas).
- `infrastructure/`: Capa de comunicación externa (API Client, I18n, Messages).

### 2.2 Patrones de Programación
- **Componentización Extrema**: Todo debe estar dividido en componentes reutilizables. Si una lógica o UI se usa en más de un lugar (o es compleja por sí misma), se extrae a un componente en `src/domains/shared/components/` o al dominio correspondiente.
- **Domain-Driven Design (DDD)**: Organización de código por contexto de negocio.
- **Separación de Concernimientos**: 
  - `.screen.tsx`: Solo orquestación de la pantalla.
  - `.styles.ts`: Estilos centralizados mediante funciones `createStyles(colors)`.
  - `.types.ts`: Definiciones de interfaces y enums.
- **Singletons para Servicios**: Servicios como `NotificationsService` gestionan todas las llamadas al backend de forma centralizada.
- **Multiplataforma Nativa**: Uso de extensiones `.web.tsx` para componentes complejos (ej. Editores de Texto) que requieren manipulación directa del DOM, mientras se usa `.tsx` para implementaciones basadas en `WebView` en móviles.

## 3. Sistema de Diseño y UI
### 3.1 Tematización (Theming)
Contamos con un sistema de tema dual (Dark/Light) gestionado por el hook `useTheme()`.
- **Colores Clave**:
  - `primary`: Azul corporativo (#007AFF o similar según configuración).
  - `secondary`: Turquesa/Cian (#00d4aa en modo oscuro).
  - `textSecondary`: Gris suave para subtítulos (#a0a8c1 en modo oscuro).
  - **Estados (Status)**:
    - Activo: `#10b981` (Verde).
    - Inactivo: `#ef4444` (Rojo).
    - Pendiente: `#f59e0b` (Ámbar).
    - Suspendido: `#f97316` (Naranja).

### 3.2 Componentes Estandarizados
- **DataTable**: Componente central de administración.
  - Soporta paginación, filtros locales y remotos.
  - Renderiza celdas automáticamente con `ThemedText` para garantizar contraste.
- **SearchFilterBar**: Barra superior con búsqueda por texto y filtros avanzados (selectores, booleanos).
- **SideModal / CenteredModal**: Modales para formularios y edición.
  - `SideModal`: Para creación/edición rápida lateral.
  - `CenteredModal`: Para contenido que requiere más espacio o enfoque (ej. Editores).
- **RichTextEditor (Jodit)**: 
  - Componente independiente (`RichTextEditorField`) que muestra previsualización y abre un modal (`RichTextEditorModal`) para edición.
  - **Cálculo de Altura Dinámica**: Dado que el `100%` de altura no siempre se comporta bien en componentes embebidos (como Jodit en un modal), se utiliza un cálculo basado en el `windowHeight`. Se resta el tamaño estimado del Header, Footer y paddings internos para que el editor ocupe exactamente el espacio usable del modal.
  - El botón de edición es un cuadrado azul con icono `create-outline` y Tooltip descriptivo.
  - Comunicación bidireccional mediante callbacks y eventos postMessage en móviles.

## 4. Gestión de Datos y API
### 4.1 Contratos de Servicio
- **Respuesta Estándar**: `{ data: [...], meta: { total, page, ... }, result: { statusCode, description } }`.
- **Auditoría**: Todas las entidades de administración deben manejar campos básicos: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `status`, `statusDescription`.

### 4.2 Lógica de Menú Dinámico
El sistema utiliza un JSON recursivo que soporta:
- `submenu`: Arreglo de items hijos.
- `columns`: Agrupamiento de items en columnas.
- **Funciones Recursivas**: Se utilizan para extraer items modificados y renderizar menús multinivel en vertical, horizontal y móvil.
- **Visibilidad Condicional (Modo Mix)**: En la configuración de menú tipo `mix`, el menú vertical (sidebar) solo se renderiza si existen opciones privadas para mostrar. Si todos los items son públicos (se muestran en el menú horizontal), el menú vertical se oculta automáticamente para maximizar el espacio de contenido.

## 5. Reglas de Negocio Específicas
- **Identificadores (Code)**: Los campos de tipo `code` (ej. en plantillas o roles) se formatean automáticamente:
  - Todo en Mayúsculas.
  - Espacios reemplazados por guion bajo (`_`).
  - Sin caracteres especiales.
- **Badges de Estado**: Siempre se debe mostrar el color y la descripción que viene del campo `statusDescription` del backend. Si no existe, se infiere del enum `RecordStatus`.
- **Manejo de Errores**: 
  - **Fuera de Modales**: Se debe usar el servicio `alert.showError` para mostrar Toasts centralizados.
  - **Dentro de Modales**: Prohibido el uso de Toasts (ya que quedan detrás del modal). Se debe usar el componente `InlineAlert` inyectado a través de la propiedad `topAlert` del modal (`SideModal` o `CenteredModal`). La lógica del formulario debe capturar el error y exponerlo mediante el callback `onFormReady`.

## 6. Módulos Implementados
### 6.1 Seguridad
- Gestión de Usuarios, Roles, Permisos y Empresas.
- Administración del Menú Dinámico con soporte Drag & Drop.
### 6.2 Notificaciones
- **Plantillas**: Editor HTML (Jodit) con variables dinámicas tipo `{{name}}`.
- **Log de Envíos**: Historial transaccional con capacidad de reintento para fallidos.
- **Parámetros del Sistema**: CRUD general para configuraciones de sistema (auth, smtp, etc.).
