/**
 * Servicio para administración de Flujos Configurables
 * Dominio: interacciones — endpoints en /interacciones/flow-templates
 */

import { PaginatedResponse } from "@/src/domains/shared/types";
import { apiClient } from "@/src/infrastructure/api";
import { SUCCESS_STATUS_CODE } from "@/src/infrastructure/api/constants";
import type {
    FlowBehavior,
    FlowBehaviorPayload,
    FlowStageConfig,
    FlowStagePayload,
    FlowTemplate,
    FlowTemplateFilters,
    FlowTemplatePayload,
} from "../types";

export class FlowsService {
  private static readonly BASE = "/interacciones/flow-templates";

  // ─── Templates ───

  static async getTemplates(filters: Partial<FlowTemplateFilters> = {}): Promise<PaginatedResponse<FlowTemplate>> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search?.trim()) params.append("search", filters.search.trim());
    if (typeof filters.status === "number") params.append("status", filters.status.toString());
    const qs = params.toString();
    const response = await apiClient.get<any>(qs ? `${this.BASE}?${qs}` : this.BASE);
    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      const raw = response.data;
      const data = Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
      const meta = raw?.meta || response.meta || { page: filters.page || 1, limit: filters.limit || 10, total: data.length, totalPages: 1, hasNext: false, hasPrev: false };
      return { data, meta };
    }
    throw new Error(response.result?.description || "Error al obtener flujos");
  }

  static async getTemplateById(idOrCode: string): Promise<FlowTemplate> {
    const response = await apiClient.get<any>(`${this.BASE}/${idOrCode}`);
    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) return response.data;
    throw new Error(response.result?.description || "Error al obtener el flujo");
  }

  static async createTemplate(payload: FlowTemplatePayload): Promise<FlowTemplate> {
    const response = await apiClient.post<any>(this.BASE, payload);
    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) return response.data;
    throw new Error(response.result?.description || "Error al crear el flujo");
  }

  static async updateTemplate(id: string, payload: FlowTemplatePayload): Promise<FlowTemplate> {
    const response = await apiClient.put<any>(`${this.BASE}/${id}`, payload);
    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) return response.data;
    throw new Error(response.result?.description || "Error al actualizar el flujo");
  }

  static async deleteTemplate(id: string): Promise<void> {
    const response = await apiClient.delete<any>(`${this.BASE}/${id}`);
    if (response.result?.statusCode !== SUCCESS_STATUS_CODE) throw new Error(response.result?.description || "Error al eliminar el flujo");
  }

  static async getActiveTemplates(): Promise<FlowTemplate[]> {
    const response = await apiClient.get<any>(`${this.BASE}?status=1`);
    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      return Array.isArray(response.data) ? response.data : response.data?.data || response.data?.items || [];
    }
    return [];
  }

  // ─── Stages ───

  static async getStages(templateId: string): Promise<FlowStageConfig[]> {
    const response = await apiClient.get<any>(`${this.BASE}/${templateId}/stages`);
    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) return Array.isArray(response.data) ? response.data : response.data?.data || [];
    throw new Error(response.result?.description || "Error al obtener etapas");
  }

  static async createStage(templateId: string, payload: FlowStagePayload): Promise<FlowStageConfig> {
    const response = await apiClient.post<any>(`${this.BASE}/${templateId}/stages`, payload);
    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) return response.data;
    throw new Error(response.result?.description || "Error al crear la etapa");
  }

  static async updateStage(templateId: string, stageId: string, payload: FlowStagePayload): Promise<FlowStageConfig> {
    const response = await apiClient.put<any>(`${this.BASE}/${templateId}/stages/${stageId}`, payload);
    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) return response.data;
    throw new Error(response.result?.description || "Error al actualizar la etapa");
  }

  static async deleteStage(templateId: string, stageId: string): Promise<void> {
    const response = await apiClient.delete<any>(`${this.BASE}/${templateId}/stages/${stageId}`);
    if (response.result?.statusCode !== SUCCESS_STATUS_CODE) throw new Error(response.result?.description || "Error al eliminar la etapa");
  }

  // ─── Behaviors ───

  static async getBehaviors(): Promise<FlowBehavior[]> {
    const response = await apiClient.get<any>(`${this.BASE}/behaviors`);
    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) return Array.isArray(response.data) ? response.data : response.data?.data || [];
    return [];
  }

  static async getBehaviorById(id: string): Promise<FlowBehavior> {
    const response = await apiClient.get<any>(`${this.BASE}/behaviors/${id}`);
    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) return response.data;
    throw new Error(response.result?.description || "Error al obtener el comportamiento");
  }

  static async updateBehavior(id: string, payload: FlowBehaviorPayload): Promise<FlowBehavior> {
    const response = await apiClient.put<any>(`${this.BASE}/behaviors/${id}`, payload);
    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) return response.data;
    throw new Error(response.result?.description || "Error al actualizar el comportamiento");
  }

  static async createBehavior(payload: FlowBehaviorPayload): Promise<FlowBehavior> {
    const response = await apiClient.post<any>(`${this.BASE}/behaviors`, payload);
    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) return response.data;
    throw new Error(response.result?.description || "Error al crear el comportamiento");
  }

  static async deleteBehavior(id: string): Promise<void> {
    const response = await apiClient.delete<any>(`${this.BASE}/behaviors/${id}`);
    if (response.result?.statusCode !== SUCCESS_STATUS_CODE) throw new Error(response.result?.description || "Error al eliminar el comportamiento");
  }

  // ─── Descarga de flujo n8n ───

  /**
   * Descarga el JSON del workflow n8n con variables de empresa reemplazadas.
   * GET /interacciones/flow-templates/download-flow/:whatsappInstanceId
   * Retorna { filename, content } donde content es Base64.
   */
  static async downloadFlow(whatsappInstanceId: string): Promise<{ filename: string; content: string }> {
    const response = await apiClient.get<any>(`${this.BASE}/download-flow/${whatsappInstanceId}`);
    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      return {
        filename: response.data.filename || "chat-ia-flow.json",
        content: response.data.content || "",
      };
    }
    throw new Error(response.result?.description || "Error al descargar el flujo");
  }
}
