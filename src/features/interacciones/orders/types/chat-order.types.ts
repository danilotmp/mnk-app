/**
 * Tipos de dominio para Órdenes de Chat IA
 * Dominio: interacciones — endpoint GET /interacciones/dashboard/chat-order-records
 */

import { PaginationMeta } from "@/src/domains/shared/types";

/** Precio dentro del orderPayload */
export interface ChatOrderPrice {
  basePrice: number;
  taxMode?: string;
}

/** Promoción aplicada al producto */
export interface ChatOrderPromotion {
  description?: string;
  promotionPrice?: number;
}

/** Condición del servicio */
export interface ChatOrderCondition {
  description?: string;
  isMandatory?: boolean;
}

/** Producto/servicio seleccionado en la orden */
export interface ChatOrderPayload {
  code?: string;
  name?: string;
  prices?: ChatOrderPrice[];
  promotions?: ChatOrderPromotion[];
  conditions?: ChatOrderCondition[];
}

/** Sucursal seleccionada */
export interface ChatOrderBranch {
  name?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    reference?: string;
    location?: string;
  };
}

/** Detalle del comprobante de pago */
export interface ChatOrderMediaContext {
  banco?: string;
  ordenante?: string;
  beneficiario?: string;
  cuentaOrigen?: string;
  cuentaDestino?: string;
  fecha?: string;
  numeroComprobante?: string;
  monto?: {
    valor?: number;
    moneda?: string;
    texto?: string;
  };
  transferenciaExitosa?: boolean;
  [key: string]: unknown;
}

/** Estado de revisión de la orden */
export type ChatOrderReviewStatus = "PENDING" | "REVIEWED" | "APPROVED" | "REJECTED";

/** Registro de orden de Chat IA */
export interface ChatOrderRecord {
  id: string;
  companyId: string;
  contactId?: string;
  contactName?: string;
  contactPhone?: string;
  status: number;
  orderPayload?: ChatOrderPayload;
  selectedBranch?: ChatOrderBranch;
  confirmationMessageId?: string | null;
  paymentMessageId?: string | null;
  mediaIdentifier?: string | null;
  mediaContextDetails?: ChatOrderMediaContext | null;
  /** Estado de revisión */
  reviewStatus?: ChatOrderReviewStatus | null;
  /** Comentarios del revisor */
  comments?: string | null;
  /** ID del usuario que revisó */
  reviewedBy?: string | null;
  /** Fecha de revisión */
  reviewedAt?: string | null;
  /** ID de la oferta/producto */
  offeringId?: string | null;
  /** Código del producto */
  offeringCode?: string | null;
  /** Nombre del producto */
  offeringName?: string | null;
  /** Monto del pago */
  paymentAmount?: number | null;
  /** Moneda del pago */
  paymentCurrency?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/** Filtros para el listado de órdenes */
export interface ChatOrderFilters {
  companyId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
}

/** Respuesta paginada de órdenes */
export interface ChatOrderPaginatedResponse {
  data: ChatOrderRecord[];
  meta: PaginationMeta;
}
