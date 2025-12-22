/**
 * Servicio de Contextualización Comercial para IA
 * Gestiona toda la información de contexto que necesita la IA para interactuar con clientes
 */

import { apiClient } from '@/src/infrastructure/api/api.client';
import type {
    CommercialCapabilities,
    CommercialContext,
    CommercialProfile,
    CommercialProfilePayload,
    LayerProgress,
    Offering,
    OfferingComposition,
    OfferingCompositionPayload,
    OfferingPayload,
    OfferingPrice,
    OfferingPricePayload,
    PaymentAccount,
    PaymentAccountPayload,
    PaymentInstruction,
    PaymentInstructionPayload,
    PaymentMethod,
    PaymentMethodPayload,
    PriceAdjustment,
    PriceAdjustmentPayload,
    Promotion,
    PromotionOffering,
    PromotionOfferingPayload,
    PromotionPayload,
    Recommendation,
    RecommendationPayload,
    ServiceCondition,
    ServiceConditionPayload,
} from './types';

const BASE_COMMERCIAL = '/commercial';

// Helper para construir querystring
const buildQuery = (base: string, params?: Record<string, any>): string => {
  if (!params) return base;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${base}?${qs}` : base;
};

export const CommercialService = {
  // ===== Commercial Profile =====
  async getProfile(companyId: string): Promise<CommercialProfile> {
    const res = await apiClient.get<any>(`${BASE_COMMERCIAL}/profile/${companyId}`);
    
    // El API devuelve { data: { commercial: {...} }, result: {...} }
    // Necesitamos extraer y mapear de snake_case a camelCase
    const commercialData = res.data?.commercial || res.data?.data?.commercial || res.data;
    
    // Mapear de snake_case a camelCase si es necesario
    const profile: CommercialProfile = {
      companyId,
      businessDescription: commercialData?.business_description || commercialData?.businessDescription || null,
      industry: commercialData?.industry || null,
      language: commercialData?.language || null,
      timezone: commercialData?.timezone || null,
      currency: commercialData?.currency || null,
      is24_7: commercialData?.is_24_7 ?? commercialData?.is24_7 ?? null,
      defaultTaxMode: commercialData?.default_tax_mode || commercialData?.defaultTaxMode || null,
      allowsBranchPricing: commercialData?.allows_branch_pricing ?? commercialData?.allowsBranchPricing ?? null,
      createdAt: commercialData?.createdAt || commercialData?.created_at || null,
      updatedAt: commercialData?.updatedAt || commercialData?.updated_at || null,
      createdBy: commercialData?.createdBy || commercialData?.created_by || null,
      updatedBy: commercialData?.updatedBy || commercialData?.updated_by || null,
    };
    
    return profile;
  },

  /**
   * UPSERT: Crea o actualiza el perfil comercial
   * El backend decide si crear (201) o actualizar (200) basado en si existe o no
   * companyId debe estar en el body, no en la URL
   */
  async upsertProfile(payload: CommercialProfilePayload): Promise<CommercialProfile> {
    const res = await apiClient.put<CommercialProfile>(`${BASE_COMMERCIAL}/profile`, payload);
    return res.data;
  },

  // Métodos legacy mantenidos para compatibilidad (ahora usan upsertProfile internamente)
  async createProfile(payload: CommercialProfilePayload): Promise<CommercialProfile> {
    return this.upsertProfile(payload);
  },

  async updateProfile(companyId: string, payload: Partial<CommercialProfilePayload>): Promise<CommercialProfile> {
    // Asegurar que companyId esté en el payload
    const fullPayload: CommercialProfilePayload = {
      ...payload,
      companyId,
    };
    return this.upsertProfile(fullPayload);
  },

  // ===== Payment Methods =====
  async getPaymentMethods(companyId: string): Promise<PaymentMethod[]> {
    const endpoint = buildQuery(`${BASE_COMMERCIAL}/payments/methods`, { companyId });
    const res = await apiClient.get<PaymentMethod[]>(endpoint);
    return res.data || [];
  },

  async createPaymentMethod(payload: PaymentMethodPayload): Promise<PaymentMethod> {
    const res = await apiClient.post<PaymentMethod>(`${BASE_COMMERCIAL}/payments/methods`, payload);
    return res.data;
  },

  async updatePaymentMethod(id: string, payload: Partial<PaymentMethodPayload>): Promise<PaymentMethod> {
    const res = await apiClient.put<PaymentMethod>(`${BASE_COMMERCIAL}/payments/methods/${id}`, payload);
    return res.data;
  },

  async deletePaymentMethod(id: string): Promise<void> {
    await apiClient.delete(`${BASE_COMMERCIAL}/payments/methods/${id}`);
  },

  // ===== Payment Accounts =====
  async createPaymentAccount(paymentMethodId: string, payload: PaymentAccountPayload): Promise<PaymentAccount> {
    const res = await apiClient.post<PaymentAccount>(
      `${BASE_COMMERCIAL}/payments/methods/${paymentMethodId}/accounts`,
      payload
    );
    return res.data;
  },

  async updatePaymentAccount(
    paymentMethodId: string,
    accountId: string,
    payload: Partial<PaymentAccountPayload>
  ): Promise<PaymentAccount> {
    const res = await apiClient.put<PaymentAccount>(
      `${BASE_COMMERCIAL}/payments/methods/${paymentMethodId}/accounts/${accountId}`,
      payload
    );
    return res.data;
  },

  async deletePaymentAccount(paymentMethodId: string, accountId: string): Promise<void> {
    await apiClient.delete(`${BASE_COMMERCIAL}/payments/methods/${paymentMethodId}/accounts/${accountId}`);
  },

  // ===== Payment Instructions =====
  async createPaymentInstruction(
    paymentMethodId: string,
    payload: PaymentInstructionPayload
  ): Promise<PaymentInstruction> {
    const res = await apiClient.post<PaymentInstruction>(
      `${BASE_COMMERCIAL}/payments/methods/${paymentMethodId}/instructions`,
      payload
    );
    return res.data;
  },

  async updatePaymentInstruction(
    paymentMethodId: string,
    instructionId: string,
    payload: Partial<PaymentInstructionPayload>
  ): Promise<PaymentInstruction> {
    const res = await apiClient.put<PaymentInstruction>(
      `${BASE_COMMERCIAL}/payments/methods/${paymentMethodId}/instructions/${instructionId}`,
      payload
    );
    return res.data;
  },

  async deletePaymentInstruction(paymentMethodId: string, instructionId: string): Promise<void> {
    await apiClient.delete(`${BASE_COMMERCIAL}/payments/methods/${paymentMethodId}/instructions/${instructionId}`);
  },

  // ===== Offerings =====
  async getOfferings(companyId: string): Promise<Offering[]> {
    const endpoint = buildQuery(`${BASE_COMMERCIAL}/offerings`, { companyId });
    try {
      const res = await apiClient.get<any[]>(endpoint);
      // Mapear datos del backend a formato frontend (snake_case a camelCase y asegurar type)
      const offerings: Offering[] = (res.data || []).map((item: any) => {
        // Mapear precios si vienen en la respuesta
        const prices: OfferingPrice[] = (item.prices || []).map((price: any) => ({
          id: price.id,
          offeringId: price.offering_id || price.offeringId,
          branchId: price.branch_id || price.branchId || null,
          basePrice: typeof price.base_price === 'string' ? parseFloat(price.base_price) : (price.base_price || price.basePrice || 0),
          taxMode: price.tax_mode || price.taxMode,
          validFrom: price.valid_from || price.validFrom,
          validTo: price.valid_to || price.validTo || null,
          status: price.status === 'active' ? 'active' : price.status === 'inactive' ? 'inactive' : price.status || 'active',
          createdAt: price.created_at || price.createdAt,
          updatedAt: price.updated_at || price.updatedAt,
          createdBy: price.created_by || price.createdBy,
          updatedBy: price.updated_by || price.updatedBy,
        }));

        return {
          id: item.id,
          companyId: item.company_id || item.companyId || companyId,
          name: item.name,
          description: item.description || null,
          code: item.code || null,
          type: (item.type || 'product') as 'product' | 'service' | 'package', // Campo directo según V1.0
          requiresConditions: item.requires_conditions ?? item.requiresConditions ?? false,
          status: item.status === 'active' ? 'active' : item.status === 'inactive' ? 'inactive' : item.status,
          statusDescription: item.status_description || item.statusDescription,
          createdAt: item.created_at || item.createdAt,
          updatedAt: item.updated_at || item.updatedAt,
          createdBy: item.created_by || item.createdBy,
          updatedBy: item.updated_by || item.updatedBy,
          metadata: item.metadata || null, // Mantener metadata para category y tags
          prices: prices.length > 0 ? prices : undefined, // Incluir precios si existen
        };
      });
      return offerings;
    } catch (error: any) {
      // Log detallado para debugging
      console.error('Error en getOfferings:', {
        endpoint,
        companyId,
        error: error?.message,
        statusCode: error?.statusCode,
        details: error?.details,
        result: error?.result,
      });
      throw error;
    }
  },

  async getOfferingById(offeringId: string): Promise<Offering> {
    const res = await apiClient.get<any>(`${BASE_COMMERCIAL}/offerings/${offeringId}`);
    const item = res.data;
    // Mapear datos del backend a formato frontend
    return {
      id: item.id,
      companyId: item.company_id || item.companyId,
      name: item.name,
      description: item.description || null,
      code: item.code || null,
      type: (item.type || 'product') as 'product' | 'service' | 'package',
      requiresConditions: item.requires_conditions ?? item.requiresConditions ?? false,
      status: item.status === 'active' ? 'active' : item.status === 'inactive' ? 'inactive' : item.status,
      statusDescription: item.status_description || item.statusDescription,
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
      createdBy: item.created_by || item.createdBy,
      updatedBy: item.updated_by || item.updatedBy,
      metadata: item.metadata || null,
    };
  },

  async createOffering(payload: OfferingPayload): Promise<Offering> {
    const res = await apiClient.post<any>(`${BASE_COMMERCIAL}/offerings`, payload);
    const item = res.data;
    // Mapear respuesta del backend
    return {
      id: item.id,
      companyId: item.company_id || item.companyId || payload.companyId,
      name: item.name,
      description: item.description || null,
      code: item.code || null,
      type: (item.type || payload.type) as 'product' | 'service' | 'package',
      requiresConditions: item.requires_conditions ?? item.requiresConditions ?? payload.requiresConditions ?? false,
      status: item.status === 'active' ? 'active' : item.status === 'inactive' ? 'inactive' : item.status || 'active',
      statusDescription: item.status_description || item.statusDescription,
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
      createdBy: item.created_by || item.createdBy,
      updatedBy: item.updated_by || item.updatedBy,
      metadata: item.metadata || payload.metadata || null,
    };
  },

  async updateOffering(offeringId: string, payload: Partial<OfferingPayload>): Promise<Offering> {
    const res = await apiClient.put<Offering>(`${BASE_COMMERCIAL}/offerings/${offeringId}`, payload);
    return res.data;
  },

  async deleteOffering(offeringId: string): Promise<void> {
    await apiClient.delete(`${BASE_COMMERCIAL}/offerings/${offeringId}`);
  },

  // ===== Bulk Create/Update Offerings =====
  // Este endpoint maneja tanto creaciones como actualizaciones
  // Si se incluye 'id' en el payload, el backend interpreta que es una actualización
  async bulkCreateOfferings(payload: { offerings: Array<{
    id?: string; // Opcional: si está presente, indica actualización
    companyId: string;
    code?: string;
    name: string;
    description?: string;
    type: 'product' | 'service' | 'package';
    requiresConditions?: boolean;
    price: {
      id?: string; // Opcional: si está presente, indica actualización del precio
      basePrice: number;
      taxMode: 'included' | 'excluded';
      branchId?: string | null;
      validFrom?: string; // YYYY-MM-DD
      validTo?: string | null; // YYYY-MM-DD
    };
  }> }): Promise<{
    created: number;
    total: number;
    results: Array<{
      offering: Offering;
      price: OfferingPrice;
    }>;
    errors?: Array<{
      index: number;
      code?: string;
      error: string;
      message: string;
    }>;
  }> {
    const res = await apiClient.post<{
      created: number;
      total: number;
      results: Array<{
        offering: any;
        price: any;
      }>;
      errors?: Array<{
        index: number;
        code?: string;
        error: string;
        message: string;
      }>;
    }>(`${BASE_COMMERCIAL}/offerings/bulk`, payload);
    
    // Mapear resultados
    const results = (res.data?.results || []).map((item: any) => ({
      offering: {
        id: item.offering?.id,
        companyId: item.offering?.company_id || item.offering?.companyId,
        name: item.offering?.name,
        description: item.offering?.description || null,
        code: item.offering?.code || null,
        type: (item.offering?.type || 'product') as 'product' | 'service' | 'package',
        requiresConditions: item.offering?.requires_conditions ?? item.offering?.requiresConditions ?? false,
        status: item.offering?.status === 'active' ? 'active' : item.offering?.status === 'inactive' ? 'inactive' : item.offering?.status || 'active',
        metadata: item.offering?.metadata || null,
      } as Offering,
      price: {
        id: item.price?.id,
        offeringId: item.price?.offering_id || item.price?.offeringId,
        branchId: item.price?.branch_id || item.price?.branchId || null,
        basePrice: item.price?.base_price || item.price?.basePrice,
        taxMode: item.price?.tax_mode || item.price?.taxMode,
        validFrom: item.price?.valid_from || item.price?.validFrom,
        validTo: item.price?.valid_to || item.price?.validTo || null,
        status: item.price?.status === 'active' ? 'active' : item.price?.status === 'inactive' ? 'inactive' : item.price?.status || 'active',
      } as OfferingPrice,
    }));

    return {
      created: res.data?.created || 0,
      total: res.data?.total || 0,
      results,
      errors: res.data?.errors,
    };
  },

  // ===== Offering Prices =====
  // ❌ CAMBIO V1.0: companyId removido del query parameter
  async getOfferingPrices(offeringId: string): Promise<OfferingPrice[]> {
    const endpoint = `${BASE_COMMERCIAL}/pricing/offerings/${offeringId}`;
    const res = await apiClient.get<any[]>(endpoint);
    // Mapear datos del backend asegurando que basePrice sea número
    return (res.data || []).map((item: any) => ({
      id: item.id,
      offeringId: item.offering_id || item.offeringId,
      branchId: item.branch_id || item.branchId || null,
      basePrice: typeof item.base_price === 'string' ? parseFloat(item.base_price) : (item.base_price || item.basePrice || 0),
      taxMode: item.tax_mode || item.taxMode,
      validFrom: item.valid_from || item.validFrom,
      validTo: item.valid_to || item.validTo || null,
      status: item.status === 'active' ? 'active' : item.status === 'inactive' ? 'inactive' : item.status || 'active',
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
      createdBy: item.created_by || item.createdBy,
      updatedBy: item.updated_by || item.updatedBy,
    }));
  },

  async createOfferingPrice(offeringId: string, payload: OfferingPricePayload): Promise<OfferingPrice> {
    // ❌ CAMBIO V1.0: companyId y currency removidos del payload
    // El payload ahora solo incluye: offeringId, branchId, basePrice, taxMode, validFrom, validTo
    const res = await apiClient.post<any>(
      `${BASE_COMMERCIAL}/pricing/offerings/${offeringId}/prices`,
      payload
    );
    const item = res.data;
    // Mapear respuesta asegurando que basePrice sea número
    return {
      id: item.id,
      offeringId: item.offering_id || item.offeringId,
      branchId: item.branch_id || item.branchId || null,
      basePrice: typeof item.base_price === 'string' ? parseFloat(item.base_price) : (item.base_price || item.basePrice || 0),
      taxMode: item.tax_mode || item.taxMode,
      validFrom: item.valid_from || item.validFrom,
      validTo: item.valid_to || item.validTo || null,
      status: item.status === 'active' ? 'active' : item.status === 'inactive' ? 'inactive' : item.status || 'active',
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
      createdBy: item.created_by || item.createdBy,
      updatedBy: item.updated_by || item.updatedBy,
    };
  },

  async updateOfferingPrice(offeringPriceId: string, payload: Partial<OfferingPricePayload>): Promise<OfferingPrice> {
    const res = await apiClient.put<any>(`${BASE_COMMERCIAL}/pricing/prices/${offeringPriceId}`, payload);
    const item = res.data;
    // Mapear respuesta asegurando que basePrice sea número
    return {
      id: item.id,
      offeringId: item.offering_id || item.offeringId,
      branchId: item.branch_id || item.branchId || null,
      basePrice: typeof item.base_price === 'string' ? parseFloat(item.base_price) : (item.base_price || item.basePrice || 0),
      taxMode: item.tax_mode || item.taxMode,
      validFrom: item.valid_from || item.validFrom,
      validTo: item.valid_to || item.validTo || null,
      status: item.status === 'active' ? 'active' : item.status === 'inactive' ? 'inactive' : item.status || 'active',
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
      createdBy: item.created_by || item.createdBy,
      updatedBy: item.updated_by || item.updatedBy,
    };
  },

  async deleteOfferingPrice(offeringPriceId: string): Promise<void> {
    await apiClient.delete(`${BASE_COMMERCIAL}/pricing/prices/${offeringPriceId}`);
  },

  // ===== Price Adjustments =====
  async createPriceAdjustment(offeringPriceId: string, payload: PriceAdjustmentPayload): Promise<PriceAdjustment> {
    const res = await apiClient.post<PriceAdjustment>(
      `${BASE_COMMERCIAL}/pricing/prices/${offeringPriceId}/adjustments`,
      payload
    );
    return res.data;
  },

  async updatePriceAdjustment(
    offeringPriceId: string,
    adjustmentId: string,
    payload: Partial<PriceAdjustmentPayload>
  ): Promise<PriceAdjustment> {
    const res = await apiClient.put<PriceAdjustment>(
      `${BASE_COMMERCIAL}/pricing/prices/${offeringPriceId}/adjustments/${adjustmentId}`,
      payload
    );
    return res.data;
  },

  async deletePriceAdjustment(offeringPriceId: string, adjustmentId: string): Promise<void> {
    await apiClient.delete(`${BASE_COMMERCIAL}/pricing/prices/${offeringPriceId}/adjustments/${adjustmentId}`);
  },

  // ===== Recommendations =====
  async getRecommendations(companyId: string, branchId?: string): Promise<Recommendation[]> {
    const params: Record<string, any> = { companyId };
    if (branchId) params.branchId = branchId;
    const endpoint = buildQuery(`${BASE_COMMERCIAL}/recommendations`, params);
    const res = await apiClient.get<Recommendation[]>(endpoint);
    return res.data || [];
  },

  async createRecommendation(payload: RecommendationPayload): Promise<Recommendation> {
    const res = await apiClient.post<Recommendation>(`${BASE_COMMERCIAL}/recommendations`, payload);
    return res.data;
  },

  async updateRecommendation(recommendationId: string, payload: Partial<RecommendationPayload>): Promise<Recommendation> {
    const res = await apiClient.put<Recommendation>(`${BASE_COMMERCIAL}/recommendations/${recommendationId}`, payload);
    return res.data;
  },

  async deleteRecommendation(recommendationId: string): Promise<void> {
    await apiClient.delete(`${BASE_COMMERCIAL}/recommendations/${recommendationId}`);
  },

  // ===== Service Conditions =====
  // TODO: Implementar cuando el backend esté listo
  async getServiceConditions(offeringId: string): Promise<ServiceCondition[]> {
    // Endpoint pendiente: GET /commercial/offerings/{offeringId}/conditions
    const res = await apiClient.get<ServiceCondition[]>(`${BASE_COMMERCIAL}/offerings/${offeringId}/conditions`);
    return res.data || [];
  },

  async createServiceCondition(offeringId: string, payload: ServiceConditionPayload): Promise<ServiceCondition> {
    // Endpoint pendiente: POST /commercial/offerings/{offeringId}/conditions
    const res = await apiClient.post<ServiceCondition>(`${BASE_COMMERCIAL}/offerings/${offeringId}/conditions`, payload);
    return res.data;
  },

  async updateServiceCondition(offeringId: string, conditionId: string, payload: Partial<ServiceConditionPayload>): Promise<ServiceCondition> {
    // Endpoint pendiente: PUT /commercial/offerings/{offeringId}/conditions/{conditionId}
    const res = await apiClient.put<ServiceCondition>(`${BASE_COMMERCIAL}/offerings/${offeringId}/conditions/${conditionId}`, payload);
    return res.data;
  },

  async deleteServiceCondition(offeringId: string, conditionId: string): Promise<void> {
    // Endpoint pendiente: DELETE /commercial/offerings/{offeringId}/conditions/{conditionId}
    await apiClient.delete(`${BASE_COMMERCIAL}/offerings/${offeringId}/conditions/${conditionId}`);
  },

  // ===== Offering Composition =====
  // TODO: Implementar cuando el backend esté listo
  async getOfferingComposition(packageOfferingId: string): Promise<OfferingComposition[]> {
    // Endpoint pendiente: GET /commercial/offerings/{packageOfferingId}/composition
    const res = await apiClient.get<OfferingComposition[]>(`${BASE_COMMERCIAL}/offerings/${packageOfferingId}/composition`);
    return res.data || [];
  },

  async createOfferingComposition(packageOfferingId: string, payload: OfferingCompositionPayload): Promise<OfferingComposition> {
    // Endpoint pendiente: POST /commercial/offerings/{packageOfferingId}/composition
    const res = await apiClient.post<OfferingComposition>(`${BASE_COMMERCIAL}/offerings/${packageOfferingId}/composition`, payload);
    return res.data;
  },

  async deleteOfferingComposition(packageOfferingId: string, compositionId: string): Promise<void> {
    // Endpoint pendiente: DELETE /commercial/offerings/{packageOfferingId}/composition/{compositionId}
    await apiClient.delete(`${BASE_COMMERCIAL}/offerings/${packageOfferingId}/composition/${compositionId}`);
  },

  // ===== Promotions =====
  // TODO: Implementar cuando el backend esté listo
  async getPromotions(companyId: string): Promise<Promotion[]> {
    // Endpoint pendiente: GET /commercial/promotions?companyId={companyId}
    const endpoint = buildQuery(`${BASE_COMMERCIAL}/promotions`, { companyId });
    const res = await apiClient.get<Promotion[]>(endpoint);
    return res.data || [];
  },

  async createPromotion(payload: PromotionPayload): Promise<Promotion> {
    // Endpoint pendiente: POST /commercial/promotions
    const res = await apiClient.post<Promotion>(`${BASE_COMMERCIAL}/promotions`, payload);
    return res.data;
  },

  async updatePromotion(promotionId: string, payload: Partial<PromotionPayload>): Promise<Promotion> {
    // Endpoint pendiente: PUT /commercial/promotions/{promotionId}
    const res = await apiClient.put<Promotion>(`${BASE_COMMERCIAL}/promotions/${promotionId}`, payload);
    return res.data;
  },

  async deletePromotion(promotionId: string): Promise<void> {
    // Endpoint pendiente: DELETE /commercial/promotions/{promotionId}
    await apiClient.delete(`${BASE_COMMERCIAL}/promotions/${promotionId}`);
  },

  // ===== Promotion Offerings =====
  // TODO: Implementar cuando el backend esté listo
  async addOfferingToPromotion(promotionId: string, payload: PromotionOfferingPayload): Promise<PromotionOffering> {
    // Endpoint pendiente: POST /commercial/promotions/{promotionId}/offerings
    const res = await apiClient.post<PromotionOffering>(`${BASE_COMMERCIAL}/promotions/${promotionId}/offerings`, payload);
    return res.data;
  },

  async removeOfferingFromPromotion(promotionId: string, offeringId: string): Promise<void> {
    // Endpoint pendiente: DELETE /commercial/promotions/{promotionId}/offerings/{offeringId}
    await apiClient.delete(`${BASE_COMMERCIAL}/promotions/${promotionId}/offerings/${offeringId}`);
  },

  // ===== Context & Capabilities =====
  async getFullContext(companyId: string): Promise<CommercialContext> {
    const res = await apiClient.get<CommercialContext>(`${BASE_COMMERCIAL}/context/${companyId}`);
    return res.data;
  },

  async getCapabilities(companyId: string): Promise<CommercialCapabilities> {
    const res = await apiClient.get<CommercialCapabilities>(`${BASE_COMMERCIAL}/context/${companyId}/capabilities`);
    return res.data;
  },

  async updateCapabilities(companyId: string, capabilities: Partial<CommercialCapabilities>): Promise<CommercialCapabilities> {
    const res = await apiClient.put<CommercialCapabilities>(`${BASE_COMMERCIAL}/context/${companyId}/capabilities`, capabilities);
    return res.data;
  },

  async getLayerProgress(companyId: string): Promise<LayerProgress[]> {
    // Calcular progreso basado en los datos existentes según documento técnico V1.0
    const context = await this.getFullContext(companyId);
    const capabilities = await this.getCapabilities(companyId);
    
    const layers: LayerProgress[] = [];
    
    // Capa 1: Contexto Institucional
    const profile = context.institutional?.profile;
    const institutionalFields = [
      profile?.businessDescription,
      profile?.industry,
      profile?.language,
      profile?.timezone,
    ];
    // Filtrar campos que tengan valor (no null, undefined, ni string vacío)
    const institutionalCompleted = institutionalFields.filter(f => {
      if (typeof f === 'string') {
        return f.trim().length > 0;
      }
      return f !== null && f !== undefined && f !== '';
    }).length;
    const institutionalProgress = Math.round((institutionalCompleted / institutionalFields.length) * 100);
    const institutionalComplete = institutionalProgress === 100;
    
    layers.push({
      layer: 'institutional',
      completed: institutionalComplete,
      completionPercentage: institutionalProgress,
      enabledCapabilities: [
        ...(capabilities.canAnswerAboutBusiness ? ['canAnswerAboutBusiness'] : []),
        ...(capabilities.canAnswerAboutLocation ? ['canAnswerAboutLocation'] : []),
      ],
      missingFields: institutionalComplete ? [] : [
        ...(!profile?.businessDescription ? ['businessDescription'] : []),
        ...(!profile?.industry ? ['industry'] : []),
        ...(!profile?.language ? ['language'] : []),
        ...(!profile?.timezone ? ['timezone'] : []),
      ],
    });
    
    // Capa 2: Ofertas (offering, offering_price, price_adjustment, service_condition, offering_composition)
    const hasOfferings = await this.getOfferings(companyId).then(o => o.length > 0).catch(() => false);
    const hasPrices = !!(context.operational?.prices && context.operational.prices.length > 0);
    const offeringsFields = [hasOfferings, hasPrices];
    const offeringsCompleted = offeringsFields.filter(f => f).length;
    const offeringsProgress = Math.round((offeringsCompleted / offeringsFields.length) * 100);
    const offeringsComplete = offeringsProgress === 100;
    
    layers.push({
      layer: 'offerings',
      completed: offeringsComplete,
      completionPercentage: offeringsProgress,
      enabledCapabilities: capabilities.canAnswerAboutPrices ? ['canAnswerAboutPrices'] : [],
      missingFields: offeringsComplete ? [] : [
        ...(!hasOfferings ? ['offerings'] : []),
        ...(!hasPrices ? ['prices'] : []),
      ],
    });
    
    // Capa 3: Promociones (promotion, promotion_offering)
    // TODO: Implementar cuando el backend esté listo
    const hasPromotions = false; // await this.getPromotions(companyId).then(p => p.length > 0).catch(() => false);
    const promotionsProgress = hasPromotions ? 100 : 0;
    
    layers.push({
      layer: 'promotions',
      completed: hasPromotions,
      completionPercentage: promotionsProgress,
      enabledCapabilities: [], // Las promociones no activan capacidades específicas
      missingFields: hasPromotions ? [] : ['promotions'],
      skipped: hasPromotions ? false : undefined,
    });
    
    // Capa 4: Pagos (payment_method, payment_account, payment_instruction)
    const hasPaymentMethods = !!(context.payments?.methods && context.payments.methods.length > 0);
    const hasPaymentAccounts = !!(context.payments?.methods?.some((m: any) => m.accounts && m.accounts.length > 0));
    const paymentsFields = [hasPaymentMethods, hasPaymentAccounts];
    const paymentsCompleted = paymentsFields.filter(f => f).length;
    const paymentsProgress = Math.round((paymentsCompleted / paymentsFields.length) * 100);
    const paymentsComplete = paymentsProgress === 100;
    
    // Si la capacidad está activa pero no hay métodos de pago, fue omitida
    const paymentsSkipped = capabilities.canAnswerAboutPayment && !hasPaymentMethods && !hasPaymentAccounts;
    
    layers.push({
      layer: 'payments',
      completed: paymentsComplete || paymentsSkipped,
      completionPercentage: paymentsProgress,
      enabledCapabilities: capabilities.canAnswerAboutPayment ? ['canAnswerAboutPayment'] : [],
      missingFields: paymentsComplete ? [] : [
        ...(!hasPaymentMethods ? ['paymentMethods'] : []),
        ...(!hasPaymentAccounts ? ['paymentAccounts'] : []),
      ],
      skipped: paymentsSkipped,
    });
    
    // Capa 5: Recomendaciones (todos los tipos: informational, orientation, suggestion, upsell)
    const allRecommendations = context.recommendations || [];
    const hasRecommendations = allRecommendations.length > 0;
    const recommendationsProgress = hasRecommendations ? 100 : 0;
    // Si las capacidades están activas pero no hay recomendaciones, fue omitida
    const recommendationsSkipped = (capabilities.canRecommend || capabilities.canSuggestProducts) && !hasRecommendations;
    
    layers.push({
      layer: 'recommendations',
      completed: hasRecommendations || recommendationsSkipped,
      completionPercentage: recommendationsProgress,
      enabledCapabilities: [
        ...(capabilities.canRecommend ? ['canRecommend'] : []),
        ...(capabilities.canSuggestProducts ? ['canSuggestProducts'] : []),
      ],
      missingFields: hasRecommendations ? [] : ['recommendations'],
      skipped: recommendationsSkipped,
    });
    
    return layers;
  },
};
