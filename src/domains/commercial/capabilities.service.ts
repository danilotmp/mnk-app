/**
 * Servicio para gestión de capacidades del sistema
 * Permite activar/desactivar capacidades para empresas
 */

import { apiClient } from '@/src/infrastructure/api/api.client';

export interface CompanyCapability {
  id: string;
  companyId: string;
  capabilityId: string;
  isActive: boolean;
  activatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivateCapabilityPayload {
  companyId: string;
  capabilityId: string;
}

const BASE_CAPABILITIES = '/commercial/capabilities';

export const CapabilitiesService = {
  /**
   * Activar una capacidad para una empresa
   * Endpoint público (no requiere autenticación)
   */
  async activateCapability(payload: ActivateCapabilityPayload): Promise<CompanyCapability> {
    const res = await apiClient.post<CompanyCapability>(
      `${BASE_CAPABILITIES}/activate`,
      payload,
      { skipAuth: true }
    );
    return res.data;
  },

  /**
   * Desactivar una capacidad para una empresa
   */
  async deactivateCapability(companyId: string, capabilityId: string): Promise<void> {
    await apiClient.delete(
      `${BASE_CAPABILITIES}/${companyId}/${capabilityId}`,
      { skipAuth: false }
    );
  },

  /**
   * Obtener capacidades activas de una empresa
   */
  async getCompanyCapabilities(companyId: string): Promise<CompanyCapability[]> {
    const res = await apiClient.get<CompanyCapability[]>(
      `${BASE_CAPABILITIES}/company/${companyId}`
    );
    return res.data || [];
  },

  /**
   * Verificar si una capacidad está activa para una empresa
   */
  async isCapabilityActive(companyId: string, capabilityId: string): Promise<boolean> {
    try {
      const capabilities = await this.getCompanyCapabilities(companyId);
      return capabilities.some(
        cap => cap.capabilityId === capabilityId && cap.isActive
      );
    } catch {
      return false;
    }
  },
};
