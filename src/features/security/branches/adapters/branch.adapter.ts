/**
 * Adaptador para transformar datos de API a modelos de dominio para Sucursales
 */

import { Branch } from '../types/domain/branch.types';
import { BranchApi } from '../types/api/branch-api.types';

export function branchAdapter(apiBranch: BranchApi): Branch {
  return {
    id: apiBranch.id,
    createdAt: apiBranch.createdAt,
    updatedAt: apiBranch.updatedAt,
    companyId: apiBranch.companyId,
    code: apiBranch.code,
    name: apiBranch.name,
    type: apiBranch.type,
    description: apiBranch.description,
    address: apiBranch.address,
    contactInfo: apiBranch.contactInfo,
    settings: apiBranch.settings,
    status: apiBranch.status,
    statusDescription: apiBranch.statusDescription,
    company: apiBranch.company,
  };
}

export function branchesAdapter(apiBranches: BranchApi[]): Branch[] {
  return apiBranches.map(branchAdapter);
}

