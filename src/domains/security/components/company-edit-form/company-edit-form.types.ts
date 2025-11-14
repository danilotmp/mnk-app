/**
 * Tipos para el componente CompanyEditForm
 */

export interface CompanyEditFormProps {
  companyId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
  onFormReady?: (props: { isLoading: boolean; handleSubmit: () => void; handleCancel: () => void }) => void;
}

export interface CompanyFormData {
  code: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  status: number;
}

