import { SecurityPermission } from '../../types';

export interface PermissionFlowProps {
  permissions: SecurityPermission[];
  roleName?: string;
  roleCode?: string;
  roleId?: string;
  companyId?: string;
}

