/**
 * Tipos del dominio Commercial
 * Basado en el VVD 1.0 - Modelo de Datos Aprobado
 */

// ===== Commercial Profile =====
export interface CommercialProfile {
  companyId: string;
  businessDescription?: string | null;
  industry?: string | null;
  timezone?: string | null;
  currency?: string | null;
  language?: string | null;
  is24_7?: boolean | null;
  defaultTaxMode?: 'included' | 'excluded' | null;
  allowsBranchPricing?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CommercialProfilePayload {
  companyId: string;
  businessDescription?: string;
  industry?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  is24_7?: boolean;
  defaultTaxMode?: 'included' | 'excluded';
  allowsBranchPricing?: boolean;
}

// ===== Payment Methods =====
export type PaymentMethodType = 'cash' | 'transfer' | 'card' | 'online';

export interface PaymentMethod {
  id: string;
  companyId: string;
  method: PaymentMethodType;
  isActive: boolean;
  accounts?: PaymentAccount[]; // Cuentas del método de pago
  instructions?: PaymentInstruction[]; // Instrucciones del método de pago
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentMethodPayload {
  companyId: string;
  method: PaymentMethodType;
  isActive?: boolean;
}

// ===== Payment Accounts =====
export interface PaymentAccount {
  id: string;
  paymentMethodId: string;
  name?: string | null;
  provider?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  identification?: string | null;
  additionalData?: Record<string, any> | null;
  status: number; // -1: Deleted, 0: Inactive, 1: Active, 2: Pending, 3: Suspended
  statusDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentAccountPayload {
  paymentMethodId: string;
  name?: string;
  provider?: string;
  accountNumber?: string;
  accountHolder?: string;
  identification?: string;
  additionalData?: Record<string, any>;
  status?: number; // -1: Deleted, 0: Inactive, 1: Active, 2: Pending, 3: Suspended
}

// ===== Payment Instructions =====
export type PaymentInstructionType = 'general' | 'account_specific' | 'warning';

export interface PaymentInstruction {
  id: string;
  paymentAccountId?: string | null;
  paymentMethodId: string;
  instructionType: PaymentInstructionType;
  message: string;
  status: number; // -1: Deleted, 0: Inactive, 1: Active, 2: Pending, 3: Suspended
  statusDescription?: string;
  createdAt?: string;
}

export interface PaymentInstructionPayload {
  paymentMethodId: string;
  paymentAccountId?: string | null;
  instructionType: PaymentInstructionType;
  message: string;
  status?: number; // -1: Deleted, 0: Inactive, 1: Active, 2: Pending, 3: Suspended
}

// ===== Offerings =====
export type OfferingType = 'product' | 'service' | 'package';

export interface Offering {
  id: string;
  companyId: string; // Mapeado desde business_context_id en el backend
  name: string;
  description?: string | null;
  code?: string | null;
  type: OfferingType; // ENUM: product, service, package - Campo directo según V1.0
  requiresConditions?: boolean; // Si requiere condiciones (solo para servicios)
  status?: 'active' | 'inactive' | number; // ENUM o número según respuesta
  statusDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  // Metadata opcional para compatibilidad (category, tags pueden ir aquí temporalmente)
  metadata?: Record<string, any> | null;
  // Precios incluidos en la respuesta del endpoint
  prices?: OfferingPrice[];
}

export interface OfferingPayload {
  companyId: string; // El backend mapea esto a business_context_id
  name: string;
  description?: string;
  code?: string;
  type: OfferingType; // REQUERIDO según V1.0: product, service, package
  requiresConditions?: boolean; // Opcional: solo para servicios
  // Metadata opcional para category y tags (puede que el backend lo acepte temporalmente)
  metadata?: Record<string, any>;
}

// ===== Offering Prices =====
export interface OfferingPrice {
  id: string;
  offeringId: string;
  branchId?: string | null;
  basePrice: number;
  taxMode: 'included' | 'excluded';
  validFrom: string; // DATE
  validTo?: string | null; // DATE
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface OfferingPricePayload {
  // ❌ REMOVIDO según V1.0: companyId, currency
  offeringId: string; // REQUERIDO
  branchId?: string | null; // NULL = precio global, NOT NULL = precio por sucursal
  basePrice: number; // REQUERIDO - DECIMAL(12,2)
  taxMode: 'included' | 'excluded'; // REQUERIDO - ENUM
  validFrom: string; // REQUERIDO - DATE formato YYYY-MM-DD
  validTo?: string | null; // Opcional - DATE formato YYYY-MM-DD
}

// ===== Price Adjustments =====
export type PriceAdjustmentType = 'fixed' | 'percentage';

export interface PriceAdjustment {
  id: string;
  offeringPriceId: string;
  paymentMethod: PaymentMethodType;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue: number;
  description?: string | null;
  createdAt?: string;
  createdBy?: string;
}

export interface PriceAdjustmentPayload {
  offeringPriceId: string;
  paymentMethod: PaymentMethodType;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue: number;
  description?: string;
}

// ===== Service Conditions =====
export type ServiceConditionType = 'document' | 'appointment' | 'location' | 'validation';

export interface ServiceCondition {
  id: string;
  offeringId: string;
  conditionType: ServiceConditionType;
  description: string;
  isMandatory: boolean;
  createdAt?: string;
}

export interface ServiceConditionPayload {
  offeringId: string;
  conditionType: ServiceConditionType;
  description: string;
  isMandatory?: boolean;
}

// ===== Offering Composition =====
export interface OfferingComposition {
  id: string;
  packageOfferingId: string; // offering.id donde type = package
  childOfferingId: string; // offering.id del producto/servicio incluido
  quantity: number;
  createdAt?: string;
}

export interface OfferingCompositionPayload {
  packageOfferingId: string;
  childOfferingId: string;
  quantity: number;
}

// ===== Promotions =====
export type PromotionDiscountType = 'percentage' | 'fixed';

export interface Promotion {
  id: string;
  companyId: string; // Mapeado desde business_context_id
  name: string;
  description?: string | null;
  discountType: PromotionDiscountType;
  discountValue: number;
  validFrom: string; // DATE
  validTo?: string | null; // DATE
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PromotionPayload {
  companyId: string;
  name: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  validFrom: string; // DATE formato YYYY-MM-DD
  validTo?: string | null; // DATE formato YYYY-MM-DD
}

// ===== Promotion Offerings =====
export interface PromotionOffering {
  id: string;
  promotionId: string;
  offeringId: string;
}

export interface PromotionOfferingPayload {
  promotionId: string;
  offeringId: string;
}

// ===== Interaction Guidelines =====
export interface InteractionGuideline {
  id: string;
  commercialProfileId: string;
  title: string;
  description: string;
  status: number; // 1=Activo, 0=Inactivo, 2=Pendiente, 3=Suspendido
  statusDescription?: string; // Descripción traducida del estado
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface InteractionGuidelinePayload {
  companyId?: string; // Recomendado: el backend lo convierte automáticamente al commercialProfileId
  commercialProfileId?: string; // Opcional: solo si se conoce el commercialProfileId válido
  title: string;
  description: string;
  status?: number; // 1=Activo, 0=Inactivo, 2=Pendiente, 3=Suspendido
}

// ===== Recommendations =====
export type RecommendationType = 'informational' | 'orientation' | 'suggestion' | 'upsell';

export interface Recommendation {
  id: string;
  companyId: string;
  offeringId?: string | null;
  type: RecommendationType;
  message: string;
  order: number; // Menor = más importante (reemplaza a priority)
  status: number; // -1: Deleted, 0: Inactive, 1: Active, 2: Pending, 3: Suspended
  statusDescription?: string; // Descripción traducida del estado
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface RecommendationPayload {
  companyId: string; // Requerido para crear, no se envía en update
  offeringId?: string | null;
  type: RecommendationType;
  message: string;
  order?: number; // Menor = más importante (default: 0)
  status?: number; // -1: Deleted, 0: Inactive, 1: Active, 2: Pending, 3: Suspended
}

// ===== Context & Capabilities =====
export interface CommercialContext {
  institutional?: {
    company?: any;
    branches?: any[];
    profile?: CommercialProfile;
  };
  operational?: {
    prices?: any[];
    adjustments?: any[];
  };
  payments?: {
    currency?: string;
    methods?: any[];
  };
  recommendations?: Recommendation[];
  capabilities?: CommercialCapabilities;
  settings?: {
    currency?: string;
    timezone?: string;
    language?: string;
  };
}

export interface CommercialCapabilities {
  canAnswerAboutBusiness: boolean;
  canAnswerAboutLocation: boolean;
  canAnswerAboutPrices: boolean;
  canAnswerAboutPayment: boolean;
  canRecommend: boolean;
  canSuggestProducts: boolean;
}

// ===== Layer Progress =====
// Según documento técnico V1.0:
// Capa 0: Identidad y prerrequisitos (Usuario, Empresa, Sucursal)
// Capa 1: Contexto institucional (commercial_profile)
// Capa 2: Contexto operativo/informativo (recommendation: informational, orientation)
// Capa 3: Ofertas (offering, offering_composition, offering_price, price_adjustment, service_condition)
// Capa 4: Promociones (promotion, promotion_offering)
// Capa 5: Pagos (payment_method, payment_account, payment_instruction)
// Capa 6: Recomendaciones y upsell (recommendation: suggestion, upsell)
export interface LayerProgress {
  layer: 'institutional' | 'operational' | 'offerings' | 'interactionGuidelines' | 'payments' | 'recommendations';
  completed: boolean;
  completionPercentage: number;
  enabledCapabilities: string[];
  missingFields?: string[];
  skipped?: boolean; // true si la capa fue omitida sin datos
}
