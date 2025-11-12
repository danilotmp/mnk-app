/**
 * Estados de registros del sistema
 * Sincronizado con backend: RecordStatus enum
 */
export enum RecordStatus {
  DELETED = -1,
  INACTIVE = 0,
  ACTIVE = 1,
  PENDING = 2,
  SUSPENDED = 3,
}

/**
 * Entidad base con estado
 */
export interface EntityWithStatus {
  status: number;
  statusDescription: string;
}

/**
 * Configuración de colores para estados
 */
export const STATUS_COLORS: Record<number, string> = {
  [RecordStatus.DELETED]: '#6b7280',    // gray-500
  [RecordStatus.INACTIVE]: '#ef4444',   // red-500
  [RecordStatus.ACTIVE]: '#10b981',     // green-500
  [RecordStatus.PENDING]: '#f59e0b',    // amber-500
  [RecordStatus.SUSPENDED]: '#f97316',  // orange-500
};

/**
 * Configuración de iconos para estados
 */
export const STATUS_ICONS: Record<number, string> = {
  [RecordStatus.DELETED]: 'trash-outline',
  [RecordStatus.INACTIVE]: 'close-circle-outline',
  [RecordStatus.ACTIVE]: 'checkmark-circle-outline',
  [RecordStatus.PENDING]: 'time-outline',
  [RecordStatus.SUSPENDED]: 'pause-circle-outline',
};

/**
 * Helper para obtener color del estado
 */
export const getStatusColor = (status: number): string => {
  return STATUS_COLORS[status] ?? '#9ca3af'; // gray-400 por defecto
};

/**
 * Helper para obtener icono del estado
 */
export const getStatusIcon = (status: number): string => {
  return STATUS_ICONS[status] ?? 'help-circle-outline';
};

/**
 * Verificar si un registro está activo
 */
export const isActive = (status: number): boolean => {
  return status === RecordStatus.ACTIVE;
};

/**
 * Verificar si un registro está eliminado
 */
export const isDeleted = (status: number): boolean => {
  return status === RecordStatus.DELETED;
};

