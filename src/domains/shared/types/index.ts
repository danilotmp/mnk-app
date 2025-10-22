// Tipos compartidos entre dominios
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  statusCode: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos de tema
export type ThemeVariant = 'light' | 'dark' | 'auto';
export type ColorScheme = 'light' | 'dark';

// Tipos de plataforma
export type Platform = 'ios' | 'android' | 'web';

// Tipos de tamaño
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

// Tipos de variante de componente
export type ComponentVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'filled';
