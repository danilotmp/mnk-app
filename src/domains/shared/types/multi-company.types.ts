import { BaseEntity } from './index';

// ===== Company Types =====
export interface Company extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  email: string;
  phone?: string;
  address: Address;
  settings: CompanySettings;
  subscriptionPlan: SubscriptionPlan;
  isActive: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface CompanySettings {
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  features: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  features: string[];
  maxUsers: number;
  maxBranches: number;
  isActive: boolean;
}

// ===== Branch Types =====
export interface Branch extends BaseEntity {
  companyId: string;
  name: string;
  code: string;
  type: BranchType;
  address: Address;
  contactInfo: ContactInfo;
  settings: BranchSettings;
  isActive: boolean;
}

export type BranchType = 'headquarters' | 'branch' | 'warehouse' | 'store';

export interface ContactInfo {
  phone: string;
  email: string;
  website?: string;
}

export interface BranchSettings {
  timezone: string;
  workingHours: WorkingHours;
  services: string[];
  features: string[];
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

// ===== Company Info Type (para array companies en User) =====
export interface CompanyInfo {
  id: string;
  code: string;
  name: string;
  status: number;
  isDefault: boolean; // true si es la empresa por defecto
}

// ===== User Types =====
export interface MultiCompanyUser extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isEmailVerified: boolean;
  companyIdDefault: string; // Empresa por defecto del usuario (renombrado de companyId)
  companies: CompanyInfo[]; // Lista de todas las empresas a las que pertenece el usuario
  currentBranchId: string;
  branches: BranchAccess[]; // Renombrado de availableBranches para mantener consistencia con el backend
  roles: Role[];
  permissions: Permission[];
  preferences: UserPreferences;
}

export interface BranchAccess {
  branchId: string;
  branch: Branch;
  // Eliminados: role, permissions, grantedAt, grantedBy, isActive
  // Los permisos se manejan a nivel de usuario/rol-empresa, no a nivel de branch
}

export interface Role extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  isActive: boolean;
}

export interface Permission extends BaseEntity {
  name: string;
  code: string;
  module: string;
  action: string;
  description?: string;
  isActive: boolean;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  types: {
    security: boolean;
    updates: boolean;
    marketing: boolean;
    system: boolean;
  };
}

// ===== Context Types =====
export interface MultiCompanyState {
  currentCompany: Company | null;
  currentBranch: Branch | null;
  availableBranches: Branch[]; // Mantener para compatibilidad con el contexto (Branch[] filtradas por empresa)
  user: MultiCompanyUser | null;
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
}

export interface CompanyContext {
  company: Company;
  currentBranch: Branch | null;
  availableBranches: BranchAccess[];
  user: MultiCompanyUser;
  permissions: Permission[];
  canSwitchBranch: boolean;
}

// ===== Request/Response Types =====
export interface BranchSwitchRequest {
  branchId: string;
  userId: string;
}

export interface BranchSwitchResponse {
  success: boolean;
  newBranch: Branch;
  permissions: Permission[];
  message: string;
}

