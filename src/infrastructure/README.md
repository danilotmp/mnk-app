# 🏗️ Infraestructura de API - Documentación

Esta documentación explica cómo usar la capa de servicios API centralizada de MNK.

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Uso Básico](#uso-básico)
3. [Gestión de Tokens](#gestión-de-tokens)
4. [Selector de Idioma](#selector-de-idioma)
5. [Ejemplos](#ejemplos)

## 🏗️ Arquitectura

### Estructura de Directorios

```
src/infrastructure/
├── api/
│   ├── types.ts              # Tipos genéricos
│   ├── config.ts            # Configuración centralizada
│   ├── storage.adapter.ts   # Adaptadores de almacenamiento
│   ├── api.client.ts         # Cliente API con interceptores
│   └── index.ts
├── i18n/
│   ├── language.context.tsx # Contexto de idioma
│   ├── language-selector.tsx # Selector de idioma
│   └── index.ts
├── services/
│   └── auth.service.ts      # Servicio de autenticación
└── index.ts
```

### Principios de Diseño

1. **Genérico y Centralizado**: Todos los headers se construyen automáticamente
2. **Gestión de Tokens Automática**: Refresh automático cuando expira el accessToken
3. **Type-Safe**: Tipos TypeScript para todas las respuestas
4. **Multiempresa**: Headers automáticos de company-code y user-id

## 🚀 Uso Básico

### 1. Realizar un Request Simple

```typescript
import { apiClient } from '@/src/infrastructure';

// GET request
const response = await apiClient.request({
  endpoint: '/usuarios/me',
  method: 'GET',
});

// POST request con body
const response = await apiClient.request({
  endpoint: '/productos',
  method: 'POST',
  body: {
    nombre: 'Producto 1',
    precio: 100,
  },
});
```

### 2. Headers Automáticos

El cliente construye automáticamente los headers con:

- ✅ `Authorization`: AccessToken (si está disponible)
- ✅ `Accept-Language`: Idioma seleccionado
- ✅ `Content-Type`: application/json
- ✅ `company-code`: Código de empresa del usuario
- ✅ `user-id`: ID del usuario autenticado
- ✅ `app-source`: mobile/web/legacy

**Solo necesitas pasar el body, los headers se generan automáticamente.**

### 3. Estructura de Respuesta

Todas las respuestas siguen el formato estándar:

```typescript
interface ApiResponse<T> {
  data: T;
  result: {
    statusCode: number;
    description: string;
    details: any;
  };
}

// Ejemplo
const response: ApiResponse<User> = await apiClient.request<User>({
  endpoint: '/usuarios/me',
  method: 'GET',
});

console.log(response.data); // Datos del usuario
console.log(response.result.statusCode); // 200
console.log(response.result.description); // "Operación exitosa"
```

## 🔐 Gestión de Tokens

### Refresh Automático

El cliente maneja automáticamente la expiración de tokens:

```typescript
// 1. Realizas un request
const response = await apiClient.request({
  endpoint: '/usuarios/me',
  method: 'GET',
});

// 2. Si el accessToken expira (401), el cliente automáticamente:
//    - Detecta el error 401
//    - Llama a /refresh-token
//    - Guarda los nuevos tokens
//    - Reintenta el request original
//    - Retorna el resultado

// 3. Todo esto ocurre sin que tengas que hacer nada 🎉
```

### Flujo de Tokens

```
┌─────────────────────────────────────────────┐
│ 1. Login                                    │
├─────────────────────────────────────────────┤
│ POST /seguridades/auth/login                │
│ Body: { email, password }                   │
│ Response: { accessToken, refreshToken }    │
│ ↓                                           │
│ Guardar en AsyncStorage                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 2. Request Normal                           │
├─────────────────────────────────────────────┤
│ GET /usuarios/me                            │
│ Header: Authorization: Bearer <accessToken>│
│ Response: 200 OK ✅                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 3. AccessToken Expira (401)                │
├─────────────────────────────────────────────┤
│ GET /usuarios/me                            │
│ Header: Authorization: Bearer <expired>    │
│ Response: 401 Unauthorized ❌               │
│ ↓                                           │
│ POST /seguridades/auth/refresh-token        │
│ Body: { refreshToken }                      │
│ Response: { accessToken, refreshToken }     │
│ ↓                                           │
│ Guardar nuevos tokens                       │
│ ↓                                           │
│ Reintentar GET /usuarios/me                 │
│ Response: 200 OK ✅                         │
└─────────────────────────────────────────────┘
```

### Uso del Servicio de Autenticación

```typescript
import { authService } from '@/src/infrastructure';

// Login
const response = await authService.login({
  email: 'user@example.com',
  password: 'password123',
});

// Los tokens se guardan automáticamente
// El contexto de usuario se configura automáticamente

// Verificar autenticación
const isAuth = await authService.isAuthenticated();

// Logout
await authService.logout(); // Limpia tokens automáticamente
```

## 🌐 Selector de Idioma

### Uso del Selector de Idioma

```typescript
import { LanguageSelector, useLanguage } from '@/src/infrastructure/i18n';

// En tu componente
function MyComponent() {
  return <LanguageSelector />;
}

// Usar el hook
function AnotherComponent() {
  const { language, setLanguage } = useLanguage();
  
  return (
    <Button onPress={() => setLanguage('en')}>
      Change to English
    </Button>
  );
}
```

### Automático en Headers

El idioma seleccionado se envía automáticamente en el header `Accept-Language`:

```typescript
// Si seleccionas "English" en el selector
// Todos los requests tendrán: 'Accept-Language': 'en'

const response = await apiClient.request({
  endpoint: '/productos',
  method: 'GET',
  // Header automático: Accept-Language: en
});
```

## 📝 Ejemplos

### Ejemplo 1: Obtener Lista de Productos

```typescript
import { apiClient } from '@/src/infrastructure';

async function getProducts() {
  const response = await apiClient.request<Product[]>({
    endpoint: '/productos',
    method: 'GET',
  });
  
  return response.data; // Lista de productos
}
```

### Ejemplo 2: Crear un Producto

```typescript
async function createProduct(product: CreateProductDto) {
  const response = await apiClient.request<Product>({
    endpoint: '/productos',
    method: 'POST',
    body: product,
    // Headers construidos automáticamente
    // - Authorization con accessToken
    // - Accept-Language con idioma actual
    // - Content-Type
    // - company-code
    // - user-id
  });
  
  return response.data;
}
```

### Ejemplo 3: Request Sin Autenticación

```typescript
async function publicData() {
  const response = await apiClient.request({
    endpoint: '/public/data',
    method: 'GET',
    skipAuth: true, // No requiere autenticación
  });
  
  return response.data;
}
```

### Ejemplo 4: Servicio Personalizado

```typescript
// src/services/product.service.ts
import { apiClient } from '@/src/infrastructure';

export class ProductService {
  async getAll(): Promise<Product[]> {
    const response = await apiClient.request<Product[]>({
      endpoint: '/productos',
      method: 'GET',
    });
    
    return response.data;
  }
  
  async getById(id: string): Promise<Product> {
    const response = await apiClient.request<Product>({
      endpoint: `/productos/${id}`,
      method: 'GET',
    });
    
    return response.data;
  }
  
  async create(data: CreateProductDto): Promise<Product> {
    const response = await apiClient.request<Product>({
      endpoint: '/productos',
      method: 'POST',
      body: data,
    });
    
    return response.data;
  }
  
  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await apiClient.request<Product>({
      endpoint: `/productos/${id}`,
      method: 'PUT',
      body: data,
    });
    
    return response.data;
  }
  
  async delete(id: string): Promise<void> {
    await apiClient.request({
      endpoint: `/productos/${id}`,
      method: 'DELETE',
    });
  }
}

export const productService = new ProductService();
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### Modificar URL Base

```typescript
import { ApiConfig } from '@/src/infrastructure/api';

const config = ApiConfig.getInstance();
config.setBaseUrl('https://api.mydomain.com/api');
```

### Configurar Contexto de Usuario

```typescript
import { ApiConfig } from '@/src/infrastructure/api';

const config = ApiConfig.getInstance();
config.setUserContext({
  userId: 'user-123',
  companyCode: 'MNK',
});
```

## 🎯 Beneficios

### ✅ Lo que NO tienes que hacer

- ❌ No construir headers manualmente
- ❌ No manejar refresh tokens
- ❌ No preocuparte por expiración de tokens
- ❌ No reinyectar tokens en cada request
- ❌ No manejar cola de requests fallidos
- ❌ No gestionar idioma en headers

### ✅ Lo que SÍ tienes que hacer

- ✅ Solo pasar el endpoint y el body
- ✅ El cliente maneja todo lo demás automáticamente

## 🐛 Troubleshooting

### Error: "No refresh token available"

El usuario no está autenticado. Llama a `authService.login()` primero.

### Error: "Failed to refresh token"

El refreshToken expiró. El usuario debe hacer login nuevamente.

### Error: "Error de conexión"

Verifica que:
1. El backend esté corriendo
2. La URL base esté correcta
3. No haya problemas de CORS

## 📚 Recursos

- [Guía de Consumo de API](./api/README.md)
- [Ejemplos de Servicios](../examples/)

