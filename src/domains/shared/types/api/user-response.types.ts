export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyIdDefault: string;
  branchIdDefault?: string;
  companies: CompanyInfo[];
}

export interface CompanyInfo {
  id: string;
  code: string;
  name: string;
  branches: BranchInfo[]; // Branches anidados dentro de cada empresa
  roles?: RoleInfo[]; // Roles anidados dentro de cada empresa
}

export interface BranchInfo {
  id: string;
  code: string;
  name: string;
  // type y companyId se infieren del contexto de la empresa padre
}

export interface RoleInfo {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
}


