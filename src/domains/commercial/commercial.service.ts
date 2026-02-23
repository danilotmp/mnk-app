/**
 * Servicio de Contextualización Comercial para IA
 * Gestiona toda la información de contexto que necesita la IA para interactuar con clientes
 */

import { apiClient } from '@/src/infrastructure/api/api.client';
import type {
    CommercialCapabilities,
    CommercialProfile,
    CommercialProfilePayload,
    InteractionGuideline,
    InteractionGuidelinePayload,
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
    WhatsAppCreateResponse,
    WhatsAppInstance,
    WhatsAppInstancePayload,
} from './types';

const BASE_COMMERCIAL = '/commercial';
const BASE_INTERACCIONES = '/interacciones';

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
    const res = await apiClient.get<any>(`${BASE_INTERACCIONES}/profile/${companyId}`);
    
    // El API devuelve diferentes formatos posibles:
    // - { data: { commercial: {...} }, result: {...} }
    // - { data: { id, companyId, whatsapp, ... } }
    // - { data: { data: { commercial: {...} } } }
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
      // Mapear whatsappInstances: array de instancias de WhatsApp
      whatsappInstances: commercialData?.whatsappInstances || commercialData?.whatsapp_instances || [],
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
    const res = await apiClient.put<any>(`${BASE_INTERACCIONES}/profile`, payload);
    
    // La respuesta puede venir en diferentes formatos:
    // - { data: { commercial: {...} }, result: {...} }
    // - { data: { id, companyId, whatsapp, ... } }
    // - { data: { data: { commercial: {...} } } }
    const commercialData = res.data?.commercial || res.data?.data?.commercial || res.data;
    
    // Mapear manualmente para asegurar que todos los campos se mapeen correctamente
    const profile: CommercialProfile = {
      companyId: commercialData?.companyId || payload.companyId,
      businessDescription: commercialData?.business_description || commercialData?.businessDescription || null,
      industry: commercialData?.industry || null,
      language: commercialData?.language || null,
      timezone: commercialData?.timezone || null,
      currency: commercialData?.currency || null,
      is24_7: commercialData?.is_24_7 ?? commercialData?.is24_7 ?? null,
      defaultTaxMode: commercialData?.default_tax_mode || commercialData?.defaultTaxMode || null,
      allowsBranchPricing: commercialData?.allows_branch_pricing ?? commercialData?.allowsBranchPricing ?? null,
      whatsappInstances: commercialData?.whatsappInstances || commercialData?.whatsapp_instances || [],
      createdAt: commercialData?.createdAt || commercialData?.created_at || null,
      updatedAt: commercialData?.updatedAt || commercialData?.updated_at || null,
      createdBy: commercialData?.createdBy || commercialData?.created_by || null,
      updatedBy: commercialData?.updatedBy || commercialData?.updated_by || null,
    };
    
    return profile;
  },

  // Métodos legacy mantenidos para compatibilidad (ahora usan upsertProfile internamente)
  async createProfile(payload: CommercialProfilePayload): Promise<CommercialProfile> {
    return this.upsertProfile(payload);
  },

  async updateProfile(companyId: string, payload: Partial<CommercialProfilePayload>): Promise<CommercialProfile> {
    // Si no se están actualizando whatsappInstances, preservar las existentes
    let finalPayload: CommercialProfilePayload = {
      ...payload,
      companyId,
    };
    
    if (!payload.whatsappInstances) {
      const currentProfile = await this.getProfile(companyId);
      finalPayload.whatsappInstances = currentProfile.whatsappInstances?.map(inst => ({
        whatsapp: inst.whatsapp,
        whatsappQR: inst.whatsappQR,
        isActive: inst.isActive,
      })) || [];
    }
    
    return this.upsertProfile(finalPayload);
  },

  // ===== Payment Methods =====
  async getPaymentMethods(companyId: string, admin?: boolean): Promise<PaymentMethod[]> {
    const params: Record<string, any> = { companyId };
    if (admin) {
      params.admin = 'true';
    }
    const endpoint = buildQuery(`${BASE_COMMERCIAL}/payments/methods`, params);
    const res = await apiClient.get<{ methods: any[]; currency?: string }>(endpoint);
    // La respuesta viene con { methods: [...], currency: "USD" }
    // Cada method ya incluye accounts e instructions
    // Asegurar que methods sea un array
    const methodsData = res.data?.methods || res.data?.data?.methods || (Array.isArray(res.data) ? res.data : []);
    const methods = (Array.isArray(methodsData) ? methodsData : []).map((item: any) => ({
      id: item.id,
      companyId: item.company_id || companyId,
      method: item.method,
      isActive: item.is_active ?? item.isActive ?? true,
                accounts: (item.accounts || []).map((acc: any) => ({
                  id: acc.id,
                  paymentMethodId: acc.payment_method_id || acc.paymentMethodId || item.id,
                  name: acc.name || acc.label, // Soporte temporal para label (legacy)
                  provider: acc.provider,
                  accountNumber: acc.account_number || acc.accountNumber,
                  accountHolder: acc.account_holder || acc.accountHolder,
                  identification: acc.identification,
                  additionalData: acc.additional_data || acc.additionalData,
                  status: acc.status ?? (acc.is_active ? 1 : 0), // Mapear isActive legacy a status
                  statusDescription: acc.status_description || acc.statusDescription,
                  createdAt: acc.created_at || acc.createdAt,
                  updatedAt: acc.updated_at || acc.updatedAt,
                } as PaymentAccount)),
                instructions: (item.instructions || []).map((inst: any) => ({
                  id: inst.id,
                  paymentMethodId: inst.payment_method_id || inst.paymentMethodId || item.id,
                  paymentAccountId: inst.payment_account_id || inst.paymentAccountId || null,
                  instructionType: inst.instruction_type || inst.instructionType || 'general',
                  message: inst.message,
                  status: inst.status ?? (inst.is_active !== false ? 1 : 0), // Mapear isActive legacy a status
                  statusDescription: inst.status_description || inst.statusDescription,
                  createdAt: inst.created_at || inst.createdAt,
                } as PaymentInstruction)),
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
    } as PaymentMethod));
    return methods;
  },

  async createPaymentMethod(payload: PaymentMethodPayload): Promise<PaymentMethod> {
    const res = await apiClient.post<PaymentMethod>(`${BASE_COMMERCIAL}/payments/methods`, payload);
    // Si el backend devuelve camelCase directamente, usar mapper
    const { mapObject } = await import('@/src/domains/shared/utils/object-mapper');
    return mapObject<PaymentMethod>(res.data, { deep: true }) as PaymentMethod;
  },

  async updatePaymentMethod(id: string, payload: Partial<PaymentMethodPayload>): Promise<PaymentMethod> {
    const res = await apiClient.put<PaymentMethod>(`${BASE_COMMERCIAL}/payments/methods/${id}`, payload);
    const { mapObject } = await import('@/src/domains/shared/utils/object-mapper');
    return mapObject<PaymentMethod>(res.data, { deep: true }) as PaymentMethod;
  },

  async deletePaymentMethod(id: string): Promise<void> {
    await apiClient.delete(`${BASE_COMMERCIAL}/payments/methods/${id}`);
  },

  // ===== Payment Accounts =====
  async getPaymentAccounts(paymentMethodId: string): Promise<PaymentAccount[]> {
    const res = await apiClient.get<PaymentAccount[]>(
      `${BASE_COMMERCIAL}/payments/methods/${paymentMethodId}/accounts`
    );
    return res.data || [];
  },

  async createPaymentAccount(paymentMethodId: string, payload: PaymentAccountPayload): Promise<PaymentAccount> {
    // El endpoint es /payments/methods/{paymentMethodId}/accounts según la especificación de Postman
    const res = await apiClient.post<PaymentAccount>(
      `${BASE_COMMERCIAL}/payments/methods/${paymentMethodId}/accounts`,
      payload
    );
    const { mapObject } = await import('@/src/domains/shared/utils/object-mapper');
    return mapObject<PaymentAccount>(res.data, { deep: true }) as PaymentAccount;
  },

  async updatePaymentAccount(
    paymentMethodId: string,
    accountId: string,
    payload: Partial<PaymentAccountPayload>
  ): Promise<PaymentAccount> {
    // El endpoint es /payments/accounts/{accountId} según la especificación de Postman
    const res = await apiClient.put<PaymentAccount>(
      `${BASE_COMMERCIAL}/payments/accounts/${accountId}`,
      payload
    );
    const { mapObject } = await import('@/src/domains/shared/utils/object-mapper');
    return mapObject<PaymentAccount>(res.data, { deep: true }) as PaymentAccount;
  },

  async deletePaymentAccount(paymentMethodId: string, accountId: string): Promise<void> {
    // El endpoint es /payments/accounts/{accountId} según la especificación de Postman
    await apiClient.delete(`${BASE_COMMERCIAL}/payments/accounts/${accountId}`);
  },

  // ===== Payment Instructions =====
  async getPaymentInstructions(paymentMethodId: string): Promise<PaymentInstruction[]> {
    const res = await apiClient.get<PaymentInstruction[]>(
      `${BASE_COMMERCIAL}/payments/methods/${paymentMethodId}/instructions`
    );
    return res.data || [];
  },

  async createPaymentInstruction(
    paymentMethodId: string,
    payload: PaymentInstructionPayload
  ): Promise<PaymentInstruction> {
    // El endpoint es /payments/instructions según el usuario
    // El payload ya incluye paymentMethodId, no necesitamos agregarlo de nuevo
    const res = await apiClient.post<PaymentInstruction>(
      `${BASE_COMMERCIAL}/payments/instructions`,
      payload
    );
    const { mapObject } = await import('@/src/domains/shared/utils/object-mapper');
    return mapObject<PaymentInstruction>(res.data, { deep: true }) as PaymentInstruction;
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
      const offeringsData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const offerings: Offering[] = (Array.isArray(offeringsData) ? offeringsData : []).map((item: any) => {
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
          image: item.image ?? null,
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
      image: item.image ?? null,
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
      image: item.image ?? payload.image ?? null,
    };
  },

  async updateOffering(offeringId: string, payload: Partial<OfferingPayload>): Promise<Offering> {
    const res = await apiClient.put<any>(`${BASE_COMMERCIAL}/offerings/${offeringId}`, payload);
    const item = res.data;
    return {
      id: item.id,
      companyId: item.company_id || item.companyId,
      name: item.name,
      description: item.description ?? null,
      code: item.code ?? null,
      type: (item.type || 'product') as 'product' | 'service' | 'package',
      requiresConditions: item.requires_conditions ?? item.requiresConditions ?? false,
      status: item.status === 'active' ? 'active' : item.status === 'inactive' ? 'inactive' : item.status,
      statusDescription: item.status_description || item.statusDescription,
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
      createdBy: item.created_by || item.createdBy,
      updatedBy: item.updated_by || item.updatedBy,
      metadata: item.metadata ?? null,
      image: item.image ?? null,
    };
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
    image?: string | null;
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
        image: item.offering?.image ?? null,
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
    const pricesData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    return (Array.isArray(pricesData) ? pricesData : []).map((item: any) => ({
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

  // ===== Interaction Guidelines =====
  async getInteractionGuidelines(companyId: string): Promise<InteractionGuideline[]> {
    const endpoint = buildQuery(`${BASE_INTERACCIONES}/interaction-guidelines`, { companyId });
    const res = await apiClient.get<any[]>(endpoint);
    const guidelinesData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    const guidelines: InteractionGuideline[] = (Array.isArray(guidelinesData) ? guidelinesData : []).map((item: any) => {
      // Convertir status a número si viene como string
      let statusNum = typeof item.status === 'number' ? item.status : 
        item.status === 'active' ? 1 : 
        item.status === 'inactive' ? 0 : 
        item.status === 'pending' ? 2 : 
        item.status === 'suspended' ? 3 : 1; // Default: Activo
      
      return {
        id: item.id,
        commercialProfileId: item.commercial_profile_id || item.commercialProfileId,
        title: item.title,
        description: item.description,
        status: statusNum,
        statusDescription: item.status_description || item.statusDescription || 
          (statusNum === 1 ? 'Activo' : statusNum === 0 ? 'Inactivo' : statusNum === 2 ? 'Pendiente' : 'Suspendido'),
        createdAt: item.created_at || item.createdAt,
        updatedAt: item.updated_at || item.updatedAt,
        createdBy: item.created_by || item.createdBy,
        updatedBy: item.updated_by || item.updatedBy,
      };
    });
    return guidelines;
  },

  async createInteractionGuideline(payload: InteractionGuidelinePayload): Promise<InteractionGuideline> {
    const res = await apiClient.post<any>(`${BASE_INTERACCIONES}/interaction-guidelines`, payload);
    const item = res.data;
    // Convertir status a número si viene como string
    const statusNum = typeof item.status === 'number' ? item.status : 
      item.status === 'active' ? 1 : 
      item.status === 'inactive' ? 0 : 
      item.status === 'pending' ? 2 : 
      item.status === 'suspended' ? 3 : 1; // Default: Activo
    
    // Asegurar que statusDescription sea siempre una cadena
    let statusDesc = '';
    if (typeof item.status_description === 'string' && item.status_description.trim() !== '') {
      statusDesc = item.status_description;
    } else if (typeof item.statusDescription === 'string' && item.statusDescription.trim() !== '') {
      statusDesc = item.statusDescription;
    } else {
      statusDesc = statusNum === 1 ? 'Activo' : statusNum === 0 ? 'Inactivo' : statusNum === 2 ? 'Pendiente' : 'Suspendido';
    }
    
    return {
      id: item.id,
      commercialProfileId: item.commercial_profile_id || item.commercialProfileId,
      title: item.title,
      description: item.description,
      status: statusNum,
      statusDescription: statusDesc,
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
      createdBy: item.created_by || item.createdBy,
      updatedBy: item.updated_by || item.updatedBy,
    };
  },

  async updateInteractionGuideline(guidelineId: string, payload: Partial<InteractionGuidelinePayload>): Promise<InteractionGuideline> {
    const res = await apiClient.put<any>(`${BASE_INTERACCIONES}/interaction-guidelines/${guidelineId}`, payload);
    const item = res.data;
    // Convertir status a número si viene como string
    const statusNum = typeof item.status === 'number' ? item.status : 
      item.status === 'active' ? 1 : 
      item.status === 'inactive' ? 0 : 
      item.status === 'pending' ? 2 : 
      item.status === 'suspended' ? 3 : 1; // Default: Activo
    
    return {
      id: item.id,
      commercialProfileId: item.commercial_profile_id || item.commercialProfileId,
      title: item.title,
      description: item.description,
        status: statusNum,
        statusDescription: (() => {
          if (typeof item.status_description === 'string' && item.status_description.trim() !== '') {
            return item.status_description;
          }
          if (typeof item.statusDescription === 'string' && item.statusDescription.trim() !== '') {
            return item.statusDescription;
          }
          return statusNum === 1 ? 'Activo' : statusNum === 0 ? 'Inactivo' : statusNum === 2 ? 'Pendiente' : 'Suspendido';
        })(),
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
      createdBy: item.created_by || item.createdBy,
      updatedBy: item.updated_by || item.updatedBy,
    };
  },

  async deleteInteractionGuideline(guidelineId: string): Promise<void> {
    await apiClient.delete(`${BASE_INTERACCIONES}/interaction-guidelines/${guidelineId}`);
  },

  // ===== Recommendations =====
  async getRecommendations(companyId: string): Promise<Recommendation[]> {
    // ❌ CAMBIO V1.0: branchId removido del query parameter
    const params: Record<string, any> = { companyId };
    const endpoint = buildQuery(`${BASE_COMMERCIAL}/recommendations`, params);
    const res = await apiClient.get<any>(endpoint);
    // El apiClient.get devuelve ApiResponse<T> = { data: T, result: {...} }
    // El backend devuelve: { data: { recommendations: [...] }, result: {...} }
    // Entonces res.data = { recommendations: [...] }
    // O puede venir como res.data = [...] directamente
    let recommendationsData: any[] = [];
    
    // Primero verificar si res.data es un array directo
    if (Array.isArray(res.data)) {
      recommendationsData = res.data;
    } 
    // Si res.data es un objeto, buscar recommendations dentro
    else if (res.data && typeof res.data === 'object') {
      // Caso: res.data = { recommendations: [...] }
      if (Array.isArray(res.data.recommendations)) {
        recommendationsData = res.data.recommendations;
      }
      // Caso: res.data = { data: { recommendations: [...] } }
      else if (Array.isArray(res.data.data?.recommendations)) {
        recommendationsData = res.data.data.recommendations;
      }
      // Caso: res.data = { data: [...] }
      else if (Array.isArray(res.data.data)) {
        recommendationsData = res.data.data;
      }
    }
    // Mapear respuesta: el backend ahora devuelve todos los campos (status, statusDescription, campos de administración)
    // Según Postman actualizado: Response incluye id, type, message, order, status, statusDescription, offeringId, createdAt, updatedAt, createdBy, updatedBy
    return (Array.isArray(recommendationsData) ? recommendationsData : []).map((item: any) => ({
      id: item.id,
      companyId: item.company_id || item.companyId || companyId, // Fallback al companyId del parámetro
      offeringId: item.offering_id || item.offeringId || null,
      type: item.type,
      message: item.message,
      order: item.order ?? item.priority ?? 0, // Mapear priority legacy a order si es necesario
      status: item.status ?? (item.is_active !== undefined ? (item.is_active ? 1 : 0) : 1), // Fallback para compatibilidad legacy
      statusDescription: item.status_description || item.statusDescription,
      image: item.image ?? null,
      createdAt: item.created_at || item.createdAt,
      createdBy: item.created_by || item.createdBy,
      updatedAt: item.updated_at || item.updatedAt,
      updatedBy: item.updated_by || item.updatedBy,
    }));
  },

  async createRecommendation(payload: RecommendationPayload): Promise<Recommendation> {
    // ❌ CAMBIO V1.0: branchId, priority, isActive, title, description removidos
    // Campos requeridos: companyId, type, message
    // Campos opcionales: offeringId, order (default: 0)
    // ❌ NO ENVIAR: status (se asigna automáticamente como ACTIVE en el backend)
    const cleanPayload: any = {
      companyId: payload.companyId,
      type: payload.type,
      message: payload.message,
      order: payload.order ?? 0, // Default: 0
    };
    // Solo agregar offeringId si tiene un valor válido (no null, no undefined, no string vacío)
    if (payload.offeringId && typeof payload.offeringId === 'string' && payload.offeringId.trim() !== '') {
      cleanPayload.offeringId = payload.offeringId;
    } else {
      cleanPayload.offeringId = null;
    }
    if (payload.image !== undefined) cleanPayload.image = payload.image;
    const res = await apiClient.post<any>(`${BASE_COMMERCIAL}/recommendations`, cleanPayload);
    // La respuesta puede venir como res.data directamente o como res.data.data
    const item = res.data?.data || res.data;
    // Mapear respuesta: el backend ahora devuelve todos los campos
    return {
      id: item.id,
      companyId: item.company_id || item.companyId || payload.companyId,
      offeringId: item.offering_id || item.offeringId || null,
      type: item.type,
      message: item.message,
      order: item.order ?? item.priority ?? 0, // Mapear priority legacy a order si es necesario
      status: item.status ?? (item.is_active !== undefined ? (item.is_active ? 1 : 0) : 1), // Fallback para compatibilidad legacy
      statusDescription: item.status_description || item.statusDescription,
      image: item.image ?? null,
      createdAt: item.created_at || item.createdAt,
      createdBy: item.created_by || item.createdBy,
      updatedAt: item.updated_at || item.updatedAt,
      updatedBy: item.updated_by || item.updatedBy,
    };
  },

  async updateRecommendation(recommendationId: string, payload: Partial<RecommendationPayload>): Promise<Recommendation> {
    // ❌ CAMBIO V1.0: companyId, branchId, priority, isActive, title, description removidos
    // Campos actualizables: type, message, order, offeringId
    const cleanPayload: any = {};
    if (payload.type !== undefined) cleanPayload.type = payload.type;
    if (payload.message !== undefined) cleanPayload.message = payload.message;
    if (payload.order !== undefined) cleanPayload.order = payload.order;
    if (payload.offeringId !== undefined) cleanPayload.offeringId = payload.offeringId || null;
    if (payload.status !== undefined) cleanPayload.status = payload.status;
    if (payload.image !== undefined) cleanPayload.image = payload.image;
    
    const res = await apiClient.put<any>(`${BASE_COMMERCIAL}/recommendations/${recommendationId}`, cleanPayload);
    // La respuesta puede venir como res.data directamente o como res.data.data
    const item = res.data?.data || res.data;
    // Mapear respuesta: el backend ahora devuelve todos los campos
    return {
      id: item.id,
      companyId: item.company_id || item.companyId,
      offeringId: item.offering_id || item.offeringId || null,
      type: item.type,
      message: item.message,
      order: item.order ?? item.priority ?? 0, // Mapear priority legacy a order si es necesario
      status: item.status ?? (item.is_active !== undefined ? (item.is_active ? 1 : 0) : 1), // Fallback para compatibilidad legacy
      statusDescription: item.status_description || item.statusDescription,
      image: item.image ?? null,
      createdAt: item.created_at || item.createdAt,
      createdBy: item.created_by || item.createdBy,
      updatedAt: item.updated_at || item.updatedAt,
      updatedBy: item.updated_by || item.updatedBy,
    };
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

  // ===== Capabilities =====
  // Nota: getFullContext fue eliminado - usar endpoints específicos en su lugar
  async getCapabilities(companyId: string): Promise<CommercialCapabilities> {
    try {
      const res = await apiClient.get<CommercialCapabilities>(`${BASE_INTERACCIONES}/context/${companyId}/capabilities`);
      return res.data;
    } catch (error: any) {
      // Si el recurso no existe (404), retornar valores por defecto
      // El backend creará el recurso cuando sea necesario
      if (error?.statusCode === 404 || error?.result?.statusCode === 404) {
        return {
          canAnswerAboutBusiness: false,
          canAnswerAboutLocation: false,
          canAnswerAboutPrices: false,
          canAnswerAboutPayment: false,
          canRecommend: false,
          canSuggestProducts: false,
        };
      }
      throw error;
    }
  },

  async updateCapabilities(companyId: string, capabilities: Partial<CommercialCapabilities>): Promise<CommercialCapabilities> {
    // Intentar PUT directamente - si el recurso existe, se actualizará
    // Si el recurso no existe (404), simplemente retornar valores por defecto sin hacer nada más
    // NO hacer GET, NO reintentar, NO causar bucles infinitos
    try {
      const res = await apiClient.put<CommercialCapabilities>(`${BASE_INTERACCIONES}/context/${companyId}/capabilities`, capabilities);
      return res.data;
    } catch (error: any) {
      // Si el recurso no existe (404), retornar valores por defecto y terminar aquí
      // NO hacer GET, NO reintentar, NO causar bucles
      if (error?.statusCode === 404 || error?.result?.statusCode === 404) {
        return {
          canAnswerAboutBusiness: false,
          canAnswerAboutLocation: false,
          canAnswerAboutPrices: false,
          canAnswerAboutPayment: false,
          canRecommend: false,
          canSuggestProducts: false,
          ...capabilities,
        } as CommercialCapabilities;
      }
      // Para otros errores, lanzar el error
      throw error;
    }
  },

  async getLayerProgress(companyId: string): Promise<LayerProgress[]> {
    // Calcular progreso basado en los datos existentes según documento técnico V1.0
    // Usar endpoints específicos en lugar de getFullContext para evitar llamadas innecesarias
    // NO llamar a getCapabilities - calcular capabilities localmente basándose en los datos
    const [profile, offerings, paymentMethods, recommendations] = await Promise.all([
      this.getProfile(companyId).catch(() => null),
      this.getOfferings(companyId).catch(() => []),
      this.getPaymentMethods(companyId).catch(() => []),
      this.getRecommendations(companyId).catch(() => []),
    ]);
    
    // Calcular capabilities localmente basándose en los datos existentes
    // Esto evita llamadas innecesarias al backend cuando el recurso no existe
    const capabilities: CommercialCapabilities = {
      canAnswerAboutBusiness: !!(profile?.businessDescription && profile?.industry),
      canAnswerAboutLocation: !!(profile?.businessDescription && profile?.industry),
      canAnswerAboutPrices: offerings.length > 0,
      canAnswerAboutPayment: paymentMethods.length > 0,
      canRecommend: recommendations.some(r => r.type === 'suggestion' || r.type === 'upsell'),
      canSuggestProducts: recommendations.some(r => r.type === 'suggestion' || r.type === 'upsell'),
    };
    
    const layers: LayerProgress[] = [];
    
    // Capa 1: Contexto Institucional
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
    // Los precios ya vienen incluidos en las ofertas, así que si hay ofertas, hay precios
    const hasOfferings = offerings.length > 0;
    const hasPrices = hasOfferings && offerings.some(o => o.prices && o.prices.length > 0);
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
    
    // Capa 3: Directrices de Interacción (interaction_guidelines)
    // Necesitamos obtener el commercialProfileId del perfil
    const profileId = profile?.companyId || companyId;
    const interactionGuidelines = profile 
      ? await this.getInteractionGuidelines(profileId).catch(() => [])
      : [];
    const hasInteractionGuidelines = interactionGuidelines.length > 0;
    const interactionGuidelinesProgress = hasInteractionGuidelines ? 100 : 0;
    
    layers.push({
      layer: 'interactionGuidelines',
      completed: hasInteractionGuidelines,
      completionPercentage: interactionGuidelinesProgress,
      enabledCapabilities: [], // Las directrices mejoran la interacción pero no activan capacidades específicas
      missingFields: hasInteractionGuidelines ? [] : ['interactionGuidelines'],
      skipped: hasInteractionGuidelines ? false : undefined,
    });
    
    // Capa 4: Pagos (payment_method, payment_account, payment_instruction)
    const hasPaymentMethods = paymentMethods.length > 0;
    // Para verificar cuentas, necesitaríamos cargar los métodos con sus cuentas
    // Por ahora, asumimos que si hay métodos, puede haber cuentas
    const hasPaymentAccounts = hasPaymentMethods; // Simplificado: si hay métodos, puede haber cuentas
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
    const hasRecommendations = recommendations.length > 0;
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
    
    // Capa 6: Conexión WhatsApp (whatsappInstances)
    const whatsappInstances = profile?.whatsappInstances || [];
    const hasWhatsAppInstances = whatsappInstances.length > 0;
    const hasActiveWhatsAppInstances = whatsappInstances.some(inst => inst.isActive);
    // La capa está completada si hay al menos una instancia activa
    const whatsappConnectionComplete = hasActiveWhatsAppInstances;
    const whatsappConnectionProgress = whatsappConnectionComplete ? 100 : (hasWhatsAppInstances ? 50 : 0);
    
    layers.push({
      layer: 'whatsappConnection',
      completed: whatsappConnectionComplete,
      completionPercentage: whatsappConnectionProgress,
      enabledCapabilities: [], // Las instancias de WhatsApp no activan capacidades específicas en el contexto comercial
      missingFields: whatsappConnectionComplete ? [] : ['whatsappInstances'],
    });
    
    return layers;
  },

  // ===== WhatsApp Connection =====
  /** POST /whatsapp/instance/create — Respuesta según doc: success, data.instance, data.qrcode (base64, code). */
  async createWhatsAppInstance(name: string): Promise<WhatsAppCreateResponse> {
    try {
      const res = await apiClient.post<WhatsAppCreateResponse['data']>(
        `/whatsapp/instance/create`,
        { name, data: {} }
      ) as unknown as { success?: boolean; data?: WhatsAppCreateResponse['data']; result?: WhatsAppCreateResponse['result'] };
      // El backend devuelve { success, data, result }; el cliente devuelve el body completo
      return {
        success: res.success ?? res.result?.statusCode === 200,
        data: res.data,
        result: res.result,
      } as WhatsAppCreateResponse;
    } catch (error: any) {
      // 409 = instancia ya creada anteriormente → continuar con el flujo (obtener QR, etc.)
      if (error?.statusCode === 409) {
        return { success: true };
      }
      // Temporal: 500 con "Error al crear la instancia" es un falso positivo (instancia ya existe)
      // Continuar con el flujo en lugar de fallar
      if (
        error?.statusCode === 500 &&
        String(error?.message || '').includes('Error al crear la instancia')
      ) {
        return { success: true };
      }
      throw error;
    }
  },

  /** GET /whatsapp/instance/:whatsapp/qrcode — Acepta forma legacy (qrcode string) o unificada (data.qrcode.base64). */
  async getWhatsAppQRCode(whatsapp: string): Promise<{ qrcode: string }> {
    const res = await apiClient.get<{ data?: { qrcode?: { base64: string } }; qrcode?: string }>(
      `/whatsapp/instance/${whatsapp}/qrcode`
    );
    const data = res.data;
    const base64 = data?.data?.qrcode?.base64 ?? (typeof data?.qrcode === 'string' ? data.qrcode : '');
    return { qrcode: base64 };
  },

  async connectWhatsApp(commercialProfileId: string): Promise<{
    instance?: { instanceName: string; instanceId: string; integration: string; status: string };
    qrcode: { base64: string; code: string };
  }> {
    const res = await apiClient.post<{
      data?: {
        instance?: { instanceName: string; instanceId: string; integration: string; status: string };
        qrcode: { base64: string; code: string };
      };
    }>(`${BASE_INTERACCIONES}/context/whatsapp-connection/${commercialProfileId}`);
    const data = res.data?.data ?? res.data;
    return {
      instance: data?.instance,
      qrcode: data?.qrcode ?? { base64: '', code: '' },
    };
  },

  // ===== WhatsApp Instances Management =====
  async createWhatsAppInstanceInProfile(companyId: string, payload: WhatsAppInstancePayload): Promise<WhatsAppInstance> {
    // Si ya se proporcionó un QR code, usarlo directamente
    let qrCode: string | null = payload.whatsappQR || null;
    
    // Si no hay QR code proporcionado, crear la instancia y obtener el QR
    if (!qrCode) {
      const createResponse = await this.createWhatsAppInstance(payload.whatsapp);
      if (!createResponse.success) {
        throw new Error('Error al crear la instancia de WhatsApp');
      }
      // Usar QR de la respuesta del create si viene (evita llamada extra a getWhatsAppQRCode)
      if (createResponse.data?.qrcode?.base64) {
        qrCode = createResponse.data.qrcode.base64;
      } else {
        try {
          const qrResponse = await this.getWhatsAppQRCode(payload.whatsapp);
          qrCode = qrResponse.qrcode || null;
        } catch (error: any) {
          console.error('Error al obtener QR code:', error);
        }
      }
    } else {
      // Si ya hay QR proporcionado, solo crear la instancia en WhatsApp (puede que ya exista)
      // Esto es para asegurar que la instancia existe antes de guardarla en el perfil
      try {
        await this.createWhatsAppInstance(payload.whatsapp);
      } catch (error: any) {
        // Si falla porque ya existe (409) o es un falso positivo (500), está bien, continuar
        if (error?.statusCode !== 409 && 
            !(error?.statusCode === 500 && String(error?.message || '').includes('Error al crear la instancia'))) {
          console.error('Error al crear instancia de WhatsApp:', error);
        }
      }
    }

    // Actualizar el perfil con la nueva instancia
    const profile = await this.getProfile(companyId);
    const updatedInstances = [
      ...(profile.whatsappInstances || []),
      {
        id: '', // El backend generará el ID
        whatsapp: payload.whatsapp,
        whatsappQR: qrCode,
        isActive: payload.isActive ?? true,
      },
    ];

    const updatedProfile = await this.updateProfile(companyId, {
      whatsappInstances: updatedInstances.map(inst => ({
        whatsapp: inst.whatsapp,
        whatsappQR: inst.whatsappQR,
        isActive: inst.isActive,
      })),
    });

    // Retornar la instancia creada (el backend debería devolverla con ID)
    const createdInstance = updatedProfile.whatsappInstances?.find(
      inst => inst.whatsapp === payload.whatsapp
    );
    if (!createdInstance) {
      throw new Error('Error al crear la instancia');
    }
    return createdInstance;
  },

  async updateWhatsAppInstance(companyId: string, instanceId: string, payload: Partial<WhatsAppInstancePayload>): Promise<WhatsAppInstance> {
    const profile = await this.getProfile(companyId);
    const instances = profile.whatsappInstances || [];
    const instanceIndex = instances.findIndex(inst => inst.id === instanceId);
    
    if (instanceIndex === -1) {
      throw new Error('Instancia no encontrada');
    }

    // Si se está actualizando el QR, obtenerlo
    let qrCode: string | null = instances[instanceIndex].whatsappQR;
    if (payload.whatsapp && payload.whatsapp !== instances[instanceIndex].whatsapp) {
      // Si cambió el whatsapp, obtener nuevo QR
      try {
        const qrResponse = await this.getWhatsAppQRCode(payload.whatsapp);
        qrCode = qrResponse.qrcode || null;
      } catch (error: any) {
        console.error('Error al obtener QR code:', error);
      }
    }

    const updatedInstances = [...instances];
    updatedInstances[instanceIndex] = {
      ...updatedInstances[instanceIndex],
      whatsapp: payload.whatsapp ?? updatedInstances[instanceIndex].whatsapp,
      whatsappQR: qrCode ?? updatedInstances[instanceIndex].whatsappQR,
      isActive: payload.isActive ?? updatedInstances[instanceIndex].isActive,
    };

    const updatedProfile = await this.updateProfile(companyId, {
      whatsappInstances: updatedInstances.map(inst => ({
        whatsapp: inst.whatsapp,
        whatsappQR: inst.whatsappQR,
        isActive: inst.isActive,
      })),
    });

    const updatedInstance = updatedProfile.whatsappInstances?.find(inst => inst.id === instanceId);
    if (!updatedInstance) {
      throw new Error('Error al actualizar la instancia');
    }
    return updatedInstance;
  },

  async deleteWhatsAppInstance(companyId: string, instanceId: string): Promise<void> {
    const profile = await this.getProfile(companyId);
    const instances = (profile.whatsappInstances || []).filter(inst => inst.id !== instanceId);

    await this.updateProfile(companyId, {
      whatsappInstances: instances.map(inst => ({
        whatsapp: inst.whatsapp,
        whatsappQR: inst.whatsappQR,
        isActive: inst.isActive,
      })),
    });
  },

  async toggleWhatsAppInstanceStatus(companyId: string, instanceId: string, isActive: boolean): Promise<WhatsAppInstance> {
    return this.updateWhatsAppInstance(companyId, instanceId, { isActive });
  },

  async regenerateWhatsAppQR(companyId: string, instanceId: string): Promise<WhatsAppInstance> {
    const profile = await this.getProfile(companyId);
    const instance = profile.whatsappInstances?.find(inst => inst.id === instanceId);
    
    if (!instance) {
      throw new Error('Instancia no encontrada');
    }

    // Obtener nuevo QR code
    const qrResponse = await this.getWhatsAppQRCode(instance.whatsapp);
    const qrCode = qrResponse.qrcode || null;

    // Actualizar la instancia con el nuevo QR
    return this.updateWhatsAppInstance(companyId, instanceId, { whatsappQR: qrCode });
  },
};
