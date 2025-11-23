/**
 * Tipos para el componente BranchCreateForm
 */

import { BranchType } from '../../types';

export interface BranchCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
  onFormReady?: (props: { isLoading: boolean; handleSubmit: () => void; handleCancel: () => void }) => void;
}

export interface BranchFormData {
  companyId: string;
  code: string;
  name: string;
  type: BranchType;
  description: string;
  status: number;
}

export const BRANCH_TYPES: { label: string; value: BranchType }[] = [
  { label: 'Casa matriz', value: 'headquarters' },
  { label: 'Sucursal', value: 'branch' },
  { label: 'Bodega', value: 'warehouse' },
  { label: 'Tienda', value: 'store' },
];

