/**
 * Tipos para el componente BranchSelector
 */

import { Branch } from '../../types';

export interface BranchSelectorProps {
  onBranchChange?: (branch: Branch) => void;
}

