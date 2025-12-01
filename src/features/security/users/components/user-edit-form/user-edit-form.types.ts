/**
 * Tipos para el componente UserEditForm
 */

export interface UserEditFormProps {
  userId: string;
  onSuccess?: (updatedUser?: any) => void; // Pasar el usuario actualizado para optimización
  onCancel?: () => void;
  showHeader?: boolean; // Si false, no muestra el header (útil para modal)
  showFooter?: boolean; // Si false, no muestra los botones (útil para modal con footer fijo)
  onFormReady?: (props: { 
    isLoading: boolean; 
    handleSubmit: () => void; 
    handleCancel: () => void;
    generalError?: { message: string; detail?: string } | null;
  }) => void; // Callback para exponer funciones del formulario
}

export interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyId: string; // Mantener para compatibilidad
  branchIds: string[]; // Mantener para compatibilidad
  companyBranches?: Record<string, string[]>; // Nueva estructura: { [companyId]: [branchIds] }
  roleId: string;
  status: number; // 1: Activo, 0: Inactivo, 2: Pendiente, 3: Suspendido
}

