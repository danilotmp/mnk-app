/**
 * Tipos para el componente RoleEditForm
 */

export interface RoleEditFormProps {
  roleId: string;
  onSuccess?: () => void;
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

