export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyIdDefault: string;
  branchIdDefault?: string;
  companies: CompanyInfo[];
  branches?: BranchInfo[];
  rolesByCompany?: RoleByCompany[];
}

export interface CompanyInfo {
  id: string;
  code: string;
  name: string;
}

export interface BranchInfo {
  id: string;
  code: string;
  name: string;
  type: string;
  companyId: string;
}

export interface RoleByCompany {
  companyId: string;
  roles: RoleInfo[];
}

export interface RoleInfo {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
}


