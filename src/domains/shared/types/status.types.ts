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
 * Interfaz para los colores del theme relacionados con estados
 */
export interface StatusThemeColors {
  success: string;    // ACTIVE
  error: string;       // INACTIVE
  warning: string;    // PENDING
  suspended: string;  // SUSPENDED
  deleted?: string;   // DELETED (opcional, fallback a textSecondary)
  textSecondary?: string; // Fallback para DELETED si no existe deleted
}

/**
 * Helper para obtener color del estado desde el theme
 * @param status - Estado del registro (RecordStatus)
 * @param colors - Colores del theme (de useTheme().colors)
 * @returns Color hexadecimal del estado
 */
export const getStatusColor = (
  status: number,
  colors: StatusThemeColors,
): string => {
  switch (status) {
    case RecordStatus.ACTIVE:
      return colors.success;
    case RecordStatus.INACTIVE:
      return colors.error;
    case RecordStatus.PENDING:
      return colors.warning;
    case RecordStatus.SUSPENDED:
      return colors.suspended;
    case RecordStatus.DELETED:
      return colors.deleted ?? colors.textSecondary ?? '#9ca3af';
    default:
      return colors.textSecondary ?? '#9ca3af';
  }
};

/**
 * @deprecated Usar getStatusColor(status, colors) en su lugar
 * Mantenido solo para compatibilidad temporal
 */
export const STATUS_COLORS: Record<number, string> = {
  [RecordStatus.DELETED]: '#6b7280',
  [RecordStatus.INACTIVE]: '#ef4444',
  [RecordStatus.ACTIVE]: '#10b981',
  [RecordStatus.PENDING]: '#f59e0b',
  [RecordStatus.SUSPENDED]: '#f97316',
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

