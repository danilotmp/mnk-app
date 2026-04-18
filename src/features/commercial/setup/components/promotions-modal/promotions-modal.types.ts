/**
 * Tipos para el modal de Promociones
 */

export type PromotionScope = "general" | "specific";
export type PromotionDiscountType = "percentage" | "fixed";

export interface Promotion {
  id: string;
  companyId?: string;
  name: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  validFrom?: string;
  validTo?: string | null;
  scope?: PromotionScope;
  status?: number;
  statusDescription?: string;
  offerings?: Array<{ id: string; name: string; code?: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PromotionPayload {
  companyId: string;
  name: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  validFrom: string;
  validTo?: string | null;
  scope?: PromotionScope;
  status?: number;
  offeringIds?: string[];
}

export interface PromotionsModalProps {
  visible: boolean;
  onClose: () => void;
  companyId: string;
  scope: PromotionScope;
  offeringId?: string;
  offeringLabel?: string;
  preloadedPromotions?: Promotion[];
}
