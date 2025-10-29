/**
 * EJEMPLO: Servicio de Productos
 * 
 * Este es un ejemplo de cómo crear un servicio que usa el ApiClient centralizado
 * Puedes usar este patrón para todos tus servicios
 */

import { apiClient } from '@/src/infrastructure';

// Tipos del dominio
interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateProductDto {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
}

interface UpdateProductDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  categoria?: string;
  activo?: boolean;
}

/**
 * Servicio de Productos
 * 
 * Usa el ApiClient centralizado para todas las operaciones.
 * No necesita construir headers ni manejar tokens.
 */
export class ProductService {
  /**
   * Obtiene todos los productos
   * 
   * Headers automáticos incluidos:
   * - Authorization con accessToken
   * - Accept-Language con idioma actual
   * - company-code
   * - user-id
   */
  async getAll(): Promise<Product[]> {
    const response = await apiClient.request<Product[]>({
      endpoint: '/productos',
      method: 'GET',
    });
    
    return response.data;
  }

  /**
   * Obtiene un producto por ID
   */
  async getById(id: string): Promise<Product> {
    const response = await apiClient.request<Product>({
      endpoint: `/productos/${id}`,
      method: 'GET',
    });
    
    return response.data;
  }

  /**
   * Crea un nuevo producto
   * 
   * Solo necesitas pasar el body.
   * Los headers se construyen automáticamente.
   */
  async create(data: CreateProductDto): Promise<Product> {
    const response = await apiClient.request<Product>({
      endpoint: '/productos',
      method: 'POST',
      body: data, // ← Solo pasas el body
      // Headers se construyen automáticamente ✅
    });
    
    return response.data;
  }

  /**
   * Actualiza un producto
   */
  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await apiClient.request<Product>({
      endpoint: `/productos/${id}`,
      method: 'PUT',
      body: data,
    });
    
    return response.data;
  }

  /**
   * Elimina un producto
   */
  async delete(id: string): Promise<void> {
    await apiClient.request({
      endpoint: `/productos/${id}`,
      method: 'DELETE',
    });
  }

  /**
   * Busca productos por categoría
   */
  async getByCategory(category: string): Promise<Product[]> {
    const response = await apiClient.request<Product[]>({
      endpoint: `/productos?categoria=${category}`,
      method: 'GET',
    });
    
    return response.data;
  }

  /**
   * Obtiene productos en stock
   */
  async getInStock(): Promise<Product[]> {
    const response = await apiClient.request<Product[]>({
      endpoint: '/productos?stock=true',
      method: 'GET',
    });
    
    return response.data;
  }

  /**
   * Obtiene productos activos
   */
  async getActive(): Promise<Product[]> {
    const response = await apiClient.request<Product[]>({
      endpoint: '/productos?activo=true',
      method: 'GET',
    });
    
    return response.data;
  }
}

/**
 * Instancia singleton del servicio
 */
export const productService = new ProductService();

/**
 * USO DEL SERVICIO
 * 
 * // En tu componente
 * import { productService } from '@/src/examples/product.service.example';
 * 
 * async function MyComponent() {
 *   // Obtener productos - headers automáticos ✅
 *   const products = await productService.getAll();
 *   
 *   // Crear producto - headers automáticos ✅
 *   const newProduct = await productService.create({
 *     nombre: 'Producto Nuevo',
 *     descripcion: 'Descripción',
 *     precio: 100,
 *     stock: 10,
 *     categoria: 'Electronics',
 *   });
 *   
 *   // Si el token expira, se refresca automáticamente ✅
 *   // No necesitas hacer nada
 * }
 */

