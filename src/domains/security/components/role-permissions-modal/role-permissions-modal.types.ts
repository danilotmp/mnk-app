import { SecurityRole } from '../../types';

export interface RolePermissionsModalProps {
  visible: boolean;
  role: SecurityRole | null;
  onClose: () => void;
  onEdit?: (role: SecurityRole) => void;
}

