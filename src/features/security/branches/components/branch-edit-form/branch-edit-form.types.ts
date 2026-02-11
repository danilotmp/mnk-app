/**
 * Tipos para el componente BranchEditForm
 */

import { BranchType } from "../../types";

export interface BranchEditFormProps {
  branchId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
  onFormReady?: (props: {
    isLoading: boolean;
    handleSubmit: () => void;
    handleCancel: () => void;
    generalError?: { message: string; detail?: string } | null;
  }) => void;
}

export interface BranchFormData {
  companyId: string;
  code: string;
  name: string;
  type: BranchType;
  description: string;
  status: number;
}
