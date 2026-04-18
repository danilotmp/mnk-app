/**
 * Tipos para el modal de Condiciones
 */

export type ConditionScope = "general" | "specific";

export interface Condition {
  id: string;
  companyId: string;
  description: string;
  isMandatory?: boolean;
  scope?: ConditionScope;
  status?: number;
  statusDescription?: string;
  offerings?: Array<{ id: string; name: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConditionPayload {
  companyId: string;
  description: string;
  isMandatory?: boolean;
  scope?: ConditionScope;
  status?: number;
}

export interface ConditionsModalProps {
  visible: boolean;
  onClose: () => void;
  companyId: string;
  /** "general" = condiciones generales, "specific" = condiciones de oferta */
  scope: ConditionScope;
  /** Si se pasa, permite asociar/desasociar condiciones a la oferta */
  offeringId?: string;
  offeringConditionIds?: string[];
  onOfferingConditionsChange?: (conditionIds: string[]) => void;
  /** Condiciones ya cargadas del offering (para scope=specific, evita llamada extra) */
  preloadedConditions?: Condition[];
  /** Label del offering para mostrar en el subtítulo (código — nombre) */
  offeringLabel?: string;
}
