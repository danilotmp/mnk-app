/**
 * Tipos de dominio para Flujos Configurables
 * Dominio: interacciones (alineado con el backend)
 */

import { BaseEntity, PaginationParams } from "@/src/domains/shared/types";

/** Template de flujo conversacional */
export interface FlowTemplate extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  status: number;
  statusDescription: string;
  stagesCount?: number;
  stages?: FlowStageConfig[];
}

/** Configuración de una etapa dentro de un flujo */
export interface FlowStageConfig {
  id: string;
  flowTemplateId: string;
  behaviorId?: string | null;
  stageCode: string;
  orderIndex: number;
  emoji?: string;
  transitionRules?: Record<string, unknown> | null;
  skipConditions?: Record<string, unknown> | null;
  contextOverride?: Record<string, unknown> | null;
  status: number;
  statusDescription?: string;
}

/** Comportamiento del sistema (catálogo de acciones que el chatbot sabe hacer) */
export interface FlowBehavior {
  id: string;
  behaviorKey: string;
  name: string;
  description?: string;
  callApiName?: string[] | null;
  role: string;
  skipAgent?: boolean;
  guidelineKeys?: string[] | null;
  stageConfig?: Record<string, unknown> | null;
  isSystem: boolean;
  status: number;
  statusDescription?: string;
}

export interface FlowTemplateFilters extends PaginationParams {
  search?: string;
  status?: number;
}

export interface FlowTemplatePayload {
  code?: string;
  name?: string;
  description?: string;
  status?: number;
}

export interface FlowStagePayload {
  stageCode?: string;
  orderIndex?: number;
  behaviorId?: string | null;
  emoji?: string;
  transitionRules?: Record<string, unknown> | null;
  skipConditions?: Record<string, unknown> | null;
  contextOverride?: Record<string, unknown> | null;
  status?: number;
}

export interface FlowBehaviorPayload {
  behaviorKey?: string;
  name?: string;
  description?: string;
  callApiName?: string[] | null;
  role?: string;
  skipAgent?: boolean;
  guidelineKeys?: string[] | null;
  stageConfig?: Record<string, unknown> | null;
  status?: number;
}

/** Comportamientos predefinidos (fallback si el API no responde) */
export const BEHAVIOR_KEYS = [
  { value: "INFO", label: "Información general", description: "Responde consulta sin avanzar" },
  { value: "SEARCH", label: "Búsqueda en catálogo", description: "Busca en catálogo y presenta opciones" },
  { value: "PRESENT", label: "Presentación de detalle", description: "Muestra detalle de lo seleccionado" },
  { value: "COLLECT", label: "Recopilación de datos", description: "Recopila información del usuario" },
  { value: "VALIDATE", label: "Validación", description: "Valida documento o dato" },
  { value: "CONFIRM", label: "Confirmación", description: "Pide confirmación explícita" },
  { value: "CLOSE", label: "Cierre", description: "Cierra el ciclo con resumen" },
] as const;

/** Roles predefinidos */
export const STAGE_ROLES = [
  "RECEPCIONISTA",
  "ASESOR",
  "ASESOR_COMERCIAL",
  "ASISTENTE_VENTAS",
  "CAJERO",
] as const;

/** APIs disponibles para callApiName */
export const AVAILABLE_APIS = [
  { value: "offerings", label: "Obtener Productos", description: "Busca productos/servicios en el catálogo de la empresa" },
  { value: "payments", label: "Pagos", description: "Trae métodos de pago y cuentas bancarias" },
  { value: "recommendations", label: "Recomendaciones", description: "Busca recomendaciones/orientación" },
  { value: "empresa", label: "Contexto empresa", description: "Trae información general de la empresa" },
] as const;
